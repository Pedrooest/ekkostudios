
import React, { useState, useEffect, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
    Clock, Share2, Video, Image as ImageIcon, FileText,
    Plus, X
} from 'lucide-react';
import { ContentBankSidebar } from '../ContentBankSidebar';
import { Button, Badge, InputSelect } from '../Components';
import { playUISound } from '../utils/uiSounds';
import {
    OPCOES_STATUS_PLANEJAMENTO,
    REDES_SOCIAIS_RDC,
    FORMATOS_RDC
} from '../constants';

interface PlanningViewProps {
    data: any[];
    clients: any[];
    onUpdate: (id: string, table: any, field: string, value: any) => void;
    onAdd: (table: any, initialData?: any) => void;
    rdc: any[];
    matriz: any[];
    cobo: any[];
    tasks: any[];
    iaHistory: any[];
    setActiveTab: (tab: any) => void;
    performArchive: (ids: string[], table: any, archived: boolean) => void;
    performDelete: (ids: string[], table: any) => void;
    library?: any;
}

export function PlanningView({
    data, clients, onUpdate, onAdd, rdc, matriz, cobo,
    tasks, iaHistory, setActiveTab, performArchive, performDelete, library
}: PlanningViewProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const selectedEvent = useMemo(() => data.find((e: any) => e.id === selectedEventId), [data, selectedEventId]);

    const filteredData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        if (filterStatus === 'All') return data;
        return data.filter((p: any) => p['Status do conteúdo'] === filterStatus);
    }, [data, filterStatus]);

    const bankItems = useMemo(() => {
        const res: any[] = [];
        (rdc || []).forEach((r: any) => res.push({ ...r, _source: 'RDC', _label: r['Ideia de Conteúdo'] }));
        (matriz || []).forEach((m: any) => res.push({ ...m, _source: 'MATRIZ', _label: m['Papel estratégico'] || m['Tipo de conteúdo'] }));
        (tasks || []).forEach((t: any) => res.push({ ...t, _source: 'TAREFAS', _label: t.Título }));
        (iaHistory || []).forEach((h: any) => { if (h.type === 'BRIEFING') res.push({ ...h, _source: 'ORGANICKIA', _label: `IA: ${h.clientName}` }); });
        return res;
    }, [rdc, matriz, tasks, iaHistory]);

    const handleImport = (item: any) => {
        onAdd('PLANEJAMENTO', {
            Cliente_ID: item.Cliente_ID || 'GERAL',
            Conteúdo: item._label,
            Fonte_Origem: item._source,
            Origem_ID: item.id
        });
    };

    return (
        <div className="flex flex-col lg:flex-row lg:h-full h-auto gap-6 animate-fade text-left relative lg:overflow-hidden overflow-visible">
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-fade" onClick={() => setIsSidebarOpen(false)}></div>
            )}
            <div className="flex-1 transition-all duration-500 h-full flex flex-col min-w-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-app-surface/40 p-4 md:p-8 rounded-2xl md:rounded-[32px] border border-white/5 backdrop-blur-md">
                    <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-app-text-strong">Planejamento Estratégico</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {['All', ...OPCOES_STATUS_PLANEJAMENTO].map(s => (
                                <button
                                    key={s}
                                    onClick={() => { playUISound('tap'); setFilterStatus(s); }}
                                    className={`ios-btn px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${filterStatus === s ? 'bg-blue-600 border-blue-500 text-app-text-strong shadow-lg shadow-blue-900/40' : 'bg-app-bg/60 border-white/5 text-app-text-muted hover:text-gray-300 hover:border-white/10'}`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 self-end lg:self-center">
                        <button
                            onClick={() => { playUISound('tap'); setIsSidebarOpen(!isSidebarOpen); }}
                            className={`ios-btn flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 relative z-[60] ${isSidebarOpen ? 'bg-blue-600/10 border-blue-500 text-blue-500' : 'bg-gray-800/40 border-white/5 text-app-text-muted hover:text-app-text-strong hover:border-white/10'}`}
                        >
                            <i className={`fa-solid ${isSidebarOpen ? 'fa-eye-slash' : 'fa-database'}`}></i>
                            {isSidebarOpen ? 'Esconder Banco' : 'Banco de Conteúdo'}
                        </button>
                        <Button
                            onClick={() => onAdd('PLANEJAMENTO')}
                            className="hidden lg:flex !px-6 !py-3 !rounded-2xl !bg-gradient-to-r !from-blue-600 !to-indigo-700 !shadow-xl !shadow-blue-900/20"
                        >
                            <i className="fa-solid fa-plus mr-2"></i>
                            Novo Conteúdo
                        </Button>
                    </div>
                </div>
                <div className="flex-1 bg-app-surface/30 border border-app-border rounded-[32px] p-5 md:p-8 shadow-2xl md:overflow-y-auto min-h-[100dvh] lg:min-h-0 relative pb-[calc(160px+env(safe-area-inset-bottom))] md:pb-8">
                    <FullCalendar
                        plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
                        initialView={window.innerWidth < 1024 ? "listWeek" : "dayGridMonth"}
                        events={filteredData.map((p: any) => {
                            const Cliente = clients.find((c: any) => c.id === p.Cliente_ID);
                            return {
                                id: p.id,
                                title: p.Conteúdo,
                                start: p.Data + (p.Hora ? `T${p.Hora}` : ''),
                                backgroundColor: Cliente?.['Cor (HEX)'] || '#3B82F6',
                                borderColor: 'transparent',
                                extendedProps: { ...p, clientName: Cliente?.Nome || 'Geral' }
                            };
                        })}
                        height="auto"
                        contentHeight="auto"
                        handleWindowResize={true}
                        locale="pt-br"
                        headerToolbar={{
                            left: isMobile ? 'prev,next' : 'prev,next today',
                            center: 'title',
                            right: isMobile ? 'today' : 'dayGridMonth,listWeek'
                        }}
                        eventContent={(eventInfo) => {
                            const p = eventInfo.event.extendedProps;
                            const bgColor = eventInfo.event.backgroundColor || '#3B82F6';
                            const isDone = p['Status do conteúdo'] === 'Concluído';

                            const getIcon = (item: any) => {
                                const type = item['Formato'];
                                if (type?.toLowerCase().includes('video') || type?.toLowerCase().includes('reels')) return <Video size={10} />;
                                if (type?.toLowerCase().includes('imagem') || type?.toLowerCase().includes('foto')) return <ImageIcon size={10} />;
                                if (type?.toLowerCase().includes('texto') || type?.toLowerCase().includes('artigo')) return <FileText size={10} />;
                                return <Share2 size={10} />;
                            };

                            return (
                                <div className={`p-1.5 md:p-2 rounded-lg border border-app-border bg-app-surface/90 hover:border-accent cursor-pointer transition-all relative overflow-hidden group/event w-full h-full shadow-sm ${isDone ? 'opacity-50' : ''}`}>
                                    <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full" style={{ backgroundColor: bgColor }} />

                                    <div className="flex justify-between items-center mb-1 pl-1.5">
                                        <span className="flex items-center gap-1 text-[8px] md:text-[9px] text-app-text-muted font-mono">
                                            <Clock size={8} className="text-app-text-muted" /> {p.Hora || '--:--'}
                                        </span>
                                        <div className="flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] bg-accent/10 text-accent">
                                            {getIcon(p)}
                                        </div>
                                    </div>

                                    <div className="pl-1.5">
                                        <p className={`text-[10px] md:text-xs font-bold leading-tight truncate ${isDone ? 'text-app-text-muted line-through' : 'text-app-text-strong'}`}>
                                            {eventInfo.event.title}
                                        </p>
                                        <p className="text-[8px] md:text-[9px] text-app-text-muted uppercase tracking-widest mt-1 truncate">
                                            {p.clientName}
                                        </p>
                                    </div>
                                </div>
                            );
                        }}
                        buttonText={{
                            today: 'Hoje',
                            month: 'Mês',
                            week: 'Semana',
                            day: 'Dia',
                            list: 'Lista'
                        }}
                        dayMaxEvents={3}
                        eventClick={(info) => setSelectedEventId(info.event.id)}
                        editable={true}
                        eventDrop={(info) => {
                            onUpdate(info.event.id, 'PLANEJAMENTO', 'Data', info.event.startStr.split('T')[0]);
                            if (info.event.startStr.includes('T')) onUpdate(info.event.id, 'PLANEJAMENTO', 'Hora', info.event.startStr.split('T')[1].slice(0, 5));
                        }}
                    />
                </div>
            </div>

            <ContentBankSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                bankItems={bankItems}
                onImport={handleImport}
                onUpdate={(id, source, field, value) => {
                    const tableMap: Record<string, string> = {
                        'RDC': 'RDC',
                        'MATRIZ': 'MATRIZ',
                        'TAREFAS': 'TAREFAS',
                        'ORGANICKIA': 'IA_HISTORY'
                    };
                    onUpdate(id, tableMap[source] as any, field, value);
                }}
                onDelete={(id, source) => {
                    const tableMap: Record<string, string> = {
                        'RDC': 'RDC',
                        'MATRIZ': 'MATRIZ',
                        'TAREFAS': 'TAREFAS',
                        'ORGANICKIA': 'IA_HISTORY'
                    };
                    performDelete([id], tableMap[source] as any);
                }}
            />

            {selectedEvent && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-app-surface-2 border-l border-app-border shadow-2xl z-[100] animate-fade flex flex-col pointer-events-auto">
                    <div className="h-16 flex items-center justify-between px-8 border-b border-app-border bg-app-surface">
                        <div className="flex items-center gap-3">
                            <Badge color="blue">EDIÇÃO</Badge>
                            <span className="text-[10px] font-black uppercase text-[#3B82F6]">{clients.find((c: any) => c.id === selectedEvent.Cliente_ID)?.Nome || 'Geral'}</span>
                        </div>
                        <button onClick={() => setSelectedEventId(null)} className="text-app-text-muted hover:text-app-text-strong transition-all"><i className="fa-solid fa-xmark text-xl"></i></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        <section>
                            <label className="text-[9px] font-black uppercase text-[#334155] block mb-2 tracking-widest">Conteúdo do Planejamento</label>
                            <textarea className="text-xl font-black text-app-text-strong bg-transparent border-none p-0 w-full focus:ring-0 uppercase tracking-tighter min-h-[60px]" value={selectedEvent.Conteúdo} onChange={e => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Conteúdo', e.target.value)} />
                        </section>

                        <div className="grid grid-cols-2 gap-6 bg-app-surface p-6 rounded-2xl border border-app-border">
                            <div>
                                <InputSelect
                                    value={selectedEvent.Cliente_ID}
                                    onChange={(val) => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Cliente_ID', val)}
                                    options={[{ value: 'GERAL', label: 'Geral' }, ...clients.map((c: any) => ({ value: c.id, label: c.Nome }))]}
                                    className="w-full text-[11px] font-bold uppercase bg-transparent text-app-text-strong"
                                    label="Cliente"
                                    placeholder="Selecione..."
                                />
                            </div>
                            <div>
                                <InputSelect
                                    value={selectedEvent['Status do conteúdo']}
                                    onChange={(val) => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Status do conteúdo', val)}
                                    options={OPCOES_STATUS_PLANEJAMENTO.map(s => ({ value: s, label: s }))}
                                    className="w-full text-[11px] font-bold uppercase bg-transparent text-app-text-strong"
                                    label="Status"
                                    placeholder="Selecione..."
                                />
                            </div>
                            <div><label className="text-[9px] font-black text-[#334155] uppercase block mb-1">Data</label><input type="date" className="w-full text-[11px] font-bold bg-transparent text-app-text-strong" value={selectedEvent.Data} onChange={e => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Data', e.target.value)} /></div>
                            <div><label className="text-[9px] font-black text-[#334155] uppercase block mb-1">Hora</label><input type="time" className="w-full text-[11px] font-bold bg-transparent text-app-text-strong" value={selectedEvent.Hora} onChange={e => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Hora', e.target.value)} /></div>
                        </div>

                        <section className="space-y-4">
                            <div>
                                <InputSelect
                                    value={selectedEvent.Rede_Social}
                                    onChange={(val) => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Rede_Social', val)}
                                    options={REDES_SOCIAIS_RDC.map(opt => ({ value: opt, label: opt }))}
                                    className="w-full text-[11px] font-bold uppercase bg-transparent text-app-text-strong border-b border-app-border pb-2"
                                    label="Canal/Rede"
                                    placeholder="Selecione..."
                                />
                            </div>
                            <div>
                                <InputSelect
                                    value={selectedEvent['Tipo de conteúdo']}
                                    onChange={(val) => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Tipo de conteúdo', val)}
                                    options={(FORMATOS_RDC[selectedEvent.Rede_Social] || []).map(opt => ({ value: opt, label: opt }))}
                                    className="w-full text-[11px] font-bold uppercase bg-transparent text-app-text-strong border-b border-app-border pb-2"
                                    label="Tipo/Formato"
                                    placeholder="-- Selecione --"
                                />
                            </div>
                        </section>

                        <section>
                            <label className="text-[9px] font-black text-[#3B82F6] uppercase block mb-2 tracking-widest">Observações Táticas</label>
                            <textarea className="w-full h-32 bg-app-bg border border-app-border rounded-xl p-4 text-[10px] text-gray-300 font-bold uppercase leading-relaxed outline-none focus:border-blue-500/50" value={selectedEvent.Observações || ''} onChange={e => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Observações', e.target.value)} placeholder="..." />
                        </section>

                        {selectedEvent.Fonte_Origem && (
                            <section className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
                                <div>
                                    <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Origem Conectada</span>
                                    <p className="text-[10px] font-bold text-app-text-strong uppercase">{selectedEvent.Fonte_Origem} #{selectedEvent.Origem_ID?.slice(0, 5)}</p>
                                </div>
                                <Button variant="secondary" className="!h-8 !px-4 !text-[8px]" onClick={() => { setActiveTab(selectedEvent.Fonte_Origem); setSelectedEventId(null); }}>Abrir Origem</Button>
                            </section>
                        )}
                    </div>
                    <div className="p-8 border-t border-app-border bg-app-surface flex gap-4">
                        <Button variant="secondary" className="flex-1" onClick={() => { onAdd('PLANEJAMENTO', { ...selectedEvent, id: Math.random().toString(36).substr(2, 9), Conteúdo: `${selectedEvent.Conteúdo} (Cópia)` }); setSelectedEventId(null); }}>Duplicar</Button>
                        <Button variant="secondary" className="flex-1" onClick={() => { performArchive([selectedEvent.id], 'PLANEJAMENTO', !selectedEvent.__archived); setSelectedEventId(null); }}>Arquivar</Button>
                        <Button variant="danger" className="flex-1" onClick={() => { performDelete([selectedEvent.id], 'PLANEJAMENTO'); setSelectedEventId(null); }}>Excluir</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
