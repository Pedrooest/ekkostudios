import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    children,
    title,
    className = ""
}) => {
    const [isRendered, setIsRendered] = useState(false);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            setTimeout(() => setAnimate(true), 10);
            document.body.style.overflow = 'hidden';
        } else {
            setAnimate(false);
            const timer = setTimeout(() => {
                setIsRendered(false);
                document.body.style.overflow = '';
            }, 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isRendered) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            ></div>

            {/* Sheet Content */}
            <div
                className={`
                    relative w-full sm:w-[500px] sm:rounded-2xl bg-app-surface border-t sm:border border-app-border 
                    rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] 
                    flex flex-col max-h-[85vh] sm:max-h-[80vh]
                    transition-transform duration-300 ease-out
                    ${animate ? 'translate-y-0' : 'translate-y-full sm:translate-y-10 sm:opacity-0'}
                    ${className}
                `}
            >
                {/* Drag Handle (Mobile Visual Queue) */}
                <div className="w-full flex justify-center pt-3 pb-1 sm:hidden shrink-0" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors cursor-pointer"></div>
                </div>

                {/* Header */}
                {(title) && (
                    <div className="px-6 py-4 border-b border-app-border flex items-center justify-between shrink-0">
                        <h3 className="text-sm font-black uppercase tracking-widest text-app-text-strong">{title}</h3>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-app-surface-2 hover:bg-white/10 flex items-center justify-center text-app-text-muted hover:text-white transition-all"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                )}

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
