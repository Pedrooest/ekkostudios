import React, { useState, useMemo, useEffect, useRef } from 'react';
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
    Columns, CalendarDays, ChevronLeft, ChevronRight, CheckSquare, ArrowUp, ArrowDown, Check, Mail, Flag
} from 'lucide-react';
import { sendEmail, templates } from '../utils/emailService';
import { DatabaseService } from '../DatabaseService';
import { getCalendarDays, MONTH_NAMES_BR, WEEKDAYS_BR_SHORT } from '../utils/calendarUtils';
import { Card, Button, DeletionBar, Badge } from '../Components';
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
}

const SavingIndicator = ({ status }: { status?: 'saving' | 'success' | 'error' }) => {
    if (!status) return null;
    return (
        <div className="flex items-center gap-1 pointer-events-none z-10 animate-fade">
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const Cliente = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
    const prio = getPriorityInfo(Tarefa.Prioridade);
    const isOverdue = Tarefa.Data_Entrega && new Date(Tarefa.Data_Entrega) < new Date(new Date().setHours(0,0,0,0));

    return (
        <div
            ref={setNodeRef} style={style} {...attributes} {...listeners}
            onClick={() => onSelectTask(Tarefa.id)}
            className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all group flex flex-col gap-3 relative overflow-hidden cursor-grab active:cursor-grabbing ${selection.includes(Tarefa.id) ? 'ring-2 ring-zinc-900 dark:ring-white bg-zinc-50 dark:bg-zinc-800' : ''} ${isDragging ? 'ring-2 ring-zinc-900 z-50 shadow-2xl scale-[1.02]' : ''}`}
        >
            <div className="absolute top-0 left-0 w-1 h-full opacity-40" style={{ backgroundColor: statusCor }} />
            
            <div className="flex justify-between items-start pointer-events-none gap-2">
                <Badge color="slate" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 opacity-60">
                    {Cliente?.Nome || 'AGÊNCIA'}
                </Badge>
                <div className={`w-2 h-2 rounded-full ${prio.color.split(' ')[0].replace('text-', 'bg-')} shadow-[0_0_8px_rgba(0,0,0,0.1)]`} title={Tarefa.Prioridade} />
            </div>
            
            <h4 className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-tight group-hover:text-blue-500 transition-colors pointer-events-none mt-1 line-clamp-2" title={Tarefa.Título}>
                {Tarefa.Título}
            </h4>
            
            <div className="flex items-center justify-between mt-1 pt-3 border-t border-zinc-100 dark:border-zinc-800 pointer-events-none">
                <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${isOverdue ? 'text-rose-600' : 'text-zinc-400'}`}>
                    {Tarefa.Data_Entrega ? <span className="flex items-center gap-1.5"><Clock size={10} /> {Tarefa.Data_Entrega}</span> : <span className="flex items-center gap-1.5 opacity-30"><Clock size={10} /> S/ DATA</span>}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center text-[9px] font-black border border-zinc-200 dark:border-zinc-800 transition-all shrink-0">
                        {Tarefa.Responsável?.slice(0, 1).toUpperCase() || '?'}
                    </div>
                    {/* Visual indicator for task updates (like status change via drag & drop) */}
                    {Object.keys(savingStatus || {}).some(k => k.startsWith(`TAREFAS:${Tarefa.id}:`)) && (
                        <SavingIndicator status={Object.entries(savingStatus || {}).find(([k]) => k.startsWith(`TAREFAS:${Tarefa.id}:`))?.[1] as any} />
                    )}
                </div>
            </div>
        </div>
    );
});

function TaskCardOverlay({ Tarefa, clients, getPriorityInfo, statusCor }: any) {
    const Cliente = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
    const clientColorCss = Cliente?.['Cor (HEX)'] || '#3B82F6';
    const prio = getPriorityInfo(Tarefa.Prioridade);
    return (
        <div className={`bg-white dark:bg-zinc-900 border-2 border-blue-500 p-4 rounded-xl shadow-2xl flex flex-col gap-3 relative overflow-hidden rotate-2 cursor-grabbing opacity-95 scale-105 min-w-[300px]`}>
            <div className="absolute top-0 left-0 w-[4px] h-full" style={{ backgroundColor: statusCor }} />
            <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 truncate max-w-[140px]">{Cliente?.Nome || 'Agência'}</span>
                <div className={`px-2 py-0.5 rounded flex items-center gap-1.5 ${prio.color}`}><prio.icon size={8} /></div>
            </div>
            <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-snug truncate mt-1">{Tarefa.Título}</h4>
        </div>
    );
}

export function TaskFlowView({
    tasks, clients, collaborators, activeViewId, setActiveViewId,
    onUpdate, onDelete, onArchive, onAdd, onSelectTask,
    selection, onSelect, onClearSelection, savingStatus = {}
}: TaskFlowViewProps) {
    const [globalSearch, setGlobalSearch] = useState('');
    const [sortField, setSortField] = useState<string>('Data_Entrega');
    const [sortDesc, setSortDesc] = useState<boolean>(false);

    const filteredTasks = useMemo(() => {
        let ft = tasks.filter((t: any) => (!globalSearch || t.Título.toLowerCase().includes(globalSearch.toLowerCase()) || clients.find((c:any)=>c.id === t.Cliente_ID)?.Nome?.toLowerCase().includes(globalSearch.toLowerCase())) && t.Status !== 'arquivado');
        
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
    }, [tasks, globalSearch, sortField, sortDesc, clients]);

    const viewType = useMemo(() => DEFAULT_TASK_VIEWS.find(v => v.id === activeViewId)?.tipo || 'List', [activeViewId]);

    const [currentDate, setCurrentDate] = useState(new Date());

    const calendarDays = useMemo(() => {
        return getCalendarDays(currentDate.getFullYear(), currentDate.getMonth());
    }, [currentDate]);

    const handleMonthNav = (dir: number) => {
        const next = new Date(currentDate);
        next.setMonth(next.getMonth() + dir);
        setCurrentDate(next);
    };

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

    const getPriorityInfo = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'baixa': return { color: 'text-emerald-500 bg-emerald-500/10', icon: Flag };
            case 'média':
            case 'media': return { color: 'text-amber-500 bg-amber-500/10', icon: Flag };
            case 'alta': return { color: 'text-rose-500 bg-rose-500/10', icon: Flag };
            case 'urgente': return { color: 'text-purple-500 bg-purple-500/10', icon: Zap };
            default: return { color: 'text-zinc-500 bg-zinc-500/10', icon: Flag };
        }
    };

    return (
        <div className="view-root flex flex-col h-full bg-white dark:bg-zinc-950 overflow-hidden animate-fade">
            {/* MODERN TOP HEADER */}
            <div className="shrink-0 flex items-center justify-between flex-wrap gap-4 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10">
                            <CheckSquare size={20} className="shrink-0" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Tarefas</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 opacity-60">Operação e Entrega Estratégica</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        {DEFAULT_TASK_VIEWS.map((v: any) => (
                            <button
                                key={v.id}
                                onClick={() => setActiveViewId(v.id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === v.id ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm shadow-zinc-500/10 active:scale-95' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}`}
                            >
                                {v.tipo === 'List' || (v as any).type === 'List' ? <List size={14} /> : v.tipo === 'Board' || (v as any).type === 'Board' ? <Columns size={14} /> : <CalendarDays size={14} />}
                                {v.nome || (v as any).name}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 group h-10 w-48 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 focus-within:ring-4 focus-within:ring-zinc-500/5 transition-all">
                        <Search className="text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors shrink-0" size={14} />
                        <input
                            type="text"
                            value={globalSearch}
                            onChange={e => setGlobalSearch(e.target.value)}
                            placeholder="BUSCAR TAREFA..."
                            className="flex-1 bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100"
                        />
                    </div>

                    <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'TAREFAS')} onArchive={() => onArchive(selection, 'TAREFAS', true)} onClear={onClearSelection} />
                    
                    <Button
                        onClick={() => onAdd('TAREFAS')}
                        className="!h-10 px-4 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-zinc-500/10 active:scale-95 transition-all"
                    >
                        <Plus size={16} className="mr-2" /> Nova Tarefa
                    </Button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">

                {viewType === 'Board' && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar-horizontal">
                            {DEFAULT_TASK_STATUSES.map(status => {
                                const columnTasks = filteredTasks.filter(t => t.Status === status.id);
                                return (
                                <div key={status.id} className="w-[300px] flex flex-col max-h-full shrink-0 relative">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-4 h-4 rounded-md shadow-sm flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.cor }} />
                                            </div>
                                            <h3 className="text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.1em]">{status.rotulo}</h3>
                                            <Badge color="slate" className="text-[8px] font-black px-1.5 py-0.5 opacity-60">
                                                {columnTasks.length}
                                            </Badge>
                                        </div>
                                        <button onClick={() => onAdd('TAREFAS', { Status: status.id })} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"><Plus size={14} /></button>
                                    </div>

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
                                        <button
                                            onClick={() => onAdd('TAREFAS', { Status: status.id })}
                                            className="w-full mt-2 py-3 flex items-center justify-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white dark:hover:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all uppercase tracking-widest shadow-sm hover:shadow-md"
                                        >
                                            <Plus size={14} /> Adicionar
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
                                                <td className={`w-[100px] p-3 text-[9px] font-black uppercase tracking-widest ${isOverdue ? 'text-rose-600' : 'text-zinc-400'}`}>
                                                    {Tarefa.Data_Entrega || '--/--'}
                                                </td>
                                                <td className="w-[80px] p-3">
                                                    <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center text-[9px] font-black border border-zinc-200 dark:border-zinc-800 transition-all shrink-0">
                                                        {Tarefa.Responsável?.slice(0, 1).toUpperCase() || '?'}
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
}

export function TaskDetailPanel({
    taskId, tasks, clients, collaborators, onClose,
    onUpdate, onArchive, onDelete, onAdd,
    viewMode, setViewMode, savingStatus = {}
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
                        <select
                            value={t.Status}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Status', e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase focus:ring-1 focus:ring-zinc-400 p-2 cursor-pointer outline-none transition-all"
                        >
                            {DEFAULT_TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.rotulo}</option>)}
                        </select>
                        <div className="absolute top-2 right-2">
                            <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Status`]} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm group relative">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert size={12} className="text-zinc-400" /> Prioridade
                        </label>
                        <select
                            value={t.Prioridade}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Prioridade', e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase focus:ring-1 focus:ring-zinc-400 p-2 cursor-pointer outline-none transition-all"
                        >
                            {PRIORIDADE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <div className="absolute top-2 right-2">
                            <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Prioridade`]} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm group relative">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} className="text-zinc-400" /> Responsável
                        </label>
                        <select
                            value={t.Responsável || ''}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Responsável', e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase focus:ring-1 focus:ring-zinc-400 p-2 cursor-pointer outline-none transition-all"
                        >
                            <option value="">Sem Resp.</option>
                            {collaborators.map((c: any) => <option key={c.id} value={c.Nome}>{c.Nome}</option>)}
                        </select>
                        <div className="absolute top-2 right-2">
                            <SavingIndicator status={savingStatus[`TAREFAS:${t.id}:Responsável`]} />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 flex flex-col gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors shadow-sm group relative">
                        <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} className="text-zinc-400" /> Entrega
                        </label>
                        <input
                            type="date"
                            value={t.Data_Entrega || ''}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Data_Entrega', e.target.value)}
                            className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase focus:ring-1 focus:ring-zinc-400 p-2 cursor-pointer outline-none transition-all"
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
                            <ImageIcon size={14} className="text-zinc-400" /> Ativos e Mídia
                        </h4>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors flex items-center gap-2"
                        >
                            {uploading ? <Loader2 size={12} className="animate-spin" /> : <><Plus size={12} /> Upload</>}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {(t.Anexos || []).map(file => (
                            <div key={file.id} className="group relative aspect-video rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm">
                                <img src={file.dados} alt={file.nomeArquivo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px]">
                                    <button onClick={() => setLightboxImage(file.dados)} className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-lg"><Eye size={16} /></button>
                                    <button onClick={() => updateAttachments((t.Anexos || []).filter(a => a.id !== file.id))} className="w-8 h-8 rounded-lg bg-rose-500/30 hover:bg-rose-500 text-rose-100 flex items-center justify-center backdrop-blur-md transition-all shadow-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        {(!t.Anexos || t.Anexos.length === 0) && (
                            <div className="col-span-2 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl py-8 flex flex-col items-center justify-center gap-3 text-zinc-400 group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 group-hover:scale-105 transition-transform"><ImageIcon size={18} /></div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Arraste Ativos Aqui</p>
                                    <p className="text-[8px] font-bold uppercase opacity-60 mt-0.5">Imagens até 20MB</p>
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

