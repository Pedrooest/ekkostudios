
import React from 'react';
import { BottomSheet } from './components/BottomSheet';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  className?: string;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ onClick, children, variant = 'primary', className = '', disabled = false, title, type = 'button', ...props }, ref) => {
  const variants = {
    primary: 'bg-app-accent text-white hover:bg-app-accent-hover border-none shadow-md',
    secondary: 'bg-transparent text-app-text-strong text-xs border border-app-border-strong hover:bg-app-surface-2 hover:border-app-accent hover:text-app-accent',
    danger: 'bg-transparent text-rose-500 border border-rose-500/30 hover:bg-rose-500/10',
    ghost: 'bg-transparent text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2',
    success: 'bg-transparent text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/10'
  };

  return (
    <button
      ref={ref}
      title={title}
      disabled={disabled}
      type={type}
      onClick={onClick}
      className={`px-6 py-2.5 rounded-lg font-bold tracking-tight transition-all flex items-center justify-center gap-2 text-xs uppercase letter-spacing-widest active:scale-[0.98] ${variants[variant]} ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export const Card: React.FC<{ children: React.ReactNode; title?: string; extra?: React.ReactNode; className?: string }> = ({ children, title, extra, className = "" }) => (
  <div className={`bg-app-surface rounded-xl border border-app-border overflow-hidden mb-6 shadow-sm ${className}`}>
    {(title || extra) && (
      <div className="px-8 py-5 border-b border-app-border flex items-center justify-between bg-app-surface-2">
        <h3 className="font-bold text-app-text-strong text-xs uppercase tracking-widest">{title}</h3>
        {extra}
      </div>
    )}
    <div className="p-6 md:p-8">
      {children}
    </div>
  </div>
);

// Added style prop to Badge component to support dynamic inline styles from App.tsx
export const Badge: React.FC<{ children: React.ReactNode; color?: string; className?: string; style?: React.CSSProperties }> = ({ children, color = 'blue', className = '', style }) => {
  const colors: any = {
    blue: 'border-app-border text-app-text-muted',
    green: 'border-emerald-500/30 text-emerald-600',
    red: 'border-rose-500/30 text-rose-600',
    orange: 'border-amber-500/30 text-amber-600',
    slate: 'border-app-border text-app-text-muted'
  };
  return (
    <span style={style} className={`px-2.5 py-1 rounded-md text-[9px] uppercase tracking-widest font-bold border ${colors[color] || colors.blue} ${className}`}>
      {children}
    </span>
  );
};

export const Stepper: React.FC<{
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  className?: string;
}> = ({ value, onChange, min = 1, max = 5, className = "" }) => {
  return (
    <div className={`flex items-center gap-3 bg-app-surface-2 p-1.5 rounded-xl border border-app-border w-fit min-w-[140px] justify-between ${className}`}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-text-muted hover:text-app-accent hover:border-app-accent/40 disabled:opacity-20 transition-all active:scale-95 shadow-sm"
      >
        <i className="fa-solid fa-minus text-[10px]"></i>
      </button>
      <span className="flex-1 text-center text-sm font-black text-app-text-strong tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-9 h-9 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-text-muted hover:text-app-accent hover:border-app-accent/40 disabled:opacity-20 transition-all active:scale-95 shadow-sm"
      >
        <i className="fa-solid fa-plus text-[10px]"></i>
      </button>
    </div>
  );
};

import { createPortal } from 'react-dom';

export const FloatingPopover: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end';
}> = ({ isOpen, onClose, triggerRef, children, className = '', align = 'start' }) => {
  const [coords, setCoords] = React.useState({ top: 0, left: 0, width: 0 });
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const updatePosition = () => {
      if (isOpen && triggerRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const popoverRect = popoverRef.current?.getBoundingClientRect();

        let top = triggerRect.bottom + window.scrollY + 8;
        let left = triggerRect.left + window.scrollX;
        let width = triggerRect.width;

        // Auto-flip if not enough space below
        if (popoverRect) {
          const spaceBelow = window.innerHeight - triggerRect.bottom;
          const spaceAbove = triggerRect.top;
          if (spaceBelow < popoverRect.height && spaceAbove > popoverRect.height) {
            top = triggerRect.top + window.scrollY - popoverRect.height - 8;
          }
        }

        if (align === 'start') {
          // Default left
        } else if (align === 'end') {
          left = triggerRect.right + window.scrollX - (popoverRect?.width || 0);
        }

        setCoords({ top, left, width });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef, align]);

  // Click outside listener
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // document.body.style.overflow = 'hidden'; // Optional: lock body scroll on mobile? No, bad UX for dropdowns.
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // document.body.style.overflow = '';
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={`fixed z-[9999] animate-fade shadow-2xl ${className}`}
      style={{
        top: coords.top - window.scrollY, // Adjust to Fixed by subtracting scrollY since we added it for absolute calc logic, or just use Viewport rects directly. Let's simplify to Fixed.
        left: coords.left - window.scrollX,
        // Logic fix: createdPortal renders in body. If we use 'fixed' position, coordinates should be relative to viewport (rect), not document (rect + scroll).
        // Let's re-do the calc logic in the effect below for clarity.
      }}
    >
      {children}
    </div>,
    document.body
  );
};

// Re-write of the logic block mainly to correct the Fixed positioning logic inside the tool call:
/* 
  Correct Logic for Fixed Positioning (Portal):
  Top = triggerRect.bottom (space below)
*/

export const InputSelect: React.FC<{
  value: string | number;
  onChange: (val: string) => void;
  options: (string | { value: string | number; label: string })[];
  placeholder?: string;
  className?: string; // Additional classes for the trigger
  label?: string; // Label for BottomSheet
  editable?: boolean; // Allow custom text input
}> = ({ value, onChange, options, placeholder = "Selecione...", className = "", label, editable = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 1024);
  const triggerRef = React.useRef<HTMLButtonElement | HTMLInputElement>(null);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Normalize options
  const normalizedOptions = options.map(o => typeof o === 'object' ? o : { value: o, label: o });
  const currentLabel = normalizedOptions.find(o => String(o.value) === String(value))?.label || value || placeholder;

  // Handle desktop popover toggle
  const toggleOpen = () => setIsOpen(!isOpen);

  // Content for both Mobile (Sheet) and Desktop (Popover)
  const OptionList = () => (
    <div className="flex flex-col max-h-[60vh] overflow-y-auto custom-scrollbar bg-app-surface">
      {normalizedOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            onChange(String(opt.value));
            setIsOpen(false);
          }}
          className={`px-4 py-3 text-left text-xs font-bold border-b border-app-border last:border-0 hover:bg-app-surface-2 transition-colors flex items-center justify-between group ${String(value) === String(opt.value) ? 'bg-blue-600/5 text-blue-500' : 'text-app-text-muted hover:text-app-text-strong'}`}
        >
          <span>{opt.label}</span>
          {String(value) === String(opt.value) && <i className="fa-solid fa-check text-blue-500"></i>}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {editable ? (
        <div className="relative w-full">
          <input
            ref={triggerRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 bg-transparent border-none text-app-text-strong text-[11px] font-bold outline-none transition-all hover:text-blue-500 ${className}`}
          />
          <button
            type="button"
            onClick={toggleOpen}
            className="absolute right-0 top-0 bottom-0 px-2 flex items-center justify-center text-app-text-muted hover:text-app-text-strong"
          >
            <i className={`fa-solid fa-chevron-down text-[9px] opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
          </button>
        </div>
      ) : (
        <button
          type="button"
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          onClick={toggleOpen}
          className={`flex items-center justify-between gap-2 px-3 py-2 bg-transparent border-none text-app-text-strong text-[11px] font-bold outline-none transition-all hover:text-app-text-strong w-full text-left ${className}`}
        >
          <span className="truncate">{currentLabel}</span>
          <i className={`fa-solid fa-chevron-down text-[9px] opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
        </button>
      )}

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <BottomSheet
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title={label || placeholder}
        >
          <div className="bg-app-surface">
            <OptionList />
          </div>
        </BottomSheet>
      )}

      {/* Desktop Popover */}
      {!isMobile && (
        <FloatingPopover
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          triggerRef={triggerRef}
          align="start"
          className="w-48 bg-app-surface border border-app-border rounded-xl shadow-xl overflow-hidden mt-2"
        >
          <OptionList />
        </FloatingPopover>
      )}
    </>
  );
};

export const MobileFloatingAction: React.FC<{
  onClick: () => void;
  icon?: string;
  label?: string;
  className?: string;
}> = ({ onClick, icon = "fa-plus", label = "Novo", className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`
        md:hidden fixed z-[9999] right-4 bottom-[calc(24px+env(safe-area-inset-bottom))]
        flex items-center gap-3 px-5 py-4
        bg-[#2563EB] text-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(37,99,235,0.6)]
        active:scale-95 transition-all
        font-black uppercase tracking-widest text-[10px]
        border border-white/10 backdrop-blur-md
        ${className}
      `}
    >
      <i className={`fa-solid ${icon} text-sm`}></i>
      {label && <span>{label}</span>}
    </button>
  );
};
