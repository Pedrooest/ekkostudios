
import React from 'react';

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
    <div className="p-0">
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

export const FloatingPopover: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'end';
}> = ({ isOpen, onClose, triggerRef, children, className = '', align = 'end' }) => {
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const top = rect.bottom + 8;
      let left = rect.left;

      // Simple adjustment for alignment
      // We need to wait for render to get popover width, but for now specific widths are passed via className usually
      // If align end, we align right edge to trigger right edge
      if (align === 'end') {
        left = rect.right;
        // We will handle the offset in style using transform if needed or just calculation
        // But since we don't know width yet, we can't subtract width exactly without a Ref measurement
      }
      setPosition({ top, left });
    }
  }, [isOpen, triggerRef, align]);

  // Adjust position after render to correct for width if align=end
  React.useLayoutEffect(() => {
    if (isOpen && popoverRef.current && align === 'end') {
      const rect = popoverRef.current.getBoundingClientRect();
      setPosition(prev => ({ ...prev, left: prev.left - rect.width }));
    }
  }, [isOpen, align]);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={`fixed z-[9999] animate-fade ${className}`}
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>
  );
};
