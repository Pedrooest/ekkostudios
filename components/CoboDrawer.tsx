import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Zap, Instagram, Youtube, Twitter, Facebook, Linkedin,
  MessageCircle, Send, Globe, Trash2, CheckCircle2, Users, Clock, Layout, Target, Mic2
} from 'lucide-react';
import {
  OPCOES_CANAL_COBO, OPCOES_FREQUENCIA_COBO, OPCOES_PUBLICO_COBO,
  OPCOES_VOZ_COBO, OPCOES_ZONA_COBO, OPCOES_INTENCAO_COBO, OPCOES_FORMATO_COBO
} from '../constants';
import { TipoTabela } from '../types';

interface CoboDrawerProps {
  item: any | null;
  clienteNome: string;
  onClose: () => void;
  onUpdate: (id: string, tab: TipoTabela, field: string, value: any) => void;
  onDelete: (ids: string[], tab: TipoTabela) => void;
  savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
}

const getSocialIcon = (canal: string) => {
  if (!canal) return <Globe size={16} />;
  const c = String(canal).toLowerCase();
  if (c.includes('instagram')) return <Instagram size={16} />;
  if (c.includes('youtube')) return <Youtube size={16} />;
  if (c.includes('tiktok')) return <Mic2 size={16} />;
  if (c.includes('facebook')) return <Facebook size={16} />;
  if (c.includes('linkedin')) return <Linkedin size={16} />;
  if (c.includes('whatsapp') || c.includes('telegram')) return <MessageCircle size={16} />;
  return <Globe size={16} />;
};

const ZONA_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  'Primária':   { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', ring: 'focus:ring-orange-500/20 focus:border-orange-500' },
  'Conversão':  { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', ring: 'focus:ring-orange-500/20 focus:border-orange-500' },
  'Secundária': { bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400',  ring: 'focus:ring-amber-500/20 focus:border-amber-500'  },
  'Nutrição':   { bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400',  ring: 'focus:ring-amber-500/20 focus:border-amber-500'  },
  'Paralela':   { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600 dark:text-blue-400',    ring: 'focus:ring-blue-500/20 focus:border-blue-500'    },
  'Aquisição':  { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-600 dark:text-blue-400',    ring: 'focus:ring-blue-500/20 focus:border-blue-500'    },
};

function SavedBadge({ visible }: { visible: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
      <CheckCircle2 size={10} /> Salvo
    </span>
  );
}

function DrawerField({ label, children, saved }: { label: string; children: React.ReactNode; saved?: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</label>
        {saved !== undefined && <SavedBadge visible={saved} />}
      </div>
      {children}
    </div>
  );
}

function SpinnerOverlay({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin pointer-events-none" />
  );
}

export function CoboDrawer({ item, clienteNome, onClose, onUpdate, onDelete, savingStatus = {} }: CoboDrawerProps) {
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});
  const prevStatus = useRef<Record<string, string>>({});
  const isOpen = !!item;

  useEffect(() => {
    if (!item) return;
    const fields = ['Canal', 'Frequência', 'Público', 'Voz', 'Zona', 'Intenção', 'Formato'];
    fields.forEach(field => {
      const key = `COBO:${item.id}:${field}`;
      const prev = prevStatus.current[key];
      const curr = savingStatus[key];
      if (prev === 'saving' && curr === 'success') {
        setSavedFields(s => ({ ...s, [field]: true }));
        setTimeout(() => setSavedFields(s => ({ ...s, [field]: false })), 1500);
      }
      prevStatus.current[key] = curr || '';
    });
  }, [savingStatus, item]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleUpdate = (field: string, value: any) => {
    if (!item) return;
    onUpdate(item.id, 'COBO', field, value);
  };

  const fieldSaving = (field: string) => savingStatus[`COBO:${item?.id}:${field}`] === 'saving';
  const zonaStyle = ZONA_STYLES[item?.Zona] || {};

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">COBO</h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5 truncate max-w-[260px]">
                {clienteNome}{item?.Canal ? ` • ${item.Canal}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {item && (
          <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-8">

            {/* Seção: 🌐 Distribuição */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Globe size={12} className="text-blue-500" />
                </div>
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Distribuição</h3>
              </div>

              {/* Canal */}
              <DrawerField label="Canal" saved={savedFields['Canal']}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    {getSocialIcon(item.Canal)}
                  </div>
                  <select
                    value={item.Canal || ''}
                    onChange={e => handleUpdate('Canal', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="">Selecione o canal</option>
                    {OPCOES_CANAL_COBO.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <SpinnerOverlay loading={fieldSaving('Canal')} />
                </div>
              </DrawerField>

              {/* Frequência */}
              <DrawerField label="Frequência" saved={savedFields['Frequência']}>
                <div className="relative">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    list="dl-freq-cobo-drawer"
                    defaultValue={item['Frequência'] || ''}
                    placeholder="Ex: 3x por semana, Diário..."
                    onBlur={e => {
                      if (e.target.value !== (item['Frequência'] || '')) {
                        handleUpdate('Frequência', e.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <datalist id="dl-freq-cobo-drawer">
                    {OPCOES_FREQUENCIA_COBO.map(o => <option key={o} value={o} />)}
                  </datalist>
                  <SpinnerOverlay loading={fieldSaving('Frequência')} />
                </div>
              </DrawerField>
            </div>

            {/* Seção: 👥 Audiência */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center">
                  <Users size={12} className="text-emerald-500" />
                </div>
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Audiência</h3>
              </div>

              {/* Público-alvo */}
              <DrawerField label="Público-Alvo" saved={savedFields['Público']}>
                <div className="relative">
                  <textarea
                    rows={2}
                    defaultValue={item['Público'] || ''}
                    placeholder="Descreva o público-alvo deste canal..."
                    onBlur={e => {
                      if (e.target.value !== (item['Público'] || '')) {
                        handleUpdate('Público', e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none custom-scrollbar"
                  />
                </div>
              </DrawerField>

              {/* Voz da Marca */}
              <DrawerField label="Voz da Marca" saved={savedFields['Voz']}>
                <div className="relative">
                  <Mic2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    list="dl-voz-cobo-drawer"
                    defaultValue={item['Voz'] || ''}
                    placeholder="Ex: Educativa, Inspiradora, Divertida..."
                    onBlur={e => {
                      if (e.target.value !== (item['Voz'] || '')) {
                        handleUpdate('Voz', e.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <datalist id="dl-voz-cobo-drawer">
                    {OPCOES_VOZ_COBO.map(o => <option key={o} value={o} />)}
                  </datalist>
                  <SpinnerOverlay loading={fieldSaving('Voz')} />
                </div>
              </DrawerField>
            </div>

            {/* Seção: 📋 Conteúdo Estratégico */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center">
                  <Layout size={12} className="text-amber-500" />
                </div>
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Conteúdo Estratégico</h3>
              </div>

              {/* Zona */}
              <DrawerField label="Zona" saved={savedFields['Zona']}>
                <div className="relative">
                  <select
                    value={item.Zona || ''}
                    onChange={e => handleUpdate('Zona', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="">Selecione a zona</option>
                    {OPCOES_ZONA_COBO.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <SpinnerOverlay loading={fieldSaving('Zona')} />
                </div>
                {item.Zona && (
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg w-fit ${(zonaStyle as any).bg || 'bg-zinc-100 dark:bg-zinc-800'} ${(zonaStyle as any).text || 'text-zinc-500'}`}>
                    {item.Zona}
                  </span>
                )}
              </DrawerField>

              {/* Intenção */}
              <DrawerField label="Intenção" saved={savedFields['Intenção']}>
                <div className="relative">
                  <Target size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    list="dl-intencao-cobo-drawer"
                    defaultValue={item['Intenção'] || ''}
                    placeholder="Ex: Engajamento, Conversão, Educação..."
                    onBlur={e => {
                      if (e.target.value !== (item['Intenção'] || '')) {
                        handleUpdate('Intenção', e.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <datalist id="dl-intencao-cobo-drawer">
                    {OPCOES_INTENCAO_COBO.map(o => <option key={o} value={o} />)}
                  </datalist>
                  <SpinnerOverlay loading={fieldSaving('Intenção')} />
                </div>
              </DrawerField>

              {/* Formato */}
              <DrawerField label="Formato" saved={savedFields['Formato']}>
                <div className="relative">
                  <Layout size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    list="dl-formato-cobo-drawer"
                    defaultValue={item['Formato'] || ''}
                    placeholder="Ex: Reels, Carrossel, Stories..."
                    onBlur={e => {
                      if (e.target.value !== (item['Formato'] || '')) {
                        handleUpdate('Formato', e.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                  <datalist id="dl-formato-cobo-drawer">
                    {OPCOES_FORMATO_COBO.map(o => <option key={o} value={o} />)}
                  </datalist>
                  <SpinnerOverlay loading={fieldSaving('Formato')} />
                </div>
              </DrawerField>
            </div>
          </div>
        )}

        {/* Footer */}
        {item && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex gap-3 shrink-0">
            <button
              onClick={() => { onDelete([item.id], 'COBO'); onClose(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold transition-colors"
            >
              <Trash2 size={14} />
              Excluir
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white text-sm font-bold transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={15} />
              Concluído
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
