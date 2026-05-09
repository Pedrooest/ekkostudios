import React, { useState, useMemo } from 'react';
import { Button, Badge, Card, PSelectPortal, DatePickerPortal, TimeInput } from '../Components';
import { 
  Handshake, Search, Plus, Calendar, Clock, Users, FileText, 
  CheckCircle2, XCircle, MapPin, Video, Monitor,
  ChevronRight, X, Trash2, Printer
} from 'lucide-react';
import { Reuniao, Cliente } from '../types';

interface ReunioesViewProps {
  reunioes: Reuniao[];
  clients: Cliente[];
  onUpdate: (id: string, table: string, field: string, value: any, skipLog?: boolean) => void;
  onDelete: (ids: string[], table: string) => void;
  onAdd: (initial?: any) => void;
  savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
}

export const ReunioesView: React.FC<ReunioesViewProps> = ({ 
  reunioes, 
  clients, 
  onUpdate, 
  onDelete, 
  onAdd,
  savingStatus = {}
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
      const matchesSearch = (r.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (r.pauta || '').toLowerCase().includes(searchTerm.toLowerCase());
      
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
      case 'Agendada':  return <Badge color="blue"  className="!flex items-center gap-1 text-[9px] font-black uppercase tracking-widest shrink-0"><Clock size={10} className="shrink-0" /><span>Agendada</span></Badge>;
      case 'Realizada': return <Badge color="green" className="!flex items-center gap-1 text-[9px] font-black uppercase tracking-widest shrink-0"><CheckCircle2 size={10} className="shrink-0" /><span>Realizada</span></Badge>;
      case 'Cancelada': return <Badge color="red"   className="!flex items-center gap-1 text-[9px] font-black uppercase tracking-widest shrink-0"><XCircle size={10} className="shrink-0" /><span>Cancelada</span></Badge>;
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
    <div className="view-root flex flex-col h-full w-full animate-fade-blur bg-zinc-50/10 dark:bg-zinc-950/20">
      
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
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
            <Search size={14} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 h-11 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 focus:border-zinc-400 transition-all shadow-sm"
            placeholder="BUSCAR REUNIÃO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
          <PSelectPortal
            value={clientFilter}
            onChange={(val) => setClientFilter(val)}
            options={[{ value: 'Todos', label: 'TODOS OS CLIENTES' }, ...clients.map(c => ({ value: c.id, label: (c.Nome || '').toUpperCase() }))]}
            className="min-w-[140px]"
          />

          <PSelectPortal
            value={monthFilter}
            onChange={(val) => setMonthFilter(val)}
            options={[{ value: 'Todos', label: 'TODOS OS MESES' }, ...months.map(m => ({ value: m, label: m.toUpperCase() }))]}
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* MEETINGS LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        {filteredReunioes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-zinc-100 dark:border-zinc-800/50 rounded-3xl text-zinc-400 bg-zinc-50/50 dark:bg-zinc-900/10">
            <Handshake size={64} className="mb-6 opacity-5" />
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-30 mt-4">Nenhuma reunião encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 card-grid">
            {filteredReunioes.map(r => {
              const client = currentClient(r.cliente_id);
              const clientColor = client?.['Cor (HEX)'] || '#3B82F6';
              const meetingDate = new Date(r.data + 'T12:00:00');
              const formattedDate = meetingDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

              const isRealizada = r.status === 'Realizada';
              const isCancelada = r.status === 'Cancelada';
              const isPast = new Date(r.data + 'T23:59:59') < new Date() && !isRealizada;

              return (
                <div
                  key={r.id}
                  onClick={() => { setSelectedMeeting(r); setIsEditModalOpen(true); }}
                  className={`group relative cursor-pointer rounded-[24px] overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]
                    ${isCancelada ? 'border-zinc-200 dark:border-zinc-800 opacity-60 saturate-50' :
                      isRealizada ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-500/5' :
                      'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }
                  `}
                >
                  {/* Top color bar */}
                  <div className="h-1 w-full" style={{ backgroundColor: clientColor }} />

                  <div className="p-5 flex flex-col gap-4">
                    {/* Row 1: client avatar + status badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white text-sm shrink-0 shadow-md"
                          style={{ backgroundColor: clientColor }}
                        >
                          {(client?.Nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 truncate">{client?.Nome || 'Geral'}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight truncate">{client?.Nicho || 'Estratégia'}</p>
                        </div>
                      </div>
                      {getStatusBadge(r.status)}
                    </div>

                    {/* Row 2: title */}
                    <h3 className="text-[15px] font-black text-zinc-900 dark:text-white leading-snug group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {r.titulo}
                    </h3>

                    {/* Row 3: date + time + format chips */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-2 py-1.5">
                        <Calendar size={11} className="text-zinc-400 shrink-0" />
                        <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300 tracking-wide">{formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-2 py-1.5">
                        <Clock size={11} className="text-zinc-400 shrink-0" />
                        <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300">{r.hora}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded-lg px-2 py-1.5">
                        {getFormatIcon(r.formato)}
                        <span className="text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-300">{r.formato}</span>
                      </div>
                      {isPast && !isRealizada && (
                        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-700/40 rounded-lg px-2 py-1.5">
                          <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">Aguardando</span>
                        </div>
                      )}
                    </div>

                    {/* Row 4: próximos passos preview */}
                    {r.proximos_passos && r.proximos_passos.length > 0 && (
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5 mb-2">
                          <ChevronRight size={9} className="text-blue-500 shrink-0" /> {r.proximos_passos.length} próximo{r.proximos_passos.length > 1 ? 's passos' : ' passo'}
                        </p>
                        {r.proximos_passos.slice(0, 2).map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${step.checkbox ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                            <span className={`text-[9px] font-bold truncate ${step.checkbox ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-300'}`}>
                              {step.texto}
                            </span>
                          </div>
                        ))}
                        {r.proximos_passos.length > 2 && (
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wider">+{r.proximos_passos.length - 2} mais</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && selectedMeeting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md animate-fade" onClick={() => setIsEditModalOpen(false)} />

          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[90vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-zinc-200 dark:border-white/10 animate-bounce-in">
            
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
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:rotate-90 transition-transform"
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
                       <PSelectPortal
                         value={selectedMeeting.cliente_id}
                         onChange={(val) => onUpdate(selectedMeeting.id, 'REUNIOES', 'cliente_id', val)}
                         options={[{ value: '', label: 'Selecione o Cliente' }, ...clients.map(c => ({ value: c.id, label: (c.Nome || '').toUpperCase() }))]}
                         className="w-full"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Status</label>
                       <PSelectPortal
                         value={selectedMeeting.status}
                         onChange={(val) => onUpdate(selectedMeeting.id, 'REUNIOES', 'status', val)}
                         options={[
                           { value: 'Agendada', label: 'Agendada' },
                           { value: 'Realizada', label: 'Realizada' },
                           { value: 'Cancelada', label: 'Cancelada' },
                         ]}
                         className="w-full"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Título da Reunião</label>
                    <input
                      type="text"
                      value={selectedMeeting.titulo}
                      onChange={(e) => onUpdate(selectedMeeting.id, 'REUNIOES', 'titulo', e.target.value)}
                      className="w-full h-11 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div>
                        <DatePickerPortal
                          label="Data"
                          value={selectedMeeting.data}
                          onChange={(val) => onUpdate(selectedMeeting.id, 'REUNIOES', 'data', val)}
                          clearable={false}
                        />
                     </div>
                     <div>
                        <TimeInput
                          label="Hora"
                          value={selectedMeeting.hora}
                          onChange={(val) => onUpdate(selectedMeeting.id, 'REUNIOES', 'hora', val)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Formato</label>
                        <PSelectPortal
                           value={selectedMeeting.formato}
                           onChange={(val) => onUpdate(selectedMeeting.id, 'REUNIOES', 'formato', val)}
                           options={[
                             { value: 'Online', label: 'Online' },
                             { value: 'Presencial', label: 'Presencial' },
                             { value: 'Híbrido', label: 'Híbrido' },
                           ]}
                           className="w-full"
                        />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Pauta</label>
                        <textarea value={selectedMeeting.pauta} onChange={(e) => onUpdate(selectedMeeting.id, 'REUNIOES', 'pauta', e.target.value)} rows={4} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Decisões</label>
                        <textarea value={selectedMeeting.decisoes} onChange={(e) => onUpdate(selectedMeeting.id, 'REUNIOES', 'decisoes', e.target.value)} rows={4} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-xs transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
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
                           onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps);
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
                                  newSteps[idx] = { ...newSteps[idx], checkbox: !newSteps[idx].checkbox };
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
                                  newSteps[idx] = { ...newSteps[idx], texto: e.target.value };
                                  onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps);
                                }}
                                className={`flex-1 bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 ${step.checkbox ? 'text-zinc-400 line-through' : ''}`}
                                placeholder="Ação..."
                              />
                           </div>
                           <div className="flex items-center gap-3">
                              <input type="text" value={step.responsavel} onChange={(e) => { const newSteps = [...selectedMeeting.proximos_passos]; newSteps[idx] = { ...newSteps[idx], responsavel: e.target.value }; onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps); }} className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2 text-[8px] font-black uppercase tracking-widest border-none" placeholder="QUEM" />
                              <input type="text" value={step.prazo} onChange={(e) => { const newSteps = [...selectedMeeting.proximos_passos]; newSteps[idx] = { ...newSteps[idx], prazo: e.target.value }; onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps); }} className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2 text-[8px] font-black uppercase tracking-widest border-none" placeholder="QUANDO" />
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
