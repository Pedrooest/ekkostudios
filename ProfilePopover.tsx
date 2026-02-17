import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Task } from './types';
import { Button } from './Components';

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

    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);

    const togglePopover = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position: Top-Right aligned with button, shifted down
            setDropdownPos({
                top: rect.bottom + 12,
                left: rect.right - 400 // Width of popover is 400px
            });
        }
        setIsOpen(!isOpen);
    };

    // Close on scroll/resize
    useEffect(() => {
        const handleScroll = () => isOpen && setIsOpen(false);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    return (
        <>
            {/* BACKDROP */}
            {isOpen && <div className="fixed inset-0 z-[1900] bg-transparent" onClick={() => setIsOpen(false)}></div>}

            <div className="relative">
                {/* TRIGGER AVATAR */}
                <button
                    ref={buttonRef}
                    onClick={togglePopover}
                    className="relative group focus:outline-none"
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

                {/* POPOVER CARD - FIXED POSITION */}
                {isOpen && (
                    <div
                        className="fixed w-[400px] bg-app-surface border border-app-border rounded-[40px] shadow-2xl z-[2000] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                    >
                        {/* POPUP HEADER */}
                        <div className="p-8 pb-4">
                            <div className="flex items-start justify-between mb-6">
                                <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#4B3A2F] to-[#2D221B] flex items-center justify-center text-white text-3xl font-black shadow-xl border border-white/5 overflow-hidden">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            initials
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                        <i className="fa-solid fa-camera text-white text-xl"></i>
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#111827] ${statusColors[profile.status]} shadow-lg`}></div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={onLogout}
                                        title="Sair"
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all border border-rose-500/20"
                                    >
                                        <i className="fa-solid fa-right-from-bracket"></i>
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 transition-all border border-white/10"
                                    >
                                        <i className="fa-solid fa-close text-lg"></i>
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
                                        className="bg-[#0B0F19] border border-blue-500/30 rounded-xl px-3 py-1 text-xl font-bold text-white outline-none w-full shadow-inner shadow-blue-500/5"
                                    />
                                ) : (
                                    <div
                                        className="group flex items-center gap-2 cursor-pointer"
                                        onClick={() => setIsEditingName(true)}
                                    >
                                        <h3 className="text-xl font-black text-white leading-tight tracking-tighter">
                                            {profile.full_name || 'Configurar Nome'}
                                        </h3>
                                        <i className="fa-solid fa-pen text-gray-700 text-[10px] group-hover:text-blue-500 transition-colors"></i>
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
                                        className="bg-[#0B0F19]/50 border border-gray-700 rounded-lg px-2 py-0.5 text-[11px] font-black text-white uppercase tracking-widest outline-none w-full"
                                    />
                                ) : (
                                    <button
                                        onClick={() => setIsEditingRole(true)}
                                        className="text-[11px] font-black text-gray-500 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest group"
                                    >
                                        {profile.role || 'ESPECIALISTA EKKO'}
                                        <i className="fa-solid fa-pencil text-[8px] opacity-0 group-hover:opacity-100"></i>
                                    </button>
                                )}

                                <div className="flex items-center gap-3 mt-4">
                                    <div className="flex items-center gap-2 bg-[#0B0F19] rounded-xl px-3 py-2 border border-white/5 shadow-inner">
                                        <div className={`w-2 h-2 rounded-full ${statusColors[profile.status]} shadow-[0_0_8px_rgba(16,185,129,0.3)] animate-pulse`}></div>
                                        <select
                                            value={profile.status}
                                            onChange={(e) => onUpdate({ status: e.target.value as any })}
                                            className="bg-transparent text-[10px] font-black uppercase text-emerald-500 tracking-widest outline-none cursor-pointer border-none p-0 hover:text-emerald-400 transition-colors appearance-none"
                                        >
                                            <option value="online" className="bg-[#111827]">On-line</option>
                                            <option value="ocupado" className="bg-[#111827]">Ocupado</option>
                                            <option value="ausente" className="bg-[#111827]">Ausente</option>
                                            <option value="offline" className="bg-[#111827]">Off-line</option>
                                        </select>
                                        <i className="fa-solid fa-angle-down text-[8px] text-gray-600"></i>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-600 truncate opacity-60">{profile.email}</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    onClick={() => alert('Gerando seu StandUp diário com IA... Aguarde um instante.')}
                                    className="w-full justify-center px-4 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl text-purple-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-purple-950/20"
                                >
                                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                                    Obter StandUp Diário
                                </button>
                            </div>
                        </div>

                        {/* TABS SELECTOR */}
                        <div className="flex px-8 border-b border-white/5 gap-8 mt-4">
                            {['Atividade', `Tarefas (${myTasks.length})`, 'Calendário'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveTab(tab.split(' ')[0]);
                                        setIsContentExpanded(true);
                                    }}
                                    className={`py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.split(' ')[0] ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    {tab}
                                    {activeTab === tab.split(' ')[0] && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* COLLAPSIBLE CONTENT AREA */}
                        <div className={`transition-all duration-300 overflow-hidden ${isContentExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="p-8 space-y-8 bg-[#0B0F19]/50 overflow-y-auto max-h-[400px] custom-scrollbar">
                                {activeTab === 'Atividade' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Feed de Ações</span>
                                            <button onClick={() => setIsContentExpanded(false)} className="text-[10px] font-bold text-gray-500 hover:text-white">Recolher</button>
                                        </div>
                                        <div className="space-y-4">
                                            {tasks.flatMap(t => t.Activities || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map(act => (
                                                <div key={act.id} className="flex gap-3 border-l-2 border-white/5 pl-4 py-1">
                                                    <div className="flex-1">
                                                        <p className="text-[11px] text-gray-400 font-bold uppercase"><span className="text-white">{act.user.split('@')[0]}</span> {act.message}</p>
                                                        <span className="text-[9px] text-gray-600 font-bold">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Tarefas' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Minhas Urgências</span>
                                            <button onClick={() => setIsContentExpanded(false)} className="text-[10px] font-bold text-gray-500 hover:text-white">Recolher</button>
                                        </div>
                                        <div className="space-y-2">
                                            {myTasks.length > 0 ? myTasks.map(t => (
                                                <div key={t.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3 hover:bg-white/[0.06] transition-all cursor-pointer">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${t.Prioridade === 'Urgente' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                                    <div className="flex-1">
                                                        <p className="text-[11px] font-black text-white uppercase truncate">{t.Título}</p>
                                                        <p className="text-[9px] font-bold text-gray-600 uppercase italic">Prazo: {t.Data_Entrega || 'S/D'}</p>
                                                    </div>
                                                    <i className="fa-solid fa-chevron-right text-[10px] text-gray-700"></i>
                                                </div>
                                            )) : (
                                                <p className="text-[10px] text-gray-600 font-bold uppercase text-center py-4 italic">Sem tarefas pendentes</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Calendário' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Meus Prazos</span>
                                            <button onClick={() => setIsContentExpanded(false)} className="text-[10px] font-bold text-gray-500 hover:text-white">Recolher</button>
                                        </div>
                                        <div className="bg-[#0B0F19] p-4 rounded-2xl border border-white/5">
                                            <div className="flex flex-col gap-3">
                                                {myTasks.filter(t => t.Data_Entrega).sort((a, b) => a.Data_Entrega!.localeCompare(b.Data_Entrega!)).map(t => (
                                                    <div key={t.id} className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                                        <div className="flex flex-col items-center justify-center bg-blue-500/10 rounded-xl px-2 py-1 min-w-[45px]">
                                                            <span className="text-[10px] font-black text-blue-500 leading-none">{t.Data_Entrega?.split('-')[2]}</span>
                                                            <span className="text-[7px] font-black text-blue-400 uppercase">{new Date(t.Data_Entrega! + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[10px] font-black text-white uppercase truncate">{t.Título}</p>
                                                            <span className="text-[8px] font-bold text-gray-600 uppercase">{t.Hora_Entrega || '09:00'}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {myTasks.filter(t => t.Data_Entrega).length === 0 && (
                                                    <p className="text-[10px] text-gray-600 font-bold text-center italic">Nenhum prazo definido</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PRIORITIES SECTION */}
                                <div className="pt-6 border-t border-white/5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-white tracking-widest">Prioridades Focadas</span>
                                            <i className="fa-solid fa-bullseye text-blue-500 text-[10px]"></i>
                                        </div>
                                        <button
                                            onClick={() => setIsAddingPriority(true)}
                                            className="text-[10px] font-black uppercase text-[#3B82F6] hover:text-white flex items-center gap-1 transition-all"
                                        >
                                            <i className="fa-solid fa-plus"></i> Adicionar
                                        </button>
                                    </div>

                                    {isAddingPriority && (
                                        <div className="mb-4 flex gap-2">
                                            <input
                                                autoFocus
                                                value={newPriority}
                                                onChange={e => setNewPriority(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddPriority()}
                                                placeholder="Desfio de hoje..."
                                                className="flex-1 bg-[#0B0F19] border border-blue-500/30 rounded-xl px-3 py-2 text-[10px] font-bold text-white uppercase outline-none"
                                            />
                                            <button onClick={handleAddPriority} className="bg-blue-600 text-white px-3 rounded-xl text-xs"><i className="fa-solid fa-check"></i></button>
                                            <button onClick={() => setIsAddingPriority(false)} className="text-gray-500 px-1"><i className="fa-solid fa-xmark"></i></button>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {(profile.priorities || []).map((p, i) => (
                                            <div key={i} className="group flex items-center gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]"></div>
                                                <span className="text-[10px] font-black text-gray-300 uppercase flex-1 truncate">{p}</span>
                                                <button onClick={() => removePriority(i)} className="opacity-0 group-hover:opacity-100 text-rose-500/50 hover:text-rose-500 transition-all">
                                                    <i className="fa-solid fa-trash-can text-[9px]"></i>
                                                </button>
                                            </div>
                                        ))}
                                        {(!profile.priorities || profile.priorities.length === 0) && !isAddingPriority && (
                                            <div className="p-6 border border-dashed border-white/5 rounded-2xl flex items-center justify-center bg-white/[0.01]">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 text-center italic">Liste seus focos principais.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!isContentExpanded && (
                            <div className="px-8 pb-8 pt-2">
                                <button
                                    onClick={() => setIsContentExpanded(true)}
                                    className="w-full py-3 border border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white hover:border-white/20 transition-all"
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
                )}
            </div>
        </>
    );
}
