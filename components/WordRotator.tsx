import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WordRotatorProps {
    words: string[];
    intervalMs?: number;
    className?: string;
}

const WordRotator: React.FC<WordRotatorProps> = ({ words, intervalMs = 3000, className = "" }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!words || words.length <= 1) return;
        const id = setInterval(() => {
            setIndex((prev) => (prev + 1) % words.length);
        }, intervalMs);
        return () => clearInterval(id);
    }, [words, intervalMs]);

    if (!words || words.length === 0) return null;

    return (
        <span className={`inline-block relative overflow-hidden vertical-align-middle ${className}`}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={index}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="inline-block"
                >
                    {words[index]}
                </motion.span>
            </AnimatePresence>
        </span>
    );
};

export default WordRotator;
