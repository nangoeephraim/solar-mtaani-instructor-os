import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ElementType;
    action?: React.ReactNode;
    color?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, icon: Icon, action, color = "text-[var(--md-sys-color-primary)]" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
        >
            <div className="flex items-center gap-4">
                {Icon && (
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)]",
                            color
                        )}
                    >
                        <Icon size={24} />
                    </motion.div>
                )}
                <div>
                    <h1 className="text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[var(--md-sys-color-secondary)] font-medium mt-1">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {action && (
                <div className="flex items-center gap-3">
                    {action}
                </div>
            )}
        </motion.div>
    );
};

export default PageHeader;
