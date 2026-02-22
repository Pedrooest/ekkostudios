import React, { useState } from 'react';
import { X } from 'lucide-react';
import { playUISound } from './utils/uiSounds';


interface NewWorkspaceModalProps {
    onClose: () => void;
    onCreate: (name: string) => void;
}

export function NewWorkspaceModal({ onClose, onCreate }: NewWorkspaceModalProps) {
    const [name, setName] = useState('');

    const handleSubmit = () => {
        if (!name.trim()) return;
        playUISound('success');
        onCreate(name);
        onClose();
    };


    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in" onClick={() => { playUISound('close'); onClose(); }}></div>

            <div className="relative w-full max-w-md bg-white/95 dark:bg-[#111114]/95 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-ios-spring">

                <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight uppercase">Novo Workspace</h2>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">CRIAR NOVO AMBIENTE</p>
                    </div>
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 rounded-full bg-gray-50 dark:bg-zinc-900">
                        <X size={20} />
                    </button>
                </div>


                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-2 block">
                            Nome do Novo Workspace
                        </label>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Ex: Cliente X, Agência, Projeto Beta..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-zinc-600"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/50 dark:bg-zinc-900/30 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-xl">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="ios-btn px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20"
                    >
                        Criar Workspace
                    </button>
                </div>

            </div>
        </div>
    );
}
