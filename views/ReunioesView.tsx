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
      case 'Presencial': return <MapPin size={11} className="text-zinc-400 shrink-0" />;
      case 'Online':     return <Monitor size={11} className="text-zinc-400 shrink-0" />;
      case 'Híbrido':    return <Video size={11} className="text-zinc-400 shrink-0" />;
      default:           return <Monitor size={11} className="text-zinc-400 shrink-0" />;
    }
  };

  const currentClient = (clientId: string) => clients.find(c => c.id === clientId);

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="view-root flex flex-col h-full w-full animate-fade-blur bg-zinc-50/10 dark:bg-zinc-950/20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 shrink-0">
            <Handshake size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 truncate">Reuniões</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 opacity-70 hidden sm:block">Gestão de alinhamentos e decisões estratégicas.</p>
          </div>
        </div>

        <button
          onClick={() => onAdd()}
          className="h-9 sm:h-11 px-3 sm:px-6 bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-1.5 shrink-0"
        >
          <Plus size={15} strokeWidth={3} className="shrink-0" />
          <span className="hidden sm:inline">Nova Reunião</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* FILTERS */}
      <div className="px-4 sm:px-8 py-3 sm:py-5 flex flex-col sm:flex-row gap-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-sm">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors">
            <Search size={14} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-4 focus:ring-zinc-500/10 focus:border-zinc-400 transition-all shadow-sm"
            placeholder="BUSCAR REUNIÃO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <PSelectPortal
            value={clientFilter}
            onChange={(val) => setClientFilter(val)}
            options={[{ value: 'Todos', label: 'CLIENTES' }, ...clients.map(c => ({ value: c.id, label: (c.Nome || '').toUpperCase() }))]}
            className="min-w-[120px] shrink-0"
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
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8">
        {filteredReunioes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-zinc-200 dark:border-zinc-800 rounded-[32px] bg-zinc-50/50 dark:bg-zinc-900/20 gap-5">
            <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-800 dark:to-zinc-950 flex items-center justify-center shadow-xl shadow-zinc-500/10">
              <Handshake size={32} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black uppercase tracking-tight text-zinc-700 dark:text-zinc-300">Nenhuma reunião</p>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Clique em "Nova Reunião" para começar.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 card-grid stagger">
            {filteredReunioes.map(r => {
              const client = currentClient(r.cliente_id);
              const clientColor = client?.['Cor (HEX)'] || '#3B82F6';
              const meetingDate = new Date(r.data + 'T12:00:00');
              const formattedDate = meetingDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

              const isRealizada = r.status === 'Realizada';
              const isCancelada = r.status === 'Cancelada';
              const isPast = new Date(r.data + 'T23:59:59') < new Date() && !isRealizada && !isCancelada;
              const nextSteps = Array.isArray(r.proximos_passos) ? r.proximos_passos : [];

              return (
                <div
                  key={r.id}
                  onClick={() => { setSelectedMeeting(r); setIsEditModalOpen(true); }}
                  className={`group relative cursor-pointer rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] flex flex-col
                    shadow-sm hover:shadow-xl dark:shadow-black/20 dark:hover:shadow-black/50
                    ${isCancelada
                      ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60 saturate-50'
                      : isRealizada
                        ? 'border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-zinc-900 hover:border-emerald-300 dark:hover:border-emerald-800'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }
                  `}
                >
                  {/* Top color bar (client color) */}
                  <div className="h-[3px] w-full shrink-0" style={{ backgroundColor: clientColor }} />

                  <div className="p-5 flex flex-col gap-3 flex-1">

                    {/* Row 1: avatar + nome cliente + status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-[13px] shrink-0 shadow-sm"
                          style={{ backgroundColor: clientColor }}
                        >
                          {(client?.Nome || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 truncate leading-tight">{client?.Nome || 'Geral'}</p>
                          <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight truncate leading-tight mt-0.5">{client?.Nicho || 'Estratégia'}</p>
                        </div>
                      </div>
                      <div className="shrink-0">{getStatusBadge(r.status)}</div>
                    </div>

                    {/* Row 2: título */}
                    <h3 className="text-sm font-black text-zinc-900 dark:text-white leading-snug group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-2 min-h-[40px]">
                      {r.titulo || 'Sem título'}
                    </h3>

                    {/* Row 3: data+hora fundidos + formato */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1">
                        <Calendar size={10} className="text-zinc-400 shrink-0" />
                        <span className="text-[9px] font-bold text-zinc-600 dark:text-zinc-300 capitalize">{formattedDate}</span>
                        {r.hora && (
                          <>
                            <span className="text-zinc-300 dark:text-zinc-600 text-[9px] leading-none">·</span>
                            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400">{r.hora}</span>
                          </>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1">
                        {getFormatIcon(r.formato)}
                        <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">{r.formato}</span>
                      </span>
                      {isPast && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-700/40 rounded-lg px-2 py-1">
                          <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">⚠ Pendente</span>
                        </span>
                      )}
                    </div>

                    {/* Row 4: próximos passos — só se tiver */}
                    {nextSteps.length > 0 && (
                      <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1 mb-1.5">
                          <ChevronRight size={9} className="text-blue-500 shrink-0" />
                          {nextSteps.length} próximo{nextSteps.length > 1 ? 's passos' : ' passo'}
                        </p>
                        {nextSteps.slice(0, 2).map((step, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${step.checkbox ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                            <span className={`text-[9px] font-bold truncate ${step.checkbox ? 'text-zinc-400 line-through' : 'text-zinc-600 dark:text-zinc-300'}`}>
                              {step.texto || '—'}
                            </span>
                          </div>
                        ))}
                        {nextSteps.length > 2 && (
                          <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">+{nextSteps.length - 2} mais</span>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5">
          <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md animate-fade" onClick={() => setIsEditModalOpen(false)} />

          <div className="relative bg-white dark:bg-zinc-900 w-full max-w-4xl max-h-[92vh] rounded-[28px] overflow-hidden shadow-2xl flex flex-col border border-zinc-200 dark:border-white/10 animate-bounce-in">

            {/* ── HEADER ── */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white dark:bg-zinc-900 z-10 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                  style={{ backgroundColor: currentClient(selectedMeeting.cliente_id)?.['Cor (HEX)'] || '#3B82F6' }}
                >
                  <Handshake size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-white truncate">
                    {selectedMeeting.titulo || 'Nova Reunião'}
                  </h2>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                    {currentClient(selectedMeeting.cliente_id)?.Nome || 'Geral'} · {selectedMeeting.data ? new Date(selectedMeeting.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleExportPDF} className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-blue-500 transition-colors" title="Imprimir">
                  <Printer size={15} />
                </button>
                <button
                  onClick={() => { if (confirm('Deseja excluir esta reunião?')) { onDelete([selectedMeeting.id], 'REUNIOES'); setIsEditModalOpen(false); } }}
                  className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  title="Excluir"
                >
                  <Trash2 size={15} />
                </button>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:rotate-90 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* ── BODY ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-zinc-800">

                {/* Left column — form */}
                <div className="lg:col-span-7 p-6 space-y-5">

                  {/* Cliente + Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Cliente</label>
                      <PSelectPortal
                        value={selectedMeeting.cliente_id}
                        onChange={(val) => onUpdate(selectedMeeting.id, 'REUNIOES', 'cliente_id', val)}
                        options={[{ value: '', label: 'Selecione...' }, ...clients.map(c => ({ value: c.id, label: (c.Nome || '').toUpperCase() }))]}
                        className="w-full"
                        size="sm"
                      />
                    </div>
                    <div className="space-y-1.5">
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
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Título */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Título da Reunião</label>
                    <input
                      type="text"
                      value={selectedMeeting.titulo}
                      onChange={(e) => onUpdate(selectedMeeting.id, 'REUNIOES', 'titulo', e.target.value)}
                      className="w-full h-10 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>

                  {/* Data + Hora + Formato */}
                  <div className="grid grid-cols-3 gap-3">
                    <DatePickerPortal
                      label="Data"
                      value={selectedMeeting.data}
                      onChange={(val) => onUpdate(selectedMeeting.id, 'REUNIOES', 'data', val)}
                      clearable={false}
                      size="sm"
                    />
                    <TimeInput
                      label="Hora"
                      value={selectedMeeting.hora}
                      onChange={(val) => onUpdate(selectedMeeting.id, 'REUNIOES', 'hora', val)}
                      size="sm"
                    />
                    <div className="space-y-1.5">
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
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Pauta + Decisões lado a lado se tela grande, empilhado em mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Pauta</label>
                      <textarea
                        value={selectedMeeting.pauta}
                        onChange={(e) => onUpdate(selectedMeeting.id, 'REUNIOES', 'pauta', e.target.value)}
                        rows={5}
                        placeholder="O que será discutido nesta reunião?"
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 leading-relaxed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">Decisões</label>
                      <textarea
                        value={selectedMeeting.decisoes}
                        onChange={(e) => onUpdate(selectedMeeting.id, 'REUNIOES', 'decisoes', e.target.value)}
                        rows={5}
                        placeholder="O que foi decidido nesta reunião?"
                        className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 leading-relaxed"
                      />
                    </div>
                  </div>
                </div>

                {/* Right column — próximos passos */}
                <div className="lg:col-span-5 p-6 flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300">Próximos Passos</h3>
                    <button
                      onClick={() => {
                        const newSteps = [...(selectedMeeting.proximos_passos || []), { id: Date.now().toString(), checkbox: false, texto: '', responsavel: '', prazo: '' }];
                        onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps);
                      }}
                      className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 hover:bg-blue-600 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {(selectedMeeting.proximos_passos || []).length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-600/10 border border-indigo-200/30 dark:border-indigo-500/20 flex items-center justify-center">
                        <ChevronRight size={24} className="text-indigo-400 dark:text-indigo-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nenhuma ação definida</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider opacity-70">Clique em + para adicionar próximos passos</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5 overflow-y-auto custom-scrollbar">
                    {(selectedMeeting.proximos_passos || []).map((step, idx) => (
                      <div key={step.id || idx} className="bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5 group shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => {
                              const newSteps = [...(selectedMeeting.proximos_passos || [])];
                              newSteps[idx] = { ...newSteps[idx], checkbox: !newSteps[idx].checkbox };
                              onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps);
                            }}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 ${step.checkbox ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400'}`}
                          >
                            {step.checkbox && <CheckCircle2 size={10} className="text-white" />}
                          </button>
                          <input
                            type="text"
                            value={step.texto}
                            onChange={(e) => {
                              const newSteps = [...(selectedMeeting.proximos_passos || [])];
                              newSteps[idx] = { ...newSteps[idx], texto: e.target.value };
                              onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps);
                            }}
                            className={`flex-1 bg-transparent border-none p-0 text-[11px] font-bold outline-none ${step.checkbox ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}
                            placeholder="Descreva a ação..."
                          />
                          <button
                            onClick={() => {
                              const newSteps = (selectedMeeting.proximos_passos || []).filter((_, i) => i !== idx);
                              onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps);
                            }}
                            className="text-zinc-300 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={step.responsavel}
                            onChange={(e) => { const newSteps = [...(selectedMeeting.proximos_passos || [])]; newSteps[idx] = { ...newSteps[idx], responsavel: e.target.value }; onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps); }}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 focus:outline-none focus:border-blue-400"
                            placeholder="QUEM"
                          />
                          <input
                            type="text"
                            value={step.prazo}
                            onChange={(e) => { const newSteps = [...(selectedMeeting.proximos_passos || [])]; newSteps[idx] = { ...newSteps[idx], prazo: e.target.value }; onUpdate(selectedMeeting.id, 'REUNIOES', 'proximos_passos', newSteps); }}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 focus:outline-none focus:border-blue-400"
                            placeholder="QUANDO"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── FOOTER ── */}
            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3 bg-white dark:bg-zinc-900/80 shrink-0">
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:block">
                {(selectedMeeting.proximos_passos || []).length} próximos passos · {(selectedMeeting.proximos_passos || []).filter(s => s.checkbox).length} concluídos
              </span>
              <div className="flex items-center gap-2.5 ml-auto">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => { handleStatusChange(selectedMeeting, 'Realizada'); setIsEditModalOpen(false); }}
                  className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-colors"
                >
                  Finalizar Reunião
                </button>
              </div>
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
