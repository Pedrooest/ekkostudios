import React, { useState, useMemo } from 'react';
import { Button, Badge, Card } from '../Components';
import { 
  Handshake, Search, Plus, Calendar, Clock, Users, FileText, 
  CheckCircle2, XCircle, MapPin, Video, Monitor,
  ChevronRight, X, Trash2, Printer
} from 'lucide-react';
import { Reuniao, Cliente } from '../types';

interface ReunioesViewProps {
  reunioes: Reuniao[];
  clients: Cliente[];
  onUpdate: (tab: string, id: string, field: string, value: any) => void;
  onDelete: (ids: string[], tab: string) => void;
  onAdd: (initial?: any) => void;
}

export const ReunioesView: React.FC<ReunioesViewProps> = ({ 
  reunioes, 
  clients, 
  onUpdate, 
  onDelete, 
  onAdd 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('Todos');
  const [monthFilter, setMonthFilter] = useState('Todos');
  const [selectedMeeting, setSelectedMeeting] = useState<Reuniao | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const filteredReunioes = useMemo(() => {
    return (reunioes || []).filter(r => {
      const matchesSearch = r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            r.pauta.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClient = clientFilter === 'Todos' || r.cliente_id === clientFilter;
      
      let matchesMonth = true;
      if (monthFilter !== 'Todos') {
        const meetingDate = new Date(r.data + 'T12:00:00');
        const monthName = months[meetingDate.getMonth()];
        matchesMonth = monthName === monthFilter;
      }

      return matchesSearch && matchesClient && matchesMonth;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [reunioes, searchTerm, clientFilter, monthFilter]);

  const handleStatusChange = (meeting: Reuniao, newStatus: Reuniao['status']) => {
    onUpdate(meeting.id, 'REUNIOES', 'status', newStatus);
  };

  const getStatusBadge = (status: Reuniao['status']) => {
    switch (status) {
      case 'Agendada': return <Badge color="blue" className="text-[9px] font-black uppercase tracking-widest"><Clock size={10} className="mr-1" /> Agendada</Badge>;
      case 'Realizada': return <Badge color="green" className="text-[9px] font-black uppercase tracking-widest"><CheckCircle2 size={10} className="mr-1" /> Realizada</Badge>;
      case 'Cancelada': return <Badge color="red" className="text-[9px] font-black uppercase tracking-widest"><XCircle size={10} className="mr-1" /> Cancelada</Badge>;
      default: return null;
    }
  };

  const getFormatIcon = (formato: Reuniao['formato']) => {
    switch (formato) {
      case 'Presencial': return <MapPin size={14} />;
      case 'Online': return <Monitor size={14} />;
      case 'Híbrido': return <Video size={14} />;
      default: return <Monitor size={14} />;
    }
  };

  const currentClient = (clientId: string) => clients.find(c => c.id === clientId);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="view-root flex flex-col h-full w-full animate-fade bg-zinc-50/10 dark:bg-zinc-950/20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-xl shadow-zinc-500/10 ring-4 ring-zinc-500/5">
            <Handshake size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Reuniões</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 opacity-60">Gestão de alinhamentos e decisões estratégicas.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            onClick={() => onAdd()} 
            className="!h-11 px-6 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 hover:scale-105 transition-all shadow-xl shadow-zinc-500/20 border-none font-black text-xs uppercase tracking-widest"
          >
            <Plus size={16} className="mr-2 stroke-[3]" /> Nova Reunião
          </Button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="px-8 py-5 flex flex-col sm:flex-row gap-4 border-b border-zinc-100 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-sm">
        <div className="relative flex-1 group max-w-md">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
            <Search size={14} />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 h-11 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 focus:border-zinc-400 transition-all shadow-sm"
            placeholder="BUSCAR REUNIÃO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
          <select 
            value={clientFilter} 
            onChange={(e) => setClientFilter(e.target.value)}
            className="h-11 px-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 focus:outline-none shadow-sm min-w-[140px]"
          >
            <option value="Todos">TODOS OS CLIENTES</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.Nome.toUpperCase()}</option>)}
          </select>

          <select 
            value={monthFilter} 
            onChange={(e) => setMonthFilter(e.target.value)}
            className="h-11 px-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-300 focus:outline-none shadow-sm min-w-[140px]"
          >
            <option value="Todos">TODOS OS MESES</option>
            {months.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
        </div>
      </div>

      {/* MEETINGS LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {filteredReunioes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/10">
            <Handshake size={64} className="mb-6 opacity-5" />
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30 mt-4">Nenhuma reunião encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredReunioes.map(r => {
              const client = currentClient(r.cliente_id);
              const clientColor = client?.['Cor (HEX)'] || '#3B82F6';
              const meetingDate = new Date(r.data + 'T12:00:00');
              const formattedDate = meetingDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

              return (
                <Card 
                  key={r.id}
                  onClick={() => { setSelectedMeeting(r); setIsEditModalOpen(true); }}
                  className="group relative cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-all duration-500 !p-6 flex flex-col gap-5 overflow-hidden active:scale-[0.98]"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2" style={{ backgroundColor: clientColor }}></div>
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-lg shadow-inner"
                        style={{ backgroundColor: clientColor }}
                      >
                        {client?.Nome.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="max-w-[120px] truncate">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 truncate">{client?.Nome || 'Geral'}</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter truncate">{client?.Nicho || 'Estratégia'}</p>
                      </div>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-tight group-hover:text-blue-500 transition-colors mb-2 line-clamp-2">
                      {r.titulo}
                    </h3>
                    <div className="flex flex-wrap gap-y-2 gap-x-4 mt-3">
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                        <Calendar size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                        <Clock size={12} className="text-zinc-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">{r.hora}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                        {getFormatIcon(r.formato)}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest">{r.formato}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                      <div className="flex -space-x-2">
                         {[1,2,3].map(i => (
                           <div key={i} className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 flex items-center justify-center text-[8px] font-black uppercase">
                             <Users size={10} />
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>

                  {r.proximos_passos && r.proximos_passos.length > 0 && (
                    <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800/50">
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                        <ChevronRight size={10} className="text-blue-500" /> Próximos Passos
                      </p>
                      <div className="space-y-1.5">
                        {r.proximos_passos.slice(0, 2).map((step, idx) => (
                           <div key={idx} className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${step.checkbox ? 'bg-green-500' : 'bg-zinc-300'}`} />
                             <span className={`text-[9px] font-bold truncate ${step.checkbox ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-300'}`}>
                               {step.texto}
                             </span>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedMeeting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md" onClick={() => setIsEditModalOpen(false)} />
          
          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-zinc-200 dark:border-white/10">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                  style={{ backgroundColor: currentClient(selectedMeeting.cliente_id)?.['Cor (HEX)'] || '#3B82F6' }}
                >
                  <Handshake size={24} />
                </div>
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-white truncate max-w-[200px] sm:max-w-md">
                    {selectedMeeting.titulo || 'Detalhes da Reunião'}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">
                    {currentClient(selectedMeeting.cliente_id)?.Nome || 'Geral'} • {selectedMeeting.data}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleExportPDF} className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-blue-500 transition-colors">
                   <Printer size={16} />
                </button>
                <button 
                  onClick={() => {
                    if (confirm('Deseja excluir esta reunião?')) {
                      onDelete([selectedMeeting.id], 'REUNIOES');
                      setIsEditModalOpen(false);
                    }
                  }}
                  className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-7 space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Cliente</label>
                       <select 
                         value={selectedMeeting.cliente_id}
                         onChange={(e) => onUpdate('REUNIOES', selectedMeeting.id, 'cliente_id', e.target.value)}
                         className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-[10px] font-bold uppercase"
                       >
                         <option value="">Selecione o Cliente</option>
                         {clients.map(c => <option key={c.id} value={c.id}>{c.Nome.toUpperCase()}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Status</label>
                       <select 
                         value={selectedMeeting.status}
                         onChange={(e) => onUpdate('REUNIOES', selectedMeeting.id, 'status', e.target.value)}
                         className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-[10px] font-bold uppercase"
                       >
                         <option value="Agendada">Agendada</option>
                         <option value="Realizada">Realizada</option>
                         <option value="Cancelada">Cancelada</option>
                       </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Título da Reunião</label>
                    <input 
                      type="text"
                      value={selectedMeeting.titulo}
                      onChange={(e) => onUpdate('REUNIOES', selectedMeeting.id, 'titulo', e.target.value)}
                      className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Data</label>
                        <input type="date" value={selectedMeeting.data} onChange={(e) => onUpdate('REUNIOES', selectedMeeting.id, 'data', e.target.value)} className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-[10px] font-bold" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Hora</label>
                        <input type="time" value={selectedMeeting.hora} onChange={(e) => onUpdate('REUNIOES', selectedMeeting.id, 'hora', e.target.value)} className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-[10px] font-bold" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Formato</label>
                        <select value={selectedMeeting.formato} onChange={(e) => onUpdate('REUNIOES', selectedMeeting.id, 'formato', e.target.value)} className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-[10px] font-bold">
                           <option value="Online">Online</option>
                           <option value="Presencial">Presencial</option>
                           <option value="Híbrido">Híbrido</option>
                        </select>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Pauta</label>
                        <textarea value={selectedMeeting.pauta} onChange={(e) => onUpdate(selectedMeeting.id, 'REUNIOES', 'pauta', e.target.value)} rows={4} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-xs" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Decisões</label>
                        <textarea value={selectedMeeting.decisoes} onChange={(e) => onUpdate(selectedMeeting.id, 'REUNIOES', 'decisoes', e.target.value)} rows={4} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-xs" />
                     </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">Próximos Passos</h3>
                       <button 
                         onClick={() => {
                           const newSteps = [...(selectedMeeting.proximos_passos || []), { id: Date.now().toString(), checkbox: false, texto: '', responsavel: '', prazo: '' }];
                           onUpdate('REUNIOES', selectedMeeting.id, 'proximos_passos', newSteps);
                         }}
                         className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20"
                       >
                         <Plus size={14} />
                       </button>
                    </div>

                    <div className="space-y-3">
                      {(selectedMeeting.proximos_passos || []).map((step, idx) => (
                        <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col gap-3 group">
                           <div className="flex items-start gap-3">
                              <button 
                                onClick={() => {
                                  const newSteps = [...selectedMeeting.proximos_passos];
                                  newSteps[idx].checkbox = !newSteps[idx].checkbox;
                                  onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps);
                                }}
                                className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center text-[8px] ${step.checkbox ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-300'}`}
                              >
                                {step.checkbox && <CheckCircle2 size={10} />}
                              </button>
                              <input 
                                type="text"
                                value={step.texto}
                                onChange={(e) => {
                                  const newSteps = [...selectedMeeting.proximos_passos];
                                  newSteps[idx].texto = e.target.value;
                                  onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps);
                                }}
                                className={`flex-1 bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 ${step.checkbox ? 'text-zinc-400 line-through' : ''}`}
                                placeholder="Ação..."
                              />
                           </div>
                           <div className="flex items-center gap-3">
                              <input type="text" value={step.responsavel} onChange={(e) => { const newSteps = [...selectedMeeting.proximos_passos]; newSteps[idx].responsavel = e.target.value; onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps); }} className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2 text-[8px] font-black uppercase tracking-widest border-none" placeholder="QUEM" />
                              <input type="text" value={step.prazo} onChange={(e) => { const newSteps = [...selectedMeeting.proximos_passos]; newSteps[idx].prazo = e.target.value; onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps); }} className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2 text-[8px] font-black uppercase tracking-widest border-none" placeholder="QUANDO" />
                              <button onClick={() => { const newSteps = selectedMeeting.proximos_passos.filter((_, i) => i !== idx); onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps); }} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Trash2 size={12} />
                              </button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50">
               <button onClick={() => setIsEditModalOpen(false)} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">Fechar</button>
               <button onClick={() => { handleStatusChange(selectedMeeting, 'Realizada'); setIsEditModalOpen(false); }} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase bg-blue-600 text-white shadow-lg shadow-blue-500/20">Finalizar Reunião</button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT STYLES */}
      <style>{`
        @media print {
          .view-root > *:not(.print-only) { display: none !important; }
          .print-only { display: block !important; position: static !important; width: 100% !important; background: white !important; }
        }
      `}</style>

    </div>
  );
};
