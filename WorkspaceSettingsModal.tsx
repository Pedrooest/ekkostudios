import React, { useState, useEffect } from 'react';
import { Workspace } from './types';
import { DatabaseService } from './DatabaseService';
import { X, Building2, Palette, AlertTriangle, LogOut } from 'lucide-react';
import { playUISound } from './utils/uiSounds';


interface WorkspaceSettingsModalProps {
    workspace: Workspace;
    onClose: () => void;
    onWorkspaceDeleted?: () => void;
    onUpdateWorkspace: (updatedWorkspace: Workspace) => void;
}

export function WorkspaceSettingsModal({ workspace, onClose, onWorkspaceDeleted, onUpdateWorkspace }: WorkspaceSettingsModalProps) {
    const [editWsName, setEditWsName] = useState(workspace.name);
    const [editWsColor, setEditWsColor] = useState(workspace.color || 'bg-indigo-600');
    const [loading, setLoading] = useState(false);

    const availableColors = ['bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-500', 'bg-rose-600', 'bg-purple-600', 'bg-zinc-800'];

    useEffect(() => {
        setEditWsName(workspace.name);
        setEditWsColor(workspace.color || 'bg-indigo-600');
    }, [workspace]);

    const saveSettings = async () => {
        setLoading(true);
        try {
            const updated = await DatabaseService.updateWorkspace(workspace.id, {
                name: editWsName,
                color: editWsColor
            });
            playUISound('success');
            onUpdateWorkspace(updated);
            onClose();
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar alterações.');
        } finally {
            setLoading(false);
        }
    };


    const handleDelete = async () => {
        if (!confirm('TEM CERTEZA? Esta ação é irreversível e excluirá todos os dados deste workspace.')) return;
        playUISound('tap');
        try {
            await DatabaseService.deleteWorkspace(workspace.id);
            if (onWorkspaceDeleted) onWorkspaceDeleted();
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir workspace.');
        }
    };


    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in" onClick={() => { playUISound('close'); onClose(); }}></div>

            <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#111114]/95 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-ios-spring">

                <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight uppercase">Configurações</h2>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">PERSONALIZAR WORKSPACE</p>
                    </div>
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 rounded-full bg-gray-50 dark:bg-zinc-900">
                        <X size={20} />
                    </button>
                </div>


                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Building2 size={14} className="text-indigo-500" /> Nome do Workspace
                        </label>
                        <input
                            type="text"
                            value={editWsName}
                            onChange={(e) => setEditWsName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Palette size={14} className="text-emerald-500" /> Cor de Identificação
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                            {availableColors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => { playUISound('tap'); setEditWsColor(color); }}
                                    className={`ios-btn w-10 h-10 rounded-full shrink-0 transition-all ${color} ${editWsColor === color ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-[#111114] scale-110' : 'opacity-70 hover:opacity-100'}`}
                                />
                            ))}
                        </div>

                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-zinc-800">
                        <label className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <AlertTriangle size={14} /> Zona de Perigo
                        </label>
                        <button
                            onClick={handleDelete}
                            className="ios-btn w-full px-4 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors flex justify-between items-center"
                        >
                            Excluir Workspace Permanentemente
                            <LogOut size={16} />
                        </button>

                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50/50 dark:bg-zinc-900/30 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-xl">
                        Cancelar
                    </button>
                    <button
                        onClick={saveSettings}
                        disabled={loading || !editWsName.trim()}
                        className="ios-btn px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>

            </div>
        </div>
    );
}
