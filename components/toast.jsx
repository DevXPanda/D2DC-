"use client";
import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), duration);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ toast: {
            success: (msg) => addToast(msg, 'success'),
            error: (msg) => addToast(msg, 'error'),
            info: (msg) => addToast(msg, 'info'),
        } }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 min-w-[320px]">
                {toasts.map(t => (
                    <div key={t.id} className={`flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 ${
                        t.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' :
                        t.type === 'error' ? 'bg-rose-50/90 border-rose-200 text-rose-900' :
                        'bg-white/90 border-gray-200 text-gray-900'
                    }`}>
                        <div className={`p-2 rounded-xl scale-110 ${
                            t.type === 'success' ? 'bg-emerald-500 text-white' :
                            t.type === 'error' ? 'bg-rose-500 text-white' :
                            'bg-primary-600 text-white'
                        }`}>
                            {t.type === 'success' && <CheckCircle className="h-4 w-4" />}
                            {t.type === 'error' && <AlertCircle className="h-4 w-4" />}
                            {t.type === 'info' && <Info className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-[13px] font-medium leading-tight">{t.message}</p>
                        </div>
                        <button 
                            onClick={() => removeToast(t.id)} 
                            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4 text-gray-400" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
