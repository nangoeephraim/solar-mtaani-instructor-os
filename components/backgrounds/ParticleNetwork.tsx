import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * ParticleNetwork — Students, Attendance, Student Insights.
 * Bold: large glowing nodes, thick visible connections, expanding pulse waves, floating shapes.
 */
const ParticleNetwork: React.FC = () => {
    const nodes = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            cx: 5 + Math.random() * 90,
            cy: 5 + Math.random() * 90,
            size: 30 + Math.random() * 50,
            driftX: (Math.random() - 0.5) * 80,
            driftY: (Math.random() - 0.5) * 80,
            delay: Math.random() * 3,
            duration: 10 + Math.random() * 8,
            color: ['#4285f4', '#34a853', '#ea4335', '#fbbc04'][i % 4],
        })), []
    );

    const shapes = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 80,
            size: 40 + Math.random() * 60,
            rotation: Math.random() * 360,
            delay: i * 0.8,
            duration: 15 + Math.random() * 10,
            isCircle: i % 2 === 0,
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Soft base gradient */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(160deg, rgba(52,168,83,0.08) 0%, rgba(66,133,244,0.10) 40%, rgba(234,67,53,0.06) 80%, rgba(251,188,4,0.07) 100%)',
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Large floating geometric shapes */}
            {shapes.map((s) => (
                <motion.div
                    key={`shape-${s.id}`}
                    className="absolute"
                    style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: s.size,
                        height: s.size,
                        borderRadius: s.isCircle ? '50%' : '12px',
                        border: '1.5px solid rgba(66,133,244,0.15)',
                        transform: `rotate(${s.rotation}deg)`,
                    }}
                    animate={{
                        rotate: [s.rotation, s.rotation + 180, s.rotation + 360],
                        x: [0, 30, -20, 0],
                        y: [0, -25, 20, 0],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Glowing node circles */}
            {nodes.map((node) => (
                <motion.div
                    key={node.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${node.cx}%`,
                        top: `${node.cy}%`,
                        width: node.size,
                        height: node.size,
                        background: `radial-gradient(circle, ${node.color}30 0%, ${node.color}10 50%, transparent 70%)`,
                    }}
                    animate={{
                        x: [0, node.driftX * 0.4, 0],
                        y: [0, node.driftY * 0.4, 0],
                        scale: [1, 1.3, 1],
                        opacity: [0.4, 0.8, 0.4],
                    }}
                    transition={{ duration: node.duration, delay: node.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Large expanding connection waves */}
            {[
                { x: 30, y: 40, delay: 0 },
                { x: 65, y: 55, delay: 2 },
                { x: 50, y: 25, delay: 4 },
            ].map((pulse, i) => (
                <motion.div
                    key={`wave-${i}`}
                    className="absolute rounded-full"
                    style={{
                        left: `${pulse.x}%`,
                        top: `${pulse.y}%`,
                        width: 200,
                        height: 200,
                        transform: 'translate(-50%, -50%)',
                        border: '2px solid rgba(52,168,83,0.25)',
                    }}
                    animate={{
                        scale: [0.2, 2, 0.2],
                        opacity: [0.7, 0, 0.7],
                    }}
                    transition={{ duration: 5, delay: pulse.delay, repeat: Infinity, ease: 'easeOut' }}
                />
            ))}

            {/* Connecting line beams */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {[
                    { x1: 10, y1: 20, x2: 40, y2: 50 },
                    { x1: 60, y1: 15, x2: 85, y2: 45 },
                    { x1: 25, y1: 70, x2: 55, y2: 85 },
                    { x1: 70, y1: 60, x2: 90, y2: 80 },
                    { x1: 15, y1: 45, x2: 50, y2: 30 },
                ].map((line, i) => (
                    <motion.line
                        key={i}
                        x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                        stroke="var(--md-sys-color-primary)"
                        strokeWidth="0.15"
                        animate={{ opacity: [0, 0.4, 0.4, 0] }}
                        transition={{ duration: 4, delay: i * 1.2, repeat: Infinity }}
                    />
                ))}
            </svg>
        </div>
    );
};

export default React.memo(ParticleNetwork);
