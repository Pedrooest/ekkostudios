import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Zap, Instagram, Youtube, Twitter, Facebook, Linkedin,
  MessageCircle, Send, Globe, Trash2, Clock, Users, Layout, Target, Mic2
} from 'lucide-react';
import { TipoTabela } from '../types';
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
const PUBLICOS   = ['Frio', 'Morno', 'Quente', 'Leads', 'Clientes', 'Comunidade'];
const VOZES      = ['Educativa', 'Autoridade', 'Conversacional', 'Provocativa', 'Inspiradora', 'Técnica', 'Humana/Próxima', 'Comercial'];
const ZONAS      = ['Primária', 'Secundária', 'Paralela', 'Aquisição', 'Nutrição', 'Conversão', 'Retenção'];
const INTENCOES  = ['Atenção', 'Engajamento', 'Educação', 'Autoridade', 'Desejo', 'Conversão', 'Relacionamento', 'Retenção'];
const FORMATOS   = ['Vídeo curto', 'Carrossel', 'Post imagem', 'Stories', 'Live', 'Bastidores', 'Tutorial', 'Prova social', 'Oferta', 'Texto educativo'];

const ZONA_OPTIONS = [
  { value: 'Primária',   color: 'orange', desc: 'Conversão direta' },
  { value: 'Secundária', color: 'amber',  desc: 'Nutrição de lead' },
  { value: 'Paralela',   color: 'blue',   desc: 'Aquisição fria' },
];

const zoneColorMap: Record<string, { border: string; bg: string; text: string }> = {
  orange: { border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  amber:  { border: 'border-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',   text: 'text-amber-600 dark:text-amber-400'  },
  blue:   { border: 'border-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',     text: 'text-blue-600 dark:text-blue-400'    },
};

const getSocialIcon = (canal: string) => {
  if (!canal) return <Globe size={14} />;
  const c = String(canal).toLowerCase();
  if (c.includes('instagram')) return <Instagram size={14} />;
  if (c.includes('youtube'))   return <Youtube size={14} />;
  if (c.includes('tiktok'))    return <Mic2 size={14} />;
  if (c.includes('facebook'))  return <Facebook size={14} />;
  if (c.includes('linkedin'))  return <Linkedin size={14} />;
  if (c.includes('whatsapp') || c.includes('telegram')) return <MessageCircle size={14} />;
  return <Globe size={14} />;
};

export function CoboDrawer({ item, cliente, onUpdate, onDelete, onClose }: CoboDrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!item) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] bg-white dark:bg-zinc-900 z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">COBO</p>
              <p className="text-xs text-zinc-500">
                {cliente?.Nome || 'Sem cliente'}
                {item.Canal ? ` • ${item.Canal}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-7">

          {/* 🌐 Distribuição */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">🌐 Distribuição</p>

            {/* Canal */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Canal</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                  {getSocialIcon(item.Canal)}
                </span>
                <select
                  value={item.Canal || ''}
                  onChange={e => onUpdate('Canal', e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Selecione o canal</option>
                  {CANAIS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Frequência */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Frequência</label>
              <div className="relative">
                <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  list="dl-freq-cobo-v2"
                  key={`freq-${item.id}`}
                  defaultValue={item['Frequência'] || ''}
                  onBlur={e => { if (e.target.value !== (item['Frequência'] || '')) onUpdate('Frequência', e.target.value); }}
                  placeholder="Ex: 3x por semana..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
                />
                <datalist id="dl-freq-cobo-v2">
                  {FREQUENCIAS.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
            </div>
          </section>

          {/* 👥 Audiência */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">👥 Audiência</p>

            {/* Público-alvo */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Público-Alvo</label>
              <textarea
                key={`publico-${item.id}`}
                defaultValue={item['Público'] || ''}
                onBlur={e => { if (e.target.value !== (item['Público'] || '')) onUpdate('Público', e.target.value); }}
                placeholder="Descreva o público-alvo deste canal..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none custom-scrollbar placeholder:text-zinc-400"
              />
            </div>

            {/* Voz da Marca */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Voz da Marca</label>
              <div className="relative">
                <Mic2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  list="dl-voz-cobo-v2"
                  key={`voz-${item.id}`}
                  defaultValue={item['Voz'] || ''}
                  onBlur={e => { if (e.target.value !== (item['Voz'] || '')) onUpdate('Voz', e.target.value); }}
                  placeholder="Ex: Educativa, Inspiradora..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-zinc-400"
                />
                <datalist id="dl-voz-cobo-v2">
                  {VOZES.map(v => <option key={v} value={v} />)}
                </datalist>
              </div>
            </div>
          </section>

          {/* 📋 Conteúdo Estratégico */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">📋 Conteúdo Estratégico</p>

            {/* Zona — cards visuais */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Zona</label>
              <div className="grid grid-cols-3 gap-2">
                {ZONA_OPTIONS.map(z => {
                  const isActive = item.Zona === z.value;
                  const c = zoneColorMap[z.color];
                  return (
                    <button
                      key={z.value}
                      onClick={() => onUpdate('Zona', z.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? `${c.border} ${c.bg}`
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <p className={`text-xs font-bold ${isActive ? c.text : 'text-zinc-500'}`}>{z.value}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{z.desc}</p>
                    </button>
                  );
                })}
              </div>
              {/* Outras opções via select */}
              <select
                value={ZONA_OPTIONS.some(z => z.value === item.Zona) ? '' : (item.Zona || '')}
                onChange={e => { if (e.target.value) onUpdate('Zona', e.target.value); }}
                className="mt-2 w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all appearance-none cursor-pointer"
              >
                <option value="">Outras zonas...</option>
                {ZONAS.filter(z => !ZONA_OPTIONS.some(o => o.value === z)).map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>

            {/* Intenção */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Intenção</label>
              <div className="relative">
                <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  list="dl-intencao-cobo-v2"
                  key={`int-${item.id}`}
                  defaultValue={item['Intenção'] || ''}
                  onBlur={e => { if (e.target.value !== (item['Intenção'] || '')) onUpdate('Intenção', e.target.value); }}
                  placeholder="Ex: Engajamento, Conversão..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-zinc-400"
                />
                <datalist id="dl-intencao-cobo-v2">
                  {INTENCOES.map(i => <option key={i} value={i} />)}
                </datalist>
              </div>
            </div>

            {/* Formato */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Formato</label>
              <div className="relative">
                <Layout size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  list="dl-formato-cobo-v2"
                  key={`fmt-${item.id}`}
                  defaultValue={item['Formato'] || ''}
                  onBlur={e => { if (e.target.value !== (item['Formato'] || '')) onUpdate('Formato', e.target.value); }}
                  placeholder="Ex: Reels, Carrossel, Stories..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-zinc-400"
                />
                <datalist id="dl-formato-cobo-v2">
                  {FORMATOS.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 flex gap-3 shrink-0 bg-zinc-50/50 dark:bg-zinc-800/30">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-sm font-semibold transition-all shadow-lg shadow-orange-500/20"
          >
            Concluído
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
