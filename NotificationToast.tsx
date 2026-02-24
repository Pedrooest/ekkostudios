import React, { useEffect, useState } from 'react';
import { NotificacaoApp } from './types';

interface Props {
    notification: NotificacaoApp;
    onClose: (id: string) => void;
}

export const NotificationToast: React.FC<Props> = ({ notification, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (isPaused) return;

        const timer = setTimeout(() => {
            handleClose();
        }, 3500);

        return () => clearTimeout(timer);
    }, [isPaused, notification.id]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(notification.id), 400);
    };

    const getIcon = () => {
        switch (notification.tipo) {
            case 'success': return 'fa-circle-check text-emerald-400';
            case 'error': return 'fa-circle-xmark text-rose-500';
            case 'warning': return 'fa-triangle-exclamation text-amber-400';
            default: return 'fa-circle-info text-blue-400';
        }
    };

    return (
        <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`
        pointer-events-auto w-[340px] mt-3 overflow-hidden
        bg-slate-900/60 backdrop-blur-xl border border-white/10
        shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl
        transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}
      `}
        >
            <div className="p-4 flex items-start gap-4">
                <i className={`fa-solid ${getIcon().split(' ')[0]} ${getIcon().split(' ')[1]} mt-1 text-lg`}></i>
                <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.1em] text-white">
                        {notification.titulo}
                    </h4>
                    <p className="text-[12px] font-medium text-gray-300 mt-0.5 leading-snug">
                        {notification.mensagem}
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                >
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                </button>
            </div>

            {/* Visual Progress Bar (Timer) */}
            <div className="h-[4px] w-full bg-white/5 mt-1">
                <div
                    className={`h-full bg-white/60 toast-progress-bar ${isPaused ? 'toast-progress-bar-paused' : ''}`}
                />
            </div>
        </div>


    );
};
