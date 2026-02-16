import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
                "flex flex-col items-center justify-center text-center py-12 px-6",
                className
            )}
        >
            <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="w-20 h-20 bg-[var(--md-sys-color-surface-variant)] rounded-2xl flex items-center justify-center mb-4"
            >
                <div className="text-[var(--md-sys-color-secondary)]">
                    {icon}
                </div>
            </motion.div>

            <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mb-2">
                {title}
            </h3>

            <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-xs mb-6">
                {description}
            </p>

            {action && (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={action.onClick}
                    className="px-6 py-3 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-colors tap-target"
                >
                    {action.label}
                </motion.button>
            )}
        </motion.div>
    );
};

export default EmptyState;
