import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, CheckCircle2, History, Smartphone, Loader2 } from 'lucide-react';
import { Student } from '../../types';
import { supabase } from '../../services/supabase';

interface BillingTabProps {
    student: Student;
}

export const BillingTab: React.FC<BillingTabProps> = ({ student }) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [promptStatus, setPromptStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [amount, setAmount] = useState('500');
    // Using the exact test number requested by the user
    const [phone] = useState('0768453314');

    const handleSimulatePayment = async () => {
        setIsSimulating(true);
        setPromptStatus('idle');

        try {
            // In a real app, you would call `supabase.functions.invoke('mpesa-stk-push', { body: { phone, amount } })`
            // For now, we simulate hitting the M-Pesa webhook successfully and updating the DB or just testing the connection.
            const { data, error } = await supabase.functions.invoke('mpesa-webhook', {
                body: {
                    Body: {
                        stkCallback: {
                            MerchantRequestID: "12345-Simulated",
                            CheckoutRequestID: `ws_CO_${Date.now()}`,
                            ResultCode: 0,
                            ResultDesc: "The service request is processed successfully.",
                            CallbackMetadata: {
                                Item: [
                                    { Name: "Amount", Value: Number(amount) },
                                    { Name: "MpesaReceiptNumber", Value: "TEST" + Math.floor(Math.random() * 100000) },
                                    { Name: "PhoneNumber", Value: Number(phone) }
                                ]
                            }
                        }
                    }
                }
            });

            if (error) {
                console.error("Webhook simulation failed:", error);
                setPromptStatus('error');
            } else {
                setPromptStatus('success');
                setTimeout(() => setPromptStatus('idle'), 4000);
            }
        } catch (err) {
            console.error("Error triggering simulation", err);
            setPromptStatus('error');
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col gap-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">

                {/* Balance Card */}
                <div className="bg-[var(--md-sys-color-surface-variant)]/30 border border-[var(--md-sys-color-outline)] rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 text-[var(--md-sys-color-primary)]">
                        <CreditCard size={100} />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-widest mb-2">
                        Outstanding Balance
                    </h3>
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-black font-google tracking-tight text-[var(--md-sys-color-on-surface)]">
                            KES <span className="text-red-500">2,400</span>
                        </span>
                    </div>
                    <p className="text-sm text-[var(--md-sys-color-secondary)]">Current Term: Q3 2026</p>
                </div>

                {/* M-Pesa STK Simulator Card */}
                <div className="bg-[var(--md-sys-color-surface)] border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 shadow-sm shadow-emerald-100 dark:shadow-none">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">Simulate M-Pesa Payment</h3>
                            <p className="text-xs text-[var(--md-sys-color-secondary)]">Send push to test recipient</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-[var(--md-sys-color-secondary)] mb-1 uppercase tracking-wider">Test Phone</label>
                                <input
                                    type="text"
                                    value={phone}
                                    disabled
                                    className="w-full bg-[var(--md-sys-color-surface-variant)]/50 border border-[var(--md-sys-color-outline)] rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--md-sys-color-on-surface)] opacity-70"
                                />
                            </div>
                            <div className="flex-[0.5]">
                                <label className="block text-xs font-bold text-[var(--md-sys-color-secondary)] mb-1 uppercase tracking-wider">Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full bg-[var(--md-sys-color-surface)] border border-emerald-300 dark:border-emerald-800 rounded-xl px-4 py-2.5 text-sm font-bold text-[var(--md-sys-color-on-surface)] focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSimulatePayment}
                            disabled={isSimulating}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                        >
                            {isSimulating ? (
                                <><Loader2 size={18} className="animate-spin" /> Pinging Webhook...</>
                            ) : (
                                "Send Test Payment Prompt"
                            )}
                        </button>

                        {promptStatus === 'success' && (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
                                <CheckCircle2 size={16} />
                                STK Push simulated successfully to Edge Function!
                            </div>
                        )}
                        {promptStatus === 'error' && (
                            <div className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                Webhook call failed. Edge Function returned an error (likely invalid JWT in simulation). See console.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Payment History Stub */}
            <div className="flex-1 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <History className="text-[var(--md-sys-color-secondary)]" size={20} />
                        <h3 className="font-bold text-[var(--md-sys-color-on-surface)]">Recent Transactions</h3>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 bg-[var(--md-sys-color-surface-variant)] rounded-full flex items-center justify-center mb-3">
                        <CreditCard size={24} className="text-[var(--md-sys-color-secondary)] opacity-50" />
                    </div>
                    <p className="font-bold text-[var(--md-sys-color-on-surface)] mb-1">No payment history yet</p>
                    <p className="text-sm text-[var(--md-sys-color-secondary)] max-w-xs">
                        When M-Pesa integration goes live, DARaja callbacks received by the <code>mpesa-webhook</code> edge function will appear here.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
