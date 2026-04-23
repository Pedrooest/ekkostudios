import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, LayoutGrid, Instagram, Youtube, Twitter, Facebook, Linkedin,
  MessageCircle, Send, Globe, Trash2
} from 'lucide-react';
import { TipoTabela } from '../types';
import { Cliente } from '../types';

interface MatrizDrawerProps {
  item: any | null;
  cliente: Cliente | undefined;
  onUpdate: (field: string, value: any) => void;
  onDelete: () => void;
  onClose: () => void;
}

const REDES = ['Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Pinterest', 'Facebook', 'X (Twitter)'];

const FUNCAO_OPTIONS = [
  { value: 'Hub',  color: 'blue',   desc: 'Canal principal' },
  { value: 'Hero', color: 'purple', desc: 'Conteúdo de impacto' },
  { value: 'Help', color: 'green',  desc: 'Suporte e educação' },
];

const PAPEL_OPTIONS = [
  'Gerar demanda', 'Aumentar percepção de valor', 'Diminuir objeção',
  'Educar mercado', 'Atrair lead qualificado', 'Reforçar autoridade',
  'Engajar base', 'Preparar para oferta', 'Escalar awareness',
];

const TIPO_OPTIONS = [
  'Conteúdo raiz', 'Corte', 'Reaproveitamento', 'Bastidores', 'Tutorial',
  'Storytelling', 'Prova social', 'Diagnóstico', 'Lista / Carrossel', 'Opinião',
];

const QUEM_OPTIONS = [
  'Fundador', 'Sócio', 'Especialista', 'Equipe', 'Marca (Institucional)', 'Cliente', 'Parceiro', 'Narrador / IA',
];

const getSocialIcon = (canal: string) => {
  if (!canal) return <Globe size={14} />;
  const c = String(canal).toLowerCase();
  if (c.includes('instagram')) return <Instagram size={14} />;
  if (c.includes('youtube')) return <Youtube size={14} />;
  if (c.includes('facebook')) return <Facebook size={14} />;
  if (c.includes('linkedin')) return <Linkedin size={14} />;
  if (c.includes('twitter') || c.includes('x')) return <Twitter size={14} />;
  if (c.includes('whatsapp') || c.includes('tiktok') || c.includes('telegram')) return <MessageCircle size={14} />;
  return <Globe size={14} />;
};

const colorMap: Record<string, { border: string; bg: string; text: string }> = {
  blue:   { border: 'border-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-600 dark:text-blue-400' },
  purple: { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  green:  { border: 'border-emerald-500',bg: 'bg-emerald-50 dark:bg-emerald-900/20',text: 'text-emerald-600 dark:text-emerald-400'},
};

export function MatrizDrawer({ item, cliente, onUpdate, onDelete, onClose }: MatrizDrawerProps) {
  // Escape key
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
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Matriz Estratégica</p>
              <p className="text-xs text-zinc-500">
                {cliente?.Nome || 'Sem cliente'}
                {item.Rede_Social ? ` • ${item.Rede_Social}` : ''}
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

          {/* 🌐 Estrutura de Canal */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">🌐 Estrutura de Canal</p>

            {/* Rede Social */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Rede Social</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                  {getSocialIcon(item.Rede_Social)}
                </span>
                <select
                  value={item.Rede_Social || ''}
                  onChange={e => onUpdate('Rede_Social', e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Selecione</option>
                  {REDES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Função — Hub / Hero / Help cards */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Função</label>
              <div className="grid grid-cols-3 gap-2">
                {FUNCAO_OPTIONS.map(f => {
                  const isActive = item['Função'] === f.value;
                  const c = colorMap[f.color];
                  return (
                    <button
                      key={f.value}
                      onClick={() => onUpdate('Função', f.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        isActive
                          ? `${c.border} ${c.bg}`
                          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                      }`}
                    >
                      <p className={`text-xs font-bold ${isActive ? c.text : 'text-zinc-500'}`}>{f.value}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{f.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quem Fala */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Quem Fala</label>
              <input
                list="dl-quem-fala-drawer"
                key={`qf-${item.id}`}
                defaultValue={item['Quem fala'] || ''}
                onBlur={e => { if (e.target.value !== (item['Quem fala'] || '')) onUpdate('Quem fala', e.target.value); }}
                placeholder="Ex: Fundador, Especialista, Marca..."
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400"
              />
              <datalist id="dl-quem-fala-drawer">
                {QUEM_OPTIONS.map(o => <option key={o} value={o} />)}
              </datalist>
            </div>
          </section>

          {/* 🎯 Posicionamento Estratégico */}
          <section className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">🎯 Posicionamento Estratégico</p>

            {/* Papel Estratégico */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Papel Estratégico</label>
              <input
                list="dl-papel-drawer-v2"
                key={`papel-${item.id}`}
                defaultValue={item['Papel estratégico'] || ''}
                onBlur={e => { if (e.target.value !== (item['Papel estratégico'] || '')) onUpdate('Papel estratégico', e.target.value); }}
                placeholder="Ex: Canal principal de alcance..."
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-zinc-400"
              />
              <datalist id="dl-papel-drawer-v2">
                {PAPEL_OPTIONS.map(o => <option key={o} value={o} />)}
              </datalist>
            </div>

            {/* Tipo de Conteúdo */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Tipo de Conteúdo</label>
              <input
                list="dl-tipo-drawer-v2"
                key={`tipo-${item.id}`}
                defaultValue={item['Tipo de conteúdo'] || ''}
                onBlur={e => { if (e.target.value !== (item['Tipo de conteúdo'] || '')) onUpdate('Tipo de conteúdo', e.target.value); }}
                placeholder="Ex: Reels, Carrossel, Stories..."
                className="w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all placeholder:text-zinc-400"
              />
              <datalist id="dl-tipo-drawer-v2">
                {TIPO_OPTIONS.map(o => <option key={o} value={o} />)}
              </datalist>
            </div>

            {/* Resultado Esperado */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5">Resultado Esperado</label>
              <textarea
                key={`resultado-${item.id}`}
                defaultValue={item['Resultado esperado'] || ''}
                onBlur={e => { if (e.target.value !== (item['Resultado esperado'] || '')) onUpdate('Resultado esperado', e.target.value); }}
                placeholder="Ex: Crescimento orgânico, autoridade no nicho..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none custom-scrollbar placeholder:text-zinc-400"
              />
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
            className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            Concluído
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
