import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * TimeGrid — Schedule / Timetable page.
 * Enhanced: thicker lines, cell highlights, time markers, sweeping beams, and warm pulse.
 */
const TimeGrid: React.FC = () => {
    const horizontalLines = useMemo(() =>
        Array.from({ length: 10 }, (_, i) => ({
            id: i,
            top: `${10 * (i + 1)}%`,
            delay: i * 0.2,
        })), []
    );

    const verticalLines = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => ({
            id: i,
            left: `${14.28 * (i + 1)}%`,
            delay: i * 0.3,
        })), []
    );

    // Random cell highlights (like calendar events)
    const cells = useMemo(() =>
        Array.from({ length: 6 }, (_, i) => ({
            id: i,
            left: `${14.28 * (Math.floor(Math.random() * 6) + 1)}%`,
            top: `${10 * (Math.floor(Math.random() * 8) + 1)}%`,
            width: '12%',
            height: '8%',
            delay: i * 1.5,
            color: i % 3 === 0 ? 'rgba(66,133,244,0.08)' : i % 3 === 1 ? 'rgba(52,168,83,0.07)' : 'rgba(251,188,4,0.06)',
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Warm amber base gradient */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, rgba(251,188,4,0.03) 0%, rgba(66,133,244,0.04) 50%, rgba(52,168,83,0.03) 100%)',
                }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Grid lines */}
            {horizontalLines.map((line) => (
                <motion.div
                    key={`h-${line.id}`}
                    className="absolute w-full left-0"
                    style={{
                        top: line.top,
                        height: 1,
                        backgroundColor: 'var(--md-sys-color-outline)',
                    }}
                    animate={{ opacity: [0.06, 0.18, 0.06] }}
                    transition={{ duration: 5, delay: line.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {verticalLines.map((line) => (
                <motion.div
                    key={`v-${line.id}`}
                    className="absolute h-full top-0"
                    style={{
                        left: line.left,
                        width: 1,
                        backgroundColor: 'var(--md-sys-color-outline)',
                    }}
                    animate={{ opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 6, delay: line.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Ghost calendar event cells */}
            {cells.map((cell) => (
                <motion.div
                    key={`cell-${cell.id}`}
                    className="absolute rounded-lg"
                    style={{
                        left: cell.left,
                        top: cell.top,
                        width: cell.width,
                        height: cell.height,
                        backgroundColor: cell.color,
                        border: `1px solid ${cell.color.replace(/[\d.]+\)$/, '0.15)')}`,
                    }}
                    animate={{ opacity: [0, 0.6, 0.6, 0] }}
                    transition={{
                        duration: 5,
                        delay: cell.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* Sweeping "now" line — horizontal */}
            <motion.div
                className="absolute left-0 w-full"
                style={{
                    height: 2,
                    background: 'linear-gradient(90deg, transparent 20%, var(--google-red) 50%, transparent 80%)',
                }}
                animate={{
                    top: ['0%', '100%'],
                    opacity: [0, 0.4, 0.4, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />

            {/* Sweeping vertical beam */}
            <motion.div
                className="absolute top-0 h-full"
                style={{
                    width: 2,
                    background: 'linear-gradient(to bottom, transparent, var(--md-sys-color-primary), transparent)',
                }}
                animate={{
                    left: ['0%', '100%'],
                    opacity: [0, 0.25, 0.25, 0],
                }}
                transition={{ duration: 15, delay: 3, repeat: Infinity, ease: 'linear' }}
            />

            {/* Time marker dots along the left edge */}
            {horizontalLines.map((line) => (
                <motion.div
                    key={`marker-${line.id}`}
                    className="absolute"
                    style={{
                        left: '2%',
                        top: line.top,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'var(--md-sys-color-primary)',
                    }}
                    animate={{ opacity: [0.1, 0.35, 0.1], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 3, delay: line.delay + 1, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
};

export default React.memo(TimeGrid);
