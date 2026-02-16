import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Lock, UserPlus, ArrowRight, ShieldCheck, Delete, User, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
    const { login, setupAdmin, useInvite, users, isLoading, loginError } = useAuth();
    const [view, setView] = useState<'login' | 'setup' | 'invite'>('login');
    const [pin, setPin] = useState('');
    const [name, setName] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [localError, setLocalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Determines if we show context error or local error
    const displayError = loginError || localError;

    // Determine initial view
    useEffect(() => {
        if (!isLoading && users.length === 0) {
            setView('setup');
        }
    }, [isLoading, users]);

    // Clear errors on input change
    useEffect(() => {
        setLocalError('');
    }, [pin, name, inviteCode]);

    // Auto-submit on 6-digit PIN (login view only)
    useEffect(() => {
        if (view === 'login' && pin.length === 6 && !isSubmitting) {
            handleLogin();
        }
    }, [pin]);

    const handlePinInput = (digit: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + digit);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (pin.length < 4) return;
        setIsSubmitting(true);
        try {
            const success = await login(pin);
            if (!success) {
                // Error is handled by AuthContext (loginError) 
                // but we clear pin for UX
                setPin('');
            }
        } catch (e) {
            setLocalError('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetup = async () => {
        if (!name || pin.length < 4) return;
        setIsSubmitting(true);
        try {
            await setupAdmin(name, pin);
        } catch (e) {
            setLocalError('Setup failed');
            setIsSubmitting(false);
        }
    };

    const handleInvite = async () => {
        if (!inviteCode || !name || pin.length < 4) return;
        setIsSubmitting(true);
        try {
            const success = await useInvite(inviteCode, name, pin);
            if (!success) {
                setLocalError('Invalid or expired invite code');
            }
        } catch (e) {
            setLocalError('Invitation failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const PinPad = () => (
        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto mt-8">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                    key={num}
                    onClick={() => handlePinInput(num.toString())}
                    className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl font-medium transition-all active:scale-95 flex items-center justify-center backdrop-blur-sm"
                >
                    {num}
                </button>
            ))}
            <div />
            <button
                onClick={() => handlePinInput('0')}
                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl font-medium transition-all active:scale-95 flex items-center justify-center backdrop-blur-sm"
            >
                0
            </button>
            <button
                onClick={handleBackspace}
                className="w-16 h-16 rounded-full bg-transparent hover:bg-white/10 text-white/70 transition-all active:scale-95 flex items-center justify-center"
            >
                <Delete size={24} />
            </button>
        </div>
    );

    if (isLoading) return null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 overflow-hidden relative">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden relative z-10 mx-4"
            >
                <AnimatePresence mode="wait">
                    {view === 'login' && (
                        <motion.div
                            key="login"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-gradient-to-tr from-violet-500 to-fuchsia-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <ShieldCheck size={40} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-google font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                            <p className="text-white/60 mb-8">Enter your PIN to access local data</p>

                            {/* PIN Display */}
                            <div className="flex justify-center gap-4 mb-2 h-12">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={clsx(
                                            "w-4 h-4 rounded-full transition-all duration-300",
                                            i < pin.length ? "bg-white scale-110" : "bg-white/20"
                                        )}
                                    />
                                ))}
                            </div>

                            {displayError && (
                                <motion.p
                                    key={displayError} // Re-animate on change
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-300 text-sm font-medium h-6"
                                >
                                    {displayError}
                                </motion.p>
                            )}

                            {!displayError && <div className="h-6" />}

                            <PinPad />

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={handleLogin}
                                    disabled={pin.length < 4 || isSubmitting}
                                    className="w-full py-4 bg-white text-violet-900 rounded-xl font-bold text-lg hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <>Unlock <ArrowRight size={20} /></>}
                                </button>
                            </div>

                            <button
                                onClick={() => setView('invite')}
                                className="mt-6 text-white/40 hover:text-white text-sm transition-colors"
                            >
                                Use Invite Code
                            </button>
                        </motion.div>
                    )}

                    {view === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="p-8"
                        >
                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-google font-bold text-white mb-2">Setup Administrator</h1>
                                <p className="text-white/60 text-sm">Create the first account to secure this device.</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/80 text-sm font-medium mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
                                        placeholder="e.g. Administrator"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 text-sm font-medium mb-1">Create PIN (4-6 digits)</label>
                                    <div className="flex justify-center gap-2 mb-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                        <input
                                            type="password"
                                            value={pin}
                                            readOnly // Use on-screen pad
                                            className="bg-transparent text-white text-center text-2xl font-mono tracking-widest w-full focus:outline-none"
                                            placeholder="••••••"
                                        />
                                    </div>
                                    <PinPad />
                                </div>

                                <button
                                    onClick={handleSetup}
                                    disabled={!name || pin.length < 4 || isSubmitting}
                                    className="w-full py-3 mt-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-violet-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Setting up...' : 'Complete Setup'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {view === 'invite' && (
                        <motion.div
                            key="invite"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="p-8"
                        >
                            <button
                                onClick={() => setView('login')}
                                className="mb-6 text-white/60 hover:text-white flex items-center gap-2 transition-colors"
                            >
                                <ArrowRight size={16} className="rotate-180" /> Back to Login
                            </button>

                            <h1 className="text-2xl font-google font-bold text-white mb-6">New Device Setup</h1>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-white/80 text-sm font-medium mb-1">Invite Code</label>
                                    <input
                                        type="text"
                                        value={inviteCode}
                                        onChange={e => setInviteCode(e.target.value.toUpperCase())}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 font-mono tracking-wider focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all uppercase"
                                        placeholder="PRISM-XXXX-XXXX"
                                    />
                                </div>

                                <div>
                                    <label className="block text-white/80 text-sm font-medium mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/50 transition-all"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="pt-4">
                                    <label className="block text-white/80 text-sm font-medium mb-2 text-center">Set Your PIN</label>
                                    <div className="flex justify-center gap-2 mb-2">
                                        {Array.from({ length: 6 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={clsx(
                                                    "w-3 h-3 rounded-full transition-all duration-300",
                                                    i < pin.length ? "bg-white" : "bg-white/20"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <PinPad />
                                </div>

                                {displayError && <p className="text-red-300 text-sm text-center">{displayError}</p>}

                                <button
                                    onClick={handleInvite}
                                    disabled={!inviteCode || !name || pin.length < 4 || isSubmitting}
                                    className="w-full py-3 mt-4 bg-white text-violet-900 rounded-xl font-bold hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Verifying...' : 'Join Workspace'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
