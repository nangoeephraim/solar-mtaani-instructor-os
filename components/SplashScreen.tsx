import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const STAGES = [
    'Connecting to PRISM...',
    'Loading your workspace...',
    'Almost ready...',
];

export const SplashScreen: React.FC = () => {
    const [stageIndex, setStageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1));
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'var(--md-sys-color-background)' }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
        >
            {/* Subtle background gradient mesh */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/3 -left-1/4 w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px]" />
                <div className="absolute bottom-1/3 -right-1/4 w-[40vw] h-[40vw] rounded-full bg-violet-500/8 blur-[100px]" />
            </div>

            <div className="flex flex-col items-center relative z-10">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.8,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative"
                >
                    {/* Logo Container */}
                    <div className="w-64 h-32 mx-auto flex items-center justify-center mb-2 relative z-10">
                        <img src="/logo.png" alt="PRISM Logo" className="w-full h-full object-contain drop-shadow-xl" />
                    </div>

                    {/* Prism Light Refraction Effect */}
                    <motion.div
                        className="absolute -inset-4 prism-glow rounded-3xl -z-10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.6, 0.3, 0.6, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Pulse Effect */}
                    <motion.div
                        className="absolute inset-0 bg-[var(--md-sys-color-primary)] rounded-2xl -z-20"
                        animate={{
                            scale: [1, 1.3, 1.3],
                            opacity: [0.15, 0, 0]
                        }}
                        transition={{
                            duration: 2.5,
                            ease: "easeOut",
                            repeat: Infinity,
                            repeatDelay: 0.5
                        }}
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex flex-col items-center gap-4"
                >
                    {/* Progress bar */}
                    <div className="h-1 w-40 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--md-sys-color-outline)' }}>
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, var(--md-sys-color-primary), #a78bfa, var(--md-sys-color-primary))' }}
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut"
                            }}
                        />
                    </div>

                    {/* Tagline */}
                    <p className="text-[11px] font-black tracking-[0.25em] uppercase text-[var(--md-sys-color-primary)]">Illuminating Learning</p>

                    {/* Stage text */}
                    <motion.p
                        key={stageIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] font-medium text-[var(--md-sys-color-secondary)] tracking-wide"
                    >
                        {STAGES[stageIndex]}
                    </motion.p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SplashScreen;
