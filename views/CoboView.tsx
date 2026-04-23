
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  List, LayoutGrid, Search, Plus, Trash2, Edit2, 
  Instagram, Youtube, Twitter, Facebook, Linkedin, 
  MessageCircle, Send, Globe, Filter, X, ChevronRight,
  Target, Zap, Mic2, Map, Layout, CheckCircle2, AlertCircle, Users, Clock
} from 'lucide-react';
import { Card, Button, InputSelect, Badge, DeletionBar } from '../Components';
import { 
  OPCOES_CANAL_COBO, OPCOES_FREQUENCIA_COBO, OPCOES_PUBLICO_COBO, 
  OPCOES_VOZ_COBO, OPCOES_ZONA_COBO, OPCOES_INTENCAO_COBO, 
  OPCOES_FORMATO_COBO, OPCOES_ZONA 
} from '../constants';
import { Cliente, TipoTabela } from '../types';
import { playUISound } from '../utils/uiSounds';

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
      {status === 'saving' && (
        <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      )}
      {status === 'success' && (
        <CheckCircle2 size={12} className="text-emerald-500" />
      )}
      {status === 'error' && (
        <AlertCircle size={12} className="text-rose-500" />
      )}
    </div>
  );
};

const getSocialIcon = (canal: string) => {
  const c = canal.toLowerCase();
  if (c.includes('instagram')) return <Instagram size={14} />;
  if (c.includes('youtube')) return <Youtube size={14} />;
  if (c.includes('tiktok')) return <Mic2 size={14} />; // Using Mic2 as fallback for TikTok if icon missing
  if (c.includes('facebook')) return <Facebook size={14} />;
  if (c.includes('linkedin')) return <Linkedin size={14} />;
  if (c.includes('whatsapp')) return <MessageCircle size={14} />;
  if (c.includes('telegram')) return <Send size={14} />;
  return <Globe size={14} />;
};

const getSocialColor = (canal: string) => {
  const c = canal.toLowerCase();
  if (c.includes('instagram')) return 'indigo';
  if (c.includes('youtube')) return 'rose';
  if (c.includes('tiktok')) return 'slate';
  if (c.includes('facebook')) return 'blue';
  if (c.includes('linkedin')) return 'blue';
  if (c.includes('whatsapp')) return 'emerald';
  if (c.includes('telegram')) return 'blue';
  return 'slate';
};

const getZonaColor = (zona: string) => {
  const z = zona.toLowerCase();
  if (z.includes('quente') || z.includes('conversão') || z.includes('primária')) return 'orange';
  if (z.includes('morna') || z.includes('nutrição') || z.includes('secundária')) return 'amber';
  if (z.includes('fria') || z.includes('aquisição') || z.includes('paralela')) return 'blue';
  return 'slate';
};

export function CoboView({
  data, onUpdate, onDelete, onArchive, onAdd,
  clients, activeClient, onSelectClient,
  selection, onSelect, onClearSelection,
  savingStatus = {}
}: CoboViewProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>(window.innerWidth < 640 ? 'cards' : 'table');

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
      if (mobile) setViewMode('cards');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Escape listener for modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingItem(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanal, setFilterCanal] = useState<string | null>(null);
  const [filterZona, setFilterZona] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchTerm || 
        Object.values(item).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCanal = !filterCanal || item.Canal?.toLowerCase().includes(filterCanal.toLowerCase());
      const matchesZona = !filterZona || (
        (filterZona === 'Quente' && (item.Zona === 'Primária' || item.Zona === 'Conversão')) ||
        (filterZona === 'Morna' && (item.Zona === 'Secundária' || item.Zona === 'Nutrição')) ||
        (filterZona === 'Fria' && (item.Zona === 'Paralela' || item.Zona === 'Aquisição')) ||
        item.Zona?.toLowerCase().includes(filterZona.toLowerCase())
      );
      return matchesSearch && matchesCanal && matchesZona;
    });
  }, [data, searchTerm, filterCanal, filterZona]);

  if (!activeClient) {
    return (
      <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-900 dark:text-zinc-100 shadow-xl shadow-zinc-500/5 border border-zinc-200 dark:border-zinc-700">
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

  const handleEdit = (item: any) => {
    setEditingItem({ ...item });
  };

  const handleSave = () => {
    if (editingItem) {
      Object.entries(editingItem).forEach(([field, value]) => {
        if (field !== 'id') onUpdate(editingItem.id, 'COBO', field, value);
      });
      setEditingItem(null);
      playUISound('success');
    }
  };

  const renderEditableCell = (item: any, field: string, hasDatalist?: string, isBadge: boolean = false) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    return (
      <td 
        className="px-6 py-3 min-w-[180px] text-xs font-medium text-zinc-500 relative group/cell"
        onClick={(e) => {
          e.stopPropagation();
          setEditingCell({ id: item.id, field });
          setEditingValue(item[field] || '');
        }}
      >
        {isEditing ? (
          <input
            autoFocus
            value={editingValue}
            list={hasDatalist}
            onChange={e => setEditingValue(e.target.value)}
            onBlur={() => {
              if (editingValue !== (item[field] || '')) {
                onUpdate(item.id, 'COBO', field, editingValue);
              }
              setEditingCell(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (editingValue !== (item[field] || '')) {
                  onUpdate(item.id, 'COBO', field, editingValue);
                }
                setEditingCell(null);
              }
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full bg-transparent outline-none border-b border-blue-500 text-zinc-900 dark:text-zinc-100 uppercase"
          />
        ) : (
          <div className="max-w-[180px] overflow-hidden cursor-pointer">
            {isBadge ? (
              <Badge color="slate" className="truncate block group-hover/cell:border-blue-500 transition-colors">{item[field] || '-'}</Badge>
            ) : (
              <span className="block truncate max-w-[180px] group-hover/cell:text-blue-500 transition-colors">{item[field] || '-'}</span>
            )}
          </div>
        )}
        <SavingIndicator status={savingStatus[`COBO:${item.id}:${field}`]} />
      </td>
    );
  };

  return (
    <div className="view-root p-4 sm:p-6 space-y-6 animate-fade pb-20 h-full overflow-y-auto custom-scrollbar">
      <datalist id="dl-frequencia-cobo">
        {OPCOES_FREQUENCIA_COBO.map(opt => <option key={opt} value={opt} />)}
      </datalist>
      <datalist id="dl-intencao-cobo">
        {OPCOES_INTENCAO_COBO.map(opt => <option key={opt} value={opt} />)}
      </datalist>
      <datalist id="dl-formato-cobo">
        {OPCOES_FORMATO_COBO.map(opt => <option key={opt} value={opt} />)}
      </datalist>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10">
            <Zap size={24} className="shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">COBO</h2>
              <Badge color="slate">{filteredData.length} Registros</Badge>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Distribuição Estratégica de Canais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle list/card — hidden on mobile (always cards) */}
          {!isMobile && (
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <button
                onClick={() => { playUISound('tap'); setViewMode('table'); }}
                className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => { playUISound('tap'); setViewMode('cards'); }}
                className={`p-1.5 rounded transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          )}

          <Button onClick={onAdd} className="!h-10 !px-5 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-lg !text-[11px] !font-bold !uppercase shadow-lg shadow-zinc-500/10 transition-transform hover:scale-[1.02]">
            <Plus size={16} className="mr-2 shrink-0" /> Novo Registro
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-center gap-2 flex-1 group h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 focus-within:ring-2 focus-within:ring-zinc-500/10 focus-within:border-zinc-500 transition-all">
          <Search className="text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors shrink-0" size={18} />
          <input
            type="text"
            placeholder="Buscar por canal, intenção ou formato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[11px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['Instagram', 'YouTube', 'TikTok'].map(canal => (
            <button
              key={canal}
              onClick={() => setFilterCanal(filterCanal === canal ? null : canal)}
              className={`h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${filterCanal === canal ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-500/10' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
            >
              {getSocialIcon(canal)} {canal}
            </button>
          ))}
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 shrink-0"></div>
          {['Quente', 'Morna', 'Fria'].map(zona => (
            <button
              key={zona}
              onClick={() => setFilterZona(filterZona === zona ? null : zona)}
              className={`h-10 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${filterZona === zona ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-500/10' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
            >
              {zona}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
          <div className="table-responsive overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-[15%]">Canal</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-[15%]">Frequência</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-[15%]">Zona</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[180px]">Intenção</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[180px]">Formato</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredData.map(item => (
                  <tr key={item.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-6 py-3 relative" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 shrink-0">
                          {getSocialIcon(item.Canal)}
                        </div>
                        <select
                          value={item.Canal || ''}
                          onChange={e => onUpdate(item.id, 'COBO', 'Canal', e.target.value)}
                          className="bg-transparent outline-none text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight cursor-pointer hover:text-blue-500 border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-0.5"
                        >
                          <option value="">Selecione</option>
                          {OPCOES_CANAL_COBO.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <SavingIndicator status={savingStatus[`COBO:${item.id}:Canal`]} />
                    </td>
                    {renderEditableCell(item, 'Frequência', 'dl-frequencia-cobo')}
                    <td className="px-6 py-3 relative" onClick={e => e.stopPropagation()}>
                        <select
                          value={item.Zona || ''}
                          onChange={e => onUpdate(item.id, 'COBO', 'Zona', e.target.value)}
                          className="bg-transparent outline-none text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase cursor-pointer hover:text-blue-500 border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-0.5"
                        >
                          <option value="">Selecione</option>
                          {OPCOES_ZONA_COBO.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      <SavingIndicator status={savingStatus[`COBO:${item.id}:Zona`]} />
                    </td>
                    {renderEditableCell(item, 'Intenção', 'dl-intencao-cobo', true)}
                    {renderEditableCell(item, 'Formato', 'dl-formato-cobo', true)}
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => onDelete([item.id], 'COBO')} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.map(item => (
            <div key={item.id} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group relative overflow-hidden shadow-sm">
               <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 shadow-sm relative">
                    {getSocialIcon(item.Canal)}
                    <SavingIndicator status={savingStatus[`COBO:${item.id}:Canal`]} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{item.Canal}</h4>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{activeClient.Nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(item)} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete([item.id], 'COBO')} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 relative z-10">
                <div className="space-y-1 relative">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Frequência</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.Frequência}</p>
                  <SavingIndicator status={savingStatus[`COBO:${item.id}:Frequência`]} />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Zona</p>
                  <Badge color={getZonaColor(item.Zona) as any}>{item.Zona}</Badge>
                  <SavingIndicator status={savingStatus[`COBO:${item.id}:Zona`]} />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Voz</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.Voz}</p>
                  <SavingIndicator status={savingStatus[`COBO:${item.id}:Voz`]} />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Público</p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{item.Público}</p>
                  <SavingIndicator status={savingStatus[`COBO:${item.id}:Público`]} />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Intenção</p>
                  <Badge color="slate" className="w-fit">{item.Intenção}</Badge>
                  <SavingIndicator status={savingStatus[`COBO:${item.id}:Intenção`]} />
                </div>
                <div className="space-y-1 relative">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Formato</p>
                  <Badge color="slate" className="w-fit">{item.Formato}</Badge>
                  <SavingIndicator status={savingStatus[`COBO:${item.id}:Formato`]} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="py-20 text-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 mx-auto mb-6 border border-zinc-200 dark:border-zinc-700">
            <Layout size={32} />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Nenhum Registro Encontrado</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Tente ajustar seus filtros ou busca.</p>
          <Button variant="secondary" onClick={() => { setSearchTerm(''); setFilterCanal(null); setFilterZona(null); }} className="mt-8 !h-9 !px-4 !text-[10px] !font-bold !rounded-lg !uppercase">Limpar Filtros</Button>
        </div>
      )}

      {/* Modal de Edição - Via Portal para garantir que fique acima de tudo */}
      {editingItem && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop que cobre 100% da tela */}
          <div 
            className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setEditingItem(null)} 
          />
          
          {/* Modal Container perfeitamente centralizado */}
          <div 
            className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-[560px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Edit2 size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[20px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight uppercase">Editar COBO</h3>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-0.5">Refinando a estratégia de canal</p>
              </div>
              <button 
                onClick={() => setEditingItem(null)} 
                className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center text-zinc-500 transition-colors"
                aria-label="FECHAR"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar max-h-[calc(100vh-200px)]">
              
              {/* DISTRIBUIÇÃO */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4 ml-1">
                  <Globe size={14} className="text-blue-500" />
                  <span>Distribuição</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputSelect
                    label="Canal"
                    icon={Globe}
                    placeholder="Ex: Instagram"
                    value={editingItem.Canal}
                    options={OPCOES_CANAL_COBO}
                    onChange={(val) => setEditingItem({ ...editingItem, Canal: val })}
                    editable={true}
                  />
                  <InputSelect
                    label="Frequência"
                    icon={Clock}
                    placeholder="Ex: 3x semana"
                    value={editingItem.Frequência}
                    options={OPCOES_FREQUENCIA_COBO}
                    onChange={(val) => setEditingItem({ ...editingItem, Frequência: val })}
                    editable={true}
                  />
                </div>
              </div>

              {/* AUDIÊNCIA */}
              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4 ml-1">
                  <Users size={14} className="text-emerald-500" />
                  <span>Audiência</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputSelect
                    label="Público-Alvo"
                    icon={Target}
                    placeholder="Descreva o público"
                    value={editingItem.Público}
                    options={OPCOES_PUBLICO_COBO}
                    onChange={(val) => setEditingItem({ ...editingItem, Público: val })}
                    editable={true}
                  />
                  <InputSelect
                    label="Voz da Marca"
                    icon={Mic2}
                    placeholder="Tom de voz"
                    value={editingItem.Voz}
                    options={OPCOES_VOZ_COBO}
                    onChange={(val) => setEditingItem({ ...editingItem, Voz: val })}
                    editable={true}
                  />
                </div>
              </div>

              {/* CONTEÚDO ESTRATÉGICO */}
              <div className="pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4 ml-1">
                  <Layout size={14} className="text-amber-500" />
                  <span>Conteúdo Estratégico</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <InputSelect
                    label="Zona"
                    icon={Zap}
                    placeholder="Zona"
                    value={editingItem.Zona}
                    options={[
                      { value: 'Primária', label: 'Quente', color: 'orange' },
                      { value: 'Conversão', label: 'Quente', color: 'orange' },
                      { value: 'Secundária', label: 'Morna', color: 'amber' },
                      { value: 'Nutrição', label: 'Morna', color: 'amber' },
                      { value: 'Paralela', label: 'Fria', color: 'blue' },
                      { value: 'Aquisição', label: 'Fria', color: 'blue' },
                    ]}
                    onChange={(val) => setEditingItem({ ...editingItem, Zona: val })}
                    editable={true}
                  />
                  <InputSelect
                    label="Intenção"
                    icon={Target}
                    placeholder="Objetivo"
                    value={editingItem.Intenção}
                    options={OPCOES_INTENCAO_COBO}
                    onChange={(val) => setEditingItem({ ...editingItem, Intenção: val })}
                    editable={true}
                  />
                  <InputSelect
                    label="Formato"
                    icon={Layout}
                    placeholder="Formato"
                    value={editingItem.Formato}
                    options={OPCOES_FORMATO_COBO}
                    onChange={(val) => setEditingItem({ ...editingItem, Formato: val })}
                    editable={true}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/50 shrink-0">
              <button 
                className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ios-btn"
                onClick={() => setEditingItem(null)}
              >
                Cancelar
              </button>
              <button 
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm ios-btn shadow-blue-600/10"
                onClick={handleSave}
              >
                <CheckCircle2 size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selection.length > 0 && (
        <DeletionBar
          count={selection.length}
          onDelete={() => onDelete(selection, 'COBO')}
          onArchive={() => onArchive(selection, 'COBO', true)}
          onClear={onClearSelection}
        />
      )}
    </div>
  );
}
