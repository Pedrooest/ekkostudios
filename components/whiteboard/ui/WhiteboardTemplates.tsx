import React from 'react';
import { useEditor } from 'tldraw';

export function WhiteboardTemplates({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const editor = useEditor();

    if (!isOpen) return null;

    const addSWOT = () => {
        const center = editor.getViewportPageBounds().center;

        editor.createShapes([
            { type: 'note', x: center.x - 210, y: center.y - 210, props: { color: 'green', text: 'FORÇAS' } },
            { type: 'note', x: center.x + 10, y: center.y - 210, props: { color: 'red', text: 'FRAQUEZAS' } },
            { type: 'note', x: center.x - 210, y: center.y + 10, props: { color: 'blue', text: 'OPORTUNIDADES' } },
            { type: 'note', x: center.x + 10, y: center.y + 10, props: { color: 'yellow', text: 'AMEAÇAS' } },
        ] as any);
        onClose();
    };

    const addKanban = () => {
        const center = editor.getViewportPageBounds().center;

        editor.createShapes([
            // Columns
            { type: 'geo', x: center.x - 300, y: center.y - 200, props: { w: 200, h: 500, color: 'grey', text: 'A FAZER' } },
            { type: 'geo', x: center.x - 50, y: center.y - 200, props: { w: 200, h: 500, color: 'blue', text: 'FAZENDO' } },
            { type: 'geo', x: center.x + 200, y: center.y - 200, props: { w: 200, h: 500, color: 'green', text: 'FEITO' } },
        ] as any);
        onClose();
    };

    return (
        <div className="absolute top-1/2 left-20 -translate-y-1/2 bg-[#1E293B] border border-white/10 rounded-xl p-4 shadow-2xl z-[1000] text-white w-64 animate-fade-right">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Modelos</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
            </div>

            <div className="space-y-2">
                <button onClick={addSWOT} className="w-full p-3 bg-[#0F172A] hover:bg-white/5 rounded-lg border border-white/5 flex items-center gap-3 transition-colors text-left">
                    <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center"><i className="fa-solid fa-table-cells-large"></i></div>
                    <div>
                        <p className="text-sm font-bold">Análise SWOT</p>
                        <p className="text-[10px] text-slate-400">Matriz Estratégica</p>
                    </div>
                </button>

                <button onClick={addKanban} className="w-full p-3 bg-[#0F172A] hover:bg-white/5 rounded-lg border border-white/5 flex items-center gap-3 transition-colors text-left">
                    <div className="w-8 h-8 rounded bg-green-500/20 text-green-400 flex items-center justify-center"><i className="fa-solid fa-list-check"></i></div>
                    <div>
                        <p className="text-sm font-bold">Kanban Básico</p>
                        <p className="text-[10px] text-slate-400">Fluxo de Tarefas</p>
                    </div>
                </button>
            </div>
        </div>
    );
}
