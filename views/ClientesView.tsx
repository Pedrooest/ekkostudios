import React, { useState, useMemo } from 'react';
import { Button, Badge } from '../Components';
import { COLUNAS_CLIENTES } from '../constants';

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

  const handleUpdateField = (field: string, value: string) => {
    if (!selectedClient) return;
    onUpdate('CLIENTES', selectedClient.id, field, value);
    // Optimistic update for the drawer
    setSelectedClient({ ...selectedClient, [field]: value });
  };

  const closeDrawer = () => setSelectedClient(null);

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden bg-app-bg animate-fade-in text-app-text-strong">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-8 px-6 md:px-10 border-b border-app-border bg-app-surface/50 backdrop-blur-md shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-app-text-strong">Clientes</h1>
            <Badge color="blue" className="!bg-blue-500/10 !text-blue-500 !border-blue-500/20">{activeCount} Ativos</Badge>
          </div>
          <p className="text-app-text-muted text-xs font-medium uppercase tracking-widest mt-2 block">Gestão Estratégica de Contas</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onAdd} className="!bg-[#3B82F6] !text-white hover:!bg-blue-600 shadow-lg shadow-blue-500/20">
            <i className="fa-solid fa-plus mr-1"></i> Novo Cliente
          </Button>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="px-6 md:px-10 py-4 flex flex-col sm:flex-row gap-4 shrink-0 border-b border-app-border">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-search text-app-text-muted text-[10px]"></i>
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2.5 bg-app-surface border border-app-border rounded-xl text-xs font-bold text-app-text-strong placeholder-app-text-muted focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
            placeholder="Buscar por nome ou nicho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Status Filter */}
        <div className="flex bg-app-surface border border-app-border rounded-xl p-1 shrink-0">
          {(['Todos', 'Ativo', 'Inativo'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === status 
                  ? 'bg-app-surface-2 text-app-text-strong shadow-sm' 
                  : 'text-app-text-muted hover:text-app-text-strong'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* GRID / LIST AREA */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-app-border rounded-3xl opacity-50">
            <i className="fa-solid fa-user-slash text-4xl mb-4"></i>
            <p className="font-bold tracking-widest uppercase text-xs">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredClients.map(client => {
              const bgHex = client['Cor (HEX)'] || '#3B82F6';
              const initial = (client.Nome || '?').charAt(0).toUpperCase();
              const isAtivo = client.Status === 'Ativo';

              return (
                <div 
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className="group relative bg-app-surface border border-app-border hover:border-blue-500/50 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer flex items-center gap-4 overflow-hidden"
                >
                  {/* Decorative Left Border */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: bgHex }}></div>
                  
                  {/* Avatar */}
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-lg shrink-0 shadow-inner"
                    style={{ backgroundColor: bgHex }}
                  >
                    {initial}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-black text-sm text-app-text-strong truncate pr-2">{client.Nome || 'Sem Nome'}</h3>
                      <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${isAtivo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-500'}`}></div>
                    </div>
                    {client.Nicho && (
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border border-app-border text-app-text-muted truncate max-w-full">
                        {client.Nicho}
                      </span>
                    )}
                  </div>

                  {/* Quick Socials */}
                  <div className="flex flex-col gap-2 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity text-app-text-muted">
                    {client.WhatsApp && <i className="fa-brands fa-whatsapp text-xs hover:text-emerald-500"></i>}
                    {client.Instagram && <i className="fa-brands fa-instagram text-xs hover:text-[#E1306C]"></i>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SIDE DRAWER FOR EDITING */}
      {selectedClient && (
        <div className="absolute inset-0 z-[200] flex justify-end pointer-events-auto overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade"
            onClick={closeDrawer}
          ></div>
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-md bg-app-surface-2 h-full border-l border-app-border shadow-2xl flex flex-col animate-slide-left">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-app-border">
              <div className="flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white text-sm"
                  style={{ backgroundColor: selectedClient['Cor (HEX)'] || '#3B82F6' }}
                >
                  {(selectedClient.Nome || '?').charAt(0).toUpperCase()}
                </div>
                <h2 className="font-black text-lg text-app-text-strong uppercase tracking-wide truncate max-w-[200px]">
                  {selectedClient.Nome || 'Editar Cliente'}
                </h2>
              </div>
              <button 
                onClick={closeDrawer}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-app-surface text-app-text-muted hover:text-app-text-strong transition-colors ios-btn"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>

            {/* Drawer Body Form */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
              
              {/* Field: Nome */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={selectedClient.Nome || ''} 
                  onChange={(e) => handleUpdateField('Nome', e.target.value)}
                  className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-xs font-bold text-app-text-strong focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Row Grid: Nicho & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Nicho</label>
                  <input 
                    type="text" 
                    value={selectedClient.Nicho || ''} 
                    onChange={(e) => handleUpdateField('Nicho', e.target.value)}
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-xs font-bold text-app-text-strong focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Status</label>
                  <select
                    value={selectedClient.Status || 'Ativo'}
                    onChange={(e) => handleUpdateField('Status', e.target.value)}
                    className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-xs font-bold text-app-text-strong focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Field: Responsável */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Responsável (Interno)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted"><i className="fa-solid fa-user text-xs"></i></span>
                  <input 
                    type="text" 
                    value={selectedClient.Responsável || ''} 
                    onChange={(e) => handleUpdateField('Responsável', e.target.value)}
                    className="w-full bg-app-surface border border-app-border rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-app-text-strong focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Field: WhatsApp */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"><i className="fa-brands fa-whatsapp text-sm"></i></span>
                  <input 
                    type="text" 
                    value={selectedClient.WhatsApp || ''} 
                    onChange={(e) => handleUpdateField('WhatsApp', e.target.value)}
                    className="w-full bg-app-surface border border-app-border rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-app-text-strong focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="Ex: +55 11 99999-9999"
                  />
                </div>
              </div>

              {/* Field: Instagram */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Instagram</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#E1306C]"><i className="fa-brands fa-instagram text-sm"></i></span>
                  <input 
                    type="text" 
                    value={selectedClient.Instagram || ''} 
                    onChange={(e) => handleUpdateField('Instagram', e.target.value)}
                    className="w-full bg-app-surface border border-app-border rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-app-text-strong focus:outline-none focus:border-[#E1306C] transition-colors"
                    placeholder="Ex: @nomedocliente"
                  />
                </div>
              </div>

              {/* Field: Objetivo */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Objetivo Principal</label>
                <textarea 
                  value={selectedClient.Objetivo || ''} 
                  onChange={(e) => handleUpdateField('Objetivo', e.target.value)}
                  rows={3}
                  className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-xs font-bold text-app-text-strong focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Ex: Gerar R$20k em Vendas mensais"
                />
              </div>

              {/* Field: Cor HEX */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Cor Principal (Branding)</label>
                <div 
                  className="flex items-center gap-4 bg-app-surface border border-app-border rounded-xl px-4 py-3 cursor-pointer hover:border-blue-500 transition-colors overflow-hidden"
                  onClick={() => onOpenColorPicker && onOpenColorPicker(selectedClient.id, selectedClient['Cor (HEX)'] || '#3B82F6')}
                >
                  {/* We are intercepting the click to use the global ColorPicker, or falling back to native input. Since we have onOpenColorPicker from App.tsx we'll use it if present. But since App.tsx expects the table format, let's just make it a native color input to be simpler/contained, OR call onOpenColorPicker. I'll use native for speed. */}
                  <input 
                    type="color" 
                    value={selectedClient['Cor (HEX)'] || '#3B82F6'}
                    onChange={(e) => handleUpdateField('Cor (HEX)', e.target.value)}
                    className="w-8 h-8 shrink-0 cursor-pointer border-none bg-transparent rounded-full overflow-hidden [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch-wrapper]:border-none [&::-moz-color-swatch]:border-none shadow-inner"
                    style={{ borderRadius: '50%' }}
                  />
                  <div className="flex-1">
                    <span className="text-xs font-black uppercase tracking-widest">{selectedClient['Cor (HEX)'] || '#3B82F6'}</span>
                    <p className="text-[9px] text-app-text-muted uppercase">Clique para alterar</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-6 border-t border-app-border bg-app-surface/50 backdrop-blur shrink-0 flex gap-4">
              <Button onClick={() => {
                if(confirm('Tem certeza que deseja apagar este cliente DE VEZ?')) {
                  onDelete([selectedClient.id], 'CLIENTES');
                  closeDrawer();
                }
              }} variant="danger" className="flex-1 !border-rose-500/10">
                <i className="fa-solid fa-trash-can mr-1"></i> Apagar
              </Button>
              <Button onClick={closeDrawer} className="flex-1 bg-app-surface border border-app-border text-app-text-strong">
                Finalizar
              </Button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
});
