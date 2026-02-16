import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * TimeGrid — used for the Schedule/Timetable page.
 * Subtle pulsing grid lines and a "now" sweep bar.
 */
const TimeGrid: React.FC = () => {
    const horizontalLines = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            top: `${12.5 * (i + 1)}%`,
            delay: i * 0.3,
        })), []
    );

    const verticalLines = useMemo(() =>
        Array.from({ length: 6 }, (_, i) => ({
            id: i,
            left: `${16.67 * (i + 1)}%`,
            delay: i * 0.4,
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Horizontal grid lines */}
            {horizontalLines.map((line) => (
                <motion.div
                    key={`h-${line.id}`}
                    className="absolute w-full h-px left-0"
                    style={{
                        top: line.top,
                        backgroundColor: 'var(--md-sys-color-outline)',
                    }}
                    animate={{
                        opacity: [0.04, 0.12, 0.04],
                    }}
                    transition={{
                        duration: 4,
                        delay: line.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* Vertical grid lines */}
            {verticalLines.map((line) => (
                <motion.div
                    key={`v-${line.id}`}
                    className="absolute h-full w-px top-0"
                    style={{
                        left: line.left,
                        backgroundColor: 'var(--md-sys-color-outline)',
                    }}
                    animate={{
                        opacity: [0.03, 0.10, 0.03],
                    }}
                    transition={{
                        duration: 5,
                        delay: line.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* Sweeping "now" indicator */}
            <motion.div
                className="absolute top-0 h-full w-px"
                style={{
                    background: 'linear-gradient(to bottom, transparent, var(--md-sys-color-primary), transparent)',
                }}
                animate={{
                    left: ['0%', '100%'],
                    opacity: [0, 0.2, 0.2, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Warm gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at 50% 50%, rgba(251, 188, 4, 0.03) 0%, transparent 70%)',
                }}
            />
        </div>
    );
};

export default React.memo(TimeGrid);
