import React from 'react';
import { useEditor, useValue } from 'tldraw';

export function WhiteboardToolbar() {
    const editor = useEditor();

    // Subscribe to current tool change to highlight active button
    const currentToolId = useValue('current tool', () => editor.getCurrentToolId(), [editor]);

    const tools = [
        { id: 'select', icon: 'fa-arrow-pointer', label: 'Selecionar', action: () => editor.setCurrentTool('select') },
        { id: 'hand', icon: 'fa-hand', label: 'Mover', action: () => editor.setCurrentTool('hand') },
        { id: 'draw', icon: 'fa-pen', label: 'Desenhar', action: () => editor.setCurrentTool('draw') },
        { id: 'note', icon: 'fa-note-sticky', label: 'Nota', action: () => editor.setCurrentTool('note') },
        { id: 'ekko-task', icon: 'fa-check-to-slot', label: 'Tarefa', action: () => editor.setCurrentTool('ekko-task') },
        // { id: 'arrow', icon: 'fa-arrow-right', label: 'Conectar', action: () => editor.setCurrentTool('arrow') },
    ];

    return (
        <>
            {/* Desktop Sidebar (Left) */}
            <div className="hidden lg:flex fixed left-4 top-1/2 -translate-y-1/2 flex-col gap-2 p-2 bg-[#0F172A]/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl z-[1000]">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={tool.action}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${currentToolId === tool.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                        title={tool.label}
                    >
                        <i className={`fa-solid ${tool.icon}`}></i>
                    </button>
                ))}
            </div>

            {/* Mobile Bottom Dock */}
            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 p-3 bg-[#0F172A]/90 backdrop-blur-md border border-white/10 rounded-full shadow-2xl z-[1000] px-6">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={tool.action}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentToolId === tool.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110' : 'text-slate-400 hover:text-white'}`}
                    >
                        <i className={`fa-solid ${tool.icon}`}></i>
                    </button>
                ))}
                <button className="w-10 h-10 rounded-full bg-white/5 text-slate-400 flex items-center justify-center">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>
            </div>
        </>
    );
}
