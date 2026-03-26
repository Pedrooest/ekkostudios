import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  List, LayoutGrid, Search, Plus, Trash2, Edit2, 
  Instagram, Youtube, Twitter, Facebook, Linkedin, 
  MessageCircle, Send, Globe, Filter, X, ChevronRight,
  Database, Layout, Users, Megaphone, Target, BarChart3, CheckSquare, Zap, Target as TargetIcon, CheckCircle2
} from 'lucide-react';
import { Card, Button, InputSelect, Badge, DeletionBar } from '../Components';
import { 
  OPCOES_FUNCAO_MATRIZ, OPCOES_QUEM_FALA_MATRIZ, 
  OPCOES_PAPEL_ESTRATEGICO_MATRIZ, OPCOES_TIPO_CONTEUDO_MATRIZ, 
  OPCOES_RESULTADO_ESPERADO_MATRIZ
} from '../constants';
import { Cliente, TipoTabela } from '../types';
import { playUISound } from '../utils/uiSounds';

interface MatrizEstrategicaViewProps {
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
  if (!canal) return <Globe size={14} />;
  const c = String(canal).toLowerCase();
  if (c.includes('instagram')) return <Instagram size={14} />;
  if (c.includes('youtube')) return <Youtube size={14} />;
  if (c.includes('tiktok')) return <MessageCircle size={14} />; 
  if (c.includes('facebook')) return <Facebook size={14} />;
  if (c.includes('linkedin')) return <Linkedin size={14} />;
  if (c.includes('twitter') || c.includes('x')) return <Twitter size={14} />;
  if (c.includes('whatsapp')) return <MessageCircle size={14} />;
  if (c.includes('telegram')) return <Send size={14} />;
  return <Globe size={14} />;
};

const getSocialColor = (canal: string): any => {
  if (!canal) return 'slate';
  const c = String(canal).toLowerCase();
  if (c.includes('instagram')) return 'indigo';
  if (c.includes('youtube')) return 'rose';
  if (c.includes('tiktok')) return 'zinc';
  if (c.includes('facebook')) return 'blue';
  if (c.includes('linkedin')) return 'blue';
  if (c.includes('whatsapp')) return 'emerald';
  if (c.includes('telegram')) return 'blue';
  return 'slate';
};

const getFuncaoColor = (funcao: string): any => {
  if (!funcao) return 'slate';
  const f = String(funcao).toLowerCase();
  if (f.includes('atração') || f.includes('topo')) return 'blue';
  if (f.includes('retenção') || f.includes('meio')) return 'amber';
  if (f.includes('conversão') || f.includes('fundo')) return 'emerald';
  return 'slate';
};

export function MatrizEstrategicaView({
  data, onUpdate, onDelete, onArchive, onAdd,
  clients, activeClient, onSelectClient,
  selection, onSelect, onClearSelection
}: MatrizEstrategicaViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanal, setFilterCanal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchTerm || 
        Object.values(item).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCanal = !filterCanal || String(item['Rede_Social'])?.toLowerCase().includes(filterCanal.toLowerCase());
      return matchesSearch && matchesCanal;
    });
  }, [data, searchTerm, filterCanal]);

  const handleEdit = (item: any) => {
    setEditingItem({ ...item });
  };

  const handleSave = () => {
    if (editingItem) {
      Object.entries(editingItem).forEach(([field, value]) => {
        if (field !== 'id') onUpdate(editingItem.id, 'MATRIZ', field, value);
      });
      setEditingItem(null);
      playUISound('success');
    }
  };

  // Group by client for Card Mode
  const groupedByClient = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredData.forEach(item => {
      const clientId = item.Cliente_ID;
      if (!groups[clientId]) groups[clientId] = [];
      groups[clientId].push(item);
    });
    return groups;
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-fade pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-app-surface/30 p-6 rounded-[2rem] border border-app-border/40 backdrop-blur-md">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
            <Database size={28} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-black text-app-text-strong uppercase tracking-tight truncate">Matriz Estratégica</h2>
              <Badge color="blue">{filteredData.length} Registros</Badge>
            </div>
            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1 truncate">
              Gerenciamento Unificado de Estrutura e Estratégia
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
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

          <Button onClick={() => { playUISound('tap'); onAdd(); }} className="!h-12 !px-6 !bg-blue-600 hover:!bg-blue-700 shadow-lg shadow-blue-600/20">
            <Plus size={18} className="mr-2" /> Nova Entrada
          </Button>
        </div>
      </div>

      {/* Control Bar: Selection & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Selection Actions */}
        <div className={`transition-all duration-300 ${selection.length > 0 ? 'opacity-100 scale-100 w-full md:w-auto h-auto' : 'opacity-0 scale-95 w-0 h-0 overflow-hidden'}`}>
          <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-2 w-full md:w-auto backdrop-blur-sm">
            <div className="px-4 py-2 border-r border-blue-500/20">
              <span className="text-sm font-black text-blue-500 uppercase tracking-wider">{selection.length}</span>
              <span className="text-[10px] font-bold text-blue-500/70 uppercase tracking-widest ml-2">Selecionados</span>
            </div>
            <div className="flex items-center gap-1 px-2">
              <button 
                onClick={() => onArchive(selection, 'MATRIZ', true)}
                className="ios-btn p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors tooltip-trigger"
                data-tooltip="Arquivar"
              >
                <Trash2 size={18} />
              </button>
              <button 
                onClick={onClearSelection}
                className="ios-btn p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors tooltip-trigger"
                data-tooltip="Limpar Seleção"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`flex flex-col md:flex-row gap-4 flex-1 w-full justify-end transition-all ${selection.length > 0 ? 'md:max-w-xl' : 'max-w-full'}`}>
          
          <div className="relative w-full md:w-64">
            <InputSelect
              value={activeClient ? activeClient.id : ''}
              onChange={(val) => onSelectClient(val)}
              options={[{value: '', label: 'Todos os Clientes'}, ...clients.map(c => ({value: c.id, label: c.Nome}))]}
              placeholder="Todos os Clientes"
              className="bg-app-surface border border-app-border text-xs font-bold w-full"
              icon="fa-users"
            />
          </div>

          <div className="relative flex-1 group min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted group-focus-within:text-blue-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar por papéis, conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 bg-app-surface border border-app-border rounded-xl pl-10 pr-4 text-xs font-medium text-app-text-strong outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
             {['Instagram', 'YouTube', 'TikTok'].map(canal => (
              <button
                key={canal}
                onClick={() => setFilterCanal(filterCanal === canal ? null : canal)}
                className={`h-11 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${filterCanal === canal ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-app-surface border-app-border text-app-text-muted hover:border-blue-500/50 hover:text-app-text-strong'}`}
              >
                {getSocialIcon(canal)}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Main Content */}
      {filteredData.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-app-surface border border-app-border rounded-2xl flex items-center justify-center text-app-text-muted mb-4">
            <Search size={24} />
          </div>
          <h3 className="text-lg font-black text-app-text-strong uppercase tracking-widest mb-2">Nenhum registro encontrado</h3>
          <p className="text-sm text-app-text-muted font-medium mb-6 max-w-md">
            Não encontramos nenhum dado na Matriz Estratégica com os filtros atuais.
          </p>
          <Button onClick={onAdd} className="!bg-blue-600">
            Criar Nova Entrada
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE MODE (SaaS Dense) */
        <div className="bg-app-surface border border-app-border rounded-[2rem] overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-app-surface-2 border-b border-app-border">
                  <th className="px-4 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      onChange={e => { 
                        if (e.target.checked) filteredData.forEach(r => !selection.includes(r.id) && onSelect(r.id)); 
                        else onClearSelection(); 
                      }} 
                      checked={filteredData.length > 0 && filteredData.every(r => selection.includes(r.id))} 
                      className="rounded bg-app-bg border-app-border text-blue-500 focus:ring-0" 
                    />
                  </th>
                  {!activeClient && <th className="px-5 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">Cliente</th>}
                  <th className="px-5 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">Rede Social</th>
                  <th className="px-5 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">Função</th>
                  <th className="px-5 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">Quem Fala</th>
                  <th className="px-5 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">Papel Estratégico</th>
                  <th className="px-5 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">Tipo de Conteúdo</th>
                  <th className="px-5 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em]">Resultado Esperado</th>
                  <th className="px-5 py-4 text-[10px] font-black text-app-text-muted uppercase tracking-[0.15em] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border">
                {filteredData.map(row => {
                  const client = clients.find(c => c.id === row.Cliente_ID);
                  return (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-app-surface-2 transition-colors group cursor-pointer ${selection.includes(row.id) ? 'bg-blue-600/5' : ''}`}
                      onClick={() => handleEdit(row)}
                    >
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selection.includes(row.id)} 
                          onChange={() => onSelect(row.id)} 
                          className="rounded bg-app-bg border-app-border text-blue-500 focus:ring-0" 
                        />
                      </td>
                      {!activeClient && (
                        <td className="px-5 py-3">
                          <span className="text-xs font-bold text-app-text-strong">{client?.Nome || 'Agência'}</span>
                        </td>
                      )}
                      <td className="px-5 py-3">
                         <div className="flex items-center gap-2">
                           {getSocialIcon(row['Rede_Social'])}
                           <Badge color={getSocialColor(row['Rede_Social'])} className="!py-0.5 !text-[10px]">{row['Rede_Social'] || 'N/A'}</Badge>
                         </div>
                      </td>
                      <td className="px-5 py-3">
                         <Badge color={getFuncaoColor(row['Função'])} className="!py-0.5 !text-[10px]">{row['Função'] || 'N/A'}</Badge>
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-app-text-muted">
                        {row['Quem fala'] || '-'}
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-app-text-strong truncate max-w-xs">
                        {row['Papel estratégico'] || '-'}
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-app-text-strong truncate max-w-xs">
                        {row['Tipo de conteúdo'] || '-'}
                      </td>
                      <td className="px-5 py-3 text-xs font-medium text-app-text-strong truncate max-w-xs">
                        {row['Resultado esperado'] || '-'}
                      </td>
                      <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => handleEdit(row)}
                          className="w-8 h-8 rounded-lg border border-app-border flex items-center justify-center text-app-text-muted hover:text-blue-500 hover:border-blue-500 transition-colors ml-auto"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS MODE */
        <div className="space-y-12">
          {Object.entries(groupedByClient).map(([clientId, items]) => {
            const client = clients.find(c => c.id === clientId);
            return (
              <div key={clientId} className="space-y-6">
                <div className="flex items-center gap-4 border-b border-app-border pb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-app-text-strong uppercase tracking-widest">{client?.Nome || 'Agência'}</h3>
                    <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest">{items.length} Entradas nesta matriz</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map(row => (
                    <div 
                      key={row.id}
                      onClick={() => handleEdit(row)}
                      className={`bg-white dark:bg-[#0B0B0E] border rounded-[2rem] p-6 cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${selection.includes(row.id) ? 'border-blue-500 shadow-blue-500/10 shadow-lg' : 'border-app-border hover:border-blue-500/50'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                           <input 
                            type="checkbox" 
                            checked={selection.includes(row.id)} 
                            onChange={() => onSelect(row.id)} 
                            className="rounded bg-app-bg border-app-border text-blue-500 focus:ring-0 mr-2" 
                          />
                          {getSocialIcon(row['Rede_Social'])}
                          <Badge color={getSocialColor(row['Rede_Social'])} className="!py-0.5 !text-[10px]">{row['Rede_Social'] || 'N/A'}</Badge>
                        </div>
                        <Badge color={getFuncaoColor(row['Função'])} className="!py-0.5 !text-[10px]">{row['Função'] || 'N/A'}</Badge>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Papel Estratégico</p>
                          <p className="text-sm font-bold text-app-text-strong line-clamp-2">{row['Papel estratégico'] || '-'}</p>
                        </div>
                        
                        <div className="pt-4 border-t border-app-border/50">
                          <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-1">Tipo de Conteúdo</p>
                          <p className="text-xs font-medium text-app-text-strong line-clamp-2">{row['Tipo de conteúdo'] || '-'}</p>
                        </div>

                        <div className="flex items-center gap-2 pt-4 border-t border-app-border/50">
                          <TargetIcon size={12} className="text-emerald-500 shrink-0" />
                          <p className="text-xs font-bold text-app-text-strong truncate">{row['Resultado esperado'] || '-'}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                           <Users size={12} className="text-blue-500 shrink-0" />
                           <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest truncate">Fala: {row['Quem fala'] || '-'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editing Modal (Portal) */}
      {editingItem && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-[#0B0B0E]/80 backdrop-blur-md" onClick={() => setEditingItem(null)}></div>
          
          <div className="relative w-full max-w-4xl bg-app-bg border border-app-border rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-blue-900/10 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 sm:p-8 border-b border-app-border bg-app-surface z-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-app-text-strong uppercase tracking-tight">Editar Entrada</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-app-text-muted uppercase tracking-widest mt-1">Configuração da Matriz Estratégica</p>
                </div>
              </div>
              
              <button 
                onClick={() => setEditingItem(null)}
                className="ios-btn w-10 h-10 rounded-full bg-app-surface-2 border border-app-border flex items-center justify-center text-app-text-muted hover:text-white transition-colors relative z-10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-10 relative z-0">
               <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-app-bg to-transparent pointer-events-none z-10"></div>
              
              {/* ESTRUTURA Section */}
              <div className="space-y-6 relative z-0">
                <div className="flex items-center gap-3 border-b border-app-border pb-3">
                  <Layout className="text-blue-500" size={18} />
                  <h4 className="text-xs font-black text-app-text-strong uppercase tracking-[0.2em]">Estrutura</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputSelect
                    label="Cliente"
                    value={editingItem.Cliente_ID}
                    onChange={(val) => setEditingItem({ ...editingItem, Cliente_ID: val })}
                    options={[{ value: "GERAL", label: "AGÊNCIA" }, ...clients.map(c => ({ value: c.id, label: c.Nome }))]}
                    icon="fa-users"
                  />
                  <InputSelect
                    label="Rede Social"
                    value={editingItem['Rede_Social']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Rede_Social': val })}
                    options={[{label: 'Instagram', value: 'Instagram'}, {label: 'TikTok', value: 'TikTok'}, {label: 'YouTube', value: 'Youtube'}, {label: 'LinkedIn', value: 'LinkedIn'}, {label: 'Facebook', value: 'Facebook'}, {label: 'WhatsApp', value: 'WhatsApp'}]}
                    icon="fa-hashtag"
                    editable
                  />
                  <InputSelect
                    label="Função"
                    value={editingItem['Função']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Função': val })}
                    options={OPCOES_FUNCAO_MATRIZ}
                    icon="fa-layer-group"
                    editable
                  />
                  <InputSelect
                    label="Quem Fala"
                    value={editingItem['Quem fala']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Quem fala': val })}
                    options={OPCOES_QUEM_FALA_MATRIZ}
                    icon="fa-user-tie"
                    editable
                  />
                </div>
              </div>

              {/* ESTRATÉGIA Section */}
              <div className="space-y-6 relative z-0">
                <div className="flex items-center gap-3 border-b border-app-border pb-3">
                  <Megaphone className="text-blue-500" size={18} />
                  <h4 className="text-xs font-black text-app-text-strong uppercase tracking-[0.2em]">Estratégia</h4>
                </div>
                
                <div className="grid grid-cols-1 gap-6">
                  <InputSelect
                    label="Papel Estratégico"
                    value={editingItem['Papel estratégico']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Papel estratégico': val })}
                    options={OPCOES_PAPEL_ESTRATEGICO_MATRIZ}
                    icon="fa-chess-knight"
                    editable
                  />
                  <InputSelect
                    label="Tipo de Conteúdo"
                    value={editingItem['Tipo de conteúdo']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Tipo de conteúdo': val })}
                    options={OPCOES_TIPO_CONTEUDO_MATRIZ}
                    icon="fa-pen-nib"
                    editable
                  />
                  <InputSelect
                    label="Resultado Esperado"
                    value={editingItem['Resultado esperado']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Resultado esperado': val })}
                    options={OPCOES_RESULTADO_ESPERADO_MATRIZ}
                    icon="fa-bullseye"
                    editable
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 sm:p-8 border-t border-app-border bg-app-surface flex flex-col sm:flex-row justify-end items-center gap-4 z-20 relative">
              <Button variant="secondary" onClick={() => { playUISound('tap'); setEditingItem(null); }} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="w-full sm:w-auto !bg-blue-600 hover:!bg-blue-700 shadow-lg shadow-blue-600/20">
                <CheckCircle2 size={18} className="mr-2" /> Salvar Alterações
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
