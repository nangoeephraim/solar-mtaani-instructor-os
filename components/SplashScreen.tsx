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
            {/* Dynamic Full-Screen Glass Glow Mesh */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                {/* Indigo Blob */}
                <motion.div
                    className="absolute w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full blur-[120px] opacity-[0.25]"
                    style={{
                        background: 'radial-gradient(circle, rgba(99,102,241,0.8) 0%, rgba(99,102,241,0.15) 60%, transparent 100%)',
                        top: '-15%',
                        left: '-15%',
                    }}
                    animate={{
                        x: [0, 60, -30, 0],
                        y: [0, -40, 30, 0],
                        scale: [1, 1.2, 0.9, 1],
                        rotate: [0, 90, 180, 360],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Violet Blob */}
                <motion.div
                    className="absolute w-[70vw] h-[70vw] md:w-[45vw] md:h-[45vw] rounded-full blur-[110px] opacity-[0.22]"
                    style={{
                        background: 'radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(139,92,246,0.12) 60%, transparent 100%)',
                        bottom: '-15%',
                        right: '-15%',
                    }}
                    animate={{
                        x: [0, -70, 40, 0],
                        y: [0, 50, -40, 0],
                        scale: [1, 0.85, 1.15, 1],
                        rotate: [360, 270, 90, 0],
                    }}
                    transition={{
                        duration: 24,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Pink/Rose Accent Blob */}
                <motion.div
                    className="absolute w-[60vw] h-[60vw] md:w-[35vw] md:h-[35vw] rounded-full blur-[100px] opacity-[0.18]"
                    style={{
                        background: 'radial-gradient(circle, rgba(236,72,153,0.7) 0%, rgba(236,72,153,0.1) 60%, transparent 100%)',
                        top: '25%',
                        right: '10%',
                    }}
                    animate={{
                        x: [0, -40, 30, 0],
                        y: [0, 60, -50, 0],
                        scale: [0.85, 1.15, 0.95, 0.85],
                    }}
                    transition={{
                        duration: 16,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />

                {/* Cyan/Teal Accent Blob */}
                <motion.div
                    className="absolute w-[75vw] h-[75vw] md:w-[45vw] md:h-[45vw] rounded-full blur-[130px] opacity-[0.22]"
                    style={{
                        background: 'radial-gradient(circle, rgba(6,182,212,0.7) 0%, rgba(6,182,212,0.1) 60%, transparent 100%)',
                        bottom: '20%',
                        left: '10%',
                    }}
                    animate={{
                        x: [0, 40, -50, 0],
                        y: [0, -30, 60, 0],
                        scale: [1.15, 0.9, 1.1, 1.15],
                    }}
                    transition={{
                        duration: 22,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>

            {/* Full-Viewport Prism Refraction Sweep */}
            <motion.div
                className="absolute inset-0 pointer-events-none prism-glow"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.4, 0.25, 0.4, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    mixBlendMode: 'screen',
                    pointerEvents: 'none',
                }}
            />

            {/* High-fidelity blur & vignette blending panel */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    backdropFilter: 'blur(45px) saturate(150%)',
                    WebkitBackdropFilter: 'blur(45px) saturate(150%)',
                    background: 'radial-gradient(circle at center, transparent 20%, var(--md-sys-color-background) 100%)',
                }}
            />


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
