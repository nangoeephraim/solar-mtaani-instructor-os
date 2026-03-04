import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
}

const Skeleton: React.FC<SkeletonProps> = ({
    className,
    width,
    height,
    variant = 'text'
}) => {
    const baseClasses = clsx(
        "bg-[var(--md-sys-color-surface-variant)] overflow-hidden relative",
        {
            'rounded-md': variant === 'text',
            'rounded-full': variant === 'circular',
            'rounded-none': variant === 'rectangular',
            'rounded-xl': variant === 'rounded',
        },
        className
    );

    const style = {
        width: width,
        height: height ?? (variant === 'text' ? '1em' : undefined),
    };

    return (
        <motion.div
            className={baseClasses}
            style={style}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"></div>
        </motion.div>
    );
};

export default Skeleton;
