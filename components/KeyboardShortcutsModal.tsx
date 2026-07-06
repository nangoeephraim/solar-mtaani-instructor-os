import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, HelpCircle, ArrowRight, CornerDownLeft, Sparkles, MessageSquareCode } from 'lucide-react';

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userRole?: string;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose, userRole = 'viewer' }) => {
    const shortcuts = [
        { keys: ['Ctrl', 'K'], desc: 'Open Command Center (Command Palette)', category: 'Global' },
        { keys: ['?'], desc: 'Toggle Keyboard Shortcuts Guide', category: 'Global' },
        { keys: ['Esc'], desc: 'Close open modals, drawers, or suggestions', category: 'Global' },
        
        { keys: ['Alt', '1'], desc: 'Go to Command Center (Dashboard)', category: 'Navigation' },
        { keys: ['Alt', '2'], desc: 'Go to Overview Analytics (Admin Only)', category: 'Navigation', adminOnly: true },
        { keys: ['Alt', '3'], desc: 'Go to Timetable (Schedule)', category: 'Navigation' },
        { keys: ['Alt', '4'], desc: 'Go to Students page', category: 'Navigation' },
        { keys: ['Alt', '5'], desc: 'Go to Attendance roll call', category: 'Navigation' },
        { keys: ['Alt', '6'], desc: 'Go to Curriculum Hub', category: 'Navigation' },
        { keys: ['Alt', '7'], desc: 'Go to Communications tab', category: 'Navigation' },
        { keys: ['Alt', '8'], desc: 'Go to Settings', category: 'Navigation' },

        { keys: ['/'], desc: 'Show Sally AI slash command list (inside chat input)', category: 'Chat & AI' },
        { keys: ['Enter'], desc: 'Send chat message or select command item', category: 'Chat & AI' },
        { keys: ['Swipe Right'], desc: 'Quick reply to any chat message', category: 'Gestures', gesture: true },
        { keys: ['Swipe Left'], desc: 'Quick edit your own messages', category: 'Gestures', gesture: true },
    ];

    const filteredShortcuts = shortcuts.filter(s => {
        if (s.adminOnly && userRole !== 'admin') return false;
        return true;
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200]"
                    />

                    {/* Modal container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ type: "spring", duration: 0.3 }}
                        className="fixed top-[10%] bottom-[10%] lg:top-[15%] lg:bottom-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/50 dark:border-white/10 shadow-2xl z-[201] rounded-3xl overflow-hidden flex flex-col backdrop-blur-xl"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between flex-shrink-0 bg-slate-50/50 dark:bg-slate-950/10">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/10">
                                    <Keyboard size={18} strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-google font-bold text-sm tracking-wide text-slate-950 dark:text-white">Keyboard Shortcuts & Gestures</h3>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Power-user guide to supercharge your PRISM workflow</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Shortcuts List */}
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4 select-none">
                            {['Global', 'Navigation', 'Chat & AI', 'Gestures'].map(cat => {
                                const catItems = filteredShortcuts.filter(s => s.category === cat);
                                if (catItems.length === 0) return null;
                                return (
                                    <div key={cat} className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400/80 mb-2">
                                            {cat}
                                        </h4>
                                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                                            {catItems.map((s, idx) => (
                                                <div key={idx} className="py-2.5 flex items-center justify-between text-xs group">
                                                    <span className="text-slate-650 dark:text-slate-350 font-medium font-google pr-4 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
                                                        {s.desc}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        {s.keys.map((k, kIdx) => (
                                                            <React.Fragment key={kIdx}>
                                                                {kIdx > 0 && <span className="text-[10px] text-slate-400 font-bold font-mono">+</span>}
                                                                <kbd className={`inline-flex items-center justify-center px-2 py-1 rounded text-[10px] font-bold font-mono border shadow-sm ${
                                                                    s.gesture 
                                                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                                                        : "bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10"
                                                                }`}>
                                                                    {k}
                                                                </kbd>
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/10 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between flex-shrink-0">
                            <span className="flex items-center gap-1">
                                Press <kbd className="px-1 bg-slate-200/60 dark:bg-white/10 rounded border border-slate-300/50 dark:border-white/5 text-[9px] font-bold font-mono">?</kbd> again to dismiss
                            </span>
                            <span className="font-semibold text-slate-750 dark:text-slate-300">
                                PRISM OS • TVET Edition
                            </span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
