import React, { useState, useMemo } from 'react';
import { FolderOpen, X, Plus, CheckCircle2, Search } from 'lucide-react';

interface ContentBankSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    bankItems: any[];
    onImport: (item: any) => void;
}

export function ContentBankSidebar({ isOpen, onClose, bankItems, onImport }: ContentBankSidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [addedIds, setAddedIds] = useState<string[]>([]);

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return bankItems;
        const term = searchTerm.toLowerCase();
        return bankItems.filter(item =>
            item._label?.toLowerCase().includes(term) ||
            item._source?.toLowerCase().includes(term)
        );
    }, [bankItems, searchTerm]);

    const handleAdd = (item: any) => {
        const itemId = `${item._source}-${item._label}`;
        if (!addedIds.includes(itemId)) {
            setAddedIds(prev => [...prev, itemId]);
            onImport(item);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm dark:bg-black/60 z-[110] transition-opacity animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* PAINEL LATERAL */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-gray-200 dark:bg-[#111114] dark:border-zinc-800 flex flex-col z-[120] shadow-2xl animate-in slide-in-from-right duration-300 transition-all">

                {/* HEADER */}
                <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-[#111114] shrink-0 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20 rounded-xl flex items-center justify-center transition-colors">
                            <FolderOpen className="text-blue-600 dark:text-blue-400" size={20} />
                        </div>
                        <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-[0.2em] uppercase transition-colors">
                            Banco de Conteúdos
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-zinc-800 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BARRA DE PESQUISA */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800/50 shrink-0 transition-colors">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" size={16} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar ideias aprovadas..."
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:placeholder-zinc-500 text-sm rounded-lg pl-9 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* LISTA COM SCROLL */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                    {filteredItems.map((item, idx) => {
                        const itemId = `${item._source}-${item._label}`;
                        const isAdded = addedIds.includes(itemId);

                        return (
                            <div
                                key={itemId}
                                className={`p-4 rounded-xl border transition-all duration-200 group flex flex-col gap-3
                  ${isAdded
                                        ? 'bg-emerald-50 border-emerald-200 opacity-70 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm dark:shadow-none dark:bg-zinc-900/40 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80'
                                    }`}
                            >
                                {/* Título do Conteúdo */}
                                <h3 className={`text-xs font-bold leading-relaxed transition-colors uppercase
                  ${isAdded
                                        ? 'text-gray-400 line-through dark:text-zinc-400'
                                        : 'text-gray-900 dark:text-zinc-200'
                                    }`}
                                >
                                    {item._label}
                                </h3>

                                {/* Rodapé do Card */}
                                <div className="flex justify-between items-center mt-1">

                                    {/* Tag Fonte */}
                                    <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 rounded-md transition-colors">
                                        {item._source}
                                    </span>

                                    {/* Botão de Ação */}
                                    <button
                                        onClick={() => handleAdd(item)}
                                        disabled={isAdded}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all
                      ${isAdded
                                                ? 'bg-transparent text-emerald-600 dark:text-emerald-500'
                                                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 shadow-sm'
                                            }`}
                                    >
                                        {isAdded ? (
                                            <><CheckCircle2 size={12} /> Adicionado</>
                                        ) : (
                                            <><Plus size={12} /> Adicionar</>
                                        )}
                                    </button>

                                </div>
                            </div>
                        );
                    })}

                    {filteredItems.length === 0 && (
                        <div className="py-20 text-center opacity-30">
                            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <FolderOpen className="text-gray-400 dark:text-zinc-500" size={24} />
                            </div>
                            <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-400">Nenhum item encontrado</p>
                        </div>
                    )}
                </div>

                {/* FOOTER DO PAINEL */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 dark:border-zinc-800 dark:bg-zinc-900/50 shrink-0 transition-colors">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 text-center uppercase tracking-widest">
                        {filteredItems.length} ideias disponíveis no backlog
                    </p>
                </div>

            </div>
        </>
    );
}
