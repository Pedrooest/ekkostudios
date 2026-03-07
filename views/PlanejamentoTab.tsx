import React, { useState, useEffect } from 'react';
import {
    Download, Plus, Search, Clock, User, Check, X,
    Filter, Image as ImageIcon, Archive, Database,
    ChevronLeft, ChevronRight, FolderOpen,
    ChevronDown, Moon, Sun
} from 'lucide-react';

// ==========================================
// FUNÇÕES AUXILIARES DE SOM
// ==========================================
const tryPlaySound = (type: any) => {
    if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
};

export default function PlanejamentoTab() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [activeTab, setActiveTab] = useState('ALL');
    const [currentMonth, setCurrentMonth] = useState('Fevereiro 2026');
    const [viewMode, setViewMode] = useState('month');

    const [globalClientFilter, setGlobalClientFilter] = useState('Todos Clientes');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [exportSelectedClient, setExportSelectedClient] = useState('Todos');

    const [sidebarView, setSidebarView] = useState<string | null>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);

    const [eventos, setEventos] = useState([
        { id: 1, day: 3, time: '10:00', title: 'Reels: Bastidores da Produção', client: 'Forno a Lenha Bakery', color: 'amber', status: 'PUBLICADO', rede: 'Instagram', obs: '' },
        { id: 2, day: 5, time: '14:30', title: 'Carrossel: Dicas de Design UI para 2026', client: 'Agência Ekko', color: 'indigo', status: 'PRODUÇÃO', rede: 'LinkedIn', obs: 'Focar nas tendências de 2026.' },
        { id: 3, day: 12, time: '18:00', title: 'Post Único: Promoção de Inverno com Oferta Especial', client: 'Boutique XYZ', color: 'rose', status: 'AGUARDANDO APROVAÇÃO', rede: 'Instagram', obs: '' },
        { id: 4, day: 15, time: '09:00', title: 'Story: Enquete Interativa', client: 'Tech Solutions Hub', color: 'emerald', status: 'EM ESPERA', rede: 'Instagram', obs: '' },
        { id: 5, day: 22, time: '12:00', title: 'Vídeo YouTube: Tutorial Completo de Figma', client: 'Agência Ekko', color: 'indigo', status: 'CONCLUÍDO', rede: 'YouTube', obs: '' },
        { id: 6, day: 24, time: '17:00', title: 'LinkedIn: Artigo sobre Liderança Moderna', client: 'Tech Solutions Hub', color: 'emerald', status: 'PRODUÇÃO', rede: 'LinkedIn', obs: '' },
        { id: 7, day: 25, time: '11:00', title: 'Post: Sorteio de Aniversário Oficial da Marca', client: 'Forno a Lenha Bakery', color: 'amber', status: 'AGUARDANDO APROVAÇÃO', rede: 'Instagram', obs: 'Lembrar de colocar regras.' },
    ]);

    const clientList = ['Todos Clientes', ...new Set(eventos.map(e => e.client))];
    const diasSemana = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];

    const diasMes = Array.from({ length: 35 }, (_, i) => {
        const dayNum = i + 1;
        if (dayNum > 28) return { day: dayNum - 28, isNextMonth: true };
        return { day: dayNum, isNextMonth: false };
    });

    const displayedDays = viewMode === 'month' ? diasMes : diasMes.slice(21, 28);
    const exportDays = viewMode === 'month' ? diasMes.slice(0, 28) : displayedDays;

    const getEventosDoDia = (day: any, isNextMonth: boolean) => {
        if (isNextMonth) return [];
        return eventos.filter(e => {
            const matchDay = e.day === day;
            const matchClient = globalClientFilter === 'Todos Clientes' || e.client === globalClientFilter;
            const matchStatus = activeTab === 'ALL' || e.status === activeTab;
            return matchDay && matchClient && matchStatus;
        });
    };

    const colorStyles: any = {
        indigo: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA] dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400',
        emerald: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857] dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400',
        rose: 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C] dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400',
        amber: 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309] dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400',
    };

    const exportColorStyles: any = {
        indigo: 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4338CA]',
        emerald: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857]',
        rose: 'bg-[#FFF1F2] border-[#FECDD3] text-[#BE123C]',
        amber: 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]',
    };

    const handleOpenExport = () => {
        tryPlaySound('open');
        setExportSelectedClient(globalClientFilter === 'Todos Clientes' ? 'Todos' : globalClientFilter);
        setIsExportModalOpen(true);
    };

    const handleRealDownload = async () => {
        tryPlaySound('tap');
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            tryPlaySound('success');
            setIsExportModalOpen(false);
        }, 1500);
    };

    const openEditSidebar = (evento: any = null) => {
        tryPlaySound('open');
        if (evento) {
            setEditingEvent(evento);
        } else {
            setEditingEvent({ id: Date.now(), day: 25, time: '09:00', title: '', client: '', color: 'indigo', status: 'EM ESPERA', rede: '', obs: '' });
        }
        setSidebarView('edit');
    };

    const openBancoSidebar = () => {
        tryPlaySound('open');
        setSidebarView('banco');
    };

    const closeSidebar = () => {
        tryPlaySound('close');
        setSidebarView(null);
        setEditingEvent(null);
    };

    const handleSaveEvent = () => {
        tryPlaySound('success');
        if (eventos.find(e => e.id === editingEvent.id)) {
            setEventos(eventos.map(e => e.id === editingEvent.id ? editingEvent : e));
        } else {
            setEventos([...eventos, editingEvent]);
        }
        closeSidebar();
    };

    const handleDeleteEvent = () => {
        tryPlaySound('close');
        setEventos(eventos.filter(e => e.id !== editingEvent.id));
        closeSidebar();
    };

    return (
        <div className={`${isDarkMode ? 'dark' : ''} h-screen overflow-hidden flex flex-col`}>
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 font-sans w-full bg-[#F8FAFC] dark:bg-[#0a0a0c] transition-colors relative">

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest relative z-10">
                        <div className="relative">
                            <button
                                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                className="flex items-center gap-2 hover:text-gray-800 dark:hover:text-white transition-colors ios-btn"
                            >
                                <Filter size={16} /> {globalClientFilter} <ChevronDown size={14} />
                            </button>
                            {isClientDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-50">
                                    {clientList.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => { tryPlaySound('tap'); setGlobalClientFilter(c as any); setIsClientDropdownOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="flex items-center gap-2 hover:text-gray-800 dark:hover:text-white transition-colors ios-btn ml-2" onClick={() => tryPlaySound('tap')}>
                            <Archive size={16} /> ARQUIVADOS
                        </button>
                        <button
                            onClick={handleOpenExport}
                            className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-[#111114] border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-white rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all ios-btn ml-2"
                        >
                            <Download size={14} /> EXPORTAR
                        </button>
                    </div>

                    <button
                        onClick={() => { tryPlaySound('tap'); setIsDarkMode(!isDarkMode); }}
                        className="p-2 bg-gray-200 dark:bg-zinc-800 rounded-full text-gray-700 dark:text-zinc-300 ios-btn"
                    >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

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
                                    onClick={() => { tryPlaySound('tap'); setActiveTab(tab); }}
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

                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={openBancoSidebar} className="flex items-center gap-2 px-6 py-3 bg-[#9CA3AF] dark:bg-zinc-700 hover:bg-gray-500 dark:hover:bg-zinc-600 text-white rounded-full text-xs font-bold uppercase tracking-wider transition-all ios-btn">
                            <Database size={16} /> BANCO DE CONTEÚDO
                        </button>
                        <button onClick={() => openEditSidebar(null)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(59,130,246,0.4)] transition-all ios-btn">
                            <Plus size={16} strokeWidth={3} /> NOVO CONTEÚDO
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-3 px-5 rounded-2xl shadow-sm max-w-[1400px]">
                    <div className="flex items-center gap-4">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors ios-btn" onClick={() => tryPlaySound('tap')}>
                            <ChevronLeft size={20} />
                        </button>
                        <h3 className="text-lg font-black text-[#0B1527] dark:text-white min-w-[150px] text-center uppercase tracking-tight">
                            {viewMode === 'month' ? currentMonth : '22 a 28 de Fev'}
                        </h3>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors ios-btn" onClick={() => tryPlaySound('tap')}>
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="flex bg-[#F8FAFC] dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-1 rounded-lg">
                        <button
                            onClick={() => { tryPlaySound('tap'); setViewMode('month'); }}
                            className={`px-5 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'month' ? 'bg-white dark:bg-zinc-800 text-[#0B1527] dark:text-white shadow-sm border border-gray-100 dark:border-zinc-700' : 'text-gray-500 dark:text-zinc-500 hover:text-[#0B1527] dark:hover:text-white'}`}
                        >
                            Mês
                        </button>
                        <button
                            onClick={() => { tryPlaySound('tap'); setViewMode('week'); }}
                            className={`px-5 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'week' ? 'bg-white dark:bg-zinc-800 text-[#0B1527] dark:text-white shadow-sm border border-gray-100 dark:border-zinc-700' : 'text-gray-500 dark:text-zinc-500 hover:text-[#0B1527] dark:hover:text-white'}`}
                        >
                            Semana
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-sm overflow-hidden flex flex-col max-w-[1400px]">
                    <div className="grid grid-cols-7 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111114]">
                        {diasSemana.map(dia => (
                            <div key={dia} className="py-5 text-center text-[11px] font-black text-[#0B1527] dark:text-zinc-300 uppercase tracking-widest border-r border-gray-200 dark:border-zinc-800 last:border-0">
                                {dia}
                            </div>
                        ))}
                    </div>

                    <div className={`grid grid-cols-7 bg-[#F8FAFC] dark:bg-[#0a0a0c] ${viewMode === 'month' ? 'auto-rows-[minmax(140px,auto)]' : 'auto-rows-[minmax(350px,auto)]'}`}>
                        {displayedDays.map((diaObj, idx) => {
                            const evts = getEventosDoDia(diaObj.day, diaObj.isNextMonth);
                            const isToday = diaObj.day === 25 && !diaObj.isNextMonth;

                            return (
                                <div
                                    key={idx}
                                    className={`p-2 border-r border-b border-gray-200 dark:border-zinc-800 transition-colors relative group ${diaObj.isNextMonth ? 'bg-gray-50/50 dark:bg-zinc-900/30 opacity-50' :
                                            isToday ? 'bg-[#EBF1FF] dark:bg-indigo-900/10' : 'bg-white dark:bg-[#111114] hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                                        }`}
                                >
                                    <div className="text-xs font-bold mb-3 flex justify-center mt-1">
                                        <span className={`w-8 h-6 flex items-center justify-center rounded-md ${isToday ? 'bg-blue-600 text-white dark:bg-indigo-600 font-black' : 'text-[#0B1527] dark:text-zinc-400'}`}>
                                            {diaObj.day}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {evts.map(evento => (
                                            <div
                                                key={evento.id}
                                                onClick={() => openEditSidebar(evento)}
                                                className={`p-2 rounded-lg border text-left cursor-pointer transition-transform hover:scale-[1.02] ios-btn ${colorStyles[evento.color]}`}
                                            >
                                                <div className="flex items-center gap-1 text-[9px] font-black uppercase mb-1 opacity-80">
                                                    <Clock size={10} strokeWidth={3} /> {evento.time}
                                                </div>
                                                <div className="text-[11px] font-bold leading-tight mb-2 line-clamp-2 text-[#0B1527] dark:text-white">
                                                    {evento.title}
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider opacity-90">
                                                    <User size={10} strokeWidth={2.5} /> {evento.client}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {sidebarView && (
                    <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm z-[90] transition-opacity animate-in fade-in" onClick={closeSidebar}></div>
                )}

                {/* SIDEBAR: EDIÇÃO DE CONTEÚDO */}
                <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-[#F8FAFC] dark:bg-[#111114] border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarView === 'edit' ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0a0a0c] flex justify-between items-center shrink-0">
                        <h3 className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Conteúdo do Planejamento</h3>
                        <button onClick={closeSidebar} className="p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-lg transition-colors bg-gray-100 dark:bg-zinc-900 ios-btn"><X size={16} /></button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
                        <div>
                            <textarea
                                rows={2} value={editingEvent?.title || ''} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} placeholder="NOVO CONTEÚDO"
                                className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl p-4 text-2xl font-black text-[#0B1527] dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none shadow-sm"
                            />
                        </div>
                        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5 shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Selecione...</label>
                                    <select className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-700 text-sm font-bold text-gray-800 dark:text-white pb-2 focus:outline-none appearance-none cursor-pointer"><option>Forno a Lenha</option><option>Agência Ekko</option></select>
                                    <ChevronDown size={14} className="absolute right-0 bottom-3 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Ideia</label>
                                    <select className="w-full bg-transparent border-b border-gray-300 dark:border-zinc-700 text-sm font-bold text-gray-800 dark:text-white pb-2 focus:outline-none appearance-none cursor-pointer"><option>Reels Viral</option><option>Carrossel Edu.</option></select>
                                    <ChevronDown size={14} className="absolute right-0 bottom-3 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Data</label>
                                    <input type="date" defaultValue="2026-02-25" className="w-full bg-white dark:bg-[#111114] border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Hora</label>
                                    <input type="time" value={editingEvent?.time || '09:00'} onChange={(e) => setEditingEvent({ ...editingEvent, time: e.target.value })} className="w-full bg-white dark:bg-[#111114] border border-gray-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 dark:text-white focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <select className="w-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-sm font-black text-gray-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none appearance-none cursor-pointer shadow-sm"><option>INSTAGRAM</option><option>LINKEDIN</option></select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select value={editingEvent?.status || 'EM ESPERA'} onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value })} className="w-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-sm font-black text-gray-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none appearance-none cursor-pointer shadow-sm">
                                    <option value="EM ESPERA">-- EM ESPERA --</option><option value="PRODUÇÃO">PRODUÇÃO</option><option value="AGUARDANDO APROVAÇÃO">AGUARDANDO APROVAÇÃO</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 block">Observações Táticas</label>
                            <textarea rows={4} value={editingEvent?.obs || ''} onChange={(e) => setEditingEvent({ ...editingEvent, obs: e.target.value })} className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-xl p-3 text-sm font-medium text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm" />
                        </div>
                    </div>
                    <div className="p-6 bg-white dark:bg-[#0a0a0c] border-t border-gray-200 dark:border-zinc-800 shrink-0">
                        <div className="flex gap-3 mb-4">
                            <button className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs font-black uppercase rounded-xl ios-btn text-gray-800 dark:text-zinc-200">Duplicar</button>
                            <button className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs font-black uppercase rounded-xl ios-btn text-gray-800 dark:text-zinc-200">Arquivar</button>
                            <button onClick={handleDeleteEvent} className="flex-1 py-2.5 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/50 text-rose-600 text-xs font-black uppercase rounded-xl ios-btn">Excluir</button>
                        </div>
                        <button onClick={handleSaveEvent} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-lg transition-all ios-btn flex items-center justify-center gap-2">
                            <Check size={18} /> Salvar Conteúdo
                        </button>
                    </div>
                </div>

                {/* SIDEBAR: BANCO DE CONTEÚDOS */}
                <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-[#111114] border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-[100] transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarView === 'banco' ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                        <h2 className="text-sm font-black text-[#0B1527] dark:text-white uppercase tracking-widest flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center"><FolderOpen size={16} strokeWidth={2.5} /></div>
                            Banco de Conteúdos
                        </h2>
                        <button onClick={closeSidebar} className="p-2 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-lg transition-colors ios-btn"><X size={20} /></button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-6 opacity-60">
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 mb-4"><FolderOpen size={24} /></div>
                        <p className="text-sm font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Nenhum Item Encontrado</p>
                    </div>
                </div>
            </div>

            {/* =========================================
          MODAL DE EXPORTAÇÃO
          ========================================= */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-8">
                    <div className="absolute inset-0 bg-gray-900/80 dark:bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => !isGenerating && setIsExportModalOpen(false)}></div>

                    <div className="relative w-full max-w-6xl max-h-[95vh] bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        <div className="px-6 py-4 bg-white dark:bg-[#111114] border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <ImageIcon className="text-blue-600" /> Pré-visualização da Exportação
                                </h2>
                            </div>
                            <button onClick={() => setIsExportModalOpen(false)} disabled={isGenerating} className="p-2 text-gray-400 hover:text-rose-500 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 ios-btn"><X size={20} /></button>
                        </div>

                        <div className="px-6 lg:px-10 pt-6 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-bold text-gray-700 dark:text-zinc-300">Exportar calendário de:</label>
                                <select
                                    value={exportSelectedClient} onChange={(e) => { tryPlaySound('tap'); setExportSelectedClient(e.target.value); }}
                                    className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-sm font-bold text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer shadow-sm min-w-[200px]"
                                >
                                    {clientList.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="p-6 lg:p-10 overflow-auto flex-1 flex justify-start lg:justify-center custom-scrollbar bg-gray-200/50 dark:bg-black/20">
                            <div id="export-canvas" className="w-[1920px] min-h-[1080px] h-fit bg-white shrink-0 flex flex-col relative shadow-sm">
                                <div className="px-16 py-14 flex justify-between items-start shrink-0 bg-white">
                                    <div className="flex items-center gap-6">
                                        <div className="w-3 h-20 bg-blue-600 rounded-full"></div>
                                        <div className="flex flex-col">
                                            <h1 className="text-[64px] font-black tracking-tighter text-[#0B1527] italic leading-none mb-4">
                                                PLANEJAMENTO
                                            </h1>
                                            <div className="flex items-center gap-4 text-base font-bold text-gray-500 uppercase tracking-widest">
                                                <span>Calendário de Conteúdo</span>
                                                <span className="text-gray-300">/</span>
                                                <span>{viewMode === 'month' ? currentMonth : '22 a 28 de Fev'}</span>
                                                <span className="text-gray-300">|</span>
                                                <span className="text-blue-600">{exportSelectedClient === 'Todos' ? 'Visão Geral' : `Cliente: ${exportSelectedClient}`}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-4 pt-2">
                                        <img src="/ekko-logo-ai.svg" alt="Agência Ekko" className="h-12 object-contain" />
                                        <span className="px-5 py-2 border border-gray-200 text-gray-500 text-xs font-black uppercase tracking-widest rounded-full">
                                            Studios Inteligentes
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 px-16 pb-16 flex flex-col">
                                    <div className="flex-1 border border-gray-200 rounded-[2rem] flex flex-col overflow-hidden bg-gray-200">
                                        <div className="grid grid-cols-7 bg-white border-b border-gray-200 shrink-0">
                                            {diasSemana.map(dia => (
                                                <div key={dia} className="py-6 text-center text-sm font-black text-gray-500 uppercase tracking-widest">
                                                    {dia}
                                                </div>
                                            ))}
                                        </div>
                                        <div className={`grid grid-cols-7 flex-1 gap-px bg-gray-200 ${viewMode === 'week' ? 'grid-rows-1' : 'auto-rows-[minmax(180px,auto)]'}`}>
                                            {exportDays.map((diaObj, idx) => {
                                                const evts = getEventosDoDia(diaObj.day, false).filter(e => exportSelectedClient === 'Todos' || e.client === exportSelectedClient);
                                                return (
                                                    <div key={idx} className={`p-4 flex flex-col bg-white h-full ${diaObj.isNextMonth ? 'opacity-40 bg-gray-50/50' : ''}`}>
                                                        <div className={`text-lg font-black text-right mb-4 ${evts.length > 0 ? 'text-[#0B1527]' : 'text-gray-300'}`}>
                                                            {diaObj.day}
                                                        </div>
                                                        <div className="space-y-3 flex-1">
                                                            {evts.map(evento => (
                                                                <div key={evento.id} className={`p-3.5 rounded-xl border flex flex-col gap-2 shadow-sm ${exportColorStyles[evento.color]}`}>
                                                                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80">
                                                                        <Clock size={14} strokeWidth={3} /> {evento.time}
                                                                    </div>
                                                                    <div className="text-[15px] font-black leading-tight text-[#0B1527] break-words line-clamp-3">
                                                                        {evento.title}
                                                                    </div>
                                                                    <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-90 bg-white/80 px-3 py-1.5 rounded-lg text-[#0B1527] w-full overflow-hidden">
                                                                        <User size={12} strokeWidth={2.5} className="shrink-0" />
                                                                        <span className="truncate w-full text-left">{evento.client}</span>
                                                                    </div>
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
                        </div>

                        <div className="px-6 py-4 bg-white dark:bg-[#111114] border-t border-gray-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Resolução de Saída: Automática (PNG Alta Qualidade)</p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsExportModalOpen(false)} disabled={isGenerating} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors disabled:opacity-50 ios-btn">Cancelar</button>
                                <button onClick={handleRealDownload} disabled={isGenerating} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-[0_4px_14px_rgba(59,130,246,0.3)] transition-all ios-btn w-56 justify-center">
                                    {isGenerating ? <span className="flex items-center gap-2 animate-pulse"><Clock size={16} className="animate-spin" /> Salvando PNG...</span> : <span className="flex items-center gap-2"><Download size={16} /> Baixar Imagem Segura</span>}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
