import React, { useState, useRef, useEffect } from 'react';
import { Workspace } from './types';
import { BottomSheet } from './components/BottomSheet';
import { PortalPopover } from './components/PortalPopover';
import { ChevronDown, Users, Settings, Plus, X, Check, Search } from 'lucide-react';

interface WorkspaceSelectorProps {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    onSelect: (workspace: Workspace) => void;
    onCreate: (name: string) => void;
    onManageMembers: () => void;
    loading: boolean;
}

export function WorkspaceSelector({ workspaces, currentWorkspace, onSelect, onCreate, onManageMembers, loading }: WorkspaceSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleOpen = () => setIsOpen(!isOpen);

    const Trigger = (
        <button
            ref={buttonRef}
            onClick={toggleOpen}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl border border-transparent hover:bg-gray-100 dark:hover:bg-zinc-900 transition-all focus:outline-none group"
        >
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-xs tracking-wider shrink-0 transition-transform group-active:scale-95">
                {currentWorkspace?.name?.substring(0, 2).toUpperCase() || 'EK'}
            </div>
            <div className="text-left hidden sm:block">
                <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest leading-none mb-0.5">Workspace</p>
                <h2 className="text-sm font-black text-gray-900 dark:text-white leading-none truncate max-w-[140px]">
                    {currentWorkspace?.name || 'Carregando...'}
                </h2>
            </div>
            <ChevronDown size={16} className={`text-gray-400 dark:text-zinc-500 transition-transform duration-300 ml-auto sm:ml-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );

    const DropdownContent = () => (
        <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col py-2 overflow-hidden">

            {/* Cabeçalho de Identificação (Apenas visual, sem clique e sem repetição) */}
            <div className="px-4 py-2 mb-1 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                    {currentWorkspace?.name?.substring(0, 2).toUpperCase() || 'EK'}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {currentWorkspace?.name || 'Meu Workspace'}
                    </span>
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
                        Ativo Agora
                    </span>
                </div>
            </div>

            {/* Opções de Gestão do Workspace Atual */}
            <div className="px-2 space-y-1">
                <button
                    onClick={() => { onManageMembers(); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium group"
                >
                    <Users size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    Gerenciar Membros
                </button>
                <button
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium group text-left"
                >
                    <Settings size={16} className="text-gray-400 dark:text-zinc-500 transition-colors" />
                    Configurações do Workspace
                </button>
            </div>

            <div className="h-px bg-gray-100 dark:bg-zinc-800 w-full my-2"></div>

            {/* Lista de OUTROS Workspaces (Sem repetir o principal) */}
            <div className="px-2">
                <p className="px-3 pb-2 pt-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                    Outros Workspaces
                </p>
                <div className="space-y-1 max-h-[30vh] overflow-y-auto custom-scrollbar">
                    {workspaces.filter(ws => ws.id !== currentWorkspace?.id).map(ws => (
                        <button
                            key={ws.id}
                            onClick={() => { onSelect(ws); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium text-left"
                        >
                            <div className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-gray-500 text-[10px]">
                                {ws.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate flex-1">{ws.name}</span>
                            {ws.name.toLowerCase().includes('cliente') && <Search size={14} className="text-gray-400 dark:text-zinc-500 shrink-0" />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-zinc-800 w-full my-2"></div>

            {/* Ação Adicional */}
            <div className="px-2">
                <button
                    onClick={() => {
                        const name = prompt('Nome do novo workspace:');
                        if (name) onCreate(name);
                        setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium text-left"
                >
                    <Plus size={16} className="text-gray-400 dark:text-zinc-500" />
                    Novo Workspace
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative w-full lg:w-auto min-w-0">
            {Trigger}

            {/* Mobile BottomSheet */}
            <BottomSheet
                isOpen={isOpen && isMobile}
                onClose={() => setIsOpen(false)}
                title="Opções do Workspace"
            >
                <div className="bg-white dark:bg-[#111114] rounded-t-2xl overflow-hidden pb-safe">
                    <DropdownContent />
                </div>
            </BottomSheet>

            {/* Desktop Popover */}
            <PortalPopover
                isOpen={isOpen && !isMobile}
                onClose={() => setIsOpen(false)}
                triggerRef={buttonRef}
                className="w-[280px]"
                align="start"
            >
                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl flex flex-col py-2 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto">

                    {/* Cabeçalho de Identificação (Apenas visual, sem clique e sem repetição) */}
                    <div className="px-4 py-2 mb-1 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                            {currentWorkspace?.name?.substring(0, 2).toUpperCase() || 'EK'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                                {currentWorkspace?.name || 'Meu Workspace'}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
                                Ativo Agora
                            </span>
                        </div>
                    </div>

                    {/* Opções de Gestão do Workspace Atual */}
                    <div className="px-2 space-y-1">
                        <button
                            onClick={() => { onManageMembers(); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm font-medium group"
                        >
                            <Users size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                            Gerir Membros
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium group text-left"
                        >
                            <Settings size={16} className="text-gray-400 dark:text-zinc-500 transition-colors" />
                            Configurações do Workspace
                        </button>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-zinc-800 w-full my-2"></div>

                    {/* Lista de OUTROS Workspaces (Sem repetir o principal) */}
                    <div className="px-2">
                        <p className="px-3 pb-2 pt-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                            Outros Workspaces
                        </p>
                        <div className="space-y-1">
                            {workspaces.filter(ws => ws.id !== currentWorkspace?.id).map(ws => (
                                <button
                                    key={ws.id}
                                    onClick={() => { onSelect(ws); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium text-left"
                                >
                                    <div className="w-6 h-6 rounded bg-gray-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-gray-500 text-[10px]">
                                        {ws.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="truncate flex-1">{ws.name}</span>
                                    {ws.name.toLowerCase().includes('cliente') && <Search size={14} className="text-gray-400 dark:text-zinc-500 shrink-0" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-zinc-800 w-full my-2"></div>

                    {/* Ação Adicional */}
                    <div className="px-2">
                        <button
                            onClick={() => {
                                const name = prompt('Nome do novo workspace:');
                                if (name) onCreate(name);
                                setIsOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium text-left"
                        >
                            <Plus size={16} className="text-gray-400 dark:text-zinc-500" />
                            Novo Workspace
                        </button>
                    </div>

                </div>
            </PortalPopover>
        </div>
    );
}
