import React, { useState, useMemo } from 'react';
import {
    FolderOpen, X, Plus, CheckCircle2, Search,
    Trash2, Pencil, Save, XCircle, Clock
} from 'lucide-react';

interface ContentBankSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    bankItems: any[];
    onImport: (item: any) => void;
    onUpdate: (id: string, source: string, field: string, value: any) => void;
    onDelete: (id: string, source: string) => void;
}

export function ContentBankSidebar({ isOpen, onClose, bankItems, onImport, onUpdate, onDelete }: ContentBankSidebarProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [addedIds, setAddedIds] = useState<string[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return bankItems;
        const term = searchTerm.toLowerCase();
        return bankItems.filter(item =>
            item._label?.toLowerCase().includes(term) ||
            item._source?.toLowerCase().includes(term)
        );
    }, [bankItems, searchTerm]);

    const handleAdd = (item: any) => {
        const itemId = `${item._source}-${item.id}`;
        if (!addedIds.includes(itemId)) {
            setAddedIds(prev => [...prev, itemId]);
            onImport(item);
        }
    };

    const handleEditStart = (item: any) => {
        setEditingId(`${item._source}-${item.id}`);
        setEditValue(item._label);
    };

    const handleEditSave = (item: any) => {
        if (!editValue.trim()) return;
        const field = item._source === 'RDC' ? 'Ideia de Conteúdo' :
            item._source === 'MATRIZ' ? 'Papel estratégico' :
                item._source === 'TAREFAS' ? 'Título' : 'clientName';

        onUpdate(item.id, item._source, field, editValue.toUpperCase());
        setEditingId(null);
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
                            className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:placeholder-zinc-500 text-sm rounded-lg pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* LISTA COM SCROLL */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
                    {filteredItems.map((item) => {
                        const compositeId = `${item._source}-${item.id}`;
                        const isAdded = addedIds.includes(compositeId);
                        const isEditing = editingId === compositeId;

                        return (
                            <div
                                key={compositeId}
                                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-4 shadow-sm group
                                    ${isAdded
                                        ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20 opacity-60'
                                        : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:border-blue-300 dark:hover:border-zinc-600'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2 flex-1 min-w-0">
                                        <span className="text-[8px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-1">
                                            <Clock size={10} /> {item.Data || 'S/ DATA'}
                                        </span>

                                        {isEditing ? (
                                            <div className="space-y-2 pr-2">
                                                <textarea
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-blue-200 dark:border-blue-500/30 text-gray-900 dark:text-zinc-200 text-[11px] font-bold uppercase rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-inner resize-none leading-relaxed"
                                                    rows={2}
                                                    autoFocus
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => handleEditSave(item)} className="flex items-center gap-1.5 text-[9px] font-black uppercase bg-blue-600 text-white hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-sm transition-all">
                                                        <Save size={12} /> Salvar
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="text-[9px] font-black uppercase text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 px-2 py-1 transition-colors">
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <h3 className={`text-xs font-black leading-relaxed transition-colors uppercase ${isAdded ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-zinc-100'}`}>
                                                {item._label}
                                            </h3>
                                        )}
                                    </div>

                                    {!isEditing && !isAdded && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditStart(item)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-500 dark:hover:text-blue-400 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(item.id, item._source)}
                                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:text-zinc-500 dark:hover:text-rose-400 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-500/20 rounded-lg">
                                        {item._source}
                                    </span>

                                    <button
                                        onClick={() => handleAdd(item)}
                                        disabled={isAdded || isEditing}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm
                                            ${isAdded
                                                ? 'bg-emerald-500 text-white opacity-100'
                                                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50'
                                            }`}
                                    >
                                        {isAdded ? (
                                            <><CheckCircle2 size={14} /> Adicionado</>
                                        ) : (
                                            <><Plus size={14} /> Adicionar</>
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
                        {filteredItems.length} ideias no backlog
                    </p>
                </div>

            </div>
        </>
    );
}
