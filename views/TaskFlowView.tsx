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
    Columns, CalendarDays, ChevronLeft, ChevronRight, CheckSquare, ArrowUp, ArrowDown
} from 'lucide-react';
import { getCalendarDays, MONTH_NAMES_BR, WEEKDAYS_BR_SHORT } from '../utils/calendarUtils';
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

function DroppableColumn({ id, children }: { id: string, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
        data: { type: 'Column', status: id }
    });
    return (
        <div ref={setNodeRef} className={`flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2 transition-colors ${isOver ? 'bg-blue-500/5 rounded-2xl p-2 border border-dashed border-blue-500/30 ring-2 ring-blue-500/20' : ''}`}>
            {children}
        </div>
    );
}

function SortableTaskCard({ Tarefa, clients, getPriorityInfo, onSelectTask, selection, statusCor }: any) {
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
    const clientColorCss = Cliente?.['Cor (HEX)'] || '#3B82F6';
    const prio = getPriorityInfo(Tarefa.Prioridade);
    const isOverdue = Tarefa.Data_Entrega && new Date(Tarefa.Data_Entrega) < new Date(new Date().setHours(0,0,0,0));

    return (
        <div
            ref={setNodeRef} style={style} {...attributes} {...listeners}
            onClick={() => onSelectTask(Tarefa.id)}
            className={`bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all group flex flex-col gap-3 relative overflow-hidden cursor-grab active:cursor-grabbing ${selection.includes(Tarefa.id) ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''} ${isDragging ? 'ring-2 ring-blue-500 z-50 shadow-2xl scale-105' : ''}`}
        >
            <div className="absolute top-0 left-0 w-[3px] h-full opacity-60" style={{ backgroundColor: statusCor }} />
            <div className="flex justify-between items-start pointer-events-none gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md truncate max-w-[140px]" style={{ color: clientColorCss, backgroundColor: `${clientColorCss}15` }}>
                    {Cliente?.Nome || 'Agência'}
                </span>
                <div className={`px-2 py-0.5 rounded flex items-center gap-1.5 ${prio.color}`} title={Tarefa.Prioridade}>
                    <i className={`fa-solid ${prio.icon} text-[8px]`}></i>
                </div>
            </div>
            
            <h4 className="text-[13px] font-bold text-app-text-strong leading-snug group-hover:text-blue-500 transition-colors uppercase tracking-tight pointer-events-none mt-1 truncate" title={Tarefa.Título}>{Tarefa.Título}</h4>
            
            <div className="flex items-center justify-between mt-2 pt-3 border-t border-app-border/50 pointer-events-none">
                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight ${isOverdue ? 'text-rose-500' : 'text-app-text-muted'}`}>
                    {Tarefa.Data_Entrega ? <span className="flex items-center gap-1.5"><Clock size={12} /> {Tarefa.Data_Entrega}</span> : <span className="flex items-center gap-1.5 opacity-40"><Clock size={12} /> S/ Data</span>}
                    {Tarefa.Checklist && Tarefa.Checklist.length > 0 && <span className="flex items-center gap-1 text-app-text-muted opacity-80 ml-1"><CheckCircle2 size={10} /> {Tarefa.Checklist.filter((i:any)=>i.concluido).length}/{Tarefa.Checklist.length}</span>}
                </div>
                <div className="w-6 h-6 rounded-full bg-app-surface-2 text-app-text-strong flex items-center justify-center text-[10px] font-black border border-app-border group-hover:ring-2 group-hover:ring-app-border-strong transition-all shrink-0" title={Tarefa.Responsável}>
                    {Tarefa.Responsável?.slice(0, 1).toUpperCase() || '?'}
                </div>
            </div>
        </div>
    );
}

function TaskCardOverlay({ Tarefa, clients, getPriorityInfo, statusCor }: any) {
    const Cliente = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
    const clientColorCss = Cliente?.['Cor (HEX)'] || '#3B82F6';
    const prio = getPriorityInfo(Tarefa.Prioridade);
    return (
        <div className={`bg-app-surface border border-blue-500 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 relative overflow-hidden rotate-3 cursor-grabbing ring-4 ring-blue-500/20 opacity-95 scale-105 min-w-[300px]`}>
            <div className="absolute top-0 left-0 w-[4px] h-full" style={{ backgroundColor: statusCor }} />
            <div className="flex justify-between items-start gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md truncate max-w-[140px]" style={{ color: clientColorCss, backgroundColor: `${clientColorCss}15` }}>{Cliente?.Nome || 'Agência'}</span>
                <div className={`px-2 py-0.5 rounded flex items-center gap-1.5 ${prio.color}`}><i className={`fa-solid ${prio.icon} text-[8px]`}></i></div>
            </div>
            <h4 className="text-[13px] font-bold text-app-text-strong leading-snug uppercase tracking-tight mt-1 truncate">{Tarefa.Título}</h4>
        </div>
    );
}

export function TaskFlowView({
    tasks, clients, collaborators, activeViewId, setActiveViewId,
    onUpdate, onDelete, onArchive, onAdd, onSelectTask,
    selection, onSelect, onClearSelection
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
        return filteredTasks.filter((t: any) => t.Data_Entrega === dateStr);
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
            case 'baixa': return { color: 'text-emerald-500 bg-emerald-500/10', icon: 'fa-flag' };
            case 'média':
            case 'media': return { color: 'text-amber-500 bg-amber-500/10', icon: 'fa-flag' };
            case 'alta': return { color: 'text-rose-500 bg-rose-500/10', icon: 'fa-flag' };
            case 'urgente': return { color: 'text-purple-500 bg-purple-500/10', icon: 'fa-bolt' };
            default: return { color: 'text-zinc-500 bg-zinc-500/10', icon: 'fa-flag' };
        }
    };

    return (
        <div className="flex flex-col h-full pointer-events-auto text-left relative bg-app-bg">
            {/* TOP BAR SAAS HEADER */}
            <div className="px-6 py-5 border-b border-app-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-app-surface/50 backdrop-blur shrink-0 z-10 w-full">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-black text-app-text-strong uppercase tracking-[0.15em] flex items-center gap-3">
                        <CheckSquare className="text-blue-500" size={24} /> Tarefas
                    </h1>
                    <div className="hidden md:flex gap-1.5 bg-app-surface-2 p-1 rounded-xl">
                        {DEFAULT_TASK_STATUSES.slice(0,3).map(s => (
                            <div key={s.id} className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-bold text-app-text-muted border border-app-border" title={s.rotulo}>
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.cor }} />
                                {filteredTasks.filter(t=>t.Status === s.id).length}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 custom-scrollbar-horizontal shrink-0">
                    {/* View Toggles */}
                    <div className="flex bg-app-bg border border-app-border rounded-xl p-1 shrink-0">
                        {DEFAULT_TASK_VIEWS.map((v: any) => (
                            <button
                                key={v.id}
                                onClick={() => setActiveViewId(v.id)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === v.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 border-transparent' : 'text-app-text-muted hover:text-app-text-strong border-transparent'}`}
                            >
                                {v.tipo === 'List' || (v as any).type === 'List' ? <List size={14} /> : v.tipo === 'Board' || (v as any).type === 'Board' ? <Columns size={14} /> : <CalendarDays size={14} />}
                                {v.nome || (v as any).name}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-40 shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={14} />
                        <input
                            type="text"
                            value={globalSearch}
                            onChange={e => setGlobalSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full h-9 bg-app-surface border border-app-border text-app-text-strong rounded-xl pl-9 text-[11px] font-bold uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all placeholder-app-text-muted/50"
                        />
                    </div>

                    <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'TAREFAS')} onArchive={() => onArchive(selection, 'TAREFAS', true)} onClear={onClearSelection} />
                    
                    <button
                        onClick={() => onAdd('TAREFAS')}
                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap shrink-0"
                    >
                        <Plus size={16} /> Nova Tarefa
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden p-6 bg-app-bg/50 rounded-b-[32px]">

                {viewType === 'Board' && (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar-horizontal">
                            {DEFAULT_TASK_STATUSES.map(status => {
                                const columnTasks = filteredTasks.filter(t => t.Status === status.id);
                                return (
                                <div key={status.id} className="w-[320px] flex flex-col max-h-full shrink-0 relative">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.cor }} />
                                            <h3 className="text-[11px] font-black text-app-text-strong uppercase tracking-[0.2em]">{status.rotulo}</h3>
                                            <span className="text-[10px] font-black text-app-text-muted bg-app-surface-2 px-2 py-0.5 rounded-full">
                                                {columnTasks.length}
                                            </span>
                                        </div>
                                        <button onClick={() => onAdd('TAREFAS', { Status: status.id })} className="text-app-text-muted hover:text-blue-500 transition-colors"><Plus size={16} /></button>
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
                                                />
                                            ))}
                                        </SortableContext>
                                        <button
                                            onClick={() => onAdd('TAREFAS', { Status: status.id })}
                                            className="w-full mt-2 py-2.5 flex items-center justify-center gap-2 text-[10px] font-black text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2 rounded-xl border border-dashed border-app-border hover:border-app-border-strong transition-all uppercase tracking-widest"
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
                    <div className="h-full overflow-hidden flex flex-col bg-app-surface border border-app-border rounded-2xl shadow-sm relative">
                        {/* Table Header Wrapper to keep it fixed */}
                        <div className="overflow-hidden border-b border-app-border bg-app-surface-2/50 backdrop-blur shrink-0 pr-[8px]">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead>
                                    <tr>
                                        <th className="w-12 p-3 text-center">
                                            <input type="checkbox" className="w-3 h-3 text-blue-500 rounded focus:ring-0 bg-transparent border-app-border" checked={selection.length === filteredTasks.length && filteredTasks.length > 0} onChange={() => selection.length === filteredTasks.length ? onClearSelection() : filteredTasks.forEach(t => !selection.includes(t.id) && onSelect(t.id))} />
                                        </th>
                                        {[
                                            { id: 'Título', label: 'Nome da Tarefa', width: 'flex-1 min-w-[200px]' },
                                            { id: 'Cliente', label: 'Cliente', width: 'w-[150px]' },
                                            { id: 'Status', label: 'Status', width: 'w-[120px]' },
                                            { id: 'Prioridade', label: 'Prioridade', width: 'w-[120px]' },
                                            { id: 'Data_Entrega', label: 'Entrega', width: 'w-[100px]' },
                                            { id: 'Responsável', label: 'Resp.', width: 'w-[80px]' }
                                        ].map(col => (
                                            <th key={col.id} className={`p-3 text-[10px] font-black text-app-text-muted hover:text-app-text-strong uppercase tracking-widest cursor-pointer select-none transition-colors ${col.width}`} 
                                                onClick={() => { if(sortField===col.id) setSortDesc(!sortDesc); else { setSortField(col.id); setSortDesc(false); } }}>
                                                <div className="flex items-center gap-2">
                                                    {col.label}
                                                    {sortField === col.id && (sortDesc ? <ArrowDown size={12} className="text-blue-500" /> : <ArrowUp size={12} className="text-blue-500" />)}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                            </table>
                        </div>
                        
                        {/* Table Body Scrollable */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-app-bg pb-32">
                            <table className="w-full text-left border-collapse table-fixed">
                                <tbody>
                                    {filteredTasks.map(Tarefa => {
                                        const Cliente = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
                                        const clientColorCss = Cliente?.['Cor (HEX)'] || '#3B82F6';
                                        const prio = getPriorityInfo(Tarefa.Prioridade);
                                        const isOverdue = Tarefa.Data_Entrega && new Date(Tarefa.Data_Entrega) < new Date(new Date().setHours(0,0,0,0));
                                        const statusObj = DEFAULT_TASK_STATUSES.find(s=>s.id === Tarefa.Status);
                                        
                                        return (
                                            <tr
                                                key={Tarefa.id}
                                                onClick={() => onSelectTask(Tarefa.id)}
                                                className={`group border-b border-app-border/50 hover:bg-app-surface transition-colors cursor-pointer ${selection.includes(Tarefa.id) ? 'bg-blue-500/5' : 'even:bg-app-surface/20'}`}
                                            >
                                                <td className="w-12 p-3 text-center" onClick={e => { e.stopPropagation(); onSelect(Tarefa.id); }}>
                                                    <input type="checkbox" checked={selection.includes(Tarefa.id)} readOnly className="w-3 h-3 text-blue-500 rounded focus:ring-0 bg-transparent border-app-border group-hover:border-blue-500/50 transition-colors" />
                                                </td>
                                                <td className="flex-1 min-w-0 p-3">
                                                    <span className="text-[12px] font-bold text-app-text-strong uppercase tracking-tight group-hover:text-blue-500 transition-colors block truncate" title={Tarefa.Título}>{Tarefa.Título}</span>
                                                </td>
                                                <td className="w-[150px] p-3 truncate">
                                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ color: clientColorCss, backgroundColor: `${clientColorCss}15` }}>
                                                        {Cliente?.Nome || 'Agência'}
                                                    </span>
                                                </td>
                                                <td className="w-[120px] p-3">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-app-text-strong uppercase tracking-tight">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusObj?.cor || '#666' }} />
                                                        {statusObj?.rotulo || Tarefa.Status}
                                                    </div>
                                                </td>
                                                <td className="w-[120px] p-3">
                                                    <div className={`px-2 py-0.5 rounded flex items-center gap-1.5 w-max ${prio.color}`} title={Tarefa.Prioridade}>
                                                        <i className={`fa-solid ${prio.icon} text-[8px]`}></i>
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">{Tarefa.Prioridade}</span>
                                                    </div>
                                                </td>
                                                <td className={`w-[100px] p-3 text-[10px] font-bold uppercase tracking-tight ${isOverdue ? 'text-rose-500' : 'text-app-text-muted'}`}>
                                                    {Tarefa.Data_Entrega || '--/--'}
                                                </td>
                                                <td className="w-[80px] p-3">
                                                    <div className="w-6 h-6 rounded-full bg-app-surface-2 text-app-text-strong flex items-center justify-center text-[10px] font-black border border-app-border group-hover:ring-2 group-hover:ring-app-border-strong transition-all shrink-0" title={Tarefa.Responsável}>
                                                        {Tarefa.Responsável?.slice(0, 1).toUpperCase() || '?'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredTasks.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-[11px] font-black uppercase tracking-widest text-app-text-muted border-none">
                                                NENHUMA TAREFA ENCONTRADA
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
                            <div className="flex items-center gap-4 bg-app-surface border border-app-border p-2 rounded-2xl shadow-sm">
                                <button className="p-2 rounded-xl hover:bg-app-surface-2 text-app-text-muted hover:text-app-text-strong transition-colors" onClick={() => handleMonthNav(-1)}>
                                    <ChevronLeft size={20} />
                                </button>
                                <h3 className="text-sm font-black text-app-text-strong min-w-[150px] text-center uppercase tracking-widest">
                                    {MONTH_NAMES_BR[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </h3>
                                <button className="p-2 rounded-xl hover:bg-app-surface-2 text-app-text-muted hover:text-app-text-strong transition-colors" onClick={() => handleMonthNav(1)}>
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            <button
                                onClick={() => { setCurrentDate(new Date()); }}
                                className="px-5 py-2.5 rounded-2xl bg-app-surface border border-app-border text-[10px] font-black text-app-text-muted tracking-widest uppercase hover:text-app-text-strong hover:bg-app-surface-2 shadow-sm transition-all"
                            >
                                HOJE
                            </button>
                        </div>

                        {/* CALENDAR GRID */}
                        <div className="flex-1 bg-app-bg border border-app-border rounded-[2rem] overflow-hidden flex flex-col shadow-inner">
                            <div className="grid grid-cols-7 border-b border-app-border bg-app-surface/50 shrink-0">
                                {WEEKDAYS_BR_SHORT.map(dia => (
                                    <div key={dia} className="py-4 text-center text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] border-r border-app-border last:border-0">
                                        {dia}
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-7 auto-rows-[minmax(200px,auto)] min-h-full">
                                    {calendarDays.map((diaObj, idx) => {
                                        const evts = getEventosDoDia(diaObj.dateStr);
                                        const isToday = diaObj.dateStr === new Date().toISOString().split('T')[0];

                                        return (
                                            <div
                                                key={idx}
                                                className={`p-2 border-r border-b border-app-border transition-all relative flex flex-col ${diaObj.isNextMonth || diaObj.isPrevMonth ? 'bg-app-surface/20 opacity-40' :
                                                    isToday ? 'bg-blue-500/5' : 'bg-transparent'
                                                    } hover:bg-app-surface/50`}
                                            >
                                                <div className="flex justify-between items-start mb-2 px-1">
                                                    <span className={`text-[11px] font-bold w-7 h-7 flex items-center justify-center rounded-xl ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-app-text-strong font-black'}`}>
                                                        {diaObj.day}
                                                    </span>
                                                    <button onClick={() => onAdd('TAREFAS', { Data_Entrega: diaObj.dateStr })} className="opacity-0 group-hover:opacity-100 p-1 text-app-text-muted hover:text-blue-500 transition-all">
                                                        <Plus size={14} />
                                                    </button>
                                                </div>

                                                <div className="flex-1 space-y-2 pb-1">
                                                    {evts.map(Tarefa => {
                                                        const Cliente = clients.find((c: any) => c.id === Tarefa.Cliente_ID);
                                                        const prio = getPriorityInfo(Tarefa.Prioridade);
                                                        const isDone = Tarefa.Status === 'done' || Tarefa.Status === 'concluido';

                                                        return (
                                                            <div
                                                                key={Tarefa.id}
                                                                onClick={() => onSelectTask(Tarefa.id)}
                                                                className={`group relative p-3 rounded-2xl shadow-sm border border-app-border hover:shadow-xl hover:border-blue-500/40 cursor-pointer overflow-hidden transform hover:-translate-y-0.5 transition-all bg-app-surface ${isDone ? 'opacity-50' : ''}`}
                                                            >
                                                                <div className="absolute left-0 top-1 bottom-1 w-1 rounded-r opacity-80" style={{ backgroundColor: Cliente?.['Cor (HEX)'] || '#3B82F6' }} />

                                                                <div className="pl-2 flex flex-col gap-1.5">
                                                                    <div className="flex justify-between items-start">
                                                                        <span className="text-[9px] font-black uppercase tracking-widest text-app-text-muted truncate">
                                                                            {Cliente?.Nome || 'Agência'}
                                                                        </span>
                                                                        <div className="flex items-center gap-1.5 opacity-50 text-[9px] font-bold uppercase tracking-tight text-app-text-strong">
                                                                            {Tarefa.Hora_Entrega && <><Clock size={10} /> {Tarefa.Hora_Entrega}</>}
                                                                        </div>
                                                                    </div>
                                                                    <div className={`text-[11px] font-bold leading-tight uppercase ${isDone ? 'text-app-text-muted line-through' : 'text-app-text-strong'}`}>
                                                                        {Tarefa.Título}
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
    const t = tasks.find((Tarefa: Tarefa) => Tarefa.id === taskId);
    const [newCheckItem, setNewCheckItem] = useState('');
    const [uploading, setUploading] = useState(false);
    const [comment, setComment] = useState('');
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (viewMode !== 'sidebar') {
            setViewMode('sidebar');
        }
    }, [viewMode, setViewMode]);

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
        <div className="flex flex-col h-full bg-app-surface-2 text-left overflow-hidden">
            {/* PANEL HEADER */}
            <div className="px-6 py-4 border-b border-app-border flex flex-col gap-2 shrink-0 bg-app-surface/50 backdrop-blur z-10 w-full">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md truncate max-w-[200px]" style={{ color: clientColorCss, backgroundColor: `${clientColorCss}15` }}>
                            {Cliente?.Nome || 'Agência'}
                        </span>
                        <span className="text-[10px] font-bold text-app-text-muted">#{t.Task_ID}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-app-bg p-1 rounded-lg border border-app-border">
                            <button onClick={() => setViewMode('sidebar')} className={`p-1.5 rounded transition-all ${viewMode === 'sidebar' ? 'bg-app-surface text-blue-500 shadow-sm' : 'text-app-text-muted hover:text-app-text-strong'}`}><LayoutGrid size={12} /></button>
                            <button onClick={() => setViewMode('modal')} className={`p-1.5 rounded transition-all ${viewMode === 'modal' ? 'bg-app-surface text-blue-500 shadow-sm' : 'text-app-text-muted hover:text-app-text-strong'}`}><ExternalLink size={12} /></button>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-app-bg border border-app-border flex items-center justify-center text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2 transition-all">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                <input
                    className="w-full text-xl font-black text-app-text-strong bg-transparent border-none p-0 mt-1 focus:ring-0 uppercase tracking-tight placeholder-app-text-muted/30"
                    value={t.Título}
                    onChange={e => onUpdate(t.id, 'TAREFAS', 'Título', e.target.value, true)}
                    onBlur={e => onUpdate(t.id, 'TAREFAS', 'Título', e.target.value)}
                    placeholder="TÍTULO DA TAREFA"
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-app-bg">
                {/* METRICS GRID */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-app-surface border border-app-border rounded-xl p-3 flex flex-col gap-1.5 hover:border-blue-500/30 transition-colors group">
                        <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <HistoryIcon size={10} className="text-blue-500" /> Status
                        </label>
                        <select
                            value={t.Status}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Status', e.target.value)}
                            className="bg-app-bg border border-app-border rounded-lg text-[10px] font-bold text-app-text-strong uppercase focus:ring-1 focus:ring-blue-500 p-1.5 cursor-pointer outline-none transition-all group-hover:bg-app-surface-2"
                        >
                            {DEFAULT_TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.rotulo}</option>)}
                        </select>
                    </div>
                    <div className="bg-app-surface border border-app-border rounded-xl p-3 flex flex-col gap-1.5 hover:border-rose-500/30 transition-colors group">
                        <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <ShieldAlert size={10} className="text-rose-500" /> Prioridade
                        </label>
                        <select
                            value={t.Prioridade}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Prioridade', e.target.value)}
                            className="bg-app-bg border border-app-border rounded-lg text-[10px] font-bold text-app-text-strong uppercase focus:ring-1 focus:ring-rose-500 p-1.5 cursor-pointer outline-none transition-all group-hover:bg-app-surface-2"
                        >
                            {PRIORIDADE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="bg-app-surface border border-app-border rounded-xl p-3 flex flex-col gap-1.5 hover:border-emerald-500/30 transition-colors group">
                        <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <User size={10} className="text-emerald-500" /> Responsável
                        </label>
                        <select
                            value={t.Responsável}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Responsável', e.target.value)}
                            className="bg-app-bg border border-app-border rounded-lg text-[10px] font-bold text-app-text-strong uppercase focus:ring-1 focus:ring-emerald-500 p-1.5 cursor-pointer outline-none transition-all group-hover:bg-app-surface-2"
                        >
                            <option value="">Sem Resp.</option>
                            {collaborators.map((c: any) => <option key={c.id} value={c.Nome}>{c.Nome}</option>)}
                        </select>
                    </div>
                    <div className="bg-app-surface border border-app-border rounded-xl p-3 flex flex-col gap-1.5 hover:border-indigo-500/30 transition-colors group">
                        <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
                            <Clock size={10} className="text-indigo-500" /> Entrega
                        </label>
                        <input
                            type="date"
                            value={t.Data_Entrega || ''}
                            onChange={e => onUpdate(t.id, 'TAREFAS', 'Data_Entrega', e.target.value)}
                            className="bg-app-bg border border-app-border rounded-lg text-[10px] font-bold text-app-text-strong uppercase focus:ring-1 focus:ring-indigo-500 p-1.5 cursor-pointer outline-none transition-all group-hover:bg-app-surface-2"
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
                    onClick={() => { onArchive([t.id], 'TAREFAS', !t.__archived); onClose(); }}
                    className="flex-1 h-12 rounded-xl border border-app-border bg-app-bg text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    <Box size={16} /> {t.__archived ? 'RESTAURAR' : 'ARQUIVAR'}
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

