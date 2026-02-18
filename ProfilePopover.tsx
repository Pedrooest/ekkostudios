import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { UserProfile, Task } from './types';
import { Button } from './Components';
import { BottomSheet } from './components/BottomSheet';
import { PortalPopover } from './components/PortalPopover';

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
    const [activeTab, setActiveTab] = useState('Atividade');
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
        <div className="bg-app-surface h-full flex flex-col overflow-hidden">
            {/* POPUP HEADER */}
            <div className="p-6 md:p-10 pb-4 shrink-0">
                <div className="flex items-start justify-between mb-8">
                    <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-[#4B3A2F] to-[#2D221B] flex items-center justify-center text-white text-2xl md:text-3xl font-black shadow-xl border border-white/5 overflow-hidden">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                            <i className="fa-solid fa-camera text-white text-xl"></i>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border border-app-surface ${statusColors[profile.status]} shadow-lg`}></div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onLogout}
                            title="Sair"
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all border border-rose-500/20 active:scale-95"
                        >
                            <i className="fa-solid fa-right-from-bracket"></i>
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-app-text-muted transition-all border border-white/10 active:scale-95"
                        >
                            <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    {isEditingName ? (
                        <input
                            autoFocus
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onBlur={handleNameSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                            className="bg-app-surface-2 border border-blue-500/30 rounded-xl px-4 py-2 text-xl font-bold text-app-text-strong outline-none w-full shadow-inner shadow-blue-500/5 mb-2"
                        />
                    ) : (
                        <div
                            className="group flex items-center gap-3 cursor-pointer py-1"
                            onClick={() => setIsEditingName(true)}
                        >
                            <h3 className="text-xl md:text-2xl font-black text-app-text-strong leading-tight tracking-tighter">
                                {profile.full_name || 'Configurar Nome'}
                            </h3>
                            <i className="fa-solid fa-pen text-app-text-muted text-xs md:opacity-0 group-hover:opacity-100 transition-all"></i>
                        </div>
                    )}

                    {isEditingRole ? (
                        <input
                            autoFocus
                            onBlur={handleRoleSubmit}
                            onKeyDown={(e) => e.key === 'Enter' && handleRoleSubmit()}
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            placeholder="Seu Cargo..."
                            className="bg-app-surface-2/50 border border-app-border rounded-lg px-3 py-1.5 text-[11px] font-black text-app-text-strong uppercase tracking-widest outline-none w-full"
                        />
                    ) : (
                        <button
                            onClick={() => setIsEditingRole(true)}
                            className="text-[11px] md:text-[12px] font-black text-app-text-muted hover:text-app-text-strong transition-colors flex items-center gap-3 uppercase tracking-widest group py-1"
                        >
                            {profile.role || 'ESPECIALISTA EKKO'}
                            <i className="fa-solid fa-pencil text-[9px] md:opacity-0 group-hover:opacity-100 transition-all"></i>
                        </button>
                    )}

                    <div className="flex items-center gap-3 mt-4">
                        <div className="flex items-center gap-2 bg-app-surface-2 rounded-xl px-4 py-2.5 border border-app-border-light shadow-inner">
                            <div className={`w-2.5 h-2.5 rounded-full ${statusColors[profile.status]} shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse`}></div>
                            <select
                                value={profile.status}
                                onChange={(e) => onUpdate({ status: e.target.value as any })}
                                className="bg-transparent text-[10px] font-black uppercase text-emerald-500 tracking-widest outline-none cursor-pointer border-none p-0 hover:text-emerald-400 transition-colors appearance-none"
                            >
                                <option value="online" className="bg-app-surface">On-line</option>
                                <option value="ocupado" className="bg-app-surface">Ocupado</option>
                                <option value="ausente" className="bg-app-surface">Ausente</option>
                                <option value="offline" className="bg-app-surface">Off-line</option>
                            </select>
                            <i className="fa-solid fa-angle-down text-[8px] text-app-text-muted"></i>
                        </div>
                        <span className="text-[10px] font-bold text-app-text-muted truncate opacity-60 max-w-[150px]">{profile.email}</span>
                    </div>
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => alert('Gerando seu StandUp diário com IA... Aguarde um instante.')}
                        className="w-full justify-center px-4 py-4 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-2xl text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                    >
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        Obter StandUp Diário
                    </button>
                </div>
            </div>

            {/* TABS SELECTOR */}
            <div className="flex px-6 md:px-10 border-b border-app-border gap-6 md:gap-10 mt-4 overflow-x-auto no-scrollbar shrink-0">
                {['Atividade', `Tarefas (${myTasks.length})`, 'Calendário'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab.split(' ')[0]);
                            setIsContentExpanded(true);
                        }}
                        className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap ${activeTab === tab.split(' ')[0] ? 'text-app-text-strong border-b-2 border-blue-500' : 'text-app-text-muted hover:text-app-text-strong'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* COLLAPSIBLE CONTENT AREA */}
            <div className={`transition-all duration-300 flex-1 overflow-hidden flex flex-col ${isContentExpanded ? 'opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="p-6 md:p-10 space-y-8 bg-app-surface-2/30 overflow-y-auto custom-scrollbar flex-1">
                    {activeTab === 'Atividade' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-app-text-strong tracking-widest">Feed de Ações</span>
                                <button onClick={() => setIsContentExpanded(false)} className="text-[10px] font-bold text-app-text-muted hover:text-app-text-strong">Recolher</button>
                            </div>
                            <div className="space-y-4">
                                {tasks.flatMap(t => t.Activities || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map(act => (
                                    <div key={act.id} className="flex gap-4 border-l-2 border-app-border-light pl-6 py-2">
                                        <div className="flex-1">
                                            <p className="text-[11px] text-app-text-muted font-bold uppercase"><span className="text-app-text-strong">{act.user.split('@')[0]}</span> {act.message}</p>
                                            <span className="text-[9px] text-app-text-muted font-bold opacity-60">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Tarefas' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-app-text-strong tracking-widest">Minhas Urgências</span>
                                <button onClick={() => setIsContentExpanded(false)} className="text-[10px] font-bold text-app-text-muted hover:text-app-text-strong">Recolher</button>
                            </div>
                            <div className="space-y-3">
                                {myTasks.length > 0 ? myTasks.map(t => (
                                    <div key={t.id} className="p-5 bg-app-surface border border-app-border rounded-2xl flex items-center gap-4 hover:border-blue-500/30 transition-all cursor-pointer shadow-sm">
                                        <div className={`w-2 h-2 rounded-full ${t.Prioridade === 'Urgente' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-[11px] font-black text-app-text-strong uppercase truncate">{t.Título}</p>
                                            <p className="text-[9px] font-bold text-app-text-muted uppercase italic opacity-60">Prazo: {t.Data_Entrega || 'S/D'}</p>
                                        </div>
                                        <i className="fa-solid fa-chevron-right text-[10px] text-app-text-muted"></i>
                                    </div>
                                )) : (
                                    <p className="text-[10px] text-app-text-muted font-bold uppercase text-center py-6 italic opacity-60">Sem tarefas pendentes</p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'Calendário' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-app-text-strong tracking-widest">Meus Prazos</span>
                                <button onClick={() => setIsContentExpanded(false)} className="text-[10px] font-bold text-app-text-muted hover:text-app-text-strong">Recolher</button>
                            </div>
                            <div className="bg-app-surface p-6 rounded-2xl border border-app-border shadow-sm">
                                <div className="flex flex-col gap-4">
                                    {myTasks.filter(t => t.Data_Entrega).sort((a, b) => a.Data_Entrega!.localeCompare(b.Data_Entrega!)).map(t => (
                                        <div key={t.id} className="flex items-center gap-4 pb-4 border-b border-app-border last:border-0 last:pb-0">
                                            <div className="flex flex-col items-center justify-center bg-blue-500/10 rounded-xl px-2 py-2 min-w-[50px]">
                                                <span className="text-[11px] font-black text-blue-500 leading-none">{t.Data_Entrega?.split('-')[2]}</span>
                                                <span className="text-[8px] font-black text-blue-400 uppercase">{new Date(t.Data_Entrega! + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[11px] font-black text-app-text-strong uppercase truncate">{t.Título}</p>
                                                <span className="text-[9px] font-bold text-app-text-muted uppercase opacity-60">{t.Hora_Entrega || '09:00'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {myTasks.filter(t => t.Data_Entrega).length === 0 && (
                                        <p className="text-[10px] text-app-text-muted font-bold text-center italic opacity-60">Nenhum prazo definido</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PRIORITIES SECTION */}
                    <div className="pt-8 border-t border-app-border">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-app-text-strong tracking-widest">Prioridades Focadas</span>
                                <i className="fa-solid fa-bullseye text-blue-500 text-[10px]"></i>
                            </div>
                            <button
                                onClick={() => setIsAddingPriority(true)}
                                className="text-[10px] font-black uppercase text-[#3B82F6] hover:text-blue-400 flex items-center gap-2 transition-all"
                            >
                                <i className="fa-solid fa-plus text-[8px]"></i> Adicionar
                            </button>
                        </div>

                        {isAddingPriority && (
                            <div className="mb-6 flex gap-3">
                                <input
                                    autoFocus
                                    value={newPriority}
                                    onChange={e => setNewPriority(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddPriority()}
                                    placeholder="Foco de hoje..."
                                    className="flex-1 bg-app-surface-2 border border-blue-500/30 rounded-xl px-4 py-3 text-[10px] font-bold text-app-text-strong uppercase outline-none shadow-inner"
                                />
                                <button onClick={handleAddPriority} className="bg-blue-600 text-white px-4 rounded-xl text-xs active:scale-90 transition-transform"><i className="fa-solid fa-check"></i></button>
                                <button onClick={() => setIsAddingPriority(false)} className="text-app-text-muted px-2 active:scale-90 transition-transform"><i className="fa-solid fa-xmark"></i></button>
                            </div>
                        )}

                        <div className="space-y-3">
                            {(profile.priorities || []).map((p, i) => (
                                <div key={i} className="group flex items-center gap-4 p-4 bg-app-surface border border-app-border rounded-xl shadow-sm hover:border-blue-500/20 transition-all">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
                                    <span className="text-[10px] font-black text-app-text-muted uppercase flex-1 truncate">{p}</span>
                                    <button onClick={() => removePriority(i)} className="md:opacity-0 group-hover:opacity-100 text-rose-500/50 hover:text-rose-500 transition-all active:scale-90">
                                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                                    </button>
                                </div>
                            ))}
                            {(!profile.priorities || profile.priorities.length === 0) && !isAddingPriority && (
                                <div className="p-10 border border-dashed border-app-border rounded-2xl flex items-center justify-center bg-app-surface/50">
                                    <p className="text-[10px] uppercase font-black tracking-widest text-app-text-muted text-center italic opacity-60">Liste seus focos principais.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {!isContentExpanded && (
                <div className="px-6 md:px-10 pb-10 pt-4 shrink-0">
                    <button
                        onClick={() => setIsContentExpanded(true)}
                        className="w-full py-4 border border-dashed border-app-border rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-app-text-muted hover:text-app-text-strong hover:border-app-text-muted transition-all bg-app-surface/50 active:scale-95"
                    >
                        <i className="fa-solid fa-angle-down mr-2 animate-bounce"></i>
                        Expandir Painel Completo
                    </button>
                </div>
            )}
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
            {/* TRIGGER AVATAR */}
            <button
                ref={buttonRef}
                onClick={togglePopover}
                className="relative group focus:outline-none"
                aria-label="Abrir Perfil"
            >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center border-2 border-app-border text-white font-black text-sm shadow-lg transition-all group-hover:scale-110 group-active:scale-95 overflow-hidden">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                        initials
                    )}
                </div>
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-app-surface ${statusColors[profile.status]} shadow-sm`}></div>
            </button>

            {/* Mobile View */}
            {isOpen && isMobile && (
                <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
                    {content}
                </BottomSheet>
            )}

            {/* Desktop View using Portal */}
            <PortalPopover
                isOpen={isOpen && !isMobile}
                onClose={() => setIsOpen(false)}
                triggerRef={buttonRef}
                className="w-[420px] max-w-[calc(100vw-32px)]"
                align="end"
            >
                <div className="bg-app-surface border border-app-border rounded-[40px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col pointer-events-auto max-h-[85vh]">
                    {content}
                </div>
            </PortalPopover>
        </div>
    );
}
