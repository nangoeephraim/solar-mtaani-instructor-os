import React from 'react';
import { motion } from 'framer-motion';

/**
 * ZenGradient — Settings, Resources, Assessment.
 * Enhanced: more blobs, Google colors, orbiting halos, gentle noise texture overlay.
 */
const ZenGradient: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Full-screen multi-color gradient base */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(66,133,244,0.05) 0%, rgba(168,199,250,0.04) 25%, rgba(52,168,83,0.04) 50%, rgba(251,188,4,0.03) 75%, rgba(234,67,53,0.04) 100%)',
                }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Blob 1 — Top-left, Google Blue */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '50vw',
                    height: '50vw',
                    maxWidth: 700,
                    maxHeight: 700,
                    top: '-15%',
                    left: '-12%',
                    background: 'radial-gradient(circle, rgba(66, 133, 244, 0.10) 0%, rgba(66,133,244,0.03) 40%, transparent 70%)',
                    filter: 'blur(50px)',
                }}
                animate={{
                    x: [0, 60, -20, 0],
                    y: [0, 40, -10, 0],
                    scale: [1, 1.15, 0.95, 1],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Blob 2 — Bottom-right, Google Green */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '45vw',
                    height: '45vw',
                    maxWidth: 600,
                    maxHeight: 600,
                    bottom: '-10%',
                    right: '-8%',
                    background: 'radial-gradient(circle, rgba(52, 168, 83, 0.09) 0%, rgba(52,168,83,0.02) 40%, transparent 70%)',
                    filter: 'blur(50px)',
                }}
                animate={{
                    x: [0, -50, 20, 0],
                    y: [0, -50, 15, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Blob 3 — Center-top, warm gold */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '35vw',
                    height: '35vw',
                    maxWidth: 450,
                    maxHeight: 450,
                    top: '20%',
                    right: '15%',
                    background: 'radial-gradient(circle, rgba(251, 188, 4, 0.07) 0%, rgba(251,188,4,0.02) 40%, transparent 70%)',
                    filter: 'blur(45px)',
                }}
                animate={{
                    x: [0, -30, 40, 0],
                    y: [0, 25, -20, 0],
                    scale: [1, 1.1, 1.05, 1],
                }}
                transition={{ duration: 16, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Blob 4 — Bottom-left, Google Red accent */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '30vw',
                    height: '30vw',
                    maxWidth: 400,
                    maxHeight: 400,
                    bottom: '10%',
                    left: '10%',
                    background: 'radial-gradient(circle, rgba(234, 67, 53, 0.05) 0%, transparent 60%)',
                    filter: 'blur(45px)',
                }}
                animate={{
                    scale: [1, 1.25, 1],
                    opacity: [0.4, 0.8, 0.4],
                }}
                transition={{ duration: 14, delay: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Orbiting halo ring 1 */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    top: '50%',
                    left: '50%',
                    width: 300,
                    height: 300,
                    transform: 'translate(-50%, -50%)',
                    border: '1px solid rgba(66,133,244,0.06)',
                }}
                animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
                transition={{ rotate: { duration: 30, repeat: Infinity, ease: 'linear' }, scale: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}
            />

            {/* Orbiting halo ring 2 */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    top: '50%',
                    left: '50%',
                    width: 500,
                    height: 500,
                    transform: 'translate(-50%, -50%)',
                    border: '1px solid rgba(52,168,83,0.04)',
                }}
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
            />

            {/* Subtle noise texture overlay */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    opacity: 0.02,
                    mixBlendMode: 'overlay',
                }}
            />
        </div>
    );
};

export default React.memo(ZenGradient);
