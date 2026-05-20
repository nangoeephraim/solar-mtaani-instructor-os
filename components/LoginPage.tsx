import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2, UserPlus, User, Sparkles, Shield, Video, BarChart3, GraduationCap, Zap } from 'lucide-react';
import clsx from 'clsx';
import { SlideshowBackground } from './SlideshowBackground';
import WordRotator from './WordRotator';

// Feature badges for the scrolling carousel
const FEATURES = [
  { icon: Video, label: 'Video Meetings' },
  { icon: Sparkles, label: 'AI Insights' },
  { icon: GraduationCap, label: 'NITA Assessment' },
  { icon: BarChart3, label: 'Live Analytics' },
  { icon: Shield, label: 'Role-Based Access' },
  { icon: Zap, label: 'Real-Time Sync' },
];

// Premium input component with glow effect
const PremiumInput: React.FC<{
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon: React.ReactNode;
  label: string;
  autoComplete?: string;
}> = ({ type, value, onChange, placeholder, icon, label, autoComplete }) => (
  <div>
    <label className="block text-slate-600 dark:text-white/70 text-xs font-bold mb-1.5 tracking-wide uppercase">{label}</label>
    <div className="relative input-glow rounded-xl transition-all duration-300">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-white/30">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-400 transition-all text-sm font-medium"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  </div>
);

// Feature carousel component
const FeatureCarousel: React.FC = () => (
  <div className="mt-6 overflow-hidden relative">
    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/95 dark:from-slate-900/90 to-transparent z-10" />
    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/95 dark:from-slate-900/90 to-transparent z-10" />
    <div className="feature-scroll flex items-center gap-6 whitespace-nowrap">
      {[...FEATURES, ...FEATURES].map((f, i) => (
        <div key={i} className="flex items-center gap-1.5 text-slate-400 dark:text-white/30">
          <f.icon size={12} strokeWidth={2.5} />
          <span className="text-[10px] font-bold tracking-wider uppercase">{f.label}</span>
        </div>
      ))}
    </div>
  </div>
);

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

            {/* Premium Gradient Vignette Overlay */}
            <div className="absolute inset-0 login-vignette z-[1]" />

            {/* CSS-Only Floating Particles */}
            <div className="login-particles" />

            {/* Animated Gradient Mesh */}
            <div className="absolute inset-0 z-[1] pointer-events-none opacity-60">
                <div className="absolute top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full bg-indigo-600/10 blur-[120px]" />
                <div className="absolute bottom-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full bg-violet-500/8 blur-[100px]" />
                <div className="absolute top-3/4 left-1/3 w-[40vw] h-[40vw] rounded-full bg-cyan-500/6 blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-[440px] relative z-10 mx-4"
            >
                {/* Premium Animated Border Card */}
                <div className="login-card-premium rounded-[2rem] p-[2px] shadow-2xl shadow-indigo-500/10 dark:shadow-indigo-500/5">
                    <div className="login-card-inner rounded-[calc(2rem-2px)] overflow-hidden backdrop-blur-3xl">
                        <AnimatePresence mode="wait">
                            {/* ========== LOGIN VIEW ========== */}
                            {view === 'login' && (
                                <motion.div
                                    key="login"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="p-8 pb-4"
                                >
                                    {/* Logo & Branding */}
                                    <div className="text-center mb-8">
                                        <motion.div
                                            className="w-48 h-24 mx-auto mb-3 flex items-center justify-center"
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: 0.1, duration: 0.5 }}
                                        >
                                            <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-lg" />
                                        </motion.div>
                                        <motion.p
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-indigo-500 dark:text-indigo-400 font-black text-[10px] tracking-[0.25em] uppercase mb-4"
                                        >
                                            Illuminating Learning
                                        </motion.p>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-slate-500 dark:text-white/50 text-sm"
                                        >
                                            Sign in to your PRISM workspace
                                        </motion.p>
                                    </div>

                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <PremiumInput
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="instructor@prism.school"
                                            icon={<Mail size={16} />}
                                            label="Email"
                                            autoComplete="email"
                                        />
                                        <PremiumInput
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            icon={<Lock size={16} />}
                                            label="Password"
                                            autoComplete="current-password"
                                        />

                                        {displayError && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm font-semibold bg-red-50 dark:bg-red-900/15 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-900/30"
                                            >
                                                <ShieldCheck size={14} />
                                                {displayError}
                                            </motion.div>
                                        )}

                                        <motion.button
                                            type="submit"
                                            disabled={!email || !password || isSubmitting}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            className="w-full py-4 btn-cta-premium text-white rounded-xl font-bold text-base tracking-wide disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5 mt-2 shadow-lg shadow-indigo-500/20"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} strokeWidth={2.5} /></>}
                                        </motion.button>
                                    </form>

                                    {/* Secure Connection Indicator */}
                                    <div className="flex items-center justify-center gap-1.5 mt-4 secure-indicator">
                                        <Shield size={10} className="text-emerald-500" />
                                        <span className="text-[9px] font-bold tracking-wider uppercase text-slate-400 dark:text-white/30">End-to-end encrypted</span>
                                    </div>

                                    <div className="mt-5 space-y-2 text-center">
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
                                                className="block w-full text-slate-500 hover:text-indigo-500 dark:text-white/40 dark:hover:text-white text-sm transition-colors font-medium"
                                            >
                                                <UserPlus size={14} className="inline mr-1" />
                                                New here? Join as Instructor
                                            </button>
                                        )}
                                    </div>

                                    {/* Feature Carousel */}
                                    <FeatureCarousel />
                                </motion.div>
                            )}

                            {/* ========== ADMIN SETUP VIEW ========== */}
                            {view === 'setup' && (
                                <motion.div
                                    key="setup"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="p-8 pb-4"
                                >
                                    <div className="text-center mb-8">
                                        <div className="w-40 h-20 mx-auto mb-2 flex items-center justify-center">
                                            <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-lg" />
                                        </div>
                                        <p className="text-indigo-500 dark:text-indigo-400 font-black text-[10px] tracking-[0.25em] uppercase mb-2">Illuminating Learning</p>
                                        <h1 className="text-xl font-google font-bold text-slate-900 dark:text-white mb-1">Setup Administrator</h1>
                                        <p className="text-slate-500 dark:text-white/50 text-sm">Create the root admin account for PRISM.</p>
                                    </div>

                                    <form onSubmit={handleSetup} className="space-y-4">
                                        <PremiumInput type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Dr. Gregory House" icon={<User size={16} />} label="Your Name" />
                                        <PremiumInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@prism.school" icon={<Mail size={16} />} label="Email" autoComplete="email" />
                                        <PremiumInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" icon={<Lock size={16} />} label="Password" />

                                        {displayError && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm font-semibold bg-red-50 dark:bg-red-900/15 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-900/30">
                                                <ShieldCheck size={14} />{displayError}
                                            </motion.div>
                                        )}

                                        <button type="submit" disabled={!name || !email || !password || password.length < 6 || isSubmitting} className="w-full py-4 mt-2 btn-cta-premium text-white rounded-xl font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Complete Setup'}
                                        </button>
                                    </form>

                                    <div className="mt-6 text-center">
                                        <button type="button" onClick={() => setView('login')} className="text-slate-500 hover:text-indigo-500 dark:text-white/40 dark:hover:text-white text-sm transition-colors font-medium">
                                            Already have an account? Sign In
                                        </button>
                                    </div>
                                    <FeatureCarousel />
                                </motion.div>
                            )}

                            {/* ========== REGISTER (JOIN AS INSTRUCTOR) VIEW ========== */}
                            {view === 'register' && (
                                <motion.div
                                    key="register"
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    className="p-8 pb-4"
                                >
                                    <div className="text-center mb-6">
                                        <div className="w-40 h-20 mx-auto mb-2 flex items-center justify-center">
                                            <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-lg" />
                                        </div>
                                        <p className="text-indigo-500 dark:text-indigo-400 font-black text-[10px] tracking-[0.25em] uppercase mb-2">Illuminating Learning</p>
                                        <h1 className="text-xl font-google font-bold text-slate-900 dark:text-white mb-1">Join PRISM</h1>
                                        <p className="text-slate-500 dark:text-white/50 text-sm">Create your instructor account</p>
                                    </div>

                                    {/* Info notice */}
                                    <div className="glassmorphic-card-premium relative overflow-hidden p-4 rounded-2xl text-slate-700 dark:text-white/80 text-xs mb-5 flex items-start gap-3 backdrop-blur-md shadow-lg shadow-indigo-500/5 dark:shadow-black/20 border border-slate-200/50 dark:border-white/10">
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-30 dark:opacity-20 animate-pulse pointer-events-none" />
                                        <div className="relative z-10 w-8 h-8 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 shadow-inner">
                                            <ShieldCheck size={18} className="animate-pulse" />
                                        </div>
                                        <div className="relative z-10 flex-1 leading-relaxed">
                                            <p className="font-bold text-slate-800 dark:text-white mb-0.5 flex items-center gap-1.5">
                                                <span>Instructor Notice</span>
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                                            </p>
                                            <div className="text-slate-500 dark:text-white/60 h-4 overflow-hidden flex items-center">
                                                <WordRotator 
                                                    words={[
                                                        "Starts as view-only access...",
                                                        "Requires administrator verification...",
                                                        "Secured via end-to-end encryption..."
                                                    ]} 
                                                    className="font-medium text-indigo-600/90 dark:text-indigo-400"
                                                    intervalMs={3500}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {registrationSuccess ? (
                                        <motion.div className="text-center py-6" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <ShieldCheck size={32} className="text-emerald-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Account Created!</h3>
                                            <p className="text-slate-500 dark:text-white/60 text-sm mb-6">You can now sign in. Ask your administrator to upgrade your access.</p>
                                            <button type="button" onClick={() => { setView('login'); setRegistrationSuccess(false); }} className="px-6 py-3 btn-cta-premium text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20">
                                                Go to Sign In
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleRegister} className="space-y-4">
                                            <PremiumInput type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" icon={<User size={16} />} label="Your Name" />
                                            <PremiumInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="instructor@prism.school" icon={<Mail size={16} />} label="Email" autoComplete="email" />
                                            <PremiumInput type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" icon={<Lock size={16} />} label="Password" autoComplete="new-password" />

                                            {displayError && (
                                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-red-500 dark:text-red-400 text-sm font-semibold bg-red-50 dark:bg-red-900/15 px-4 py-2.5 rounded-xl border border-red-100 dark:border-red-900/30">
                                                    <ShieldCheck size={14} />{displayError}
                                                </motion.div>
                                            )}

                                            <button type="submit" disabled={!name || !email || !password || password.length < 6 || isSubmitting} className="w-full py-4 mt-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                                                {isSubmitting ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> Create Account</>}
                                            </button>
                                        </form>
                                    )}

                                    {!registrationSuccess && (
                                        <div className="mt-6 text-center">
                                            <button type="button" onClick={() => setView('login')} className="text-slate-500 hover:text-indigo-500 dark:text-white/40 dark:hover:text-white text-sm transition-colors font-medium">
                                                Already have an account? Sign In
                                            </button>
                                        </div>
                                    )}
                                    <FeatureCarousel />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
