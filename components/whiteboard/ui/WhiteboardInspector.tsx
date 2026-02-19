import React, { useState, useEffect } from 'react';
import { useEditor, useValue, TLShapeId, TLShape } from 'tldraw';
import { useWhiteboardData } from '../WhiteboardContext';
import { TaskShape } from '../shapes/TaskShape';
import { NoteShape } from '../shapes/NoteShape';

export function WhiteboardInspector() {
    const editor = useEditor();
    const { tasks, onUpdateTask, onAddItem } = useWhiteboardData();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get selected shapes
    const selectedShapes = useValue('selected shapes', () => editor.getSelectedShapes(), [editor]);

    if (!selectedShapes || selectedShapes.length === 0) return null;

    const shape = selectedShapes[0] as any;

    // Common container styles
    const containerClasses = isMobile
        ? "fixed bottom-0 left-0 right-0 bg-[#1E293B] border-t border-white/10 rounded-t-xl p-4 shadow-2xl z-[2000] text-white animate-fade-up"
        : "absolute top-20 right-4 w-72 bg-[#1E293B] border border-white/10 rounded-xl p-4 shadow-2xl z-[1000] text-white";

    // Handle Task Shape Selection
    if (shape.type === 'ekko-task') {
        const taskShape = shape as TaskShape;

        const handleTaskSelect = (taskId: string) => {
            const task = tasks.find((t: any) => t.id === taskId);
            if (task) {
                editor.updateShape({
                    id: shape.id,
                    type: 'ekko-task',
                    props: {
                        taskId: task.id,
                        title: task.Title,
                        status: task.Status,
                        assignee: task.Responsavel || 'Unassigned'
                    }
                } as any);
            }
        };

        return (
            <div className={containerClasses}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Propriedades da Tarefa</h3>
                    {isMobile && <button onClick={() => editor.deselectAll()} className="text-slate-400"><i className="fa-solid fa-chevron-down"></i></button>}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Vincular Tarefa</label>
                        <select
                            className="w-full bg-[#0F172A] border border-white/10 rounded-lg p-2 text-sm text-white"
                            onChange={(e) => handleTaskSelect(e.target.value)}
                            value={taskShape.props.taskId || ''}
                        >
                            <option value="">Selecione uma tarefa...</option>
                            {tasks.map((t: any) => (
                                <option key={t.id} value={t.id}>{t.Title}</option>
                            ))}
                        </select>
                    </div>

                    {taskShape.props.taskId && (
                        <div className="p-3 bg-[#0F172A] rounded-lg border border-white/5 space-y-2">
                            <p className="text-xs text-slate-400">ID: {taskShape.props.taskId}</p>
                            <div>
                                <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Status</label>
                                <select
                                    className="w-full bg-[#1E293B] border border-white/10 rounded p-1 text-xs text-white"
                                    value={taskShape.props.status}
                                    onChange={(e) => {
                                        const newStatus = e.target.value;
                                        editor.updateShape({
                                            id: shape.id,
                                            type: 'ekko-task',
                                            props: { status: newStatus }
                                        } as any);
                                        onUpdateTask(taskShape.props.taskId, { Status: newStatus });
                                    }}
                                >
                                    <option value="todo">A Fazer</option>
                                    <option value="doing">Fazendo</option>
                                    <option value="done">Feito</option>
                                    <option value="wait">Em Espera</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Handle Note Shape Selection
    if (shape.type === 'note') {
        const noteShape = shape as NoteShape;
        const colors = ['blue', 'red', 'green', 'yellow', 'purple'];

        return (
            <div className={containerClasses}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Editar Nota</h3>
                    {isMobile && <button onClick={() => editor.deselectAll()} className="text-slate-400"><i className="fa-solid fa-chevron-down"></i></button>}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-500 mb-2 block">Cor</label>
                        <div className="flex gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    onClick={() => editor.updateShape({
                                        id: shape.id,
                                        type: 'note',
                                        props: { color: c }
                                    } as any)}
                                    className={`w-8 h-8 md:w-6 md:h-6 rounded-full border-2 ${noteShape.props.color === c ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: c === 'blue' ? '#3B82F6' : c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <button
                            onClick={() => {
                                const text = (noteShape.props as any).text || 'Nova Tarefa';
                                onAddItem('create_task', { Title: text, Status: 'todo' });
                            }}
                            className="w-full py-3 md:py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2"
                        >
                            <i className="fa-solid fa-check-to-slot"></i>
                            Converter em Tarefa
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null;
}
