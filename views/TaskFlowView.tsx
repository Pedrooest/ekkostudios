import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragOverlay, defaultDropAnimationSideEffects, useDroppable
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    List, LayoutGrid, Calendar as LucideCalendar, Search, Filter,
    ArrowUpDown, Plus, Clock, MessageSquare, Box, ExternalLink,
    X, Trash2, Zap, LayoutDashboard, Image as ImageIcon, CheckCircle2, FileText, ShieldAlert, Eye, History as HistoryIcon, Loader2, User,
    Columns, CalendarDays, ChevronLeft, ChevronRight, CheckSquare, ArrowUp, ArrowDown, Check, Mail, Flag, Paperclip,
    Film, Music, Archive, Code2, Download
} from 'lucide-react';
import { sendEmail, templates } from '../utils/emailService';
import { DatabaseService } from '../DatabaseService';
import { getCalendarDays, MONTH_NAMES_BR, WEEKDAYS_BR_SHORT } from '../utils/calendarUtils';
import { Card, Button, DeletionBar, Badge, PSelectPortal, DatePickerPortal } from '../Components';
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
    savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
    planejamento?: any[];
    // Client filter — unified with global App filter
    activeClientId?: string;
    onClientChange?: (clientId: string) => void;
}

const SavingIndicator = ({ status }: { status?: 'saving' | 'success' | 'error' }) => {
    if (!status) return null;
    return (
        <div className="flex items-center gap-1 pointer-events-none z-10 animate-fade-blur">
            {status === 'saving' && (
                <div className="w-2.5 h-2.5 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin"></div>
            )}
            {status === 'success' && (
                <Check size={12} className="text-emerald-500" />
            )}
        </div>
    );
};

const DroppableColumn = React.memo(function DroppableColumn({ id, children }: { id: string, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: { type: 'Column', status: id }
    });
    return (
        <div ref={setNodeRef} className={`flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2 transition-colors ${isOver ? 'bg-blue-500/5 rounded-2xl p-2 border border-dashed border-blue-500/30 ring-2 ring-blue-500/20' : ''}`}>
            {children}
        </div>
    );
});

const SortableTaskCard = React.memo(function SortableTaskCard({ Tarefa, clients, getPriorityInfo, onSelectTask, selection, statusCor, savingStatus }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: Tarefa.id,
        data: { type: 'Task', task: Tarefa }
    });

    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 };

    const Cliente  = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
    const prio     = getPriorityInfo(Tarefa.Prioridade);
    const PrioIcon = prio.icon;
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const dueDate  = Tarefa.Data_Entrega ? new Date(Tarefa.Data_Entrega + 'T12:00:00') : null;
    const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / 86400000) : null;
    const isOverdue   = daysLeft !== null && daysLeft < 0;
    const isDueToday  = daysLeft === 0;
    const isDueSoon   = daysLeft !== null && daysLeft > 0 && daysLeft <= 3;

    const checklist       = Array.isArray(Tarefa.Checklist)  ? Tarefa.Checklist  : [];
    const checklistDone   = checklist.filter((i: any) => i.concluido).length;
    const checklistTotal  = checklist.length;
    const commentsCount   = Array.isArray(Tarefa.Comentarios) ? Tarefa.Comentarios.length : 0;
    const attachmentsCount= Array.isArray(Tarefa.Anexos)      ? Tarefa.Anexos.length      : 0;

    const clientColor = Cliente?.['Cor (HEX)'] || '#94a3b8';
    const checkPct    = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

    const dateLabel = () => {
        if (!dueDate) return null;
        if (isOverdue)  return `${Math.abs(daysLeft!)}d atrasado`;
        if (isDueToday) return 'Hoje';
        if (daysLeft === 1) return 'Amanhã';
        return dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const isSelected = selection.includes(Tarefa.id);

    return (
        <div
            ref={setNodeRef} style={style} {...attributes} {...listeners}
            onClick={() => onSelectTask(Tarefa.id)}
            className={`group relative bg-white dark:bg-zinc-900 border rounded-[18px] flex flex-col overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200
                ${isSelected
                    ? 'border-zinc-900 dark:border-zinc-100 ring-2 ring-zinc-900/20 dark:ring-white/20 shadow-lg'
                    : 'border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-xl dark:hover:shadow-black/40 hover:-translate-y-0.5 hover:border-zinc-300 dark:hover:border-zinc-700'}
                ${isDragging ? 'ring-2 ring-blue-500 shadow-2xl scale-[1.03] z-50' : ''}`}
        >
            {/* Left accent bar — full height, status color */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-[18px] transition-opacity"
                 style={{ backgroundColor: statusCor, opacity: isSelected || isDragging ? 1 : 0.6 }} />

            {/* Hover glow behind card */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-[18px]"
                 style={{ background: `radial-gradient(ellipse at top left, ${statusCor}08 0%, transparent 60%)` }} />

            <div className="pl-5 pr-4 pt-4 pb-3 flex flex-col gap-2.5 relative">

                {/* Row 1: client avatar + name + priority */}
                <div className="flex items-center justify-between gap-2 pointer-events-none">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-sm"
                             style={{ backgroundColor: clientColor }}>
                            {(Cliente?.Nome || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 truncate max-w-[100px]">
                            {Cliente?.Nome || 'Agência'}
                        </span>
                    </div>
                    {Tarefa.Prioridade && (
                        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest shrink-0 border ${prio.color}`}>
                            <PrioIcon size={8} className="shrink-0" />
                        </span>
                    )}
                </div>

                {/* Row 2: title */}
                <h4 className="text-[12px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-snug group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors pointer-events-none line-clamp-2 min-h-[32px]">
                    {Tarefa.Título}
                </h4>

                {/* Checklist progress bar */}
                {checklistTotal > 0 && (
                    <div className="pointer-events-none space-y-1">
                        <div className="flex items-center justify-between">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${checkPct === 100 ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                <CheckSquare size={8} className="inline mr-1" />{checklistDone}/{checklistTotal}
                            </span>
                            <span className={`text-[8px] font-black ${checkPct === 100 ? 'text-emerald-500' : 'text-zinc-400'}`}>{checkPct}%</span>
                        </div>
                        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${checkPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                 style={{ width: `${checkPct}%` }} />
                        </div>
                    </div>
                )}

                {/* Planning / tags badges */}
                {Tarefa.Relacionado_A === 'Planejamento' && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[7px] font-black uppercase tracking-wider border border-blue-200/50 dark:border-blue-500/20 w-fit pointer-events-none">
                        📅 Planejamento
                    </span>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 pointer-events-none gap-2">
                    {/* Date chip */}
                    <div className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-wide rounded-lg px-1.5 py-0.5 ${
                        isOverdue   ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-200/50 dark:border-rose-500/20'
                        : isDueToday ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20'
                        : isDueSoon  ? 'bg-orange-50 dark:bg-orange-500/8 text-orange-500 border border-orange-200/50 dark:border-orange-500/15'
                        : 'text-zinc-400'
                    }`}>
                        <Clock size={8} className="shrink-0" />
                        {dueDate ? dateLabel() : <span className="opacity-30">Sem data</span>}
                    </div>

                    {/* Right: comment/attach + avatar */}
                    <div className="flex items-center gap-1.5">
                        {commentsCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[8px] font-bold text-zinc-400">
                                <MessageSquare size={8} />{commentsCount}
                            </span>
                        )}
                        {attachmentsCount > 0 && (
                            <span className="flex items-center gap-0.5 text-[8px] font-bold text-zinc-400">
                                <Paperclip size={8} />{attachmentsCount}
                            </span>
                        )}
                        <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[7px] font-black text-zinc-600 dark:text-zinc-300 shrink-0"
                             title={Tarefa.Responsável || 'Sem responsável'}>
                            {Tarefa.Responsável?.[0]?.toUpperCase() || '?'}
                        </div>
                        {Object.keys(savingStatus || {}).some(k => k.startsWith(`TAREFAS:${Tarefa.id}:`)) && (
                            <SavingIndicator status={Object.entries(savingStatus || {}).find(([k]) => k.startsWith(`TAREFAS:${Tarefa.id}:`))?.[1] as any} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

function TaskCardOverlay({ Tarefa, clients, getPriorityInfo, statusCor }: any) {
    const Cliente = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
    const prio = getPriorityInfo(Tarefa.Prioridade);
    const PriorityIcon = prio.icon;

    const checklist = Array.isArray(Tarefa.Checklist) ? Tarefa.Checklist : [];
    const checklistDone = checklist.filter((i: any) => i.concluido).length;
    const checklistTotal = checklist.length;
    const commentsCount = Array.isArray(Tarefa.Comentarios) ? Tarefa.Comentarios.length : 0;
    const attachmentsCount = Array.isArray(Tarefa.Anexos) ? Tarefa.Anexos.length : 0;
    const hasStats = checklistTotal > 0 || commentsCount > 0 || attachmentsCount > 0;

    return (
        <div className={`bg-white dark:bg-zinc-900 border-2 border-blue-500 p-4 rounded-xl shadow-2xl flex flex-col gap-3 relative overflow-hidden rotate-2 cursor-grabbing opacity-95 scale-105 min-w-[300px]`}>
            <div className="absolute top-0 left-0 w-[4px] h-full" style={{ backgroundColor: statusCor }} />
            <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 truncate max-w-[140px]">{Cliente?.Nome || 'Agência'}</span>
                {Tarefa.Prioridade && (
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest shrink-0 ${prio.color}`}>
                        <PriorityIcon size={9} className="shrink-0" />
                        <span>{Tarefa.Prioridade}</span>
                    </span>
                )}
            </div>
            <h4 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug truncate mt-1">{Tarefa.Título}</h4>
            {hasStats && (
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {checklistTotal > 0 && (
                        <span className={`flex items-center gap-1 ${checklistDone === checklistTotal ? 'text-emerald-500' : ''}`}>
                            <CheckSquare size={11} className="shrink-0" />
                            {checklistDone}/{checklistTotal}
                        </span>
                    )}
                    {commentsCount > 0 && (
                        <span className="flex items-center gap-1">
                            <MessageSquare size={11} className="shrink-0" />
                            {commentsCount}
                        </span>
                    )}
                    {attachmentsCount > 0 && (
                        <span className="flex items-center gap-1">
                            <Paperclip size={11} className="shrink-0" />
                            {attachmentsCount}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export function TaskFlowView({
    tasks, clients, collaborators, activeViewId, setActiveViewId,
    onUpdate, onDelete, onArchive, onAdd, onSelectTask,
    selection, onSelect, onClearSelection, savingStatus = {},
    planejamento = [],
    activeClientId = '',
    onClientChange
}: TaskFlowViewProps) {
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortField, setSortField] = useState<string>('Data_Entrega');
    const [sortDesc, setSortDesc] = useState<boolean>(false);

    // LOCAL client filter — doesn't affect global state / other tabs
    const [localClientFilter, setLocalClientFilter] = useState<string>(activeClientId);

    const handleClientChange = (clientId: string) => {
        setLocalClientFilter(clientId);
        onClientChange?.(clientId); // no-op in current App.tsx
    };

    // Sync local filter if global filter changes from sidebar
    React.useEffect(() => {
        setLocalClientFilter(activeClientId);
    }, [activeClientId]);

    const filteredTasks = useMemo(() => {
        let ft = tasks.filter((t: any) => {
            const matchesSearch = !globalSearch ||
                (t.Título || '').toLowerCase().includes(globalSearch.toLowerCase()) ||
                clients.find((c:any)=>c.id === t.Cliente_ID)?.Nome?.toLowerCase().includes(globalSearch.toLowerCase());
            const matchesClient = !localClientFilter || t.Cliente_ID === localClientFilter;
            return matchesSearch && matchesClient && t.Status !== 'arquivado';
        });

        ft.sort((a: any, b: any) => {
            let valA = a[sortField] || '';
            let valB = b[sortField] || '';
            if(sortField === 'Cliente') {
                valA = clients.find((c:any) => c.id === a.Cliente_ID)?.Nome || '';
                valB = clients.find((c:any) => c.id === b.Cliente_ID)?.Nome || '';
            }
            if(valA < valB) return sortDesc ? 1 : -1;
            if(valA > valB) return sortDesc ? -1 : 1;
            return 0;
        });
        return ft;
    }, [tasks, globalSearch, sortField, sortDesc, clients, localClientFilter]);

    const viewType = useMemo(() => DEFAULT_TASK_VIEWS.find(v => v.id === activeViewId)?.tipo || 'List', [activeViewId]);

    const [currentDate, setCurrentDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        return getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
    }, [currentDate]);

    const handleMonthNav = useCallback((dir: number) => {
        const next = new Date(currentDate);
        next.setMonth(next.getMonth() + dir);
        setCurrentDate(next);
    }, [currentDate]);

    const getEventosDoDia = (dateStr: string) => {
        return filteredTasks.filter((t: any) => {
            if (!t.Data_Entrega) return false;
            // Normalize: handle ISO datetime strings like '2026-03-30T00:00:00'
            const taskDate = String(t.Data_Entrega).split('T')[0];
            return taskDate === dateStr;
        });
    };

    const [activeDragTask, setActiveDragTask] = useState<any>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: any) => {
        const { active } = event;
        const task = filteredTasks.find((t: any) => t.id === active.id);
        if (task) setActiveDragTask(task);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveDragTask(null);
        if (!over) return;

        const activeId = active.id;
        const activeTask = filteredTasks.find((t: any) => t.id === activeId);
        if (!activeTask) return;

        let newStatus = activeTask.Status;
        if (over.data.current?.type === 'Column') {
            newStatus = over.data.current.status;
        } else if (over.data.current?.type === 'Task') {
            const overTask = over.data.current.task;
            if (overTask) newStatus = overTask.Status;
        }

        if (activeTask.Status !== newStatus) {
            onUpdate(activeId, 'TAREFAS', 'Status', newStatus);
        }
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getPriorityInfo = useCallback((priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'baixa': return { color: 'text-emerald-500 bg-emerald-500/10', icon: Flag };
            case 'média':
            case 'media': return { color: 'text-amber-500 bg-amber-500/10', icon: Flag };
            case 'alta': return { color: 'text-rose-500 bg-rose-500/10', icon: Flag };
            case 'urgente': return { color: 'text-purple-500 bg-purple-500/10', icon: Zap };
            default: return { color: 'text-zinc-500 bg-zinc-500/10', icon: Flag };
        }
    }, []);

    return (
        <div className="view-root flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden animate-fade-blur">
            {/* HEADER */}
            <div className="shrink-0 flex items-center justify-between flex-wrap gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                {/* Left: title + client filter (unified) */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-lg shrink-0">
                        <CheckSquare size={17} className="shrink-0" />
                    </div>
                    <div className="hidden sm:block shrink-0">
                        <h1 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">Tarefas</h1>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5">Operação e Entrega</p>
                    </div>

                    {/* CLIENT FILTER — local only, does NOT affect other tabs */}
                    <div className="ml-2 w-44 shrink-0">
                        <PSelectPortal
                            value={localClientFilter}
                            onChange={handleClientChange}
                            placeholder="Todos os clientes"
                            size="sm"
                            options={[
                                { value: '', label: 'Todos os clientes' },
                                ...clients.map((c: any) => ({ value: c.id, label: c.Nome, color: c['Cor (HEX)'] }))
                            ]}
                        />
                    </div>

                    {localClientFilter && (
                        <button
                            onClick={() => handleClientChange('')}
                            className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase tracking-wider border border-blue-200/50 dark:border-blue-500/20 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all ios-btn"
                        >
                            <X size={10} className="shrink-0" />
                            {clients.find((c: any) => c.id === localClientFilter)?.Nome || 'Cliente'}
                        </button>
                    )}
                </div>

                {/* Right: views + search + actions */}
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="hidden lg:flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        {DEFAULT_TASK_VIEWS.map((v: any) => (
                            <button
                                key={v.id}
                                onClick={() => setActiveViewId(v.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === v.id ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm active:scale-95' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                {v.tipo === 'List' || (v as any).type === 'List' ? <List size={13} /> : v.tipo === 'Board' || (v as any).type === 'Board' ? <Columns size={13} /> : <CalendarDays size={13} />}
                                <span className="hidden xl:inline">{v.nome || (v as any).name}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 h-9 min-w-0 w-40 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <Search className="text-zinc-400 shrink-0" size={13} />
                        <input
                            type="text"
                            value={globalSearch}
                            onChange={e => setGlobalSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                        />
                    </div>

                    <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'TAREFAS')} onArchive={() => onArchive(selection, 'TAREFAS', true)} onClear={onClearSelection} />

                    <Button
                        onClick={() => onAdd('TAREFAS', localClientFilter ? { Cliente_ID: localClientFilter } : undefined)}
                        className="!h-9 px-4 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-500/10 active:scale-95 transition-all whitespace-nowrap"
                    >
                        <Plus size={15} className="mr-1.5" /> Nova Tarefa
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">

                {viewType === 'Board' && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-4 h-full overflow-x-auto pb-4 custom-scrollbar-horizontal">
                            {DEFAULT_TASK_STATUSES.map(status => {
                                const columnTasks = filteredTasks.filter(t => t.Status === status.id);
                                const overdueCount = columnTasks.filter(t => t.Data_Entrega && new Date(t.Data_Entrega) < new Date(new Date().setHours(0,0,0,0))).length;
                                return (
                                <div key={status.id} className="w-[290px] flex flex-col max-h-full shrink-0 relative">
                                    {/* Column header */}
                                    <div className="flex items-center justify-between mb-3 px-0.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                                <div className="w-2 h-2 rounded-full shadow-sm shrink-0" style={{ backgroundColor: status.cor }} />
                                                <h3 className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: status.cor }}>{status.rotulo}</h3>
                                                <span className="text-[8px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full ml-0.5">{columnTasks.length}</span>
                                            </div>
                                            {overdueCount > 0 && (
                                                <span className="text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200/50 dark:border-rose-500/20 px-1.5 py-0.5 rounded-full">
                                                    {overdueCount} atras.
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onAdd('TAREFAS', { Status: status.id })}
                                            className="w-7 h-7 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-95 shrink-0"
                                            style={{ backgroundColor: `${status.cor}20` }}
                                            title={`Adicionar em ${status.rotulo}`}
                                        >
                                            <Plus size={13} style={{ color: status.cor }} />
                                        </button>
                                    </div>

                                    {/* Column body */}
                                    <DroppableColumn id={status.id}>
                                        <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                            {columnTasks.map(Tarefa => (
                                                <SortableTaskCard
                                                    key={Tarefa.id}
                                                    Tarefa={Tarefa}
                                                    clients={clients}
                                                    getPriorityInfo={getPriorityInfo}
                                                    onSelectTask={onSelectTask}
                                                    selection={selection}
                                                    statusCor={status.cor}
                                                    savingStatus={savingStatus}
                                                />
                                            ))}
                                        </SortableContext>
                                        {columnTasks.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed transition-colors"
                                                 style={{ borderColor: `${status.cor}30` }}>
                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${status.cor}15` }}>
                                                    <Plus size={14} style={{ color: status.cor }} />
                                                </div>
                                                <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: `${status.cor}80` }}>Vazio</p>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => onAdd('TAREFAS', { Status: status.id })}
                                            className="w-full mt-2 py-2.5 flex items-center justify-center gap-1.5 text-[9px] font-black text-zinc-400 hover:bg-white dark:hover:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all uppercase tracking-widest hover:shadow-sm"
                                        >
                                            <Plus size={12} /> Nova tarefa
                                        </button>
                                    </DroppableColumn>
                                </div>
                            )})}
                        </div>
                        <DragOverlay>
                            {activeDragTask ? (
                                <TaskCardOverlay 
                                    Tarefa={activeDragTask} 
                                    clients={clients} 
                                    getPriorityInfo={getPriorityInfo} 
                                    statusCor={DEFAULT_TASK_STATUSES.find(s => s.id === activeDragTask.Status)?.cor} 
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                )}

                {viewType === 'List' && (
                    <div className="h-full overflow-hidden flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm relative">
                        {/* Table Header Wrapper to keep it fixed */}
                        <div className="table-responsive overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50 backdrop-blur shrink-0 pr-[8px]">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr>
                                        <th className="w-12 p-3 text-center">
                                            <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-0" checked={selection.length === filteredTasks.length && filteredTasks.length > 0} onChange={() => selection.length === filteredTasks.length ? onClearSelection() : filteredTasks.forEach(t => !selection.includes(t.id) && onSelect(t.id))} />
                                        </th>
                                        {[
                                            { id: 'Título', label: 'Nome da Tarefa', width: 'flex-1 min-w-[200px]' },
                                            { id: 'Cliente', label: 'Cliente', width: 'w-[150px]' },
                                            { id: 'Status', label: 'Status', width: 'w-[120px]' },
                                            { id: 'Prioridade', label: 'Prioridade', width: 'w-[120px]' },
                                            { id: 'Data_Entrega', label: 'Entrega', width: 'w-[100px]' },
                                            { id: 'Responsável', label: 'Resp.', width: 'w-[80px]' }
                                        ].map(col => (
                                            <th key={col.id} className={`p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer select-none transition-colors hover:text-zinc-900 dark:hover:text-white ${col.width}`} 
                                                onClick={() => { if(sortField===col.id) setSortDesc(!sortDesc); else { setSortField(col.id); setSortDesc(false); } }}>
                                                <div className="flex items-center gap-2">
                                                    {col.label}
                                                    {sortField === col.id && (sortDesc ? <ArrowDown size={12} className="text-blue-600 shrink-0" /> : <ArrowUp size={12} className="text-blue-600 shrink-0" />)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        
                        {/* Table Body Scrollable */}
                        <div className="table-responsive flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900">
                            <table className="w-full text-left border-collapse table-fixed">
                                <tbody>
                                    {filteredTasks.map(Tarefa => {
                                        const Cliente = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
                                        const prio = getPriorityInfo(Tarefa.Prioridade);
                                        const isOverdue = Tarefa.Data_Entrega && new Date(Tarefa.Data_Entrega) < new Date(new Date().setHours(0,0,0,0));
                                        const statusObj = DEFAULT_TASK_STATUSES.find(s=>s.id === Tarefa.Status);
                                        
                                        return (
                                            <tr
                                                key={Tarefa.id}
                                                onClick={() => onSelectTask(Tarefa.id)}
                                                className={`group border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer ${selection.includes(Tarefa.id) ? 'bg-zinc-50 dark:bg-zinc-800' : ''}`}
                                            >
                                                <td className="w-12 p-3 text-center" onClick={e => { e.stopPropagation(); onSelect(Tarefa.id); }}>
                                                    <input type="checkbox" checked={selection.includes(Tarefa.id)} readOnly className="w-3 h-3 text-zinc-900 dark:text-zinc-100 rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-0 group-hover:border-zinc-400 transition-colors" />
                                                </td>
                                                <td className="flex-1 min-w-0 p-3">
                                                    <span className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight group-hover:text-blue-500 transition-colors block truncate" title={Tarefa.Título}>{Tarefa.Título}</span>
                                                </td>
                                                <td className="w-[150px] p-3">
                                                    <Badge color="slate" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 opacity-60">
                                                        {Cliente?.Nome || 'AGÊNCIA'}
                                                    </Badge>
                                                </td>
                                                <td className="w-[120px] p-3">
                                                    <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusObj?.cor || '#666' }} />
                                                        {statusObj?.rotulo || Tarefa.Status}
                                                    </div>
                                                </td>
                                                <td className="w-[120px] p-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${prio.color.split(' ')[0].replace('text-', 'bg-')}`} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{Tarefa.Prioridade}</span>
                                                    </div>
                                                </td>
                                                <td className="w-[100px] p-3">
                                                    {Tarefa.Data_Entrega ? (
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black rounded-md px-1.5 py-0.5 ${isOverdue ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'text-zinc-400'}`}>
                                                            {isOverdue && <span>⚠</span>}
                                                            {new Date(Tarefa.Data_Entrega + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] text-zinc-300 dark:text-zinc-600">—</span>
                                                    )}
                                                </td>
                                                <td className="w-[80px] p-3">
                                                    <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center text-[9px] font-black border border-zinc-200 dark:border-zinc-700 shrink-0" title={Tarefa.Responsável || 'Sem responsável'}>
                                                        {Tarefa.Responsável?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTasks.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-xs font-bold uppercase tracking-widest text-zinc-400 border-none">
                                                Nenhuma tarefa encontrada
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {viewType === 'Calendar' && (
                    <div className="h-full flex flex-col overflow-hidden relative">
                        {/* CALENDAR HEADER */}
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm">
                                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleMonthNav(-1)}>
                                    <ChevronLeft size={20} />
                                </button>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white min-w-[150px] text-center uppercase tracking-[0.2em]">
                                    {MONTH_NAMES_BR[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h3>
                                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleMonthNav(1)}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            <button
                                onClick={() => { setCurrentDate(new Date()); }}
                                className="px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500 tracking-widest uppercase hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
                            >
                                HOJE
                            </button>
                        </div>

                        {/* CALENDAR GRID */}
                        <div className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                            <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                                {WEEKDAYS_BR_SHORT.map(dia => (
                                    <div key={dia} className="py-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] border-r border-zinc-200 dark:border-zinc-800 last:border-0">
                                        {dia}
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-7 auto-rows-[minmax(180px,auto)] min-h-full">
                                    {calendarDays.map((diaObj, idx) => {
                                        const evts = getEventosDoDia(diaObj.dateStr);
                                        const isToday = diaObj.dateStr === new Date().toISOString().split('T')[0];

                                    return (
                                        <div
                                            key={idx}
                                            className={`p-2 border-r border-b border-zinc-200 dark:border-zinc-800 transition-all relative flex flex-col min-h-[140px] ${diaObj.isNextMonth || diaObj.isPrevMonth ? 'bg-zinc-50/50 dark:bg-zinc-900/20 opacity-40' :
                                                isToday ? 'bg-blue-50/60 dark:bg-blue-900/10' :
                                                evts.length > 0 ? 'bg-zinc-50/80 dark:bg-zinc-800/20' :
                                                'bg-transparent'
                                                } hover:bg-zinc-50 dark:hover:bg-zinc-900/50 group`}
                                        >
                                            <div className="flex justify-between items-start mb-2 px-1">
                                                <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                    {diaObj.day}
                                                </span>
                                                <button onClick={() => onAdd('TAREFAS', { Data_Entrega: diaObj.dateStr })} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
                                                    <Plus size={14} />
                                                </button>
                                            </div>

                                            <div className="flex-1 space-y-1 pb-1 overflow-y-auto custom-scrollbar-mini max-h-[160px]">
                                                {evts.map(Tarefa => {
                                                    const Cliente = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
                                                    const clientColor = Cliente?.['Cor (HEX)'] || '#3B82F6';
                                                    const isDone = Tarefa.Status === 'done' || Tarefa.Status === 'concluido';
                                                    const statusObj = DEFAULT_TASK_STATUSES.find((s: any) => s.id === Tarefa.Status);

                                                    return (
                                                        <div
                                                            key={Tarefa.id}
                                                            onClick={() => onSelectTask(Tarefa.id)}
                                                            title={Tarefa.Título}
                                                            className={`group relative flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-all hover:brightness-95 active:scale-[0.98] overflow-hidden shadow-sm ${isDone ? 'opacity-40' : ''}`}
                                                            style={{
                                                                backgroundColor: clientColor + '18',
                                                                borderLeft: `3px solid ${clientColor}`,
                                                            }}
                                                        >
                                                            <div
                                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                style={{ backgroundColor: statusObj?.cor || clientColor }}
                                                            />
                                                            <span className={`text-[9px] font-black leading-tight uppercase tracking-tight truncate flex-1 ${isDone ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                                {Tarefa.Título}
                                                            </span>
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
    savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
    setActiveTab?: (tab: string) => void;
    planejamento?: any[];
}

export function TaskDetailPanel({
    taskId, tasks, clients, collaborators, onClose,
    onUpdate, onArchive, onDelete, onAdd,
    viewMode, setViewMode, savingStatus = {},
    setActiveTab, planejamento = []
}: TaskDetailPanelProps) {
    const t = tasks.find((Tarefa: Tarefa) => Tarefa.id === taskId);
    const [newCheckItem, setNewCheckItem] = useState('');
    const [uploading, setUploading] = useState(false);
    const [comment, setComment] = useState('');
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [notifyResponsible, setNotifyResponsible] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (viewMode !== 'sidebar') {
            setViewMode('sidebar');
        }
        
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [viewMode, setViewMode, onClose]);

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

    const Cliente = clients.find((c: any) => c.id === t.Cliente_ID);
    const clientColorCss = Cliente?.['Cor (HEX)'] || '#3B82F6';

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 text-left overflow-hidden border-l border-zinc-200 dark:border-zinc-800">
                        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 shrink-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md z-10 w-full">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Badge color="slate" className="text-[9px] font-black uppercase tracking-widest px-3 py-1 opacity-60">
                            {Cliente?.Nome || 'AGÊNCIA'}
                        </Badge>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest opacity-40">ID {t.Task_ID}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <button onClick={() => setViewMode('sidebar')} className={`p-2 rounded-lg transition-all ${viewMode === 'sidebar' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}><LayoutGrid size={14} /></button>
                            <button onClick={() => setViewMode('modal')} className={`p-2 rounded-lg transition-all ${viewMode === 'modal' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}><ExternalLink size={14} /></button>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <input
                    className="w-full text-xl font-black text-zinc-900 dark:text-zinc-100 bg-transparent border-none p-0 focus:ring-0 uppercase tracking-tight placeholder-zinc-200 dark:placeholder-zinc-800"
                    value={t.Título}
                    onChange={e => onUpdate(t.id, 'TAREFAS', 'Título', e.target.value, true)}
                    onBlur={e => onUpdate(t.id, 'TAREFAS', 'Título', e.target.value)}
                    placeholder="TÍTULO DA TAREFA"
                />
                <div className="absolute right-6 top-[72px]">
                    <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Título`]} />
                </div>
            </div>


            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* METRICS GRID */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm group relative">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <HistoryIcon size={12} className="text-zinc-400" /> Status
                        </label>
                        <PSelectPortal
                            value={t.Status}
                            onChange={val => onUpdate(t.id, 'TAREFAS', 'Status', val)}
                            options={DEFAULT_TASK_STATUSES.map(s => ({ value: s.id, label: s.rotulo }))}
                            size="sm"
                        />
                        <div className="absolute top-2 right-2">
                            <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Status`]} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm group relative">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={12} className="text-zinc-400" /> Prioridade
                        </label>
                        <PSelectPortal
                            value={t.Prioridade}
                            onChange={val => onUpdate(t.id, 'TAREFAS', 'Prioridade', val)}
                            options={PRIORIDADE_OPTIONS.map(opt => ({ value: opt, label: opt }))}
                            size="sm"
                        />
                        <div className="absolute top-2 right-2">
                            <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Prioridade`]} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm group relative">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} className="text-zinc-400" /> Responsável
                        </label>
                        <PSelectPortal
                            value={t.Responsável || ''}
                            onChange={val => onUpdate(t.id, 'TAREFAS', 'Responsável', val)}
                            options={[{ value: '', label: 'Sem Resp.' }, ...collaborators.map((c: any) => ({ value: c.Nome, label: c.Nome }))]}
                            size="sm"
                        />
                        <div className="absolute top-2 right-2">
                            <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Responsável`]} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm group relative">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} className="text-zinc-400" /> Entrega
                        </label>
                        <DatePickerPortal
                            value={t.Data_Entrega || ''}
                            onChange={val => onUpdate(t.id, 'TAREFAS', 'Data_Entrega', val)}
                            size="sm"
                            clearable
                        />
                        <div className="absolute top-2 right-2">
                            <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Data_Entrega`]} />
                        </div>
                    </div>
                </div>

                {/* NOTIFY CHECKBOX */}
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 flex items-center justify-between group transition-all hover:border-blue-300 dark:hover:border-blue-700">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <Mail size={16} />
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 block">Notificações</span>
                            <span className="text-[9px] font-bold text-blue-500/60 dark:text-blue-400/40 uppercase tracking-widest">Enviar alerta para o responsável</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => setNotifyResponsible(!notifyResponsible)}
                        className={`w-10 h-6 rounded-full transition-all relative ${notifyResponsible ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-800'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${notifyResponsible ? 'left-5' : 'left-1'}`}></div>
                    </button>
                </div>

                {/* PLANEJAMENTO LINK */}
                {t.Relacionado_A === 'Planejamento' && (() => {
                    const planItem = planejamento.find((p: any) => p.id === t.Relacionado_ID);
                    const planClient = clients.find((c: any) => c.id === (planItem?.Cliente_ID || t.Cliente_ID));
                    const REDE_LABELS: Record<string, string> = {
                        INSTAGRAM: '📸 Instagram', YOUTUBE: '▶️ YouTube', TIKTOK: '🎵 TikTok',
                        LINKEDIN: '💼 LinkedIn', FACEBOOK: '📘 Facebook', 'X/TWITTER': '🐦 Twitter',
                        PINTEREST: '📌 Pinterest', BLOG: '📝 Blog',
                    };
                    const formatDateBR = (d: string) => {
                        if (!d) return null;
                        return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short', year: '2-digit' });
                    };
                    const STATUS_PLAN: Record<string, string> = {
                        'EM ESPERA': 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
                        'PRODUÇÃO': 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
                        'AGUARDANDO APROVAÇÃO': 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
                        'PUBLICADO': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                        'CONCLUÍDO': 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                    };
                    return (
                        <section className="bg-violet-50/60 dark:bg-violet-500/5 border border-violet-200/60 dark:border-violet-500/15 rounded-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-violet-100 dark:border-violet-500/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-lg bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                                        <CalendarDays size={11} className="text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-violet-500 dark:text-violet-400">Conteúdo vinculado</p>
                                </div>
                                {setActiveTab && (
                                    <button
                                        onClick={() => { onClose(); setActiveTab('PLANEJAMENTO'); }}
                                        className="text-[8px] font-black text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 px-2 py-1 rounded-lg transition-all border border-violet-200 dark:border-violet-500/20 uppercase tracking-widest"
                                    >
                                        Abrir →
                                    </button>
                                )}
                            </div>
                            {/* Body */}
                            <div className="p-4 space-y-3">
                                {/* Content text */}
                                <p className="text-[12px] font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                                    {planItem?.Conteúdo || t.Relacionado_Conteudo || '—'}
                                </p>
                                {/* Meta chips */}
                                <div className="flex flex-wrap gap-2">
                                    {planItem?.Rede_Social && (
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-200/50 dark:border-violet-500/20">
                                            {REDE_LABELS[planItem.Rede_Social?.toUpperCase()] || planItem.Rede_Social}
                                        </span>
                                    )}
                                    {(planItem?.Data || t.Data_Entrega) && (
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 flex items-center gap-1">
                                            <CalendarDays size={9} className="shrink-0" />
                                            {formatDateBR(planItem?.Data || t.Data_Entrega)}
                                        </span>
                                    )}
                                    {planItem?.Hora && (
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                            🕐 {planItem.Hora}
                                        </span>
                                    )}
                                    {planClient && (
                                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border" style={{ backgroundColor: planClient['Cor (HEX)'] + '15', borderColor: planClient['Cor (HEX)'] + '30', color: planClient['Cor (HEX)'] }}>
                                            {planClient.Nome}
                                        </span>
                                    )}
                                    {planItem?.['Status do conteúdo'] && (
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg ${STATUS_PLAN[planItem['Status do conteúdo']] || STATUS_PLAN['EM ESPERA']}`}>
                                            {planItem['Status do conteúdo']}
                                        </span>
                                    )}
                                </div>
                                {/* Observations if present */}
                                {planItem?.Observações && (
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-relaxed border-t border-violet-100 dark:border-violet-500/10 pt-2 italic">
                                        {planItem.Observações}
                                    </p>
                                )}
                            </div>
                        </section>
                    );
                })()}

                {/* DESCRIPTION */}
                <section className="relative">
                    <div className="flex items-center mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-[0.2em] flex items-center gap-2">
                            <FileText size={14} className="text-zinc-400" /> Descrição Estratégica
                        </h4>
                    </div>
                    <textarea
                        className="w-full h-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase leading-relaxed outline-none focus:ring-4 focus:ring-zinc-500/5 transition-all custom-scrollbar placeholder-zinc-200 dark:placeholder-zinc-800 shadow-sm"
                        value={t.Descrição || ''}
                        onChange={e => onUpdate(t.id, 'TAREFAS', 'Descrição', e.target.value, true)}
                        onBlur={e => onUpdate(t.id, 'TAREFAS', 'Descrição', e.target.value)}
                        placeholder="DESCREVA OS DETALHES TÁTICOS, LINKS E PAUTAS..."
                    />
                    <div className="absolute top-2 right-2">
                        <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Descrição`]} />
                    </div>
                </section>

                {/* CHECKLIST */}
                <section>
                    <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-[0.2em] flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-zinc-400" /> Etapas de Execução
                        </h4>
                        <Badge color="slate" className="text-[8px] font-black px-2 py-0.5 opacity-60">
                            {t.Checklist?.filter(i => i.concluido).length || 0} / {t.Checklist?.length || 0}
                        </Badge>
                    </div>
                    <div className="space-y-3 px-1">
                        {t.Checklist?.map(item => (
                            <div key={item.id} className="flex items-center gap-3 group">
                                <button
                                    onClick={() => updateChecklist(t.Checklist.map(i => i.id === item.id ? { ...i, concluido: !i.concluido } : i))}
                                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${item.concluido ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-transparent'}`}
                                >
                                    {item.concluido && <Plus size={12} className="rotate-45" />}
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-tight transition-all flex-1 ${item.concluido ? 'text-zinc-300 dark:text-zinc-700 line-through' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {item.texto}
                                </span>
                                <button onClick={() => updateChecklist(t.Checklist.filter(i => i.id !== item.id))} className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 transition-all">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                            <input
                                value={newCheckItem}
                                onChange={e => setNewCheckItem(e.target.value.toUpperCase())}
                                onKeyDown={e => e.key === 'Enter' && (() => { if (!newCheckItem.trim()) return; updateChecklist([...(t.Checklist || []), { id: generateId(), texto: newCheckItem.toUpperCase(), concluido: false }]); setNewCheckItem(''); })()}
                                placeholder="NOVA ETAPA..."
                                className="flex-1 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-zinc-500/5 transition-all shadow-sm"
                            />
                            <button
                                onClick={() => { if (!newCheckItem.trim()) return; updateChecklist([...(t.Checklist || []), { id: generateId(), texto: newCheckItem.toUpperCase(), concluido: false }]); setNewCheckItem(''); }}
                                className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-xl shadow-zinc-500/10"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ATTACHMENTS */}
                <section>
                    <div className="flex items-center justify-between mb-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                        <h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-[0.2em] flex items-center gap-2">
                            <Paperclip size={14} className="text-zinc-400" /> Arquivos e Mídia
                            {(t.Anexos || []).length > 0 && (
                                <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full font-bold">
                                    {(t.Anexos || []).length}
                                </span>
                            )}
                        </h4>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        >
                            {uploading ? <Loader2 size={11} className="animate-spin" /> : <><Plus size={11} /> Adicionar</>}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="hidden"
                            multiple
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                        />
                    </div>

                    {/* Drop zone + grid */}
                    <div
                        className="space-y-2"
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'rounded-2xl'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'rounded-2xl'); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'rounded-2xl');
                            if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
                        }}
                    >
                        {(t.Anexos || []).length > 0 ? (
                            <>
                                {/* Image grid */}
                                {(t.Anexos || []).some(f => f.tipoMime?.startsWith('image/')) && (
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {(t.Anexos || []).filter(f => f.tipoMime?.startsWith('image/')).map(file => (
                                            <div key={file.id} className="group relative aspect-video rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm">
                                                <img src={file.dados} alt={file.nomeArquivo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                                                    <button onClick={() => setLightboxImage(file.dados)} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg" title="Visualizar"><Eye size={14} /></button>
                                                    <a href={file.dados} download={file.nomeArquivo} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg" title="Baixar"><Download size={14} /></a>
                                                    <button onClick={() => updateAttachments((t.Anexos || []).filter(a => a.id !== file.id))} className="w-8 h-8 rounded-lg bg-rose-500/60 hover:bg-rose-500 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg" title="Remover"><Trash2 size={14} /></button>
                                                </div>
                                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-[9px] text-white font-bold truncate">{file.nomeArquivo}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Non-image files list */}
                                {(t.Anexos || []).filter(f => !f.tipoMime?.startsWith('image/')).map(file => {
                                    const isVideo = file.tipoMime?.startsWith('video/');
                                    const isAudio = file.tipoMime?.startsWith('audio/');
                                    const isPdf = file.tipoMime === 'application/pdf';
                                    const isArchive = file.tipoMime?.includes('zip') || file.tipoMime?.includes('rar');
                                    const isCode = file.tipoMime?.includes('javascript') || file.tipoMime?.includes('json') || file.tipoMime?.includes('xml') || file.nomeArquivo?.match(/\.(js|ts|json|xml|html|css)$/i);
                                    const FileIcon = isVideo ? Film : isAudio ? Music : isPdf ? FileText : isArchive ? Archive : isCode ? Code2 : FileText;
                                    const iconColor = isVideo ? 'text-purple-500' : isAudio ? 'text-pink-500' : isPdf ? 'text-red-500' : isArchive ? 'text-amber-500' : 'text-blue-500';
                                    const sizeStr = file.tamanho ? (file.tamanho > 1024 * 1024 ? `${(file.tamanho / 1024 / 1024).toFixed(1)}MB` : `${Math.round(file.tamanho / 1024)}KB`) : '';
                                    return (
                                        <div key={file.id} className="group flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
                                            <div className={`w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 ${iconColor}`}>
                                                <FileIcon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{file.nomeArquivo}</p>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">{file.tipoMime?.split('/')[1]?.toUpperCase() || 'FILE'}{sizeStr ? ` · ${sizeStr}` : ''}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a href={file.dados} download={file.nomeArquivo} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-500 hover:text-white text-zinc-400 flex items-center justify-center transition-all" title="Baixar">
                                                    <Download size={12} />
                                                </a>
                                                <button onClick={() => updateAttachments((t.Anexos || []).filter(a => a.id !== file.id))} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white text-zinc-400 flex items-center justify-center transition-all" title="Remover">
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            <div
                                className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl py-8 flex flex-col items-center justify-center gap-3 text-zinc-400 group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 group-hover:scale-105 transition-transform">
                                    <Paperclip size={18} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Arraste arquivos aqui</p>
                                    <p className="text-[8px] font-bold uppercase opacity-60 mt-0.5">Imagens, PDFs, vídeos, docs · até 20MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ACTIVITY & COMMENTS */}
                <section className="space-y-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold uppercase text-zinc-900 dark:text-zinc-100 tracking-widest flex items-center gap-2">
                            <MessageSquare size={14} className="text-zinc-400" /> Atividade e Timeline
                        </h4>
                    </div>

                    <div className="space-y-5">
                        {(t.Atividades || []).map(act => (
                            <div key={act.id} className="flex gap-3 group">
                                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-sm">
                                    {act.tipo === 'comment' ? <MessageSquare size={12} className="text-zinc-400" /> : <Zap size={12} className="text-zinc-400" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{act.usuario}</span>
                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-zinc-500 leading-relaxed uppercase tracking-tight">{act.mensagem}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 mt-4">
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="ESCREVA UM COMENTÁRIO..."
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-[11px] font-bold uppercase tracking-widest placeholder-zinc-300 dark:placeholder-zinc-700 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all min-h-[80px] shadow-sm"
                        />
                        <div className="flex justify-end pt-1">
                            <button
                                onClick={handleAddComment}
                                disabled={!comment.trim()}
                                className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                Comentar
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="px-6 py-5 border-t border-zinc-200 dark:border-zinc-800 bg-white grid grid-cols-2 gap-3 shrink-0">
                <button
                    onClick={() => { onArchive([t.id], 'TAREFAS', !t.__archived); onClose(); }}
                    className="h-11 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                >
                    <Box size={14} /> {t.__archived ? 'Restaurar' : 'Arquivar'}
                </button>
                <button
                    onClick={() => { if (window.confirm("Excluir definitivamente?")) { onDelete([t.id], 'TAREFAS'); onClose(); } }}
                    className="h-11 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-900/10 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
                >
                    <Trash2 size={14} /> Excluir
                </button>
                <button
                    onClick={async () => {
                        if (notifyResponsible && t.Responsável) {
                            try {
                                const workspaceId = (window as any).activeWorkspaceId;
                                if (workspaceId) {
                                    const members = await DatabaseService.getWorkspaceMembers(workspaceId);
                                    const respMember = members.find((m: any) => 
                                        m.profiles.full_name?.toLowerCase() === t.Responsável?.toLowerCase() || 
                                        m.profiles.email?.split('@')[0].toLowerCase() === t.Responsável?.toLowerCase()
                                    );
                                    const email = respMember?.profiles.email;
                                    const cliente = clients.find(c => c.id === t.Cliente_ID)?.Nome || 'Geral';

                                    if (email) {
                                        const emailData = templates.novaTarefa(
                                            t.Título,
                                            t.Responsável,
                                            t.Data_Entrega || 'Não definida',
                                            cliente
                                        );
                                        await sendEmail({
                                            to: email,
                                            ...emailData
                                        });
                                    }
                                }
                            } catch (err) {
                                console.error('Erro ao notificar responsável:', err);
                            }
                        }
                        setNotifyResponsible(false);
                        onClose();
                    }}
                    className="col-span-2 h-11 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <CheckCircle2 size={16} /> Finalizar Edição
                </button>
            </div>

            {/* LIGHTBOX */}
            {lightboxImage && (
                <div className="fixed inset-0 z-[3000] bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-10" onClick={() => setLightboxImage(null)}>
                    <button className="absolute top-10 right-10 text-white opacity-50 hover:opacity-100 transition-opacity p-2 hover:bg-white/10 rounded-full"><X size={32} /></button>
                    <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}

