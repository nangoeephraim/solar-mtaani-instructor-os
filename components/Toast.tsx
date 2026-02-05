import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastMessage } from '../types';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

interface ToastContextType {
    showToast: (message: string, type?: ToastMessage['type']) => void;
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

    const showToast = useCallback((message: string, type: ToastMessage['type'] = 'success') => {
        const id = Date.now().toString();
        const newToast: ToastMessage = { id, message, type };

        setToasts(prev => [...prev, newToast]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    const dismissToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const getIcon = (type: ToastMessage['type']) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="text-emerald-500" />;
            case 'error': return <XCircle size={20} className="text-rose-500" />;
            case 'info': return <Info size={20} className="text-blue-500" />;
        }
    };

    const getStyles = (type: ToastMessage['type']) => {
        switch (type) {
            case 'success': return 'border-l-emerald-500 bg-emerald-50';
            case 'error': return 'border-l-rose-500 bg-rose-50';
            case 'info': return 'border-l-blue-500 bg-blue-50';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[100] space-y-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={clsx(
                            "pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-xl border-l-4 animate-fade-in min-w-[300px] max-w-md",
                            getStyles(toast.type)
                        )}
                    >
                        {getIcon(toast.type)}
                        <p className="flex-1 text-sm font-medium text-slate-700">{toast.message}</p>
                        <button
                            onClick={() => dismissToast(toast.id)}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={16} className="text-slate-400" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export default ToastProvider;
