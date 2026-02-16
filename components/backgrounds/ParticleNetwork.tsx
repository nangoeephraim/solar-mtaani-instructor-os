import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * ParticleNetwork — Students, Attendance, Student Insights.
 * Enhanced: more nodes, glowing edges, orbiting rings, avatar silhouettes, connection pulses.
 */
const ParticleNetwork: React.FC = () => {
    const nodes = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            cx: 3 + Math.random() * 94,
            cy: 3 + Math.random() * 94,
            r: 1.5 + Math.random() * 3,
            driftX: (Math.random() - 0.5) * 50,
            driftY: (Math.random() - 0.5) * 50,
            delay: Math.random() * 3,
            duration: 10 + Math.random() * 12,
            color: i % 4 === 0 ? 'var(--google-blue)' : i % 4 === 1 ? 'var(--google-green)' : i % 4 === 2 ? 'var(--google-red)' : 'var(--google-yellow)',
        })), []
    );

    const edges = useMemo(() => {
        const result: { id: string; x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].cx - nodes[j].cx;
                const dy = nodes[i].cy - nodes[j].cy;
                if (Math.sqrt(dx * dx + dy * dy) < 22) {
                    result.push({
                        id: `${i}-${j}`,
                        x1: nodes[i].cx,
                        y1: nodes[i].cy,
                        x2: nodes[j].cx,
                        y2: nodes[j].cy,
                        delay: Math.random() * 3,
                    });
                }
            }
        }
        return result;
    }, [nodes]);

    // Hub nodes (larger, with orbit rings)
    const hubs = useMemo(() => [
        { cx: 25, cy: 30, delay: 0 },
        { cx: 70, cy: 45, delay: 1.5 },
        { cx: 45, cy: 75, delay: 3 },
    ], []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Background gradient wash */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(160deg, rgba(52,168,83,0.04) 0%, rgba(66,133,244,0.05) 50%, rgba(234,67,53,0.03) 100%)',
                }}
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Glowing edges */}
                {edges.map((edge) => (
                    <motion.line
                        key={edge.id}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke="var(--md-sys-color-primary)"
                        strokeWidth="0.12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.3, 0.3, 0] }}
                        transition={{ duration: 6, repeat: Infinity, delay: edge.delay }}
                    />
                ))}

                {/* Hub orbit rings */}
                {hubs.map((hub, i) => (
                    <motion.circle
                        key={`hub-${i}`}
                        cx={hub.cx}
                        cy={hub.cy}
                        r={8}
                        fill="none"
                        stroke="var(--md-sys-color-primary)"
                        strokeWidth="0.05"
                        strokeDasharray="2 2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.1, 0.25, 0.1] }}
                        transition={{ duration: 5, delay: hub.delay, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}

                {/* Nodes */}
                {nodes.map((node) => (
                    <React.Fragment key={node.id}>
                        {/* Node glow */}
                        <motion.circle
                            cx={node.cx}
                            cy={node.cy}
                            r={node.r * 0.4}
                            fill={node.color}
                            initial={{ opacity: 0 }}
                            animate={{
                                cx: [node.cx, node.cx + node.driftX * 0.25, node.cx],
                                cy: [node.cy, node.cy + node.driftY * 0.25, node.cy],
                                opacity: [0.05, 0.15, 0.05],
                            }}
                            transition={{
                                duration: node.duration,
                                delay: node.delay,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                        {/* Node core */}
                        <motion.circle
                            cx={node.cx}
                            cy={node.cy}
                            r={node.r * 0.15}
                            fill={node.color}
                            initial={{ opacity: 0 }}
                            animate={{
                                cx: [node.cx, node.cx + node.driftX * 0.25, node.cx],
                                cy: [node.cy, node.cy + node.driftY * 0.25, node.cy],
                                opacity: [0.15, 0.45, 0.15],
                            }}
                            transition={{
                                duration: node.duration,
                                delay: node.delay,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />
                    </React.Fragment>
                ))}
            </svg>

            {/* Connection pulse rings */}
            {hubs.map((hub, i) => (
                <motion.div
                    key={`pulse-${i}`}
                    className="absolute rounded-full"
                    style={{
                        left: `${hub.cx}%`,
                        top: `${hub.cy}%`,
                        width: 120,
                        height: 120,
                        transform: 'translate(-50%, -50%)',
                        border: '1px solid var(--md-sys-color-primary)',
                    }}
                    animate={{
                        scale: [0.3, 1.5],
                        opacity: [0.3, 0],
                    }}
                    transition={{
                        duration: 4,
                        delay: hub.delay + 1,
                        repeat: Infinity,
                        ease: 'easeOut',
                    }}
                />
            ))}
        </div>
    );
};

export default React.memo(ParticleNetwork);
