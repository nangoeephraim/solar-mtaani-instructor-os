import React from 'react';
import { motion } from 'framer-motion';

/**
 * ZenGradient — used for Settings, Resources, Assessment.
 * Slowly morphing, calm mesh-gradient blobs.
 */
const ZenGradient: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Blob 1 — Top-left, soft blue */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '45vw',
                    height: '45vw',
                    maxWidth: 600,
                    maxHeight: 600,
                    top: '-10%',
                    left: '-10%',
                    background: 'radial-gradient(circle, rgba(66, 133, 244, 0.06) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: [0, 40, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Blob 2 — Bottom-right, soft green */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '40vw',
                    height: '40vw',
                    maxWidth: 500,
                    maxHeight: 500,
                    bottom: '-5%',
                    right: '-5%',
                    background: 'radial-gradient(circle, rgba(52, 168, 83, 0.05) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: [0, -30, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />

            {/* Blob 3 — Center, subtle accent */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '30vw',
                    height: '30vw',
                    maxWidth: 400,
                    maxHeight: 400,
                    top: '40%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(168, 199, 250, 0.04) 0%, transparent 70%)',
                    filter: 'blur(50px)',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.6, 1, 0.6],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    );
};

export default React.memo(ZenGradient);
