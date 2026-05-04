import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Zap, Instagram, Youtube, Facebook, Linkedin,
  MessageCircle, Send, Globe, Trash2, Clock, Users,
  Layout, Target, Mic2, Flame, Droplets, Snowflake,
  ChevronDown, CheckCircle2
} from 'lucide-react';
import { Cliente } from '../types';

interface CoboDrawerProps {
  item: any | null;
  cliente: Cliente | undefined;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onClose: () => void;
}

const CANAIS = [
  'Instagram Reels', 'Instagram Feed', 'Instagram Stories',
  'YouTube Shorts', 'YouTube Vídeo longo',
  'TikTok', 'LinkedIn', 'Facebook', 'Pinterest', 'Kwai',
  'WhatsApp', 'Email', 'Telegram',
];
const FREQUENCIAS = ['Diário', '5x por semana', '3x por semana', '2x por semana', 'Semanal', 'Quinzenal', 'Mensal', 'Sob demanda'];
const PUBLICOS    = ['Frio', 'Morno', 'Quente', 'Leads', 'Clientes', 'Comunidade'];
const VOZES       = ['Educativa', 'Autoridade', 'Conversacional', 'Provocativa', 'Inspiradora', 'Técnica', 'Humana/Próxima', 'Comercial'];
const INTENCOES   = ['Atenção', 'Engajamento', 'Educação', 'Autoridade', 'Desejo', 'Conversão', 'Relacionamento', 'Retenção'];
const FORMATOS    = ['Vídeo curto', 'Carrossel', 'Post imagem', 'Stories', 'Live', 'Bastidores', 'Tutorial', 'Prova social', 'Oferta', 'Texto educativo'];

const CHANNEL_META: Record<string, { color: string; gradient: string; textColor: string; icon: React.ReactNode }> = {
  instagram: { color: '#e1306c', gradient: 'from-pink-500 via-rose-500 to-orange-400', textColor: 'text-pink-500', icon: <Instagram size={20} /> },
  youtube:   { color: '#ff0000', gradient: 'from-red-600 to-red-400',                  textColor: 'text-red-500',  icon: <Youtube size={20} /> },
  tiktok:    { color: '#010101', gradient: 'from-zinc-800 to-zinc-600',                 textColor: 'text-zinc-700', icon: <Mic2 size={20} /> },
  facebook:  { color: '#1877f2', gradient: 'from-blue-600 to-blue-400',                textColor: 'text-blue-500', icon: <Facebook size={20} /> },
  linkedin:  { color: '#0a66c2', gradient: 'from-sky-600 to-sky-400',                  textColor: 'text-sky-500',  icon: <Linkedin size={20} /> },
  whatsapp:  { color: '#25d366', gradient: 'from-emerald-500 to-green-400',            textColor: 'text-emerald-500', icon: <MessageCircle size={20} /> },
  telegram:  { color: '#0088cc', gradient: 'from-cyan-500 to-sky-400',                 textColor: 'text-cyan-500', icon: <Send size={20} /> },
};
const getChannelMeta = (canal: string) => {
  const k = (canal || '').toLowerCase();
  for (const [key, val] of Object.entries(CHANNEL_META)) {
    if (k.includes(key)) return val;
  }
  return { color: '#6366f1', gradient: 'from-indigo-500 to-violet-500', textColor: 'text-indigo-500', icon: <Globe size={20} /> };
};

const ZONA_CONFIG = [
  { value: 'Primária',   label: 'Quente',    desc: 'Conversão direta',  icon: <Flame size={14} />,     gradient: 'from-orange-500/20 to-amber-500/10', border: 'border-orange-400/50 dark:border-orange-500/40', text: 'text-orange-600 dark:text-orange-400', activeBg: 'bg-orange-50 dark:bg-orange-500/15' },
  { value: 'Conversão',  label: 'Conversão', desc: 'Fundo de funil',    icon: <Flame size={14} />,     gradient: 'from-orange-400/20 to-amber-400/10', border: 'border-orange-300/50 dark:border-orange-500/30', text: 'text-orange-500 dark:text-orange-400', activeBg: 'bg-orange-50 dark:bg-orange-500/15' },
  { value: 'Secundária', label: 'Morna',     desc: 'Nutrição de lead',  icon: <Droplets size={14} />,  gradient: 'from-amber-400/20 to-yellow-400/10', border: 'border-amber-400/50 dark:border-amber-500/40',  text: 'text-amber-600 dark:text-amber-400',  activeBg: 'bg-amber-50 dark:bg-amber-500/15' },
  { value: 'Nutrição',   label: 'Nutrição',  desc: 'Meio de funil',     icon: <Droplets size={14} />,  gradient: 'from-amber-400/20 to-yellow-400/10', border: 'border-amber-300/50 dark:border-amber-400/30',  text: 'text-amber-500 dark:text-amber-400',  activeBg: 'bg-amber-50 dark:bg-amber-500/15' },
  { value: 'Paralela',   label: 'Fria',      desc: 'Aquisição fria',    icon: <Snowflake size={14} />, gradient: 'from-blue-400/20 to-sky-400/10',     border: 'border-blue-400/50 dark:border-blue-500/40',    text: 'text-blue-600 dark:text-blue-400',    activeBg: 'bg-blue-50 dark:bg-blue-500/15' },
  { value: 'Aquisição',  label: 'Aquisição', desc: 'Topo de funil',     icon: <Snowflake size={14} />, gradient: 'from-blue-400/20 to-sky-400/10',     border: 'border-blue-300/50 dark:border-blue-400/30',    text: 'text-blue-500 dark:text-blue-400',    activeBg: 'bg-blue-50 dark:bg-blue-500/15' },
];

// Reusable field row — no absolute-positioned icons, clean layout
function FieldRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        <span className="opacity-70">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

// Premium input
function PInput({ value, defaultValue, onBlur, placeholder, list, id }: React.InputHTMLAttributes<HTMLInputElement> & { id?: string }) {
  return (
    <>
      <input
        list={list}
        id={id}
        defaultValue={defaultValue}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60 transition-all duration-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
      />
      {list && <datalist id={list}>{/* injected externally */}</datalist>}
    </>
  );
}

// Premium select
function PSelect({ value, onChange, children, className = '' }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full h-11 px-4 pr-9 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60 transition-all duration-200 appearance-none cursor-pointer ${className}`}
      >
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
    </div>
  );
}

export function CoboDrawer({ item, cliente, onUpdate, onDelete, onClose }: CoboDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    // Trigger enter animation after mount
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 320);
  };

  const handleUpdate = (field: string, value: any) => {
    setSaving(field);
    onUpdate(field, value);
    setTimeout(() => setSaving(null), 1200);
  };

  if (!item) return null;

  const ch = getChannelMeta(item.Canal);
  const clientColor = cliente?.['Cor (HEX)'] || ch.color;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: visible ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0)',
          backdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
        }}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full w-full sm:w-[520px] bg-white dark:bg-[#111114] z-50 shadow-[−40px_0_80px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
        style={{
          transition: 'transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Channel hero header */}
        <div className="relative shrink-0 overflow-hidden">
          {/* Gradient background */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${ch.gradient} opacity-15 dark:opacity-20`}
          />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle at 80% 20%, ${ch.color}, transparent 60%)`,
            }}
          />

          <div className="relative px-6 pt-6 pb-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {/* Channel icon bubble */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${ch.color}25, ${ch.color}10)`,
                    border: `1.5px solid ${ch.color}30`,
                  }}
                >
                  <span style={{ color: ch.color }}>{ch.icon}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                      {item.Canal || 'Canal'}
                    </h2>
                    {saving && (
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 animate-fade">
                        <CheckCircle2 size={10} /> Salvo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cliente && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${clientColor}20`, color: clientColor }}
                      >
                        {cliente.Nome}
                      </span>
                    )}
                    {item.Zona && (
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        {item.Zona}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400 transition-all ios-btn mt-0.5 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Bottom accent line */}
          <div
            className="h-px w-full"
            style={{ background: `linear-gradient(90deg, ${ch.color}40, transparent)` }}
          />
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">

          {/* ── Section: Distribuição ───────────────────── */}
          <div>
            <SectionLabel icon={<Globe size={12} />} label="Distribuição" />
            <div className="space-y-4">

              <FieldRow label="Canal" icon={ch.icon}>
                <PSelect
                  value={item.Canal || ''}
                  onChange={e => handleUpdate('Canal', e.target.value)}
                >
                  <option value="">Selecionar canal</option>
                  {CANAIS.map(c => <option key={c} value={c}>{c}</option>)}
                </PSelect>
              </FieldRow>

              <FieldRow label="Frequência de publicação" icon={<Clock size={12} />}>
                <div className="relative">
                  <input
                    list="dl-freq-cobodrawer"
                    key={`freq-${item.id}`}
                    defaultValue={item['Frequência'] || ''}
                    onBlur={e => { if (e.target.value !== (item['Frequência'] || '')) handleUpdate('Frequência', e.target.value); }}
                    placeholder="Ex: 3x por semana"
                    className="w-full h-11 px-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500/60 transition-all placeholder:text-zinc-400"
                  />
                  <datalist id="dl-freq-cobodrawer">
                    {FREQUENCIAS.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
              </FieldRow>
            </div>
          </div>

          {/* ── Section: Audiência ──────────────────────── */}
          <div>
            <SectionLabel icon={<Users size={12} />} label="Audiência" />
            <div className="space-y-4">

              <FieldRow label="Público-alvo" icon={<Target size={12} />}>
                <textarea
                  key={`pub-${item.id}`}
                  defaultValue={item['Público'] || ''}
                  onBlur={e => { if (e.target.value !== (item['Público'] || '')) handleUpdate('Público', e.target.value); }}
                  placeholder="Descreva o público-alvo deste canal..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 transition-all resize-none placeholder:text-zinc-400 leading-relaxed"
                />
              </FieldRow>

              <FieldRow label="Voz da marca" icon={<Mic2 size={12} />}>
                <div className="relative">
                  <input
                    list="dl-voz-cobodrawer"
                    key={`voz-${item.id}`}
                    defaultValue={item['Voz'] || ''}
                    onBlur={e => { if (e.target.value !== (item['Voz'] || '')) handleUpdate('Voz', e.target.value); }}
                    placeholder="Ex: Educativa, Inspiradora..."
                    className="w-full h-11 px-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60 transition-all placeholder:text-zinc-400"
                  />
                  <datalist id="dl-voz-cobodrawer">
                    {VOZES.map(v => <option key={v} value={v} />)}
                  </datalist>
                </div>
              </FieldRow>
            </div>
          </div>

          {/* ── Section: Estratégia de Conteúdo ─────────── */}
          <div>
            <SectionLabel icon={<Zap size={12} />} label="Estratégia de Conteúdo" />
            <div className="space-y-4">

              {/* Zona — visual cards */}
              <FieldRow label="Temperatura da zona" icon={<Flame size={12} />}>
                <div className="grid grid-cols-3 gap-2">
                  {ZONA_CONFIG.map(z => {
                    const isActive = item.Zona === z.value;
                    return (
                      <button
                        key={z.value}
                        onClick={() => handleUpdate('Zona', z.value)}
                        className={`relative p-3 rounded-2xl border-2 text-left transition-all duration-200 ios-btn overflow-hidden ${
                          isActive
                            ? `${z.activeBg} ${z.border} shadow-sm`
                            : 'border-zinc-200 dark:border-zinc-700/60 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/40'
                        }`}
                      >
                        {isActive && (
                          <div className={`absolute inset-0 bg-gradient-to-br ${z.gradient} opacity-40`} />
                        )}
                        <div className="relative">
                          <span className={`${isActive ? z.text : 'text-zinc-400'} transition-colors`}>{z.icon}</span>
                          <p className={`text-[10px] font-black uppercase tracking-wide mt-1 ${isActive ? z.text : 'text-zinc-600 dark:text-zinc-400'}`}>{z.label}</p>
                          <p className="text-[8px] text-zinc-400 leading-tight mt-0.5 line-clamp-1">{z.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FieldRow>

              <FieldRow label="Intenção do conteúdo" icon={<Target size={12} />}>
                <div className="relative">
                  <input
                    list="dl-int-cobodrawer"
                    key={`int-${item.id}`}
                    defaultValue={item['Intenção'] || ''}
                    onBlur={e => { if (e.target.value !== (item['Intenção'] || '')) handleUpdate('Intenção', e.target.value); }}
                    placeholder="Ex: Engajamento, Conversão..."
                    className="w-full h-11 px-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/60 transition-all placeholder:text-zinc-400"
                  />
                  <datalist id="dl-int-cobodrawer">
                    {INTENCOES.map(i => <option key={i} value={i} />)}
                  </datalist>
                </div>
              </FieldRow>

              <FieldRow label="Formato principal" icon={<Layout size={12} />}>
                <div className="relative">
                  <input
                    list="dl-fmt-cobodrawer"
                    key={`fmt-${item.id}`}
                    defaultValue={item['Formato'] || ''}
                    onBlur={e => { if (e.target.value !== (item['Formato'] || '')) handleUpdate('Formato', e.target.value); }}
                    placeholder="Ex: Reels, Carrossel, Stories..."
                    className="w-full h-11 px-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/60 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/25 focus:border-amber-500/60 transition-all placeholder:text-zinc-400"
                  />
                  <datalist id="dl-fmt-cobodrawer">
                    {FORMATOS.map(f => <option key={f} value={f} />)}
                  </datalist>
                </div>
              </FieldRow>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-3 shrink-0 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-md"
        >
          <button
            onClick={() => { if (confirm('Excluir este canal COBO?')) { onDelete(); handleClose(); } }}
            className="ios-btn flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-black uppercase tracking-wider transition-all"
          >
            <Trash2 size={13} />
            Excluir
          </button>
          <button
            onClick={handleClose}
            className="ios-btn flex-1 h-11 rounded-2xl text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${ch.color}, ${ch.color}cc)`,
              boxShadow: `0 8px 24px ${ch.color}30`,
            }}
          >
            Concluído
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
        {icon}
        {label}
      </div>
      <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
