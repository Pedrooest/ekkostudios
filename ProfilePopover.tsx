import React, { useState, useRef, useEffect } from 'react';
import { PerfilUsuario, Tarefa } from './types';
import { Button } from './Components';
import { BottomSheet } from './components/BottomSheet';
import { PortalPopover } from './components/PortalPopover';
import {
    Sparkles, X, ChevronDown, Activity, Calendar, Check, LogOut, Camera,
    Plus, Trash2, Moon, Sun, Sliders, Zap, Target, User, Settings
} from 'lucide-react';
import { playUISound } from './utils/uiSounds';

interface ProfilePopoverProps {
    profile: PerfilUsuario;
    tasks: Tarefa[];
    onUpdate: (updatedProfile: Partial<PerfilUsuario>) => void;
    onLogout: () => void;
    isDarkMode?: boolean;
    onToggleDarkMode?: () => void;
}

const STATUS_CYCLE: PerfilUsuario['status'][] = ['online', 'ocupado', 'ausente', 'offline'];

const STATUS_LABELS: Record<PerfilUsuario['status'], string> = {
    online: 'Online',
    ocupado: 'Ocupado',
    ausente: 'Ausente',
    offline: 'Offline',
};

const STATUS_COLORS: Record<PerfilUsuario['status'], string> = {
    online: 'bg-emerald-500',
    ocupado: 'bg-rose-500',
    ausente: 'bg-amber-500',
    offline: 'bg-gray-400',
};

const STATUS_RING: Record<PerfilUsuario['status'], string> = {
    online: 'ring-emerald-500/30',
    ocupado: 'ring-rose-500/30',
    ausente: 'ring-amber-500/30',
    offline: 'ring-gray-400/30',
};

export function ProfilePopover({ profile, tasks, onUpdate, onLogout, isDarkMode, onToggleDarkMode }: ProfilePopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingRole, setIsEditingRole] = useState(false);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [newName, setNewName] = useState(profile.full_name);
    const [newRole, setNewRole] = useState(profile.role || '');
    const [newDesc, setNewDesc] = useState(profile.descricao || '');
    const [activeTab, setActiveTab] = useState<'ATIVIDADE' | 'TAREFAS' | 'CONFIG'>('ATIVIDADE');
    const [newPriority, setNewPriority] = useState('');
    const [isAddingPriority, setIsAddingPriority] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const isMobile = window.innerWidth < 1024;

    const getInitials = (name: string, email: string) => {
        const displayName = name || email || '?';
        const parts = displayName.split(/[ @._-]/).filter(p => p.length > 0);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return displayName.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(profile.full_name, profile.email);

    const myTasks = tasks.filter(t => t.Responsável === profile.full_name && t.Status !== 'concluido');
    const urgentTasks = myTasks.filter(t => t.Prioridade === 'Alta' || t.Prioridade === 'Urgente');

    const handleNameSubmit = () => { onUpdate({ full_name: newName }); setIsEditingName(false); };
    const handleRoleSubmit = () => { onUpdate({ role: newRole }); setIsEditingRole(false); };
    const handleDescSubmit = () => { onUpdate({ descricao: newDesc }); setIsEditingDesc(false); };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => onUpdate({ avatar_url: reader.result as string });
        reader.readAsDataURL(file);
    };

    const cycleStatus = () => {
        playUISound('tap');
        const idx = STATUS_CYCLE.indexOf(profile.status);
        const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
        onUpdate({ status: next });
    };

    const handleAddPriority = () => {
        if (!newPriority.trim()) return;
        onUpdate({ prioridades: [...(profile.prioridades || []), newPriority.trim()] });
        setNewPriority('');
        setIsAddingPriority(false);
    };

    const removePriority = (index: number) => {
        onUpdate({ prioridades: (profile.prioridades || []).filter((_, i) => i !== index) });
    };

    const content = (
        <div className="bg-white dark:bg-[#111114] h-full flex flex-col overflow-hidden relative">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={() => { playUISound('tap'); setIsOpen(false); }}
                    className="ios-btn p-1.5 text-gray-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Hero Header */}
            <div className="relative overflow-hidden shrink-0">
                {/* Gradient background strip */}
                <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-br from-indigo-600/20 via-purple-500/10 to-transparent`} />

                <div className="px-6 pt-6 pb-0 relative">
                    <div className="flex items-end gap-4 mb-4">
                        {/* Avatar */}
                        <div className="relative group/avatar">
                            <div
                                className={`ios-btn w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-lg cursor-pointer overflow-hidden ring-4 ${STATUS_RING[profile.status]}`}
                                onClick={() => { playUISound('tap'); fileInputRef.current?.click(); }}
                            >
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                ) : initials}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl">
                                    <Camera size={16} className="text-white" />
                                </div>
                            </div>
                            {/* Status dot */}
                            <button
                                onClick={cycleStatus}
                                title={`Status: ${STATUS_LABELS[profile.status]} (clique para alterar)`}
                                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#111114] ${STATUS_COLORS[profile.status]} shadow-sm transition-transform hover:scale-125 cursor-pointer`}
                            />
                        </div>

                        {/* Name + Role */}
                        <div className="flex-1 min-w-0 pb-1">
                            {isEditingName ? (
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-transparent border-b border-indigo-500 text-base font-black text-gray-900 dark:text-white outline-none w-full mb-1"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                    onBlur={handleNameSubmit}
                                />
                            ) : (
                                <h2
                                    className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1 cursor-pointer hover:text-indigo-500 transition-colors truncate"
                                    onClick={() => { playUISound('tap'); setIsEditingName(true); setNewName(profile.full_name); }}
                                >
                                    {profile.full_name || 'Configurar Nome'}
                                </h2>
                            )}
                            {isEditingRole ? (
                                <input
                                    type="text"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="bg-transparent border-b border-indigo-500/50 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest outline-none w-full"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleRoleSubmit()}
                                    onBlur={handleRoleSubmit}
                                />
                            ) : (
                                <p
                                    className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-indigo-500 transition-colors truncate"
                                    onClick={() => { playUISound('tap'); setIsEditingRole(true); setNewRole(profile.role || ''); }}
                                >
                                    {profile.role || 'ESPECIALISTA EKKO'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status pill + email */}
                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                        <button
                            onClick={cycleStatus}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105 ${
                                profile.status === 'online' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                                profile.status === 'ocupado' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400' :
                                profile.status === 'ausente' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' :
                                'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400'
                            }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[profile.status]}`} />
                            {STATUS_LABELS[profile.status]}
                        </button>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium truncate">{profile.email}</span>
                    </div>

                    {/* Standup button */}
                    <button
                        onClick={() => { playUISound('tap'); }}
                        className="ios-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all mb-5"
                    >
                        <Sparkles size={14} /> Standup Diário com IA
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex px-6 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                {([
                    { id: 'ATIVIDADE', label: 'Atividade', icon: Activity },
                    { id: 'TAREFAS', label: `Tarefas${myTasks.length > 0 ? ` (${myTasks.length})` : ''}`, icon: Target },
                    { id: 'CONFIG', label: 'Config', icon: Settings },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { playUISound('tap'); setActiveTab(tab.id); }}
                        className={`ios-btn flex-1 pb-3 pt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                    >
                        <tab.icon size={11} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {/* ATIVIDADE */}
                {activeTab === 'ATIVIDADE' && (
                    <>
                        {/* Descrição */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1.5">Bio</p>
                            {isEditingDesc ? (
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-indigo-500/50 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 outline-none resize-none h-16"
                                    autoFocus
                                    onBlur={handleDescSubmit}
                                />
                            ) : (
                                <p
                                    onClick={() => { playUISound('tap'); setIsEditingDesc(true); setNewDesc(profile.descricao || ''); }}
                                    className="text-xs text-gray-500 dark:text-zinc-400 cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors italic leading-relaxed min-h-[20px]"
                                >
                                    {profile.descricao || 'Clique para adicionar uma bio...'}
                                </p>
                            )}
                        </div>

                        {/* Prioridades */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Prioridades</p>
                                <button
                                    onClick={() => { playUISound('tap'); setIsAddingPriority(true); }}
                                    className="ios-btn p-1 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>

                            {isAddingPriority && (
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newPriority}
                                        onChange={(e) => setNewPriority(e.target.value)}
                                        placeholder="Nova prioridade..."
                                        className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white outline-none"
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddPriority(); if (e.key === 'Escape') setIsAddingPriority(false); }}
                                        onBlur={() => { if (!newPriority.trim()) setIsAddingPriority(false); }}
                                    />
                                    <button onClick={handleAddPriority} className="ios-btn p-1.5 bg-indigo-600 text-white rounded-lg">
                                        <Check size={12} />
                                    </button>
                                </div>
                            )}

                            {(profile.prioridades || []).length === 0 && !isAddingPriority ? (
                                <p className="text-[10px] text-gray-400 dark:text-zinc-600 italic">Nenhuma prioridade definida.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {(profile.prioridades || []).map((p, i) => (
                                        <div key={i} className="group flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                            <span className="flex-1 text-xs font-bold text-gray-700 dark:text-zinc-300 truncate">{p}</span>
                                            <button
                                                onClick={() => { playUISound('tap'); removePriority(i); }}
                                                className="ios-btn p-1 text-gray-300 dark:text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Urgências */}
                        {urgentTasks.length > 0 && (
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-2">Urgente</p>
                                <div className="space-y-1.5">
                                    {urgentTasks.slice(0, 3).map(t => (
                                        <div key={t.id} className="flex items-start gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                                            <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 line-clamp-2 leading-tight">{t.Título}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* TAREFAS */}
                {activeTab === 'TAREFAS' && (
                    myTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Check size={28} className="text-emerald-500 mb-2" />
                            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Sem tarefas pendentes.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {myTasks.map(t => (
                                <div key={t.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                                        t.Prioridade === 'Alta' || t.Prioridade === 'Urgente' ? 'bg-rose-500' :
                                        t.Prioridade === 'Média' ? 'bg-amber-500' : 'bg-blue-500'
                                    }`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 line-clamp-2 leading-tight">{t.Título}</p>
                                        {t.Cliente_ID && (
                                            <p className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">{t.Status}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* CONFIG */}
                {activeTab === 'CONFIG' && (
                    <div className="space-y-4">
                        {/* Aparência */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">Aparência</p>
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                <div className="flex items-center gap-2.5">
                                    {isDarkMode ? <Moon size={14} className="text-indigo-400" /> : <Sun size={14} className="text-amber-500" />}
                                    <span className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                                        {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
                                    </span>
                                </div>
                                {onToggleDarkMode ? (
                                    <button
                                        onClick={() => { playUISound('tap'); onToggleDarkMode(); }}
                                        className={`w-11 h-6 rounded-full transition-colors relative ${isDarkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isDarkMode ? 'left-6' : 'left-1'}`} />
                                    </button>
                                ) : (
                                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">Auto</span>
                                )}
                            </div>
                        </div>

                        {/* Perfil */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">Perfil</p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Nome</span>
                                    <button
                                        onClick={() => { playUISound('tap'); setActiveTab('ATIVIDADE'); setIsEditingName(true); setNewName(profile.full_name); }}
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[140px]"
                                    >
                                        {profile.full_name || 'Definir nome'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Cargo</span>
                                    <button
                                        onClick={() => { playUISound('tap'); setActiveTab('ATIVIDADE'); setIsEditingRole(true); setNewRole(profile.role || ''); }}
                                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider truncate max-w-[140px]"
                                    >
                                        {profile.role || 'Definir cargo'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Avatar</span>
                                    <button
                                        onClick={() => { playUISound('tap'); fileInputRef.current?.click(); }}
                                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Alterar foto
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status rápido */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">Status</p>
                            <div className="grid grid-cols-2 gap-2">
                                {STATUS_CYCLE.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { playUISound('tap'); onUpdate({ status: s }); }}
                                        className={`ios-btn flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                            profile.status === s
                                                ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                                                : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
                                        }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]} shrink-0`} />
                                        {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 bg-white dark:bg-[#111114] border-t border-gray-200 dark:border-zinc-800 shrink-0">
                <button
                    onClick={() => { playUISound('tap'); onLogout(); }}
                    className="ios-btn w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-gray-500 dark:text-zinc-400 hover:text-white dark:hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-xl transition-all uppercase tracking-wider border border-transparent hover:border-rose-500"
                >
                    <LogOut size={14} /> Sair da conta
                </button>
            </div>

            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
        </div>
    );

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => { if (!isOpen) playUISound('open'); setIsOpen(!isOpen); }}
                className={`ios-btn w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${isOpen ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-600'} bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 overflow-hidden`}
                aria-label="Abrir Perfil"
            >
                {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : initials}
            </button>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0a0a0c] ${STATUS_COLORS[profile.status]} shadow-sm`} />

            <PortalPopover
                isOpen={isOpen && !isMobile}
                onClose={() => setIsOpen(false)}
                triggerRef={buttonRef}
                className="w-[340px]"
                align="end"
            >
                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto max-h-[85vh]">
                    {content}
                </div>
            </PortalPopover>

            <BottomSheet isOpen={isOpen && isMobile} onClose={() => setIsOpen(false)} title="Meu Perfil">
                <div className="bg-white dark:bg-[#111114] overflow-hidden pb-safe">
                    {content}
                </div>
            </BottomSheet>
        </div>
    );
}
