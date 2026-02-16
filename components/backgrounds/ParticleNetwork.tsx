import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * ParticleNetwork — used for Students, Attendance, User Management.
 * Floating nodes that drift gently, representing connections between people.
 */
const ParticleNetwork: React.FC = () => {
    const nodes = useMemo(() =>
        Array.from({ length: 18 }, (_, i) => ({
            id: i,
            cx: 5 + Math.random() * 90,
            cy: 5 + Math.random() * 90,
            r: 2 + Math.random() * 3,
            driftX: (Math.random() - 0.5) * 60,
            driftY: (Math.random() - 0.5) * 60,
            delay: Math.random() * 4,
            duration: 12 + Math.random() * 10,
        })), []
    );

    // Create some edges between nearby nodes
    const edges = useMemo(() => {
        const result: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [];
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].cx - nodes[j].cx;
                const dy = nodes[i].cy - nodes[j].cy;
                if (Math.sqrt(dx * dx + dy * dy) < 28) {
                    result.push({
                        id: `${i}-${j}`,
                        x1: nodes[i].cx,
                        y1: nodes[i].cy,
                        x2: nodes[j].cx,
                        y2: nodes[j].cy,
                    });
                }
            }
        }
        return result;
    }, [nodes]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Edges */}
                {edges.map((edge) => (
                    <motion.line
                        key={edge.id}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke="var(--md-sys-color-primary)"
                        strokeWidth="0.08"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.15, 0.15, 0] }}
                        transition={{ duration: 8, repeat: Infinity, delay: Math.random() * 4 }}
                    />
                ))}

                {/* Nodes */}
                {nodes.map((node) => (
                    <motion.circle
                        key={node.id}
                        cx={node.cx}
                        cy={node.cy}
                        r={node.r * 0.15}
                        fill="var(--md-sys-color-primary)"
                        initial={{ opacity: 0 }}
                        animate={{
                            cx: [node.cx, node.cx + node.driftX * 0.3, node.cx],
                            cy: [node.cy, node.cy + node.driftY * 0.3, node.cy],
                            opacity: [0.08, 0.22, 0.08],
                        }}
                        transition={{
                            duration: node.duration,
                            delay: node.delay,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                ))}
            </svg>

            {/* Soft accent glow */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'radial-gradient(ellipse at 30% 70%, rgba(52, 168, 83, 0.04) 0%, transparent 60%)',
                }}
            />
        </div>
    );
};

export default React.memo(ParticleNetwork);
