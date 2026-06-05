import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
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
        }, 4000);

        return () => clearTimeout(timer);
    }, [isPaused, notification.id]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(notification.id), 400);
    };

    const config = {
        success: {
            icon: <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />,
            iconBg: 'bg-emerald-500/15',
            accent: 'bg-emerald-500',
            bar: 'bg-emerald-500/60',
        },
        error: {
            icon: <XCircle size={18} className="text-rose-400 shrink-0" />,
            iconBg: 'bg-rose-500/15',
            accent: 'bg-rose-500',
            bar: 'bg-rose-500/60',
        },
        warning: {
            icon: <AlertTriangle size={18} className="text-amber-400 shrink-0" />,
            iconBg: 'bg-amber-500/15',
            accent: 'bg-amber-500',
            bar: 'bg-amber-500/60',
        },
        info: {
            icon: <Info size={18} className="text-blue-400 shrink-0" />,
            iconBg: 'bg-blue-500/15',
            accent: 'bg-blue-500',
            bar: 'bg-blue-500/60',
        },
    };

    const c = config[notification.tipo] || config.info;

    return (
        <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`
        pointer-events-auto w-[340px] mt-3 overflow-hidden relative
        bg-zinc-950/90 backdrop-blur-xl border border-white/[0.08]
        shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-2xl
        transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isExiting ? 'animate-toast-out' : 'animate-toast-in'}
      `}
        >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${c.accent} rounded-l-2xl`} />

            <div className="p-4 pl-5 flex items-start gap-3.5">
                {/* Icon container */}
                <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    {c.icon}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.12em] text-white leading-tight">
                        {notification.titulo}
                    </h4>
                    {notification.mensagem && (
                        <p className="text-[11px] font-medium text-zinc-400 mt-0.5 leading-snug">
                            {notification.mensagem}
                        </p>
                    )}
                    {/* Error recovery action (ui-ux-pro-max: provide next step) */}
                    {notification.action && (
                        <button
                            onClick={() => { notification.action!.onClick(); handleClose(); }}
                            className={`mt-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all active:scale-95 ${
                                notification.tipo === 'error'
                                    ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                                    : 'bg-white/10 text-zinc-200 hover:bg-white/20'
                            }`}
                        >
                            {notification.action.label}
                        </button>
                    )}
                </div>

                <button
                    onClick={handleClose}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/10 transition-all shrink-0 mt-0.5"
                >
                    <X size={11} />
                </button>
            </div>

            {/* Progress bar */}
            <div className="h-[2px] w-full bg-white/5">
                <div
                    className={`h-full ${c.bar} toast-progress-bar ${isPaused ? 'toast-progress-bar-paused' : ''}`}
                />
            </div>
        </div>
    );
};
