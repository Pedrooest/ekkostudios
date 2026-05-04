
import React, { useState, useMemo, useEffect } from 'react';
import {
  List, LayoutGrid, Search, Plus, Trash2, Edit2,
  Instagram, Youtube, Twitter, Facebook, Linkedin,
  MessageCircle, Send, Globe, Filter, X, ChevronRight,
  Target, Zap, Mic2, Map, Layout, CheckCircle2, AlertCircle, Users, Clock,
  Flame, Droplets, Snowflake
} from 'lucide-react';
import { Card, Button, InputSelect, Badge, DeletionBar } from '../Components';
import {
  OPCOES_CANAL_COBO, OPCOES_FREQUENCIA_COBO, OPCOES_PUBLICO_COBO,
  OPCOES_VOZ_COBO, OPCOES_ZONA_COBO, OPCOES_INTENCAO_COBO,
  OPCOES_FORMATO_COBO, OPCOES_ZONA
} from '../constants';
import { Cliente, TipoTabela } from '../types';
import { playUISound } from '../utils/uiSounds';
import { CoboDrawer } from '../components/CoboDrawer';

interface CoboViewProps {
  data: any[];
  onUpdate: (id: string, tab: TipoTabela, field: string, value: any) => void;
  onDelete: (ids: string[], tab: TipoTabela) => void;
  onArchive: (ids: string[], tab: TipoTabela, archive: boolean) => void;
  onAdd: () => void;
  clients: Cliente[];
  activeClient: Cliente | null;
  onSelectClient: (id: string) => void;
  selection: string[];
  onSelect: (id: string) => void;
  onClearSelection: () => void;
  savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
}

const SavingIndicator = ({ status }: { status?: 'saving' | 'success' | 'error' }) => {
  if (!status) return null;
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10 animate-fade">
      {status === 'saving' && <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />}
      {status === 'success' && <CheckCircle2 size={12} className="text-emerald-500" />}
      {status === 'error' && <AlertCircle size={12} className="text-rose-500" />}
    </div>
  );
};

const CHANNEL_STYLES: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  instagram: { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-500/30', icon: <Instagram size={16} /> },
  youtube:   { bg: 'bg-red-50 dark:bg-red-500/10',   text: 'text-red-600 dark:text-red-400',   border: 'border-red-200 dark:border-red-500/30',   icon: <Youtube size={16} /> },
  tiktok:    { bg: 'bg-zinc-100 dark:bg-zinc-800',    text: 'text-zinc-800 dark:text-zinc-200', border: 'border-zinc-300 dark:border-zinc-700',    icon: <Mic2 size={16} /> },
  facebook:  { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30', icon: <Facebook size={16} /> },
  linkedin:  { bg: 'bg-sky-50 dark:bg-sky-500/10',   text: 'text-sky-600 dark:text-sky-400',   border: 'border-sky-200 dark:border-sky-500/30',   icon: <Linkedin size={16} /> },
  whatsapp:  { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30', icon: <MessageCircle size={16} /> },
  telegram:  { bg: 'bg-cyan-50 dark:bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-500/30',  icon: <Send size={16} /> },
  twitter:   { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-500 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-500/30',  icon: <Twitter size={16} /> },
};

const getChannelStyle = (canal: string) => {
  const key = (canal || '').toLowerCase();
  for (const [k, v] of Object.entries(CHANNEL_STYLES)) {
    if (key.includes(k)) return v;
  }
  return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700', icon: <Globe size={16} /> };
};

const ZONA_STYLES: Record<string, { bg: string; text: string; border: string; label: string; icon: React.ReactNode }> = {
  quente:    { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/30', label: 'Quente', icon: <Flame size={10} /> },
  primária:  { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/30', label: 'Primária', icon: <Flame size={10} /> },
  conversão: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/30', label: 'Conversão', icon: <Flame size={10} /> },
  morna:     { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-500/30',   label: 'Morna',    icon: <Droplets size={10} /> },
  secundária:{ bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-500/30',   label: 'Secundária', icon: <Droplets size={10} /> },
  nutrição:  { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-500/30',   label: 'Nutrição', icon: <Droplets size={10} /> },
  fria:      { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-500/30',     label: 'Fria',     icon: <Snowflake size={10} /> },
  paralela:  { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-500/30',     label: 'Paralela', icon: <Snowflake size={10} /> },
  aquisição: { bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-500/30',     label: 'Aquisição', icon: <Snowflake size={10} /> },
};

const getZonaStyle = (zona: string) => {
  const key = (zona || '').toLowerCase();
  for (const [k, v] of Object.entries(ZONA_STYLES)) {
    if (key.includes(k)) return v;
  }
  return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-500 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700', label: zona, icon: <Map size={10} /> };
};

export function CoboView({
  data, onUpdate, onDelete, onArchive, onAdd,
  clients, activeClient, onSelectClient,
  selection, onSelect, onClearSelection,
  savingStatus = {}
}: CoboViewProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(window.innerWidth < 640 ? 'cards' : 'cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanal, setFilterCanal] = useState<string | null>(null);
  const [filterZona, setFilterZona] = useState<string | null>(null);
  const [drawerItem, setDrawerItem] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) setViewMode('cards');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchTerm ||
        Object.values(item).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCanal = !filterCanal || (item.Canal || '').toLowerCase().includes(filterCanal.toLowerCase());
      const matchesZona = !filterZona || (() => {
        const z = (item.Zona || '').toLowerCase();
        if (filterZona === 'Quente') return z.includes('quente') || z.includes('primária') || z.includes('conversão');
        if (filterZona === 'Morna')  return z.includes('morna') || z.includes('nutrição') || z.includes('secundária');
        if (filterZona === 'Fria')   return z.includes('fria') || z.includes('paralela') || z.includes('aquisição');
        return z.includes(filterZona.toLowerCase());
      })();
      return matchesSearch && matchesCanal && matchesZona;
    });
  }, [data, searchTerm, filterCanal, filterZona]);

  // Stats
  const stats = useMemo(() => {
    const quente = data.filter(i => { const z = (i.Zona||'').toLowerCase(); return z.includes('quente')||z.includes('primária')||z.includes('conversão'); }).length;
    const morna  = data.filter(i => { const z = (i.Zona||'').toLowerCase(); return z.includes('morna')||z.includes('nutrição')||z.includes('secundária'); }).length;
    const fria   = data.filter(i => { const z = (i.Zona||'').toLowerCase(); return z.includes('fria')||z.includes('paralela')||z.includes('aquisição'); }).length;
    const canais = [...new Set(data.map(i => i.Canal).filter(Boolean))];
    return { quente, morna, fria, canais: canais.length, total: data.length };
  }, [data]);

  if (!activeClient) {
    return (
      <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xl border border-zinc-200 dark:border-zinc-700">
          <Target size={32} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Estratégia COBO</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest max-w-[280px]">Selecione um cliente para visualizar sua distribuição de canais.</p>
        </div>
        <div className="w-full max-w-sm">
          <InputSelect
            value=""
            onChange={(val) => onSelectClient(val)}
            options={[{ value: '', label: '-- SELECIONAR CLIENTE --' }, ...clients.map(c => ({ value: c.id, label: c.Nome.toUpperCase() }))]}
            className="!h-10 !text-[11px] !font-bold !rounded-xl"
            icon={Users}
          />
        </div>
      </div>
    );
  }

  const renderEditableCell = (item: any, field: string, hasDatalist?: string) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    const val = item[field] || '';
    return (
      <td
        className="px-5 py-3 text-xs text-zinc-600 dark:text-zinc-400 relative group/cell cursor-pointer"
        onClick={(e) => { e.stopPropagation(); setEditingCell({ id: item.id, field }); setEditingValue(val); }}
      >
        {isEditing ? (
          <input
            autoFocus
            value={editingValue}
            list={hasDatalist}
            onChange={e => setEditingValue(e.target.value)}
            onBlur={() => { if (editingValue !== val) onUpdate(item.id, 'COBO', field, editingValue); setEditingCell(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter') { if (editingValue !== val) onUpdate(item.id, 'COBO', field, editingValue); setEditingCell(null); }
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full bg-transparent outline-none border-b border-blue-500 text-zinc-900 dark:text-zinc-100 text-xs"
          />
        ) : (
          <span className="block truncate max-w-[160px] group-hover/cell:text-blue-500 transition-colors font-medium">
            {val || <span className="text-zinc-300 dark:text-zinc-600 italic">—</span>}
          </span>
        )}
        <SavingIndicator status={savingStatus[`COBO:${item.id}:${field}`]} />
      </td>
    );
  };

  return (
    <div className="view-root p-4 sm:p-6 space-y-5 animate-fade pb-20 h-full overflow-y-auto custom-scrollbar">

      {/* datalists */}
      <datalist id="dl-frequencia-cobo">{OPCOES_FREQUENCIA_COBO.map(o => <option key={o} value={o} />)}</datalist>
      <datalist id="dl-intencao-cobo">{OPCOES_INTENCAO_COBO.map(o => <option key={o} value={o} />)}</datalist>
      <datalist id="dl-formato-cobo">{OPCOES_FORMATO_COBO.map(o => <option key={o} value={o} />)}</datalist>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0"
            style={{ backgroundColor: activeClient['Cor (HEX)'] || '#18181b' }}
          >
            <Zap size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">COBO</h2>
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">·</span>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[160px]">{activeClient.Nome}</span>
            </div>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.15em]">Distribuição Estratégica de Canais</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Zone stats */}
          <div className="hidden md:flex items-center gap-2">
            {[
              { label: 'Quente', count: stats.quente, icon: <Flame size={11} />, color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20' },
              { label: 'Morna',  count: stats.morna,  icon: <Droplets size={11} />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
              { label: 'Fria',   count: stats.fria,   icon: <Snowflake size={11} />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
            ].map(s => (
              <div key={s.label} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-black ${s.color}`}>
                {s.icon} {s.count}
              </div>
            ))}
          </div>

          {!isMobile && (
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button onClick={() => { playUISound('tap'); setViewMode('cards'); }} className={`p-1.5 rounded transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}><LayoutGrid size={15} /></button>
              <button onClick={() => { playUISound('tap'); setViewMode('table'); }} className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}><List size={15} /></button>
            </div>
          )}

          <Button onClick={onAdd} className="!h-10 !px-4 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-xl !text-[10px] !font-black !uppercase shadow-lg shadow-zinc-500/10">
            <Plus size={14} className="mr-1.5 shrink-0" /> Novo
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all group">
          <Search size={14} className="text-zinc-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
          <input
            type="text"
            placeholder="Buscar canal, intenção, formato..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent outline-none text-[11px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {(['Instagram', 'YouTube', 'TikTok', 'LinkedIn'] as const).map(canal => {
            const s = getChannelStyle(canal);
            const active = filterCanal === canal;
            return (
              <button key={canal} onClick={() => setFilterCanal(active ? null : canal)}
                className={`h-9 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${active ? `${s.bg} ${s.text} ${s.border} shadow-sm` : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
              >
                <span className={active ? s.text : 'text-zinc-400'}>{s.icon}</span>
                <span className="hidden sm:inline">{canal}</span>
              </button>
            );
          })}
          <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-800 mx-0.5 shrink-0" />
          {[
            { label: 'Quente', icon: <Flame size={11} />, color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30' },
            { label: 'Morna',  icon: <Droplets size={11} />, color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30' },
            { label: 'Fria',   icon: <Snowflake size={11} />, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30' },
          ].map(z => (
            <button key={z.label} onClick={() => setFilterZona(filterZona === z.label ? null : z.label)}
              className={`h-9 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${filterZona === z.label ? z.color + ' shadow-sm' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
            >
              {z.icon} {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {filteredData.map(item => {
            const ch = getChannelStyle(item.Canal);
            const zo = getZonaStyle(item.Zona);
            const isSelected = selection.includes(item.id);
            return (
              <div
                key={item.id}
                className={`relative bg-white dark:bg-zinc-900 rounded-2xl border transition-all group cursor-pointer ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md'}`}
                onClick={() => setDrawerItem(item)}
              >
                {/* Checkbox */}
                <button
                  className="absolute top-3 left-3 z-10"
                  onClick={e => { e.stopPropagation(); onSelect(item.id); playUISound('tap'); }}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 opacity-0 group-hover:opacity-100'}`}>
                    {isSelected && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                </button>

                {/* Color accent top bar */}
                <div className={`h-1.5 rounded-t-2xl ${ch.bg.replace('bg-','bg-').replace('/10','').replace('50','200').replace('dark:bg-','')}`}
                  style={{ background: `linear-gradient(90deg, ${item.Canal?.toLowerCase().includes('instagram') ? '#e1306c' : item.Canal?.toLowerCase().includes('youtube') ? '#ff0000' : item.Canal?.toLowerCase().includes('linkedin') ? '#0a66c2' : item.Canal?.toLowerCase().includes('tiktok') ? '#010101' : item.Canal?.toLowerCase().includes('whatsapp') ? '#25d366' : '#6366f1'}40, transparent)` }}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${ch.bg} ${ch.text} ${ch.border} shrink-0`}>
                        {ch.icon}
                        <SavingIndicator status={savingStatus[`COBO:${item.id}:Canal`]} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-tight">{item.Canal || '—'}</h4>
                        <div className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border mt-1 ${zo.bg} ${zo.text} ${zo.border}`}>
                          {zo.icon} {item.Zona || '—'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setDrawerItem(item); playUISound('tap'); }}
                      className="p-1.5 text-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>

                  {/* Fields grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Frequência', value: item.Frequência, icon: <Clock size={9} /> },
                      { label: 'Público',    value: item.Público,    icon: <Users size={9} /> },
                      { label: 'Voz',        value: item.Voz,        icon: <Mic2 size={9} /> },
                      { label: 'Intenção',   value: item.Intenção,   icon: <Target size={9} /> },
                    ].map(({ label, value, icon }) => (
                      <div key={label} className="space-y-0.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">{icon} {label}</p>
                        <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 truncate">{value || <span className="text-zinc-300 dark:text-zinc-600 italic">—</span>}</p>
                      </div>
                    ))}
                  </div>

                  {/* Formato pill */}
                  {item.Formato && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 flex-wrap">
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1"><Layout size={9} /> Formato</span>
                      <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">{item.Formato}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add card */}
          <button
            onClick={() => { onAdd(); playUISound('success'); }}
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-zinc-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-600 dark:hover:text-blue-400 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
              <Plus size={18} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Novo Canal</span>
          </button>
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/30">
                  <th className="w-10 px-4 py-3">
                    <input type="checkbox" className="rounded border-zinc-300 text-blue-500 focus:ring-blue-400"
                      checked={selection.length === filteredData.length && filteredData.length > 0}
                      onChange={() => { if (selection.length === filteredData.length) { onClearSelection(); } else { filteredData.forEach(i => { if (!selection.includes(i.id)) onSelect(i.id); }); } }}
                    />
                  </th>
                  {['Canal', 'Zona', 'Frequência', 'Intenção', 'Formato', 'Público'].map(h => (
                    <th key={h} className="px-5 py-3 text-[9px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-5 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredData.map(item => {
                  const ch = getChannelStyle(item.Canal);
                  const zo = getZonaStyle(item.Zona);
                  const isSelected = selection.includes(item.id);
                  return (
                    <tr key={item.id}
                      className={`group cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/60 dark:bg-blue-500/5' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
                      onClick={() => setDrawerItem(item)}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-zinc-300 text-blue-500 focus:ring-blue-400"
                          checked={isSelected}
                          onChange={() => { onSelect(item.id); playUISound('tap'); }}
                        />
                      </td>
                      {/* Canal */}
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${ch.bg} ${ch.text} ${ch.border}`}>
                            {ch.icon}
                          </div>
                          <select value={item.Canal || ''} onChange={e => onUpdate(item.id, 'COBO', 'Canal', e.target.value)}
                            className="bg-transparent outline-none text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase cursor-pointer hover:text-blue-500 transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="">—</option>
                            {OPCOES_CANAL_COBO.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </td>
                      {/* Zona */}
                      <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                        <div className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-full border ${zo.bg} ${zo.text} ${zo.border}`}>
                          {zo.icon}
                          <select value={item.Zona || ''} onChange={e => onUpdate(item.id, 'COBO', 'Zona', e.target.value)}
                            className="bg-transparent outline-none font-black uppercase cursor-pointer"
                            style={{ color: 'inherit' }}
                            onClick={e => e.stopPropagation()}
                          >
                            <option value="">—</option>
                            {OPCOES_ZONA_COBO.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        </div>
                      </td>
                      {renderEditableCell(item, 'Frequência', 'dl-frequencia-cobo')}
                      {renderEditableCell(item, 'Intenção', 'dl-intencao-cobo')}
                      {renderEditableCell(item, 'Formato', 'dl-formato-cobo')}
                      {renderEditableCell(item, 'Público')}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); setDrawerItem(item); }} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={e => { e.stopPropagation(); onDelete([item.id], 'COBO'); }} className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && data.length > 0 && (
        <div className="py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <Filter size={28} className="text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">Nenhum resultado para este filtro</p>
          <Button variant="secondary" onClick={() => { setSearchTerm(''); setFilterCanal(null); setFilterZona(null); }} className="mt-6 !h-9 !px-4 !text-[10px] !font-black !rounded-xl !uppercase">Limpar Filtros</Button>
        </div>
      )}

      {filteredData.length === 0 && data.length === 0 && (
        <div className="py-16 text-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mx-auto mb-4 border border-zinc-200 dark:border-zinc-700">
            <Layout size={24} />
          </div>
          <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-6">Nenhum canal configurado</p>
          <Button onClick={onAdd} className="!h-10 !px-5 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-xl !text-[10px] !font-black !uppercase">
            <Plus size={14} className="mr-2" /> Adicionar Canal
          </Button>
        </div>
      )}

      {/* Selection Bar */}
      {selection.length > 0 && (
        <DeletionBar
          count={selection.length}
          onDelete={() => onDelete(selection, 'COBO')}
          onArchive={() => onArchive(selection, 'COBO', true)}
          onClear={onClearSelection}
        />
      )}

      {/* COBO Drawer */}
      {drawerItem && (
        <CoboDrawer
          item={drawerItem}
          cliente={clients.find(c => c.id === drawerItem.Cliente_ID) || activeClient || undefined}
          onClose={() => setDrawerItem(null)}
          onUpdate={(field, value) => {
            onUpdate(drawerItem.id, 'COBO', field, value);
            setDrawerItem((prev: any) => prev ? { ...prev, [field]: value } : null);
          }}
          onDelete={() => { onDelete([drawerItem.id], 'COBO'); setDrawerItem(null); }}
        />
      )}
    </div>
  );
}
