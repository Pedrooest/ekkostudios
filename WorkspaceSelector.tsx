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
        <div className="flex flex-col w-80 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
            <div className="flex justify-between items-center px-4 py-3.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-[#0a0a0c]">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <span className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Workspaces</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-md transition-colors">
                    <X size={16} />
                </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar overscroll-contain">
                {/* Active Workspace */}
                <div className="px-3 py-3 flex items-center justify-between mb-2 bg-gray-50 dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700/50">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                            {currentWorkspace?.name?.substring(0, 2).toUpperCase() || 'EK'}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
                                {currentWorkspace?.name}
                            </h3>
                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Ativo Agora</p>
                        </div>
                    </div>
                    <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                </div>

                {/* Actions */}
                <div className="space-y-1">
                    <button
                        onClick={() => { onManageMembers(); setIsOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium group"
                    >
                        <Users size={16} className="text-gray-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                        Gerenciar Membros
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium group"
                    >
                        <Settings size={16} className="text-gray-400 dark:text-zinc-500" />
                        Configurações do Workspace
                    </button>
                </div>

                <div className="h-px bg-gray-100 dark:bg-zinc-800 w-full my-2"></div>

                {/* Switcher */}
                <p className="px-3 py-2 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Meus Workspaces</p>
                <div className="space-y-1">
                    {workspaces.filter(ws => ws.id !== currentWorkspace?.id).map(ws => (
                        <button
                            key={ws.id}
                            onClick={() => { onSelect(ws); setIsOpen(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors text-sm font-medium text-left min-w-0"
                        >
                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-gray-500 dark:text-zinc-400 text-[10px] shrink-0">
                                {ws.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="truncate flex-1">{ws.name}</span>
                            {ws.name.toLowerCase().includes('cliente') && <Search size={14} className="text-gray-400 dark:text-zinc-500 shrink-0" />}
                        </button>
                    ))}
                </div>

                <div className="p-2 border-t border-gray-100 dark:border-zinc-800/50 mt-2">
                    <button
                        onClick={() => {
                            const name = prompt('Nome do novo workspace:');
                            if (name) onCreate(name);
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors text-sm font-medium"
                    >
                        <Plus size={16} className="text-gray-400 dark:text-zinc-500" /> {loading ? 'Criando...' : 'Novo Workspace'}
                    </button>
                </div>
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
                className="w-80"
                align="start"
            >
                <div className="pointer-events-auto">
                    <DropdownContent />
                </div>
            </PortalPopover>
        </div>
    );
}
