import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UserProfile, Task } from './types';
import { Button } from './Components';
import { BottomSheet } from './components/BottomSheet';
import { PortalPopover } from './components/PortalPopover';
import { Sparkles, X, ChevronDown, Activity, Calendar, Check, LogOut } from 'lucide-react';
import { playUISound } from './utils/uiSounds';

interface ProfilePopoverProps {
    profile: UserProfile;
    tasks: Task[];
    onUpdate: (updatedProfile: Partial<UserProfile>) => void;
    onLogout: () => void;
}

export function ProfilePopover({ profile, tasks, onUpdate, onLogout }: ProfilePopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingRole, setIsEditingRole] = useState(false);
    const [newName, setNewName] = useState(profile.full_name);
    const [newRole, setNewRole] = useState(profile.role || '');
    const [activeTab, setActiveTab] = useState('ATIVIDADE');
    const [isContentExpanded, setIsContentExpanded] = useState(false);
    const [newPriority, setNewPriority] = useState('');
    const [isAddingPriority, setIsAddingPriority] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getInitials = (name: string, email: string) => {
        const displayName = name || email || '?';
        const parts = displayName.split(/[ @._-]/).filter(p => p.length > 0);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return displayName.substring(0, 2).toUpperCase();
    };

    const statusColors = {
        online: 'bg-emerald-500',
        ocupado: 'bg-rose-500',
        ausente: 'bg-amber-500',
        offline: 'bg-gray-500'
    };

    const initials = getInitials(profile.full_name, profile.email);

    const handleNameSubmit = () => {
        onUpdate({ full_name: newName });
        setIsEditingName(false);
    };

    const handleRoleSubmit = () => {
        onUpdate({ role: newRole });
        setIsEditingRole(false);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            onUpdate({ avatar_url: base64String });
        };
        reader.readAsDataURL(file);
    };

    const handleAddPriority = () => {
        if (!newPriority.trim()) return;
        const priorities = [...(profile.priorities || []), newPriority.trim()];
        onUpdate({ priorities });
        setNewPriority('');
        setIsAddingPriority(false);
    };

    const removePriority = (index: number) => {
        const priorities = (profile.priorities || []).filter((_, i) => i !== index);
        onUpdate({ priorities });
    };

    // Filter tasks for the logged in user
    const myTasks = tasks.filter(t => t.Responsável === profile.full_name && t.Status !== 'concluido');

    const buttonRef = useRef<HTMLButtonElement>(null);

    const togglePopover = () => {
        setIsOpen(!isOpen);
    };

    const isMobile = window.innerWidth < 1024;

    const content = (
        <div className="bg-white dark:bg-[#111114] h-full flex flex-col overflow-hidden relative">
            {/* Botão de Fechar */}
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={() => { playUISound('tap'); setIsOpen(false); }}
                    className="ios-btn p-1.5 text-gray-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-6 pb-0 shrink-0 relative">
                <div className="flex flex-col">
                    <div
                        className="ios-btn w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-md mb-4 cursor-pointer overflow-hidden group"
                        onClick={() => { playUISound('tap'); fileInputRef.current?.click(); }}
                    >
                        {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                        ) : (
                            initials
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                            <i className="fa-solid fa-camera text-white text-base"></i>
                        </div>
                    </div>
                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1">
                        {profile.full_name || 'Configurar Nome'}
                    </h2>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4">
                        {profile.role || 'ESPECIALISTA EKKO'}
                    </p>

                    {/* Status & Email (Mesma linha) */}
                    <div className="inline-flex items-center gap-2 mb-6">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-full">
                            <div className={`w-2 h-2 rounded-full ${statusColors[profile.status]}`}></div>
                            <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300 uppercase tracking-wider">{profile.status}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-zinc-500 font-medium truncate max-w-[180px]">{profile.email}</span>
                    </div>

                    {/* Botão Mágico Standup */}
                    <button
                        onClick={() => { playUISound('tap'); alert('Gerando seu StandUp diário com IA...'); }}
                        className="ios-btn w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/25 transition-all"
                    >
                        <Sparkles size={16} /> OBTER STANDUP DIÁRIO
                    </button>
                </div>
            </div>

            {/* TABS SELECTOR */}
            <div className="flex px-6 mt-6 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-transparent">
                {['ATIVIDADE', 'TAREFAS (0)', 'CALENDÁRIO'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { playUISound('tap'); setActiveTab(tab); }}
                        className={`ios-btn flex-1 pb-3 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Área de Scroll das Tabs */}
            <div className="p-6 bg-gray-50/50 dark:bg-[#0a0a0c]/50 max-h-[30vh] overflow-y-auto overscroll-contain custom-scrollbar flex-1 lg:max-h-none">
                {activeTab === 'ATIVIDADE' && (
                    <div className="space-y-3">
                        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-colors hover:border-gray-300 dark:hover:border-zinc-700">
                            <button
                                onClick={() => { playUISound('tap'); setIsContentExpanded(!isContentExpanded); }}
                                className="ios-btn w-full flex items-center justify-between p-3.5 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors"
                            >
                                <span className="flex items-center gap-2"><Activity size={14} className="text-rose-500" /> Minhas Urgências</span>
                                <span className="text-[10px] text-gray-400 uppercase">{isContentExpanded ? 'Recolher' : 'Expandir'}</span>
                            </button>
                            {isContentExpanded && (
                                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-[#0a0a0c] text-center">
                                    {myTasks.length > 0 ? (
                                        <div className="space-y-2">
                                            {myTasks.map(t => (
                                                <div key={t.id} className="text-left p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded">
                                                    <p className="text-[10px] font-bold dark:text-white uppercase">{t.Título}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium italic">Sem tarefas urgentes.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab !== 'ATIVIDADE' && (
                    <div className="flex flex-col items-center justify-center py-6 opacity-50">
                        {activeTab === 'TAREFAS (0)' ? <Check size={24} className="mb-2 dark:text-white" /> : <Calendar size={24} className="mb-2 dark:text-white" />}
                        <p className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Nenhum item encontrado.</p>
                    </div>
                )}
            </div>

            {/* Footer do Perfil */}
            <div className="p-4 bg-white dark:bg-[#111114] border-t border-gray-200 dark:border-zinc-800 shrink-0 space-y-2">
                <button
                    onClick={() => { playUISound('tap'); alert('Expandindo painel completo...'); }}
                    className="ios-btn w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors uppercase tracking-wider"
                >
                    Expandir Painel Completo <ChevronDown size={14} />
                </button>
                <button
                    onClick={() => { playUISound('tap'); onLogout(); }}
                    className="ios-btn w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-gray-600 dark:text-zinc-400 hover:text-white dark:hover:text-white hover:bg-rose-500 dark:hover:bg-rose-600 rounded-lg transition-all uppercase tracking-wider"
                >
                    Logout <LogOut size={14} />
                </button>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );

    return (
        <div className="relative">
            {/* TRIGGER BOX */}
            <button
                ref={buttonRef}
                onClick={() => { if (!isOpen) playUISound('open'); togglePopover(); }}
                className={`ios-btn w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${isOpen ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-600'} bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 overflow-hidden`}
                aria-label="Abrir Perfil"
            >
                {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                    initials
                )}
            </button>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0a0a0c] ${statusColors[profile.status]} shadow-sm`}></div>

            {/* Desktop View using Portal */}
            <PortalPopover
                isOpen={isOpen && !isMobile}
                onClose={() => setIsOpen(false)}
                triggerRef={buttonRef}
                className="w-[360px]"
                align="end"
            >
                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
                    {content}
                </div>
            </PortalPopover>
        </div>
    );
}

