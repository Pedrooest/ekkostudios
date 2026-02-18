import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Workspace } from './types';
import { BottomSheet } from './components/BottomSheet';

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
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleOpen = () => {
        if (!isOpen && buttonRef.current && !isMobile) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 8,
                left: rect.left
            });
        }
        setIsOpen(!isOpen);
    };

    const handleCreate = () => {
        if (!newName.trim()) return;
        onCreate(newName);
        setNewName('');
        setIsCreating(false);
        setIsOpen(false);
    };

    useEffect(() => {
        if (isOpen && !isMobile) {
            const handleScroll = () => setIsOpen(false);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [isOpen, isMobile]);

    const WorkspaceListContent = () => (
        <div className="flex flex-col h-full lg:h-auto">
            <div className="p-2 space-y-1 lg:max-h-64 lg:overflow-y-auto custom-scrollbar">
                {currentWorkspace && (
                    <button
                        onClick={() => {
                            onManageMembers();
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 lg:py-2 rounded-xl transition-all hover:bg-white/5 text-gray-300 mb-2 border-b border-white/5"
                    >
                        <i className="fa-solid fa-users-cog text-xs text-blue-500"></i>
                        <span className="text-[10px] font-black uppercase tracking-wide">Gerenciar Membros</span>
                    </button>
                )}
                <div className="px-3 py-2 text-[10px] font-black uppercase text-gray-500 tracking-widest">Meus Workspaces</div>
                {workspaces.map(ws => (
                    <button
                        key={ws.id}
                        onClick={() => {
                            onSelect(ws);
                            setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-3 lg:py-2 rounded-xl transition-all ${currentWorkspace?.id === ws.id ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-white/5 text-gray-300'}`}
                    >
                        <div className={`w-2 h-2 rounded-full ${currentWorkspace?.id === ws.id ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                        <span className="text-xs font-bold truncate">{ws.name}</span>
                        {currentWorkspace?.id === ws.id && <i className="fa-solid fa-check ml-auto text-xs"></i>}
                    </button>
                ))}
            </div>

            <div className="p-2 border-t border-white/5 bg-black/20 mt-auto lg:mt-0">
                {isCreating ? (
                    <div className="space-y-2 px-1 animate-fade">
                        <input
                            autoFocus
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Nome do Workspace..."
                            className="w-full bg-[#0B0F19] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className={`flex-1 bg-blue-600 text-white py-2 lg:py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-blue-500 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Criando...' : 'Criar'}
                            </button>
                            <button
                                onClick={() => setIsCreating(false)}
                                className="px-3 bg-white/5 text-gray-400 py-2 lg:py-1.5 rounded-lg text-[10px] font-black hover:bg-white/10"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-3 lg:py-2 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600/20 transition-all"
                    >
                        <i className="fa-solid fa-plus text-xs"></i>
                        <span className="text-[10px] font-black uppercase tracking-widest">Novo Workspace</span>
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="relative w-full lg:w-auto">
            <button
                ref={buttonRef}
                onClick={toggleOpen}
                className="flex items-center gap-2 px-3 py-2 lg:px-4 lg:py-2 bg-[#111827] border border-white/10 rounded-xl hover:bg-white/5 transition-all w-full justify-between group"
            >
                <div className="flex items-center gap-2 lg:gap-3 overflow-hidden">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-[10px] lg:text-xs shrink-0 shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
                        {currentWorkspace?.name.substring(0, 2).toUpperCase() || 'WS'}
                    </div>
                    <div className="flex flex-col items-start truncate leading-tight">
                        <span className="text-[8px] lg:text-[10px] text-gray-400 font-bold uppercase tracking-wider">Workspace</span>
                        <span className="text-[11px] lg:text-xs text-white font-black truncate max-w-[100px] lg:max-w-[120px]">{currentWorkspace?.name || 'Selecione...'}</span>
                    </div>
                </div>
                <i className={`fa-solid fa-chevron-down text-gray-500 text-[10px] lg:text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {/* Mobile BottomSheet */}
            <BottomSheet
                isOpen={isOpen && isMobile}
                onClose={() => setIsOpen(false)}
                title="Trocar Workspace"
            >
                <WorkspaceListContent />
            </BottomSheet>

            {/* Desktop Popover using Portal */}
            {isOpen && !isMobile && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] pointer-events-none">
                    <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={() => setIsOpen(false)} />
                    <div
                        className="absolute w-64 bg-[#111827] border border-white/10 rounded-2xl shadow-xl z-[10000] overflow-hidden animate-fade pointer-events-auto"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                    >
                        <WorkspaceListContent />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
