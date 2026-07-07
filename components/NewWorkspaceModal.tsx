import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
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

            <div className="relative w-full max-w-md bg-app-surface/95 backdrop-blur-2xl border border-app-border rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-bounce-in">

                <div className="px-6 py-5 border-b border-app-border flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 shrink-0">
                            <Layers size={20} className="shrink-0" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-app-text-strong tracking-tight uppercase">Novo Workspace</h2>
                            <p className="text-[10px] font-black text-app-text-muted uppercase tracking-widest opacity-70">Criar novo ambiente de trabalho</p>
                        </div>
                    </div>
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn p-2 text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2 rounded-xl bg-app-bg transition-colors border border-app-border/50">
                        <X size={16} />
                    </button>
                </div>


                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-[10px] font-black text-app-text-muted uppercase tracking-widest mb-2 block">
                            Nome do Workspace
                        </label>
                        <input
                            type="text"
                            autoFocus
                            placeholder="Ex: Ekko Studios, Projeto Beta, Cliente X..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="w-full bg-app-bg border border-app-border text-app-text-strong text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder-app-text-muted/50"
                        />
                        <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest mt-2 opacity-60">Você pode alterar este nome depois nas configurações.</p>
                    </div>
                </div>

                <div className="px-6 py-4 bg-app-surface-2/30 border-t border-app-border flex justify-end gap-3">
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2 transition-all rounded-xl">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className="ios-btn px-6 py-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02]"
                    >
                        Criar Workspace
                    </button>
                </div>

            </div>
        </div>
    );
}
