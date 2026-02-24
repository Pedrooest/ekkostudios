import React, { useState, useEffect } from 'react';
import { Workspace, MembroWorkspace, Convite } from './types';
import { DatabaseService } from './DatabaseService';
import { X, Users, Link as LinkIcon, LogOut, Mail, Clock, Shield, ChevronDown } from 'lucide-react';
import { playUISound } from './utils/uiSounds';


interface WorkspaceMembersModalProps {
    workspace: Workspace;
    onClose: () => void;
    currentUserEmail?: string;
}

export function WorkspaceMembersModal({ workspace, onClose, currentUserEmail }: WorkspaceMembersModalProps) {
    const [members, setMembers] = useState<MembroWorkspace[]>([]);
    const [invites, setInvites] = useState<Convite[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteRole, setInviteRole] = useState('editor');
    const [error, setError] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');

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
            playUISound('success');
            setInvites(prev => [invite, ...prev]);
            const link = `${window.location.origin}?invite=${invite.token}`;
            navigator.clipboard.writeText(link);
            alert('Link de convite criado e copiado!');
            setInviteEmail('');
        } catch (e) {
            console.error(e);
            setError('Erro ao criar convite.');
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


    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity animate-in fade-in" onClick={() => { playUISound('close'); onClose(); }}></div>

            <div className="relative w-full max-w-2xl bg-white/95 dark:bg-[#111114]/95 backdrop-blur-2xl border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-ios-spring">


                <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-start shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight uppercase">Gerir Membros</h2>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">{workspace.nome}</p>
                    </div>
                    <button onClick={() => { playUISound('close'); onClose(); }} className="ios-btn p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 rounded-full bg-gray-50 dark:bg-zinc-900">
                        <X size={20} />
                    </button>
                </div>


                <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar bg-white dark:bg-[#111114]">
                    <section>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users size={14} className="text-indigo-500" /> Membros Ativos ({members.length})
                        </h3>
                        <div className="space-y-1">
                            {loading ? (
                                <div className="p-8 text-center text-gray-500">Carregando membros...</div>
                            ) : (
                                members.map(member => (
                                    <div key={member.id_usuario} className="ios-btn flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center text-sm font-bold shrink-0 border border-black/5 dark:border-white/5">
                                                {member.perfis?.full_name?.substring(0, 2).toUpperCase() || 'US'}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-zinc-200 leading-none">{member.perfis?.full_name}</span>
                                                    {member.perfis?.email === currentUserEmail && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white leading-none">Você</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-zinc-500 mt-1 leading-none">{member.perfis?.email}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {member.papel?.toUpperCase()}
                                            {member.perfis?.email !== currentUserEmail && (
                                                <button
                                                    onClick={() => handleRemoveMember(member.id_usuario)}
                                                    className="ios-btn p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remover Acesso"
                                                >
                                                    <LogOut size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                ))
                            )}
                        </div>
                    </section>

                    <div className="w-full h-px bg-gray-100 dark:bg-zinc-800/80"></div>

                    <section>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <LinkIcon size={14} className="text-emerald-500" /> Convidar Novo Membro
                        </h3>
                        <div className="bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-800 rounded-[1.5rem] p-5">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={18} />
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="Email do colaborador..."
                                        className="w-full h-12 bg-white dark:bg-[#111114] border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm font-medium rounded-xl pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow placeholder-gray-400 dark:placeholder-zinc-500"
                                    />
                                </div>
                                <div className="sm:w-40 relative shrink-0">
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => { playUISound('tap'); setInviteRole(e.target.value); }}
                                        className="ios-btn w-full h-12 bg-white dark:bg-[#111114] border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-medium rounded-xl pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow appearance-none cursor-pointer"
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="viewer">Visualizador</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 pointer-events-none" />
                                </div>
                                <button
                                    onClick={handleCreateInvite}
                                    className="ios-btn h-12 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 shrink-0"
                                >
                                    <LinkIcon size={16} /> Gerar Link
                                </button>
                            </div>
                        </div>

                    </section>

                    {invites.length > 0 && (
                        <section>
                            <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock size={14} className="text-amber-500" /> Convites Pendentes ({invites.length})
                            </h3>
                            <div className="space-y-2">
                                {invites.map(invite => (
                                    <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 border-dashed dark:border-zinc-800/80 bg-white/50 dark:bg-[#111114]/50 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 flex items-center justify-center shrink-0">
                                                <Clock size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-700 dark:text-zinc-300 leading-none mb-1">
                                                    Link Ativo ({invite.papel})
                                                </span>
                                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 leading-none">
                                                    Expira em: {new Date(invite.expira_em).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const link = `${window.location.origin}?invite=${invite.token}`;
                                                playUISound('tap');
                                                navigator.clipboard.writeText(link);
                                                alert('Link copiado!');
                                            }}
                                            className="ios-btn px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                                        >
                                            Copiar Link
                                        </button>

                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

        </div>
    );
}

