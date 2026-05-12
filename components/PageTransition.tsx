import React from 'react';
import { motion } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 12,
        scale: 0.99
    },
    enter: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.28,
            ease: [0.4, 0, 0.2, 1] as const, // Google's emphasizing easing
            staggerChildren: 0.06
        }
    },
    exit: {
        opacity: 0,
        y: -8,
        scale: 0.99,
        transition: {
            duration: 0.12,
            ease: [0.4, 0, 1, 1] as const // Google's accelerating easing
        }
    }
};

const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
    return (
        <motion.div
            initial="initial"
            animate="enter"
            exit="exit"
            variants={pageVariants}
            className="h-full flex flex-col will-change-transform"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
