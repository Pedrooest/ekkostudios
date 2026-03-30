import React, { useState, useMemo } from 'react';
import {
    Plus, Search, Clock, User, Check, X,
    Filter, Image as ImageIcon, Archive, Database,
    ChevronLeft, ChevronRight, FolderOpen, Copy, Trash2,
    ChevronDown, Download, Loader2, Moon, Sun,
    Calendar as CalendarIcon, LayoutGrid, Columns, List
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
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');

    // Filtros e Sidebars
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [exportSelectedClient, setExportSelectedClient] = useState('Todos');

    const [sidebarView, setSidebarView] = useState<'edit' | 'banco' | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [librarySearchTerm, setLibrarySearchTerm] = useState('');

    const rdcLibrary = useMemo(() => {
        return rdc.filter(item => {
            const matchClient = !activeClientId || item.Cliente_ID === activeClientId;
            const matchSearch = !librarySearchTerm || (item['Ideia de Conteúdo'] && item['Ideia de Conteúdo'].toLowerCase().includes(librarySearchTerm.toLowerCase()));
            return matchClient && matchSearch;
        });
    }, [rdc, activeClientId, librarySearchTerm]);

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
            <div className="flex-1 flex flex-col w-full h-full bg-white dark:bg-zinc-900 transition-colors overflow-y-auto custom-scrollbar">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shrink-0">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">Planejamento Estratégico</h1>
                            <div className="relative">
                                <button
                                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                                >
                                    <Filter size={10} /> {activeClientId ? (clients.find(c => c.id === activeClientId)?.Nome || 'Cliente') : 'Todos Clientes'} <ChevronDown size={10} />
                                </button>
                                {isClientDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 z-50">
                                        <button
                                            onClick={() => { playUISound('tap'); setIsClientFilterOpen?.(false); setIsClientDropdownOpen(false); }}
                                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                                        >
                                            Todos Clientes
                                        </button>
                                        {clients.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { playUISound('tap'); onUpdate('', 'PLANEJAMENTO', 'FILTER_CLIENT', c.id); setIsClientDropdownOpen(false); }}
                                                className="w-full text-left px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                                            >
                                                {c.Nome}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-0.5">Calendário tático e cronograma de posts.</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => { playUISound('tap'); setShowArchived?.(!showArchived); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${showArchived ? 'bg-zinc-100 dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100' : 'bg-transparent border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                        >
                            <Archive size={14} className="inline mr-1.5" /> {showArchived ? 'Ocultar Arquivados' : 'Arquivados'}
                        </button>
                        <button
                            onClick={() => { playUISound('open'); setIsExportModalOpen(true); }}
                            className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-lg text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all shadow-sm flex items-center gap-1.5"
                        >
                            <Download size={14} /> Exportar
                        </button>
                        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
                        <button onClick={handleAddContent} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5">
                            <Plus size={14} strokeWidth={2.5} /> Novo Post
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex flex-wrap items-center gap-1">
                        {['ALL', 'EM ESPERA', 'AGUARDANDO APROVAÇÃO', 'PRODUÇÃO', 'PUBLICADO', 'CONCLUÍDO'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { playUISound('tap'); setActiveStatus(tab); }}
                                className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all whitespace-nowrap ${activeStatus === tab
                                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-600'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { playUISound('open'); setSidebarView('banco'); }} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95">
                            <Database size={14} /> Banco de Itens
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">

                    <div className="flex items-center justify-between mb-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-2 px-4 rounded-xl shadow-sm">
                        <div className="flex items-center gap-4">
                            <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 transition-colors" onClick={() => handleMonthNav(-1)}>
                                <ChevronLeft size={18} />
                            </button>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 min-w-[120px] text-center uppercase tracking-tight">
                                {viewMode === 'month' ? `${MONTH_NAMES_BR[currentDate.getMonth()]} ${currentDate.getFullYear()}` : 'Semana'}
                            </h3>
                            <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-50 text-zinc-500 transition-colors" onClick={() => handleMonthNav(1)}>
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg items-center relative gap-1">
                            <button
                                onClick={() => { playUISound('tap'); setViewMode('month'); }}
                                className={`w-9 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === 'month' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                                title="Mês"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => { playUISound('tap'); setViewMode('week'); }}
                                className={`w-9 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === 'week' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                                title="Semana"
                            >
                                <Columns size={16} />
                            </button>
                            <button
                                onClick={() => { playUISound('tap'); setViewMode('list'); }}
                                className={`w-9 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-blue-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                                title="Lista"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

                    {/* CALENDAR GRID */}
                    <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm overflow-hidden flex flex-col">
                        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
                            {WEEKDAYS_BR_SHORT.map(dia => (
                                <div key={dia} className="py-3 text-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-r border-zinc-200 dark:border-zinc-700 last:border-0">
                                    {dia}
                                </div>
                            ))}
                        </div>

                        <div className={`grid grid-cols-7 ${viewMode === 'month' ? 'auto-rows-[minmax(140px,auto)]' : 'auto-rows-[minmax(500px,auto)]'}`}>
                            {calendarDays.map((diaObj, idx) => {
                                const evts = getEventosDoDia(diaObj.dateStr);
                                const isToday = diaObj.dateStr === new Date().toISOString().split('T')[0];

                                return (
                                    <div
                                        key={idx}
                                        className={`p-2 border-r border-b border-zinc-100 dark:border-zinc-700 transition-all relative flex flex-col min-h-0 ${diaObj.isNextMonth || diaObj.isPrevMonth ? 'bg-zinc-50/50 dark:bg-zinc-900/30 opacity-40' :
                                            isToday ? 'bg-blue-50/50 dark:bg-blue-500/5' : 'bg-white dark:bg-zinc-800'
                                            } hover:bg-zinc-50/80 dark:hover:bg-zinc-700/50`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <span className={`text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-md ${isToday ? 'bg-blue-600 text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                {diaObj.day}
                                            </span>
                                        </div>

                                        <div className="flex-1 space-y-1.5 overflow-hidden">
                                            {evts.map(evt => {
                                                const styles = getCardStyles(evt.Cliente_ID);
                                                return (
                                                    <div
                                                        key={evt.id}
                                                        onClick={() => openEditSidebar(evt.id)}
                                                        className="group relative border px-2 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer overflow-hidden border-opacity-50 hover:shadow-md"
                                                        style={{
                                                            backgroundColor: styles.bg,
                                                            borderColor: styles.border
                                                        }}
                                                    >
                                                        <div className="space-y-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider" style={{ color: styles.text }}>
                                                                <Clock size={8} /> {evt.Hora || '09:00'}
                                                            </div>
                                                            <div className="text-[10px] font-bold leading-tight text-zinc-900 dark:text-white truncate">
                                                                {evt.Conteúdo}
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
                        <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm pointer-events-auto" onClick={() => setSidebarView(null)}></div>
                        <div className="absolute inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-[#0C0C14] shadow-2xl pointer-events-auto flex flex-col transform animate-in slide-in-from-right duration-300">
                            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/40">
                                <h3 className="text-[16px] font-black uppercase tracking-tighter text-[#0B1527] dark:text-white italic">DETALHES DO PLANEJAMENTO</h3>
                                <button onClick={() => setSidebarView(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 text-gray-400 hover:text-rose-500 transition-all ios-btn shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                {/* SIDEBAR EDIT */}
                {sidebarView === 'edit' && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm" onClick={() => setSidebarView(null)}></div>
                        <div className="relative w-full sm:w-[450px] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Detalhes do Post</h2>
                                <button onClick={() => setSidebarView(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Conteúdo principal</label>
                                    <textarea
                                        rows={4}
                                        value={selectedEvent?.Conteúdo || ''}
                                        onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Conteúdo', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                        placeholder="O que será postado?"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Cliente</label>
                                        <select
                                            value={selectedEvent?.Cliente_ID || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Cliente_ID', e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 appearance-none"
                                        >
                                            <option value="">Selecionar Cliente</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.Nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Formato</label>
                                        <select
                                            value={selectedEvent?.["Tipo de conteúdo"] || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Tipo de conteúdo', e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 appearance-none"
                                        >
                                            <option value="">Selecionar Formato</option>
                                            <option value="Reels Viral">Reels Viral</option>
                                            <option value="Carrossel Edu.">Carrossel Edu.</option>
                                            <option value="Estático">Estático</option>
                                            <option value="Stories">Stories</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Data</label>
                                        <input
                                            type="date"
                                            value={selectedEvent?.Data || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Data', e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Hora</label>
                                        <input
                                            type="time"
                                            value={selectedEvent?.Hora || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Hora', e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Rede Social</label>
                                        <select
                                            value={selectedEvent?.Rede_Social || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Rede_Social', e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 appearance-none"
                                        >
                                            <option value="">INSTAGRAM</option>
                                            <option value="LINKEDIN">LINKEDIN</option>
                                            <option value="YOUTUBE">YOUTUBE</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Status</label>
                                        <select
                                            value={selectedEvent?.["Status do conteúdo"] || ''}
                                            onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Status do conteúdo', e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 appearance-none"
                                        >
                                            <option value="EM ESPERA">EM ESPERA</option>
                                            <option value="PRODUÇÃO">PRODUÇÃO</option>
                                            <option value="AGUARDANDO APROVAÇÃO">APROVAÇÃO</option>
                                            <option value="PUBLICADO">PUBLICADO</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-blue-500 uppercase tracking-wider ml-1">Observações</label>
                                    <textarea
                                        rows={4}
                                        value={selectedEvent?.Observações || ''}
                                        onChange={e => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Observações', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
                                        placeholder="Notas adicionais..."
                                    />
                                </div>
                            </div>

                            <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4">
                                <div className="grid grid-cols-3 gap-2">
                                    <button className="flex flex-col items-center justify-center p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
                                        <Copy size={16} className="mb-1" /> Duplicar
                                    </button>
                                    <button onClick={() => selectedEvent && performArchive([selectedEvent.id], 'PLANEJAMENTO', true)} className="flex flex-col items-center justify-center p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all">
                                        <Archive size={16} className="mb-1" /> Arquivar
                                    </button>
                                    <button onClick={() => selectedEvent && performDelete([selectedEvent.id], 'PLANEJAMENTO')} className="flex flex-col items-center justify-center p-2 rounded-lg border border-rose-100 dark:border-rose-900/20 bg-rose-50/30 dark:bg-rose-900/10 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all">
                                        <Trash2 size={16} className="mb-1" /> Excluir
                                    </button>
                                </div>
                                <button onClick={() => setSidebarView(null)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]">
                                    Salvar Alterações
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                        </div>
                    </div>
                )}

                {/* SIDEBAR BANCO */}
                {sidebarView === 'banco' && (
                    <div className="fixed inset-0 z-[100] flex justify-end">
                        <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm" onClick={() => setSidebarView(null)}></div>
                        <div className="relative w-full sm:w-[500px] bg-white dark:bg-zinc-900 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
                                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                                        <FolderOpen size={16} />
                                    </div>
                                    Banco de Conteúdos
                                </h2>
                                <button onClick={() => setSidebarView(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2 group bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2.5 focus-within:border-blue-500 transition-all">
                                    <Search className="text-zinc-400 shrink-0" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar ideias..."
                                        value={librarySearchTerm}
                                        onChange={(e) => setLibrarySearchTerm(e.target.value)}
                                        className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {rdcLibrary.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center">
                                        <FolderOpen size={32} className="mb-2 text-zinc-300" />
                                        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Nenhuma ideia encontrada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {rdcLibrary.map(item => (
                                            <div
                                                key={item.id}
                                                onClick={async () => {
                                                    playUISound('tap');
                                                    const today = new Date().toISOString().split('T')[0];
                                                    const newId = await onAdd('PLANEJAMENTO', {
                                                        Data: today,
                                                        Hora: '09:00',
                                                        "Status do conteúdo": 'EM ESPERA',
                                                        Conteúdo: item['Ideia de Conteúdo'],
                                                        "Tipo de conteúdo": item['Tipo de conteúdo'] || 'Post',
                                                        Cliente_ID: item.Cliente_ID || activeClientId || 'GERAL',
                                                        Origem_ID: item.id,
                                                        Fonte_Origem: 'RDC'
                                                    });
                                                    if (newId) {
                                                        setSelectedEventId(newId);
                                                        setSidebarView('edit');
                                                    }
                                                }}
                                                className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 hover:ring-1 hover:ring-blue-500/10 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clients.find(c => c.id === item.Cliente_ID)?.['Cor (HEX)'] || '#3B82F6' }}></div>
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">
                                                            {clients.find(c => c.id === item.Cliente_ID)?.Nome || 'Geral'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] font-medium text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded-full">
                                                        {item['Tipo de conteúdo'] || 'Post'}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-relaxed">
                                                    {item['Ideia de Conteúdo']}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL EXPORT */}
                {isExportModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm shadow-sm" onClick={() => !isGenerating && setIsExportModalOpen(false)}></div>
                        <div className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                                        <CalendarIcon size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Exportar Planejamento</h2>
                                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Formato PNG • Agência Ekko Studios</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <select
                                        value={exportSelectedClient}
                                        onChange={(e) => setExportSelectedClient(e.target.value)}
                                        className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 focus:outline-none"
                                    >
                                        <option value="Todos">Todos os Clientes</option>
                                        {clients.map(c => <option key={c.id} value={c.Nome}>{c.Nome}</option>)}
                                    </select>
                                    <button onClick={() => setIsExportModalOpen(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* PREVIEW AREA */}
                            <div className="flex-1 p-10 overflow-y-auto bg-[#F8FAFC] dark:bg-zinc-900/60 custom-scrollbar flex justify-center">
                                <div id="export-canvas" className="w-[1240px] min-h-[800px] bg-white text-gray-900 p-16 shadow-2xl shrink-0 rounded-[3rem] flex flex-col relative overflow-hidden transition-all scale-100 origin-top">

                                    {/* CABEÇALHO EXECUTIVO NO PNG */}
                                    <div className="flex justify-between items-end mb-12 border-b border-zinc-100 pb-10">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                                                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 uppercase">Planejamento</h1>
                                            </div>
                                            <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                                                <span>Calendário de Conteúdo</span>
                                                <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                                                <span className="text-blue-600">Fevereiro 2026</span>
                                                <span className="w-1 h-1 bg-zinc-200 rounded-full"></span>
                                                <span className="text-zinc-900 italic">Cliente: {exportSelectedClient === 'Todos' ? 'Visão Geral' : exportSelectedClient}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="text-2xl font-bold tracking-tighter text-zinc-900">EKKO<span className="text-blue-600">.</span></div>
                                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-2 py-1 rounded-md border border-zinc-100">Studios Inteligentes</span>
                                        </div>
                                    </div>

                                    {/* GRID NO PNG */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="grid grid-cols-7 border border-zinc-100 rounded-2xl overflow-hidden bg-zinc-50/20">
                                            {/* Header Dias */}
                                            {WEEKDAYS_BR_SHORT.map(dia => (
                                                <div key={dia} className="py-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-r border-zinc-100 last:border-0 bg-white">
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
                                                    <div key={idx} className="bg-white border-r border-t border-zinc-100 p-4 min-h-[180px] flex flex-col last:border-r-0">
                                                        <div className="text-xs font-bold text-zinc-200 text-right mb-3">{diaObj.day}</div>
                                                        <div className="space-y-2">
                                                            {evts.map(evt => {
                                                                const cardStyle = getCardStyles(evt.Cliente_ID);
                                                                return (
                                                                    <div key={evt.id} className="p-3 rounded-xl border shadow-sm flex flex-col relative overflow-hidden"
                                                                        style={{
                                                                            backgroundColor: cardStyle.bg,
                                                                            borderColor: cardStyle.border
                                                                        }}
                                                                    >
                                                                        <div className="space-y-1">
                                                                            <div className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: cardStyle.text }}>
                                                                                <Clock size={10} /> {evt.Hora || '09:00'}
                                                                            </div>
                                                                            <div className="text-[10px] font-bold text-zinc-900 leading-snug line-clamp-2">{evt.Conteúdo}</div>
                                                                            <div className="text-[8px] font-bold uppercase tracking-wider mt-1 bg-white/60 px-2 py-0.5 rounded w-fit text-zinc-500">
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
                                    <div className="mt-8 flex items-center justify-between border-t border-zinc-100 pt-8">
                                        <div className="flex flex-wrap gap-6">
                                            {exportSelectedClient === 'Todos' ? (
                                                clients.slice(0, 5).map(c => (
                                                    <div key={c.id} className="flex items-center gap-2">
                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c['Cor (HEX)'] }}></div>
                                                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{c.Nome}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                                                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">Relatório: {exportSelectedClient}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-[9px] font-bold text-zinc-300 uppercase tracking-[0.2em]">Ekko Studios • 2026</div>
                                    </div>
                                </div>
                            </div>

                            {/* MODAL FOOTER */}
                            <div className="py-6 px-8 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pronto para exportar
                                    </div>
                                    <div className="h-4 w-[1px] bg-zinc-100 dark:bg-zinc-800"></div>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">PNG 2X • {exportSelectedClient}</span>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsExportModalOpen(false)}
                                        className="px-6 py-2.5 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all uppercase tracking-wider"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleRealDownload}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                        {isGenerating ? 'Gerando...' : 'Baixar PNG'}
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
