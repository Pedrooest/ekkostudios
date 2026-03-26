import React, { useState, useEffect, useMemo } from 'react';
import {
    Download, Plus, Search, Clock, User, Check, X,
    Filter, Image as ImageIcon, Archive, Database,
    ChevronLeft, ChevronRight, FolderOpen, Copy, Trash2,
    ChevronDown, Moon, Sun, Loader2, LayoutGrid, Columns, List
} from 'lucide-react';
import { playUISound } from '../utils/uiSounds';
import { getCalendarDays, MONTH_NAMES_BR, WEEKDAYS_BR_SHORT } from '../utils/calendarUtils';
import { 
    Instagram, 
    Youtube, 
    Video, 
    Linkedin, 
    MessageSquare, 
    MoreHorizontal,
    Calendar as CalendarIcon,
    AlertCircle,
    CheckCircle2,
    PlayCircle
} from 'lucide-react';

// ==========================================
// FUNÇÕES AUXILIARES DE SOM
// ==========================================
// We now import playUISound directly, but keeping a wrapper for consistency if needed.
const tryPlaySound = (type: any) => {
    if (typeof playUISound === 'function') {
        playUISound(type);
    } else if (typeof window !== 'undefined' && (window as any).playUISound) {
        (window as any).playUISound(type);
    }
};

interface PlanejamentoTabProps {
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

export default function PlanejamentoTab({
    data = [], clients = [], onUpdate, onAdd, rdc = [], matriz, cobo,
    tasks, iaHistory, setActiveTab, performArchive, performDelete, library,
    activeClientId, showArchived, setShowArchived, setIsClientFilterOpen
}: PlanejamentoTabProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeTab, setActiveTabLocal] = useState('ALL');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'kanban'>('calendar');
    const [calendarSubMode, setCalendarSubMode] = useState<'month' | 'week'>('month');

    const [globalClientFilter, setGlobalClientFilter] = useState('Todos Clientes');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [exportSelectedClient, setExportSelectedClient] = useState('Todos');

    const [sidebarView, setSidebarView] = useState<'edit' | 'banco' | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const [librarySearchTerm, setLibrarySearchTerm] = useState('');

    // ----------------------------------------------------------------------
    // MEMOIZED DATA
    // ----------------------------------------------------------------------
    const selectedEvent = useMemo(() => data.find((e: any) => e.id === selectedEventId), [data, selectedEventId]);

    const clientList = useMemo(() => {
        // Return active clients and their IDs
        return clients.filter(c => !c.Arquivado);
    }, [clients]);

    const filteredData = useMemo(() => {
        return data.filter((e: any) => {
            const matchStatus = activeTab === 'ALL' || e['Status do conteúdo'] === activeTab;
            const matchClient = (globalClientFilter === 'Todos Clientes' && (!activeClientId || e.Cliente_ID === activeClientId)) ||
                // If global filter is set to a specific client name, try to match it.
                (globalClientFilter !== 'Todos Clientes' && clients.find(c => c.Nome === globalClientFilter)?.id === e.Cliente_ID);
            return matchStatus && matchClient && (!e.Arquivado || showArchived);
        });
    }, [data, activeTab, activeClientId, globalClientFilter, showArchived, clients]);

    const rdcLibrary = useMemo(() => {
        return rdc.filter(item => {
            const targetClientId = globalClientFilter !== 'Todos Clientes'
                ? clients.find(c => c.Nome === globalClientFilter)?.id
                : activeClientId;

            const matchClient = !targetClientId || item.Cliente_ID === targetClientId;
            const matchSearch = !librarySearchTerm || (item['Ideia de Conteúdo'] && item['Ideia de Conteúdo'].toLowerCase().includes(librarySearchTerm.toLowerCase()));
            return matchClient && matchSearch && !item.Arquivado;
        });
    }, [rdc, activeClientId, librarySearchTerm, globalClientFilter, clients]);

    // ----------------------------------------------------------------------
    // CALENDAR CALCS
    // ----------------------------------------------------------------------
    const calendarDays = useMemo(() => {
        const days = getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
        if (calendarSubMode === 'month') return days;

        const todayStr = currentDate.toISOString().split('T')[0];
        const dayIdx = days.findIndex(d => d.dateStr === todayStr);
        // fallback if today is not in the current month view but we are in week view
        let startIdx = 0;
        if (dayIdx !== -1) {
            startIdx = Math.max(0, Math.floor(dayIdx / 7) * 7);
        } else {
            // If viewing a month without "today", just show its first week
            startIdx = 0;
        }
        return days.slice(startIdx, startIdx + 7);
    }, [currentDate, calendarSubMode]);

    const getEventosDoDia = (dateStr: string) => {
        return filteredData.filter((evt: any) => evt.Data === dateStr);
    };

    const currentMonthName = `${MONTH_NAMES_BR[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    const handleMonthNav = (dir: number) => {
        tryPlaySound('tap');
        const next = new Date(currentDate);
        if (calendarSubMode === 'month') {
            next.setMonth(next.getMonth() + dir);
        } else {
            next.setDate(next.getDate() + (7 * dir));
        }
        setCurrentDate(next);
    };


    // ----------------------------------------------------------------------
    // STYLES
    // ----------------------------------------------------------------------
    const hexToRGBA = (hex: string, alpha: number) => {
        if (!hex || !hex.startsWith('#')) return `rgba(59, 130, 246, ${alpha})`; // fallback azul
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

    const REDE_SOCIAL_COLORS: Record<string, { bg: string, text: string, icon: any }> = {
        'INSTAGRAM': { bg: 'bg-pink-50 dark:bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', icon: Instagram },
        'YOUTUBE': { bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400', icon: Youtube },
        'TIKTOK': { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-900 dark:text-zinc-100', icon: Video },
        'LINKEDIN': { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', icon: Linkedin },
        'FACEBOOK': { bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600 dark:text-indigo-400', icon: MessageSquare },
        'TWITTER': { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', icon: MoreHorizontal },
        'X/TWITTER': { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-600 dark:text-sky-400', icon: MoreHorizontal },
        'PINTEREST': { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', icon: MoreHorizontal },
    };

    const getRedeStyle = (rede: string) => {
        return REDE_SOCIAL_COLORS[rede?.toUpperCase()] || { bg: 'bg-gray-50 dark:bg-zinc-800', text: 'text-gray-600 dark:text-zinc-400', icon: MessageSquare };
    };

    // ----------------------------------------------------------------------
    // HANDLERS
    // ----------------------------------------------------------------------
    const handleOpenExport = () => {
        tryPlaySound('open');
        setExportSelectedClient(globalClientFilter === 'Todos Clientes' ? 'Todos' : globalClientFilter);
        setIsExportModalOpen(true);
    };

    const handleRealDownload = async () => {
        tryPlaySound('tap');
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

                tryPlaySound('success');
                setTimeout(() => setIsExportModalOpen(false), 500);
            }, 'image/png', 1.0);

        } catch (error) {
            console.error("Erro ao exportar a imagem:", error);
            alert("Ocorreu um erro ao gerar a imagem. Por favor, tente novamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    const openEditSidebar = (id: string | null = null) => {
        tryPlaySound('open');
        setSelectedEventId(id);
        setSidebarView('edit');
    };

    const openBancoSidebar = () => {
        tryPlaySound('open');
        setSidebarView('banco');
    };

    const closeSidebar = () => {
        tryPlaySound('close');
        setSidebarView(null);
        setSelectedEventId(null);
    };

    const handleAddContent = async () => {
        tryPlaySound('success');
        const today = new Date().toISOString().split('T')[0];
        const targetClientId = globalClientFilter !== 'Todos Clientes'
            ? clients.find(c => c.Nome === globalClientFilter)?.id
            : (activeClientId || 'GERAL');

        const newId = await onAdd('PLANEJAMENTO', {
            Data: today,
            Hora: '09:00',
            "Status do conteúdo": 'EM ESPERA',
            Conteúdo: 'NOVO CONTEÚDO',
            Cliente_ID: targetClientId
        });
        if (newId) {
            setSelectedEventId(newId);
            setSidebarView('edit');
        }
    };

    const handleDuplicateEvent = async () => {
        if (!selectedEvent) return;
        tryPlaySound('success');
        const { id, created_at, ...rest } = selectedEvent;
        const newId = await onAdd('PLANEJAMENTO', {
            ...rest,
            Conteúdo: `${rest.Conteúdo} (Cópia)`
        });
        if (newId) {
            setSelectedEventId(newId);
        }
    };

    const handleDeleteEvent = () => {
        if (!selectedEventId) return;
        tryPlaySound('close');
        performDelete([selectedEventId], 'PLANEJAMENTO');
        closeSidebar();
    };

    // Helper render for client header
    const renderClientHeader = () => {
        if (globalClientFilter !== 'Todos Clientes') return globalClientFilter;
        if (activeClientId) {
            const found = clients.find(c => c.id === activeClientId);
            if (found) return found.Nome;
        }
        return 'Todos Clientes';
    };

    return (
        <div className={`${isDarkMode ? 'dark' : ''} h-screen overflow-hidden flex flex-col`}>
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 font-sans w-full bg-[#F8FAFC] dark:bg-[#0a0a0c] transition-colors relative">

                {/* TOP ACTION BAR */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest relative z-10 w-full sm:w-auto">
                        <div className="relative">
                            <button
                                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                className="flex items-center gap-2 hover:text-gray-800 dark:hover:text-white transition-colors ios-btn border border-gray-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900"
                            >
                                <Filter size={16} /> {renderClientHeader()} <ChevronDown size={14} />
                            </button>
                            {isClientDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50 max-h-60 overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => { tryPlaySound('tap'); setGlobalClientFilter('Todos Clientes'); setIsClientDropdownOpen(false); }}
                                        className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                    >
                                        Todos Clientes
                                    </button>
                                    {clientList.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => { tryPlaySound('tap'); setGlobalClientFilter(c.Nome); setIsClientDropdownOpen(false); }}
                                            className="w-full justify-between flex items-center px-4 py-2 text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            <span>{c.Nome}</span>
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c['Cor (HEX)'] || '#3B82F6' }}></div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            className={`flex items-center gap-2 transition-colors ios-btn ${showArchived ? 'text-blue-600' : 'hover:text-gray-800 dark:hover:text-white'}`}
                            onClick={() => { tryPlaySound('tap'); setShowArchived?.(!showArchived); }}
                        >
                            <Archive size={16} /> {showArchived ? 'OCULTAR ARQ.' : 'ARQUIVADOS'}
                        </button>
                        <button
                            onClick={handleOpenExport}
                            className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-[#111114] border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-white rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all ios-btn"
                        >
                            <Download size={14} /> EXPORTAR
                        </button>
                    </div>

                    <button
                        onClick={() => { tryPlaySound('tap'); setIsDarkMode(!isDarkMode); }}
                        className="p-2 bg-gray-200 dark:bg-zinc-800 rounded-full text-gray-700 dark:text-zinc-300 ios-btn shrink-0"
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                {/* HEADER & TABS */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-8 gap-6 max-w-[1400px]">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-2.5 h-8 bg-blue-600 rounded-full"></div>
                            <h1 className="text-[32px] font-black text-[#0B1527] dark:text-white tracking-tight leading-none uppercase">
                                PLANEJAMENTO ESTRATÉGICO
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:gap-6">
                            {['ALL', 'EM ESPERA', 'AGUARDANDO APROVAÇÃO', 'PRODUÇÃO', 'PUBLICADO', 'CONCLUÍDO'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { tryPlaySound('tap'); setActiveTabLocal(tab); }}
                                    className={`text-[11px] font-black uppercase tracking-widest transition-all ios-btn ${activeTab === tab
                                            ? 'bg-blue-600 text-white px-5 py-2 rounded-full shadow-md'
                                            : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-white px-2 py-2'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button onClick={openBancoSidebar} className="flex items-center gap-2 px-6 py-3 bg-[#9CA3AF] dark:bg-zinc-700 hover:bg-gray-500 dark:hover:bg-zinc-600 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all ios-btn">
                            <Database size={16} /> BANCO DE CONTEÚDO
                        </button>
                        <button onClick={() => handleAddContent()} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(59,130,246,0.4)] transition-all ios-btn">
                            <Plus size={16} strokeWidth={3} /> NOVO CONTEÚDO
                        </button>
                    </div>
                </div>

                {/* VIEW SELECTOR & CALENDAR CONTROLS */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-3 px-5 rounded-3xl shadow-sm max-w-[1400px]">
                    <div className="flex bg-[#F8FAFC] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-1 rounded-2xl items-center relative shadow-inner">
                        <button
                            onClick={() => { tryPlaySound('tap'); setViewMode('calendar'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                        >
                            <CalendarIcon size={14} strokeWidth={2.5} /> Calendário
                        </button>
                        <button
                            onClick={() => { tryPlaySound('tap'); setViewMode('list'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                        >
                            <List size={14} strokeWidth={2.5} /> Lista
                        </button>
                        <button
                            onClick={() => { tryPlaySound('tap'); setViewMode('kanban'); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'}`}
                        >
                            <LayoutGrid size={14} strokeWidth={2.5} /> Kanban
                        </button>
                    </div>

                    {viewMode === 'calendar' && (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 border-r border-gray-200 dark:border-zinc-800 pr-4 mr-2">
                                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors ios-btn" onClick={() => handleMonthNav(-1)}>
                                    <ChevronLeft size={18} />
                                </button>
                                <h3 className="text-sm font-black text-[#0B1527] dark:text-white min-w-[120px] text-center uppercase tracking-tight">
                                    {calendarSubMode === 'month' ? currentMonthName : 'Semana'}
                                </h3>
                                <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors ios-btn" onClick={() => handleMonthNav(1)}>
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            
                            <div className="flex bg-gray-100 dark:bg-zinc-900 rounded-xl p-1">
                                <button
                                    onClick={() => setCalendarSubMode('month')}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${calendarSubMode === 'month' ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                                >
                                    Mês
                                </button>
                                <button
                                    onClick={() => setCalendarSubMode('week')}
                                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${calendarSubMode === 'week' ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-400'}`}
                                >
                                    Semana
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* CALENDAR GRID */}
                {viewMode === 'calendar' && (
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col max-w-[1400px]">
                        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
                            {WEEKDAYS_BR_SHORT.map(dia => (
                                <div key={dia} className="py-5 text-center text-[10px] sm:text-[11px] font-black text-[#0B1527] dark:text-zinc-400 uppercase tracking-widest sm:tracking-[0.2em] border-r border-gray-200 dark:border-zinc-800 last:border-0 truncate">
                                    <span className="hidden sm:inline">{dia}</span>
                                    <span className="sm:hidden">{dia.substring(0, 3)}</span>
                                </div>
                            ))}
                        </div>

                        <div className={`grid grid-cols-7 bg-[#F8FAFC] dark:bg-[#0a0a0c] ${calendarSubMode === 'month' ? 'auto-rows-[minmax(140px,auto)]' : 'auto-rows-[minmax(350px,auto)]'}`}>
                            {calendarDays.map((diaObj, idx) => {
                                const evts = getEventosDoDia(diaObj.dateStr);
                                const isToday = diaObj.dateStr === new Date().toISOString().split('T')[0];

                                return (
                                    <div
                                        key={idx}
                                        className={`p-1 sm:p-2 border-r border-b border-gray-200 dark:border-zinc-800 transition-colors relative flex flex-col ${diaObj.isNextMonth || diaObj.isPrevMonth ? 'bg-gray-50/50 dark:bg-zinc-900/30 opacity-40' :
                                                isToday ? 'bg-blue-600/5 dark:bg-indigo-900/10' : 'bg-white dark:bg-[#111114] hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                                            }`}
                                    >
                                        <div className="text-xs font-bold mb-2 flex justify-start mt-1">
                                            <span className={`w-6 h-6 sm:w-8 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs rounded-md ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 font-black' : 'text-[#0B1527] dark:text-zinc-400 font-bold'}`}>
                                                {diaObj.day}
                                            </span>
                                        </div>

                                        <div className="space-y-1 flex-1">
                                            {evts.map(evento => {
                                                const redeStyle = getRedeStyle(evento.Rede_Social);
                                                const Icon = redeStyle.icon;
                                                return (
                                                    <div
                                                        key={evento.id}
                                                        onClick={() => openEditSidebar(evento.id)}
                                                        className={`p-1.5 rounded-lg border-0 ${redeStyle.bg} ${redeStyle.text} text-left cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98] ios-btn overflow-hidden flex items-center gap-1.5 shadow-sm`}
                                                    >
                                                        <Icon size={12} strokeWidth={3} className="shrink-0" />
                                                        <div className="text-[9px] font-black leading-tight truncate flex-1 min-w-0">
                                                            {evento.Hora && <span className="mr-1 opacity-70 shrink-0">{evento.Hora}</span>}
                                                            <span className="truncate">{evento.Conteúdo}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* LIST VIEW */}
                {viewMode === 'list' && (
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden max-w-[1400px]">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/30">
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Data / Hora</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Conteúdo</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Rede</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Formato</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/50 text-gray-600 dark:text-zinc-400">
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-xs font-bold text-gray-400 uppercase tracking-widest opacity-50">
                                                Nenhum conteúdo encontrado para os filtros atuais.
                                            </td>
                                        </tr>
                                    ) : (
                                        [...filteredData].sort((a,b) => new Date(a.Data).getTime() - new Date(b.Data).getTime()).map(post => {
                                            const rede = getRedeStyle(post.Rede_Social);
                                            const RedeIcon = rede.icon;
                                            const client = clients.find(c => c.id === post.Cliente_ID);
                                            
                                            // Status styles mapping
                                            const statusMap: Record<string, string> = {
                                                'PUBLICADO': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
                                                'CONCLUÍDO': 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
                                                'AGUARDANDO APROVAÇÃO': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
                                                'PRODUÇÃO': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
                                                'EM ESPERA': 'bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-zinc-500'
                                            };
                                            const statusStyle = statusMap[post["Status do conteúdo"]] || statusMap['EM ESPERA'];

                                            return (
                                                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 transition-colors group cursor-pointer" onClick={() => openEditSidebar(post.id)}>
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                                {post.Data ? new Date(post.Data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '--'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 mt-0.5">
                                                                <Clock size={10} /> {post.Hora || '09:00'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: client?.['Cor (HEX)'] || '#3B82F6' }}></div>
                                                            <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 uppercase truncate min-w-0">
                                                                {client?.Nome || 'Geral'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5 max-w-[300px]">
                                                        <p className="text-xs font-bold text-gray-900 dark:text-zinc-100 line-clamp-1 leading-relaxed">
                                                            {post.Conteúdo}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${rede.bg} ${rede.text} border-0 shadow-sm`}>
                                                            <RedeIcon size={12} strokeWidth={3} />
                                                            <span className="text-[9px] font-black uppercase tracking-wider">{post.Rede_Social || 'OUTRA'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-zinc-800 rounded-md truncate max-w-[100px]">
                                                            {post["Tipo de conteúdo"] || 'Feed'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3.5">
                                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusStyle}`}>
                                                            {post["Status do conteúdo"] === 'AGUARDANDO APROVAÇÃO' && <AlertCircle size={10} />}
                                                            {post["Status do conteúdo"] === 'PUBLICADO' && <CheckCircle2 size={10} />}
                                                            {post["Status do conteúdo"] === 'PRODUÇÃO' && <PlayCircle size={10} />}
                                                            {post["Status do conteúdo"]}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={(e) => { e.stopPropagation(); openEditSidebar(post.id); }} className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                                                                <Database size={14} />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); performDelete([post.id], 'PLANEJAMENTO'); }} className="p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-lg text-gray-400 hover:text-rose-600 transition-colors">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* KANBAN VIEW */}
                {viewMode === 'kanban' && (
                    <div className="flex gap-6 overflow-x-auto custom-scrollbar pb-8 max-w-[1400px] h-[calc(100vh-280px)]">
                        {[
                            { id: 'PENDENTE', label: 'Pendente', color: 'gray', statuses: ['EM ESPERA'] },
                            { id: 'PRODUÇÃO', label: 'Em Produção', color: 'blue', statuses: ['PRODUÇÃO'] },
                            { id: 'APROVADO', label: 'Aprovado', color: 'amber', statuses: ['AGUARDANDO APROVAÇÃO'] },
                            { id: 'PUBLICADO', label: 'Publicado', color: 'green', statuses: ['PUBLICADO', 'CONCLUÍDO'] },
                        ].map(col => {
                            const colEvents = filteredData.filter(e => col.statuses.includes(e["Status do conteúdo"]));
                            
                            return (
                                <div key={col.id} className="flex-shrink-0 w-80 flex flex-col h-full bg-gray-50/50 dark:bg-zinc-900/30 rounded-3xl border border-gray-100 dark:border-zinc-800">
                                    {/* Header Coluna */}
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${
                                                col.color === 'gray' ? 'bg-gray-400' :
                                                col.color === 'blue' ? 'bg-blue-500' :
                                                col.color === 'amber' ? 'bg-amber-500' :
                                                'bg-green-500'
                                            }`}></div>
                                            <h3 className="text-xs font-black text-gray-800 dark:text-zinc-200 uppercase tracking-widest">{col.label}</h3>
                                            <span className="text-[10px] font-bold text-gray-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-md border border-gray-100 dark:border-zinc-700">{colEvents.length}</span>
                                        </div>
                                    </div>

                                    {/* Lista de Cards */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                                        {colEvents.map(post => {
                                            const rede = getRedeStyle(post.Rede_Social);
                                            const client = clients.find(c => c.id === post.Cliente_ID);
                                            
                                            return (
                                                <div
                                                    key={post.id}
                                                    onClick={() => openEditSidebar(post.id)}
                                                    className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-500/50 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${rede.bg} ${rede.text}`}>
                                                            <rede.icon size={10} strokeWidth={3} /> {post.Rede_Social || 'OUTRA'}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                                            <Clock size={10} /> {post.Hora || '09:00'}
                                                        </div>
                                                    </div>

                                                    <p className="text-xs font-black text-gray-900 dark:text-white leading-relaxed mb-4 line-clamp-3">
                                                        {post.Conteúdo}
                                                    </p>

                                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-zinc-800/50 min-w-0">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: client?.['Cor (HEX)'] || '#3B82F6' }}></div>
                                                            <span className="text-[9px] font-bold text-gray-500 uppercase truncate min-w-0">{client?.Nome || 'Geral'}</span>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{post["Tipo de conteúdo"] || 'Feed'}</span>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {colEvents.length === 0 && (
                                            <div className="h-24 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center opacity-40">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vazio</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {sidebarView && (
                    <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm z-[90] transition-opacity animate-in fade-in" onClick={closeSidebar}></div>
                )}

                {/* SIDEBAR: EDIÇÃO DE CONTEÚDO */}
                {sidebarView === 'edit' && (
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#F8FAFC] dark:bg-[#111114] border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-[100] flex flex-col transform animate-in slide-in-from-right duration-300">
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0c] flex justify-between items-center shrink-0">
                            <h3 className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Detalhes do Planejamento</h3>
                            <button onClick={closeSidebar} className="p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-lg transition-colors bg-gray-100 dark:bg-zinc-900 ios-btn"><X size={16} /></button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                            <div>
                                <textarea
                                    rows={2}
                                    value={selectedEvent?.Conteúdo || ''}
                                    onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Conteúdo', e.target.value)}
                                    placeholder="NOVO CONTEÚDO"
                                    className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl p-4 text-2xl font-black text-[#0B1527] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none shadow-sm"
                                />
                            </div>

                            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5 shadow-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* CLIENTE */}
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <User size={10} strokeWidth={3} /> Cliente
                                        </label>
                                        <div className="relative">
                                            <input
                                                list={`clients-list-${selectedEvent?.id || 'new'}`}
                                                value={clients.find(c => c.id === selectedEvent?.Cliente_ID)?.Nome || selectedEvent?.Cliente_ID || ''}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    const matchedClient = clients.find(c => c.Nome.toLowerCase() === val.toLowerCase());
                                                    if (selectedEvent) {
                                                        onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Cliente_ID', matchedClient ? matchedClient.id : val);
                                                    }
                                                }}
                                                placeholder="Selecione..."
                                                className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 uppercase ios-btn"
                                            />
                                            <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                                            <datalist id={`clients-list-${selectedEvent?.id || 'new'}`}>
                                                {clients.map(c => <option key={c.id} value={c.Nome} />)}
                                            </datalist>
                                        </div>
                                    </div>

                                    {/* REDE SOCIAL */}
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <MessageSquare size={10} strokeWidth={3} /> Rede
                                        </label>
                                        <select
                                            value={selectedEvent?.Rede_Social || ''}
                                            onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Rede_Social', e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 uppercase ios-btn"
                                        >
                                            <option value="INSTAGRAM">Instagram</option>
                                            <option value="YOUTUBE">YouTube</option>
                                            <option value="TIKTOK">TikTok</option>
                                            <option value="LINKEDIN">LinkedIn</option>
                                            <option value="FACEBOOK">Facebook</option>
                                            <option value="PINTEREST">Pinterest</option>
                                            <option value="X/TWITTER">X / Twitter</option>
                                            <option value="BLOG">Blog</option>
                                            <option value="OUTRA">Outra</option>
                                        </select>
                                    </div>

                                    {/* DATA */}
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <CalendarIcon size={10} strokeWidth={3} /> Publicação
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedEvent?.Data || ''}
                                            onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Data', e.target.value)}
                                            className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ios-btn"
                                        />
                                    </div>

                                    {/* HORA */}
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Clock size={10} strokeWidth={3} /> Horário
                                        </label>
                                        <input
                                            type="time"
                                            value={selectedEvent?.Hora || '09:00'}
                                            onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Hora', e.target.value)}
                                            placeholder="Selecione ou digite..."
                                            className="w-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-sm font-black text-gray-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 shadow-sm uppercase pr-10"
                                        />
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        <datalist id="redes-list">
                                            <option value="INSTAGRAM" />
                                            <option value="LINKEDIN" />
                                            <option value="YOUTUBE" />
                                            <option value="TIKTOK" />
                                            <option value="PINTEREST" />
                                            <option value="X/TWITTER" />
                                            <option value="FACEBOOK" />
                                            <option value="BLOG" />
                                        </datalist>
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block ml-1">Status</label>
                                    <select
                                        value={selectedEvent?.["Status do conteúdo"] || 'EM ESPERA'}
                                        onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Status do conteúdo', e.target.value)}
                                        className="w-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-sm font-black text-gray-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 shadow-sm appearance-none cursor-pointer uppercase"
                                    >
                                        <option value="EM ESPERA">-- EM ESPERA --</option>
                                        <option value="PRODUÇÃO">PRODUÇÃO</option>
                                        <option value="AGUARDANDO APROVAÇÃO">AGUARDANDO APROVAÇÃO</option>
                                        <option value="PUBLICADO">PUBLICADO</option>
                                        <option value="CONCLUÍDO">CONCLUÍDO</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-[70%] -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 block ml-1">Observações Táticas</label>
                                <textarea
                                    rows={4}
                                    value={selectedEvent?.Observações || ''}
                                    onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Observações', e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm resize-none xl:mb-20"
                                    placeholder="Adicione notas, links de referências, etc..."
                                />
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-[#0a0a0c] border-t border-gray-200 dark:border-zinc-800 shrink-0">
                            <div className="flex gap-3 mb-4">
                                <button onClick={handleDuplicateEvent} className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs font-black uppercase rounded-xl ios-btn text-gray-800 dark:text-zinc-200">Duplicar</button>
                                <button onClick={() => selectedEvent && performArchive([selectedEvent.id], 'PLANEJAMENTO', true)} className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs font-black uppercase rounded-xl ios-btn text-gray-800 dark:text-zinc-200">Arquivar</button>
                                <button onClick={handleDeleteEvent} className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-black uppercase rounded-xl ios-btn hover:bg-rose-50 dark:hover:bg-rose-900/20">Excluir</button>
                            </div>
                            <button onClick={closeSidebar} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-lg transition-all ios-btn flex items-center justify-center gap-2">
                                <Check size={18} /> Salvar Conteúdo
                            </button>
                        </div>
                    </div>
                )}

                {/* SIDEBAR: BANCO DE CONTEÚDOS */}
                {sidebarView === 'banco' && (
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-[#111114] border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-[100] flex flex-col transform animate-in slide-in-from-right duration-300">
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0 bg-gray-50/50 dark:bg-zinc-900/30">
                            <h2 className="text-sm font-black text-[#0B1527] dark:text-white uppercase tracking-widest flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-inner"><FolderOpen size={16} strokeWidth={2.5} /></div>
                                Banco de Conteúdos
                            </h2>
                            <button onClick={closeSidebar} className="p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-lg transition-colors ios-btn"><X size={20} /></button>
                        </div>

                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 shrink-0">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="BUSCAR IDEIAS..."
                                    value={librarySearchTerm}
                                    onChange={(e) => setLibrarySearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-[#14141C] border border-gray-200 dark:border-zinc-800 text-xs font-black uppercase rounded-2xl pl-12 pr-6 py-4 focus:outline-none focus:border-blue-500 transition-all placeholder:text-gray-300 dark:placeholder:text-zinc-600"
                                />
                            </div>
                        </div>

                        {rdcLibrary.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-50">
                                <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 mb-4"><FolderOpen size={24} /></div>
                                <p className="text-xs font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest text-center">
                                    Nenhum Item Encontrado no Banco de Ideias (RDC) para o filtro atual.
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4">
                                {rdcLibrary.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            playUISound('tap');
                                            const today = new Date().toISOString().split('T')[0];
                                            const targetClientId = globalClientFilter !== 'Todos Clientes'
                                                ? clients.find(c => c.Nome === globalClientFilter)?.id
                                                : (item.Cliente_ID || activeClientId || 'GERAL');

                                            const newIdPromise = onAdd('PLANEJAMENTO', {
                                                Data: today,
                                                Hora: '09:00',
                                                "Status do conteúdo": 'EM ESPERA',
                                                Conteúdo: item['Ideia de Conteúdo'],
                                                "Tipo de conteúdo": item['Tipo de conteúdo'] || 'Post Único',
                                                Cliente_ID: targetClientId,
                                                Origem_ID: item.id,
                                                Fonte_Origem: 'RDC'
                                            });
                                            newIdPromise.then((id) => {
                                                if (id) {
                                                    setSelectedEventId(id);
                                                    setSidebarView('edit');
                                                }
                                            });
                                        }}
                                        className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:shadow-xl transition-all cursor-pointer group hover:border-blue-500/50 transform hover:-translate-y-1"
                                    >
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clients.find(c => c.id === item.Cliente_ID)?.['Cor (HEX)'] || '#3B82F6' }}></div>
                                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">
                                                {clients.find(c => c.id === item.Cliente_ID)?.Nome || 'GERAL'}
                                            </div>
                                        </div>
                                        <div className="text-sm font-black leading-snug text-[#0B1527] dark:text-white mb-4 line-clamp-3">
                                            {item['Ideia de Conteúdo']}
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50 dark:border-zinc-800/50">
                                            <span className="text-[9px] font-black px-3 py-1.5 rounded-md bg-gray-50 text-gray-500 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-widest border border-gray-100 dark:border-zinc-700">
                                                {item['Tipo de conteúdo'] || 'IDEIA'}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 px-4 py-1.5 rounded-lg">
                                                <Plus size={12} strokeWidth={3} /> USAR
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* =========================================
          MODAL DE EXPORTAÇÃO
          ========================================= */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-8">
                    <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => !isGenerating && setIsExportModalOpen(false)}></div>

                    <div className="relative w-full max-w-[1300px] h-full max-h-[95vh] bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto">

                        <div className="px-6 lg:px-10 py-6 bg-white dark:bg-[#111114] border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4 text-lg font-black text-gray-900 dark:text-white">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                    <ImageIcon size={24} />
                                </div>
                                <div>
                                    <div className="uppercase tracking-tight">EXPORTAR PLANEJAMENTO</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 tracking-[0.2em]">{currentMonthName}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <select
                                    value={exportSelectedClient} onChange={(e) => { tryPlaySound('tap'); setExportSelectedClient(e.target.value); }}
                                    className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shadow-sm min-w-[200px] uppercase tracking-widest"
                                >
                                    <option value="Todos">Visão Geral (Todos)</option>
                                    {clientList.map(c => <option key={c.id} value={c.Nome}>{c.Nome}</option>)}
                                </select>
                                <button onClick={() => setIsExportModalOpen(false)} disabled={isGenerating} className="p-3 text-gray-400 hover:text-rose-500 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 ios-btn transition-colors"><X size={20} /></button>
                            </div>
                        </div>

                        <div className="p-6 lg:p-10 overflow-auto flex-1 flex justify-start lg:justify-center custom-scrollbar bg-gray-200/50 dark:bg-black/40">
                            <div id="export-canvas" className="w-[1240px] min-h-[800px] h-fit bg-white shrink-0 flex flex-col relative shadow-2xl transform origin-top scale-100 sm:scale-100 rounded-[3rem] p-12 lg:p-16">
                                {/* Export content matches user's preferred previous design but wired to real data */}
                                <div className="flex justify-between items-end mb-16 border-b-2 border-gray-100 pb-12">
                                    <div>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-3 h-12 bg-blue-600 rounded-full"></div>
                                            <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none border-gray-100 text-[#0B1527]">PLANEJAMENTO</h1>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="text-[12px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                                CALENDÁRIO DE CONTEÚDO <span className="text-blue-600 mx-2">/</span> {currentMonthName}
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

                                <div className="flex-1 flex flex-col">
                                    <div className="grid grid-cols-7 border border-gray-100 rounded-[2rem] overflow-hidden bg-gray-50/30">
                                        {WEEKDAYS_BR_SHORT.map(dia => (
                                            <div key={dia} className="py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] border-r border-gray-100 last:border-0 bg-white">
                                                {dia}
                                            </div>
                                        ))}

                                        {/* Export only first 28 days for clean 4 week export of the month */}
                                        {calendarDays.slice(0, 28).map((diaObj, idx) => {
                                            const evts = getEventosDoDia(diaObj.dateStr).filter(e =>
                                                exportSelectedClient === 'Todos' ||
                                                clients.find(c => c.id === e.Cliente_ID)?.Nome === exportSelectedClient
                                            );

                                            return (
                                                <div key={idx} className={`bg-white border-r border-t border-gray-100 p-4 min-h-[200px] flex flex-col last:border-r-0 ${diaObj.isNextMonth || diaObj.isPrevMonth ? 'opacity-40 bg-gray-50/50' : ''}`}>
                                                    <div className={`text-sm font-black text-right mb-4 ${evts.length > 0 ? 'text-[#0B1527]' : 'text-gray-300'}`}>
                                                        {diaObj.day}
                                                    </div>
                                                    <div className="space-y-3 flex-1">
                                                        {evts.map(evt => {
                                                            const style = getCardStyles(evt.Cliente_ID);
                                                            return (
                                                                <div key={evt.id} className="p-3.5 rounded-2xl border shadow-sm flex flex-col relative overflow-hidden"
                                                                    style={{ backgroundColor: style.bg, borderColor: style.border }}
                                                                >
                                                                    <div className="space-y-1.5">
                                                                        <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: style.text }}>
                                                                            <Clock size={12} strokeWidth={3} /> {evt.Hora || '09:00'}
                                                                        </div>
                                                                        <div className="text-[12px] font-black text-[#0B1527] leading-snug break-words tracking-tighter">
                                                                            {evt.Conteúdo}
                                                                        </div>
                                                                        <div className="text-[9px] font-black uppercase tracking-widest mt-1 bg-white/50 px-2.5 py-1.5 rounded-lg w-full flex items-center gap-1.5 overflow-hidden"
                                                                            style={{ color: style.text }}>
                                                                            <User size={10} strokeWidth={3} className="shrink-0" />
                                                                            <span className="truncate">{clients.find(c => c.id === evt.Cliente_ID)?.Nome || 'GERAL'}</span>
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

                                <div className="mt-12 flex items-center justify-between border-t border-gray-100 pt-10 px-4">
                                    <div className="flex flex-wrap gap-8 items-center">
                                        {exportSelectedClient === 'Todos' ? (
                                            clientList.slice(0, 6).map(c => (
                                                <div key={c.id} className="flex items-center gap-3">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c['Cor (HEX)'] || '#3B82F6' }}></div>
                                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate max-w-[120px]">{c.Nome}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center gap-3 bg-blue-50 px-5 py-2.5 rounded-full border border-blue-100/50">
                                                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">RELATÓRIO EXCLUSIVO: {exportSelectedClient}</span>
                                            </div>
                                        )}
                                        {exportSelectedClient === 'Todos' && clientList.length > 6 && (
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">+{clientList.length - 6} OUTROS</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] shrink-0">EKKO STUDIOS • {(new Date()).getFullYear()}</div>
                                </div>

                            </div>
                        </div>

                        <div className="px-6 lg:px-10 py-6 bg-white dark:bg-[#111114] border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <div className="hidden sm:flex items-center gap-6">
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> ALTA RESOLUÇÃO (PNG)
                                </div>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto justify-end">
                                <button onClick={() => setIsExportModalOpen(false)} disabled={isGenerating} className="px-6 py-3.5 text-[11px] font-black tracking-widest uppercase text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-2xl transition-colors disabled:opacity-50 ios-btn">CANCELAR</button>
                                <button onClick={handleRealDownload} disabled={isGenerating} className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-2xl text-[11px] tracking-widest uppercase font-black shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all ios-btn sm:w-64 border border-blue-500/20 justify-center">
                                    {isGenerating ? <span className="flex items-center gap-2 animate-pulse"><Loader2 size={16} className="animate-spin" /> SALVANDO...</span> : <span className="flex items-center gap-2"><Download size={16} /> BAIXAR IMAGEM</span>}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
