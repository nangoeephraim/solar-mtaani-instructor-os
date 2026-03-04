import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, onClick, hoverEffect = false }) => {
    const baseClasses = "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl shadow-sm overflow-hidden";
    const hoverClasses = hoverEffect ? "hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer" : "";

    if (hoverEffect || onClick) {
        return (
            <motion.div
                whileHover={hoverEffect ? { y: -2 } : undefined}
                whileTap={onClick ? { scale: 0.98 } : undefined}
                onClick={onClick}
                className={clsx(baseClasses, hoverClasses, className)}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <div className={clsx(baseClasses, className)}>
            {children}
        </div>
    );
};

export const CardHeader: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode; icon?: React.ElementType }> = ({
    title, subtitle, action, icon: Icon
}) => (
    <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
        <div className="flex items-center gap-3">
            {Icon && (
                <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-primary-container)] flex items-center justify-center text-[var(--md-sys-color-on-primary-container)]">
                    <Icon size={18} />
                </div>
            )}
            <div>
                <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)]">{title}</h3>
                {subtitle && <p className="text-xs text-[var(--md-sys-color-secondary)]">{subtitle}</p>}
            </div>
        </div>
        {action && <div>{action}</div>}
    </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={clsx("p-4", className)}>
        {children}
    </div>
);
