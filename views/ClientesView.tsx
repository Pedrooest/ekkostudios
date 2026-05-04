import React, { useState, useMemo, useRef } from 'react';
import { Button, Badge, Card, InputSelect } from '../Components';
import {
  Users, Search, Plus, X, Phone, Instagram, Target, Palette, Trash2, CheckCircle2,
  Globe, Youtube, Music, Linkedin, Pin, Video, MessageCircle, Folder, FileText,
  Figma, Brush, Music2, Swords, Star, Link, Handshake, Mail, StickyNote,
  ChevronDown, ChevronUp, Download, Calendar, Clock, Image as ImageIcon, File,
  Camera, LayoutTemplate, TrendingUp, CheckSquare
} from 'lucide-react';

interface ClientesViewProps {
  clients: any[];
  onUpdate: (id: string, tab: any, field: string, value: any) => void;
  onDelete: (ids: string[], tab: any) => void;
  onAdd: () => void;
  onOpenColorPicker?: (id: string, val: string) => void;
  savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
}

const SavingIndicator = ({ status }: { status?: 'saving' | 'success' | 'error' }) => {
  if (!status) return null;
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10 animate-fade-blur">
      {status === 'saving' && (
        <div className="w-3 h-3 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin"></div>
      )}
      {status === 'success' && (
        <CheckCircle2 size={12} className="text-emerald-500" />
      )}
    </div>
  );
};

const toBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

const ICON_MAP: Record<string, any> = {
  // Links
  'Site': Globe, 'Instagram': Instagram, 'YouTube': Youtube, 'TikTok': Music, 
  'LinkedIn': Linkedin, 'Pinterest': Pin, 'Kwai': Video, 'WhatsApp': MessageCircle, 
  'Google Drive': Folder, 'Notion': FileText, 'Figma': Figma, 'Canva': Brush, 
  'Spotify': Music2, 'Concorrente': Swords, 'Referência': Star, 'Outro': Link,
  // Logs
  'Reunião': Handshake, 'Email': Mail, 'Ligação': Phone, 'Anotação': StickyNote
};

// CaseToggle — cicla entre MAIÚSCULAS / minúsculas / Título / original
type CaseMode = 'original' | 'upper' | 'lower' | 'title';
const CASE_LABELS: Record<CaseMode, string> = { original: 'Aa', upper: 'AA', lower: 'aa', title: 'Ab' };
const CASE_CYCLE: CaseMode[] = ['original', 'upper', 'lower', 'title'];

const applyCase = (text: string, mode: CaseMode): string => {
  if (mode === 'upper') return text.toUpperCase();
  if (mode === 'lower') return text.toLowerCase();
  if (mode === 'title') return text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return text;
};

const CaseToggle = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [mode, setMode] = React.useState<CaseMode>('original');
  const cycle = () => {
    const next = CASE_CYCLE[(CASE_CYCLE.indexOf(mode) + 1) % CASE_CYCLE.length];
    setMode(next);
    if (next !== 'original') onChange(applyCase(value, next));
  };
  return (
    <button
      type="button"
      onClick={cycle}
      title={`Modo: ${CASE_LABELS[mode]} — clique para alternar`}
      className={`absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md text-[9px] font-black flex items-center justify-center transition-all ios-btn z-10 ${
        mode === 'original'
          ? 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'
          : 'bg-blue-500 text-white shadow-sm'
      }`}
    >
      {CASE_LABELS[mode]}
    </button>
  );
};

const Accordion = React.memo<{ 
  title: string; 
  icon: any; 
  count?: number; 
  isOpen: boolean; 
  onToggle: () => void; 
  children: React.ReactNode 
}>(({ title, icon: Icon, count, isOpen, onToggle, children }) => (
  <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all">
    <button 
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
          <Icon size={18} />
        </div>
        <div className="text-left">
          <h3 className={`text-xs font-black uppercase tracking-widest ${isOpen ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>{title}</h3>
          {count !== undefined && <span className="text-[10px] font-bold text-zinc-400">{count} {count === 1 ? 'item' : 'itens'}</span>}
        </div>
      </div>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180 bg-zinc-100 dark:bg-zinc-800' : ''}`}>
        <ChevronDown size={14} className="text-zinc-400" />
      </div>
    </button>
    
    <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="p-6 pt-0 border-t border-zinc-50 dark:border-zinc-800/50">
        {children}
      </div>
    </div>
  </div>
));

export const ClientesView = React.memo(({ clients, onUpdate, onDelete, onAdd, onOpenColorPicker, savingStatus = {}, tasks = [], planejamento = [] }: ClientesViewProps & { tasks?: any[]; planejamento?: any[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [activeAccordion, setActiveAccordion] = useState<string>('Dados Principais');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [newLogEntry, setNewLogEntry] = useState({ tipo: 'WhatsApp', data: new Date().toISOString().split('T')[0], hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), descricao: '' });
  const [newLinkEntry, setNewLinkEntry] = useState({ titulo: '', url: '', categoria: 'Site' });
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isAddingMeta, setIsAddingMeta] = useState(false);
  const [newMetaEntry, setNewMetaEntry] = useState({ id: '', titulo: '', metrica: '', valor_atual: 0, valor_meta: 0, periodo: 'Mensal' as const, status: 'No prazo' as const });

  // Refs para uploads de logo e capa (devem ficar no topo do componente - regras dos hooks)
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (c.__arquivado) return false;
      
      const matchesSearch = c.Nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.Nicho?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isAtivo = c.Status === 'Ativo';
      const matchesStatus = statusFilter === 'Todos' || 
                            (statusFilter === 'Ativo' && isAtivo) || 
                            (statusFilter === 'Inativo' && !isAtivo);
                            
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const activeCount = useMemo(() => clients.filter(c => c.Status === 'Ativo' && !c.__arquivado).length, [clients]);

  const handleUpdateField = (field: string, value: any) => {
    if (!selectedClient) return;
    onUpdate(selectedClient.id, 'CLIENTES', field, value);
    // Optimistic update for the drawer
    setSelectedClient({ ...selectedClient, [field]: value });
  };

  const [localState, setLocalState] = React.useState<any>(null);
  React.useEffect(() => {
    if (selectedClient && (!localState || localState.id !== selectedClient.id)) {
      setLocalState(selectedClient);
    }
  }, [selectedClient]);

  const handleBlur = (field: string) => {
    if (!selectedClient || !localState) return;
    if (localState[field] !== selectedClient[field]) {
      handleUpdateField(field, localState[field]);
    }
  };

  const closeDrawer = () => setSelectedClient(null);

  React.useEffect(() => {
    if (!selectedClient) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedClient, closeDrawer]);

  return (
    <div className="view-root flex flex-col h-full w-full animate-fade-blur">
      
      {/* MODERN HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Clientes</h1>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Gestão estratégica de contas e branding.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge color="blue" className="text-[10px] font-black uppercase tracking-widest px-3 py-1">
            {activeCount} Ativos
          </Badge>
          <Button onClick={onAdd} className="!h-10 px-4 !bg-blue-600 !text-white hover:!bg-blue-700 shadow-lg shadow-blue-500/20">
            <Plus size={16} className="mr-2 shrink-0" /> Novo Cliente
          </Button>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="px-6 py-4 flex flex-col sm:flex-row gap-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
        <div className="relative flex-1 max-w-md group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={14} />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex bg-white dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm">
          {(['Todos', 'Ativo', 'Inativo'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status 
                  ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md' 
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* CLIENTS GRID */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/20 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users size={28} className="text-blue-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Nenhum cliente ainda</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Adicione seu primeiro cliente pra começar.</p>
            </div>
            {onAdd && (
              <button onClick={onAdd} className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                + Adicionar cliente
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 stagger">
            {filteredClients.map(client => {
              const bgHex = client['Cor (HEX)'] || '#3B82F6';
              const initial = (client.Nome || '?').charAt(0).toUpperCase();
              const isAtivo = client.Status === 'Ativo';
              const clientTasks = tasks.filter((t: any) => t.Cliente_ID === client.id && t.Status !== 'concluido');
              const clientPostsThisMonth = planejamento.filter((p: any) => {
                const m = new Date().getMonth();
                const y = new Date().getFullYear();
                const d = new Date(p.Data + 'T12:00:00');
                return p.Cliente_ID === client.id && d.getMonth() === m && d.getFullYear() === y;
              });
              const clientPostsDone = clientPostsThisMonth.filter((p: any) => p["Status do conteúdo"] === 'Concluído').length;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 lift hover:shadow-2xl dark:hover:shadow-black/40 ${!isAtivo ? 'opacity-60 saturate-50' : 'hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                >
                  {/* Cover / banner strip */}
                  <div
                    className="h-16 relative overflow-hidden shrink-0"
                    style={{
                      background: client.cover_url
                        ? undefined
                        : `linear-gradient(135deg, ${bgHex}40 0%, ${bgHex}15 60%, transparent 100%)`,
                    }}
                  >
                    {client.cover_url && (
                      <img src={client.cover_url} alt="" className="w-full h-full object-cover" />
                    )}
                    {/* Palette dots */}
                    {(client.paleta_cores || []).length > 0 && (
                      <div className="absolute bottom-2 right-3 flex gap-1">
                        {(client.paleta_cores || []).slice(0, 4).map((cor: string, i: number) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white/50 shadow-sm" style={{ backgroundColor: cor }} />
                        ))}
                      </div>
                    )}
                    {/* Color swatch button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); onOpenColorPicker?.(client.id, bgHex); }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40"
                      title="Alterar cor"
                    >
                      <Palette size={11} />
                    </button>
                  </div>

                  {/* Avatar overlapping cover */}
                  <div className="px-4 pb-4">
                    <div className="flex items-end justify-between -mt-6 mb-3">
                      {/* Logo/avatar */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shrink-0 shadow-lg ring-2 ring-white dark:ring-zinc-900 overflow-hidden group-hover:scale-105 transition-transform"
                        style={{ backgroundColor: bgHex }}
                      >
                        {client.logo_url ? (
                          <img src={client.logo_url} alt={client.Nome} className="w-full h-full object-cover" />
                        ) : initial}
                      </div>
                      {/* Status badge */}
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${isAtivo ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isAtivo ? 'bg-emerald-500 glow-pulse' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                        {client.Status || 'Ativo'}
                      </div>
                    </div>

                    {/* Name + nicho */}
                    <div className="mb-3">
                      <h3 className="font-black text-[15px] text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight truncate">
                        {client.Nome || 'Sem nome'}
                      </h3>
                      <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest truncate mt-0.5">
                        {client.Nicho || 'Sem nicho'}
                      </p>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: 'Posts', value: clientPostsThisMonth.length, icon: <LayoutTemplate size={9} />, color: 'text-indigo-500' },
                        { label: 'Concluídos', value: clientPostsDone, icon: <CheckSquare size={9} />, color: 'text-emerald-500' },
                        { label: 'Tarefas', value: clientTasks.length, icon: <TrendingUp size={9} />, color: 'text-amber-500' },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center py-1.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <span className={`${s.color} mb-0.5`}>{s.icon}</span>
                          <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100">{s.value}</span>
                          <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-wide">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Social links + color strip */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-400">
                        {client.WhatsApp && <Phone size={12} className="hover:text-emerald-500 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`https://wa.me/${client.WhatsApp.replace(/\D/g,'')}`, '_blank'); }} />}
                        {client.Instagram && <Instagram size={12} className="hover:text-rose-500 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); window.open(`https://instagram.com/${client.Instagram.replace('@','')}`, '_blank'); }} />}
                        {(client.links || []).some((l: any) => l.categoria === 'Site') && <Globe size={12} className="hover:text-blue-500 transition-colors" />}
                      </div>
                      {/* Paleta strip */}
                      <div className="flex items-center gap-0.5">
                        {[bgHex, ...(client.paleta_cores || []).slice(0, 3)].slice(0, 4).map((c: string, i: number) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white dark:border-zinc-900 shadow-sm" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hidden file inputs — fora do drawer para evitar problemas de refs */}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onloadend = () => handleUpdateField('cover_url', r.result as string);
          r.readAsDataURL(f);
          if (coverInputRef.current) coverInputRef.current.value = '';
        }}
      />
      <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onloadend = () => handleUpdateField('logo_url', r.result as string);
          r.readAsDataURL(f);
          if (logoInputRef.current) logoInputRef.current.value = '';
        }}
      />

      {/* EDIT DRAWER */}
      {selectedClient && (
        <div className="fixed inset-0 z-[2200] flex justify-end pointer-events-auto overflow-hidden">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-fade-blur" onClick={closeDrawer}></div>

          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col animate-slide-in-right ring-1 ring-zinc-100/50 dark:ring-zinc-800">
            {/* Cover + Avatar header */}
            <div className="relative shrink-0">
              {/* Cover — clicável */}
              <div
                className="h-24 relative cursor-pointer group/cover overflow-hidden"
                style={{ background: selectedClient.cover_url ? undefined : `linear-gradient(135deg, ${selectedClient['Cor (HEX)'] || '#3B82F6'}35 0%, ${selectedClient['Cor (HEX)'] || '#3B82F6'}08 100%)` }}
                onClick={() => coverInputRef.current?.click()}
              >
                {selectedClient.cover_url && <img src={selectedClient.cover_url} className="w-full h-full object-cover" alt="" />}
                <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover/cover:opacity-100">
                  <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <Camera size={11} className="text-white" />
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">Alterar capa</span>
                  </div>
                </div>
                {!selectedClient.cover_url && (
                  <div className="absolute bottom-2 right-3 flex items-center gap-1 text-[8px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-wider opacity-60">
                    <Camera size={9} /> Adicionar capa
                  </div>
                )}
              </div>

              {/* Avatar row */}
              <div className="px-5 pb-4">
                <div className="flex items-end justify-between -mt-8">
                  {/* Logo — clicável */}
                  <div className="relative group/logo cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-xl ring-[3px] ring-white dark:ring-zinc-900 overflow-hidden transition-transform group-hover/logo:scale-105" style={{ backgroundColor: selectedClient['Cor (HEX)'] || '#3B82F6' }}>
                      {selectedClient.logo_url ? <img src={selectedClient.logo_url} alt="" className="w-full h-full object-cover" /> : (selectedClient.Nome || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover/logo:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/logo:opacity-100">
                      <Camera size={14} className="text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 shadow-sm">
                      <Camera size={9} className="text-zinc-500" />
                    </div>
                  </div>

                  <button onClick={closeDrawer} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:rotate-90 active:scale-90 shadow-sm">
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-2">
                  <h2 className="font-black text-lg uppercase tracking-tight text-zinc-900 dark:text-zinc-100 truncate leading-tight">
                    {selectedClient.Nome || 'Novo Cliente'}
                  </h2>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400 mt-0.5">
                    {selectedClient.Nicho || 'Configurações do cliente'}
                  </p>
                </div>
              </div>
              <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
            </div>

            {/* Drawer Body Form */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              
              {/* ACORDEÃO — SEÇÃO 1: DADOS PRINCIPAIS */}
              <Accordion 
                title="Dados Principais" 
                icon={Users} 
                isOpen={activeAccordion === 'Dados Principais'}
                onToggle={() => setActiveAccordion(activeAccordion === 'Dados Principais' ? '' : 'Dados Principais')}
              >
                <div className="space-y-4 pt-4">
                  <div className="space-y-1.5 relative">
                    <div className="flex items-center justify-between ml-1 mb-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">NOME DA MARCA</label>
                      <span className="text-[8px] text-zinc-300 dark:text-zinc-600 font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="w-4 h-4 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[7px] font-black text-zinc-400">Aa</span>
                        clique para alternar caixa
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={localState?.Nome || ''}
                        onChange={(e) => setLocalState({ ...localState, Nome: e.target.value })}
                        onBlur={() => handleBlur('Nome')}
                        className="w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 text-xs font-bold tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500/50 transition-all pr-16"
                      />
                      <CaseToggle value={localState?.Nome || ''} onChange={(v) => { setLocalState({ ...localState, Nome: v }); onUpdate(selectedClient.id, 'CLIENTES', 'Nome', v); }} />
                    </div>
                    <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:Nome`]} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">NICHO</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={localState?.Nicho || ''}
                          onChange={(e) => setLocalState({ ...localState, Nicho: e.target.value })}
                          onBlur={() => handleBlur('Nicho')}
                          className="w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 text-xs font-bold tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500/50 transition-all pr-16"
                        />
                        <CaseToggle value={localState?.Nicho || ''} onChange={(v) => { setLocalState({ ...localState, Nicho: v }); onUpdate(selectedClient.id, 'CLIENTES', 'Nicho', v); }} />
                      </div>
                      <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:Nicho`]} />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">STATUS</label>
                      <InputSelect
                        value={selectedClient.Status || 'Ativo'}
                        onChange={(val) => handleUpdateField('Status', val)}
                        options={[
                          { value: 'Ativo', label: 'ATIVO', color: 'emerald' },
                          { value: 'Inativo', label: 'INATIVO', color: 'slate' }
                        ]}
                        className="!h-11 border-2 !border-zinc-100 dark:!border-zinc-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">RESPONSÁVEL</label>
                    <div className="flex items-center gap-2 group w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 focus-within:border-blue-500/50 transition-all">
                      <Users size={14} className="text-zinc-400 transition-colors group-focus-within:text-blue-500 shrink-0" />
                      <input 
                        type="text" 
                        value={localState?.Responsável || ''} 
                        onChange={(e) => setLocalState({ ...localState, Responsável: e.target.value })}
                        onBlur={() => handleBlur('Responsável')}
                        className="flex-1 bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0 pr-6"
                      />
                    </div>
                    <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:Responsável`]} />
                  </div>

                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">WHATSAPP</label>
                      <div className="flex items-center gap-2 group w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 focus-within:border-emerald-500/50 transition-all">
                         <Phone size={14} className="text-emerald-500 shrink-0" />
                         <input 
                           type="text" 
                           value={localState?.WhatsApp || ''} 
                           onChange={(e) => setLocalState({ ...localState, WhatsApp: e.target.value })}
                           onBlur={() => handleBlur('WhatsApp')}
                           className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0 pr-6"
                           placeholder="EX: +55 11 99999-9999"
                         />
                      </div>
                      <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:WhatsApp`]} />
                    </div>

                    <div className="space-y-1.5 relative">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">INSTAGRAM</label>
                      <div className="flex items-center gap-2 group w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 focus-within:border-rose-500/50 transition-all">
                         <Instagram size={14} className="text-rose-500 shrink-0" />
                         <input 
                           type="text" 
                           value={localState?.Instagram || ''} 
                           onChange={(e) => setLocalState({ ...localState, Instagram: e.target.value })}
                           onBlur={() => handleBlur('Instagram')}
                           className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0 pr-6"
                           placeholder="EX: @USER"
                         />
                      </div>
                      <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:Instagram`]} />
                    </div>
                </div>
              </Accordion>

              {/* SEÇÃO 1 — LINKS E REFERÊNCIAS */}
              <Accordion 
                title="Links e Referências" 
                icon={Link} 
                count={(selectedClient.links || []).length}
                isOpen={activeAccordion === 'Links'} 
                onToggle={() => setActiveAccordion(activeAccordion === 'Links' ? '' : 'Links')}
              >
                <div className="space-y-4 pt-4">
                  <div className="space-y-3">
                    {(selectedClient.links || []).map((link: any, idx: number) => {
                      const Icon = ICON_MAP[link.categoria] || Link;
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl group border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition-all">
                          <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center text-zinc-400 shadow-sm">
                            <Icon size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="block text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 truncate hover:text-blue-500 transition-colors">
                              {link.titulo || 'Link sem título'}
                            </a>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">{link.categoria}</span>
                          </div>
                          <button 
                            onClick={() => {
                              const newList = selectedClient.links.filter((_: any, i: number) => i !== idx);
                              handleUpdateField('links', newList);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {isAddingLink ? (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-2xl border-2 border-blue-500/20 space-y-3 animate-fade-blur">
                      <input 
                        type="text" 
                        placeholder="TÍTULO DO LINK"
                        value={newLinkEntry.titulo}
                        onChange={e => setNewLinkEntry({ ...newLinkEntry, titulo: e.target.value })}
                        className="w-full h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100"
                      />
                      <input 
                        type="url" 
                        placeholder="URL (HTTP://...)"
                        value={newLinkEntry.url}
                        onChange={e => setNewLinkEntry({ ...newLinkEntry, url: e.target.value })}
                        className="w-full h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 text-[10px] font-bold text-zinc-900 dark:text-zinc-100"
                      />
                      <InputSelect 
                        value={newLinkEntry.categoria}
                        onChange={val => setNewLinkEntry({ ...newLinkEntry, categoria: val })}
                        options={['Site', 'Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Pinterest', 'Kwai', 'WhatsApp', 'Google Drive', 'Notion', 'Figma', 'Canva', 'Spotify', 'Concorrente', 'Referência', 'Outro']}
                        className="!h-10"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => setIsAddingLink(false)} variant="ghost" className="flex-1 !h-10">Cancelar</Button>
                        <Button 
                          onClick={() => {
                            if (!newLinkEntry.url) return;
                            const newList = [...(selectedClient.links || []), newLinkEntry];
                            handleUpdateField('links', newList);
                            setNewLinkEntry({ titulo: '', url: '', categoria: 'Site' });
                            setIsAddingLink(false);
                          }}
                          className="flex-1 !h-10 !bg-blue-600 !text-white"
                        >
                          Salvar Link
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingLink(true)}
                      className="w-full h-11 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-center gap-2 text-zinc-400 hover:text-blue-500 hover:border-blue-500/30 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                      <Plus size={14} /> Adicionar Link
                    </button>
                  )}
                </div>
              </Accordion>

              {/* SEÇÃO 2 — LOG DE COMUNICAÇÃO */}
              <Accordion 
                title="Log de Comunicação" 
                icon={MessageCircle} 
                count={(selectedClient.log_comunicacao || []).length}
                isOpen={activeAccordion === 'Log'} 
                onToggle={() => setActiveAccordion(activeAccordion === 'Log' ? '' : 'Log')}
              >
                <div className="space-y-4 pt-4">
                  <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-zinc-100 dark:before:bg-zinc-800">
                    {(selectedClient.log_comunicacao || []).sort((a: any, b: any) => new Date(b.data + ' ' + b.hora).getTime() - new Date(a.data + ' ' + a.hora).getTime()).map((log: any, idx: number) => {
                      const Icon = ICON_MAP[log.tipo] || StickyNote;
                      return (
                        <div key={idx} className="relative pl-12 group">
                          <div className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 z-10 group-hover:scale-110 transition-transform">
                            <Icon size={14} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{log.tipo}</span>
                              <span className="text-[9px] font-bold text-zinc-400">{new Date(log.data + ' ' + log.hora).toLocaleDateString('pt-BR')} {log.hora}</span>
                            </div>
                            <p className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 leading-relaxed italic border-l-2 border-zinc-100 dark:border-zinc-800 pl-3 mt-1">
                              "{log.descricao}"
                            </p>
                            <button 
                              onClick={() => {
                                const newList = selectedClient.log_comunicacao.filter((_: any, i: number) => i !== idx);
                                handleUpdateField('log_comunicacao', newList);
                              }}
                              className="self-end text-[8px] font-black uppercase tracking-widest text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                            >
                              Excluir Log
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => setIsLogModalOpen(true)}
                    className="w-full h-11 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-zinc-500/10 active:scale-95 transition-all"
                  >
                    <Plus size={14} /> Registrar Interação
                  </button>
                </div>
              </Accordion>

              {/* SEÇÃO 3 — BANCO DE ASSETS */}
              <Accordion 
                title="Banco de Assets" 
                icon={Folder} 
                count={(selectedClient.assets || []).length}
                isOpen={activeAccordion === 'Assets'} 
                onToggle={() => setActiveAccordion(activeAccordion === 'Assets' ? '' : 'Assets')}
              >
                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(selectedClient.assets || []).map((asset: any, idx: number) => {
                      const isImg = asset.tipo === 'Foto' || asset.tipo === 'Logo' || asset.tipo === 'Paleta';
                      return (
                        <div key={idx} className="group relative aspect-square rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 overflow-hidden flex flex-col items-center justify-center p-3 text-center transition-all hover:shadow-xl hover:-translate-y-1">
                          {isImg ? (
                            <img src={asset.dados} alt={asset.nome} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                          ) : (
                            <File size={32} className="text-zinc-300 mb-2 group-hover:scale-110 transition-transform" />
                          )}
                          
                          <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
                             <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-900 dark:text-white line-clamp-1 px-2">{asset.nome}</span>
                             <div className="flex gap-1">
                               <a 
                                 href={asset.dados} 
                                 download={asset.nome}
                                 className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                               >
                                 <Download size={14} />
                               </a>
                               <button 
                                 onClick={() => {
                                   const newList = selectedClient.assets.filter((_: any, i: number) => i !== idx);
                                   handleUpdateField('assets', newList);
                                 }}
                                 className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition-colors"
                               >
                                 <Trash2 size={14} />
                               </button>
                             </div>
                          </div>
                          
                          {!isImg && <span className="absolute bottom-3 text-[8px] font-black uppercase tracking-widest text-zinc-400">{asset.nome}</span>}
                          <Badge color="blue" className="absolute top-2 left-2 !text-[7px] !px-1.5 !py-0 !rounded-md shadow-sm">{asset.tipo}</Badge>
                        </div>
                      );
                    })}

                    <label className="aspect-square border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-blue-500 hover:border-blue-500/30 transition-all cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/20 group">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest px-4 text-center">Upload Asset</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 1 * 1024 * 1024) {
                            alert('Arquivo muito grande. Máximo permitido: 1MB');
                            return;
                          }
                          const base64 = await toBase64(file);
                          const tipo = file.type.startsWith('image/') ? 'Foto' : 'Documento';
                          const newList = [...(selectedClient.assets || []), { nome: file.name, tipo, dados: base64 }];
                          handleUpdateField('assets', newList);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </Accordion>

              {/* SEÇÃO 4 — IDENTIDADE VISUAL */}
              <Accordion 
                title="Identidade Visual" 
                icon={Palette} 
                isOpen={activeAccordion === 'Identidade'} 
                onToggle={() => setActiveAccordion(activeAccordion === 'Identidade' ? '' : 'Identidade')}
              >
                <div className="space-y-6 pt-4">
                  {/* Paleta */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">PALETA ESTRATÉGICA (MAX 6)</label>
                    <div className="grid grid-cols-6 gap-2">
                      {Array.from({ length: 6 }).map((_, idx) => {
                        const color = (selectedClient.paleta_cores || [])[idx] || '';
                        return (
                          <div key={idx} className="relative group">
                            <div 
                              className={`aspect-square rounded-xl border-2 ${color ? 'border-zinc-100 dark:border-zinc-800' : 'border-dashed border-zinc-200 dark:border-zinc-800'} overflow-hidden relative shadow-sm`}
                              style={{ backgroundColor: color }}
                            >
                              <input 
                                type="color" 
                                value={color || '#ffffff'}
                                onChange={(e) => {
                                  const newList = [...(selectedClient.paleta_cores || [])];
                                  newList[idx] = e.target.value.toUpperCase();
                                  handleUpdateField('paleta_cores', newList);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={color.replace('#', '')}
                              placeholder="HEX"
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase().replace('#', '');
                                if (val.length <= 6) {
                                  const newList = [...(selectedClient.paleta_cores || [])];
                                  newList[idx] = '#' + val;
                                  handleUpdateField('paleta_cores', newList);
                                }
                              }}
                              className="w-full mt-1 bg-transparent border-none text-center text-[8px] font-black uppercase tracking-tighter text-zinc-400 outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:paleta_cores`]} />
                  </div>

                  {/* Fontes */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">FONTES USADAS (MAX 3)</label>
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 border border-zinc-100 dark:border-zinc-700">
                            {idx + 1}
                          </div>
                          <input 
                            type="text" 
                            placeholder="NOME DA FONTE (EX: INTER)"
                            value={(localState?.fontes || [])[idx] || ''}
                            onChange={(e) => {
                              const newList = [...(localState?.fontes || [])];
                              newList[idx] = e.target.value;
                              setLocalState({ ...localState, fontes: newList });
                            }}
                            onBlur={() => handleBlur('fontes')}
                            className="flex-1 h-9 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-lg px-3 text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white outline-none focus:border-blue-500/30 transition-all"
                          />
                        </div>
                      ))}
                    </div>
                    <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:fontes`]} />
                  </div>

                  {/* Tom de Voz */}
                  <div className="space-y-2 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">TOM DE VOZ / PERSONALIDADE</label>
                    <textarea 
                      rows={3}
                      value={localState?.tom_de_voz || ''}
                      onChange={(e) => setLocalState({ ...localState, tom_de_voz: e.target.value })}
                      onBlur={() => handleBlur('tom_de_voz')}
                      placeholder="DESCREVA A VOZ DA MARCA: EX: FORMAL, AUTORITÁRIA, DIVERTIDA..."
                      className="w-full p-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl text-[10px] font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500/30 transition-all resize-none pr-10"
                    />
                    <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:tom_de_voz`]} />
                  </div>
                </div>
              </Accordion>

              {/* SEÇÃO 5 — 🎯 METAS E OKRS */}
              <Accordion 
                title="Metas e OKRs" 
                icon={Target} 
                count={(selectedClient.metas || []).length}
                isOpen={activeAccordion === 'Metas'} 
                onToggle={() => setActiveAccordion(activeAccordion === 'Metas' ? '' : 'Metas')}
              >
                <div className="space-y-6 pt-4">
                  <div className="space-y-4">
                    {(selectedClient.metas || []).map((meta: any, idx: number) => {
                      const progress = Math.min(100, Math.max(0, (meta.valor_atual / (meta.valor_meta || 1)) * 100));
                      return (
                        <div key={idx} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 group transition-all hover:border-blue-500/30">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-[11px] font-black uppercase tracking-tight text-zinc-900 dark:text-white">{meta.titulo}</h4>
                                <Badge color={meta.status === 'No prazo' ? 'blue' : meta.status === 'Concluída' ? 'green' : 'red'} className="!text-[7px] !px-1.5 !py-0 !rounded-md">
                                  {meta.status}
                                </Badge>
                              </div>
                              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{meta.metrica} • {meta.periodo}</p>
                            </div>
                            <button 
                              onClick={() => {
                                const newList = selectedClient.metas.filter((_: any, i: number) => i !== idx);
                                handleUpdateField('metas', newList);
                              }}
                              className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-[10px] font-black text-blue-500">{progress.toFixed(0)}%</span>
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                {meta.valor_atual} / {meta.valor_meta}
                              </span>
                            </div>
                            <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.2)]" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                               <button 
                                 onClick={() => {
                                   const newList = [...selectedClient.metas];
                                   newList[idx].valor_atual = Math.max(0, newList[idx].valor_atual - 1);
                                   handleUpdateField('metas', newList);
                                 }}
                                 className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-blue-500 transition-colors shadow-sm"
                               >
                                 <Plus size={10} className="rotate-45" />
                               </button>
                               <button 
                                 onClick={() => {
                                   const newList = [...selectedClient.metas];
                                   newList[idx].valor_atual = newList[idx].valor_atual + 1;
                                   if (newList[idx].valor_atual >= newList[idx].valor_meta) {
                                       newList[idx].status = 'Concluída';
                                   }
                                   handleUpdateField('metas', newList);
                                 }}
                                 className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-blue-500 transition-colors shadow-sm"
                               >
                                 <Plus size={10} />
                               </button>
                               <input 
                                 type="number"
                                 value={meta.valor_atual}
                                 onChange={(e) => {
                                   const newList = [...selectedClient.metas];
                                   newList[idx].valor_atual = Number(e.target.value);
                                   handleUpdateField('metas', newList);
                                 }}
                                 className="flex-1 h-7 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 text-[9px] font-black outline-none text-center"
                               />
                               <select 
                                 value={meta.status}
                                 onChange={(e) => {
                                   const newList = [...selectedClient.metas];
                                   newList[idx].status = e.target.value;
                                   handleUpdateField('metas', newList);
                                 }}
                                 className="h-7 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-1 text-[8px] font-black uppercase outline-none"
                               >
                                 <option value="No prazo">NO PRAZO</option>
                                 <option value="Em risco">EM RISCO</option>
                                 <option value="Concluída">CONCLUÍDA</option>
                               </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isAddingMeta ? (
                    <div className="p-6 rounded-[28px] bg-white dark:bg-zinc-900 border-2 border-blue-500/20 space-y-5 shadow-2xl animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Meta / Objetivo</label>
                        <input 
                          type="text" 
                          placeholder="EX: FATURAMENTO MENSAL"
                          value={newMetaEntry.titulo}
                          onChange={e => setNewMetaEntry({ ...newMetaEntry, titulo: e.target.value })}
                          className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 text-[10px] font-bold uppercase focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Métrica (EX: R$, Unid)</label>
                          <input 
                            type="text" 
                            value={newMetaEntry.metrica}
                            placeholder="EX: REAIS"
                            onChange={e => setNewMetaEntry({ ...newMetaEntry, metrica: e.target.value })}
                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 text-[10px] font-bold uppercase"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Periodicidade</label>
                          <select 
                            value={newMetaEntry.periodo}
                            onChange={e => setNewMetaEntry({ ...newMetaEntry, periodo: e.target.value as any })}
                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 text-[10px] font-bold uppercase"
                          >
                            <option value="Mensal">Mensal</option>
                            <option value="Trimestral">Trimestral</option>
                            <option value="Anual">Anual</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Valor Meta</label>
                          <input 
                            type="number" 
                            value={newMetaEntry.valor_meta}
                            onChange={e => setNewMetaEntry({ ...newMetaEntry, valor_meta: Number(e.target.value) })}
                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 text-[10px] font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Valor Atual</label>
                          <input 
                            type="number" 
                            value={newMetaEntry.valor_atual}
                            onChange={e => setNewMetaEntry({ ...newMetaEntry, valor_atual: Number(e.target.value) })}
                            className="w-full h-11 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl px-4 text-[10px] font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button onClick={() => setIsAddingMeta(false)} variant="ghost" className="flex-1 !h-12 !rounded-xl text-[10px] uppercase font-black">Cancelar</Button>
                        <Button 
                          onClick={() => {
                            if (!newMetaEntry.titulo || !newMetaEntry.valor_meta) return;
                            const newList = [...(selectedClient.metas || []), { ...newMetaEntry, id: Date.now().toString() }];
                            handleUpdateField('metas', newList);
                            setNewMetaEntry({ id: '', titulo: '', metrica: '', valor_atual: 0, valor_meta: 0, periodo: 'Mensal', status: 'No prazo' });
                            setIsAddingMeta(false);
                          }}
                          className="flex-[2] !h-12 !rounded-xl !bg-blue-600 !text-white text-[10px] uppercase font-black shadow-lg shadow-blue-500/20"
                        >
                          Salvar Objetivo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setIsAddingMeta(true)}
                      className="w-full h-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center gap-2 text-zinc-400 hover:text-blue-500 hover:border-blue-500/30 transition-all text-[10px] font-black uppercase tracking-widest group bg-zinc-50/30 dark:bg-zinc-900/10"
                    >
                      <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Adicionar Meta Estratégica
                    </button>
                  )}
                </div>
              </Accordion>

              {/* ANTIGO QUADRO DE ESTRATÉGIA — INTEGRADO AO ACORDEÃO */}
              <Accordion 
                title="Estratégia & Cor UI" 
                icon={Target} 
                isOpen={activeAccordion === 'EstrategiaUI'} 
                onToggle={() => setActiveAccordion(activeAccordion === 'EstrategiaUI' ? '' : 'EstrategiaUI')}
              >
                <div className="space-y-6 pt-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">OBJETIVO PRINCIPAL</label>
                    <div className="flex items-start gap-2 group w-full bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-all">
                       <Target size={14} className="text-zinc-400 transition-colors group-focus-within:text-blue-500 shrink-0 mt-0.5" />
                       <textarea 
                         value={localState?.Objetivo || ''} 
                         onChange={(e) => setLocalState({ ...localState, Objetivo: e.target.value })}
                         onBlur={() => handleBlur('Objetivo')}
                         rows={3}
                         className="flex-1 bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none min-w-0 pr-6"
                         placeholder="EX: EXPANSÃO DE MARCA"
                       />
                    </div>
                    <SavingIndicator status={savingStatus[`CLIENTES:${selectedClient.id}:Objetivo`]} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">COR IDENTITÁRIA (APP UI)</label>
                    <div 
                      className="flex items-center gap-4 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group"
                      onClick={() => onOpenColorPicker && onOpenColorPicker(selectedClient.id, selectedClient['Cor (HEX)'] || '#3B82F6')}
                    >
                      <div 
                        className="w-10 h-10 shrink-0 border-4 border-white dark:border-zinc-700 bg-transparent rounded-2xl shadow-xl group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: selectedClient['Cor (HEX)'] || '#3B82F6' }}
                      ></div>
                      <div className="flex-1">
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">{selectedClient['Cor (HEX)'] || '#3B82F6'}</span>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">Brand UI Color</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Accordion>

              <div className="h-4"></div>
            </div>

            {/* Drawer Footer */}
            <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0 flex gap-4">
              <button 
                onClick={() => {
                  if(confirm('Tem certeza que deseja apagar este cliente DE VEZ?')) {
                    onDelete([selectedClient.id], 'CLIENTES');
                    closeDrawer();
                  }
                }}
                className="w-14 h-14 rounded-2xl border-2 border-rose-100 dark:border-rose-900/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center active:scale-95 group"
                title="Excluir Cliente"
              >
                <Trash2 size={24} className="group-hover:rotate-12 transition-transform" />
              </button>
              
              <Button onClick={closeDrawer} className="flex-1 !h-14 !rounded-2xl !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 shadow-xl shadow-zinc-500/10">
                <CheckCircle2 size={18} className="mr-2 shrink-0" /> SALVAR E FINALIZAR
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE REGISTRO DE LOG */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-fade-blur-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center shadow-lg">
                  <Handshake size={20} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white">Registrar Interação</h3>
                  <p className="text-[10px] font-bold text-zinc-400 mt-0.5">Histórico de comunicação com o cliente</p>
                </div>
              </div>
              <button 
                onClick={() => setIsLogModalOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">TIPO DE CONTATO</label>
                  <InputSelect 
                    value={newLogEntry.tipo}
                    onChange={val => setNewLogEntry({ ...newLogEntry, tipo: val })}
                    options={['WhatsApp', 'Reunião', 'Email', 'Ligação', 'Anotação']}
                    className="!h-12"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">DATA / HORA</label>
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      value={newLogEntry.data}
                      onChange={e => setNewLogEntry({ ...newLogEntry, data: e.target.value })}
                      className="flex-1 h-12 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white outline-none focus:border-blue-500/30"
                    />
                    <input 
                      type="time" 
                      value={newLogEntry.hora}
                      onChange={e => setNewLogEntry({ ...newLogEntry, hora: e.target.value })}
                      className="w-24 h-12 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white outline-none focus:border-blue-500/30"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">DESCRIÇÃO DA INTERAÇÃO</label>
                <textarea 
                  rows={4}
                  value={newLogEntry.descricao}
                  onChange={e => setNewLogEntry({ ...newLogEntry, descricao: e.target.value })}
                  placeholder="O QUE FOI CONVERSADO OU DECIDIDO?"
                  className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-[24px] text-[10px] font-medium text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500/30 transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex gap-4">
              <Button onClick={() => setIsLogModalOpen(false)} variant="ghost" className="flex-1 !h-14 !rounded-2xl">Cancelar</Button>
              <Button 
                onClick={() => {
                  if (!newLogEntry.descricao) return;
                  const newList = [...(selectedClient.log_comunicacao || []), newLogEntry];
                  handleUpdateField('log_comunicacao', newList);
                  setNewLogEntry({ 
                    tipo: 'WhatsApp', 
                    data: new Date().toISOString().split('T')[0], 
                    hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 
                    descricao: '' 
                  });
                  setIsLogModalOpen(false);
                }}
                className="flex-[2] !h-14 !rounded-2xl !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 shadow-xl shadow-zinc-500/10"
              >
                REGISTRAR NO HISTÓRICO
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});
