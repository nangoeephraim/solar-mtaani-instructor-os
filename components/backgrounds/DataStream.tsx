import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * DataStream — Dashboard & Analytics.
 * Multi-layered: aurora gradient bands, flowing data lines, rising chart-bar columns,
 * pulsing metric dots, and a soft ambient glow.
 */
const DataStream: React.FC = () => {
    const lines = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            top: `${10 + i * 11}%`,
            delay: i * 0.5,
            duration: 6 + i * 1.2,
            width: `${50 + Math.random() * 40}%`,
            height: i % 3 === 0 ? 2 : 1,
        })), []
    );

    const dots = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: `${3 + Math.random() * 94}%`,
            size: 2 + Math.random() * 5,
            delay: Math.random() * 5,
            duration: 5 + Math.random() * 7,
        })), []
    );

    const bars = useMemo(() =>
        Array.from({ length: 10 }, (_, i) => ({
            id: i,
            left: `${8 + i * 9}%`,
            maxHeight: 30 + Math.random() * 60,
            delay: i * 0.4,
            duration: 4 + Math.random() * 3,
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Aurora gradient bands */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(66,133,244,0.06) 0%, rgba(52,168,83,0.04) 30%, rgba(251,188,4,0.03) 60%, rgba(234,67,53,0.04) 100%)',
                }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Flowing horizontal data lines */}
            {lines.map((line) => (
                <motion.div
                    key={`line-${line.id}`}
                    className="absolute"
                    style={{
                        top: line.top,
                        width: line.width,
                        height: line.height,
                        borderRadius: 1,
                        background: line.id % 2 === 0
                            ? 'linear-gradient(90deg, transparent, var(--md-sys-color-primary), rgba(66,133,244,0.4), transparent)'
                            : 'linear-gradient(90deg, transparent, rgba(52,168,83,0.6), rgba(52,168,83,0.3), transparent)',
                        opacity: 0,
                    }}
                    animate={{
                        x: ['-100%', '250%'],
                        opacity: [0, 0.35, 0.35, 0],
                    }}
                    transition={{
                        duration: line.duration,
                        delay: line.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            ))}

            {/* Rising metric dots */}
            {dots.map((dot) => (
                <motion.div
                    key={`dot-${dot.id}`}
                    className="absolute rounded-full"
                    style={{
                        left: dot.left,
                        width: dot.size,
                        height: dot.size,
                        backgroundColor: dot.id % 3 === 0 ? 'var(--google-blue)' : dot.id % 3 === 1 ? 'var(--google-green)' : 'var(--google-yellow)',
                        opacity: 0,
                    }}
                    animate={{
                        y: ['100vh', '-10vh'],
                        opacity: [0, 0.4, 0.35, 0],
                    }}
                    transition={{
                        duration: dot.duration,
                        delay: dot.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            ))}

            {/* Ghost chart bars rising from bottom */}
            {bars.map((bar) => (
                <motion.div
                    key={`bar-${bar.id}`}
                    className="absolute bottom-0"
                    style={{
                        left: bar.left,
                        width: '2.5%',
                        borderRadius: '4px 4px 0 0',
                        background: bar.id % 2 === 0
                            ? 'linear-gradient(to top, rgba(66,133,244,0.12), rgba(66,133,244,0.02))'
                            : 'linear-gradient(to top, rgba(52,168,83,0.10), rgba(52,168,83,0.01))',
                    }}
                    animate={{
                        height: [0, bar.maxHeight, bar.maxHeight * 0.6, bar.maxHeight * 0.9, 0],
                        opacity: [0, 0.5, 0.5, 0.4, 0],
                    }}
                    transition={{
                        duration: bar.duration,
                        delay: bar.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* Pulsing central metric glow */}
            <motion.div
                className="absolute"
                style={{
                    top: '25%',
                    left: '60%',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(66,133,244,0.08) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.7, 0.4],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Secondary glow */}
            <motion.div
                className="absolute"
                style={{
                    bottom: '20%',
                    left: '20%',
                    width: 250,
                    height: 250,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(52,168,83,0.06) 0%, transparent 70%)',
                    filter: 'blur(40px)',
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 8, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
};

export default React.memo(DataStream);
