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
                    <div className="w-24 h-24 bg-gradient-to-br from-[var(--md-sys-color-primary)] to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20 mb-8">
                        <span className="text-white font-black text-4xl font-google">P</span>
                    </div>

                    {/* Pulse Effect */}
                    <motion.div
                        className="absolute inset-0 bg-[var(--md-sys-color-primary)] rounded-2xl -z-10"
                        animate={{
                            scale: [1, 1.2, 1.2],
                            opacity: [0.3, 0, 0]
                        }}
                        transition={{
                            duration: 2,
                            ease: "easeOut",
                            repeat: Infinity,
                            repeatDelay: 1
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
                    <p className="text-sm font-google font-medium tracking-widest uppercase" style={{ color: 'var(--md-sys-color-secondary)' }}>PRISM</p>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SplashScreen;
