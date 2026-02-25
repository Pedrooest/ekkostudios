import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Clock, User, Check, X,
    Filter, Image as ImageIcon, Archive, Database,
    ChevronLeft, ChevronRight, FolderOpen, Copy, Trash2,
    ChevronDown, Download, Loader2
} from 'lucide-react';
import { playUISound } from '../utils/uiSounds';
import { getCalendarDays, MONTH_NAMES_BR, WEEKDAYS_BR_SHORT } from '../utils/calendarUtils';

interface PlanningViewProps {
    data: any[];
    clients: any[];
    onUpdate: (id: string, table: any, field: string, value: any) => void;
    onAdd: (table: any, initialData?: any) => Promise<string>;
    rdc: any[];
    matriz: any[];
    cobo: any[];
    tasks: any[];
    iaHistory: any[];
    setActiveTab: (tab: any) => void;
    performArchive: (ids: string[], table: any, archived: boolean) => void;
    performDelete: (ids: string[], table: any) => void;
    library?: any;
    activeClientId?: string;
    showArchived?: boolean;
    setShowArchived?: (val: boolean) => void;
    setIsClientFilterOpen?: (val: boolean) => void;
}

export function PlanningView({
    data, clients, onUpdate, onAdd, rdc, matriz, cobo,
    tasks, iaHistory, setActiveTab, performArchive, performDelete, library,
    activeClientId, showArchived, setShowArchived, setIsClientFilterOpen
}: PlanningViewProps) {
    const [activeStatus, setActiveStatus] = useState('ALL');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

    // Filtros e Sidebars
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [exportSelectedClient, setExportSelectedClient] = useState('Todos');

    const [sidebarView, setSidebarView] = useState<'edit' | 'banco' | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const selectedEvent = useMemo(() => data.find((e: any) => e.id === selectedEventId), [data, selectedEventId]);

    // Lógica de Calendário
    const calendarDays = useMemo(() => {
        const days = getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
        if (viewMode === 'month') return days;

        const todayStr = currentDate.toISOString().split('T')[0];
        const dayIdx = days.findIndex(d => d.dateStr === todayStr);
        const startIdx = Math.max(0, Math.floor(dayIdx / 7) * 7);
        return days.slice(startIdx, startIdx + 7);
    }, [currentDate, viewMode]);

    const filteredData = useMemo(() => {
        return data.filter((e: any) => {
            const matchStatus = activeStatus === 'ALL' || e['Status do conteúdo'] === activeStatus;
            const matchClient = !activeClientId || e.Cliente_ID === activeClientId;
            return matchStatus && matchClient;
        });
    }, [data, activeStatus, activeClientId]);

    const getEventosDoDia = (dateStr: string) => {
        return filteredData.filter((evt: any) => evt.Data === dateStr);
    };

    const handleMonthNav = (dir: number) => {
        playUISound('tap');
        const next = new Date(currentDate);
        if (viewMode === 'month') {
            next.setMonth(next.getMonth() + dir);
        } else {
            next.setDate(next.getDate() + (7 * dir));
        }
        setCurrentDate(next);
    };

    const openEditSidebar = (id: string | null) => {
        playUISound('open');
        setSelectedEventId(id);
        setSidebarView('edit');
    };

    const handleAddContent = async () => {
        playUISound('success');
        const today = new Date().toISOString().split('T')[0];
        const newId = await onAdd('PLANEJAMENTO', {
            Data: today,
            Hora: '09:00',
            "Status do conteúdo": 'EM ESPERA',
            Conteúdo: 'NOVO CONTEÚDO',
            Cliente_ID: activeClientId || 'GERAL'
        });
        if (newId) {
            setSelectedEventId(newId);
            setSidebarView('edit');
        }
    };

    const getClientColor = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        return client?.['Cor (HEX)'] || '#3B82F6';
    };

    return (
        <div className="flex-1 flex flex-col font-sans w-full h-full bg-[#F8FAFC] dark:bg-[#0a0a0c] transition-colors overflow-y-auto custom-scrollbar">

            <div className="p-6 lg:p-10 space-y-8 w-full">


                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-2.5 h-10 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]"></div>
                            <h1 className="text-3xl md:text-4xl font-black text-[#0B1527] dark:text-white tracking-tighter uppercase italic leading-none">
                                PLANEJAMENTO ESTRATÉGICO
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex bg-white dark:bg-[#111114] p-1.5 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm mr-4">
                                {['ALL', 'EM ESPERA', 'PRODUÇÃO', 'CONCLUÍDO'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => { playUISound('tap'); setActiveStatus(status); }}
                                        className={`text-[9px] font-black uppercase tracking-widest transition-all px-4 py-2 rounded-xl ios-btn ${activeStatus === status
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                                            : 'text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white'
                                            }`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <button onClick={() => setIsClientFilterOpen?.(true)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter transition-all px-3 py-2 ${activeClientId ? 'text-blue-500' : 'text-zinc-400 hover:text-blue-500'}`}>
                                <Filter size={14} /> FILTRAR
                            </button>
                            <button onClick={() => setShowArchived?.(!showArchived)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter transition-all px-3 py-2 ${showArchived ? 'text-amber-500' : 'text-zinc-400 hover:text-blue-500'}`}>
                                <Archive size={14} /> {showArchived ? 'OCULTAR' : 'ARQUIVADOS'}
                            </button>
                            <button onClick={() => setIsExportModalOpen(true)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-zinc-400 hover:text-blue-500 transition-all px-3 py-2">
                                <Download size={14} /> EXPORTAR
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => setSidebarView('banco')} className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-[#0B1527] dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ios-btn">
                            <Database size={16} /> BANCO
                        </button>
                        <button onClick={handleAddContent} className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-blue-500/40 transition-all hover:scale-105 active:scale-95">
                            <Plus size={16} strokeWidth={3} /> NOVO CONTEÚDO
                        </button>
                    </div>
                </div>

                {/* CALENDAR CONTROLS */}
                <div className="flex items-center justify-between bg-white dark:bg-[#111114] border border-gray-100 dark:border-zinc-800 p-4 px-6 rounded-[2.5rem] shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleMonthNav(-1)} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-400 dark:text-zinc-500 transition-all ios-btn border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
                                <ChevronLeft size={24} />
                            </button>
                            <h3 className="text-xl font-black text-[#0B1527] dark:text-white min-w-[200px] text-center uppercase tracking-tighter italic">
                                {viewMode === 'month' ? `${MONTH_NAMES_BR[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 'Vista Semanal'}
                            </h3>
                            <button onClick={() => handleMonthNav(1)} className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-400 dark:text-zinc-500 transition-all ios-btn border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="flex bg-[#F8FAFC] dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-1.5 rounded-2xl">
                        <button
                            onClick={() => { playUISound('tap'); setViewMode('month'); }}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-white dark:bg-zinc-800 text-[#0B1527] dark:text-white shadow-xl border border-gray-100 dark:border-white/5' : 'text-gray-500 dark:text-zinc-500 hover:text-[#0B1527] dark:hover:text-white'}`}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => { playUISound('tap'); setViewMode('week'); }}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-white dark:bg-zinc-800 text-[#0B1527] dark:text-white shadow-xl border border-gray-100 dark:border-white/5' : 'text-gray-500 dark:text-zinc-500 hover:text-[#0B1527] dark:hover:text-white'}`}
                        >
                            Semana
                        </button>
                    </div>
                </div>

                {/* CALENDAR GRID */}
                <div className="bg-white dark:bg-[#111114] border border-gray-100 dark:border-zinc-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
                    <div className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#111114]">
                        {WEEKDAYS_BR_SHORT.map(dia => (
                            <div key={dia} className="py-6 text-center text-[10px] font-black text-[#0B1527] dark:text-zinc-400 uppercase tracking-[0.2em] border-r border-gray-100 dark:border-zinc-800 last:border-0">
                                {dia}
                            </div>
                        ))}
                    </div>

                    <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-[minmax(180px,auto)]' : 'auto-rows-[minmax(600px,auto)]'}`}>
                        {calendarDays.map((diaObj, idx) => {
                            const evts = getEventosDoDia(diaObj.dateStr);
                            const isToday = diaObj.dateStr === new Date().toISOString().split('T')[0];

                            return (
                                <div
                                    key={idx}
                                    className={`p-1.5 md:p-3 border-r border-b border-gray-100 dark:border-zinc-800 transition-all relative flex flex-col ${diaObj.isNextMonth || diaObj.isPrevMonth ? 'bg-gray-50/50 dark:bg-zinc-900/30 opacity-40' :
                                        isToday ? 'bg-blue-600/5' : 'bg-white dark:bg-[#111114]'
                                        } hover:bg-gray-50 dark:hover:bg-zinc-900/50`}
                                >
                                    <div className="flex justify-start mb-4">
                                        <span className={`text-[11px] font-bold w-7 h-5 flex items-center justify-center rounded-md ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-[#0B1527] dark:text-zinc-500'}`}>
                                            {diaObj.day}
                                        </span>
                                    </div>

                                    <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar">
                                        {evts.map(evento => {
                                            const client = clients.find(c => c.id === evento.Cliente_ID);
                                            const clientColor = client?.['Cor (HEX)'] || '#3B82F6';

                                            // Determine background and text colors based on client or status if needed, 
                                            // but for now, let's use a premium clean white card with colored side strip.
                                            return (
                                                <div
                                                    key={evento.id}
                                                    onClick={() => openEditSidebar(evento.id)}
                                                    className="group p-3.5 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#1A1A22] text-left cursor-pointer transition-all hover:shadow-xl hover:shadow-blue-900/10 hover:border-blue-400 dark:hover:border-zinc-700 relative overflow-hidden active:scale-[0.98]"
                                                >
                                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 shadow-[2px_0_10px_rgba(0,0,0,0.1)]" style={{ backgroundColor: clientColor }}></div>
                                                    <div className="pl-2.5">
                                                        <div className="flex items-center gap-2 text-[8px] font-black uppercase mb-2 text-blue-500 tracking-widest">
                                                            <div className="w-4 h-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                                                                <Clock size={10} strokeWidth={3} />
                                                            </div>
                                                            {evento.Hora || '09:00'}
                                                        </div>
                                                        <div className="text-[12px] font-black leading-[1.3] mb-3 line-clamp-2 text-gray-900 dark:text-zinc-100 uppercase italic tracking-tight">
                                                            {evento.Conteúdo || 'NOVO CONTEÚDO'}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                                                <div className="w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 ring-2 ring-white dark:ring-zinc-900">
                                                                    <User size={10} strokeWidth={3} />
                                                                </div>
                                                                {client?.Nome || 'GERAL'}
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ChevronRight size={12} className="text-blue-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* SIDEBAR EDIT */}
            {sidebarView === 'edit' && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setSidebarView(null)}></div>
                    <div className="absolute inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-[#0C0C14] shadow-2xl pointer-events-auto flex flex-col transform animate-in slide-in-from-right duration-300">
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/30">
                            <h3 className="text-[16px] font-black uppercase tracking-tighter text-[#0B1527] dark:text-white italic">NOVO CONTEÚDO</h3>
                            <button onClick={() => setSidebarView(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-400 hover:text-rose-500 transition-all ios-btn">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
                            <textarea
                                className="w-full text-3xl font-black text-[#0B1527] dark:text-white bg-transparent border-none p-0 focus:ring-0 uppercase tracking-tighter leading-none min-h-[100px] animate-fade placeholder:opacity-20"
                                value={selectedEvent?.Conteúdo || ''}
                                onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Conteúdo', e.target.value)}
                                placeholder="NOVO CONTEÚDO"
                            />

                            <div className="bg-white dark:bg-[#14141C] border border-gray-100 dark:border-zinc-800/50 rounded-[2rem] p-8 space-y-8 shadow-sm">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">SELECIONE...</label>
                                        <select
                                            value={selectedEvent?.Cliente_ID || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Cliente_ID', e.target.value)}
                                            className="w-full bg-transparent border-b border-gray-100 dark:border-zinc-800 text-xs font-black text-gray-800 dark:text-zinc-200 pb-3 focus:outline-none focus:border-blue-500 transition-colors uppercase"
                                        >
                                            <option value="">-- CLIENTE --</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.Nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">IDEIA</label>
                                        <select
                                            value={selectedEvent?.["Tipo de conteúdo"] || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Tipo de conteúdo', e.target.value)}
                                            className="w-full bg-transparent border-b border-gray-100 dark:border-zinc-800 text-xs font-black text-gray-800 dark:text-zinc-200 pb-3 focus:outline-none focus:border-blue-500 transition-colors uppercase"
                                        >
                                            <option value="">-- FORMATO --</option>
                                            <option value="Reels Viral">Reels Viral</option>
                                            <option value="Carrossel Edu.">Carrossel Edu.</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">DATA</label>
                                        <input
                                            type="date"
                                            value={selectedEvent?.Data || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Data', e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-black text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">HORA</label>
                                        <input
                                            type="time"
                                            value={selectedEvent?.Hora || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Hora', e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-black text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <select
                                    value={selectedEvent?.Rede_Social || ''}
                                    onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Rede_Social', e.target.value)}
                                    className="w-full bg-white dark:bg-[#14141C] border border-gray-100 dark:border-zinc-800/50 text-xs font-black text-gray-800 dark:text-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 shadow-sm appearance-none cursor-pointer uppercase"
                                >
                                    <option value="">INSTAGRAM</option>
                                    <option value="LINKEDIN">LINKEDIN</option>
                                    <option value="YOUTUBE">YOUTUBE</option>
                                </select>

                                <select
                                    value={selectedEvent?.["Status do conteúdo"] || ''}
                                    onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Status do conteúdo', e.target.value)}
                                    className="w-full bg-white dark:bg-[#14141C] border border-gray-100 dark:border-zinc-800/50 text-xs font-black text-gray-800 dark:text-zinc-200 rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 shadow-sm appearance-none cursor-pointer uppercase"
                                >
                                    <option value="EM ESPERA">-- EM ESPERA --</option>
                                    <option value="PRODUÇÃO">PRODUÇÃO</option>
                                    <option value="AGUARDANDO APROVAÇÃO">AGUARDANDO APROVAÇÃO</option>
                                    <option value="PUBLICADO">PUBLICADO</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] ml-1">OBSERVAÇÕES TÁTICAS</label>
                                <textarea
                                    rows={5}
                                    value={selectedEvent?.Observações || ''}
                                    onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Observações', e.target.value)}
                                    className="w-full bg-white dark:bg-[#14141C] border border-gray-100 dark:border-zinc-800/50 rounded-[2rem] p-6 text-xs font-bold text-gray-700 dark:text-zinc-300 focus:outline-none focus:border-blue-500 shadow-inner resize-none"
                                    placeholder="..."
                                />
                            </div>
                        </div>

                        <div className="p-10 border-t border-gray-100 dark:border-zinc-800/50 bg-white dark:bg-[#0C0C14]">
                            <div className="flex gap-4 mb-6">
                                <button className="flex-1 h-14 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-zinc-400 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all ios-btn flex items-center justify-center gap-2">
                                    DUPLICAR
                                </button>
                                <button onClick={() => selectedEvent && performArchive([selectedEvent.id], 'PLANEJAMENTO', true)} className="flex-1 h-14 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-zinc-400 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all ios-btn flex items-center justify-center gap-2">
                                    ARQUIVAR
                                </button>
                                <button onClick={() => selectedEvent && performDelete([selectedEvent.id], 'PLANEJAMENTO')} className="flex-1 h-14 bg-white dark:bg-zinc-900 border border-rose-100 dark:border-rose-900/10 text-[10px] font-black uppercase tracking-widest text-rose-500 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all ios-btn flex items-center justify-center gap-2">
                                    EXCLUIR
                                </button>
                            </div>
                            <button onClick={() => setSidebarView(null)} className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/40 transition-all ios-btn flex items-center justify-center gap-3 active:scale-[0.98]">
                                <Check size={20} /> SALVAR CONTEÚDO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SIDEBAR BANCO */}
            {sidebarView === 'banco' && (
                <div className="fixed inset-0 z-[100] pointer-events-none">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setSidebarView(null)}></div>
                    <div className="absolute inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-[#0C0C14] shadow-2xl pointer-events-auto flex flex-col transform animate-in slide-in-from-right duration-300">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-zinc-800/50 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/30">
                            <h2 className="text-[11px] font-black text-[#0B1527] dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                                    <FolderOpen size={18} strokeWidth={2.5} />
                                </div>
                                BANCO DE CONTEÚDOS
                            </h2>
                            <button onClick={() => setSidebarView(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-400 hover:text-white transition-all ios-btn">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="BUSCAR IDEIAS APROVADAS..."
                                    className="w-full bg-white dark:bg-[#14141C] border border-gray-200 dark:border-zinc-800 text-xs font-black uppercase rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-600"
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-30">
                            <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-700 mb-6">
                                <FolderOpen size={32} />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 dark:text-zinc-600 uppercase tracking-[0.3em]">NENHUM ITEM ENCONTRADO</p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EXPORT */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl animate-fade pointer-events-auto" onClick={() => !isGenerating && setIsExportModalOpen(false)}></div>
                    <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-[#F8FAFC] dark:bg-zinc-900 border border-white/10 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">
                        <div className="px-10 py-6 bg-white dark:bg-[#111114] border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                                    <ImageIcon size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">PRÉ-VISUALIZAÇÃO DA EXPORTAÇÃO</h2>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">LAYOUT EXECUTIVO OTIMIZADO PARA APRESENTAÇÃO.</p>
                                </div>
                            </div>
                            <button onClick={() => setIsExportModalOpen(false)} className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all ios-btn">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="flex-1 p-10 overflow-y-auto bg-gray-100/50 dark:bg-black/20 custom-scrollbar flex justify-center">
                            <div id="export-canvas" className="w-[1200px] min-h-[800px] bg-white border border-gray-100 shadow-2xl shrink-0 rounded-[2.5rem] flex flex-col relative overflow-hidden transition-all scale-100 origin-top">
                                <div className="bg-[#0B1527] text-white px-12 py-10 flex justify-between items-end shrink-0">
                                    <div>
                                        <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">PLANEJAMENTO DE CONTEÚDO</h1>
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                            FEVEREIRO 2026 <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                            <span className="text-blue-400">{exportSelectedClient === 'Todos' ? 'VISÃO GLOBAL AGÊNCIA' : exportSelectedClient}</span>
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">GERADO POR EKKO</span>
                                        <div className="text-2xl font-black italic tracking-tighter">EKKO</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col p-10 bg-[#F8FAFC]">
                                    <div className="grid grid-cols-7 gap-4 mb-4 shrink-0">
                                        {WEEKDAYS_BR_SHORT.map(dia => (
                                            <div key={dia} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white rounded-xl py-3 shadow-sm border border-gray-100">
                                                {dia}
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`grid grid-cols-7 gap-4 flex-1 ${viewMode === 'week' ? 'grid-rows-1' : 'grid-rows-4'}`}>
                                        {calendarDays.slice(0, viewMode === 'week' ? 7 : 28).map((diaObj, idx) => {
                                            const evts = getEventosDoDia(diaObj.dateStr);
                                            return (
                                                <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-5 flex flex-col shadow-sm min-h-[160px]">
                                                    <div className="text-sm font-black text-right text-gray-200 mb-3">{diaObj.day}</div>
                                                    <div className="space-y-2">
                                                        {evts.map(evt => (
                                                            <div key={evt.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col relative overflow-hidden">
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                                                <div className="text-[9px] font-black text-blue-600 uppercase mb-1">{evt.Hora}</div>
                                                                <div className="text-[10px] font-black text-gray-800 uppercase leading-tight line-clamp-2">{evt.Conteúdo}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="py-8 px-10 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#111114] flex justify-between items-center shrink-0">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FORMATO DE SAÍDA: PNG • ALTA RESOLUÇÃO</span>
                            <div className="flex gap-4">
                                <button onClick={() => setIsExportModalOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase text-gray-500 hover:text-gray-900 transition-all ios-btn">CANCELAR</button>
                                <button
                                    onClick={async () => { setIsGenerating(true); playUISound('success'); setTimeout(() => setIsGenerating(false), 2000); }}
                                    className="px-12 py-4 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-blue-500/40 transition-all flex items-center gap-3 disabled:opacity-50"
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                    {isGenerating ? 'PROCESSANDO...' : 'BAIXAR PLANEJAMENTO'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
