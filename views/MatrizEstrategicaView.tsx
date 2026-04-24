import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  List, LayoutGrid, Search, Plus, Trash2, Edit2,
  Instagram, Youtube, Twitter, Facebook, Linkedin,
  MessageCircle, Send, Globe, Filter, X, ChevronRight,
  Database, Layout, Users, Megaphone, Target, BarChart3, CheckSquare, Zap, Target as TargetIcon, CheckCircle2, AlertCircle
} from 'lucide-react';
import { Card, Button, InputSelect, Badge, DeletionBar } from '../Components';
import { 
  OPCOES_FUNCAO_MATRIZ, OPCOES_QUEM_FALA_MATRIZ, 
  OPCOES_PAPEL_ESTRATEGICO_MATRIZ, OPCOES_TIPO_CONTEUDO_MATRIZ, 
  OPCOES_RESULTADO_ESPERADO_MATRIZ
} from '../constants';
import { Cliente, TipoTabela } from '../types';
import { playUISound } from '../utils/uiSounds';
import { MatrizDrawer } from '../components/MatrizDrawer';

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
  savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
}

const SavingIndicator = ({ status }: { status?: 'saving' | 'success' | 'error' }) => {
  if (!status) return null;
  return (
    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10 animate-fade">
      {status === 'saving' && (
        <div className="w-3 h-3 border-2 border-zinc-500/30 border-t-zinc-500 rounded-full animate-spin"></div>
      )}
      {status === 'success' && (
        <CheckCircle2 size={12} className="text-emerald-500" />
      )}
      {status === 'error' && (
        <AlertCircle size={10} className="text-rose-500" />
      )}
    </div>
  );
};

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
  if (c.includes('tiktok')) return 'slate';
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
  selection, onSelect, onClearSelection,
  savingStatus = {}
}: MatrizEstrategicaViewProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanal, setFilterCanal] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [drawerItem, setDrawerItem] = useState<any>(null);

  // Escape listener for modal
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingItem(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = !searchTerm || 
        Object.values(item).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCanal = !filterCanal || String(item['Rede_Social'])?.toLowerCase().includes(filterCanal.toLowerCase());
      return matchesSearch && matchesCanal;
    });
  }, [data, searchTerm, filterCanal]);

  const handleEdit = (item: any) => {
    setDrawerItem(item);
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

  const renderEditableCell = (row: any, field: string, hasDatalist?: string) => {
    const isEditing = editingCell?.id === row.id && editingCell?.field === field;
    return (
      <td 
        className="px-6 py-3 min-w-[180px] text-[11px] font-medium text-zinc-500 relative group/cell"
        onClick={(e) => {
          e.stopPropagation();
          setEditingCell({ id: row.id, field });
          setEditingValue(row[field] || '');
        }}
      >
        {isEditing ? (
          <input
            autoFocus
            value={editingValue}
            list={hasDatalist}
            onChange={e => setEditingValue(e.target.value)}
            onBlur={() => {
              if (editingValue !== (row[field] || '')) {
                onUpdate(row.id, 'MATRIZ', field, editingValue);
              }
              setEditingCell(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (editingValue !== (row[field] || '')) {
                  onUpdate(row.id, 'MATRIZ', field, editingValue);
                }
                setEditingCell(null);
              }
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full bg-transparent outline-none border-b border-blue-500 text-zinc-900 dark:text-zinc-100"
          />
        ) : (
          <span className="block truncate max-w-[200px] cursor-pointer group-hover/cell:text-blue-500 transition-colors" title={row[field]}>
            {row[field] || '-'}
          </span>
        )}
        <SavingIndicator status={savingStatus[`MATRIZ:${row.id}:${field}`]} />
      </td>
    );
  };

  return (
    <div className="view-root p-4 sm:p-6 space-y-6 animate-fade pb-20 h-full overflow-y-auto custom-scrollbar">
      <datalist id="dl-papel-estrategico">
        {OPCOES_PAPEL_ESTRATEGICO_MATRIZ.map(opt => <option key={opt} value={opt} />)}
      </datalist>
      <datalist id="dl-tipo-conteudo">
        {OPCOES_TIPO_CONTEUDO_MATRIZ.map(opt => <option key={opt} value={opt} />)}
      </datalist>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10 shrink-0">
            <Database size={24} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">Matriz Estratégica</h2>
              <Badge color="slate">{filteredData.length} Registros</Badge>
            </div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
              Gerenciamento Unificado de Estrutura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
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

          <Button onClick={() => { playUISound('tap'); onAdd(); }} className="!h-10 !px-5 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-lg !text-[11px] !font-bold !uppercase shadow-lg shadow-zinc-500/10 transition-transform hover:scale-[1.02]">
            <Plus size={16} className="mr-2 shrink-0" /> Nova Entrada
          </Button>
        </div>
      </div>

      {/* Control Bar: Selection & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Selection Actions */}
        <div className={`transition-all duration-300 ${selection.length > 0 ? 'opacity-100 scale-100 w-full md:w-auto' : 'opacity-0 scale-95 w-0 h-0 overflow-hidden'}`}>
          <div className="flex items-center gap-2 bg-zinc-900 dark:bg-zinc-100 border border-zinc-800 dark:border-zinc-200 rounded-xl p-1.5 w-full md:w-auto shadow-lg shadow-zinc-500/10">
            <div className="px-3 py-1 border-r border-zinc-700 dark:border-zinc-300">
              <span className="text-[10px] font-bold text-white dark:text-zinc-900 uppercase tracking-widest">{selection.length} Selecionados</span>
            </div>
            <div className="flex items-center gap-1 px-1">
              <button 
                onClick={() => onArchive(selection, 'MATRIZ', true)}
                className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-white dark:hover:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-all"
                title="Arquivar"
              >
                <Trash2 size={16} />
              </button>
              <button 
                onClick={onClearSelection}
                className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-white dark:hover:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-lg transition-all"
                title="Limpar Seleção"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`flex flex-col md:flex-row gap-3 flex-1 w-full justify-end transition-all ${selection.length > 0 ? 'md:max-w-xl' : 'max-w-full'}`}>
          <div className="w-full md:w-56 shrink-0">
            <InputSelect
              value={activeClient ? activeClient.id : ''}
              onChange={(val) => onSelectClient(val)}
              options={[{value: '', label: 'TODOS OS CLIENTES'}, ...clients.map(c => ({value: c.id, label: c.Nome.toUpperCase()}))]}
              placeholder="CLIENTE"
              className="!h-10 !text-[10px] !font-bold !rounded-xl"
              icon={Users}
            />
          </div>

          <div className="flex items-center gap-2 flex-1 group min-w-[200px] h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 focus-within:ring-2 focus-within:ring-zinc-500/10 focus-within:border-zinc-500 transition-all">
            <Search className="text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors shrink-0" size={14} />
            <input
              type="text"
              placeholder="Buscar por papéis, conteúdo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[11px] font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-sans"
            />
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
             {['Instagram', 'YouTube', 'TikTok'].map(canal => (
              <button
                key={canal}
                onClick={() => setFilterCanal(filterCanal === canal ? null : canal)}
                className={`h-10 px-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap flex items-center gap-2 ${filterCanal === canal ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-md shadow-zinc-500/10' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-600'}`}
              >
                {getSocialIcon(canal)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {filteredData.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-zinc-50/50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl flex items-center justify-center text-zinc-400 mb-6">
            <Search size={28} />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Nenhum registro encontrado</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 max-w-xs">
            Não encontramos nenhum dado na Matriz Estratégica com os filtros atuais.
          </p>
          <Button onClick={onAdd} className="mt-8 !h-10 !px-6 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-lg !text-[11px] !font-bold !uppercase transition-transform hover:scale-105">
            Criar Nova Entrada
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE MODE (Zinc Dense) */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="table-responsive overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1100px]">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-4 w-12 text-center shrink-0">
                    <input 
                      type="checkbox" 
                      onChange={e => { 
                        if (e.target.checked) filteredData.forEach(r => !selection.includes(r.id) && onSelect(r.id)); 
                        else onClearSelection(); 
                      }} 
                      checked={filteredData.length > 0 && filteredData.every(r => selection.includes(r.id))} 
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500/20" 
                    />
                  </th>
                  {!activeClient && <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[140px]">Cliente</th>}
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[120px]">Rede Social</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[180px]">Função</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[180px]">Quem Fala</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[200px]">Papel Estratégico</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[200px]">Tipo de Conteúdo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest min-w-[180px]">Resultado</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right min-w-[80px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredData.map(row => {
                  const client = clients.find(c => c.id === row.Cliente_ID);
                  return (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group cursor-pointer ${selection.includes(row.id) ? 'bg-zinc-900/5 dark:bg-zinc-100/5' : ''}`}
                      onClick={() => setDrawerItem(row)}
                    >
                      <td className="px-6 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selection.includes(row.id)} 
                          onChange={() => onSelect(row.id)} 
                          className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500/20" 
                        />
                      </td>
                      {!activeClient && (
                      <td className="px-6 py-3" title={client?.Nome || 'Agencia'}>
                        <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate block">{client?.Nome || 'Agência'}</span>
                      </td>
                    )}
                    <td className="px-6 py-3 min-w-[120px] relative" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <select 
                            value={row['Rede_Social'] || ''}
                            onChange={e => onUpdate(row.id, 'MATRIZ', 'Rede_Social', e.target.value)}
                            className="bg-transparent outline-none text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase cursor-pointer hover:text-blue-500 border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-0.5"
                          >
                            <option value="">Selecione</option>
                            <option value="Instagram">Instagram</option>
                            <option value="TikTok">TikTok</option>
                            <option value="Youtube">Youtube</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Facebook">Facebook</option>
                            <option value="WhatsApp">WhatsApp</option>
                          </select>
                        </div>
                        <SavingIndicator status={savingStatus[`MATRIZ:${row.id}:Rede_Social`]} />
                    </td>
                    <td className="px-6 py-3 min-w-[180px] relative" onClick={e => e.stopPropagation()}>
                        <select 
                          value={row['Função'] || ''}
                          onChange={e => onUpdate(row.id, 'MATRIZ', 'Função', e.target.value)}
                          className="bg-transparent outline-none text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase cursor-pointer hover:text-blue-500 border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-0.5"
                        >
                          <option value="">Selecione</option>
                          {OPCOES_FUNCAO_MATRIZ.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <SavingIndicator status={savingStatus[`MATRIZ:${row.id}:Função`]} />
                    </td>
                    {renderEditableCell(row, 'Quem fala')}
                    {renderEditableCell(row, 'Papel estratégico', 'dl-papel-estrategico')}
                    {renderEditableCell(row, 'Tipo de conteúdo', 'dl-tipo-conteudo')}
                    {renderEditableCell(row, 'Resultado esperado')}
                      <td className="px-6 py-3 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(row)}
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        </div>
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
                <div className="flex items-center gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{client?.Nome || 'Agência'}</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{items.length} Entradas na Matriz</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(row => (
                    <div 
                      key={row.id}
                      onClick={() => handleEdit(row)}
                      className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 cursor-pointer group transition-all duration-300 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm relative overflow-hidden ${selection.includes(row.id) ? 'border-zinc-900 ring-2 ring-zinc-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform" />
                      
                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                           <input 
                            type="checkbox" 
                            checked={selection.includes(row.id)} 
                            onChange={() => onSelect(row.id)} 
                            className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500/20 mr-1" 
                          />
                          <div className="text-zinc-400">{getSocialIcon(row['Rede_Social'])}</div>
                          <Badge color={getSocialColor(row['Rede_Social'])} className="!py-0 !text-[9px] !rounded-md !uppercase">{row['Rede_Social'] || 'N/A'}</Badge>
                        </div>
                        <Badge color={getFuncaoColor(row['Função'])} className="!py-0 !text-[9px] !rounded-md !uppercase">{row['Função'] || 'N/A'}</Badge>
                      </div>

                      <div className="space-y-4 relative z-10">
                        <div className="min-h-[48px]">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Megaphone size={10} /> Papel Estratégico
                          </p>
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 uppercase tracking-tight">{row['Papel estratégico'] || '-'}</p>
                        </div>
                        
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <Layout size={10} /> Tipo de Conteúdo
                          </p>
                          <p className="text-[10px] font-medium text-zinc-500 line-clamp-2 uppercase leading-relaxed">{row['Tipo de conteúdo'] || '-'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <TargetIcon size={12} className="text-zinc-400 shrink-0" />
                            <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-tight">{row['Resultado esperado'] || '-'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                           <Users size={12} className="text-zinc-400 shrink-0" />
                           <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">Fala: {row['Quem fala'] || '-'}</p>
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
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm" onClick={() => setEditingItem(null)}></div>
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10">
                  <Database size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Editar Entrada</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Matriz Estratégica</p>
                </div>
              </div>
              
              <button 
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
              {/* ESTRUTURA Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Estrutura</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputSelect
                    label="CLIENTE"
                    value={editingItem.Cliente_ID}
                    onChange={(val) => setEditingItem({ ...editingItem, Cliente_ID: val })}
                    options={[{ value: "GERAL", label: "AGÊNCIA" }, ...clients.map(c => ({ value: c.id, label: c.Nome.toUpperCase() }))]}
                    icon={Users}
                  />
                  <InputSelect
                    label="REDE SOCIAL"
                    value={editingItem['Rede_Social']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Rede_Social': val })}
                    options={[{label: 'INSTAGRAM', value: 'Instagram'}, {label: 'TIKTOK', value: 'TikTok'}, {label: 'YOUTUBE', value: 'Youtube'}, {label: 'LINKEDIN', value: 'LinkedIn'}, {label: 'FACEBOOK', value: 'Facebook'}, {label: 'WHATSAPP', value: 'WhatsApp'}]}
                    icon={Globe}
                    editable
                  />
                  <InputSelect
                    label="FUNÇÃO"
                    value={editingItem['Função']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Função': val })}
                    options={OPCOES_FUNCAO_MATRIZ}
                    icon={Layout}
                    editable
                  />
                  <InputSelect
                    label="QUEM FALA"
                    value={editingItem['Quem fala']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Quem fala': val })}
                    options={OPCOES_QUEM_FALA_MATRIZ}
                    icon={Users}
                    editable
                  />
                </div>
              </div>

              {/* ESTRATÉGIA Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Estratégia</h4>
                <div className="grid grid-cols-1 gap-4">
                  <InputSelect
                    label="PAPEL ESTRATÉGICO"
                    value={editingItem['Papel estratégico']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Papel estratégico': val })}
                    options={OPCOES_PAPEL_ESTRATEGICO_MATRIZ}
                    icon={Zap}
                    editable
                  />
                  <InputSelect
                    label="TIPO DE CONTEÚDO"
                    value={editingItem['Tipo de conteúdo']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Tipo de conteúdo': val })}
                    options={OPCOES_TIPO_CONTEUDO_MATRIZ}
                    icon={MessageCircle}
                    editable
                  />
                  <InputSelect
                    label="RESULTADO ESPERADO"
                    value={editingItem['Resultado esperado']}
                    onChange={(val) => setEditingItem({ ...editingItem, 'Resultado esperado': val })}
                    options={OPCOES_RESULTADO_ESPERADO_MATRIZ}
                    icon={TargetIcon}
                    editable
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => { playUISound('tap'); setEditingItem(null); }} className="!h-10 !px-5 !text-[10px] !font-bold !uppercase !rounded-lg">
                Cancelar
              </Button>
              <Button onClick={handleSave} className="!h-10 !px-6 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !text-[10px] !font-bold !uppercase !rounded-lg shadow-lg shadow-zinc-500/10">
                <CheckCircle2 size={16} className="mr-2" /> Salvar Alterações
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Matriz Drawer */}
      {drawerItem && (
        <MatrizDrawer
          item={drawerItem}
          cliente={clients.find(c => c.id === drawerItem.Cliente_ID)}
          onClose={() => setDrawerItem(null)}
          onUpdate={(field, value) => {
            onUpdate(drawerItem.id, 'MATRIZ', field, value);
            setDrawerItem((prev: any) => prev ? { ...prev, [field]: value } : null);
          }}
          onDelete={() => {
            onDelete([drawerItem.id], 'MATRIZ');
            setDrawerItem(null);
          }}
        />
      )}
    </div>
  );
}
