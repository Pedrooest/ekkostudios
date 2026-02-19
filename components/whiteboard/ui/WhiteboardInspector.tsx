import React from 'react';
import { useEditor, useValue, TLShapeId, TLShape } from 'tldraw';
import { useWhiteboardData } from '../WhiteboardContext';
import { TaskShape } from '../shapes/TaskShape';
import { NoteShape } from '../shapes/NoteShape';

export function WhiteboardInspector() {
    const editor = useEditor();
    const { tasks } = useWhiteboardData();

    // Get selected shapes
    const selectedShapes = useValue('selected shapes', () => editor.getSelectedShapes(), [editor]);

    if (!selectedShapes || selectedShapes.length === 0) return null;

    const shape = selectedShapes[0] as TLShape;

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
                });
            }
        };

        return (
            <div className="absolute top-20 right-4 w-72 bg-[#1E293B] border border-white/10 rounded-xl p-4 shadow-2xl z-[1000] text-white">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Propriedades da Tarefa</h3>

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
                        <div className="p-3 bg-[#0F172A] rounded-lg border border-white/5">
                            <p className="text-xs text-slate-400">ID: {taskShape.props.taskId}</p>
                            <p className="text-xs text-slate-400 mt-1">Status: {taskShape.props.status}</p>
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
            <div className="absolute top-20 right-4 w-64 bg-[#1E293B] border border-white/10 rounded-xl p-4 shadow-2xl z-[1000] text-white">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Editar Nota</h3>

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
                                    })}
                                    className={`w-6 h-6 rounded-full border-2 ${noteShape.props.color === c ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: c === 'blue' ? '#3B82F6' : c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return null;
}
