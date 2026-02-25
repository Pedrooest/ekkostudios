import React, { useState } from 'react';
import { X } from 'lucide-react';
import { playUISound } from '../utils/uiSounds';


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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => { playUISound('close'); onClose(); }}></div>

            <div className="relative w-full max-w-md bg-app-surface/95 backdrop-blur-2xl border border-app-border rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-ios-spring">

                <div className="px-6 py-5 border-b border-app-border flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-app-text-strong tracking-tight leading-tight uppercase">Novo Workspace</h2>
                        <p className="text-xs text-app-text-muted font-bold uppercase tracking-widest mt-1">CRIAR NOVO AMBIENTE</p>
                    </div>
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn p-2 text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2 rounded-full bg-app-bg transition-colors">
                        <X size={20} />
                    </button>
                </div>


                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-app-text-muted uppercase tracking-widest mb-2 block">
                            Nome do Novo Workspace
                        </label>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Ex: Cliente X, Agência, Projeto Beta..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="w-full bg-app-bg border border-app-border text-app-text-strong text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-app-text-muted/50"
                        />
                    </div>
                </div>

                <div className="px-6 py-4 bg-app-surface-2/30 border-t border-app-border flex justify-end gap-3">
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn px-5 py-2.5 text-sm font-bold text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2 transition-colors rounded-xl">
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
