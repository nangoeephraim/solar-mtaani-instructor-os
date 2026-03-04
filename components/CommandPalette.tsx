import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Calendar, Users, ClipboardCheck, Settings, BarChart3, UserCheck, LineChart, Box, Moon, Sun, Monitor, LogOut, ChevronRight, User } from 'lucide-react';
import clsx from 'clsx';
import { AppData, Student, Resource } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface CommandPaletteProps {
    data: AppData | null;
    onNavigate: (view: string, id?: number) => void;
    onClose?: () => void; // Optional callback if we want to close it externally
}

type CommandItemType = 'navigation' | 'action' | 'student' | 'resource';

interface CommandItem {
    id: string;
    type: CommandItemType;
    label: string;
    description?: string;
    icon: React.ElementType;
    action: () => void;
    keywords?: string[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ data, onNavigate, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const { preferences, setPreference } = useTheme();
    const isDark = preferences.theme === 'dark';

    const toggleTheme = () => {
        setPreference('theme', isDark ? 'light' : 'dark');
    };

    // Toggle open/close with keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            onClose?.();
        }
    }, [isOpen, onClose]);

    const items: CommandItem[] = useMemo(() => {
        const baseItems: CommandItem[] = [
            // Navigation
            { id: 'nav-dashboard', type: 'navigation', label: 'Command Center', icon: LayoutDashboard, action: () => onNavigate('dashboard'), keywords: ['home', 'main'] },
            { id: 'nav-schedule', type: 'navigation', label: 'Timetable', icon: Calendar, action: () => onNavigate('schedule'), keywords: ['calendar', 'classes'] },
            { id: 'nav-students', type: 'navigation', label: 'Students', icon: Users, action: () => onNavigate('students-manage'), keywords: ['pupils', 'learners'] },
            { id: 'nav-attendance', type: 'navigation', label: 'Attendance', icon: UserCheck, action: () => onNavigate('attendance'), keywords: ['roll call', 'present'] },
            { id: 'nav-analytics', type: 'navigation', label: 'Analytics', icon: BarChart3, action: () => onNavigate('analytics'), keywords: ['stats', 'overview'] },
            { id: 'nav-resources', type: 'navigation', label: 'Resources', icon: Box, action: () => onNavigate('resources'), keywords: ['equipment', 'inventory'] },
            { id: 'nav-settings', type: 'navigation', label: 'Settings', icon: Settings, action: () => onNavigate('settings'), keywords: ['config', 'theme'] },

            // Actions
            { id: 'act-theme', type: 'action', label: `Switch to ${isDark ? 'Light' : 'Dark'} Mode`, icon: isDark ? Sun : Moon, action: toggleTheme, keywords: ['color', 'mode'] },
        ];

        // Add Students
        if (data?.students) {
            data.students.forEach(student => {
                baseItems.push({
                    id: `stu-${student.id}`,
                    type: 'student',
                    label: student.name,
                    description: `Grade ${student.grade} • ${student.subject}`,
                    icon: User,
                    action: () => onNavigate('student-profile', student.id),
                    keywords: [student.admissionNumber || '', student.lot]
                });
            });
        }

        // Add Resources
        if (data?.resources) {
            data.resources.forEach(resource => {
                baseItems.push({
                    id: `res-${resource.id}`,
                    type: 'resource',
                    label: resource.name,
                    description: resource.type,
                    icon: resource.type === 'room' ? LayoutDashboard : resource.type === 'equipment' ? Monitor : Box,
                    action: () => onNavigate('resources'), // We could deep link if supported
                    keywords: [resource.location || '', resource.type]
                });
            });
        }

        return baseItems;
    }, [data, onNavigate, isDark]);

    // Filter items based on query
    const filteredItems = useMemo(() => {
        if (!query) return items.slice(0, 8); // Show simplified list initially

        const lowerQuery = query.toLowerCase();
        return items.filter(item => {
            const matchLabel = item.label.toLowerCase().includes(lowerQuery);
            const matchDesc = item.description?.toLowerCase().includes(lowerQuery);
            const matchKey = item.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
            return matchLabel || matchDesc || matchKey;
        }).slice(0, 15); // Limit results
    }, [items, query]);

    // Handle keyboard navigation inside the list
    useEffect(() => {
        const handleListNav = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % filteredItems.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    filteredItems[selectedIndex].action();
                    setIsOpen(false);
                }
            }
        };

        window.addEventListener('keydown', handleListNav);
        return () => window.removeEventListener('keydown', handleListNav);
    }, [isOpen, filteredItems, selectedIndex]);

    // Adjust selected index if list shrinks
    useEffect(() => {
        if (selectedIndex >= filteredItems.length) {
            setSelectedIndex(0);
        }
    }, [filteredItems, selectedIndex]);

    // Scroll into view
    useEffect(() => {
        if (listRef.current) {
            const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl border border-[var(--md-sys-color-outline)] z-[101] overflow-hidden flex flex-col max-h-[60vh]"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--md-sys-color-outline)]">
                            <Search size={20} className="text-[var(--md-sys-color-secondary)]" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Type a command or search..."
                                value={query}
                                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                                className="flex-1 bg-transparent text-lg text-[var(--md-sys-color-on-surface)] placeholder-[var(--md-sys-color-secondary)] outline-none"
                            />
                            <div className="flex gap-2">
                                <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] rounded text-xs font-bold font-mono">
                                    ESC
                                </kbd>
                            </div>
                        </div>

                        {/* List */}
                        <div ref={listRef} className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                            {filteredItems.length === 0 ? (
                                <div className="p-8 text-center text-[var(--md-sys-color-secondary)]">
                                    <p>No results found for "{query}"</p>
                                </div>
                            ) : (
                                filteredItems.map((item, index) => (
                                    <motion.button
                                        key={item.id}
                                        layout
                                        onClick={() => { item.action(); setIsOpen(false); }}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={clsx(
                                            "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-colors text-left group",
                                            index === selectedIndex
                                                ? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                                                : "text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)]"
                                        )}
                                    >
                                        <div className={clsx(
                                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                            index === selectedIndex
                                                ? "bg-[var(--md-sys-color-primary)] text-white"
                                                : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)]"
                                        )}>
                                            <item.icon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className={clsx("font-medium truncate", index === selectedIndex && "font-bold")}>
                                                    {item.label}
                                                </span>
                                                {item.type !== 'navigation' && item.type !== 'action' && (
                                                    <span className={clsx(
                                                        "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                                        index === selectedIndex
                                                            ? "bg-white/20 text-white"
                                                            : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] border border-[var(--md-sys-color-outline)]"
                                                    )}>
                                                        {item.type}
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className={clsx(
                                                    "text-xs truncate transition-opacity",
                                                    index === selectedIndex ? "opacity-90" : "text-[var(--md-sys-color-secondary)]"
                                                )}>
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        {index === selectedIndex && (
                                            <ChevronRight size={16} className="opacity-50" />
                                        )}
                                    </motion.button>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-2 border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)] flex items-center justify-between text-[10px] text-[var(--md-sys-color-secondary)]">
                            <div className="flex gap-4">
                                <span><strong className="font-bold">↑↓</strong> to navigate</span>
                                <span><strong className="font-bold">↵</strong> to select</span>
                            </div>
                            <span>
                                PRISM Command
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
