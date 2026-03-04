import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-[var(--md-sys-color-background)]">
            {/* Subtle Grid Pattern for structure */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==')] opacity-60 dark:opacity-20 mix-blend-overlay"></div>

            {/* Mesh Gradient Orbs */}

            {/* Primary Blue/Indigo Orb */}
            <motion.div
                animate={{
                    y: [0, -40, 0],
                    x: [0, 30, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] min-w-[400px] min-h-[400px] rounded-full bg-indigo-500/20 dark:bg-indigo-600/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
            />

            {/* Secondary Violet Orb */}
            <motion.div
                animate={{
                    y: [0, 50, 0],
                    x: [0, -40, 0],
                    scale: [1, 1.2, 1]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className="absolute top-[20%] right-[0%] w-[45vw] h-[45vw] max-w-[700px] max-h-[700px] min-w-[350px] min-h-[350px] rounded-full bg-violet-400/20 dark:bg-violet-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen"
            />

            {/* Accent Cyan/Emerald Orb */}
            <motion.div
                animate={{
                    y: [0, -30, 0],
                    x: [0, -20, 0],
                    scale: [1, 1.1, 1]
                }}
                transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] min-w-[500px] min-h-[500px] rounded-full bg-emerald-400/15 dark:bg-teal-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen"
            />

            {/* Warm Pink/Rose Orb */}
            <motion.div
                animate={{
                    y: [0, 20, 0],
                    x: [0, 40, 0],
                    scale: [1, 1.15, 1]
                }}
                transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                className="absolute bottom-[10%] -right-[10%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] min-w-[300px] min-h-[300px] rounded-full bg-rose-400/15 dark:bg-rose-600/15 blur-[100px] mix-blend-multiply dark:mix-blend-screen"
            />

            {/* Tiny Floating Sparkles mapping to the new premium colors */}
            <motion.div animate={{ rotate: 360, scale: [1, 1.5, 1] }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute top-[40%] left-[25%] text-indigo-400 dark:text-indigo-300 opacity-40 text-2xl">✦</motion.div>
            <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 14, repeat: Infinity, ease: "linear" }} className="absolute bottom-[25%] right-[30%] text-fuchsia-400 dark:text-fuchsia-300 opacity-40 text-xl">✦</motion.div>
            <motion.div animate={{ rotate: 360, scale: [0.8, 1.4, 0.8] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} className="absolute top-[15%] right-[20%] text-emerald-400 dark:text-emerald-300 opacity-40 text-xl">✦</motion.div>

            {/* Added a subtle noise overlay for premium texture */}
            <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIi8+PC9zdmc+')]"></div>
        </div>
    );
};
