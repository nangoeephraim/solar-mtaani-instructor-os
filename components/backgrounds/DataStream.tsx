import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * DataStream — used for Dashboard & Analytics pages.
 * Renders subtle flowing horizontal lines and rising data-dot particles.
 */
const DataStream: React.FC = () => {
    const lines = useMemo(() =>
        Array.from({ length: 6 }, (_, i) => ({
            id: i,
            top: `${15 + i * 14}%`,
            delay: i * 0.7,
            duration: 8 + i * 1.5,
            width: `${40 + Math.random() * 30}%`,
        })), []
    );

    const dots = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: `${5 + Math.random() * 90}%`,
            size: 3 + Math.random() * 4,
            delay: Math.random() * 6,
            duration: 6 + Math.random() * 8,
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Flowing horizontal lines */}
            {lines.map((line) => (
                <motion.div
                    key={`line-${line.id}`}
                    className="absolute h-px"
                    style={{
                        top: line.top,
                        width: line.width,
                        background: 'linear-gradient(90deg, transparent, var(--md-sys-color-primary), transparent)',
                        opacity: 0,
                    }}
                    animate={{
                        x: ['-100%', '200%'],
                        opacity: [0, 0.15, 0.15, 0],
                    }}
                    transition={{
                        duration: line.duration,
                        delay: line.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            ))}

            {/* Rising data dots */}
            {dots.map((dot) => (
                <motion.div
                    key={`dot-${dot.id}`}
                    className="absolute rounded-full"
                    style={{
                        left: dot.left,
                        width: dot.size,
                        height: dot.size,
                        backgroundColor: 'var(--md-sys-color-primary)',
                        opacity: 0,
                    }}
                    animate={{
                        y: ['100vh', '-20vh'],
                        opacity: [0, 0.25, 0.25, 0],
                    }}
                    transition={{
                        duration: dot.duration,
                        delay: dot.delay,
                        repeat: Infinity,
                        ease: 'linear',
                    }}
                />
            ))}

            {/* Soft gradient wash */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at 70% 20%, rgba(var(--google-blue-rgb, 66,133,244), 0.04) 0%, transparent 60%)',
                }}
            />
        </div>
    );
};

export default React.memo(DataStream);
