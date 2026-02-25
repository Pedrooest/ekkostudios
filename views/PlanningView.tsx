import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Clock, User, Check, X,
    Filter, Image as ImageIcon, Archive, Database,
    ChevronLeft, ChevronRight, FolderOpen, Copy, Trash2,
    ChevronDown, Download, Loader2, Moon, Sun, Calendar as CalendarIcon
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
    const [isDarkMode, setIsDarkMode] = useState(false);
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

    const hexToRGBA = (hex: string, alpha: number) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const getCardStyles = (clientId: string) => {
        const client = clients.find(c => c.id === clientId);
        const hex = client?.['Cor (HEX)'] || '#3B82F6';
        return {
            bg: hexToRGBA(hex, 0.08),
            border: hexToRGBA(hex, 0.2),
            text: hex,
            hex
        };
    };

    const getClientColor = (clientId: string) => {
        return getCardStyles(clientId).hex;
    };

    const handleRealDownload = async () => {
        playUISound('tap');
        setIsGenerating(true);

        try {
            const element = document.getElementById('export-canvas');
            if (!element) throw new Error("Canvas não encontrado");

            if (!(window as any).html2canvas) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            await new Promise(r => setTimeout(r, 400));

            const canvas = await (window as any).html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false,
                width: element.scrollWidth,
                height: element.scrollHeight,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            });

            canvas.toBlob((blob: Blob | null) => {
                if (!blob) throw new Error("Erro ao gerar o arquivo de imagem.");

                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');

                const safeClientName = exportSelectedClient.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                link.download = `Planejamento_${safeClientName}_${MONTH_NAMES_BR[currentDate.getMonth()]}_${currentDate.getFullYear()}.png`;
                link.href = url;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                window.URL.revokeObjectURL(url);

                playUISound('success');
                setTimeout(() => setIsExportModalOpen(false), 500);
            }, 'image/png', 1.0);

        } catch (error) {
            console.error("Erro ao exportar a imagem:", error);
            alert("Ocorreu um erro ao gerar a imagem. Por favor, tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={`${isDarkMode ? 'dark' : ''} flex-1 flex flex-col font-sans w-full h-full transition-colors overflow-hidden`}>
            <div className="flex-1 flex flex-col w-full h-full bg-[#F8FAFC] dark:bg-[#0a0a0c] transition-colors overflow-y-auto custom-scrollbar">

                <div className="p-6 lg:p-10 space-y-8 w-full">

                    {/* TOP STATUS BAR (THEME) */}
                    <div className="flex items-center justify-end mb-2">
                        <button
                            onClick={() => { playUISound('tap'); setIsDarkMode(!isDarkMode); }}
                            className="p-2.5 bg-white dark:bg-[#111114] border border-gray-100 dark:border-zinc-800 rounded-full text-gray-400 hover:text-blue-500 transition-all shadow-sm ios-btn"
                            title="Alternar Tema Escuro"
                        >
                            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                    </div>

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
                                            <span className={`text-[11px] font-bold w-12 h-6 flex items-center justify-center rounded-lg ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-[#0B1527] dark:text-zinc-400 font-black'}`}>
                                                {diaObj.day}
                                            </span>
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            {evts.map(evt => {
                                                const color = getClientColor(evt.Cliente_ID);
                                                return (
                                                    <div
                                                        key={evt.id}
                                                        onClick={() => openEditSidebar(evt.id)}
                                                        className="group relative border p-3 rounded-2xl shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden transform hover:-translate-y-1 active:scale-95"
                                                        style={{
                                                            backgroundColor: getCardStyles(evt.Cliente_ID).bg,
                                                            borderColor: getCardStyles(evt.Cliente_ID).border
                                                        }}
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest italic" style={{ color: getCardStyles(evt.Cliente_ID).text }}>
                                                                <Clock size={10} strokeWidth={3} /> {evt.Hora || '09:00'}
                                                            </div>
                                                            <div className="text-[10px] font-black leading-tight text-[#0B1527] dark:text-white uppercase italic tracking-tighter line-clamp-2">
                                                                {evt.Conteúdo}
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-4 h-4 rounded-full flex items-center justify-center bg-white/50 dark:bg-black/20" style={{ color: getCardStyles(evt.Cliente_ID).text }}>
                                                                        <User size={10} strokeWidth={3} />
                                                                    </div>
                                                                    <span className="text-[8px] font-black uppercase tracking-widest truncate max-w-[80px]" style={{ color: getCardStyles(evt.Cliente_ID).text }}>
                                                                        {clients.find(c => c.id === evt.Cliente_ID)?.Nome || 'GERAL'}
                                                                    </span>
                                                                </div>
                                                                <ChevronRight size={12} className="opacity-30 group-hover:opacity-100 transition-opacity" style={{ color: getCardStyles(evt.Cliente_ID).text }} />
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
                            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/40">
                                <h3 className="text-[16px] font-black uppercase tracking-tighter text-[#0B1527] dark:text-white italic">DETALHES DO PLANEJAMENTO</h3>
                                <button onClick={() => setSidebarView(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-400 hover:text-rose-500 transition-all ios-btn shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
                                <textarea
                                    className="w-full text-3xl font-black text-[#0B1527] dark:text-white bg-transparent border-none p-0 focus:ring-0 uppercase tracking-tighter leading-none min-h-[100px] animate-fade placeholder:opacity-20 italic"
                                    value={selectedEvent?.Conteúdo || ''}
                                    onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Conteúdo', e.target.value)}
                                    placeholder="QUAL O CONTEÚDO?"
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

                {/* MODAL EXPORT (REFINED) */}
                {isExportModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-10">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade pointer-events-auto" onClick={() => !isGenerating && setIsExportModalOpen(false)}></div>
                        <div className="relative w-full max-w-[1300px] h-full max-h-[95vh] bg-white dark:bg-[#0C0C14] border border-white/5 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">

                            {/* MODAL HEADER */}
                            <div className="px-10 py-8 bg-white dark:bg-[#111114] border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                                        <CalendarIcon size={28} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[#0B1527] dark:text-white uppercase italic tracking-tighter leading-none">EXPORTAR PLANEJAMENTO</h2>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                                            FEVEREIRO 2026 <span className="w-1 h-1 bg-blue-500 rounded-full"></span> AGÊNCIA EKKO STUDIOS
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {/* FILTRO RÁPIDO NO MODAL */}
                                    <div className="flex bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 p-1.5 rounded-2xl mr-4">
                                        {['Todos', ...clients.slice(0, 3).map(c => c.Nome)].map((name) => (
                                            <button
                                                key={name}
                                                onClick={() => { playUISound('tap'); setExportSelectedClient(name); }}
                                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${exportSelectedClient === name ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm border border-gray-100 dark:border-white/5' : 'text-gray-400'}`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>

                                    <button onClick={() => setIsExportModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-400 hover:text-rose-500 transition-all ios-btn shadow-sm">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* PREVIEW AREA */}
                            <div className="flex-1 p-10 overflow-y-auto bg-[#F8FAFC] dark:bg-black/40 custom-scrollbar flex justify-center">
                                <div id="export-canvas" className="w-[1240px] min-h-[800px] bg-white text-gray-900 p-16 shadow-2xl shrink-0 rounded-[3rem] flex flex-col relative overflow-hidden transition-all scale-100 origin-top">

                                    {/* CABEÇALHO EXECUTIVO NO PNG */}
                                    <div className="flex justify-between items-end mb-16 border-b-2 border-gray-100 pb-12">
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-2 h-10 bg-blue-600 rounded-full"></div>
                                                <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none border-gray-100">PLANEJAMENTO</h1>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                                    CALENDÁRIO DE CONTEÚDO <span className="text-blue-600 mx-2">/</span> FEVEREIRO 2026
                                                </p>
                                                <div className="h-4 w-[1px] bg-gray-200"></div>
                                                <p className="text-[12px] font-black text-blue-600 uppercase tracking-[0.3em]">
                                                    CLIENTE: {exportSelectedClient === 'Todos' ? 'VISÃO GERAL' : exportSelectedClient}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-3xl font-black italic tracking-tighter text-[#0B1527]">EKKO<span className="text-blue-600">.</span></div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">STUDIOS INTELIGENTES</span>
                                        </div>
                                    </div>

                                    {/* GRID NO PNG */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="grid grid-cols-7 border border-gray-100 rounded-[2rem] overflow-hidden bg-gray-50/30">
                                            {/* Header Dias */}
                                            {WEEKDAYS_BR_SHORT.map(dia => (
                                                <div key={dia} className="py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-r border-gray-100 last:border-0 bg-white">
                                                    {dia}
                                                </div>
                                            ))}

                                            {/* Corpo do Calendário */}
                                            {calendarDays.slice(0, 28).map((diaObj, idx) => {
                                                const evts = getEventosDoDia(diaObj.dateStr).filter(e =>
                                                    exportSelectedClient === 'Todos' ||
                                                    clients.find(c => c.id === e.Cliente_ID)?.Nome === exportSelectedClient
                                                );

                                                return (
                                                    <div key={idx} className="bg-white border-r border-t border-gray-100 p-6 min-h-[220px] flex flex-col last:border-r-0">
                                                        <div className="text-sm font-black text-right text-gray-200 mb-4">{diaObj.day}</div>
                                                        <div className="space-y-3">
                                                            {evts.map(evt => {
                                                                const color = getClientColor(evt.Cliente_ID);
                                                                return (
                                                                    <div key={evt.id} className="p-4 rounded-[1.25rem] border shadow-sm flex flex-col relative overflow-hidden"
                                                                        style={{
                                                                            backgroundColor: getCardStyles(evt.Cliente_ID).bg,
                                                                            borderColor: getCardStyles(evt.Cliente_ID).border
                                                                        }}
                                                                    >
                                                                        <div className="space-y-1.5">
                                                                            <div className="text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: getCardStyles(evt.Cliente_ID).text }}>
                                                                                <Clock size={12} strokeWidth={3} /> {evt.Hora || '09:00'}
                                                                            </div>
                                                                            <div className="text-[12px] font-black text-[#0B1527] uppercase leading-snug line-clamp-2 tracking-tighter">{evt.Conteúdo}</div>
                                                                            <div className="text-[9px] font-black uppercase tracking-widest mt-1 bg-white/50 px-2.5 py-1 rounded-md w-fit flex items-center gap-2"
                                                                                style={{ color: getCardStyles(evt.Cliente_ID).text }}>
                                                                                <User size={11} strokeWidth={3} />
                                                                                {clients.find(c => c.id === evt.Cliente_ID)?.Nome}
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

                                    {/* LEGENDA NO PNG */}
                                    <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-10">
                                        <div className="flex flex-wrap gap-8">
                                            {exportSelectedClient === 'Todos' ? (
                                                clients.slice(0, 5).map(c => (
                                                    <div key={c.id} className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c['Cor (HEX)'] }}></div>
                                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{c.Nome}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full border border-blue-100/50">
                                                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">RELATÓRIO EXCLUSIVO: {exportSelectedClient}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">EKKO STUDIOS • 2026</div>
                                    </div>
                                </div>
                            </div>

                            {/* MODAL FOOTER */}
                            <div className="py-8 px-10 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-[#111114] flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <span className="w-2 h-2 rounded-full bg-green-500"></span> SISTEMA PRONTO
                                    </div>
                                    <div className="h-4 w-[1px] bg-gray-100 dark:bg-zinc-800"></div>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">FORMATO: PNG ALTA RESOLUÇÃO (2X)</span>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsExportModalOpen(false)}
                                        className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all ios-btn"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        onClick={handleRealDownload}
                                        className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-widest rounded-3xl shadow-2xl shadow-blue-500/40 transition-all flex items-center gap-3 disabled:opacity-50 hover:scale-105 active:scale-95"
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
                                        {isGenerating ? 'GERANDO ARQUIVO...' : 'BAIXAR PLANEJAMENTO'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
