
import React from 'react';
import { BottomSheet } from './components/BottomSheet';
import { playUISound } from './utils/uiSounds';

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
      onClick={(e) => {
        playUISound('tap');
        onClick?.(e);
      }}
      className={`ios-btn px-6 py-2.5 rounded-lg font-bold tracking-tight transition-all flex items-center justify-center gap-2 text-xs uppercase letter-spacing-widest active:scale-[0.98] ${variants[variant]} ${disabled ? 'opacity-30 cursor-not-allowed' : ''} ${className}`}
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
      <div className="px-5 py-3 md:px-8 md:py-5 border-b border-app-border flex items-center justify-between bg-app-surface-2">
        <h3 className="font-bold text-app-text-strong text-[10px] md:text-xs uppercase tracking-widest">{title}</h3>
        {extra}
      </div>
    )}
    <div className="p-4 md:p-8">
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
        onClick={() => { playUISound('tap'); onChange(Math.max(min, value - 1)); }}
        disabled={value <= min}
        className="ios-btn w-9 h-9 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-text-muted hover:text-app-accent hover:border-app-accent/40 disabled:opacity-20 transition-all active:scale-95 shadow-sm"
      >
        <i className="fa-solid fa-minus text-[10px]"></i>
      </button>
      <span className="flex-1 text-center text-sm font-black text-app-text-strong tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => { playUISound('tap'); onChange(Math.min(max, value + 1)); }}
        disabled={value >= max}
        className="ios-btn w-9 h-9 flex items-center justify-center rounded-lg bg-app-surface border border-app-border text-app-text-muted hover:text-app-accent hover:border-app-accent/40 disabled:opacity-20 transition-all active:scale-95 shadow-sm"
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
  const toggleOpen = () => {
    if (!isOpen) playUISound('open');
    setIsOpen(!isOpen);
  };

  // Content for both Mobile (Sheet) and Desktop (Popover)
  const OptionList = () => (
    <div className="flex flex-col max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar bg-app-surface scroll-smooth">
      {normalizedOptions.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            playUISound('tap');
            onChange(String(opt.value));
            setIsOpen(false);
          }}
          className={`ios-btn px-4 py-3 text-left text-xs font-bold border-b border-app-border last:border-0 hover:bg-app-surface-2 transition-colors flex items-center justify-between gap-4 group ${String(value) === String(opt.value) ? 'bg-blue-600/5 text-blue-500' : 'text-app-text-muted hover:text-app-text-strong'}`}
        >
          <span className="whitespace-nowrap">{opt.label}</span>
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
            className="ios-btn absolute right-0 top-0 bottom-0 px-2 flex items-center justify-center text-app-text-muted hover:text-app-text-strong"
          >
            <i className={`fa-solid fa-chevron-down text-[9px] opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
          </button>
        </div>
      ) : (
        <button
          type="button"
          ref={triggerRef as React.RefObject<HTMLButtonElement>}
          onClick={toggleOpen}
          className={`ios-btn flex items-center justify-between gap-2 px-3 py-2 bg-transparent border-none text-app-text-strong text-[11px] font-bold outline-none transition-all hover:text-app-text-strong w-full text-left ${className}`}
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
          className="w-48 bg-app-surface border border-app-border rounded-xl shadow-xl overflow-hidden mt-2 animate-ios-spring"
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
      onClick={() => {
        playUISound('tap');
        onClick();
      }}
      className={`
        md:hidden fixed z-[9999] right-4 bottom-[calc(24px+env(safe-area-inset-bottom))]
        flex items-center gap-3 px-5 py-4
        bg-[#2563EB] text-white rounded-[20px] shadow-[0_10px_40px_-10px_rgba(37,99,235,0.6)]
        active:scale-95 transition-all
        font-black uppercase tracking-widest text-[10px]
        border border-white/10 backdrop-blur-md
        ios-btn
        ${className}
      `}
    >
      <i className={`fa-solid ${icon} text-sm`}></i>
      {label && <span>{label}</span>}
    </button>
  );
};

export const SimpleMarkdown = ({ content }: { content: string }) => {
  if (!content) return null;

  const processText = (text: string) => {
    let html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-white mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-blue-400 mt-6 mb-3 uppercase tracking-wide">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-black text-white mt-8 mb-4 uppercase border-b border-gray-700 pb-2">$1</h1>')
      .replace(/^\- (.*$)/gm, '<li class="ml-4 list-disc text-gray-300 mb-1">$1</li>')
      .replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div
      className="prose prose-invert max-w-none text-sm leading-relaxed text-gray-300 font-medium"
      dangerouslySetInnerHTML={{ __html: processText(content) }}
    />
  );
};

export const DeletionBar: React.FC<{ count: number; onDelete: () => void; onArchive: () => void; onClear: () => void }> = ({ count, onDelete, onArchive, onClear }) => {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-fade pointer-events-auto">
      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{count} Selecionados</span>
      <div className="w-px h-4 bg-rose-500/20 mx-1"></div>
      <button onClick={onArchive} className="text-app-text-muted hover:text-app-text-strong text-[10px] font-black uppercase tracking-widest transition-all">Arquivar</button>
      <button onClick={onDelete} className="text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all ml-2">Excluir Permanente</button>
      <button onClick={onClear} className="text-[#4B5563] hover:text-app-text-strong text-[10px] font-black uppercase tracking-widest transition-all ml-1 underline">Limpar</button>
    </div>
  );
};

export const StatCard: React.FC<{ label: string; value: string | number; icon?: string; color?: "emerald" | "rose" | "blue" | "orange" | "slate"; onClick?: (e: React.MouseEvent) => void; active?: boolean }> = ({ label, value, icon, color = "blue", onClick, active }) => {
  const colors: any = { emerald: "text-emerald-500", rose: "text-rose-500", blue: "text-[#3B82F6]", orange: "text-orange-500", slate: "text-slate-400" };
  const borderColors: any = { emerald: "border-emerald-500/30 bg-emerald-500/5", rose: "border-rose-500/30 bg-rose-500/5", blue: "border-[#3B82F6]/30 bg-[#3B82F6]/5", orange: "border-orange-500/30 bg-orange-500/5", slate: "border-slate-400/30 bg-slate-400/5" };

  return (
    <div
      onClick={(e) => {
        if (onClick) {
          playUISound('tap');
          onClick(e);
        }
      }}
      className={`ios-btn p-4 md:p-6 rounded-2xl md:rounded-3xl border ${active ? borderColors[color] : 'bg-app-surface border-app-border'} flex flex-col gap-3 md:gap-4 transition-all ${onClick ? 'cursor-pointer hover:border-[#3B82F6]/20' : ''} shadow-xl group w-full`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-[9px] font-black tracking-[0.2em] transition-colors uppercase flex-1 ${active ? 'text-app-text-strong' : 'text-app-text-muted group-hover:text-app-text-strong'}`}>{label}</span>
        {icon && <i className={`fa-solid ${icon} transition-colors shrink-0 ml-2 ${active ? colors[color] : 'text-[#334155] group-hover:text-[#3B82F6]'}`}></i>}
      </div>
      <p className={`text-2xl md:text-3xl font-black tracking-tighter leading-none break-all ${colors[color]}`}>{value}</p>
    </div>
  );
};

export const LibraryEditorModal: React.FC<{ library: any; onClose: () => void }> = ({ library, onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md md:p-10 pointer-events-auto text-left">
      <div className="w-full h-full md:h-[80vh] md:max-w-4xl bg-app-surface-2 border border-app-border md:rounded-[30px] shadow-2xl flex flex-col">
        <div className="h-20 flex items-center justify-between px-10 border-b border-app-border">
          <h3 className="text-xl font-bold uppercase text-app-text-strong">Biblioteca de Formatos</h3>
          <button onClick={() => { playUISound('tap'); onClose(); }} className="ios-btn text-app-text-muted hover:text-app-text-strong">
            <i className="fa-solid fa-xmark text-2xl"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {Object.keys(library).map(net => (
              <div key={net} className="p-6 rounded-2xl bg-app-surface border border-app-border space-y-4">
                <h4 className="text-sm font-black text-[#3B82F6] uppercase">{net}</h4>
                <div className="flex flex-wrap gap-2">
                  {library[net].map((type: string, idx: number) => (
                    <Badge key={idx} color="slate">{type}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-10 border-t border-app-border text-right">
          <Button onClick={onClose}>Fechar</Button>
        </div>
      </div>
    </div>
  );
};

import { TipoTabela } from './types';
import { ROTULOS_TABELAS } from './constants';

export const ReorderTabsModal: React.FC<{ tabOrder: TipoTabela[]; setTabOrder: (order: TipoTabela[]) => void; onClose: () => void }> = ({ tabOrder, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-10 pointer-events-auto text-left">
      <div className="w-full max-w-lg bg-app-surface-2 border border-app-border rounded-2xl shadow-2xl p-8 flex flex-col">
        <h3 className="text-xl font-bold uppercase text-app-text-strong mb-6">Ordem das Abas</h3>
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 mb-8">
          {tabOrder.map((tab) => (
            <div key={tab} className="flex items-center gap-4 p-4 rounded-xl border border-app-border bg-app-surface">
              <span className="text-xs font-black uppercase text-app-text-strong">{ROTULOS_TABELAS[tab]}</span>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full h-12 !bg-[#3B82F6]">Fechar</Button>
      </div>
    </div>
  );
};

export const ColorPickerModal: React.FC<{ target: { id: string; value: string }; onClose: () => void; onConfirm: (color: string) => void }> = ({ target, onClose, onConfirm }) => {
  const PRESETS = [
    '#3B82F6', '#10b981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
    '#14B8A6', '#6366F1', '#F43F5E', '#84CC16', '#06B6D4', '#D946EF',
    '#1E293B', '#64748B', '#94A3B8', '#CBD5E1'
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade pointer-events-auto" onClick={onClose}>
      <div className="bg-app-surface-2 border border-app-border rounded-3xl p-8 shadow-2xl space-y-6 w-full max-w-sm transform transition-all scale-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-app-text-strong tracking-widest">Escolher Cor</h3>
          <button onClick={() => { playUISound('tap'); onClose(); }} className="ios-btn text-app-text-muted hover:text-app-text-strong transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {PRESETS.map(color => (
            <button
              key={color}
              onClick={() => { playUISound('tap'); onConfirm(color); }}
              className="ios-btn group aspect-square rounded-2xl border border-white/10 hover:border-white transition-all shadow-lg hover:shadow-xl hover:shadow-white/10 relative overflow-hidden"
              style={{ backgroundColor: color }}
            >
              {target.value === color && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><i className="fa-solid fa-check text-app-text-strong drop-shadow-md"></i></div>}
            </button>
          ))}

          <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-600 hover:border-white transition-all flex items-center justify-center relative cursor-pointer group bg-app-surface">
            <i className="fa-solid fa-plus text-app-text-muted group-hover:text-app-text-strong text-xl"></i>
            <input
              type="color"
              value={target.value}
              onChange={e => onConfirm(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-app-border flex gap-2">
          <div className="flex-1 h-10 rounded-xl bg-app-surface border border-app-border flex items-center px-4 gap-3">
            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: target.value }}></div>
            <span className="text-xs font-bold text-app-text-muted uppercase tracking-widest">{target.value}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
