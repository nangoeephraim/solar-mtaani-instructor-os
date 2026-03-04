import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2, UserPlus, User } from 'lucide-react';
import clsx from 'clsx';
import { SlideshowBackground } from './SlideshowBackground';

export default function LoginPage() {
    const { login, setupAdmin, registerInstructor, checkAdminExists, isLoading, loginError, clearLoginError } = useAuth();

    const [view, setView] = useState<'login' | 'setup' | 'register'>('login');
    const [adminExists, setAdminExists] = useState<boolean | null>(null); // null = loading

    // Standard Auth fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // Only for setup & register

    const [localError, setLocalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const displayError = loginError || localError;

    // Check if admin exists on mount
    useEffect(() => {
        const check = async () => {
            const exists = await checkAdminExists();
            setAdminExists(exists);
        };
        check();
    }, []);

    // Clear errors when typing
    useEffect(() => {
        setLocalError('');
        setRegistrationSuccess(false);
        if (loginError) {
            clearLoginError();
        }
    }, [email, password, name]);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email || !password) {
            setLocalError("Please enter both email and password.");
            return;
        }

        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            setLocalError('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSetup = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!name || !email || !password) {
            setLocalError("Please fill in all fields.");
            return;
        }
        if (password.length < 6) {
            setLocalError("Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            await setupAdmin(name, email, password);
        } catch (err) {
            setLocalError('Setup failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegister = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!name || !email || !password) {
            setLocalError("Please fill in all fields.");
            return;
        }
        if (password.length < 6) {
            setLocalError("Password must be at least 6 characters.");
            return;
        }

        setIsSubmitting(true);
        try {
            const success = await registerInstructor(name, email, password);
            if (success) {
                setRegistrationSuccess(true);
            }
        } catch (err) {
            setLocalError('Registration failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[var(--md-sys-color-background)] overflow-hidden relative">
            <SlideshowBackground />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[420px] bg-white/95 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/50 dark:border-white/10 rounded-[2rem] shadow-2xl dark:shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 mx-4 ring-1 ring-white/50 dark:ring-white/5"
            >
                <AnimatePresence mode="wait">
                    {/* ========== LOGIN VIEW ========== */}
                    {view === 'login' && (
                        <motion.div
                            key="login"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="w-48 h-24 mx-auto mb-2 flex items-center justify-center">
                                    <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-sm" />
                                </div>
                                <p className="text-[var(--md-sys-color-primary)] font-bold text-[10px] tracking-[0.2em] uppercase mb-4">Illuminating Learning</p>
                                <p className="text-slate-500 dark:text-white/60">Sign in to your PRISM account</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-slate-700 dark:text-white/80 text-sm font-medium mb-1">Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail size={18} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                            placeholder="instructor@prism.school"
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-slate-700 dark:text-white/80 text-sm font-medium mb-1">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                        />
                                    </div>
                                </div>

                                {displayError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-500 dark:text-red-400 text-sm font-medium text-center"
                                    >
                                        {displayError}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={!email || !password || isSubmitting}
                                    className="w-full py-4 bg-[var(--md-sys-color-primary)] text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : <>Sign In <ArrowRight size={20} /></>}
                                </button>
                            </form>

                            <div className="mt-6 space-y-2 text-center">
                                {/* Only show "Setup Admin" if no admin exists */}
                                {adminExists === false && (
                                    <button
                                        type="button"
                                        onClick={() => setView('setup')}
                                        className="block w-full text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 text-sm font-medium transition-colors"
                                    >
                                        <ShieldCheck size={14} className="inline mr-1" />
                                        First time? Setup Administrator
                                    </button>
                                )}

                                {/* Show "Join as Instructor" when admin exists */}
                                {adminExists === true && (
                                    <button
                                        type="button"
                                        onClick={() => setView('register')}
                                        className="block w-full text-slate-500 hover:text-[var(--md-sys-color-primary)] dark:text-white/40 dark:hover:text-white text-sm transition-colors"
                                    >
                                        <UserPlus size={14} className="inline mr-1" />
                                        New here? Join as Instructor
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ========== ADMIN SETUP VIEW ========== */}
                    {view === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="w-40 h-20 mx-auto mb-2 flex items-center justify-center">
                                    <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-sm" />
                                </div>
                                <p className="text-[var(--md-sys-color-primary)] font-bold text-[10px] tracking-[0.2em] uppercase mb-2">Illuminating Learning</p>
                                <h1 className="text-xl font-google font-bold text-slate-900 dark:text-white mb-1">Setup Administrator</h1>
                                <p className="text-slate-500 dark:text-white/60 text-sm">Create the root admin account for PRISM.</p>
                            </div>

                            <form onSubmit={handleSetup} className="space-y-4">
                                <div>
                                    <label className="block text-slate-700 dark:text-white/80 text-sm font-medium mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                        placeholder="Dr. Gregory House"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 dark:text-white/80 text-sm font-medium mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                        placeholder="admin@prism.school"
                                    />
                                </div>

                                <div>
                                    <label className="block text-slate-700 dark:text-white/80 text-sm font-medium mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                        placeholder="Minimum 6 characters"
                                    />
                                </div>

                                {displayError && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-500 dark:text-red-400 text-sm font-medium text-center"
                                    >
                                        {displayError}
                                    </motion.p>
                                )}

                                <button
                                    type="submit"
                                    disabled={!name || !email || !password || password.length < 6 || isSubmitting}
                                    className="w-full py-4 mt-2 bg-[var(--md-sys-color-primary)] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Complete Setup'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <button
                                    type="button"
                                    onClick={() => setView('login')}
                                    className="text-slate-500 hover:text-[var(--md-sys-color-primary)] dark:text-white/40 dark:hover:text-white text-sm transition-colors"
                                >
                                    Already have an account? Sign In
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ========== REGISTER (JOIN AS INSTRUCTOR) VIEW ========== */}
                    {view === 'register' && (
                        <motion.div
                            key="register"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="p-8"
                        >
                            <div className="text-center mb-8">
                                <div className="w-40 h-20 mx-auto mb-2 flex items-center justify-center">
                                    <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-sm" />
                                </div>
                                <p className="text-[var(--md-sys-color-primary)] font-bold text-[10px] tracking-[0.2em] uppercase mb-2">Illuminating Learning</p>
                                <h1 className="text-xl font-google font-bold text-slate-900 dark:text-white mb-1">Join PRISM</h1>
                                <p className="text-slate-500 dark:text-white/60 text-sm">Create your instructor account</p>
                            </div>

                            {/* Info notice */}
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl text-amber-800 dark:text-amber-400 text-xs mb-5 flex items-start gap-2">
                                <ShieldCheck size={16} className="flex-shrink-0 mt-0.5" />
                                <p>You'll start with <strong>view-only access</strong>. The administrator will review and grant you full instructor privileges.</p>
                            </div>

                            {registrationSuccess ? (
                                <div className="text-center py-6">
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck size={32} className="text-emerald-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Account Created!</h3>
                                    <p className="text-slate-500 dark:text-white/60 text-sm mb-6">You can now sign in. Ask your administrator to upgrade your access.</p>
                                    <button
                                        type="button"
                                        onClick={() => { setView('login'); setRegistrationSuccess(false); }}
                                        className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-white rounded-xl font-bold hover:shadow-lg transition-all"
                                    >
                                        Go to Sign In
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div>
                                        <label className="block text-slate-700 dark:text-white/80 text-sm font-medium mb-1">Your Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <User size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-700 dark:text-white/80 text-sm font-medium mb-1">Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                                placeholder="instructor@prism.school"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-slate-700 dark:text-white/80 text-sm font-medium mb-1">Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-slate-400" />
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[var(--md-sys-color-primary)] focus:ring-1 focus:ring-[var(--md-sys-color-primary)] transition-all"
                                                placeholder="Minimum 6 characters"
                                                autoComplete="new-password"
                                            />
                                        </div>
                                    </div>

                                    {displayError && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-red-500 dark:text-red-400 text-sm font-medium text-center"
                                        >
                                            {displayError}
                                        </motion.p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={!name || !email || !password || password.length < 6 || isSubmitting}
                                        className="w-full py-4 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> Create Account</>}
                                    </button>
                                </form>
                            )}

                            {!registrationSuccess && (
                                <div className="mt-6 text-center">
                                    <button
                                        type="button"
                                        onClick={() => setView('login')}
                                        className="text-slate-500 hover:text-[var(--md-sys-color-primary)] dark:text-white/40 dark:hover:text-white text-sm transition-colors"
                                    >
                                        Already have an account? Sign In
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
