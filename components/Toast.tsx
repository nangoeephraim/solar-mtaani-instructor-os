import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle, XCircle, Info, X, Loader2, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastContextType {
    showToast: (message: string, type?: ToastMessage['type']) => string;
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

interface ToastItemProps {
    toast: ToastMessage;
    onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
    const getIcon = (type: ToastMessage['type']) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="text-emerald-500" />;
            case 'error': return <XCircle size={20} className="text-rose-500" />;
            case 'info': return <Info size={20} className="text-blue-500" />;
            case 'warning': return <AlertTriangle size={20} className="text-amber-500" />;
            case 'loading': return <Loader2 size={20} className="text-indigo-500 animate-spin" />;
        }
    };

    const getStyles = (type: ToastMessage['type']) => {
        switch (type) {
            case 'success': return 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-100';
            case 'error': return 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-100';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100';
            case 'warning': return 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100';
            case 'loading': return 'bg-indigo-50 border-indigo-200 text-indigo-900 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-100';
        }
    };

    const getProgressColor = (type: ToastMessage['type']) => {
        switch (type) {
            case 'success': return 'bg-emerald-500';
            case 'error': return 'bg-rose-500';
            case 'info': return 'bg-blue-500';
            case 'warning': return 'bg-amber-500';
            case 'loading': return 'bg-indigo-500';
        }
    };

    const duration = toast.type === 'error' ? 5000 : 3000;

    useEffect(() => {
        if (toast.type === 'loading') return;

        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast, onDismiss, duration]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={clsx(
                "pointer-events-auto relative overflow-hidden flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md min-w-[320px] max-w-md",
                getStyles(toast.type)
            )}
        >
            <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type)}
            </div>
            <div className="flex-1 mr-2">
                <p className="text-sm font-bold capitalize">{toast.type}</p>
                <p className="text-sm opacity-90 leading-relaxed mt-0.5">{toast.message}</p>
            </div>
            <button
                onClick={() => onDismiss(toast.id)}
                className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors -mr-1 -mt-1"
            >
                <X size={16} className="opacity-60" />
            </button>

            {/* Progress Bar */}
            {toast.type !== 'loading' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
                    <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: duration / 1000, ease: "linear" }}
                        className={clsx("h-full", getProgressColor(toast.type))}
                    />
                </div>
            )}
        </motion.div>
    );
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

        return id;
    }, []);

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
            // Dismiss loading toast immediately
            dismissToast(id);
            // Show success toast
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

    return (
        <ToastContext.Provider value={{ showToast, dismissToast, promise }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
