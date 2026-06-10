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
    workspaceMembers?: any[];
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
            <h4 className="text-[13px] font-black text-zinc-900 dark:text-zinc-100 leading-snug truncate mt-1">{Tarefa.Título}</h4>
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
    tasks, clients, collaborators, workspaceMembers = [], activeViewId, setActiveViewId,
    onUpdate, onDelete, onArchive, onAdd, onSelectTask,
    selection, onSelect, onClearSelection, savingStatus = {},
    planejamento = [],
    activeClientId = '',
    onClientChange
}: TaskFlowViewProps) {
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortField, setSortField] = useState<string>('Data_Entrega');
    const [sortDesc, setSortDesc] = useState<boolean>(false);
    // Skeleton: show for 600ms on mount to avoid "blank flash" while tasks load
    const [isMounting, setIsMounting] = useState(true);
    React.useEffect(() => {
        const t = setTimeout(() => setIsMounting(false), 600);
        return () => clearTimeout(t);
    }, []);

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
        <div className="view-root flex-1 min-h-0 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">
            {/* HEADER */}
            <div className="shrink-0 flex items-center justify-between flex-wrap gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
                {/* Left: title + client filter (unified) */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 shrink-0">
                        <CheckSquare size={16} className="shrink-0" />
                    </div>
                    <div className="hidden sm:block shrink-0">
                        <h1 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">Tarefas</h1>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 opacity-70">Operação e Entrega</p>
                    </div>

                    {/* CLIENT FILTER — local only, does NOT affect other tabs */}
                    <div className="ml-1 sm:ml-2 w-36 sm:w-44 shrink-0">
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

                    <div className="hidden sm:flex items-center gap-2 h-9 min-w-0 w-40 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
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

                    <button
                        onClick={() => onAdd('TAREFAS', localClientFilter ? { Cliente_ID: localClientFilter } : undefined)}
                        className="h-9 px-3 sm:px-4 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 hover:scale-[1.02] transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0"
                    >
                        <Plus size={15} strokeWidth={3} className="shrink-0" />
                        <span className="hidden sm:inline">Nova Tarefa</span>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 min-h-0 overflow-hidden p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 flex flex-col">

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
                                            onClick={() => onAdd('TAREFAS', { Status: status.id, ...(localClientFilter ? { Cliente_ID: localClientFilter } : {}) })}
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
                                            onClick={() => onAdd('TAREFAS', { Status: status.id, ...(localClientFilter ? { Cliente_ID: localClientFilter } : {}) })}
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
                    <div className="h-full overflow-hidden flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] shadow-sm">
                        {/* Header */}
                        <div className="table-responsive overflow-hidden shrink-0 pr-[8px]">
                            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                                <thead>
                                    <tr className="bg-zinc-50/80 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-700/60">
                                        <th className="w-10 px-3 py-3 text-center">
                                            <input type="checkbox" className="w-3 h-3 rounded border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-0 cursor-pointer"
                                                checked={selection.length === filteredTasks.length && filteredTasks.length > 0}
                                                onChange={() => selection.length === filteredTasks.length ? onClearSelection() : filteredTasks.forEach(t => !selection.includes(t.id) && onSelect(t.id))} />
                                        </th>
                                        {[
                                            { id: 'Título',       label: 'Tarefa',       w: 'flex-1 min-w-[180px]' },
                                            { id: 'Cliente',      label: 'Cliente',      w: 'w-[140px]' },
                                            { id: 'Status',       label: 'Status',       w: 'w-[130px]' },
                                            { id: 'Prioridade',   label: 'Prioridade',   w: 'w-[110px]' },
                                            { id: 'Data_Entrega', label: 'Entrega',      w: 'w-[100px]' },
                                            { id: 'Responsável',  label: 'Resp.',        w: 'w-[70px]' }
                                        ].map(col => (
                                            <th key={col.id}
                                                className={`px-3 py-3 text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em] cursor-pointer select-none transition-colors hover:text-zinc-700 dark:hover:text-zinc-200 ${col.w}`}
                                                onClick={() => { if(sortField===col.id) setSortDesc(!sortDesc); else { setSortField(col.id); setSortDesc(false); } }}>
                                                <div className="flex items-center gap-1.5">
                                                    {col.label}
                                                    {sortField === col.id && (sortDesc ? <ArrowDown size={10} className="text-blue-500 shrink-0" /> : <ArrowUp size={10} className="text-blue-500 shrink-0" />)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        {/* Body — h-0 flex-1 forces bounded height so overflow-y-auto works */}
                        <div className="h-0 flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
                                <tbody className="divide-y divide-zinc-100/80 dark:divide-zinc-800/40">
                                    {filteredTasks.map((Tarefa, idx) => {
                                        const Cliente   = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
                                        const prio      = getPriorityInfo(Tarefa.Prioridade);
                                        const PrioIcon  = prio.icon;
                                        const statusObj = DEFAULT_TASK_STATUSES.find(s => s.id === Tarefa.Status);
                                        const clientColor = Cliente?.['Cor (HEX)'] || '#94a3b8';
                                        const today = new Date(); today.setHours(0,0,0,0);
                                        const due   = Tarefa.Data_Entrega ? new Date(Tarefa.Data_Entrega + 'T12:00:00') : null;
                                        const days  = due ? Math.ceil((due.getTime() - today.getTime()) / 86400000) : null;
                                        const overdue = days !== null && days < 0;
                                        const dueToday = days === 0;

                                        return (
                                            <tr key={Tarefa.id} onClick={() => onSelectTask(Tarefa.id)}
                                                className={`group hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer relative ${selection.includes(Tarefa.id) ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''}`}
                                                style={{ animation: `fadeInUp 0.2s ease ${Math.min(idx * 15, 200)}ms both` }}>
                                                {/* Left status color bar */}
                                                <td className="w-10 px-3 py-3 text-center relative" onClick={e => { e.stopPropagation(); onSelect(Tarefa.id); }}>
                                                    <div className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full opacity-60" style={{ backgroundColor: statusObj?.cor || '#666' }} />
                                                    <input type="checkbox" checked={selection.includes(Tarefa.id)} readOnly
                                                        className="w-3 h-3 rounded border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-0 cursor-pointer" />
                                                </td>
                                                <td className="flex-1 min-w-0 px-3 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight group-hover:text-blue-500 transition-colors truncate" title={Tarefa.Título}>
                                                            {Tarefa.Título}
                                                        </p>
                                                        {(Tarefa as any).__syncFailed && (
                                                            <span title="Não sincronizado — será re-tentado automaticamente" className="shrink-0 text-[8px] px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20 font-black uppercase tracking-wide">
                                                                ⚠ local
                                                            </span>
                                                        )}
                                                    </div>
                                                    {Tarefa.Relacionado_A === 'Planejamento' && (
                                                        <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest">📅 Planejamento</span>
                                                    )}
                                                </td>
                                                <td className="w-[140px] px-3 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-4 h-4 rounded-md flex items-center justify-center text-[7px] font-black text-white shrink-0"
                                                             style={{ backgroundColor: clientColor }}>
                                                            {(Cliente?.Nome || 'A').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wide truncate">{Cliente?.Nome || 'Agência'}</span>
                                                    </div>
                                                </td>
                                                <td className="w-[130px] px-3 py-3">
                                                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg w-fit" style={{ backgroundColor: `${statusObj?.cor || '#666'}15` }}>
                                                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: statusObj?.cor || '#666' }} />
                                                        <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: statusObj?.cor || '#666' }}>
                                                            {statusObj?.rotulo || Tarefa.Status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="w-[110px] px-3 py-3">
                                                    {Tarefa.Prioridade ? (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase border ${prio.color}`}>
                                                            <PrioIcon size={8} />{Tarefa.Prioridade}
                                                        </span>
                                                    ) : <span className="text-zinc-300 dark:text-zinc-700 text-[9px]">—</span>}
                                                </td>
                                                <td className="w-[100px] px-3 py-3">
                                                    {due ? (
                                                        <span className={`inline-flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded-lg ${
                                                            overdue  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border border-rose-200/50 dark:border-rose-500/20'
                                                            : dueToday ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200/50 dark:border-amber-500/20'
                                                            : 'text-zinc-400'}`}>
                                                            <Clock size={8} />
                                                            {overdue ? `${Math.abs(days!)}d atr.` : dueToday ? 'Hoje' : due.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    ) : <span className="text-zinc-300 dark:text-zinc-700 text-[9px]">—</span>}
                                                </td>
                                                <td className="w-[70px] px-3 py-3">
                                                    <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[8px] font-black border border-zinc-200 dark:border-zinc-700"
                                                         title={Tarefa.Responsável || 'Sem responsável'}>
                                                        {Tarefa.Responsável?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTasks.length === 0 && isMounting && tasks.length === 0 && (
                                        /* Skeleton loader — avoids blank flash while tasks fetch (ui-ux-pro-max) */
                                        <>
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <tr key={`sk-${i}`} className="animate-pulse">
                                                    <td className="w-10 px-3 py-3"><div className="w-3 h-3 rounded bg-zinc-100 dark:bg-zinc-800 mx-auto" /></td>
                                                    <td className="px-3 py-3">
                                                        <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800" style={{ width: `${55 + (i % 3) * 15}%` }} />
                                                        {i % 3 === 0 && <div className="h-2 rounded-full bg-zinc-50 dark:bg-zinc-800/60 mt-1.5 w-24" />}
                                                    </td>
                                                    <td className="w-[140px] px-3 py-3"><div className="h-3 w-20 rounded-full bg-zinc-100 dark:bg-zinc-800" /></td>
                                                    <td className="w-[130px] px-3 py-3"><div className="h-5 w-16 rounded-lg bg-zinc-100 dark:bg-zinc-800" /></td>
                                                    <td className="w-[110px] px-3 py-3"><div className="h-5 w-14 rounded-lg bg-zinc-100 dark:bg-zinc-800" /></td>
                                                    <td className="w-[100px] px-3 py-3"><div className="h-3 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800" /></td>
                                                    <td className="w-[70px] px-3 py-3"><div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 mx-auto" /></td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                    {filteredTasks.length === 0 && !isMounting && (
                                        <tr>
                                            <td colSpan={7} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-3 text-zinc-300 dark:text-zinc-700">
                                                    <List size={36} strokeWidth={1} />
                                                    <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma tarefa encontrada</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {viewType === 'Calendar' && (
                    <div className="h-full flex flex-col overflow-hidden">
                        {/* CALENDAR HEADER */}
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-xl shadow-sm">
                                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleMonthNav(-1)} aria-label="Mês anterior">
                                    <ChevronLeft size={20} />
                                </button>
                                <h3 className="text-sm font-bold text-zinc-900 dark:text-white min-w-[150px] text-center uppercase tracking-[0.2em]">
                                    {MONTH_NAMES_BR[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h3>
                                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" onClick={() => handleMonthNav(1)} aria-label="Próximo mês">
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
                                                <button onClick={() => onAdd('TAREFAS', { Data_Entrega: diaObj.dateStr })} className="hover-reveal p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">
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
    workspaceMembers?: any[];
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
    taskId, tasks, clients, collaborators, workspaceMembers = [], onClose,
    onUpdate, onArchive, onDelete, onAdd,
    viewMode, setViewMode, savingStatus = {},
    setActiveTab, planejamento = []
}: TaskDetailPanelProps) {
    const t = tasks.find((Tarefa: Tarefa) => Tarefa.id === taskId);
    const [newCheckItem, setNewCheckItem] = useState('');
    const [uploading, setUploading] = useState(false);
    const [comment, setComment] = useState('');
    const [lightboxFile, setLightboxFile] = useState<AnexoTarefa | null>(null);
    const [lightboxIndex, setLightboxIndex] = useState<number>(0);
    const [notifyResponsible, setNotifyResponsible] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Download helper: base64 → Blob → sem compressão ──────────
    const downloadFile = (file: AnexoTarefa) => {
        try {
            const base64 = file.dados;
            // base64 data URL: "data:<mime>;base64,<data>"
            const parts = base64.split(',');
            const byteStr = atob(parts[1]);
            const mime = file.tipoMime || 'application/octet-stream';
            const ab = new ArrayBuffer(byteStr.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteStr.length; i++) ia[i] = byteStr.charCodeAt(i);
            const blob = new Blob([ab], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.nomeArquivo || 'arquivo';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error('Erro ao baixar arquivo:', err);
        }
    };

    useEffect(() => {
        if (viewMode !== 'sidebar') {
            setViewMode('sidebar');
        }

        const handleKey = (e: KeyboardEvent) => {
            if (lightboxFile) {
                const imageFiles = (t?.Anexos || []).filter((f: AnexoTarefa) => f.tipoMime?.startsWith('image/'));
                const idx = imageFiles.findIndex((f: AnexoTarefa) => f.id === lightboxFile.id);
                if (e.key === 'Escape')      { setLightboxFile(null); return; }
                if (e.key === 'ArrowRight' && idx < imageFiles.length - 1) { setLightboxFile(imageFiles[idx + 1]); return; }
                if (e.key === 'ArrowLeft'  && idx > 0)                    { setLightboxFile(imageFiles[idx - 1]); return; }
            } else {
                if (e.key === 'Escape') onClose();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [viewMode, setViewMode, onClose, lightboxFile, t]);

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
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.18em] flex items-center gap-1.5">
                            <HistoryIcon size={11} className="text-zinc-400 shrink-0" /> Status
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
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.18em] flex items-center gap-1.5">
                            <ShieldAlert size={11} className="text-zinc-400 shrink-0" /> Prioridade
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
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.18em] flex items-center gap-1.5">
                            <User size={11} className="text-zinc-400 shrink-0" /> Responsável
                        </label>
                        {(() => {
                            // Merge workspace members + VH collaborators (dedup by name)
                            const wmOptions = workspaceMembers.map((m: any) => ({
                                value: m.profiles?.full_name || m.profiles?.email || m.email || '',
                                label: m.profiles?.full_name || m.profiles?.email || m.email || 'Membro',
                                avatar: m.profiles?.avatar_url || null,
                                role: m.role || m.profiles?.role || 'membro',
                                email: m.profiles?.email || m.email || ''
                            })).filter(o => o.value);

                            const collabOptions = collaborators
                                .filter((c: any) => !wmOptions.find(w => w.value === c.Nome))
                                .map((c: any) => ({
                                    value: c.Nome,
                                    label: c.Nome,
                                    avatar: null,
                                    role: c.Função || 'colaborador',
                                    email: ''
                                }));

                            const allOptions = [...wmOptions, ...collabOptions];
                            const current = allOptions.find(o => o.value === t.Responsável);

                            return (
                                <div>
                                    {/* Current selection display */}
                                    <div className="flex items-center gap-2 mb-2">
                                        {current ? (
                                            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl w-full">
                                                {current.avatar ? (
                                                    <img src={current.avatar} alt={current.label} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-black text-white shrink-0">
                                                        {current.label.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-[10px] font-black text-blue-700 dark:text-blue-300 uppercase tracking-widest truncate flex-1">{current.label}</span>
                                                <button onClick={() => onUpdate(t.id, 'TAREFAS', 'Responsável', '')} className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 transition-colors">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-zinc-400 font-bold italic">Nenhum responsável</span>
                                        )}
                                    </div>
                                    {/* People list */}
                                    <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
                                        {allOptions.length === 0 ? (
                                            <p className="text-[9px] text-zinc-400 font-bold italic px-1">Nenhum membro no workspace.</p>
                                        ) : allOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                onClick={() => onUpdate(t.id, 'TAREFAS', 'Responsável', opt.value === t.Responsável ? '' : opt.value)}
                                                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all ${
                                                    opt.value === t.Responsável
                                                        ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'
                                                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-transparent'
                                                }`}
                                            >
                                                {opt.avatar ? (
                                                    <img src={opt.avatar} alt={opt.label} className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-zinc-200 dark:ring-zinc-700" />
                                                ) : (
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[9px] font-black text-white shrink-0">
                                                        {opt.label.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight truncate">{opt.label}</p>
                                                    {opt.email && <p className="text-[8px] text-zinc-400 font-bold truncate">{opt.email}</p>}
                                                </div>
                                                {opt.value === t.Responsável && (
                                                    <Check size={12} className="text-blue-500 shrink-0" strokeWidth={3} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                        <div className="absolute top-2 right-2">
                            <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Responsável`]} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm group relative">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.18em] flex items-center gap-1.5">
                            <Clock size={11} className="text-zinc-400 shrink-0" /> Entrega
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-zinc-600 to-zinc-800 dark:from-zinc-700 dark:to-zinc-900 flex items-center justify-center text-white shadow-md shrink-0">
                            <FileText size={13} className="shrink-0" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-[0.18em]">Descrição Estratégica</h4>
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                            <CheckCircle2 size={13} className="shrink-0" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-[0.18em]">Etapas de Execução</h4>
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                        {(t.Checklist?.length || 0) > 0 && (
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${
                                (t.Checklist?.filter(i => i.concluido).length || 0) === (t.Checklist?.length || 0)
                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                            }`}>
                                {t.Checklist?.filter(i => i.concluido).length || 0}/{t.Checklist?.length || 0}
                            </span>
                        )}
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
                                <button onClick={() => updateChecklist(t.Checklist.filter(i => i.id !== item.id))} className="hover-reveal text-zinc-400 hover:text-rose-500 transition-all">
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shrink-0">
                            <Paperclip size={13} className="shrink-0" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-[0.18em]">Arquivos e Mídia</h4>
                        {(t.Anexos || []).length > 0 && (
                            <span className="text-[9px] font-black px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-full">
                                {(t.Anexos || []).length}
                            </span>
                        )}
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
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
                                {/* ── Image grid ── */}
                                {(() => {
                                    const imageFiles = (t.Anexos || []).filter(f => f.tipoMime?.startsWith('image/'));
                                    if (imageFiles.length === 0) return null;
                                    return (
                                        <div className={`grid gap-2 mb-3 ${imageFiles.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                            {imageFiles.map((file, imgIdx) => {
                                                const sizeStr = file.tamanho
                                                    ? file.tamanho > 1024 * 1024
                                                        ? `${(file.tamanho / 1024 / 1024).toFixed(1)} MB`
                                                        : `${Math.round(file.tamanho / 1024)} KB`
                                                    : '';
                                                return (
                                                    <div key={file.id}
                                                        className="group relative rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm cursor-pointer"
                                                        style={{ aspectRatio: imageFiles.length === 1 ? 'auto' : '16/10', maxHeight: imageFiles.length === 1 ? '280px' : undefined }}
                                                        onClick={() => { setLightboxFile(file); setLightboxIndex(imgIdx); }}
                                                    >
                                                        <img
                                                            src={file.dados}
                                                            alt={file.nomeArquivo}
                                                            className={`w-full transition-transform duration-500 group-hover:scale-105 ${imageFiles.length === 1 ? 'h-auto max-h-[280px] object-contain' : 'h-full object-cover'}`}
                                                        />
                                                        {/* Hover overlay — Ver + Baixar only (fits any card width) */}
                                                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                                            <button
                                                                onClick={e => { e.stopPropagation(); setLightboxFile(file); setLightboxIndex(imgIdx); }}
                                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/30 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all shadow-lg border border-white/20"
                                                            >
                                                                <Eye size={13} /> Ver
                                                            </button>
                                                            <button
                                                                onClick={e => { e.stopPropagation(); downloadFile(file); }}
                                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/80 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all shadow-lg border border-blue-400/30"
                                                            >
                                                                <Download size={13} /> Baixar
                                                            </button>
                                                        </div>
                                                        {/* Delete button — fixed top-right corner, always accessible */}
                                                        <button
                                                            onClick={e => { e.stopPropagation(); updateAttachments((t.Anexos || []).filter(a => a.id !== file.id)); }}
                                                            className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-rose-500/80 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-rose-400/30 backdrop-blur-md z-10"
                                                            title="Remover imagem"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                        {/* Bottom info bar */}
                                                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                            <p className="text-[9px] text-white font-black truncate">{file.nomeArquivo}</p>
                                                            {sizeStr && <p className="text-[8px] text-white/60 font-bold">{sizeStr} · qualidade original</p>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}

                                {/* ── Non-image files list ── */}
                                {(t.Anexos || []).filter(f => !f.tipoMime?.startsWith('image/')).map(file => {
                                    const isVideo   = file.tipoMime?.startsWith('video/');
                                    const isAudio   = file.tipoMime?.startsWith('audio/');
                                    const isPdf     = file.tipoMime === 'application/pdf';
                                    const isArchive = file.tipoMime?.includes('zip') || file.tipoMime?.includes('rar');
                                    const isCode    = file.tipoMime?.includes('javascript') || file.tipoMime?.includes('json') || file.tipoMime?.includes('xml') || !!file.nomeArquivo?.match(/\.(js|ts|json|xml|html|css)$/i);
                                    const FileIcon  = isVideo ? Film : isAudio ? Music : isPdf ? FileText : isArchive ? Archive : isCode ? Code2 : FileText;
                                    const iconColor = isVideo ? 'text-purple-500' : isAudio ? 'text-pink-500' : isPdf ? 'text-red-500' : isArchive ? 'text-amber-500' : 'text-blue-500';
                                    const sizeStr   = file.tamanho ? (file.tamanho > 1024 * 1024 ? `${(file.tamanho / 1024 / 1024).toFixed(1)}MB` : `${Math.round(file.tamanho / 1024)}KB`) : '';
                                    return (
                                        <div key={file.id} className="group flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all">
                                            <div className={`w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 ${iconColor}`}>
                                                <FileIcon size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{file.nomeArquivo}</p>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">
                                                    {file.tipoMime?.split('/')[1]?.toUpperCase() || 'FILE'}{sizeStr ? ` · ${sizeStr}` : ''}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-1.5 hover-reveal transition-opacity">
                                                <button
                                                    onClick={() => downloadFile(file)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-500 text-blue-600 hover:text-white text-[9px] font-black uppercase transition-all"
                                                    title="Baixar arquivo original"
                                                >
                                                    <Download size={11} /> Baixar
                                                </button>
                                                <button
                                                    onClick={() => updateAttachments((t.Anexos || []).filter(a => a.id !== file.id))}
                                                    className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500 hover:text-white text-zinc-400 flex items-center justify-center transition-all"
                                                    title="Remover"
                                                >
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
                <section className="space-y-5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
                            <MessageSquare size={13} className="shrink-0" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase text-zinc-900 dark:text-zinc-100 tracking-[0.18em]">Atividade e Timeline</h4>
                        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                    </div>

                    <div className="space-y-3">
                        {(t.Atividades || []).map(act => (
                            <div key={act.id} className="flex gap-3 group">
                                <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                                    act.tipo === 'comment'
                                        ? 'bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-500'
                                        : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-500'
                                }`}>
                                    {act.tipo === 'comment' ? <MessageSquare size={12} className="shrink-0" /> : <Zap size={12} className="shrink-0" />}
                                </div>
                                <div className="flex-1 min-w-0 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 px-3 py-2 shadow-sm">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{act.usuario}</span>
                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-zinc-500 leading-relaxed">{act.mensagem}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2.5 mt-2">
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="ESCREVA UM COMENTÁRIO..."
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-[10px] font-black uppercase tracking-widest placeholder-zinc-300 dark:placeholder-zinc-700 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all min-h-[72px] shadow-sm resize-none"
                        />
                        <div className="flex justify-end">
                            <button
                                onClick={handleAddComment}
                                disabled={!comment.trim()}
                                className="px-5 py-2.5 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-violet-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/20 hover:scale-105"
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
            {/* ── LIGHTBOX PREMIUM ── */}
            {lightboxFile && (() => {
                const imageFiles = (t.Anexos || []).filter(f => f.tipoMime?.startsWith('image/'));
                const currentIdx = imageFiles.findIndex(f => f.id === lightboxFile.id);
                const hasPrev = currentIdx > 0;
                const hasNext = currentIdx < imageFiles.length - 1;
                const sizeStr = lightboxFile.tamanho
                    ? lightboxFile.tamanho > 1024 * 1024
                        ? `${(lightboxFile.tamanho / 1024 / 1024).toFixed(2)} MB`
                        : `${Math.round(lightboxFile.tamanho / 1024)} KB`
                    : '';

                const goTo = (idx: number) => {
                    if (idx >= 0 && idx < imageFiles.length) {
                        setLightboxFile(imageFiles[idx]);
                        setLightboxIndex(idx);
                    }
                };

                return (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col animate-fade-blur"
                        onClick={() => setLightboxFile(null)}
                    >
                        {/* Top bar */}
                        <div className="flex items-center justify-between px-6 py-4 shrink-0" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                    <ImageIcon size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white truncate max-w-[300px]">{lightboxFile.nomeArquivo}</p>
                                    <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                                        {sizeStr && `${sizeStr} · `}qualidade original preservada
                                        {imageFiles.length > 1 && ` · ${currentIdx + 1} de ${imageFiles.length}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => downloadFile(lightboxFile)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95"
                                >
                                    <Download size={14} /> Baixar
                                </button>
                                <button
                                    onClick={() => {
                                        updateAttachments((t.Anexos || []).filter(a => a.id !== lightboxFile.id));
                                        setLightboxFile(null);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/80 hover:bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95"
                                >
                                    <Trash2 size={14} /> Excluir
                                </button>
                                <button
                                    onClick={() => setLightboxFile(null)}
                                    className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all hover:rotate-90"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Image container */}
                        <div className="flex-1 flex items-center justify-center px-16 pb-6 min-h-0 relative" onClick={e => e.stopPropagation()}>
                            {/* Prev */}
                            {hasPrev && (
                                <button
                                    onClick={() => goTo(currentIdx - 1)}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-110 z-10"
                                >
                                    <ChevronLeft size={22} />
                                </button>
                            )}

                            <img
                                key={lightboxFile.id}
                                src={lightboxFile.dados}
                                alt={lightboxFile.nomeArquivo}
                                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl select-none animate-in fade-in zoom-in-95 duration-200"
                                draggable={false}
                                style={{ maxHeight: 'calc(100vh - 180px)' }}
                            />

                            {/* Next */}
                            {hasNext && (
                                <button
                                    onClick={() => goTo(currentIdx + 1)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all hover:scale-110 z-10"
                                >
                                    <ChevronRight size={22} />
                                </button>
                            )}
                        </div>

                        {/* Thumbnail strip (when multiple images) */}
                        {imageFiles.length > 1 && (
                            <div className="flex items-center justify-center gap-2 px-6 pb-5 shrink-0" onClick={e => e.stopPropagation()}>
                                {imageFiles.map((f, i) => (
                                    <button
                                        key={f.id}
                                        onClick={() => goTo(i)}
                                        className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${f.id === lightboxFile.id ? 'border-white scale-110 shadow-lg' : 'border-white/20 hover:border-white/50 opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={f.dados} alt={f.nomeArquivo} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

