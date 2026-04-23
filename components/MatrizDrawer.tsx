import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X, LayoutGrid, Instagram, Youtube, Twitter, Facebook, Linkedin,
  MessageCircle, Send, Globe, Trash2, CheckCircle2, Zap, Users, Target, Layout
} from 'lucide-react';
import {
  OPCOES_FUNCAO_MATRIZ, OPCOES_QUEM_FALA_MATRIZ,
  OPCOES_PAPEL_ESTRATEGICO_MATRIZ, OPCOES_TIPO_CONTEUDO_MATRIZ,
  OPCOES_RESULTADO_ESPERADO_MATRIZ
} from '../constants';
import { TipoTabela } from '../types';

interface MatrizDrawerProps {
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
  if (c.includes('facebook')) return <Facebook size={16} />;
  if (c.includes('linkedin')) return <Linkedin size={16} />;
  if (c.includes('twitter') || c.includes('x')) return <Twitter size={16} />;
  if (c.includes('whatsapp') || c.includes('tiktok') || c.includes('telegram')) return <MessageCircle size={16} />;
  return <Globe size={16} />;
};

const FUNCAO_COLORS: Record<string, string> = {
  'Autoridade': 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400',
  'Posicionamento': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400',
  'Conversão': 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400',
  'Relacionamento': 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400',
  'Educação': 'text-sky-600 bg-sky-50 dark:bg-sky-900/20 dark:text-sky-400',
};

function SavedBadge({ visible }: { visible: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-emerald-500 transition-all duration-300 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
      <CheckCircle2 size={10} /> Salvo
    </span>
  );
}

function DrawerField({
  label, children, saved
}: { label: string; children: React.ReactNode; saved?: boolean }) {
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

export function MatrizDrawer({ item, clienteNome, onClose, onUpdate, onDelete, savingStatus = {} }: MatrizDrawerProps) {
  const [savedFields, setSavedFields] = useState<Record<string, boolean>>({});
  const prevStatus = useRef<Record<string, string>>({});
  const isOpen = !!item;

  // Watch for saving → success transitions to show flash
  useEffect(() => {
    if (!item) return;
    const fields = ['Rede_Social', 'Função', 'Quem fala', 'Papel estratégico', 'Tipo de conteúdo', 'Resultado esperado'];
    fields.forEach(field => {
      const key = `MATRIZ:${item.id}:${field}`;
      const prev = prevStatus.current[key];
      const curr = savingStatus[key];
      if (prev === 'saving' && curr === 'success') {
        setSavedFields(s => ({ ...s, [field]: true }));
        setTimeout(() => setSavedFields(s => ({ ...s, [field]: false })), 1500);
      }
      prevStatus.current[key] = curr || '';
    });
  }, [savingStatus, item]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleUpdate = (field: string, value: any) => {
    if (!item) return;
    onUpdate(item.id, 'MATRIZ', field, value);
  };

  const fieldSaving = (field: string) => savingStatus[`MATRIZ:${item?.id}:${field}`] === 'saving';

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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Matriz Estratégica</h2>
              <p className="text-xs text-zinc-500 font-medium mt-0.5 truncate max-w-[260px]">
                {clienteNome}{item?.Rede_Social ? ` • ${item.Rede_Social}` : ''}
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

            {/* Seção: Estrutura de Canal */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <Globe size={12} className="text-blue-500" />
                </div>
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Estrutura de Canal</h3>
              </div>

              {/* Rede Social */}
              <DrawerField label="Rede Social" saved={savedFields['Rede_Social']}>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                    {getSocialIcon(item.Rede_Social)}
                  </div>
                  <select
                    value={item.Rede_Social || ''}
                    onChange={e => handleUpdate('Rede_Social', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                  >
                    <option value="">Selecione a rede</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Youtube">Youtube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Facebook">Facebook</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Twitter/X">Twitter/X</option>
                  </select>
                  {fieldSaving('Rede_Social') && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  )}
                </div>
              </DrawerField>

              {/* Função */}
              <DrawerField label="Função" saved={savedFields['Função']}>
                <select
                  value={item['Função'] || ''}
                  onChange={e => handleUpdate('Função', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="">Selecione a função</option>
                  {OPCOES_FUNCAO_MATRIZ.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {item['Função'] && (
                  <p className={`text-[10px] font-bold px-2.5 py-1 rounded-lg w-fit ${FUNCAO_COLORS[item['Função']] || 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'}`}>
                    {item['Função']}
                  </p>
                )}
              </DrawerField>

              {/* Quem Fala */}
              <DrawerField label="Quem Fala" saved={savedFields['Quem fala']}>
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    list="dl-quem-fala-drawer"
                    defaultValue={item['Quem fala'] || ''}
                    placeholder="Ex: Fundador, Especialista, Marca..."
                    onBlur={e => {
                      if (e.target.value !== (item['Quem fala'] || '')) {
                        handleUpdate('Quem fala', e.target.value);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                  <datalist id="dl-quem-fala-drawer">
                    {OPCOES_QUEM_FALA_MATRIZ.map(o => <option key={o} value={o} />)}
                  </datalist>
                  {fieldSaving('Quem fala') && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  )}
                </div>
              </DrawerField>
            </div>

            {/* Seção: Posicionamento Estratégico */}
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-purple-500/10 flex items-center justify-center">
                  <Zap size={12} className="text-purple-500" />
                </div>
                <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Posicionamento Estratégico</h3>
              </div>

              {/* Papel Estratégico */}
              <DrawerField label="Papel Estratégico" saved={savedFields['Papel estratégico']}>
                <div className="relative">
                  <input
                    list="dl-papel-drawer"
                    defaultValue={item['Papel estratégico'] || ''}
                    placeholder="Ex: Gerar demanda, Educar mercado..."
                    onBlur={e => {
                      if (e.target.value !== (item['Papel estratégico'] || '')) {
                        handleUpdate('Papel estratégico', e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <datalist id="dl-papel-drawer">
                    {OPCOES_PAPEL_ESTRATEGICO_MATRIZ.map(o => <option key={o} value={o} />)}
                  </datalist>
                  {fieldSaving('Papel estratégico') && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  )}
                </div>
              </DrawerField>

              {/* Tipo de Conteúdo */}
              <DrawerField label="Tipo de Conteúdo" saved={savedFields['Tipo de conteúdo']}>
                <div className="relative">
                  <input
                    list="dl-tipo-drawer"
                    defaultValue={item['Tipo de conteúdo'] || ''}
                    placeholder="Ex: Reels, Carrossel, Tutorial..."
                    onBlur={e => {
                      if (e.target.value !== (item['Tipo de conteúdo'] || '')) {
                        handleUpdate('Tipo de conteúdo', e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  <datalist id="dl-tipo-drawer">
                    {OPCOES_TIPO_CONTEUDO_MATRIZ.map(o => <option key={o} value={o} />)}
                  </datalist>
                  {fieldSaving('Tipo de conteúdo') && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                  )}
                </div>
              </DrawerField>

              {/* Resultado Esperado */}
              <DrawerField label="Resultado Esperado" saved={savedFields['Resultado esperado']}>
                <div className="relative">
                  <textarea
                    rows={3}
                    defaultValue={item['Resultado esperado'] || ''}
                    placeholder="Descreva o resultado esperado com este conteúdo..."
                    onBlur={e => {
                      if (e.target.value !== (item['Resultado esperado'] || '')) {
                        handleUpdate('Resultado esperado', e.target.value);
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none custom-scrollbar"
                  />
                  <datalist id="dl-resultado-drawer">
                    {OPCOES_RESULTADO_ESPERADO_MATRIZ.map(o => <option key={o} value={o} />)}
                  </datalist>
                </div>
              </DrawerField>
            </div>
          </div>
        )}

        {/* Footer */}
        {item && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex gap-3 shrink-0">
            <button
              onClick={() => { onDelete([item.id], 'MATRIZ'); onClose(); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-semibold transition-colors"
            >
              <Trash2 size={14} />
              Excluir
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
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
