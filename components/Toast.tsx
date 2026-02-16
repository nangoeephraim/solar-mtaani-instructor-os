import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle, XCircle, Info, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastContextType {
    showToast: (message: string, type?: ToastMessage['type']) => void;
    dismissToast: (id: string) => void;
    promise: <T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newToast: ToastMessage = { id, message, type };

        setToasts(prev => {
            // Limit to 5 toasts
            const updated = [...prev, newToast];
            if (updated.length > 5) return updated.slice(updated.length - 5);
            return updated;
        });

        // Auto-dismiss logic
        if (type !== 'loading') {
            const duration = type === 'error' ? 5000 : 3000;
            setTimeout(() => {
                dismissToast(id);
            }, duration);
        }

        return id; // Return ID for manual dismissal if needed
    }, [dismissToast]);

    const promise = useCallback(async <T,>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ): Promise<T> => {
        const id = showToast(messages.loading, 'loading');

        try {
            const data = await promise;
            // Update the existing toast to success
            dismissToast(id);
            const successMsg = typeof messages.success === 'function'
                ? messages.success(data)
                : messages.success;
            showToast(successMsg, 'success');
            return data;
        } catch (error) {
            dismissToast(id);
            const errorMsg = typeof messages.error === 'function'
                ? messages.error(error)
                : messages.error;
            showToast(errorMsg, 'error');
            throw error;
        }
    }, [showToast, dismissToast]);

    const getIcon = (type: ToastMessage['type']) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="text-emerald-500" />;
            case 'error': return <XCircle size={20} className="text-rose-500" />;
            case 'info': return <Info size={20} className="text-blue-500" />;
            case 'loading': return <Loader2 size={20} className="text-indigo-500 animate-spin" />;
        }
    };

    const getStyles = (type: ToastMessage['type']) => {
        switch (type) {
            case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-100';
            case 'error': return 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-100';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100';
            case 'loading': return 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-100';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, dismissToast, promise }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            layout
                            className={clsx(
                                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md min-w-[320px] max-w-md",
                                getStyles(toast.type)
                            )}
                        >
                            <div className="flex-shrink-0 mt-0.5">
                                {getIcon(toast.type)}
                            </div>
                            <div className="flex-1 mr-2">
                                <p className="text-sm font-semibold">{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</p>
                                <p className="text-sm opacity-90 leading-relaxed mt-0.5">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => dismissToast(toast.id)}
                                className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors -mr-1 -mt-1"
                            >
                                <X size={16} className="opacity-60" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
