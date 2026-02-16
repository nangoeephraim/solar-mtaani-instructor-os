import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * DataStream — Dashboard & Analytics.
 * Bold: large gradient waves, bright floating orbs, prominent rising bars, glowing pulse rings.
 */
const DataStream: React.FC = () => {
    const orbs = useMemo(() =>
        Array.from({ length: 6 }, (_, i) => ({
            id: i,
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 80,
            size: 80 + Math.random() * 120,
            color: ['#4285f4', '#34a853', '#fbbc04', '#ea4335', '#4285f4', '#34a853'][i],
            delay: i * 1.2,
            duration: 8 + Math.random() * 6,
        })), []
    );

    const bars = useMemo(() =>
        Array.from({ length: 14 }, (_, i) => ({
            id: i,
            left: `${5 + i * 6.5}%`,
            maxHeight: 60 + Math.random() * 200,
            delay: i * 0.3,
            duration: 3 + Math.random() * 2,
            color: i % 4 === 0 ? '#4285f4' : i % 4 === 1 ? '#34a853' : i % 4 === 2 ? '#fbbc04' : '#ea4335',
        })), []
    );

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Bold diagonal gradient sweep */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, rgba(66,133,244,0.12) 0%, rgba(52,168,83,0.08) 25%, rgba(251,188,4,0.06) 50%, rgba(234,67,53,0.08) 75%, rgba(66,133,244,0.10) 100%)',
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Large flowing gradient wave */}
            <motion.div
                className="absolute"
                style={{
                    top: '30%',
                    left: '-20%',
                    width: '140%',
                    height: '40%',
                    background: 'linear-gradient(90deg, transparent, rgba(66,133,244,0.15), rgba(52,168,83,0.12), rgba(251,188,4,0.10), transparent)',
                    filter: 'blur(30px)',
                    borderRadius: '50%',
                }}
                animate={{
                    y: [-50, 50, -50],
                    rotate: [-2, 2, -2],
                    scaleX: [1, 1.1, 1],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Floating bokeh orbs */}
            {orbs.map((orb) => (
                <motion.div
                    key={orb.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${orb.x}%`,
                        top: `${orb.y}%`,
                        width: orb.size,
                        height: orb.size,
                        background: `radial-gradient(circle, ${orb.color}22 0%, ${orb.color}08 50%, transparent 70%)`,
                        filter: 'blur(20px)',
                    }}
                    animate={{
                        x: [0, 40, -30, 0],
                        y: [0, -35, 25, 0],
                        scale: [1, 1.3, 0.9, 1],
                        opacity: [0.5, 0.9, 0.5],
                    }}
                    transition={{ duration: orb.duration, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Rising bar chart columns */}
            {bars.map((bar) => (
                <motion.div
                    key={bar.id}
                    className="absolute bottom-0"
                    style={{
                        left: bar.left,
                        width: '3%',
                        borderRadius: '6px 6px 0 0',
                        background: `linear-gradient(to top, ${bar.color}30, ${bar.color}08)`,
                    }}
                    animate={{
                        height: [0, bar.maxHeight, bar.maxHeight * 0.5, bar.maxHeight * 0.8, 0],
                        opacity: [0, 0.7, 0.6, 0.5, 0],
                    }}
                    transition={{ duration: bar.duration, delay: bar.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Pulsing ring */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    top: '20%',
                    right: '15%',
                    width: 200,
                    height: 200,
                    border: '2px solid rgba(66,133,244,0.20)',
                }}
                animate={{
                    scale: [0.5, 1.5, 0.5],
                    opacity: [0.6, 0, 0.6],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeOut' }}
            />

            {/* Second pulse ring on the left */}
            <motion.div
                className="absolute rounded-full"
                style={{
                    bottom: '25%',
                    left: '10%',
                    width: 160,
                    height: 160,
                    border: '2px solid rgba(52,168,83,0.20)',
                }}
                animate={{
                    scale: [0.5, 1.6, 0.5],
                    opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 5, delay: 1.5, repeat: Infinity, ease: 'easeOut' }}
            />
        </div>
    );
};

export default React.memo(DataStream);
