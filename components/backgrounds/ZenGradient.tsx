import React from 'react';
import { motion } from 'framer-motion';

/**
 * ZenGradient — Settings, Resources, Assessment.
 * Bold: large saturated blobs, orbiting rings, floating shapes, visible mesh gradient.
 */
const ZenGradient: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Multi-color mesh gradient base */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(66,133,244,0.10) 0%, rgba(147,51,234,0.08) 25%, rgba(52,168,83,0.08) 50%, rgba(251,188,4,0.06) 75%, rgba(234,67,53,0.08) 100%)',
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Large blob 1 — Google Blue, top-left */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '55vw',
                    height: '55vw',
                    maxWidth: 700,
                    maxHeight: 700,
                    top: '-18%',
                    left: '-15%',
                    background: 'radial-gradient(circle, rgba(66,133,244,0.18) 0%, rgba(66,133,244,0.06) 40%, transparent 65%)',
                    filter: 'blur(40px)',
                }}
                animate={{
                    x: [0, 80, -30, 0],
                    y: [0, 50, -20, 0],
                    scale: [1, 1.2, 0.9, 1],
                }}
                transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Large blob 2 — Purple, bottom-right */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '50vw',
                    height: '50vw',
                    maxWidth: 650,
                    maxHeight: 650,
                    bottom: '-12%',
                    right: '-10%',
                    background: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, rgba(147,51,234,0.05) 40%, transparent 65%)',
                    filter: 'blur(40px)',
                }}
                animate={{
                    x: [0, -60, 30, 0],
                    y: [0, -60, 25, 0],
                    scale: [1, 1.25, 0.85, 1],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Blob 3 — Green, center */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '40vw',
                    height: '40vw',
                    maxWidth: 500,
                    maxHeight: 500,
                    top: '30%',
                    left: '35%',
                    background: 'radial-gradient(circle, rgba(52,168,83,0.12) 0%, rgba(52,168,83,0.04) 40%, transparent 60%)',
                    filter: 'blur(35px)',
                }}
                animate={{
                    x: [0, -40, 50, 0],
                    y: [0, 30, -30, 0],
                    scale: [0.9, 1.2, 0.95, 0.9],
                }}
                transition={{ duration: 14, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Blob 4 — Gold/Yellow, top right */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    width: '35vw',
                    height: '35vw',
                    maxWidth: 400,
                    maxHeight: 400,
                    top: '10%',
                    right: '10%',
                    background: 'radial-gradient(circle, rgba(251,188,4,0.14) 0%, rgba(251,188,4,0.04) 40%, transparent 60%)',
                    filter: 'blur(35px)',
                }}
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 12, delay: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Orbiting ring 1 — large */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    top: '50%',
                    left: '50%',
                    width: 350,
                    height: 350,
                    transform: 'translate(-50%, -50%)',
                    border: '1.5px solid rgba(66,133,244,0.12)',
                }}
                animate={{ rotate: [0, 360], scale: [1, 1.15, 1] }}
                transition={{
                    rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                }}
            />

            {/* Orbiting ring 2 — medium, opposite direction */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    top: '50%',
                    left: '50%',
                    width: 550,
                    height: 550,
                    transform: 'translate(-50%, -50%)',
                    border: '1px solid rgba(147,51,234,0.08)',
                }}
                animate={{ rotate: [360, 0] }}
                transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
            />

            {/* Floating diamond shapes */}
            {[
                { x: '15%', y: '20%', size: 30, delay: 0 },
                { x: '80%', y: '35%', size: 24, delay: 2 },
                { x: '25%', y: '75%', size: 28, delay: 4 },
                { x: '70%', y: '80%', size: 22, delay: 1 },
                { x: '55%', y: '15%', size: 26, delay: 3 },
            ].map((d, i) => (
                <motion.div
                    key={`diamond-${i}`}
                    className="absolute"
                    style={{
                        left: d.x,
                        top: d.y,
                        width: d.size,
                        height: d.size,
                        border: '1.5px solid rgba(66,133,244,0.18)',
                        borderRadius: 4,
                        transform: 'rotate(45deg)',
                    }}
                    animate={{
                        y: [0, -20, 10, 0],
                        x: [0, 15, -10, 0],
                        rotate: [45, 90, 45],
                        opacity: [0.3, 0.7, 0.3],
                    }}
                    transition={{ duration: 10 + i * 2, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Small floating circles */}
            {[
                { x: '40%', y: '50%', size: 16, delay: 0 },
                { x: '60%', y: '25%', size: 12, delay: 1.5 },
                { x: '20%', y: '45%', size: 14, delay: 3 },
            ].map((c, i) => (
                <motion.div
                    key={`circ-${i}`}
                    className="absolute rounded-full"
                    style={{
                        left: c.x,
                        top: c.y,
                        width: c.size,
                        height: c.size,
                        backgroundColor: 'rgba(66,133,244,0.15)',
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.5, 1],
                    }}
                    transition={{ duration: 7, delay: c.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
};

export default React.memo(ZenGradient);
