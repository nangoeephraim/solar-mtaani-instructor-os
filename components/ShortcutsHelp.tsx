import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const SHORTCUTS = [
    { key: 'Shift + ?', description: 'Show keyboard shortcuts' },
    { key: 'Alt + 1', description: 'Go to Dashboard' },
    { key: 'Alt + 2', description: 'Go to Analytics' },
    { key: 'Alt + 3', description: 'Go to Schedule' },
    { key: 'Alt + 4', description: 'Go to Students' },
    { key: 'Alt + 5', description: 'Go to Settings' },
    { key: 'Esc', description: 'Close modals' },
];

export const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md bg-[var(--md-sys-color-surface)] rounded-2xl shadow-2xl border border-[var(--md-sys-color-outline)] overflow-hidden"
                    >
                        <div className="p-6 border-b border-[var(--md-sys-color-outline)] flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--md-sys-color-primary-container)] rounded-lg text-[var(--md-sys-color-primary)]">
                                    <Keyboard size={20} />
                                </div>
                                <h2 className="text-lg font-bold font-google text-[var(--md-sys-color-on-surface)]">Keyboard Shortcuts</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--md-sys-color-surface-variant)] rounded-full transition-colors text-[var(--md-sys-color-on-surface-variant)]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-2">
                            {SHORTCUTS.map((shortcut, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 hover:bg-[var(--md-sys-color-surface-variant)] rounded-lg transition-colors group"
                                >
                                    <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)] group-hover:text-[var(--md-sys-color-primary)] transition-colors">
                                        {shortcut.description}
                                    </span>
                                    <span className="px-2 py-1 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded text-xs font-bold font-mono text-[var(--md-sys-color-on-surface-variant)] group-hover:bg-[var(--md-sys-color-surface)] group-hover:shadow-sm transition-all">
                                        {shortcut.key}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]/30 text-center">
                            <p className="text-xs text-[var(--md-sys-color-secondary)]">
                                Press specific keys to navigate quickly between views.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
