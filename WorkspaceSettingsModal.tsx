import React, { useState, useEffect } from 'react';
import { Workspace, WorkspaceMember, Invite } from './types';
import { DatabaseService } from './DatabaseService';

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
            // Generate Link
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade">
            <div className="bg-[#0F172A] border border-white/10 w-[600px] max-h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#111827]">
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight">Gerenciar Workspace</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{workspace.name}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                        <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                    {/* MEMBERS SECTION */}
                    <section>
                        <h3 className="text-xs font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-users"></i> Membros Ativos
                        </h3>
                        <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
                            {loading ? (
                                <div className="p-4 text-center text-gray-500 text-xs uppercase font-bold">Carregando...</div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {members.map(member => (
                                        <div key={member.user_id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white uppercase">
                                                    {member.profiles?.full_name?.substring(0, 2) || 'US'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white flex items-center gap-2">
                                                        {member.profiles?.full_name || 'Usuário'}
                                                        {member.profiles?.email === currentUserEmail && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider">Você</span>}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500">{member.profiles?.email}</p>
                                                    <p className="text-[9px] text-gray-600 mt-0.5">Entrou: {new Date(member.joined_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${member.role === 'admin' ? 'bg-purple-500/10 text-purple-500' :
                                                    member.role === 'editor' ? 'bg-blue-500/10 text-blue-500' :
                                                        'bg-gray-500/10 text-gray-500'
                                                    }`}>
                                                    {member.role}
                                                </span>

                                                {isAdmin && member.profiles?.email !== currentUserEmail && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        className="w-6 h-6 rounded bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                                        title="Remover Membro"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* INVITE SECTION */}
                    <section>
                        <h3 className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i className="fa-solid fa-user-plus"></i> Convidar Membro
                        </h3>
                        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 space-y-4">
                            <div className="flex gap-3">
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="bg-[#0B0F19] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    <option value="viewer">Visualizador</option>
                                    <option value="editor">Editor</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button
                                    onClick={handleCreateInvite}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wide rounded-xl py-2 transition-all"
                                >
                                    Gerar Link de Convite
                                </button>
                            </div>

                            {generatedLink && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-3 animate-fade">
                                    <div className="flex-1 bg-[#0B0F19] rounded px-3 py-1.5 text-xs text-emerald-400 font-mono truncate">
                                        {generatedLink}
                                    </div>
                                    <button onClick={copyLink} className="text-emerald-500 hover:text-white transition-all">
                                        <i className="fa-regular fa-copy"></i>
                                    </button>
                                </div>
                            )}

                            {invites.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/5">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Convites Pendentes</p>
                                    <div className="space-y-2">
                                        {invites.map(inv => (
                                            <div key={inv.id} className="flex justify-between items-center text-xs text-gray-400 bg-white/5 px-3 py-2 rounded-lg">
                                                <span>Função: <strong className="text-white uppercase">{inv.role}</strong></span>
                                                <span>Expira em: {new Date(inv.expires_at).toLocaleDateString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* DANGER ZONE */}
                    {isAdmin && (
                        <section className="pt-4 border-t border-white/5">
                            <h3 className="text-xs font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i className="fa-solid fa-triangle-exclamation"></i> Zona de Perigo
                            </h3>
                            <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5">
                                <p className="text-xs text-gray-400 mb-4">
                                    A exclusão do workspace é permanente e removerá todos os dados associados (clientes, tarefas, etc.).
                                </p>
                                <button
                                    onClick={async () => {
                                        const confirmName = window.prompt(`Para confirmar, digite o nome do workspace: "${workspace.name}"`);
                                        if (confirmName !== workspace.name) {
                                            if (confirmName) alert('Nome incorreto.');
                                            return;
                                        }

                                        try {
                                            await DatabaseService.deleteWorkspace(workspace.id);
                                            alert('Workspace excluído com sucesso.');
                                            onWorkspaceDeleted?.();
                                        } catch (e: any) {
                                            console.error(e);
                                            alert('Erro ao excluir workspace: ' + (e.message || e));
                                        }
                                    }}
                                    className="w-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-wide rounded-xl py-3 transition-all flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-trash-can"></i> Excluir Workspace Permanentemente
                                </button>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
