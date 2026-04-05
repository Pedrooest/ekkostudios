import React, { useState, useMemo } from 'react';
import { Button, Badge, Card, InputSelect } from '../Components';
import { Users, Search, Plus, X, Phone, Instagram, Target, Palette, Trash2, CheckCircle2 } from 'lucide-react';

interface ClientesViewProps {
  clients: any[];
  onUpdate: (tab: string, id: string, field: string, value: any) => void;
  onDelete: (ids: string[], tab: string) => void;
  onAdd: () => void;
  onOpenColorPicker?: (id: string, val: string) => void;
}

export const ClientesView = React.memo(({ clients, onUpdate, onDelete, onAdd, onOpenColorPicker }: ClientesViewProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

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
    onUpdate('CLIENTES', selectedClient.id, field, value);
    // Optimistic update for the drawer
    setSelectedClient({ ...selectedClient, [field]: value });
  };

  const closeDrawer = () => setSelectedClient(null);

  React.useEffect(() => {
    if (!selectedClient) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [selectedClient, closeDrawer]);

  return (
    <div className="view-root flex flex-col h-full w-full animate-fade">
      
      {/* MODERN HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Clientes</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 opacity-60">Gestão estratégica de contas e branding.</p>
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
            className="block w-full pl-9 pr-3 h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            placeholder="BUSCAR CLIENTE..."
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
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/20">
            <Users size={48} className="mb-4 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Nenhum cliente na lista.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {filteredClients.map(client => {
              const bgHex = client['Cor (HEX)'] || '#3B82F6';
              const initial = (client.Nome || '?').charAt(0).toUpperCase();
              const isAtivo = client.Status === 'Ativo';

              return (
                <Card 
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`group relative overflow-hidden transition-all duration-300 !p-5 ${isAtivo ? 'hover:border-zinc-400 dark:hover:border-zinc-500' : 'opacity-60 saturate-50'}`}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5" style={{ backgroundColor: bgHex }}></div>
                  
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shrink-0 shadow-inner group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: bgHex }}
                    >
                      {initial}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate leading-tight">
                          {client.Nome || 'Sem Nome'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 truncate opacity-60">
                          {client.Nicho || 'Sem Nicho'}
                        </span>
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAtivo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-700'}`}></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-zinc-50 dark:border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-zinc-400">
                      {client.WhatsApp && <Phone size={14} className="hover:text-emerald-500 transition-colors" />}
                      {client.Instagram && <Instagram size={14} className="hover:text-rose-500 transition-colors" />}
                    </div>
                    <Badge color={isAtivo ? 'emerald' : 'slate'} className="text-[9px] font-black uppercase tracking-[0.15em] py-0.5 px-2">
                      {client.Status}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT DRAWER */}
      {selectedClient && (
        <div className="fixed inset-0 z-[2200] flex justify-end pointer-events-auto overflow-hidden">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-fade" onClick={closeDrawer}></div>
          
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col animate-slide-left ring-1 ring-white/10">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg"
                  style={{ backgroundColor: selectedClient['Cor (HEX)'] || '#3B82F6' }}
                >
                  {(selectedClient.Nome || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-black text-lg uppercase tracking-tight text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]">
                    {selectedClient.Nome || 'Novo Cliente'}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 opacity-60">Configurações Base</p>
                </div>
              </div>
              <button 
                onClick={closeDrawer}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:rotate-90 active:scale-90 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body Form */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">
              
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Dados Principais</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">NOME DA MARCA</label>
                    <input 
                      type="text" 
                      value={selectedClient.Nome || ''} 
                      onChange={(e) => handleUpdateField('Nome', e.target.value)}
                      className="w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500/50 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">NICHO</label>
                      <input 
                        type="text" 
                        value={selectedClient.Nicho || ''} 
                        onChange={(e) => handleUpdateField('Nicho', e.target.value)}
                        className="w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
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
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Contato & Social</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">RESPONSÁVEL</label>
                    <div className="flex items-center gap-2 group w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 focus-within:border-blue-500/50 transition-all">
                      <Users size={14} className="text-zinc-400 transition-colors group-focus-within:text-blue-500 shrink-0" />
                      <input 
                        type="text" 
                        value={selectedClient.Responsável || ''} 
                        onChange={(e) => handleUpdateField('Responsável', e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">WHATSAPP</label>
                    <div className="flex items-center gap-2 group w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 focus-within:border-emerald-500/50 transition-all">
                       <Phone size={14} className="text-emerald-500 shrink-0" />
                       <input 
                         type="text" 
                         value={selectedClient.WhatsApp || ''} 
                         onChange={(e) => handleUpdateField('WhatsApp', e.target.value)}
                         className="flex-1 bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0"
                         placeholder="EX: +55 11 99999-9999"
                       />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">INSTAGRAM</label>
                    <div className="flex items-center gap-2 group w-full h-11 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 focus-within:border-rose-500/50 transition-all">
                       <Instagram size={14} className="text-rose-500 shrink-0" />
                       <input 
                         type="text" 
                         value={selectedClient.Instagram || ''} 
                         onChange={(e) => handleUpdateField('Instagram', e.target.value)}
                         className="flex-1 bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0"
                         placeholder="EX: @USER"
                       />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-3 bg-indigo-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Estratégia & Branding</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">OBJETIVO PRINCIPAL</label>
                    <div className="flex items-start gap-2 group w-full bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 focus-within:border-blue-500/50 transition-all">
                       <Target size={14} className="text-zinc-400 transition-colors group-focus-within:text-blue-500 shrink-0 mt-0.5" />
                       <textarea 
                         value={selectedClient.Objetivo || ''} 
                         onChange={(e) => handleUpdateField('Objetivo', e.target.value)}
                         rows={3}
                         className="flex-1 bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none min-w-0"
                         placeholder="EX: EXPANSÃO DE MARCA E CONVERSÃO EM HIGH-TICKET"
                       />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">COR IDENTITÁRIA</label>
                    <div 
                      className="flex items-center gap-4 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 transition-all group"
                      onClick={() => onOpenColorPicker && onOpenColorPicker(selectedClient.id, selectedClient['Cor (HEX)'] || '#3B82F6')}
                    >
                      <div 
                        className="w-10 h-10 shrink-0 border-4 border-white dark:border-zinc-700 bg-transparent rounded-2xl shadow-xl group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: selectedClient['Cor (HEX)'] || '#3B82F6' }}
                      ></div>
                      <div className="flex-1">
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{selectedClient['Cor (HEX)'] || '#3B82F6'}</span>
                        <div className="flex items-center gap-2 mt-0.5 opacity-40">
                          <Palette size={10} />
                          <p className="text-[9px] font-bold uppercase tracking-widest">Brand UI Color</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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

    </div>
  );
});
