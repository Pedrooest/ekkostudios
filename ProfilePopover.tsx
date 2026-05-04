import React, { useState, useRef, useMemo } from 'react';
import { PerfilUsuario, Tarefa, ItemPlanejamento } from './types';
import { BottomSheet } from './components/BottomSheet';
import { PortalPopover } from './components/PortalPopover';
import {
    Sparkles, X, Activity, Check, LogOut, Camera, ImageIcon,
    Plus, Trash2, Moon, Sun, Settings, Target, Link2,
    Tag, Palette, Globe, BarChart2, CheckCircle2, Layers
} from 'lucide-react';
import { playUISound } from './utils/uiSounds';

interface ProfilePopoverProps {
    profile: PerfilUsuario;
    tasks: Tarefa[];
    planejamento?: ItemPlanejamento[];
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
    online: 'ring-emerald-500/40',
    ocupado: 'ring-rose-500/40',
    ausente: 'ring-amber-500/40',
    offline: 'ring-gray-400/30',
};

const ACCENT_PRESETS = [
    { label: 'Índigo', value: '#6366f1' },
    { label: 'Azul', value: '#3b82f6' },
    { label: 'Roxo', value: '#a855f7' },
    { label: 'Rosa', value: '#ec4899' },
    { label: 'Vermelho', value: '#ef4444' },
    { label: 'Laranja', value: '#f97316' },
    { label: 'Âmbar', value: '#f59e0b' },
    { label: 'Verde', value: '#22c55e' },
    { label: 'Teal', value: '#14b8a6' },
    { label: 'Ciano', value: '#06b6d4' },
];

export function ProfilePopover({ profile, tasks, planejamento = [], onUpdate, onLogout, isDarkMode, onToggleDarkMode }: ProfilePopoverProps) {
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
    const [newSkill, setNewSkill] = useState('');
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [customAccent, setCustomAccent] = useState(profile.accent_color || '#6366f1');
    const [newLink, setNewLink] = useState({ label: '', url: '' });
    const [isAddingLink, setIsAddingLink] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const isMobile = window.innerWidth < 1024;
    const accent = profile.accent_color || '#6366f1';

    const getInitials = (name: string, email: string) => {
        const displayName = name || email || '?';
        const parts = displayName.split(/[ @._-]/).filter(p => p.length > 0);
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return displayName.substring(0, 2).toUpperCase();
    };

    const initials = getInitials(profile.full_name, profile.email);

    const myTasks = tasks.filter(t => t.Responsável === profile.full_name && t.Status !== 'concluido');
    const completedTasks = tasks.filter(t => t.Responsável === profile.full_name && t.Status === 'concluido');
    const urgentTasks = myTasks.filter(t => t.Prioridade === 'Alta' || t.Prioridade === 'Urgente');
    const myPosts = planejamento.filter(p => p["Status do conteúdo"] === 'Concluído');
    const totalPosts = planejamento.length;

    const completionRate = useMemo(() => {
        const total = tasks.filter(t => t.Responsável === profile.full_name).length;
        if (total === 0) return 0;
        return Math.round((completedTasks.length / total) * 100);
    }, [tasks, completedTasks, profile.full_name]);

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

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => onUpdate({ banner_url: reader.result as string });
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

    const handleAddSkill = () => {
        if (!newSkill.trim()) return;
        onUpdate({ skills: [...(profile.skills || []), newSkill.trim()] });
        setNewSkill('');
        setIsAddingSkill(false);
    };
    const removeSkill = (index: number) => {
        onUpdate({ skills: (profile.skills || []).filter((_, i) => i !== index) });
    };

    const handleAddLink = () => {
        if (!newLink.label.trim() || !newLink.url.trim()) return;
        const url = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;
        onUpdate({ social_links: [...(profile.social_links || []), { label: newLink.label.trim(), url }] });
        setNewLink({ label: '', url: '' });
        setIsAddingLink(false);
    };
    const removeLink = (index: number) => {
        onUpdate({ social_links: (profile.social_links || []).filter((_, i) => i !== index) });
    };

    const applyAccent = (color: string) => {
        playUISound('tap');
        setCustomAccent(color);
        onUpdate({ accent_color: color });
    };

    const content = (
        <div className="bg-white dark:bg-[#111114] h-full flex flex-col overflow-hidden relative">
            {/* Close */}
            <div className="absolute top-3 right-3 z-20">
                <button
                    onClick={() => { playUISound('tap'); setIsOpen(false); }}
                    className="ios-btn p-1.5 text-white/70 hover:text-white rounded-lg transition-colors bg-black/20 backdrop-blur-sm"
                >
                    <X size={16} />
                </button>
            </div>

            {/* HERO BANNER */}
            <div className="relative shrink-0">
                {/* Banner */}
                <div
                    className="h-24 relative overflow-hidden cursor-pointer group/banner"
                    onClick={() => bannerInputRef.current?.click()}
                    title="Clique para alterar a capa"
                >
                    {profile.banner_url ? (
                        <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                        <div
                            className="w-full h-full"
                            style={{
                                background: `linear-gradient(135deg, ${accent}30 0%, ${accent}60 50%, ${accent}20 100%)`,
                            }}
                        >
                            <div className="absolute inset-0" style={{
                                backgroundImage: `radial-gradient(circle at 20% 50%, ${accent}40 0%, transparent 60%), radial-gradient(circle at 80% 20%, ${accent}30 0%, transparent 50%)`
                            }} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/banner:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover/banner:opacity-100">
                        <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                            <ImageIcon size={12} className="text-white" />
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider">Alterar capa</span>
                        </div>
                    </div>
                </div>

                {/* Avatar overlapping banner */}
                <div className="px-5 pb-0">
                    <div className="flex items-end justify-between -mt-8 mb-3">
                        <div className="relative group/avatar">
                            <div
                                className={`ios-btn w-16 h-16 rounded-2xl text-white flex items-center justify-center font-black text-2xl shadow-xl cursor-pointer overflow-hidden ring-4 ring-white dark:ring-[#111114] ${STATUS_RING[profile.status]}`}
                                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}
                                onClick={() => { playUISound('tap'); fileInputRef.current?.click(); }}
                            >
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                ) : initials}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-2xl">
                                    <Camera size={16} className="text-white" />
                                </div>
                            </div>
                            <button
                                onClick={cycleStatus}
                                title={`Status: ${STATUS_LABELS[profile.status]} (clique para alterar)`}
                                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-[#111114] ${STATUS_COLORS[profile.status]} shadow-sm transition-transform hover:scale-125 cursor-pointer`}
                            />
                        </div>

                        {/* Status pill */}
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
                    </div>

                    {/* Name + Role */}
                    <div className="mb-3">
                        {isEditingName ? (
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-transparent border-b-2 text-base font-black text-gray-900 dark:text-white outline-none w-full mb-1"
                                style={{ borderColor: accent }}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                                onBlur={handleNameSubmit}
                            />
                        ) : (
                            <h2
                                className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1 cursor-pointer transition-colors truncate"
                                style={{ ['--tw-text-opacity' as string]: '1' }}
                                onMouseEnter={e => (e.currentTarget.style.color = accent)}
                                onMouseLeave={e => (e.currentTarget.style.color = '')}
                                onClick={() => { playUISound('tap'); setIsEditingName(true); setNewName(profile.full_name); }}
                            >
                                {profile.full_name || 'Configurar Nome'}
                            </h2>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                            {isEditingRole ? (
                                <input
                                    type="text"
                                    value={newRole}
                                    onChange={(e) => setNewRole(e.target.value)}
                                    className="bg-transparent border-b text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest outline-none"
                                    style={{ borderColor: accent + '80' }}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleRoleSubmit()}
                                    onBlur={handleRoleSubmit}
                                />
                            ) : (
                                <p
                                    className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-gray-700 dark:hover:text-zinc-200 transition-colors truncate"
                                    onClick={() => { playUISound('tap'); setIsEditingRole(true); setNewRole(profile.role || ''); }}
                                >
                                    {profile.role || 'ESPECIALISTA EKKO'}
                                </p>
                            )}
                            <span className="text-[9px] text-gray-300 dark:text-zinc-600">•</span>
                            <span className="text-[9px] text-gray-400 dark:text-zinc-500 font-medium truncate">{profile.email}</span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                            { label: 'Tarefas', value: myTasks.length, icon: Target, color: accent },
                            { label: 'Concluídas', value: completedTasks.length, icon: CheckCircle2, color: '#22c55e' },
                            { label: 'Posts', value: myPosts.length, icon: Layers, color: '#a855f7' },
                        ].map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="flex flex-col items-center py-2 bg-gray-50 dark:bg-zinc-900/80 rounded-xl border border-gray-100 dark:border-zinc-800">
                                <Icon size={13} style={{ color }} className="mb-1" />
                                <span className="text-sm font-black text-gray-900 dark:text-white">{value}</span>
                                <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">{label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Standup button */}
                    <button
                        onClick={() => { playUISound('tap'); }}
                        className="ios-btn w-full flex items-center justify-center gap-2 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all mb-4"
                        style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 4px 15px ${accent}30` }}
                    >
                        <Sparkles size={13} /> Standup Diário com IA
                    </button>
                </div>
            </div>

            {/* TABS */}
            <div className="flex px-5 border-b border-gray-200 dark:border-zinc-800 shrink-0">
                {([
                    { id: 'ATIVIDADE', label: 'Perfil', icon: Activity },
                    { id: 'TAREFAS', label: `Tarefas${myTasks.length > 0 ? ` (${myTasks.length})` : ''}`, icon: Target },
                    { id: 'CONFIG', label: 'Config', icon: Settings },
                ] as const).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { playUISound('tap'); setActiveTab(tab.id); }}
                        className={`ios-btn flex-1 pb-3 pt-1 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab.id ? 'border-current text-current' : 'border-transparent text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'}`}
                        style={activeTab === tab.id ? { color: accent, borderColor: accent } : {}}
                    >
                        <tab.icon size={11} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
                {/* ATIVIDADE / PERFIL */}
                {activeTab === 'ATIVIDADE' && (
                    <>
                        {/* Bio */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1.5">Bio</p>
                            {isEditingDesc ? (
                                <textarea
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-zinc-900 border rounded-xl px-3 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 outline-none resize-none h-20"
                                    style={{ borderColor: accent + '80' }}
                                    autoFocus
                                    onBlur={handleDescSubmit}
                                    placeholder="Fale um pouco sobre você..."
                                />
                            ) : (
                                <p
                                    onClick={() => { playUISound('tap'); setIsEditingDesc(true); setNewDesc(profile.descricao || ''); }}
                                    className="text-xs text-gray-500 dark:text-zinc-400 cursor-pointer hover:text-gray-700 dark:hover:text-zinc-300 transition-colors italic leading-relaxed min-h-[20px] p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-900"
                                >
                                    {profile.descricao || 'Clique para adicionar uma bio...'}
                                </p>
                            )}
                        </div>

                        {/* Skills / Habilidades */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Habilidades</p>
                                <button
                                    onClick={() => { playUISound('tap'); setIsAddingSkill(true); }}
                                    className="ios-btn p-1 rounded-lg text-gray-400 transition-colors hover:text-white"
                                    style={{ ['--hover-bg' as string]: accent }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent; e.currentTarget.style.color = 'white'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                            {isAddingSkill && (
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={(e) => setNewSkill(e.target.value)}
                                        placeholder="Ex: Design, Copywriting..."
                                        className="flex-1 bg-gray-50 dark:bg-zinc-900 border rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white outline-none"
                                        style={{ borderColor: accent + '80' }}
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(); if (e.key === 'Escape') setIsAddingSkill(false); }}
                                        onBlur={() => { if (!newSkill.trim()) setIsAddingSkill(false); }}
                                    />
                                    <button onClick={handleAddSkill} className="ios-btn p-1.5 text-white rounded-lg" style={{ backgroundColor: accent }}>
                                        <Check size={12} />
                                    </button>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                                {(profile.skills || []).map((skill, i) => (
                                    <div key={i} className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all"
                                        style={{ borderColor: accent + '40', backgroundColor: accent + '10', color: accent }}
                                    >
                                        <Tag size={9} />
                                        {skill}
                                        <button
                                            onClick={() => { playUISound('tap'); removeSkill(i); }}
                                            className="ios-btn ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-rose-500"
                                        >
                                            <X size={9} />
                                        </button>
                                    </div>
                                ))}
                                {(profile.skills || []).length === 0 && !isAddingSkill && (
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-600 italic">Nenhuma habilidade adicionada.</p>
                                )}
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Links</p>
                                <button
                                    onClick={() => { playUISound('tap'); setIsAddingLink(true); }}
                                    className="ios-btn p-1 rounded-lg text-gray-400 transition-colors"
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent; e.currentTarget.style.color = 'white'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                            {isAddingLink && (
                                <div className="space-y-2 mb-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                    <input
                                        type="text"
                                        value={newLink.label}
                                        onChange={(e) => setNewLink(l => ({ ...l, label: e.target.value }))}
                                        placeholder="Label (ex: Portfolio)"
                                        className="w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white outline-none"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newLink.url}
                                            onChange={(e) => setNewLink(l => ({ ...l, url: e.target.value }))}
                                            placeholder="URL"
                                            className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white outline-none"
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddLink(); if (e.key === 'Escape') setIsAddingLink(false); }}
                                        />
                                        <button onClick={handleAddLink} className="ios-btn p-1.5 text-white rounded-lg" style={{ backgroundColor: accent }}>
                                            <Check size={12} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1.5">
                                {(profile.social_links || []).map((link, i) => (
                                    <div key={i} className="group flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                        <Globe size={11} className="text-gray-400 shrink-0" />
                                        <a href={link.url} target="_blank" rel="noopener noreferrer"
                                            className="flex-1 text-xs font-bold truncate transition-colors"
                                            style={{ color: accent }}
                                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                            onMouseLeave={e => e.currentTarget.style.textDecoration = ''}
                                        >
                                            {link.label}
                                        </a>
                                        <span className="text-[9px] text-gray-400 truncate max-w-[80px] hidden group-hover:inline">{link.url.replace(/^https?:\/\//, '')}</span>
                                        <button onClick={() => { playUISound('tap'); removeLink(i); }} className="ios-btn p-1 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                                {(profile.social_links || []).length === 0 && !isAddingLink && (
                                    <p className="text-[10px] text-gray-400 dark:text-zinc-600 italic">Nenhum link adicionado.</p>
                                )}
                            </div>
                        </div>

                        {/* Prioridades */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500">Prioridades</p>
                                <button
                                    onClick={() => { playUISound('tap'); setIsAddingPriority(true); }}
                                    className="ios-btn p-1 rounded-lg text-gray-400 transition-colors"
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = accent; e.currentTarget.style.color = 'white'; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
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
                                        className="flex-1 bg-gray-50 dark:bg-zinc-900 border rounded-lg px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white outline-none"
                                        style={{ borderColor: accent + '80' }}
                                        autoFocus
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddPriority(); if (e.key === 'Escape') setIsAddingPriority(false); }}
                                        onBlur={() => { if (!newPriority.trim()) setIsAddingPriority(false); }}
                                    />
                                    <button onClick={handleAddPriority} className="ios-btn p-1.5 text-white rounded-lg" style={{ backgroundColor: accent }}>
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
                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: accent }} />
                                            <span className="flex-1 text-xs font-bold text-gray-700 dark:text-zinc-300 truncate">{p}</span>
                                            <button onClick={() => { playUISound('tap'); removePriority(i); }} className="ios-btn p-1 text-gray-300 dark:text-zinc-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg">
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
                    <>
                        {/* Completion bar */}
                        {completionRate > 0 && (
                            <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800 space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase text-gray-500 dark:text-zinc-400">
                                    <span>Taxa de conclusão</span>
                                    <span>{completionRate}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completionRate}%`, backgroundColor: accent }} />
                                </div>
                            </div>
                        )}
                        {myTasks.length === 0 ? (
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
                                            <p className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mt-0.5">{t.Status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* CONFIG */}
                {activeTab === 'CONFIG' && (
                    <div className="space-y-5">
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
                                        className={`w-11 h-6 rounded-full transition-colors relative`}
                                        style={{ backgroundColor: isDarkMode ? accent : '#d1d5db' }}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${isDarkMode ? 'left-6' : 'left-1'}`} />
                                    </button>
                                ) : (
                                    <span className="text-[9px] text-gray-400 uppercase tracking-wider">Auto</span>
                                )}
                            </div>
                        </div>

                        {/* Cor de destaque */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                                <Palette size={10} /> Cor de Destaque
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {ACCENT_PRESETS.map(preset => (
                                    <button
                                        key={preset.value}
                                        onClick={() => applyAccent(preset.value)}
                                        title={preset.label}
                                        className="ios-btn w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                                        style={{
                                            backgroundColor: preset.value,
                                            borderColor: profile.accent_color === preset.value ? 'white' : 'transparent',
                                            boxShadow: profile.accent_color === preset.value ? `0 0 0 3px ${preset.value}60` : 'none',
                                            transform: profile.accent_color === preset.value ? 'scale(1.15)' : ''
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-zinc-700 shrink-0" style={{ backgroundColor: customAccent }} />
                                <input
                                    type="text"
                                    value={customAccent}
                                    onChange={(e) => setCustomAccent(e.target.value)}
                                    placeholder="#6366f1"
                                    maxLength={7}
                                    className="flex-1 bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none transition-colors font-mono"
                                />
                                <button
                                    onClick={() => { if (/^#[0-9A-Fa-f]{6}$/.test(customAccent)) applyAccent(customAccent); }}
                                    disabled={!/^#[0-9A-Fa-f]{6}$/.test(customAccent)}
                                    className="ios-btn px-3 py-2 text-white text-xs font-bold rounded-lg disabled:opacity-40 transition-colors"
                                    style={{ backgroundColor: accent }}
                                >
                                    OK
                                </button>
                            </div>
                        </div>

                        {/* Perfil quick links */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">Perfil</p>
                            <div className="space-y-2">
                                {[
                                    { label: 'Nome', value: profile.full_name || 'Definir nome', onClick: () => { setActiveTab('ATIVIDADE'); setTimeout(() => setIsEditingName(true), 200); setNewName(profile.full_name); } },
                                    { label: 'Cargo', value: profile.role || 'Definir cargo', onClick: () => { setActiveTab('ATIVIDADE'); setTimeout(() => setIsEditingRole(true), 200); setNewRole(profile.role || ''); } },
                                    { label: 'Avatar', value: 'Alterar foto', onClick: () => fileInputRef.current?.click() },
                                    { label: 'Capa', value: 'Alterar capa', onClick: () => bannerInputRef.current?.click() },
                                ].map(({ label, value, onClick }) => (
                                    <div key={label} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800">
                                        <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">{label}</span>
                                        <button
                                            onClick={() => { playUISound('tap'); onClick(); }}
                                            className="text-xs font-bold hover:underline truncate max-w-[140px]"
                                            style={{ color: accent }}
                                        >
                                            {value}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3">Status</p>
                            <div className="grid grid-cols-2 gap-2">
                                {STATUS_CYCLE.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => { playUISound('tap'); onUpdate({ status: s }); }}
                                        className={`ios-btn flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                                            profile.status === s
                                                ? 'text-white border-transparent'
                                                : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600'
                                        }`}
                                        style={profile.status === s ? { backgroundColor: accent, boxShadow: `0 4px 12px ${accent}40` } : {}}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[s]} shrink-0`} />
                                        {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                                <BarChart2 size={10} /> Estatísticas
                            </p>
                            <div className="space-y-2">
                                {[
                                    { label: 'Tarefas pendentes', value: myTasks.length },
                                    { label: 'Tarefas concluídas', value: completedTasks.length },
                                    { label: 'Posts publicados', value: myPosts.length },
                                    { label: 'Total de posts', value: totalPosts },
                                    { label: 'Taxa de conclusão', value: `${completionRate}%` },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                                        <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-400">{label}</span>
                                        <span className="text-xs font-black text-gray-900 dark:text-white">{value}</span>
                                    </div>
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
            <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />
        </div>
    );

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => { if (!isOpen) playUISound('open'); setIsOpen(!isOpen); }}
                className={`ios-btn w-10 h-10 rounded-full flex items-center justify-center font-black text-sm border-2 transition-all ${isOpen ? 'shadow-[0_0_15px_var(--accent-glow)]' : 'border-transparent hover:border-gray-300 dark:hover:border-zinc-600'} bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-200 overflow-hidden`}
                style={isOpen ? { borderColor: accent, ['--accent-glow' as string]: accent + '60' } : {}}
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
                className="w-[360px]"
                align="end"
            >
                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto max-h-[90vh]">
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
