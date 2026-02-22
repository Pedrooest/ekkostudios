import React, { useState, useEffect } from 'react';
import { Workspace, WorkspaceMember, Invite } from './types';
import { DatabaseService } from './DatabaseService';
import { Settings, X, Users, UserPlus, Link as LinkIcon, Trash2, Shield, Eye, EyeOff, AlertTriangle, ChevronDown, Mail, Clock } from 'lucide-react';

interface WorkspaceSettingsModalProps {
    workspace: Workspace;
    onClose: () => void;
    currentUserEmail?: string;
    onWorkspaceDeleted?: () => void;
}

export function WorkspaceSettingsModal({ workspace, onClose, currentUserEmail, onWorkspaceDeleted }: WorkspaceSettingsModalProps) {
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteRole, setInviteRole] = useState('editor');
    const [generatedLink, setGeneratedLink] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [workspace.id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [m, i] = await Promise.all([
                DatabaseService.getWorkspaceMembers(workspace.id),
                DatabaseService.getWorkspaceInvites(workspace.id)
            ]);
            setMembers(m as any);
            setInvites(i as any);
        } catch (e) {
            console.error(e);
            setError('Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvite = async () => {
        try {
            const invite = await DatabaseService.createInvite(workspace.id, inviteRole);
            setInvites(prev => [invite, ...prev]);
            const link = `${window.location.origin}?invite=${invite.token}`;
            setGeneratedLink(link);
        } catch (e) {
            console.error(e);
            setError('Erro ao criar convite.');
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(generatedLink);
        alert('Link copiado!');
    };

    const currentUserMember = members.find(m => m.profiles?.email === currentUserEmail);
    const isAdmin = currentUserMember?.role === 'admin';

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Tem certeza que deseja remover este membro?')) return;
        try {
            await DatabaseService.removeMember(workspace.id, userId);
            setMembers(prev => prev.filter(m => m.user_id !== userId));
        } catch (e) {
            console.error(e);
            alert('Erro ao remover membro.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade p-4">
            <div className="relative w-full max-w-2xl bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-[#0a0a0c] flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight uppercase">Gerir Membros</h2>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">WORKSPACE: {workspace.name.toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-200 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-8 text-gray-900 dark:text-zinc-300">
                    {/* MEMBERS SECTION */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users size={14} className="text-indigo-500" /> Membros Ativos ({members.length})
                        </h3>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500 text-xs uppercase font-bold bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-zinc-800">
                                    Carregando membros...
                                </div>
                            ) : (
                                members.map(member => (
                                    <div key={member.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-transparent hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors gap-4 group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center text-sm font-bold shrink-0 border border-black/5 dark:border-white/5">
                                                {member.profiles?.full_name?.substring(0, 2).toUpperCase() || 'US'}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-zinc-200 leading-none">{member.profiles?.full_name || 'Usuário'}</span>
                                                    {member.profiles?.email === currentUserEmail && <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white leading-none">Você</span>}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-zinc-500 mt-1 leading-none">{member.profiles?.email}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className={`text-sm font-medium ${member.profiles?.email === currentUserEmail ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-zinc-400'}`}>
                                                {member.role === 'admin' ? 'Administrador' : member.role === 'editor' ? 'Editor' : 'Visualizador'}
                                            </span>
                                            {isAdmin && member.profiles?.email !== currentUserEmail && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.user_id)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remover Acesso"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>

                    {/* INVITE SECTION */}
                    <section>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <LinkIcon size={14} className="text-emerald-500" /> Convidar Novo Membro
                        </h3>

                        <div className="bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 rounded-2xl p-5">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={16} />
                                    <input
                                        type="email"
                                        placeholder="Email do colaborador..."
                                        className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-zinc-600 shadow-sm"
                                    />
                                </div>
                                <div className="sm:w-40 relative shrink-0">
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-medium rounded-xl pl-4 pr-10 py-3 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors appearance-none cursor-pointer shadow-sm"
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Visualizador</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                                <button
                                    onClick={handleCreateInvite}
                                    className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 shrink-0"
                                >
                                    <LinkIcon size={16} /> Gerar Link
                                </button>
                            </div>

                            {generatedLink && (
                                <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Link Gerado</span>
                                        <button onClick={copyLink} className="text-emerald-400 hover:text-white transition-colors text-xs font-bold uppercase flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20">
                                            Copiar Link
                                        </button>
                                    </div>
                                    <div className="bg-white dark:bg-zinc-900 rounded-lg px-4 py-3 text-xs text-gray-600 dark:text-zinc-300 font-mono break-all border border-gray-200 dark:border-zinc-800 select-all">
                                        {generatedLink}
                                    </div>
                                </div>
                            )}

                            <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium mt-3">
                                Ao gerar o link, envie-o para o colaborador. O acesso será concedido automaticamente ao entrar.
                            </p>
                        </div>
                    </section>

                    {/* PENDING INVITES */}
                    {invites.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock size={14} className="text-amber-500" /> Convites Pendentes ({invites.length})
                            </h3>
                            <div className="space-y-2">
                                {invites.map(inv => (
                                    <div key={inv.id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-zinc-800/50 bg-white dark:bg-[#111114] transition-colors">
                                        <div className="flex element-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                                                <UserPlus size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700 dark:text-zinc-300 leading-none mb-1">Convite {inv.role}</span>
                                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 leading-none">Válido até {new Date(inv.expires_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button className="px-3 py-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg text-xs font-bold transition-colors">
                                            Cancelar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* DANGER ZONE */}
                    {isAdmin && (
                        <section className="pt-6 border-t border-gray-200 dark:border-zinc-800">
                            <h3 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <AlertTriangle size={14} /> Zona de Perigo
                            </h3>
                            <div className="bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-5">
                                <p className="text-xs text-gray-600 dark:text-zinc-400 mb-4">
                                    A exclusão do workspace é irreversível. Todos os dados serão removidos.
                                </p>
                                <button
                                    onClick={async () => {
                                        const confirmName = window.prompt(`Digite "${workspace.name}" para confirmar:`);
                                        if (confirmName !== workspace.name) return;
                                        try {
                                            await DatabaseService.deleteWorkspace(workspace.id);
                                            onWorkspaceDeleted?.();
                                        } catch (e: any) {
                                            alert('Erro: ' + (e.message || e));
                                        }
                                    }}
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20"
                                >
                                    Excluir Workspace Permanentemente
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
