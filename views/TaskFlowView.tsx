import React, { useState, useMemo, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
    List, LayoutGrid, Calendar as LucideCalendar, Search, Filter,
    ArrowUpDown, Plus, Clock, MessageSquare, Box, ExternalLink,
    X, Trash2, Zap, LayoutDashboard, Image as ImageIcon, CheckCircle2, FileText, ShieldAlert, Eye, History as HistoryIcon, Loader2, User
} from 'lucide-react';
import { Card, Button, DeletionBar } from '../Components';
import { generateId } from '../utils/id';
import {
    VISOES_TAREFA_PADRAO as DEFAULT_TASK_VIEWS,
    STATUS_TAREFA_PADRAO as DEFAULT_TASK_STATUSES,
    OPCOES_PRIORIDADE as PRIORIDADE_OPTIONS
} from '../constants';
import {
    Tarefa, Cliente, Colaborador, ItemChecklistTarefa, AnexoTarefa
} from '../types';

interface TaskFlowViewProps {
    tasks: Tarefa[];
    clients: Cliente[];
    collaborators: Colaborador[];
    activeViewId: string;
    setActiveViewId: (id: string) => void;
    onUpdate: (id: string, table: string, field: string, value: any, silent?: boolean) => void;
    onDelete: (ids: string[], table: string) => void;
    onArchive: (ids: string[], table: string, archive: boolean) => void;
    onAdd: (table: string, initialData?: any) => void;
    onSelectTask: (taskId: string) => void;
    selection: string[];
    onSelect: (id: string) => void;
    onClearSelection: () => void;
}

export function TaskFlowView({
    tasks, clients, collaborators, activeViewId, setActiveViewId,
    onUpdate, onDelete, onArchive, onAdd, onSelectTask,
    selection, onSelect, onClearSelection
}: TaskFlowViewProps) {
    const [globalSearch, setGlobalSearch] = useState('');
    const filteredTasks = useMemo(() => tasks.filter((t: any) => (!globalSearch || t.Título.toLowerCase().includes(globalSearch.toLowerCase())) && t.Status !== 'arquivado'), [tasks, globalSearch]);

    const viewType = useMemo(() => DEFAULT_TASK_VIEWS.find(v => v.id === activeViewId)?.tipo || 'List', [activeViewId]);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getPriorityInfo = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'baixa': return { color: 'text-emerald-500 bg-emerald-500/10', icon: 'fa-flag' };
            case 'média':
            case 'media': return { color: 'text-amber-500 bg-amber-500/10', icon: 'fa-flag' };
            case 'alta': return { color: 'text-rose-500 bg-rose-500/10', icon: 'fa-flag' };
            case 'urgente': return { color: 'text-purple-500 bg-purple-500/10', icon: 'fa-bolt' };
            default: return { color: 'text-zinc-500 bg-zinc-500/10', icon: 'fa-flag' };
        }
    };

    return (
        <div className="flex flex-col h-full pointer-events-auto text-left">
            {/* TOP BAR */}
            <div className="px-6 py-4 border-b border-app-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-app-surface-2/50 backdrop-blur-md rounded-t-[32px] shrink-0">

                {/* View Toggles */}
                <div className="flex bg-app-bg border border-app-border rounded-lg p-1">
                    {DEFAULT_TASK_VIEWS.map((v: any) => (
                        <button
                            key={v.id}
                            onClick={() => setActiveViewId(v.id)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === v.id ? 'bg-app-surface text-app-text-strong shadow-lg border border-app-border' : 'text-app-text-muted hover:text-app-text-strong'}`}
                        >
                            {v.type === 'List' ? <List size={14} /> : v.type === 'Board' ? <LayoutGrid size={14} /> : <LucideCalendar size={14} />}
                            {v.name}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={16} />
                        <input
                            type="text"
                            value={globalSearch}
                            onChange={e => setGlobalSearch(e.target.value)}
                            placeholder="Filtro global..."
                            className="w-full h-10 !bg-app-bg !border-app-border !text-app-text-strong !placeholder-app-text-muted !rounded-xl !pl-10 text-[11px] font-bold uppercase tracking-widest"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border rounded-xl text-[10px] font-black uppercase text-app-text-muted hover:text-app-text-strong transition-all">
                            <Filter size={14} /> Filtros
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border rounded-xl text-[10px] font-black uppercase text-app-text-muted hover:text-app-text-strong transition-all">
                            <ArrowUpDown size={14} /> Ordenar
                        </button>
                    </div>

                    {/* Deletion Bar integration */}
                    <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'TAREFAS')} onArchive={() => onArchive(selection, 'TAREFAS', true)} onClear={onClearSelection} />
                    {/* New Task Button */}
                    <button
                        onClick={() => onAdd('TAREFAS')}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
                    >
                        <Plus size={16} /> Nova Tarefa
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden p-6 bg-app-bg/50 rounded-b-[32px]">

                {viewType === 'Board' && (
                    <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar-horizontal">
                        {DEFAULT_TASK_STATUSES.map(status => (
                            <div key={status.id} className="w-[320px] flex flex-col max-h-full shrink-0">
                                {/* Column Header */}
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.cor }} />
                                        <h3 className="text-[11px] font-black text-app-text-strong uppercase tracking-[0.2em]">{status.rotulo}</h3>
                                        <span className="text-[10px] font-black text-app-text-muted bg-app-surface-2 px-2 py-0.5 rounded-full">
                                            {filteredTasks.filter(t => t.Status === status.id).length}
                                        </span>
                                    </div>
                                    <button onClick={() => onAdd('TAREFAS', { Status: status.id })} className="text-app-text-muted hover:text-blue-500 transition-colors"><Plus size={16} /></button>
                                </div>

                                {/* Column Tasks Area */}
                                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2">
                                    {filteredTasks.filter(t => t.Status === status.id).map(task => {
                                        const client = clients.find((c: any) => c.id === task.Cliente_ID);
                                        const prio = getPriorityInfo(task.Prioridade);

                                        return (
                                            <div
                                                key={task.id} onClick={() => onSelectTask(task.id)}
                                                className={`bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500/30 cursor-pointer transition-all group flex flex-col gap-3 relative overflow-hidden ${selection.includes(task.id) ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}
                                            >
                                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: status.cor }} />

                                                {/* Top row: Client Tag & Priority */}
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-app-text-muted truncate max-w-[180px]">
                                                        {client?.Nome || 'Agência'}
                                                    </span>
                                                    <div className={`p-1 rounded flex items-center justify-center ${prio.color}`}>
                                                        <i className={`fa-solid ${prio.icon} text-[10px]`}></i>
                                                    </div>
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-sm font-bold text-app-text-strong leading-snug group-hover:text-blue-500 transition-colors uppercase tracking-tight">
                                                    {task.Título}
                                                </h4>

                                                {/* Bottom Row: Date, Comments, Assignee */}
                                                <div className="flex items-center justify-between mt-1 pt-3 border-t border-app-border/50">
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-app-text-muted uppercase tracking-tight">
                                                        <span className="flex items-center gap-1.5"><Clock size={12} /> {task.Data_Entrega || '--/--'}</span>
                                                        {task.Comentarios && task.Comentarios.length > 0 && <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {task.Comentarios.length}</span>}
                                                    </div>
                                                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-black border border-blue-500/20 group-hover:ring-4 group-hover:ring-blue-500/10 transition-all">
                                                        {task.Responsável?.slice(0, 1).toUpperCase() || '?'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <button
                                        onClick={() => onAdd('TAREFAS', { Status: status.id })}
                                        className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-black text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2 rounded-xl border border-dashed border-app-border hover:border-app-border-strong transition-all uppercase tracking-widest"
                                    >
                                        <Plus size={14} /> Adicionar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {viewType === 'List' && (
                    <div className="h-full overflow-y-auto custom-scrollbar pb-32 space-y-6">
                        {DEFAULT_TASK_STATUSES.map(status => {
                            const statusTasks = filteredTasks.filter(t => t.Status === status.id);
                            if (statusTasks.length === 0) return null;

                            return (
                                <div key={status.id} className="space-y-3">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.cor }} />
                                        <h3 className="text-[11px] font-black text-app-text-strong uppercase tracking-[0.2em]">{status.rotulo}</h3>
                                        <span className="text-[10px] font-black text-app-text-muted bg-app-surface-2 px-2 py-0.5 rounded-full">{statusTasks.length}</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {statusTasks.map(task => {
                                            const client = clients.find((c: any) => c.id === task.Cliente_ID);
                                            const prio = getPriorityInfo(task.Prioridade);
                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => onSelectTask(task.id)}
                                                    className={`flex items-center gap-6 p-4 bg-app-surface border border-app-border rounded-2xl hover:border-blue-500/50 cursor-pointer transition-all group ${selection.includes(task.id) ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}
                                                >
                                                    <div className="flex items-center justify-center w-5 h-5 rounded border border-app-border group-hover:border-blue-500/50 bg-app-bg transition-all" onClick={e => { e.stopPropagation(); onSelect(task.id); }}>
                                                        <input type="checkbox" checked={selection.includes(task.id)} readOnly className="w-3 h-3 text-blue-500 rounded focus:ring-0 bg-transparent border-none" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-[9px] font-black text-app-text-muted uppercase tracking-widest block mb-1 leading-none">{client?.Nome || 'Agência'}</span>
                                                        <h5 className="text-sm font-bold text-app-text-strong uppercase truncate group-hover:text-blue-500 transition-colors">{task.Título}</h5>
                                                    </div>

                                                    <div className="flex items-center gap-10 shrink-0">
                                                        <div className="flex items-center gap-2 w-28">
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prio.color}`}>
                                                                <i className={`fa-solid ${prio.icon} text-[10px]`}></i>
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase text-app-text-muted tracking-tight">{task.Prioridade}</span>
                                                        </div>

                                                        <div className="flex items-center gap-3 w-32 border-l border-app-border/50 pl-6">
                                                            <Clock size={12} className="text-app-text-muted" />
                                                            <span className="text-[10px] font-black uppercase text-app-text-muted tracking-tight">{task.Data_Entrega || '--/--'}</span>
                                                        </div>

                                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-black border border-blue-500/20">
                                                            {task.Responsável?.slice(0, 1).toUpperCase() || '?'}
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
                )}

                {viewType === 'Calendar' && (
                    <div className="h-full bg-app-surface/30 border border-app-border rounded-[32px] p-8 shadow-2xl overflow-hidden relative">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
                            initialView={isMobile ? "listWeek" : "dayGridMonth"}
                            events={filteredTasks.filter(t => t.Data_Entrega).map(t => {
                                const client = clients.find((c: any) => c.id === t.Cliente_ID);
                                return {
                                    id: t.id,
                                    title: t.Título,
                                    start: t.Data_Entrega + (t.Hora_Entrega ? `T${t.Hora_Entrega}` : ''),
                                    backgroundColor: client?.['Cor (HEX)'] || '#3B82F6',
                                    borderColor: 'transparent',
                                    extendedProps: { ...t, clientName: client?.Nome || 'Agência' }
                                };
                            })}
                            height="100%"
                            locale="pt-br"
                            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
                            dayMaxEvents={3}
                            eventClick={(info) => onSelectTask(info.event.id)}
                            editable={true}
                            eventDrop={(info) => {
                                onUpdate(info.event.id, 'TAREFAS', 'Data_Entrega', info.event.startStr.split('T')[0]);
                                if (info.event.startStr.includes('T')) {
                                    onUpdate(info.event.id, 'TAREFAS', 'Hora_Entrega', info.event.startStr.split('T')[1].slice(0, 5));
                                }
                            }}
                            eventContent={(eventInfo) => {
                                const ep = eventInfo.event.extendedProps;
                                const bgColor = eventInfo.event.backgroundColor || '#3B82F6';
                                const isDone = ep.Status === 'done';

                                return (
                                    <div className={`p-2 rounded-xl border border-app-border bg-app-surface/90 hover:border-blue-500 cursor-pointer transition-all relative overflow-hidden group/event w-full h-full shadow-sm ${isDone ? 'opacity-50' : ''}`}>
                                        <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-xl" style={{ backgroundColor: bgColor }} />

                                        <div className="flex justify-between items-center mb-1 pl-1.5">
                                            <span className="flex items-center gap-1 text-[9px] text-app-text-muted font-bold uppercase tracking-tight">
                                                <Clock size={10} /> {ep.Hora_Entrega || '--:--'}
                                            </span>
                                        </div>

                                        <div className="pl-1.5">
                                            <p className={`text-[11px] font-bold leading-tight truncate uppercase ${isDone ? 'text-app-text-muted line-through' : 'text-app-text-strong'}`}>
                                                {eventInfo.event.title}
                                            </p>
                                            <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest mt-1 truncate">
                                                {ep.clientName}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar-horizontal::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar-horizontal:hover::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); }
      `}} />
        </div>
    );
}

interface TaskDetailPanelProps {
    taskId: string;
    tasks: Tarefa[];
    clients: Cliente[];
    collaborators: Colaborador[];
    onClose: () => void;
    onUpdate: (id: string, table: string, field: string, value: any, silent?: boolean) => void;
    onArchive: (ids: string[], table: string, archive: boolean) => void;
    onDelete: (ids: string[], table: string) => void;
    onAdd: (table: string, initialData?: any) => void;
    viewMode: 'sidebar' | 'modal';
    setViewMode: (mode: 'sidebar' | 'modal') => void;
}

export function TaskDetailPanel({
    taskId, tasks, clients, collaborators, onClose,
    onUpdate, onArchive, onDelete, onAdd,
    viewMode, setViewMode
}: TaskDetailPanelProps) {
    const t = tasks.find((task: Tarefa) => task.id === taskId);
    const [newCheckItem, setNewCheckItem] = useState('');
    const [uploading, setUploading] = useState(false);
    const [comment, setComment] = useState('');
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!t) return null;

    const updateChecklist = (items: ItemChecklistTarefa[]) => onUpdate(t.id, 'TAREFAS', 'Checklist', items);
    const updateAttachments = (anexos: AnexoTarefa[]) => onUpdate(t.id, 'TAREFAS', 'Anexos', anexos);

    const processFiles = async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;
        setUploading(true);
        const newAnexos = [...(t.Anexos || [])];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.size > 20 * 1024 * 1024) {
                    alert(`Arquivo ${file.name} excede o limite de 20MB.`);
                    continue;
                }

                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                newAnexos.push({
                    id: generateId(),
                    nomeArquivo: file.name,
                    tipoMime: file.type,
                    tamanho: file.size,
                    dados: base64,
                    criadoEm: new Date().toISOString()
                });
            }
            updateAttachments(newAnexos);
        } catch (err) {
            console.error(err);
            alert("Falha no upload de alguns arquivos.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) processFiles(e.target.files);
    };

    const handleAddComment = () => {
        if (!comment.trim()) return;
        const newComment = {
            id: generateId(),
            Task_ID: t.id,
            Autor: 'Você',
            Texto: comment,
            Data: new Date().toISOString()
        };
        onUpdate(t.id, 'TAREFAS', 'Comentarios', [...(t.Comentarios || []), newComment]);

        // Also log as activity
        const newActivity = {
            id: generateId(),
            tipo: 'comment',
            usuario: 'Você',
            mensagem: `Comentou: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
            timestamp: new Date().toISOString()
        };
        onUpdate(t.id, 'TAREFAS', 'Atividades', [...(t.Atividades || []), newActivity]);

        setComment('');
    };

    const client = clients.find((c: any) => c.id === t.Cliente_ID);

    return (
        <div className="flex flex-col h-full bg-app-surface text-left overflow-hidden">
            {/* PANEL HEADER */}
            <div className="h-20 px-8 border-b border-app-border flex items-center justify-between bg-app-surface-2/30">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Box size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] mb-0.5 leading-none">
                            {client?.Nome || 'Agência'} • {t.Task_ID}
                        </div>
                        <h3 className="text-sm font-black text-app-text-strong uppercase tracking-tight">Detalhes de Tarefa</h3>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* View Modes */}
                    <div className="flex bg-app-bg p-1 rounded-lg border border-app-border mr-2 hidden md:flex">
                        <button onClick={() => setViewMode('sidebar')} className={`p-1.5 rounded transition-all ${viewMode === 'sidebar' ? 'bg-app-surface text-blue-500 shadow-sm' : 'text-app-text-muted hover:text-app-text-strong'}`}><LayoutGrid size={14} /></button>
                        <button onClick={() => setViewMode('modal')} className={`p-1.5 rounded transition-all ${viewMode === 'modal' ? 'bg-app-surface text-blue-500 shadow-sm' : 'text-app-text-muted hover:text-app-text-strong'}`}><ExternalLink size={14} /></button>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-xl bg-app-bg border border-app-border flex items-center justify-center text-app-text-muted hover:text-app-text-strong hover:border-app-border-strong transition-all">
                        <X size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
                {/* TASK TITLE */}
                <section>
                    <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] block mb-3 ml-1">Título</label>
                    <input
                        className="w-full text-2xl font-black text-app-text-strong bg-transparent border-none p-0 focus:ring-0 uppercase tracking-tight placeholder-app-text-muted/30"
                        value={t.Título}
                        onChange={e => onUpdate(t.id, 'TAREFAS', 'Título', e.target.value, true)}
                        onBlur={e => onUpdate(t.id, 'TAREFAS', 'Título', e.target.value)}
                        placeholder="NOME DA TAREFA"
                    />
                </section>

                {/* METRICS GRID */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex flex-col gap-1 hover:border-blue-500/30 transition-colors">
                        <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <HistoryIcon size={10} className="text-blue-500" /> Status
                        </label>
                        <select
                            value={t.Status}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Status', e.target.value)}
                            className="bg-transparent border-none text-[11px] font-bold text-app-text-strong uppercase focus:ring-0 p-0 cursor-pointer"
                        >
                            {DEFAULT_TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.rotulo}</option>)}
                        </select>
                    </div>
                    <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex flex-col gap-1 hover:border-rose-500/30 transition-colors">
                        <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <ShieldAlert size={10} className="text-rose-500" /> Prioridade
                        </label>
                        <select
                            value={t.Prioridade}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Prioridade', e.target.value)}
                            className="bg-transparent border-none text-[11px] font-bold text-app-text-strong uppercase focus:ring-0 p-0 cursor-pointer"
                        >
                            {PRIORIDADE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex flex-col gap-1 hover:border-emerald-500/30 transition-colors">
                        <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <User size={10} className="text-emerald-500" /> Responsável
                        </label>
                        <select
                            value={t.Responsável}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Responsável', e.target.value)}
                            className="bg-transparent border-none text-[11px] font-bold text-app-text-strong uppercase focus:ring-0 p-0 cursor-pointer"
                        >
                            <option value="">Sem Resp.</option>
                            {collaborators.map((c: any) => <option key={c.id} value={c.Nome}>{c.Nome}</option>)}
                        </select>
                    </div>
                    <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex flex-col gap-1 hover:border-indigo-500/30 transition-colors">
                        <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <Clock size={10} className="text-indigo-500" /> Entrega
                        </label>
                        <input
                            type="date"
                            value={t.Data_Entrega || ''}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Data_Entrega', e.target.value)}
                            className="bg-transparent border-none text-[11px] font-bold text-app-text-strong uppercase focus:ring-0 p-0 cursor-pointer"
                        />
                    </div>
                </div>

                {/* DESCRIPTION */}
                <section>
                    <div className="flex items-center justify-between mb-4 border-b border-app-border pb-2">
                        <h4 className="text-[10px] font-black uppercase text-app-text-strong tracking-[0.2em] flex items-center gap-2">
                            <FileText size={14} className="text-blue-500" /> Descrição Estratégica
                        </h4>
                    </div>
                    <textarea
                        className="w-full h-32 bg-app-bg border border-app-border rounded-2xl p-5 text-[11px] font-bold text-app-text-strong uppercase leading-relaxed outline-none focus:border-blue-500/50 transition-all custom-scrollbar placeholder-app-text-muted/20"
                        value={t.Descrição || ''}
                        onChange={e => onUpdate(t.id, 'TAREFAS', 'Descrição', e.target.value, true)}
                        onBlur={e => onUpdate(t.id, 'TAREFAS', 'Descrição', e.target.value)}
                        placeholder="DESCREVA OS DETALHES TÁTICOS, LINKS E PAUTAS..."
                    />
                </section>

                {/* CHECKLIST */}
                <section>
                    <div className="flex items-center justify-between mb-6 border-b border-app-border pb-2">
                        <h4 className="text-[10px] font-black uppercase text-app-text-strong tracking-[0.2em] flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500" /> Etapas de Execução
                        </h4>
                        <span className="text-[10px] font-black text-app-text-muted bg-app-surface-2 px-3 py-1 rounded-full uppercase tracking-widest">
                            {t.Checklist?.filter(i => i.concluido).length || 0} / {t.Checklist?.length || 0}
                        </span>
                    </div>
                    <div className="space-y-4 px-2">
                        {t.Checklist?.map(item => (
                            <div key={item.id} className="flex items-center gap-4 group">
                                <button
                                    onClick={() => updateChecklist(t.Checklist.map(i => i.id === item.id ? { ...i, concluido: !i.concluido } : i))}
                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.concluido ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-app-border bg-app-bg text-transparent'}`}
                                >
                                    <Plus size={14} className={item.concluido ? 'rotate-45' : ''} />
                                </button>
                                <span className={`text-[11px] font-black uppercase tracking-tight transition-all flex-1 ${item.concluido ? 'opacity-30 line-through' : 'text-app-text-strong'}`}>
                                    {item.texto}
                                </span>
                                <button onClick={() => updateChecklist(t.Checklist.filter(i => i.id !== item.id))} className="opacity-0 group-hover:opacity-100 text-app-text-muted hover:text-rose-500 transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        <div className="flex gap-3 pt-2">
                            <input
                                value={newCheckItem}
                                onChange={e => setNewCheckItem(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (() => { if (!newCheckItem.trim()) return; updateChecklist([...(t.Checklist || []), { id: generateId(), texto: newCheckItem.toUpperCase(), concluido: false }]); setNewCheckItem(''); })()}
                                placeholder="NOVA ETAPA..."
                                className="flex-1 h-11 bg-app-bg border border-app-border rounded-xl px-4 text-[11px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all"
                            />
                            <button
                                onClick={() => { if (!newCheckItem.trim()) return; updateChecklist([...(t.Checklist || []), { id: generateId(), texto: newCheckItem.toUpperCase(), concluido: false }]); setNewCheckItem(''); }}
                                className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ATTACHMENTS */}
                <section>
                    <div className="flex items-center justify-between mb-6 border-b border-app-border pb-2">
                        <h4 className="text-[10px] font-black uppercase text-app-text-strong tracking-[0.2em] flex items-center gap-2">
                            <ImageIcon size={14} className="text-orange-500" /> Ativos e Mídia
                        </h4>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-2"
                        >
                            {uploading ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Upload</>}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {(t.Anexos || []).map(file => (
                            <div key={file.id} className="group relative aspect-video rounded-2xl overflow-hidden bg-app-bg border border-app-border hover:border-blue-500/30 transition-all">
                                <img src={file.dados} alt={file.nomeArquivo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                                    <button onClick={() => setLightboxImage(file.dados)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all"><Eye size={18} /></button>
                                    <button onClick={() => updateAttachments((t.Anexos || []).filter(a => a.id !== file.id))} className="w-10 h-10 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center backdrop-blur-md transition-all"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                        {(!t.Anexos || t.Anexos.length === 0) && (
                            <div className="col-span-2 border-2 border-dashed border-app-border rounded-3xl py-12 flex flex-col items-center justify-center gap-4 text-app-text-muted group hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-14 h-14 rounded-full bg-app-bg flex items-center justify-center border border-app-border group-hover:scale-110 transition-transform"><ImageIcon size={24} /></div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Arraste Ativos Aqui</p>
                                    <p className="text-[8px] font-bold uppercase opacity-50 mt-1">Imagens até 20MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ACTIVITY & COMMENTS */}
                <section className="space-y-6 pt-4 border-t border-app-border">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase text-app-text-strong tracking-[0.2em] flex items-center gap-2">
                            <MessageSquare size={14} className="text-purple-500" /> Atividade e Timeline
                        </h4>
                    </div>

                    <div className="space-y-6">
                        {(t.Atividades || []).map(act => (
                            <div key={act.id} className="flex gap-4 group">
                                <div className="w-8 h-8 rounded-xl bg-app-bg border border-app-border flex items-center justify-center shrink-0">
                                    {act.tipo === 'comment' ? <MessageSquare size={12} className="text-purple-500" /> : <Zap size={12} className="text-blue-500" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="text-[10px] font-black text-app-text-strong uppercase tracking-tight">{act.usuario}</span>
                                        <span className="text-[8px] font-bold text-app-text-muted uppercase">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-app-text-muted leading-relaxed uppercase tracking-tight">{act.mensagem}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 mt-6">
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="ESCREVA UM COMENTÁRIO..."
                            className="w-full bg-app-bg border border-app-border rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest placeholder-app-text-muted/30 outline-none focus:border-purple-500/50 transition-all min-h-[80px]"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleAddComment}
                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/10"
                            >
                                Publicar Comentário
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="px-8 py-6 border-t border-app-border bg-app-surface-2/30 flex gap-3">
                <button
                    onClick={() => { onArchive([t.id], 'TAREFAS', !t.__arquivado); onClose(); }}
                    className="flex-1 h-12 rounded-xl border border-app-border bg-app-bg text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <Box size={16} /> {t.__arquivado ? 'RESTAURAR' : 'ARQUIVAR'}
                </button>
                <button
                    onClick={() => { if (window.confirm("EXCLUIR DEFINITIVAMENTE?")) { onDelete([t.id], 'TAREFAS'); onClose(); } }}
                    className="flex-1 h-12 rounded-xl border border-app-border bg-app-bg text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <Trash2 size={16} /> EXCLUIR
                </button>
                <button
                    onClick={onClose}
                    className="flex-[1.5] h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10"
                >
                    <CheckCircle2 size={16} /> FINALIZAR
                </button>
            </div>

            {/* LIGHTBOX */}
            {lightboxImage && (
                <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-10 animate-fade" onClick={() => setLightboxImage(null)}>
                    <button className="absolute top-10 right-10 text-white opacity-50 hover:opacity-100 transition-opacity"><X size={32} /></button>
                    <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}

