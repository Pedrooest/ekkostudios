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

    const handleAddContent = async (dateStr?: string) => {
        tryPlaySound('success');
        const today = dateStr || new Date().toISOString().split('T')[0];
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
        <div className={`${isDarkMode ? 'dark' : ''} h-screen overflow-hidden flex flex-col bg-zinc-50 dark:bg-[#09090b]`}>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 font-sans w-full bg-transparent transition-colors relative">

                {/* TOP ACTION BAR - ZINC STYLE */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-2">
                    <div className="flex bg-white dark:bg-zinc-900/50 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm backdrop-blur-md relative z-[60]">
                        <div className="relative">
                            <button
                                onClick={() => { tryPlaySound('tap'); setIsClientDropdownOpen(!isClientDropdownOpen); }}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all ios-btn text-[11px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-blue-600"
                            >
                                <Filter size={14} className="opacity-70" /> {renderClientHeader()} <ChevronDown size={12} />
                            </button>
                            
                            {isClientDropdownOpen && (
                                <div className="absolute top-full left-0 mt-3 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 mb-1">
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Filtrar por Cliente</span>
                                    </div>
                                    <button
                                        onClick={() => { tryPlaySound('tap'); setGlobalClientFilter('Todos Clientes'); setIsClientDropdownOpen(false); }}
                                        className="w-full flex items-center px-4 py-2.5 text-[11px] font-black text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors uppercase tracking-widest"
                                    >
                                        Todos Clientes
                                    </button>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                        {clientList.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => { tryPlaySound('tap'); setGlobalClientFilter(c.Nome); setIsClientDropdownOpen(false); }}
                                                className="w-full justify-between flex items-center px-4 py-2.5 text-[11px] font-black text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors uppercase tracking-widest"
                                            >
                                                <span>{c.Nome}</span>
                                                <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: c['Cor (HEX)'] || '#3B82F6' }}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800 my-auto mx-1"></div>
                        
                        <button
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ios-btn text-[11px] font-black uppercase tracking-widest ${showArchived ? 'bg-blue-600/10 text-blue-600' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                            onClick={() => { tryPlaySound('tap'); setShowArchived?.(!showArchived); }}
                        >
                            <Archive size={14} className="opacity-70" /> {showArchived ? 'Ocultar Arquivados' : 'Arquivados'}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleOpenExport}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-white rounded-2xl shadow-sm hover:border-blue-500/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all ios-btn text-[10px] font-black uppercase tracking-widest"
                        >
                            <Download size={14} className="text-blue-500" /> EXPORTAR
                        </button>
                        
                        <button
                            onClick={() => { tryPlaySound('tap'); setIsDarkMode(!isDarkMode); }}
                            className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500 dark:text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 shadow-sm ios-btn transition-colors"
                        >
                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                        </button>
                    </div>
                </div>

                {/* MODERN HEADER & TABS */}
                <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-10 gap-8 max-w-[1600px] mx-auto">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-10 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                            <h1 className="text-[42px] font-black text-zinc-900 dark:text-white tracking-tighter leading-none uppercase italic">
                                PLANEJAMENTO<span className="text-blue-600">.</span>
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm w-fit">
                            {['ALL', 'EM ESPERA', 'AGUARDANDO APROVAÇÃO', 'PRODUÇÃO', 'PUBLICADO'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { tryPlaySound('tap'); setActiveTabLocal(tab); }}
                                    className={`text-[10px] font-black uppercase tracking-widest transition-all ios-btn px-4 py-2.5 rounded-xl ${activeTab === tab
                                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md transform scale-[1.02]'
                                            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 shrink-0">
                        <button 
                            onClick={openBancoSidebar} 
                            className="group flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ios-shadow ios-btn"
                        >
                            <Database size={18} className="transition-transform group-hover:rotate-12" /> BANCO DE CONTEÚDO
                        </button>
                        <button 
                            onClick={() => handleAddContent()} 
                            className="flex items-center gap-3 px-8 py-4 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-zinc-900/20 dark:shadow-white/5 transition-all ios-btn transform hover:-translate-y-1 active:translate-y-0"
                        >
                            <Plus size={20} strokeWidth={3} /> NOVO CONTEÚDO
                        </button>
                    </div>
                </div>

                {/* VIEW SELECTOR & CALENDAR CONTROLS - ZINC STYLE */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-2 sm:p-3 px-6 rounded-[2rem] shadow-sm max-w-[1600px] mx-auto backdrop-blur-sm">
                    <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-2xl items-center relative shadow-inner border border-zinc-200/50 dark:border-zinc-700/30">
                        <button
                            onClick={() => { tryPlaySound('tap'); setViewMode('calendar'); }}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm transform scale-[1.02]' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        >
                            <CalendarIcon size={14} strokeWidth={2.5} /> Calendário
                        </button>
                        <button
                            onClick={() => { tryPlaySound('tap'); setViewMode('list'); }}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm transform scale-[1.02]' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        >
                            <List size={14} strokeWidth={2.5} /> Lista
                        </button>
                        <button
                            onClick={() => { tryPlaySound('tap'); setViewMode('kanban'); }}
                            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm transform scale-[1.02]' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                        >
                            <LayoutGrid size={14} strokeWidth={2.5} /> Kanban
                        </button>
                    </div>

                    {viewMode === 'calendar' && (
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/30 px-4 py-2 rounded-2xl border border-zinc-200 dark:border-zinc-800/50">
                                <button className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-400 hover:text-blue-500 transition-all ios-btn" onClick={() => handleMonthNav(-1)}>
                                    <ChevronLeft size={20} />
                                </button>
                                <h3 className="text-[11px] font-black text-zinc-900 dark:text-white min-w-[140px] text-center uppercase tracking-[0.2em] italic">
                                    {calendarSubMode === 'month' ? currentMonthName : 'Semana'}
                                </h3>
                                <button className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-700 text-zinc-400 hover:text-blue-500 transition-all ios-btn" onClick={() => handleMonthNav(1)}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            
                            <div className="flex bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-1 border border-zinc-200/50 dark:border-zinc-700/30">
                                <button
                                    onClick={() => setCalendarSubMode('month')}
                                    className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${calendarSubMode === 'month' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'}`}
                                >
                                    Mês
                                </button>
                                <button
                                    onClick={() => setCalendarSubMode('week')}
                                    className={`px-5 py-2 text-[9px] font-black uppercase tracking-[0.15em] rounded-xl transition-all ${calendarSubMode === 'week' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400'}`}
                                >
                                    Semana
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODERN CALENDAR GRID */}
                {viewMode === 'calendar' && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 backdrop-blur-md relative z-10">
                            {WEEKDAYS_BR_SHORT.map(dia => (
                                <div key={dia} className="py-6 text-center text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] border-r border-zinc-200 dark:border-zinc-800 last:border-0 truncate">
                                    <span className="hidden sm:inline">{dia}</span>
                                    <span className="sm:hidden">{dia.substring(0, 3)}</span>
                                </div>
                            ))}
                        </div>

                        <div className={`grid grid-cols-7 bg-zinc-100 dark:bg-zinc-950 ${calendarSubMode === 'month' ? 'auto-rows-[minmax(160px,auto)]' : 'auto-rows-[minmax(400px,auto)]'}`}>
                            {calendarDays.map((diaObj, idx) => {
                                const evts = getEventosDoDia(diaObj.dateStr);
                                const isToday = diaObj.dateStr === new Date().toISOString().split('T')[0];

                                return (
                                    <div
                                        key={idx}
                                        className={`p-2 lg:p-3 border-r border-b border-zinc-200 dark:border-zinc-800 transition-all relative flex flex-col min-h-0 group/day ${diaObj.isNextMonth || diaObj.isPrevMonth ? 'bg-zinc-50/50 dark:bg-zinc-900/20 opacity-30 grayscale-[0.5]' :
                                                isToday ? 'bg-blue-600/5 dark:bg-blue-900/10' : 'bg-white dark:bg-zinc-900 hover:bg-white dark:hover:bg-zinc-800/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <span className={`w-8 h-8 flex items-center justify-center text-[11px] rounded-xl transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 font-black scale-110' : 'text-zinc-400 dark:text-zinc-500 font-bold group-hover/day:text-zinc-900 dark:group-hover/day:text-zinc-200'}`}>
                                                {diaObj.day}
                                            </span>
                                            {evts.length > 0 && (
                                                <div className="flex -space-x-1.5 opacity-0 group-hover/day:opacity-100 transition-opacity">
                                                    {Array.from(new Set(evts.map(e => e.Rede_Social))).slice(0, 3).map((rede, ridx) => {
                                                        const style = getRedeStyle(rede);
                                                        return <div key={ridx} className={`w-4 h-4 rounded-full border border-white dark:border-zinc-900 ${style.bg} flex items-center justify-center`}><style.icon size={8} className={style.text} /></div>
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 flex-1 overflow-hidden custom-scrollbar">
                                            {evts.map(evento => {
                                                const redeStyle = getRedeStyle(evento.Rede_Social);
                                                const Icon = redeStyle.icon;
                                                const client = clients.find(c => c.id === evento.Cliente_ID);
                                                return (
                                                    <div
                                                        key={evento.id}
                                                        onClick={() => openEditSidebar(evento.id)}
                                                        className={`group/card p-2 rounded-xl border-l-[3px] ${redeStyle.bg} bg-opacity-30 dark:bg-opacity-10 text-left cursor-pointer transition-all hover:translate-x-1 active:scale-[0.98] ios-btn overflow-hidden flex flex-col gap-1.5 shadow-sm border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50`}
                                                        style={{ borderLeftColor: client?.['Cor (HEX)'] || '#3B82F6' }}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className={`flex items-center gap-1.5 ${redeStyle.text}`}>
                                                                <Icon size={10} strokeWidth={3} className="shrink-0" />
                                                                <span className="text-[8px] font-black uppercase tracking-wider opacity-80">{evento.Hora || '09:00'}</span>
                                                            </div>
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: client?.['Cor (HEX)'] || '#3B82F6' }}></div>
                                                        </div>
                                                        <div className="text-[10px] font-bold leading-tight text-zinc-800 dark:text-zinc-200 line-clamp-2">
                                                            {evento.Conteúdo}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Hover Add Button */}
                                        <button 
                                            onClick={() => handleAddContent(diaObj.dateStr)}
                                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-blue-600 text-white opacity-0 group-hover/day:opacity-100 transition-all hover:scale-110 shadow-lg z-10"
                                        >
                                            <Plus size={12} strokeWidth={3} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* MODERN LIST VIEW */}
                {viewMode === 'list' && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-md">
                                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em]">Data / Hora</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em]">Cliente</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em]">Conteúdo</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em]">Canal</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em]">Formato</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em]">Status</th>
                                        <th className="px-8 py-6 text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.25em] text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-40">
                                                    <Search size={40} className="text-zinc-300" />
                                                    <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">
                                                        Nenhum conteúdo encontrado
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        [...filteredData].sort((a,b) => new Date(a.Data).getTime() - new Date(b.Data).getTime()).map(post => {
                                            const rede = getRedeStyle(post.Rede_Social);
                                            const RedeIcon = rede.icon;
                                            const client = clients.find(c => c.id === post.Cliente_ID);
                                            
                                            // Status styles mapping
                                            const statusMap: Record<string, string> = {
                                                'PUBLICADO': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                                'CONCLUÍDO': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                                                'AGUARDANDO APROVAÇÃO': 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                                                'PRODUÇÃO': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                                                'EM ESPERA': 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20'
                                            };
                                            const statusStyle = statusMap[post["Status do conteúdo"]] || statusMap['EM ESPERA'];

                                            return (
                                                <tr key={post.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-all group cursor-pointer" onClick={() => openEditSidebar(post.id)}>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                                                {post.Data ? new Date(post.Data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '--'}
                                                            </span>
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                                                                <Clock size={10} strokeWidth={3} /> {post.Hora || '09:00'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: client?.['Cor (HEX)'] || '#3B82F6' }}></div>
                                                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase truncate max-w-[120px]">
                                                                {client?.Nome || 'Geral'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 max-w-[400px]">
                                                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-relaxed italic">
                                                            {post.Conteúdo}
                                                        </p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ${rede.bg} ${rede.text} border border-transparent shadow-sm group-hover:scale-105 transition-transform`}>
                                                            <RedeIcon size={12} strokeWidth={3} />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.1em]">{post.Rede_Social || 'OUTRA'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                                            {post["Tipo de conteúdo"] || 'Feed'}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${statusStyle}`}>
                                                            {post["Status do conteúdo"] === 'AGUARDANDO APROVAÇÃO' && <AlertCircle size={10} strokeWidth={3} />}
                                                            {post["Status do conteúdo"] === 'PUBLICADO' && <CheckCircle2 size={10} strokeWidth={3} />}
                                                            {post["Status do conteúdo"] === 'PRODUÇÃO' && <PlayCircle size={10} strokeWidth={3} />}
                                                            {post["Status do conteúdo"]}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                            <button onClick={(e) => { e.stopPropagation(); openEditSidebar(post.id); }} className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-blue-600 transition-all shadow-sm">
                                                                <Database size={16} />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); performDelete([post.id], 'PLANEJAMENTO'); }} className="p-2 hover:bg-white dark:hover:bg-zinc-700 rounded-xl text-zinc-400 hover:text-rose-600 transition-all shadow-sm">
                                                                <Trash2 size={16} />
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

                {/* MODERN KANBAN VIEW */}
                {viewMode === 'kanban' && (
                    <div className="flex gap-8 overflow-x-auto custom-scrollbar pb-10 max-w-[1600px] mx-auto h-[calc(100vh-280px)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {[
                            { id: 'PENDENTE', label: 'Pendente', color: 'bg-zinc-400', statuses: ['EM ESPERA'] },
                            { id: 'PRODUÇÃO', label: 'Em Produção', color: 'bg-blue-500', statuses: ['PRODUÇÃO'] },
                            { id: 'APROVADO', label: 'Aprovado', color: 'bg-amber-500', statuses: ['AGUARDANDO APROVAÇÃO'] },
                            { id: 'PUBLICADO', label: 'Publicado', color: 'bg-emerald-500', statuses: ['PUBLICADO', 'CONCLUÍDO'] },
                        ].map(col => {
                            const colEvents = filteredData.filter(e => col.statuses.includes(e["Status do conteúdo"]));
                            
                            return (
                                <div key={col.id} className="flex-shrink-0 w-[22rem] flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/30 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 transition-all hover:border-zinc-200 dark:hover:border-zinc-700">
                                    {/* Column Header */}
                                    <div className="p-7 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full shadow-lg ${col.color}`}></div>
                                            <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-[0.2em]">{col.label}</h3>
                                            <span className="text-[10px] font-black text-zinc-400 bg-white dark:bg-zinc-800 px-3 py-1 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                                                {colEvents.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card List */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                                        {colEvents.map(post => {
                                            const rede = getRedeStyle(post.Rede_Social);
                                            const client = clients.find(c => c.id === post.Cliente_ID);
                                            
                                            return (
                                                <div
                                                    key={post.id}
                                                    onClick={() => openEditSidebar(post.id)}
                                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:border-blue-500/50 hover:-translate-y-1 transition-all cursor-pointer group/k-card relative overflow-hidden"
                                                >
                                                    {/* Client Indicator */}
                                                    <div className="absolute top-0 left-0 w-1.5 h-full opacity-0 group-hover/k-card:opacity-100 transition-opacity" style={{ backgroundColor: client?.['Cor (HEX)'] || '#3B82F6' }}></div>

                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider ${rede.bg} ${rede.text} shadow-sm`}>
                                                            <rede.icon size={12} strokeWidth={3} /> {post.Rede_Social || 'OUTRA'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                                                            <Clock size={12} strokeWidth={3} /> {post.Hora || '09:00'}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm font-bold text-zinc-900 dark:text-white leading-relaxed mb-6 line-clamp-3">
                                                        {post.Conteúdo}
                                                    </p>

                                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: client?.['Cor (HEX)'] || '#3B82F6' }}></div>
                                                            <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest truncate max-w-[120px]">
                                                                {client?.Nome || 'Geral'}
                                                            </span>
                                                        </div>
                                                        <div className="p-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-zinc-400 group-hover/k-card:text-blue-500 transition-colors">
                                                            <Database size={12} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {colEvents.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-dashed border-zinc-100 dark:border-zinc-800/50 rounded-3xl">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                                                    <FolderOpen size={20} />
                                                </div>
                                                <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest text-center">Nenhum conteúdo aqui ainda</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}


                {/* MODERN MODAL/SIDEBAR OVERLAY */}
                {sidebarView && (
                    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-md z-[90] transition-all duration-500 animate-in fade-in" onClick={closeSidebar}></div>
                )}

                {/* SIDEBAR: EDIÇÃO DE CONTEÚDO */}
                {sidebarView === 'edit' && (
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-[100] flex flex-col transform animate-in slide-in-from-right duration-500 ease-out rounded-l-[3rem] overflow-hidden">
                        <div className="px-8 py-7 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                    <Database size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Planejamento</h3>
                                    <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Detalhes do Item</p>
                                </div>
                            </div>
                            <button onClick={closeSidebar} className="p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all bg-zinc-50 dark:bg-zinc-800 hover:scale-110 active:scale-95"><X size={20} strokeWidth={3} /></button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-32">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                    <ImageIcon size={12} strokeWidth={3} /> Conteúdo Principal
                                </label>
                                <textarea
                                    rows={4}
                                    value={selectedEvent?.Conteúdo || ''}
                                    onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Conteúdo', e.target.value)}
                                    placeholder="Escreva o conteúdo aqui..."
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 text-xl font-black text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all resize-none shadow-inner italic"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                {/* CLIENTE */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <User size={12} strokeWidth={3} /> Cliente
                                    </label>
                                    <div className="relative group">
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
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all uppercase"
                                        />
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:rotate-180 transition-transform" />
                                        <datalist id={`clients-list-${selectedEvent?.id || 'new'}`}>
                                            {clients.map(c => <option key={c.id} value={c.Nome} />)}
                                        </datalist>
                                    </div>
                                </div>

                                {/* REDE SOCIAL */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <MessageSquare size={12} strokeWidth={3} /> Rede
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={selectedEvent?.Rede_Social || ''}
                                            onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Rede_Social', e.target.value)}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all appearance-none uppercase"
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
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                                    </div>
                                </div>

                                {/* DATA */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <CalendarIcon size={12} strokeWidth={3} /> Publicação
                                    </label>
                                    <input
                                        type="date"
                                        value={selectedEvent?.Data || ''}
                                        onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Data', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all"
                                    />
                                </div>

                                {/* HORA */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Clock size={12} strokeWidth={3} /> Horário
                                    </label>
                                    <input
                                        type="time"
                                        value={selectedEvent?.Hora || '09:00'}
                                        onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Hora', e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all uppercase"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Status do Conteúdo</label>
                                <div className="relative group">
                                    <select
                                        value={selectedEvent?.["Status do conteúdo"] || 'EM ESPERA'}
                                        onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Status do conteúdo', e.target.value)}
                                        className="w-full bg-zinc-900 border border-zinc-700 text-sm font-black text-white rounded-2xl px-5 py-4 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer uppercase tracking-widest"
                                    >
                                        <option value="EM ESPERA">EM ESPERA</option>
                                        <option value="PRODUÇÃO">PRODUÇÃO</option>
                                        <option value="AGUARDANDO APROVAÇÃO">AGUARDANDO APROVAÇÃO</option>
                                        <option value="PUBLICADO">PUBLICADO</option>
                                        <option value="CONCLUÍDO">CONCLUÍDO</option>
                                    </select>
                                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none group-focus-within:rotate-180 transition-transform" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] ml-1">Observações Táticas</label>
                                <textarea
                                    rows={5}
                                    value={selectedEvent?.Observações || ''}
                                    onChange={(e) => selectedEvent && onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Observações', e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 text-xs font-bold text-zinc-800 dark:text-zinc-300 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all resize-none shadow-sm"
                                    placeholder="Adicione notas, links de referências, briefings..."
                                />
                            </div>
                        </div>

                        <div className="p-8 bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 backdrop-blur-xl shrink-0">
                            <div className="flex gap-4 mb-6">
                                <button onClick={handleDuplicateEvent} className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 text-zinc-800 dark:text-zinc-200 shadow-sm">Duplicar</button>
                                <button onClick={() => selectedEvent && performArchive([selectedEvent.id], 'PLANEJAMENTO', true)} className="flex-1 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-105 active:scale-95 text-zinc-800 dark:text-zinc-200 shadow-sm">Arquivar</button>
                                <button onClick={handleDeleteEvent} className="flex-1 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all hover:bg-rose-500/20 hover:scale-105 active:scale-95 shadow-sm">Excluir</button>
                            </div>
                            <button onClick={closeSidebar} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-3">
                                <Check size={20} strokeWidth={3} /> Salvar Alterações
                            </button>
                        </div>
                    </div>
                )}

                {/* SIDEBAR: BANCO DE CONTEÚDOS */}
                {sidebarView === 'banco' && (
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-[100] flex flex-col transform animate-in slide-in-from-right duration-500 ease-out rounded-l-[3rem] overflow-hidden">
                        <div className="px-8 py-7 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                    <FolderOpen size={20} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Biblioteca</h3>
                                    <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Banco de Conteúdos</p>
                                </div>
                            </div>
                            <button onClick={closeSidebar} className="p-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-xl transition-all bg-zinc-50 dark:bg-zinc-800 hover:scale-110 active:scale-95"><X size={20} strokeWidth={3} /></button>
                        </div>

                        <div className="p-8 border-b border-zinc-50 dark:border-zinc-800/50 shrink-0 bg-white dark:bg-zinc-900">
                            <div className="flex items-center gap-3 group bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 transition-all shadow-inner">
                                <Search className="text-zinc-400 group-focus-within:text-blue-500 transition-colors shrink-0" size={18} strokeWidth={2.5} />
                                <input
                                    type="text"
                                    placeholder="BUSCAR IDEIAS NO BANCO..."
                                    value={librarySearchTerm}
                                    onChange={(e) => setLibrarySearchTerm(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest placeholder:text-zinc-300 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-zinc-100"
                                />
                            </div>
                        </div>

                        {rdcLibrary.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 opacity-30 gap-6">
                                <div className="w-24 h-24 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center text-zinc-300 dark:text-zinc-700 shadow-inner">
                                    <FolderOpen size={40} strokeWidth={1.5} />
                                </div>
                                <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">
                                    Nenhuma ideia encontrada no banco para os filtros atuais
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                                {rdcLibrary.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            tryPlaySound('tap');
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
                                        className="p-6 rounded-[2rem] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:shadow-2xl transition-all cursor-pointer group hover:border-blue-500/50 transform hover:-translate-y-1 relative overflow-hidden active:scale-[0.98]"
                                    >
                                        <div className="absolute top-0 left-0 w-1.5 h-full opacity-0 group-hover:opacity-100 transition-opacity bg-blue-500"></div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: clients.find(c => c.id === item.Cliente_ID)?.['Cor (HEX)'] || '#3B82F6' }}></div>
                                            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] truncate">
                                                {clients.find(c => c.id === item.Cliente_ID)?.Nome || 'GERAL'}
                                            </div>
                                            <div className="flex-1"></div>
                                            <Copy size={12} className="text-zinc-300 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed italic">
                                            "{item['Ideia de Conteúdo']}"
                                        </p>
                                        <div className="mt-5 flex items-center justify-between pt-4 border-t border-zinc-50 dark:border-zinc-800/50">
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-3 py-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-700">{item['Tipo de conteúdo'] || 'Post Único'}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                                Usar Ideia <X className="rotate-45" size={10} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODERN EXPORT MODAL */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-8">
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-in fade-in transition-all duration-500" onClick={() => !isGenerating && setIsExportModalOpen(false)}></div>

                    <div className="relative w-full max-w-[1300px] h-full max-h-[95vh] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 pointer-events-auto">

                        <div className="px-10 py-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/30">
                                    <Download size={28} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Exportação Premium</h3>
                                    <p className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">{currentMonthName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Filtrar para Exportar</span>
                                    <select
                                        value={exportSelectedClient} onChange={(e) => { tryPlaySound('tap'); setExportSelectedClient(e.target.value); }}
                                        className="bg-transparent text-sm font-black text-zinc-900 dark:text-white focus:outline-none cursor-pointer uppercase tracking-widest text-right"
                                    >
                                        <option value="Todos">Visão Geral (Todos)</option>
                                        {clientList.map(c => <option key={c.id} value={c.Nome}>{c.Nome}</option>)}
                                    </select>
                                </div>
                                <div className="h-10 w-px bg-zinc-200 dark:bg-zinc-800 mx-2 hidden lg:block"></div>
                                <button onClick={() => setIsExportModalOpen(false)} disabled={isGenerating} className="p-3 text-zinc-400 hover:text-rose-500 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:scale-110 active:scale-90"><X size={24} strokeWidth={3} /></button>
                            </div>
                        </div>

                        <div className="p-10 lg:p-14 overflow-auto flex-1 flex justify-start lg:justify-center custom-scrollbar bg-zinc-200 dark:bg-zinc-900/60">
                            <div id="export-canvas" className="w-[1240px] min-h-[800px] h-fit bg-white shrink-0 flex flex-col relative shadow-2xl transform origin-top scale-100 rounded-[4rem] p-16 lg:p-20 overflow-hidden">
                                {/* BACKGROUND DECORATION */}
                                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
                                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] -ml-48 -mb-48"></div>

                                <div className="flex justify-between items-end mb-20 border-b-4 border-zinc-50 pb-16 relative z-10">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-4 h-16 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20"></div>
                                            <h1 className="text-7xl font-black tracking-[-0.05em] uppercase italic leading-none text-zinc-900">PLANEJAMENTO</h1>
                                        </div>
                                        <div className="flex items-center gap-8 pl-9">
                                            <p className="text-[12px] font-black text-zinc-300 uppercase tracking-[0.4em]">
                                                CALENDÁRIO ESTRATÉGICO <span className="text-blue-600 mx-3">/</span> {currentMonthName}
                                            </p>
                                            <div className="h-5 w-[2px] bg-zinc-100"></div>
                                            <p className="text-[12px] font-black text-blue-600 uppercase tracking-[0.4em]">
                                                CLIENTE: {exportSelectedClient === 'Todos' ? 'VISÃO GERAL' : exportSelectedClient}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 px-8 py-6 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                        <div className="text-4xl font-black italic tracking-tighter text-zinc-900">EKKO<span className="text-blue-600">.</span></div>
                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] opacity-60">STUDIOS INTELIGENTES</span>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col relative z-10">
                                    <div className="grid grid-cols-7 gap-4">
                                        {WEEKDAYS_BR_SHORT.map(dia => (
                                            <div key={dia} className="py-4 text-center text-[11px] font-black text-zinc-300 uppercase tracking-[0.3em]">
                                                {dia}
                                            </div>
                                        ))}

                                        {calendarDays.slice(0, 28).map((diaObj, idx) => {
                                            const evts = getEventosDoDia(diaObj.dateStr).filter(e =>
                                                exportSelectedClient === 'Todos' ||
                                                clients.find(c => c.id === e.Cliente_ID)?.Nome === exportSelectedClient
                                            );

                                            return (
                                                <div key={idx} className={`bg-zinc-50/50 border border-zinc-100 rounded-[2rem] p-6 min-h-[220px] flex flex-col transition-all ${diaObj.isNextMonth || diaObj.isPrevMonth ? 'opacity-20 grayscale' : ''}`}>
                                                    <div className={`text-xl font-black mb-6 ${evts.length > 0 ? 'text-zinc-900' : 'text-zinc-200'}`}>
                                                        {diaObj.day}
                                                    </div>
                                                    <div className="space-y-4 flex-1">
                                                        {evts.map(evt => {
                                                            const style = getCardStyles(evt.Cliente_ID);
                                                            return (
                                                                <div key={evt.id} className="p-4 rounded-2xl border bg-white shadow-xl shadow-zinc-200/50 flex flex-col border-zinc-100 overflow-hidden relative">
                                                                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: style.hex }}></div>
                                                                    <div className="space-y-2">
                                                                        <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2" style={{ color: style.hex }}>
                                                                            <Clock size={12} strokeWidth={3} /> {evt.Hora || '09:00'}
                                                                        </div>
                                                                        <div className="text-[13px] font-bold text-zinc-800 leading-snug break-words tracking-tight italic">
                                                                            "{evt.Conteúdo}"
                                                                        </div>
                                                                        <div className="text-[9px] font-black uppercase tracking-widest mt-2 bg-zinc-50 px-3 py-1.5 rounded-lg w-fit flex items-center gap-2 text-zinc-400 border border-zinc-100">
                                                                            <User size={10} strokeWidth={3} className="shrink-0" />
                                                                            <span className="truncate max-w-[80px]">{clients.find(c => c.id === evt.Cliente_ID)?.Nome || 'GERAL'}</span>
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

                                <div className="mt-16 flex items-center justify-between border-t-2 border-zinc-50 pt-12 px-8">
                                    <div className="flex flex-wrap gap-10 items-center">
                                        {exportSelectedClient === 'Todos' ? (
                                            clientList.slice(0, 5).map(c => (
                                                <div key={c.id} className="flex items-center gap-4">
                                                    <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: c['Cor (HEX)'] || '#3B82F6' }}></div>
                                                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest truncate max-w-[140px]">{c.Nome}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center gap-4 bg-blue-50/50 px-6 py-3 rounded-full border border-blue-100">
                                                <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></div>
                                                <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em]">RELATÓRIO EXCLUSIVO: {exportSelectedClient}</span>
                                            </div>
                                        )}
                                        {exportSelectedClient === 'Todos' && clientList.length > 5 && (
                                            <span className="text-[11px] font-black text-zinc-300 uppercase tracking-[0.2em]">+{clientList.length - 5} OUTROS CLIENTES</span>
                                        )}
                                    </div>
                                    <div className="text-[11px] font-black text-zinc-200 uppercase tracking-[0.4em] shrink-0">EKKO STUDIOS • {(new Date()).getFullYear()}</div>
                                </div>
                            </div>
                        </div>

                        <div className="px-10 py-8 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <div className="hidden sm:flex items-center gap-4">
                                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center gap-3 border border-zinc-100 dark:border-zinc-700">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Pronto para Exportação Ultra-Res (2X)</span>
                                </div>
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto justify-end">
                                <button onClick={() => setIsExportModalOpen(false)} disabled={isGenerating} className="px-8 py-4 text-[11px] font-black tracking-widest uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50 hover:scale-105 active:scale-95">CANCELAR</button>
                                <button onClick={handleRealDownload} disabled={isGenerating} className="flex items-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-[1.5rem] text-[11px] tracking-[0.2em] uppercase font-black shadow-2xl shadow-blue-600/30 transition-all hover:scale-[1.05] active:scale-95 sm:w-80 justify-center">
                                    {isGenerating ? <span className="flex items-center gap-3 animate-pulse"><Loader2 size={18} className="animate-spin" /> GERANDO ARQUIVO...</span> : <span className="flex items-center gap-3"><Download size={18} strokeWidth={3} /> EXPORTAR PLANEJAMENTO</span>}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
