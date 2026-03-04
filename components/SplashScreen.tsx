import React from 'react';
import { motion } from 'framer-motion';

export const SplashScreen: React.FC = () => {
    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'var(--md-sys-color-background)' }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
        >
            <div className="flex flex-col items-center">
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

                    {/* Pulse Effect */}
                    <motion.div
                        className="absolute inset-0 bg-[var(--md-sys-color-primary)] rounded-2xl -z-10"
                        animate={{
                            scale: [1, 1.2, 1.2],
                            opacity: [0.2, 0, 0]
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
                    className="flex flex-col items-center gap-3"
                >
                    <div className="h-1 w-32 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--md-sys-color-outline)' }}>
                        <motion.div
                            className="h-full rounded-full bg-[var(--md-sys-color-primary)]"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{
                                repeat: Infinity,
                                duration: 1.5,
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                    <p className="text-[11px] font-bold tracking-[0.25em] uppercase mt-2 text-[var(--md-sys-color-primary)]">Illuminating Learning</p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SplashScreen;
