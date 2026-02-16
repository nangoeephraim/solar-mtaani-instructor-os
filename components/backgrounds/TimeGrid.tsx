import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * TimeGrid — Schedule / Timetable page.
 * Bold: visible grid with glowing intersections, large event blocks, prominent sweep beams, clock rings.
 */
const TimeGrid: React.FC = () => {
    const rows = 8;
    const cols = 7;

    // Ghost calendar event blocks
    const events = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            col: Math.floor(Math.random() * cols),
            row: Math.floor(Math.random() * (rows - 1)),
            span: 1 + Math.floor(Math.random() * 2),
            delay: i * 1,
            color: ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#9334e6', '#4285f4', '#34a853', '#ea4335'][i],
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Warm ambient gradient */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, rgba(251,188,4,0.07) 0%, rgba(66,133,244,0.08) 40%, rgba(52,168,83,0.06) 80%, rgba(234,67,53,0.05) 100%)',
                }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Visible grid lines */}
            {Array.from({ length: rows }, (_, i) => (
                <motion.div
                    key={`h-${i}`}
                    className="absolute w-full left-0"
                    style={{
                        top: `${(100 / rows) * (i + 1)}%`,
                        height: 1,
                        background: 'linear-gradient(90deg, transparent 2%, var(--md-sys-color-outline) 10%, var(--md-sys-color-outline) 90%, transparent 98%)',
                    }}
                    animate={{ opacity: [0.12, 0.30, 0.12] }}
                    transition={{ duration: 4, delay: i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {Array.from({ length: cols }, (_, i) => (
                <motion.div
                    key={`v-${i}`}
                    className="absolute h-full top-0"
                    style={{
                        left: `${(100 / cols) * (i + 1)}%`,
                        width: 1,
                        background: 'linear-gradient(180deg, transparent 2%, var(--md-sys-color-outline) 10%, var(--md-sys-color-outline) 90%, transparent 98%)',
                    }}
                    animate={{ opacity: [0.10, 0.25, 0.10] }}
                    transition={{ duration: 5, delay: i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Ghost calendar event blocks */}
            {events.map((ev) => (
                <motion.div
                    key={ev.id}
                    className="absolute rounded-lg"
                    style={{
                        left: `${(100 / cols) * ev.col + 1}%`,
                        top: `${(100 / rows) * ev.row + 1}%`,
                        width: `${100 / cols - 2}%`,
                        height: `${(100 / rows) * ev.span - 1.5}%`,
                        backgroundColor: `${ev.color}20`,
                        borderLeft: `3px solid ${ev.color}60`,
                    }}
                    animate={{ opacity: [0, 0.8, 0.8, 0] }}
                    transition={{ duration: 6, delay: ev.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Horizontal "now" sweep — bright red */}
            <motion.div
                className="absolute left-0 w-full"
                style={{
                    height: 2,
                    background: 'linear-gradient(90deg, transparent 10%, #ea433580 30%, #ea4335 50%, #ea433580 70%, transparent 90%)',
                    boxShadow: '0 0 12px rgba(234,67,53,0.3)',
                }}
                animate={{ top: ['0%', '100%'], opacity: [0, 0.8, 0.8, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />

            {/* Vertical sweep beam */}
            <motion.div
                className="absolute top-0 h-full"
                style={{
                    width: 2,
                    background: 'linear-gradient(180deg, transparent 10%, #4285f480 30%, #4285f4 50%, #4285f480 70%, transparent 90%)',
                    boxShadow: '0 0 12px rgba(66,133,244,0.3)',
                }}
                animate={{ left: ['0%', '100%'], opacity: [0, 0.6, 0.6, 0] }}
                transition={{ duration: 20, delay: 5, repeat: Infinity, ease: 'linear' }}
            />

            {/* Clock ring — bottom right */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    bottom: '10%',
                    right: '8%',
                    width: 140,
                    height: 140,
                    border: '2px solid rgba(251,188,4,0.2)',
                }}
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
                {/* Clock hand */}
                <motion.div
                    className="absolute"
                    style={{
                        left: '50%',
                        top: '10%',
                        width: 2,
                        height: '40%',
                        backgroundColor: 'rgba(251,188,4,0.35)',
                        borderRadius: 2,
                        transformOrigin: 'bottom center',
                    }}
                />
            </motion.div>

            {/* Glowing intersection dots */}
            {Array.from({ length: 5 }, (_, i) => (
                <motion.div
                    key={`glow-${i}`}
                    className="absolute rounded-full"
                    style={{
                        left: `${(100 / cols) * (i + 1)}%`,
                        top: `${(100 / rows) * (i + 1)}%`,
                        width: 8,
                        height: 8,
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#4285f4',
                        boxShadow: '0 0 12px rgba(66,133,244,0.4)',
                    }}
                    animate={{ scale: [0.5, 1.5, 0.5], opacity: [0.3, 0.7, 0.3] }}
                    transition={{ duration: 3, delay: i * 0.8, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </div>
    );
};

export default React.memo(TimeGrid);
