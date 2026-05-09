import React, { useState, useEffect, useRef } from 'react';
import { Workspace } from './types';
import { DatabaseService } from './DatabaseService';
import { X, Building2, Palette, AlertTriangle, LogOut, Mail, Camera } from 'lucide-react';
import { playUISound } from './utils/uiSounds';


interface WorkspaceSettingsModalProps {
    workspace: Workspace;
    onClose: () => void;
    onWorkspaceDeleted?: () => void;
    onUpdateWorkspace: (updatedWorkspace: Workspace) => void;
}

export function WorkspaceSettingsModal({ workspace, onClose, onWorkspaceDeleted, onUpdateWorkspace }: WorkspaceSettingsModalProps) {
    const [editWsName, setEditWsName] = useState(workspace.nome || '');
    const [editWsColor, setEditWsColor] = useState(workspace.cor || 'bg-indigo-600');
    const [editWsAvatar, setEditWsAvatar] = useState(workspace.avatar_url || '');
    const [customHex, setCustomHex] = useState('');
    const [loading, setLoading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const availableColors = ['bg-indigo-600', 'bg-blue-600', 'bg-emerald-600', 'bg-orange-500', 'bg-rose-600', 'bg-purple-600', 'bg-zinc-800'];

    useEffect(() => {
        setEditWsName(workspace.nome || '');
        setEditWsColor(workspace.cor || 'bg-indigo-600');
        setEditWsAvatar(workspace.avatar_url || '');
    }, [workspace]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setEditWsAvatar(reader.result as string);
        reader.readAsDataURL(file);
    };

    const wsInitials = editWsName ? editWsName.substring(0, 2).toUpperCase() : 'EK';
    const isHexColor = editWsColor.startsWith('#');

    const saveSettings = async () => {
        setLoading(true);
        try {
            const updated = await DatabaseService.updateWorkspace(workspace.id, {
                nome: editWsName,
                cor: editWsColor,
                avatar_url: editWsAvatar || undefined,
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

            <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#111114]/95 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-bounce-in">

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

                    {/* Live preview */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
                        <div className="relative group/wsavatar">
                            <div
                                className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-md overflow-hidden cursor-pointer ${!isHexColor && !editWsAvatar ? editWsColor : ''}`}
                                style={isHexColor && !editWsAvatar ? { backgroundColor: editWsColor } : undefined}
                                onClick={() => { playUISound('tap'); avatarInputRef.current?.click(); }}
                            >
                                {editWsAvatar ? (
                                    <img src={editWsAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : wsInitials}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/wsavatar:opacity-100 transition-opacity rounded-xl">
                                    <Camera size={14} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white">{editWsName || 'Nome do workspace'}</p>
                            <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">Preview</p>
                            {editWsAvatar && (
                                <button
                                    onClick={() => { playUISound('tap'); setEditWsAvatar(''); }}
                                    className="text-[9px] font-bold text-rose-500 hover:underline mt-1"
                                >
                                    Remover logo
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Building2 size={14} className="text-indigo-500" /> Nome do Workspace
                        </label>
                        <input
                            type="text"
                            value={editWsName}
                            onChange={(e) => setEditWsName(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Palette size={14} className="text-emerald-500" /> Cor de Identificação
                        </label>
                        <div className="flex flex-wrap gap-3 mb-3">
                            {availableColors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => { playUISound('tap'); setEditWsColor(color); }}
                                    className={`ios-btn w-9 h-9 rounded-full transition-all ${color} ${editWsColor === color ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-[#111114] scale-110' : 'opacity-70 hover:opacity-100'}`}
                                />
                            ))}
                        </div>
                        {/* Custom hex */}
                        <div className="flex items-center gap-2">
                            <div
                                className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-zinc-700 shrink-0 transition-colors"
                                style={{ backgroundColor: customHex || '#6366f1' }}
                            />
                            <input
                                type="text"
                                value={customHex}
                                onChange={(e) => setCustomHex(e.target.value)}
                                placeholder="#6366f1"
                                maxLength={7}
                                className="flex-1 bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                            />
                            <button
                                onClick={() => {
                                    if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) {
                                        playUISound('tap');
                                        setEditWsColor(customHex);
                                    }
                                }}
                                disabled={!/^#[0-9A-Fa-f]{6}$/.test(customHex)}
                                className="ios-btn px-3 py-2.5 bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>

                    <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />

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

                    <div className="pt-6 border-t border-gray-200 dark:border-zinc-800 space-y-4">
                        <label className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Mail size={14} className="text-blue-500" /> Notificações por Email
                        </label>
                        
                        <div className="space-y-4 bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-700 dark:text-zinc-300">Ativar notificações</span>
                                <button 
                                    onClick={() => {
                                        playUISound('tap');
                                        const config = JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}');
                                        config.enabled = !config.enabled;
                                        localStorage.setItem(`ekko_email_config_${workspace.id}`, JSON.stringify(config));
                                        setLoading(!loading); setTimeout(()=>setLoading(false), 10); // Force re-render
                                    }}
                                    className={`w-10 h-6 rounded-full transition-colors relative ${JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}').enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}').enabled ? 'left-5' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}').notifyTasks}
                                        onChange={(e) => {
                                            const config = JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}');
                                            config.notifyTasks = e.target.checked;
                                            localStorage.setItem(`ekko_email_config_${workspace.id}`, JSON.stringify(config));
                                            setLoading(!loading); setTimeout(()=>setLoading(false), 10);
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-zinc-200">Novas tarefas</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}').notifyContent}
                                        onChange={(e) => {
                                            const config = JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}');
                                            config.notifyContent = e.target.checked;
                                            localStorage.setItem(`ekko_email_config_${workspace.id}`, JSON.stringify(config));
                                            setLoading(!loading); setTimeout(()=>setLoading(false), 10);
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-zinc-200">Novos conteúdos</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input 
                                        type="checkbox" 
                                        checked={JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}').notifyFinance}
                                        onChange={(e) => {
                                            const config = JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}');
                                            config.notifyFinance = e.target.checked;
                                            localStorage.setItem(`ekko_email_config_${workspace.id}`, JSON.stringify(config));
                                            setLoading(!loading); setTimeout(()=>setLoading(false), 10);
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-xs font-bold text-gray-600 dark:text-zinc-400 group-hover:text-gray-900 dark:group-hover:text-zinc-200">Lembretes de pagamento</span>
                                </label>
                            </div>

                            <div className="pt-2">
                                <span className="text-[10px] font-black uppercase text-gray-400 dark:text-zinc-500 mb-2 block">Email para notificações financeiras</span>
                                <input
                                    type="email"
                                    placeholder="exemplo@email.com"
                                    value={JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}').financeEmail || ''}
                                    onChange={(e) => {
                                        const config = JSON.parse(localStorage.getItem(`ekko_email_config_${workspace.id}`) || '{}');
                                        config.financeEmail = e.target.value;
                                        localStorage.setItem(`ekko_email_config_${workspace.id}`, JSON.stringify(config));
                                        setLoading(!loading); setTimeout(()=>setLoading(false), 10);
                                    }}
                                    className="w-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-xs font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>
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
