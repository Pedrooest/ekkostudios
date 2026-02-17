import React, { useState } from 'react';
import { Workspace } from './types';
import { DatabaseService } from './DatabaseService';

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
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const toggleOpen = () => {
        if (!isOpen && buttonRef.current) {
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

    // Close on scroll/resize to avoid detached positioning
    React.useEffect(() => {
        if (isOpen) {
            const handleScroll = () => setIsOpen(false);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll, true);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [isOpen]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={toggleOpen}
                className="flex items-center gap-2 px-4 py-2 bg-[#111827] border border-white/10 rounded-xl hover:bg-white/5 transition-all w-full md:w-auto justify-between"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                        {currentWorkspace?.name.substring(0, 2).toUpperCase() || 'WS'}
                    </div>
                    <div className="flex flex-col items-start truncate">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Workspace</span>
                        <span className="text-xs text-white font-black truncate max-w-[120px]">{currentWorkspace?.name || 'Selecione...'}</span>
                    </div>
                </div>
                <i className={`fa-solid fa-chevron-down text-gray-500 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
                    <div
                        className="fixed w-64 bg-[#111827] border border-white/10 rounded-2xl shadow-xl z-[70] overflow-hidden animate-in fade-in zoom-in duration-200"
                        style={{ top: dropdownPos.top, left: dropdownPos.left }}
                    >
                        <div className="p-2 space-y-1">
                            {currentWorkspace && (
                                <button
                                    onClick={() => {
                                        onManageMembers();
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all hover:bg-white/5 text-gray-300 mb-2 border-b border-white/5"
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
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${currentWorkspace?.id === ws.id ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-white/5 text-gray-300'}`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${currentWorkspace?.id === ws.id ? 'bg-blue-500' : 'bg-gray-600'}`}></div>
                                    <span className="text-xs font-bold truncate">{ws.name}</span>
                                    {currentWorkspace?.id === ws.id && <i className="fa-solid fa-check ml-auto text-xs"></i>}
                                </button>
                            ))}
                        </div>

                        <div className="p-2 border-t border-white/5 bg-black/20">
                            {isCreating ? (
                                <div className="space-y-2 px-1">
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
                                            className={`flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-blue-500 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {loading ? 'Criando...' : 'Criar'}
                                        </button>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="px-3 bg-white/5 text-gray-400 py-1.5 rounded-lg text-[10px] font-black hover:bg-white/10"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/10 text-blue-500 rounded-xl hover:bg-blue-600/20 transition-all"
                                >
                                    <i className="fa-solid fa-plus text-xs"></i>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Novo Workspace</span>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
