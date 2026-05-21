import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bell, Phone } from 'lucide-react';
import { Student } from '../../types';
import { notificationService } from '../../services/notificationService';

interface QuickAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student;
}

export const QuickAlertModal: React.FC<QuickAlertModalProps> = ({ isOpen, onClose, student }) => {
    const [template, setTemplate] = useState('attendance');
    const [customMessage, setCustomMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [statusIndicator, setStatusIndicator] = useState<'idle' | 'success' | 'error'>('idle');

    const templates: Record<string, string> = {
        attendance: `Alert: ${student.name}'s attendance has dropped below 75%. Please ensure they attend the next class.`,
        fees: `Reminder: Outstanding fee balance for ${student.name}. Please settle to avoid disruption.`,
        performance: `Notice: ${student.name} may require extra tutoring in recent topics. Please review their profile.`,
        custom: customMessage,
    };

    const handleSend = async () => {
        setIsSending(true);
        setStatusIndicator('idle');

        const bodyText = template === 'custom' ? customMessage : templates[template];

        try {
            const success = await notificationService.sendRemoteNotification({
                userId: student.id.toString(),
                title: 'Instructor Alert',
                body: bodyText,
                type: 'push' // Could be 'sms' if Africa's Talking was fully configured
            });

            if (success) {
                setStatusIndicator('success');
                setTimeout(() => {
                    onClose();
                    setStatusIndicator('idle');
                    setTemplate('attendance');
                    setCustomMessage('');
                }, 1500);
            } else {
                setStatusIndicator('error');
            }
        } catch (error) {
            setStatusIndicator('error');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="glass-panel w-full max-w-md overflow-hidden flex flex-col shadow-2xl border border-white/10"
                >
                    <div className="flex items-center justify-between p-5 border-b border-[var(--md-sys-color-outline)]/20">
                        <div className="flex items-center gap-3 text-[var(--md-sys-color-primary)]">
                            <Bell size={24} />
                            <h2 className="text-xl font-bold font-google text-[var(--md-sys-color-on-surface)]">
                                Quick Alert
                            </h2>
                        </div>
                        <button onClick={onClose} title="Close" aria-label="Close" className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)]/40 text-[var(--md-sys-color-on-surface-variant)] transition-all active:scale-90">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto">
                        <p className="text-sm text-[var(--md-sys-color-secondary)] mb-6">
                            Send an immediate notification regarding <strong>{student.name}</strong>. This triggers the Supabase Edge Function.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-2">Message Template</label>
                                <div className="input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]/30 px-3 py-1.5 backdrop-blur-sm relative">
                                    <select
                                        className="w-full bg-transparent border-none text-[var(--md-sys-color-on-surface)] focus:outline-none py-1.5 text-sm"
                                        title="Message Template"
                                        aria-label="Message Template"
                                        value={template}
                                        onChange={(e) => setTemplate(e.target.value)}
                                    >
                                        <option value="attendance" className="bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">Attendance Warning</option>
                                        <option value="fees" className="bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">Fee Reminder</option>
                                        <option value="performance" className="bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">Performance Notice</option>
                                        <option value="custom" className="bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]">Custom Message...</option>
                                    </select>
                                </div>
                            </div>

                            {template === 'custom' ? (
                                <div>
                                    <label className="block text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-2">Custom Message</label>
                                    <div className="input-glow rounded-xl border border-[var(--md-sys-color-outline)] transition-all bg-[var(--md-sys-color-surface-variant)]/30 px-4 py-3 backdrop-blur-sm relative">
                                        <textarea
                                            className="w-full bg-transparent border-none text-[var(--md-sys-color-on-surface)] focus:outline-none min-h-[100px] resize-none text-sm"
                                            placeholder="Type your alert message here..."
                                            value={customMessage}
                                            onChange={(e) => setCustomMessage(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 glass-card border border-[var(--md-sys-color-primary)]/10">
                                    <p className="text-xs font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider mb-1">
                                        Preview
                                    </p>
                                    <p className="text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed italic">
                                        "{templates[template]}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {statusIndicator === 'success' && (
                            <div className="mt-4 p-3 bg-green-50/50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-500/20 rounded-lg text-sm font-medium text-center">
                                Alert sent successfully!
                            </div>
                        )}
                        {statusIndicator === 'error' && (
                            <div className="mt-4 p-3 bg-red-50/50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-500/20 rounded-lg text-sm font-medium text-center">
                                Failed to send alert. Check Edge Function logs.
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-[var(--md-sys-color-outline)]/20 bg-[var(--md-sys-color-surface-variant)]/20 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)]/40 active:scale-95 transition-all"
                            disabled={isSending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending || (template === 'custom' && !customMessage.trim())}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} /> Send Alert
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
