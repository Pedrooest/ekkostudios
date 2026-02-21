import React, { useState, useEffect, useRef } from 'react';
import {
    Building2, ChevronDown, Users, Plus, Check, X,
    Link as LinkIcon, Shield, Mail, Clock, Trash2,
    Moon, Sun, Settings, LogOut, Search
} from 'lucide-react';

export default function WorkspaceManager() {
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Estados de UI
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Ref para fechar dropdown ao clicar fora
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Mock Data
    const [activeWorkspace] = useState("Meu Workspace");
    const [members] = useState([
        { id: 1, name: 'Pedro Henrique', email: 'pegabriel2012@gmail.com', role: 'ADMIN', isMe: true, initials: 'PE', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' },
        { id: 2, name: 'Lucas Silva', email: 'lucas.silva@ekko.com', role: 'EDITOR', isMe: false, initials: 'LS', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' },
        { id: 3, name: 'Ana Costa', email: 'ana.costa@ekko.com', role: 'VISUALIZADOR', isMe: false, initials: 'AC', color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' },
    ]);

    const [pendingInvites] = useState([
        { id: 1, email: 'novo.designer@ekko.com', role: 'EDITOR', date: 'Há 2 dias' },
        { id: 2, email: 'cliente@fornoalenha.com', role: 'VISUALIZADOR', date: 'Hoje' }
    ]);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openManagerModal = () => {
        setIsDropdownOpen(false);
        setIsModalOpen(true);
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0a0c]' : 'bg-gray-50'}`}>

            {/* =========================================
          TOP BAR (Navegação Principal)
          ========================================= */}
            <div className="sticky top-0 z-40 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-zinc-800/80 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-md flex justify-between items-center transition-colors">

                {/* Esquerda: Seletor de Workspace */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 p-1.5 pr-3 rounded-xl border border-transparent hover:bg-gray-100 dark:hover:bg-zinc-900 hover:border-gray-200 dark:hover:border-zinc-800 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
                            ME
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest leading-none mb-0.5">Workspace</p>
                            <h2 className="text-sm font-black text-gray-900 dark:text-white leading-none">{activeWorkspace}</h2>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 dark:text-zinc-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Menu Dropdown do Workspace */}
                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl dark:shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">

                            <div className="p-2">
                                <button
                                    onClick={openManagerModal}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/80 text-gray-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-bold group"
                                >
                                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                                        <Users size={16} />
                                    </div>
                                    Gerir Membros
                                </button>
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/80 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-bold group mt-1">
                                    <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 transition-colors">
                                        <Settings size={16} />
                                    </div>
                                    Configurações do Workspace
                                </button>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-zinc-800/80 w-full"></div>

                            <div className="p-2">
                                <p className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Meus Workspaces</p>
                                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm font-bold">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-indigo-200 dark:bg-indigo-500/20 flex items-center justify-center text-[10px]">ME</div>
                                        Meu Workspace
                                    </div>
                                    <Check size={16} />
                                </button>
                                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/80 text-gray-700 dark:text-zinc-300 text-sm font-bold mt-1 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-[10px]">CL</div>
                                        Cliente: Nike
                                    </div>
                                </button>
                            </div>

                            <div className="h-px bg-gray-100 dark:bg-zinc-800/80 w-full"></div>

                            <div className="p-2">
                                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/80 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-bold">
                                    <Plus size={16} className="text-gray-400 dark:text-zinc-500" />
                                    Novo Workspace
                                </button>
                            </div>

                        </div>
                    )}
                </div>

                {/* Direita: Outros Botões (Apenas Ilustrativos + Theme Toggle) */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors shadow-sm dark:shadow-none">
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 hidden sm:block"></div>
                    <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:border-zinc-700 rounded-lg text-xs font-bold transition-colors shadow-sm dark:shadow-none">
                        <Search size={14} /> BUSCAR
                    </button>
                </div>
            </div>

            {/* BACKGROUND (Apenas para preencher o ecrã) */}
            <div className="p-8 max-w-7xl mx-auto opacity-30 flex flex-col items-center justify-center h-[calc(100vh-80px)] pointer-events-none">
                <Building2 size={64} className="text-gray-300 dark:text-zinc-800 mb-4" />
                <h2 className="text-2xl font-black text-gray-300 dark:text-zinc-800">Painel Consolidado</h2>
                <p className="text-gray-400 dark:text-zinc-600 font-medium">Abra o menu no canto superior esquerdo para gerir membros.</p>
            </div>


            {/* =========================================
          MODAL: GERIR WORKSPACE / MEMBROS
          ========================================= */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">

                    {/* Overlay Escuro com Blur */}
                    <div
                        className="absolute inset-0 bg-gray-900/40 dark:bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
                        onClick={() => setIsModalOpen(false)}
                    ></div>

                    {/* Janela do Modal */}
                    <div className="relative w-full max-w-2xl bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300 overflow-hidden">

                        {/* Header do Modal */}
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-[#0a0a0c]/50 flex justify-between items-start shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-tight">Gerir Membros</h2>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">{activeWorkspace}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Corpo do Modal (Scrollável) */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-white dark:bg-[#111114]">

                            {/* Secção 1: Membros Ativos */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Shield size={14} className="text-indigo-500" /> Membros Ativos ({members.length})
                                </h3>

                                <div className="space-y-3">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-zinc-800/80 bg-white dark:bg-[#151518] hover:border-gray-300 dark:hover:border-zinc-700 transition-colors group">

                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${member.color}`}>
                                                    {member.initials}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-zinc-200 leading-none">{member.name}</span>
                                                        {member.isMe && (
                                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-indigo-600 text-white leading-none">Você</span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 dark:text-zinc-500 mt-1 leading-none">{member.email}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {/* Selector de Cargo (Desativado se for "Você" e for Admin, por exemplo) */}
                                                <select
                                                    disabled={member.isMe}
                                                    defaultValue={member.role}
                                                    className="bg-gray-50 dark:bg-zinc-900 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="EDITOR">Editor</option>
                                                    <option value="VISUALIZADOR">Visualizador</option>
                                                </select>

                                                {!member.isMe && (
                                                    <button className="p-1.5 text-gray-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                                        <LogOut size={16} />
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Linha Divisória */}
                            <div className="w-full h-px bg-gray-100 dark:bg-zinc-800"></div>

                            {/* Secção 2: Convidar Membro */}
                            <section>
                                <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Mail size={14} className="text-emerald-500" /> Convidar Novo Membro
                                </h3>

                                <div className="bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5">
                                    <div className="flex flex-col sm:flex-row gap-3">

                                        <div className="flex-1 relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={16} />
                                            <input
                                                type="email"
                                                placeholder="E-mail do colaborador..."
                                                className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-zinc-600"
                                            />
                                        </div>

                                        <div className="sm:w-40 relative shrink-0">
                                            <select className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-bold rounded-xl pl-4 pr-8 py-2.5 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors appearance-none cursor-pointer">
                                                <option value="EDITOR">Editor</option>
                                                <option value="ADMIN">Admin</option>
                                                <option value="VISUALIZADOR">Visualizador</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none" />
                                        </div>

                                        <button className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 shrink-0">
                                            <LinkIcon size={16} />
                                            Gerar Link
                                        </button>

                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium mt-3">
                                        Ao gerar o link, este e-mail receberá automaticamente acesso ao painel com as permissões definidas.
                                    </p>
                                </div>
                            </section>

                            {/* Secção 3: Convites Pendentes */}
                            {pendingInvites.length > 0 && (
                                <section>
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Clock size={14} className="text-amber-500" /> Convites Pendentes ({pendingInvites.length})
                                    </h3>

                                    <div className="space-y-2">
                                        {pendingInvites.map(invite => (
                                            <div key={invite.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 border-dashed dark:border-zinc-800/80 bg-white/50 dark:bg-[#111114]/50 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500 flex items-center justify-center shrink-0">
                                                        <Clock size={14} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-700 dark:text-zinc-300 leading-none mb-1">{invite.email}</span>
                                                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 leading-none">
                                                            Enviado {invite.date} • Papel: {invite.role}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button className="px-3 py-1.5 bg-gray-100 hover:bg-rose-50 text-gray-600 hover:text-rose-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                                                    <X size={12} /> Cancelar
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* CSS do Scroll */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #9ca3af; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
      `}} />

        </div>
    );
}
