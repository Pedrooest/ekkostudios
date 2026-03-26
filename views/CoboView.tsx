
import React, { useState, useMemo } from 'react';
import { 
  List, LayoutGrid, Search, Plus, Trash2, Edit2, 
  Instagram, Youtube, Twitter, Facebook, Linkedin, 
  MessageCircle, Send, Globe, Filter, X, ChevronRight,
  Target, Zap, Mic2, Map, Layout, CheckCircle2, AlertCircle, Users, Clock
} from 'lucide-react';
import { Card, Button, InputSelect, Badge, DeletionBar } from '../Components';
import { BottomSheet } from '../components/BottomSheet';
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
}

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
  if (c.includes('tiktok')) return 'zinc';
  if (c.includes('facebook')) return 'blue';
  if (c.includes('linkedin')) return 'blue';
  if (c.includes('whatsapp')) return 'emerald';
  if (c.includes('telegram')) return 'blue';
  return 'zinc';
};

const getZonaColor = (zona: string) => {
  const z = zona.toLowerCase();
  if (z.includes('quente') || z.includes('conversão') || z.includes('primária')) return 'orange';
  if (z.includes('morna') || z.includes('nutrição') || z.includes('secundária')) return 'amber';
  if (z.includes('fria') || z.includes('aquisição') || z.includes('paralela')) return 'blue';
  return 'zinc';
};

export function CoboView({
  data, onUpdate, onDelete, onArchive, onAdd,
  clients, activeClient, onSelectClient,
  selection, onSelect, onClearSelection
}: CoboViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanal, setFilterCanal] = useState<string | null>(null);
  const [filterZona, setFilterZona] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

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
      <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade">
        <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 text-4xl shadow-[0_0_30px_rgba(37,99,235,0.2)]">
          <Target size={40} />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-app-text-strong uppercase tracking-widest">Estratégia COBO</h3>
          <p className="text-xs font-bold text-app-text-muted uppercase tracking-widest">Selecione um cliente para visualizar sua distribuição de canais.</p>
        </div>
        <select
          value=""
          onChange={(e) => onSelectClient(e.target.value)}
          className="w-full max-w-sm h-12 bg-app-surface text-app-text-strong text-xs font-bold uppercase pl-4 pr-10 rounded-xl border border-app-border outline-none appearance-none cursor-pointer hover:border-blue-500 transition-colors shadow-xl"
        >
          <option value="" disabled>Selecionar Cliente</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>{c.Nome}</option>
          ))}
        </select>
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

  return (
    <div className="space-y-6 animate-fade pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-app-surface/30 p-6 rounded-[2rem] border border-app-border/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Zap size={28} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-app-text-strong uppercase tracking-tight">COBO</h2>
              <Badge color="blue">{filteredData.length} Registros</Badge>
            </div>
            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1">
              Distribuição Estratégica de Canais e Conteúdo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-app-bg p-1 rounded-xl border border-app-border">
            <button
              onClick={() => { playUISound('tap'); setViewMode('table'); }}
              className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-blue-600 text-white shadow-lg' : 'text-app-text-muted hover:text-app-text-strong'}`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => { playUISound('tap'); setViewMode('cards'); }}
              className={`p-2 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-blue-600 text-white shadow-lg' : 'text-app-text-muted hover:text-app-text-strong'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>

          <Button onClick={onAdd} className="!h-12 !px-6 !bg-blue-600 hover:!bg-blue-700 shadow-lg shadow-blue-600/20">
            <Plus size={18} className="mr-2" /> Novo Registro
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-blue-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar por canal, intenção ou formato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-14 bg-app-surface border border-app-border rounded-2xl pl-12 pr-4 text-sm font-medium text-app-text-strong outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['Instagram', 'YouTube', 'TikTok'].map(canal => (
            <button
              key={canal}
              onClick={() => setFilterCanal(filterCanal === canal ? null : canal)}
              className={`h-11 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${filterCanal === canal ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-app-surface border-app-border text-app-text-muted hover:border-blue-500/50 hover:text-app-text-strong'}`}
            >
              {getSocialIcon(canal)} {canal}
            </button>
          ))}
          <div className="w-px h-6 bg-app-border mx-1"></div>
          {['Quente', 'Morna', 'Fria'].map(zona => (
            <button
              key={zona}
              onClick={() => setFilterZona(filterZona === zona ? null : zona)}
              className={`h-11 px-5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filterZona === zona ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-app-surface border-app-border text-app-text-muted hover:border-orange-500/50 hover:text-app-text-strong'}`}
            >
              {zona}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' ? (
        <div className="bg-app-surface rounded-[2rem] border border-app-border overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-app-border/40 bg-app-surface-2/30">
                  <th className="p-5 text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] pl-8">Canal</th>
                  <th className="p-5 text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em]">Frequência</th>
                  <th className="p-5 text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em]">Zona</th>
                  <th className="p-5 text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em]">Intenção</th>
                  <th className="p-5 text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em]">Formato</th>
                  <th className="p-5 text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] text-right pr-8">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/20">
                {filteredData.map(item => (
                  <tr key={item.id} className="group hover:bg-blue-500/[0.02] transition-colors">
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${getSocialColor(item.Canal)}-500/10 text-${getSocialColor(item.Canal)}-500 border border-${getSocialColor(item.Canal)}-500/20`}>
                          {getSocialIcon(item.Canal)}
                        </div>
                        <span className="text-xs font-bold text-app-text-strong uppercase tracking-tight truncate min-w-0">{item.Canal}</span>
                      </div>
                    </td>
                    <td className="p-5 text-xs font-medium text-app-text-muted">{item.Frequência}</td>
                    <td className="p-5">
                      <Badge color={getZonaColor(item.Zona) as any}>{item.Zona}</Badge>
                    </td>
                    <td className="p-5">
                      <Badge color="slate">{item.Intenção}</Badge>
                    </td>
                    <td className="p-5">
                      <Badge color="slate">{item.Formato}</Badge>
                    </td>
                    <td className="p-5 text-right pr-8">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(item)} className="p-2 text-app-text-muted hover:text-blue-500 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDelete([item.id], 'COBO')} className="p-2 text-app-text-muted hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
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
            <div key={item.id} className="bg-app-surface p-6 rounded-3xl border border-app-border hover:border-blue-500/30 transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${getSocialColor(item.Canal)}-500/10 text-${getSocialColor(item.Canal)}-500 border border-${getSocialColor(item.Canal)}-500/20 shadow-sm`}>
                    {getSocialIcon(item.Canal)}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-app-text-strong uppercase tracking-tight">{item.Canal}</h4>
                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest">{activeClient.Nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(item)} className="p-2 text-app-text-muted hover:text-blue-500 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete([item.id], 'COBO')} className="p-2 text-app-text-muted hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest">Frequência</p>
                  <p className="text-xs font-bold text-app-text-strong">{item.Frequência}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest">Zona</p>
                  <Badge color={getZonaColor(item.Zona) as any}>{item.Zona}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest">Voz</p>
                  <p className="text-xs font-bold text-app-text-strong">{item.Voz}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest">Público</p>
                  <p className="text-xs font-bold text-app-text-strong">{item.Público}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest">Intenção</p>
                  <Badge color="slate" className="w-fit">{item.Intenção}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest">Formato</p>
                  <Badge color="slate" className="w-fit">{item.Formato}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="py-20 text-center bg-app-surface/50 rounded-[2rem] border border-dashed border-app-border animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-zinc-500/10 rounded-full flex items-center justify-center text-zinc-500 mx-auto mb-6">
            <Layout size={40} />
          </div>
          <h3 className="text-lg font-black text-app-text-strong uppercase tracking-widest">Nenhum Registro Encontrado</h3>
          <p className="text-xs font-bold text-app-text-muted uppercase tracking-widest mt-2">Tente ajustar seus filtros ou busca.</p>
          <Button variant="secondary" onClick={() => { setSearchTerm(''); setFilterCanal(null); setFilterZona(null); }} className="mt-8 border-app-border">Limpar Filtros</Button>
        </div>
      )}

      {/* Modal / BottomSheet de Edição - REESCRITO DO ZERO */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingItem(null)}>
          <div 
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-[560px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-4 p-6 border-b border-zinc-100 dark:border-zinc-800 relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Edit2 size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[20px] font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">Editar COBO</h3>
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
            <div className="p-6 space-y-6 max-h-[70dvh] overflow-y-auto custom-scrollbar">
              
              {/* DISTRIBUIÇÃO */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 ml-1">
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
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 ml-1">
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
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 ml-1">
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
            <div className="flex gap-3 p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/50">
              <button 
                className="flex-1 h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ios-btn"
                onClick={() => setEditingItem(null)}
              >
                Cancelar
              </button>
              <button 
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm ios-btn"
                onClick={handleSave}
              >
                <CheckCircle2 size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
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
