import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    description?: string;
    disabled?: boolean;
    iconOn?: React.ReactNode;
    iconOff?: React.ReactNode;
}

const sizes = {
    sm: { width: 'w-10', height: 'h-5', knob: 'w-3 h-3', translate: 'translate-x-5' },
    md: { width: 'w-14', height: 'h-7', knob: 'w-5 h-5', translate: 'translate-x-7' },
    lg: { width: 'w-16', height: 'h-8', knob: 'w-6 h-6', translate: 'translate-x-8' },
};

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
    checked,
    onChange,
    size = 'md',
    label,
    description,
    disabled = false,
    iconOn,
    iconOff
}) => {
    const s = sizes[size];

    return (
        <label className={clsx("flex items-center justify-between cursor-pointer w-full", disabled && "opacity-50 cursor-not-allowed")}>
            {(label || description) && (
                <div className="flex flex-col pr-4">
                    {label && <span className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">{label}</span>}
                    {description && <span className="text-xs text-[var(--md-sys-color-secondary)]">{description}</span>}
                </div>
            )}

            <div className="relative flex items-center">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                />

                {/* Track */}
                <motion.div
                    className={clsx(
                        s.width, s.height,
                        "rounded-full flex items-center px-1 transition-colors duration-300 ease-in-out shadow-inner",
                        checked ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-surface-variant)]"
                    )}
                >
                    {/* Knob */}
                    <motion.div
                        className={clsx(
                            s.knob,
                            "bg-white rounded-full shadow-md flex items-center justify-center relative overflow-hidden",
                            checked ? "shadow-[var(--md-sys-color-primary)]" : "shadow-gray-300"
                        )}
                        initial={false}
                        animate={{
                            x: checked ? (size === 'sm' ? 20 : size === 'md' ? 28 : 32) : 0,
                            scale: 1,
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        whileHover={{ scale: disabled ? 1 : 1.1 }}
                        whileTap={{ scale: disabled ? 1 : 0.9 }}
                    >
                        {/* Icons inside the knob */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center text-[var(--md-sys-color-primary)]"
                            initial={false}
                            animate={{ opacity: checked ? 1 : 0, scale: checked ? 1 : 0.5 }}
                        >
                            {iconOn || (
                                <svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4 stroke-current stroke-[3] stroke-linecap-round stroke-linejoin-round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            )}
                        </motion.div>
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center text-gray-400"
                            initial={false}
                            animate={{ opacity: checked ? 0 : 1, scale: checked ? 0.5 : 1 }}
                        >
                            {iconOff || (
                                <svg viewBox="0 0 24 24" fill="none" className="w-3/4 h-3/4 stroke-current stroke-[3] stroke-linecap-round stroke-linejoin-round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            )}
                        </motion.div>
                    </motion.div>
                </motion.div>
            </div>
        </label>
    );
};
