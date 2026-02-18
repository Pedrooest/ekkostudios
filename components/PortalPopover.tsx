import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

interface PortalPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement>;
    children: React.ReactNode;
    className?: string;
    align?: 'start' | 'end';
}

export const PortalPopover: React.FC<PortalPopoverProps> = ({ isOpen, onClose, triggerRef, children, className = "", align = 'start' }) => {
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Update position when opened
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;

            // Basic positioning: below the trigger
            let top = rect.bottom + scrollY + 8; // 8px offset
            let left = rect.left;

            setPosition({ top, left });
        }
    }, [isOpen, triggerRef, align, className]);

    useEffect(() => {
        const handleScroll = () => { if (isOpen) onClose(); }; // Close on scroll for simplicity
        const handleResize = () => { if (isOpen) onClose(); };
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div id="portal-popover-container" className="fixed inset-0 z-[9999] flex items-end sm:block sm:items-start pointer-events-none">
            {/* Backdrop: Transparent on desktop, maybe semi-transparent on mobile? keeping transparent for now as per request for "overlay layer" */}
            <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose} />

            {/* Content Wrapper */}
            <div
                className={`
           absolute z-[10000] pointer-events-auto animate-fade 
           w-full sm:w-auto sm:fixed
           bottom-0 sm:bottom-auto
           left-0 sm:left-auto
           ${className}
         `}
                style={{
                    // Mobile: fixed bottom (handled by css classes above - left-0, bottom-0, w-full)
                    // Desktop: calculated position
                    ...(window.innerWidth >= 640 ? {
                        top: position.top,
                        left: align === 'end' ? 'auto' : position.left,
                        right: align === 'end' ? (document.body.clientWidth - (triggerRef.current?.getBoundingClientRect().right || 0)) : 'auto'
                    } : {
                        // Mobile overrides
                        bottom: 0,
                        left: 0,
                        right: 0,
                        top: 'auto'
                    })
                }}
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
};
