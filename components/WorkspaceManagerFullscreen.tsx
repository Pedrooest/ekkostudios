import React, { useState, useEffect } from 'react';
import { Workspace, MembroWorkspace, Convite } from '../types';
import { DatabaseService } from '../DatabaseService';
import {
    ChevronDown, Users, Settings, Plus, Check,
    X, LogOut, Link as LinkIcon, Mail, Shield,
    Building2, ArrowLeft, Search, AlertTriangle,
    Smartphone, Lock, Github, Slack, Trello
} from 'lucide-react';
import { playUISound } from '../utils/uiSounds';

interface WorkspaceManagerFullscreenProps {
    workspace: Workspace;
    currentUser: any;
    initialTab?: 'configuracoes' | 'pessoas';
    onClose: () => void;
    onUpdateWorkspace: (updated: Workspace) => void;
    onWorkspaceDeleted: () => void;
}

export function WorkspaceManagerFullscreen({
    workspace,
    currentUser,
    initialTab = 'configuracoes',
    onClose,
    onUpdateWorkspace,
    onWorkspaceDeleted
}: WorkspaceManagerFullscreenProps) {
    const [activeSettingsTab, setActiveSettingsTab] = useState<'configuracoes' | 'pessoas' | 'seguranca' | 'integracoes'>(initialTab);

    // ESTADOS INTERNOS DE CONFIGURAÇÕES
    const [editWsName, setEditWsName] = useState(workspace?.nome || '');
    const [selectedColor, setSelectedColor] = useState(workspace?.cor || 'bg-indigo-600');
    const themeColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500', 'bg-blue-500', 'bg-indigo-600', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-slate-500'];
    const [savingConfig, setSavingConfig] = useState(false);

    // ESTADOS DE PESSOAS E CONVITES
    const [members, setMembers] = useState<MembroWorkspace[]>([]);
    const [invites, setInvites] = useState<Convite[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('editor');

    // LOAD DATA FOR MEMBERS TAB
    useEffect(() => {
        if (activeSettingsTab === 'pessoas') {
            loadMembersData();
        }
    }, [activeSettingsTab, workspace.id]);

    const loadMembersData = async () => {
        setLoadingMembers(true);
        try {
            const [m, i] = await Promise.all([
                DatabaseService.getWorkspaceMembers(workspace.id),
                DatabaseService.getWorkspaceInvites(workspace.id)
            ]);
            setMembers(m as any);
            setInvites(i as any);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingMembers(false);
        }
    };

    // ======= ACTIONS CONFIGURACAO =======
    const saveSettings = async () => {
        if (!editWsName || editWsName.trim() === '') return;
        setSavingConfig(true);
        try {
            const updated = await DatabaseService.updateWorkspace(workspace.id, {
                nome: editWsName,
                cor: selectedColor
            });
            playUISound('success');
            onUpdateWorkspace(updated);
            onClose();
        } catch (e) {
            console.error('Error updating workspace:', e);
            alert('Erro ao salvar as configurações.');
        } finally {
            setSavingConfig(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('TEM CERTEZA? Esta ação é irreversível e excluirá todos os dados deste workspace.')) return;
        playUISound('tap');
        try {
            await DatabaseService.deleteWorkspace(workspace.id);
            onWorkspaceDeleted();
        } catch (e) {
            console.error(e);
            alert('Erro ao excluir workspace.');
        }
    };


    // ======= ACTIONS MEMBROS =======
    const handleCreateInviteByEmail = async () => {
        if (!inviteEmail.trim()) {
            return handleCreateGenericInvite();
        }
        // Could eventually wire this to proper resend.com email invite
        handleCreateGenericInvite();
    };

    const handleCreateGenericInvite = async () => {
        try {
            const invite = await DatabaseService.createInvite(workspace.id, inviteRole);
            playUISound('success');
            setInvites(prev => [invite, ...prev]);
            const link = `${window.location.origin}?invite=${invite.token}`;
            navigator.clipboard.writeText(link);
            alert('Link de convite criado e copiado com sucesso!');
            setInviteEmail('');
        } catch (e) {
            console.error(e);
            alert('Erro ao criar convite.');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Tem certeza que deseja remover este membro?')) return;
        playUISound('tap');
        try {
            await DatabaseService.removeMember(workspace.id, userId);
            setMembers(prev => prev.filter(m => m.id_usuario !== userId));
        } catch (e) {
            console.error(e);
            alert('Erro ao remover membro.');
        }
    };


    const filteredMembers = members.filter(m =>
        (m.perfis?.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (m.perfis?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 w-[100vw] h-[100vh] z-[10000] bg-white dark:bg-[#0a0a0c] flex overflow-hidden animate-in slide-in-from-bottom-8 duration-300">

            {/* Sidebar Esquerda da Tela Cheia */}
            <aside className="w-72 flex-shrink-0 bg-gray-50/80 dark:bg-[#111114]/80 border-r border-gray-200 dark:border-zinc-800 flex flex-col h-full">

                {/* Header com botão Voltar */}
                <div className="h-[72px] flex items-center px-6 border-b border-gray-200 dark:border-zinc-800">
                    <button
                        onClick={() => { playUISound('close'); onClose(); }}
                        className="ios-btn flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ArrowLeft size={16} /> Voltar
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-500 mb-4 ml-2 mt-2">
                        Gerir Espaço de Trabalho
                    </h3>

                    <nav className="space-y-1.5">
                        <button
                            onClick={() => { playUISound('tap'); setActiveSettingsTab('configuracoes'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ios-btn ${activeSettingsTab === 'configuracoes'
                                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-zinc-700'
                                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200 border border-transparent'
                                }`}
                        >
                            <Settings size={18} /> Configurações
                        </button>

                        <button
                            onClick={() => { playUISound('tap'); setActiveSettingsTab('pessoas'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ios-btn ${activeSettingsTab === 'pessoas'
                                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200 dark:border-zinc-700'
                                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200 border border-transparent'
                                }`}
                        >
                            <Users size={18} /> Pessoas
                        </button>

                        <div className="h-6"></div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-500 mb-2 ml-2">
                            Avançado
                        </h3>

                        <button
                            onClick={() => { playUISound('tap'); setActiveSettingsTab('seguranca'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ios-btn border border-transparent ${activeSettingsTab === 'seguranca'
                                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-gray-200 dark:border-zinc-700'
                                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200'
                                }`}
                        >
                            <Shield size={18} /> Segurança e permissões
                        </button>
                        <button
                            onClick={() => { playUISound('tap'); setActiveSettingsTab('integracoes'); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ios-btn border border-transparent ${activeSettingsTab === 'integracoes'
                                ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border-gray-200 dark:border-zinc-700'
                                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-200'
                                }`}
                        >
                            <LinkIcon size={18} /> Integrações
                        </button>
                    </nav>
                </div>
            </aside>

            {/* Conteúdo Principal da Tela Cheia */}
            <main className="flex-1 flex flex-col h-full bg-white dark:bg-[#0a0a0c] relative">

                {/* Header Falso para alinhamento e botão fechar extra */}
                <div className="h-[72px] flex justify-end items-center px-8 shrink-0">
                    <button
                        onClick={() => { playUISound('close'); onClose(); }}
                        className="ios-btn p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-full transition-colors"
                        title="Fechar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-8 lg:px-16 pb-20 custom-scrollbar">

                    {/* ==================================== */}
                    {/* TAB: CONFIGURAÇÕES */}
                    {/* ==================================== */}
                    {activeSettingsTab === 'configuracoes' && (
                        <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-10 tracking-tight">
                                Configurações do Espaço de trabalho
                            </h1>

                            <section className="mb-12">
                                <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-zinc-800 pb-3 mb-8">
                                    Geral
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-center mb-8">
                                    <span className="text-sm font-bold text-gray-600 dark:text-zinc-400">Avatar</span>
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-md ${selectedColor || 'bg-amber-400'}`}>
                                            <Building2 size={32} className="text-white" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 md:gap-8 items-center">
                                    <span className="text-sm font-bold text-gray-600 dark:text-zinc-400">Nome</span>
                                    <input
                                        type="text"
                                        value={editWsName}
                                        onChange={(e) => setEditWsName(e.target.value)}
                                        className="w-full max-w-md bg-white dark:bg-[#111114] border border-gray-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
                                    />
                                </div>
                            </section>

                            <section>
                                <div className="flex items-center gap-3 border-b border-gray-200 dark:border-zinc-800 pb-3 mb-8">
                                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">Marca personalizada</h2>
                                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest shadow-sm">
                                        Premium
                                    </span>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-6 border-t border-gray-100 dark:border-zinc-800/80">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">Esquema de cor</span>
                                        <div className="flex flex-wrap gap-3">
                                            {themeColors.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => { playUISound('tap'); setSelectedColor(color); }}
                                                    className={`w-8 h-8 rounded-full transition-transform ios-btn ${color} ${selectedColor === color ? 'ring-2 ring-offset-4 ring-gray-400 dark:ring-offset-[#0a0a0c] scale-110' : 'hover:scale-110'}`}
                                                    title={color}
                                                >
                                                    {selectedColor === color && <Check size={16} className="text-white mx-auto drop-shadow-md" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="mt-12 pt-6 border-t border-gray-200 dark:border-zinc-800">
                                <label className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <AlertTriangle size={14} /> Zona de Perigo
                                </label>
                                <button
                                    onClick={handleDelete}
                                    className="ios-btn w-full md:w-auto px-6 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors flex justify-between items-center gap-3"
                                >
                                    Excluir Workspace Permanentemente
                                    <LogOut size={16} />
                                </button>
                            </div>

                            <div className="mt-12 flex justify-end">
                                <button
                                    onClick={saveSettings}
                                    disabled={savingConfig || !editWsName.trim()}
                                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-500/20 transition-all ios-btn"
                                >
                                    {savingConfig ? 'Aguarde...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ==================================== */}
                    {/* TAB: PESSOAS */}
                    {/* ==================================== */}
                    {activeSettingsTab === 'pessoas' && (
                        <div className="max-w-5xl mx-auto animate-in fade-in duration-300">

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Gerenciar pessoas</h1>
                                    <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mt-2">Gira o acesso e as permissões do seu espaço de trabalho.</p>
                                </div>
                                <button onClick={() => playUISound('open')} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-xl shadow-indigo-500/20 transition-all ios-btn">
                                    <Plus size={18} /> Convidar pessoas
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                                <div className="relative w-full sm:w-96">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Pesquisar por e-mail ou nome..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white dark:bg-[#111114] border border-gray-300 dark:border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="flex items-center gap-6 w-full sm:w-auto text-sm">
                                    <button className="font-bold text-indigo-600 border-b-2 border-indigo-600 pb-1">Todos ({members.length})</button>
                                    <button className="font-bold text-gray-500 hover:text-gray-900 dark:text-zinc-500 dark:hover:text-zinc-300 pb-1">Convites Pendentes ({invites.length})</button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden mb-8">
                                <div className="overflow-x-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/50">
                                                <th className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Usuário</th>
                                                <th className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">E-mail</th>
                                                <th className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Função</th>
                                                <th className="px-6 py-5 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Status / Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">

                                            {/* Linha de Convite */}
                                            <tr className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 transition-colors p-2">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                                                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-indigo-300 dark:border-indigo-500/50 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10">
                                                            <Plus size={16} />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            value={inviteEmail}
                                                            onChange={(e) => setInviteEmail(e.target.value)}
                                                            placeholder="Convidar via email..."
                                                            className="bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 text-sm font-medium w-full"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-xs text-gray-400 uppercase tracking-widest">(Novo)</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative w-40">
                                                        <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full text-sm font-bold rounded-xl pl-4 pr-10 py-2.5 appearance-none cursor-pointer border focus:outline-none transition-colors bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-[#111114] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                                                            <option value="editor">Editor</option>
                                                            <option value="viewer">Visualizador</option>
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button onClick={handleCreateInviteByEmail} className="ios-btn px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors">
                                                        Convidar
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Lista de Membros Existentes */}
                                            {loadingMembers ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-sm font-bold text-gray-500">Buscando na base de dados...</td></tr>
                                            ) : (
                                                filteredMembers.map((m) => (
                                                    <tr key={m.id_usuario} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0 bg-indigo-600">
                                                                    {m.perfis?.full_name ? m.perfis?.full_name.substring(0, 2).toUpperCase() : 'US'}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                                                        {m.perfis?.full_name || 'Usuário Ekko'}
                                                                    </span>
                                                                    {m.perfis?.email === currentUser?.email && (
                                                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">Você</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                                                            {m.perfis?.email}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="relative w-40">
                                                                <select
                                                                    defaultValue={m.papel}
                                                                    disabled={m.id_usuario === workspace.id_proprietario || m.perfis?.email === currentUser?.email}
                                                                    className={`w-full text-sm font-bold rounded-xl pl-4 pr-10 py-2.5 appearance-none cursor-pointer border focus:outline-none transition-colors ${m.id_usuario === workspace.id_proprietario ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-400' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-[#111114] dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'}`}
                                                                >
                                                                    {m.id_usuario === workspace.id_proprietario && <option value="admin">Proprietário</option>}
                                                                    <option value="admin">Administrador</option>
                                                                    <option value="editor">Editor</option>
                                                                    <option value="viewer">Membro</option>
                                                                </select>
                                                                {!(m.id_usuario === workspace.id_proprietario || m.perfis?.email === currentUser?.email) && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm font-medium text-gray-600 dark:text-zinc-400">Ativo</span>
                                                                {m.perfis?.email !== currentUser?.email && m.id_usuario !== workspace.id_proprietario && (
                                                                    <button
                                                                        onClick={() => handleRemoveMember(m.id_usuario)}
                                                                        className="ios-btn p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                                        title="Remover Acesso"
                                                                    >
                                                                        <LogOut size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}

                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ==================================== */}
                    {/* TAB: SEGURANÇA E PERMISSÕES */}
                    {/* ==================================== */}
                    {activeSettingsTab === 'seguranca' && (
                        <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                                Segurança e Permissões
                            </h1>
                            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-10">Controle a autenticação global e as restrições do seu espaço de trabalho.</p>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between bg-white dark:bg-[#111114] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                            <Smartphone size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Autenticação de Dois Fatores (2FA)</h3>
                                            <p className="text-sm text-gray-500 dark:text-zinc-400">Exigir que todos os membros do workspace ativem o 2FA nas suas contas.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer ios-btn shrink-0">
                                        <input type="checkbox" className="sr-only peer" onChange={() => playUISound('tap')} />
                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div className="flex items-center justify-between bg-white dark:bg-[#111114] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                            <Lock size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">Restringir Convites Externos</h3>
                                            <p className="text-sm text-gray-500 dark:text-zinc-400">Apenas proprietários e administradores podem adicionar novas pessoas.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer ios-btn shrink-0">
                                        <input type="checkbox" className="sr-only peer" defaultChecked onChange={() => playUISound('tap')} />
                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================================== */}
                    {/* TAB: INTEGRAÇÕES */}
                    {/* ==================================== */}
                    {activeSettingsTab === 'integracoes' && (
                        <div className="max-w-5xl mx-auto animate-in fade-in duration-300">
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                                Integrações e Aplicativos
                            </h1>
                            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-10">Conecte o seu workspace às ferramentas que já utiliza diariamente.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                            <Slack size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Slack</h3>
                                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
                                            Receba notificações de tarefas e mensagens diretamente nos seus canais do Slack.
                                        </p>
                                    </div>
                                    <button onClick={() => playUISound('success')} className="ios-btn w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl transition-colors">
                                        Conectar
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-blue-500 dark:bg-zinc-800 flex items-center justify-center mb-4">
                                            <Trello size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Trello</h3>
                                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
                                            Importe os seus quadros e cartões antigos diretamente para o fluxo de tarefas.
                                        </p>
                                    </div>
                                    <button onClick={() => playUISound('success')} className="ios-btn w-full py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl transition-colors">
                                        Conectar
                                    </button>
                                </div>

                                <div className="bg-white dark:bg-[#111114] p-6 rounded-3xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">Ativo</div>
                                    <div>
                                        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white dark:bg-zinc-800 flex items-center justify-center mb-4">
                                            <Github size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">GitHub</h3>
                                        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 leading-relaxed">
                                            Sincronize commits e pull requests com as tarefas de desenvolvimento.
                                        </p>
                                    </div>
                                    <button onClick={() => playUISound('tap')} className="ios-btn w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20 text-sm font-bold rounded-xl transition-colors">
                                        <Check size={16} /> Conectado
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
