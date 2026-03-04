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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[var(--md-sys-color-surface)] rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
                >
                    <div className="flex items-center justify-between p-5 border-b border-[var(--md-sys-color-outline)]">
                        <div className="flex items-center gap-3 text-[var(--md-sys-color-primary)]">
                            <Bell size={24} />
                            <h2 className="text-xl font-bold font-google text-[var(--md-sys-color-on-surface)]">
                                Quick Alert
                            </h2>
                        </div>
                        <button onClick={onClose} title="Close" aria-label="Close" className="p-2 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] transition-colors">
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
                                <select
                                    className="w-full bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl px-4 py-3 text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] outline-none"
                                    title="Message Template"
                                    aria-label="Message Template"
                                    value={template}
                                    onChange={(e) => setTemplate(e.target.value)}
                                >
                                    <option value="attendance">Attendance Warning</option>
                                    <option value="fees">Fee Reminder</option>
                                    <option value="performance">Performance Notice</option>
                                    <option value="custom">Custom Message...</option>
                                </select>
                            </div>

                            {template === 'custom' ? (
                                <div>
                                    <label className="block text-sm font-bold text-[var(--md-sys-color-on-surface)] mb-2">Custom Message</label>
                                    <textarea
                                        className="w-full bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline)] rounded-xl px-4 py-3 text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-[var(--md-sys-color-primary)] outline-none min-h-[100px]"
                                        placeholder="Type your alert message here..."
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <div className="p-4 bg-[var(--md-sys-color-primary-container)]/30 border border-[var(--md-sys-color-primary)]/20 rounded-xl">
                                    <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] font-medium">
                                        Preview:
                                    </p>
                                    <p className="text-sm text-[var(--md-sys-color-on-surface)] mt-1">
                                        "{templates[template]}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {statusIndicator === 'success' && (
                            <div className="mt-4 p-3 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm font-medium text-center">
                                Alert sent successfully!
                            </div>
                        )}
                        {statusIndicator === 'error' && (
                            <div className="mt-4 p-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm font-medium text-center">
                                Failed to send alert. Check Edge Function logs.
                            </div>
                        )}
                    </div>

                    <div className="p-5 border-t border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface-variant)]/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all"
                            disabled={isSending}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={isSending || (template === 'custom' && !customMessage.trim())}
                            className="px-6 py-2.5 bg-[#1a73e8] text-white rounded-xl font-bold text-sm shadow-md hover:bg-blue-600 transition-all flex items-center gap-2 disabled:opacity-50"
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
