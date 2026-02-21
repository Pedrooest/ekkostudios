import React, { useState, useEffect } from 'react';
import { Workspace, WorkspaceMember, Invite } from './types';
import { DatabaseService } from './DatabaseService';
import { Settings, X, Users, UserPlus, Link, Trash2, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';

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
        // RESPONSIVE MODAL CONTAINER
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade p-4">
            <div className="bg-[#0F172A] border border-white/10 w-full max-w-[600px] max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#111827]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/40">
                            <Settings size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight leading-tight">Configurações</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Workspace: {workspace.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all active:scale-95">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-6 md:space-y-8">

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
                                        <div key={member.user_id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/5 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-sm font-bold text-white uppercase shrink-0">
                                                    {member.profiles?.full_name?.substring(0, 2) || 'US'}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-sm font-bold text-white flex items-center gap-2 truncate">
                                                        {member.profiles?.full_name || 'Usuário'}
                                                        {member.profiles?.email === currentUserEmail && <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">Você</span>}
                                                    </p>
                                                    <p className="text-xs text-app-text-muted truncate">{member.profiles?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0">
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${member.role === 'admin' ? 'bg-purple-500/10 text-purple-500' :
                                                    member.role === 'editor' ? 'bg-blue-500/10 text-blue-500' :
                                                        'bg-gray-500/10 text-gray-500'
                                                    }`}>
                                                    {member.role}
                                                </span>

                                                {isAdmin && member.profiles?.email !== currentUserEmail && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all md:opacity-0 group-hover:opacity-100 active:scale-95"
                                                        title="Remover Membro"
                                                    >
                                                        <i className="fa-solid fa-trash-can text-xs"></i>
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
                        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5 md:p-6 space-y-6">

                            {/* Invite Form */}
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="w-full md:flex-1 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Função de Acesso</label>
                                    <select
                                        value={inviteRole}
                                        onChange={(e) => setInviteRole(e.target.value)}
                                        className="w-full bg-[#0B0F19] border border-white/10 text-white text-xs rounded-xl px-4 h-12 outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                                    >
                                        <option value="viewer">Visualizador (Somente Leitura)</option>
                                        <option value="editor">Editor (Pode Editar)</option>
                                        <option value="admin">Administrador (Controle Total)</option>
                                    </select>
                                    <p className="text-[9px] text-gray-500 px-1">Defina o nível de permissão do novo membro.</p>
                                </div>

                                <button
                                    onClick={handleCreateInvite}
                                    className="w-full md:w-auto px-8 h-12 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wide rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <i className="fa-solid fa-link"></i> Gerar Link
                                </button>
                            </div>

                            {/* Generated Link Result */}
                            {generatedLink && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3 animate-fade">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Link Gerado com Sucesso</span>
                                        <button onClick={copyLink} className="text-emerald-400 hover:text-white transition-colors text-xs font-black uppercase flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20">
                                            <i className="fa-regular fa-copy"></i> Copiar
                                        </button>
                                    </div>
                                    <div className="bg-[#0B0F19] rounded-lg px-4 py-3 text-xs text-gray-300 font-mono break-all border border-white/5 select-all">
                                        {generatedLink}
                                    </div>
                                    <p className="text-[9px] text-emerald-500/60 font-medium">Envie este link para o convidado. Ele expira em 24h.</p>
                                </div>
                            )}

                            {/* Pending Invites List */}
                            {invites.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Convites Pendentes ({invites.length})</p>
                                    </div>
                                    <div className="space-y-3 bg-black/20 rounded-xl p-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                                        {invites.map(inv => (
                                            <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded bg-gray-700/50 flex items-center justify-center text-gray-400 text-xs">
                                                        <i className="fa-solid fa-ticket"></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-300 uppercase">Função: <span className="text-white">{inv.role}</span></p>
                                                        <p className="text-[9px] text-gray-500">Expira: {new Date(inv.expires_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button className="text-[9px] font-bold text-rose-500/50 hover:text-rose-500 uppercase tracking-wider px-2 py-1 hover:bg-rose-500/10 rounded transition-all">
                                                    Cancelar
                                                </button>
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
