import React, { useState } from 'react';
import {
    Search, Plus, Calendar, Clock, MapPin,
    Video, CheckCircle2, Circle, X, Trash2,
    Battery, Mic, Camera, Briefcase, AlertTriangle, ArrowLeft
} from 'lucide-react';

// ==========================================
// FUNÇÕES AUXILIARES DE SOM
// ==========================================
const tryPlaySound = (type: string) => {
    if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
};

// ==========================================
// MAPEAMENTO DE ÍCONES
// ==========================================
const ICON_MAP: Record<string, React.ElementType> = {
    Camera,
    Mic,
    Battery,
    Briefcase
};

// ==========================================
// TEMPLATE PADRÃO DE EQUIPAMENTOS
// ==========================================
const DEFAULT_CHECKLIST = [
    {
        id: 'c1', category: 'Câmeras e Lentes', iconName: 'Camera', items: [
            { id: '101', text: 'Câmera Principal (Sony A7IV)', checked: false },
            { id: '102', text: 'Lente 24-70mm', checked: false },
            { id: '103', text: 'Filtro ND', checked: false }
        ]
    },
    {
        id: 'c2', category: 'Áudio', iconName: 'Mic', items: [
            { id: '201', text: 'Microfone de Lapela (2x)', checked: false },
            { id: '202', text: 'Gravador Externo / Zoom', checked: false },
            { id: '203', text: 'Fones de Ouvido', checked: false }
        ]
    },
    {
        id: 'c3', category: 'Energia e Mídia', iconName: 'Battery', items: [
            { id: '301', text: 'Baterias Extras (100% Carregadas)', checked: false },
            { id: '302', text: 'Cartões SD (Formatados)', checked: false },
            { id: '303', text: 'Carregador de Bateria', checked: false }
        ]
    },
    {
        id: 'c4', category: 'Pós-Gravação (Trazer)', iconName: 'Briefcase', items: [
            { id: '401', text: 'Todos os Cartões SD Guardados', checked: false },
            { id: '402', text: 'Microfones desligados e recolhidos', checked: false },
            { id: '403', text: 'Verificar local se nada foi esquecido', checked: false }
        ]
    }
];

import { Cliente } from '../types';

// ==========================================
// DADOS MOCK INICIAIS
// ==========================================
const INITIAL_SHOOTS = [
    {
        id: 'shoot_1',
        client: 'Forno a Lenha Bakery',
        title: 'Gravação Reels (Produção)',
        date: '2026-02-28',
        time: '08:00',
        location: 'Rua das Flores, 123 - Centro',
        notes: 'Chegar 15min antes. Falar com a gerente Maria.',
        status: 'pending', // pending, ready, done
        checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST))
    },
    {
        id: 'shoot_2',
        client: 'Tech Solutions Hub',
        title: 'Entrevista Podcast CEO',
        date: '2026-03-02',
        time: '14:30',
        location: 'Av. Paulista, 1000 - Sala 5B',
        notes: 'Levar iluminação extra (bastões RGB).',
        status: 'ready',
        checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST)).map((c: any) => ({
            ...c, items: c.items.map((i: any) => ({ ...i, checked: true }))
        }))
    }
];

interface ChecklistsTabProps {
    clients: Cliente[];
}

export default function ChecklistsTab({ clients }: ChecklistsTabProps) {
    const [shoots, setShoots] = useState(INITIAL_SHOOTS);
    const [searchQuery, setSearchQuery] = useState('');

    // Controle de Interface
    const [activeShootId, setActiveShootId] = useState<string | null>(null);
    const [isNewShootModalOpen, setIsNewShootModalOpen] = useState(false);

    // Formulário de Nova Gravação
    const [newShootData, setNewShootData] = useState({
        client: '', title: '', date: '', time: '', location: '', notes: ''
    });

    // Estado para gerenciar os inputs de novos itens do checklist
    const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

    const activeShoot = shoots.find(s => s.id === activeShootId);

    // ==========================================
    // FUNÇÕES DE LÓGICA
    // ==========================================
    const handleCreateShoot = () => {
        if (!newShootData.client || !newShootData.date) return;
        tryPlaySound('success');

        const newShoot = {
            id: `shoot_${Date.now()}`,
            ...newShootData,
            status: 'pending',
            checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST))
        };

        setShoots([newShoot, ...shoots]);
        setIsNewShootModalOpen(false);
        setNewShootData({ client: '', title: '', date: '', time: '', location: '', notes: '' });
    };

    const handleDeleteShoot = (id: string) => {
        tryPlaySound('close');
        setShoots(shoots.filter(s => s.id !== id));
        if (activeShootId === id) setActiveShootId(null);
    };

    // === Gestão de Checklists ===

    const updateShootStatus = (shoot: any) => {
        const totalItems = shoot.checklist.reduce((acc: number, cat: any) => acc + cat.items.length, 0);
        const checkedItems = shoot.checklist.reduce((acc: number, cat: any) => acc + cat.items.filter((i: any) => i.checked).length, 0);

        let newStatus = shoot.status;
        if (totalItems === 0) newStatus = 'pending';
        else if (checkedItems === totalItems) newStatus = 'ready';
        else newStatus = 'pending';

        return { ...shoot, status: newStatus };
    };

    const toggleChecklistItem = (shootId: string, categoryId: string, itemId: string) => {
        tryPlaySound('tap');
        setShoots(currentShoots => currentShoots.map(shoot => {
            if (shoot.id !== shootId) return shoot;

            const newChecklist = shoot.checklist.map((cat: any) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item: any) => item.id === itemId ? { ...item, checked: !item.checked } : item)
                };
            });

            return updateShootStatus({ ...shoot, checklist: newChecklist });
        }));
    };

    const handleAddItem = (shootId: string, categoryId: string) => {
        const text = newItemTexts[categoryId];
        if (!text || !text.trim()) return;

        tryPlaySound('tap');
        setShoots(currentShoots => currentShoots.map(shoot => {
            if (shoot.id !== shootId) return shoot;

            const newChecklist = shoot.checklist.map((cat: any) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: [...cat.items, { id: `item_${Date.now()}`, text: text.trim(), checked: false }]
                };
            });

            return updateShootStatus({ ...shoot, checklist: newChecklist });
        }));

        // Limpa o input após adicionar
        setNewItemTexts(prev => ({ ...prev, [categoryId]: '' }));
    };

    const handleRemoveItem = (shootId: string, categoryId: string, itemId: string) => {
        tryPlaySound('close');
        setShoots(currentShoots => currentShoots.map(shoot => {
            if (shoot.id !== shootId) return shoot;

            const newChecklist = shoot.checklist.map((cat: any) => {
                if (cat.id !== categoryId) return cat;
                return {
                    ...cat,
                    items: cat.items.filter((item: any) => item.id !== itemId)
                };
            });

            return updateShootStatus({ ...shoot, checklist: newChecklist });
        }));
    };

    const calculateProgress = (checklist: any) => {
        if (!checklist) return { total: 0, checked: 0, percentage: 0 };
        const total = checklist.reduce((acc: number, cat: any) => acc + cat.items.length, 0);
        const checked = checklist.reduce((acc: number, cat: any) => acc + cat.items.filter((i: any) => i.checked).length, 0);
        const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
        return { total, checked, percentage };
    };

    // Filtragem
    const filteredShoots = shoots.filter(s =>
        s.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full w-full overflow-hidden font-sans transition-colors relative">

            {/* =========================================
          ÁREA PRINCIPAL (LISTA DE GRAVAÇÕES)
          ========================================= */}
            <div className={`flex-1 overflow-y-auto p-6 lg:p-8 transition-all duration-300 ${activeShootId ? 'mr-0 lg:mr-[450px]' : ''} custom-scrollbar`}>

                <div className="max-w-6xl mx-auto">

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-[#0B1527] dark:text-white tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                    <Video size={22} />
                                </div>
                                Checklists de Gravação
                            </h2>
                            <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mt-2 ml-1">
                                Controle de Equipamentos e Diárias
                            </p>
                        </div>

                        <button
                            onClick={() => { tryPlaySound('open'); setIsNewShootModalOpen(true); }}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all ios-btn active:scale-95"
                        >
                            <Plus size={18} /> Nova Gravação
                        </button>
                    </div>

                    {/* Barra de Pesquisa */}
                    <div className="relative mb-8 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente ou título..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-medium rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-shadow"
                        />
                    </div>

                    {/* Grid de Cards de Gravação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredShoots.map(shoot => {
                            const progress = calculateProgress(shoot.checklist);
                            const isReady = progress.percentage === 100 && progress.total > 0;

                            return (
                                <div
                                    key={shoot.id}
                                    onClick={() => { tryPlaySound('tap'); setActiveShootId(shoot.id); }}
                                    className={`bg-white dark:bg-[#111114] border ${activeShootId === shoot.id ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-600'} rounded-2xl p-5 cursor-pointer transition-all shadow-sm group ios-btn relative overflow-hidden flex flex-col`}
                                >
                                    {/* Faixa lateral de status */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isReady ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

                                    <div className="flex justify-between items-start mb-4 pl-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300">
                                            {shoot.client}
                                        </span>
                                        {isReady && (
                                            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                                                <CheckCircle2 size={12} /> Mala Pronta
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight mb-4 pl-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {shoot.title}
                                    </h3>

                                    <div className="space-y-2 mb-6 pl-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400">
                                            <Calendar size={14} /> {new Date(shoot.date).toLocaleDateString('pt-BR')}
                                            <Clock size={14} className="ml-2" /> {shoot.time}
                                        </div>
                                        <div className="flex items-start gap-2 text-xs font-bold text-gray-500 dark:text-zinc-400">
                                            <MapPin size={14} className="mt-0.5 shrink-0" />
                                            <span className="line-clamp-1">{shoot.location}</span>
                                        </div>
                                    </div>

                                    {/* Barra de Progresso do Checklist */}
                                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-zinc-800/80 pl-2">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Progresso da Mala</span>
                                            <span className={`text-xs font-black ${isReady ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                {progress.checked}/{progress.total} itens
                                            </span>
                                        </div>
                                        <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isReady ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredShoots.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <Briefcase size={48} className="mx-auto mb-4 text-gray-400" />
                            <p className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Nenhuma gravação agendada</p>
                        </div>
                    )}
                </div>
            </div>

            {/* =========================================
          SIDEBAR LATERAL (CHECKLIST DETALHADO)
          ========================================= */}
            <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-[#111114] border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${activeShootId ? 'translate-x-0' : 'translate-x-full'}`}>

                {activeShoot ? (
                    <>
                        {/* Header da Sidebar */}
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-[#0a0a0c]/50 flex justify-between items-start shrink-0">
                            <div className="pr-4">
                                <button onClick={() => { tryPlaySound('close'); setActiveShootId(null); }} className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest mb-3 ios-btn">
                                    <ArrowLeft size={12} /> Voltar à lista
                                </button>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-1">{activeShoot.title}</h3>
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{activeShoot.client}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDeleteShoot(activeShoot.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors ios-btn">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Info Resumo */}
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 shrink-0 space-y-3">
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                                <Calendar size={16} className="text-indigo-500" />
                                <span>{new Date(activeShoot.date).toLocaleDateString('pt-BR')} às {activeShoot.time}</span>
                            </div>
                            <div className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-900 p-3 rounded-xl border border-gray-100 dark:border-zinc-800">
                                <MapPin size={16} className="text-rose-500 mt-0.5 shrink-0" />
                                <span>{activeShoot.location}</span>
                            </div>
                            {activeShoot.notes && (
                                <div className="flex items-start gap-3 text-sm font-medium text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-100 dark:border-amber-500/20">
                                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                    <p className="leading-snug">{activeShoot.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Checklist Interativo */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            {activeShoot.checklist.map((category: any) => {
                                const IconComponent = ICON_MAP[category.iconName] || Briefcase;
                                return (
                                    <div key={category.id}>
                                        <h4 className="text-[11px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                                            <IconComponent size={14} className="text-indigo-500" /> {category.category}
                                        </h4>

                                        <div className="space-y-2">
                                            {category.items.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-start justify-between p-3 rounded-xl transition-all border group ${item.checked ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/30' : 'bg-white dark:bg-[#151518] border-gray-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-600'}`}
                                                >
                                                    <label className="flex items-start gap-3 cursor-pointer flex-1 ios-btn">
                                                        <div className="mt-0.5 relative shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only"
                                                                checked={item.checked}
                                                                onChange={() => toggleChecklistItem(activeShoot.id, category.id, item.id)}
                                                            />
                                                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${item.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-zinc-600'}`}>
                                                                {item.checked && <CheckCircle2 size={14} strokeWidth={4} />}
                                                            </div>
                                                        </div>
                                                        <span className={`text-sm font-bold transition-colors select-none ${item.checked ? 'text-gray-400 dark:text-zinc-500 line-through' : 'text-gray-800 dark:text-zinc-200'}`}>
                                                            {item.text}
                                                        </span>
                                                    </label>

                                                    {/* Botão Remover Item (Visível ao passar o rato) */}
                                                    <button
                                                        onClick={() => handleRemoveItem(activeShoot.id, category.id, item.id)}
                                                        className="text-gray-300 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2"
                                                        title="Remover item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Input para Adicionar Novo Item */}
                                            <div className="flex items-center gap-2 mt-3 pt-2">
                                                <input
                                                    type="text"
                                                    placeholder="Adicionar novo item..."
                                                    value={newItemTexts[category.id] || ''}
                                                    onChange={(e) => setNewItemTexts({ ...newItemTexts, [category.id]: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(activeShoot.id, category.id)}
                                                    className="flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm font-medium text-gray-800 dark:text-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                                                />
                                                <button
                                                    onClick={() => handleAddItem(activeShoot.id, category.id)}
                                                    disabled={!newItemTexts[category.id]?.trim()}
                                                    className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer da Sidebar (Barra de Progresso Fixa) */}
                        <div className="p-6 bg-white dark:bg-[#111114] border-t border-gray-200 dark:border-zinc-800 shrink-0">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Status da Mala</span>
                                <span className={`text-sm font-black ${calculateProgress(activeShoot.checklist).percentage === 100 && calculateProgress(activeShoot.checklist).total > 0 ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                    {calculateProgress(activeShoot.checklist).percentage}%
                                </span>
                            </div>
                            <div className="w-full h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${calculateProgress(activeShoot.checklist).percentage === 100 && calculateProgress(activeShoot.checklist).total > 0 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                    style={{ width: `${calculateProgress(activeShoot.checklist).percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">Selecione uma gravação.</div>
                )}
            </div>

            {/* OVERLAY PARA SIDEBAR NO MOBILE */}
            {activeShootId && (
                <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity animate-in fade-in" onClick={() => setActiveShootId(null)}></div>
            )}

            {/* =========================================
          MODAL: CRIAR NOVA GRAVAÇÃO
          ========================================= */}
            {isNewShootModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsNewShootModalOpen(false)}></div>

                    <div className="relative w-full max-w-lg bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                        <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#0a0a0c]/50">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                <Video className="text-indigo-500" /> Agendar Gravação
                            </h2>
                            <button onClick={() => { tryPlaySound('close'); setIsNewShootModalOpen(false); }} className="p-1.5 text-gray-400 hover:text-rose-500 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors ios-btn">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Cliente</label>
                                <select
                                    autoFocus
                                    value={newShootData.client}
                                    onChange={(e) => setNewShootData({ ...newShootData, client: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                                >
                                    <option value="" disabled hidden>Selecione um cliente...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.Nome}>{c.Nome}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Título / Objetivo</label>
                                <input
                                    type="text"
                                    value={newShootData.title}
                                    onChange={(e) => setNewShootData({ ...newShootData, title: e.target.value })}
                                    placeholder="Ex: Gravação Institucional..."
                                    className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Data</label>
                                    <input
                                        type="date"
                                        value={newShootData.date}
                                        onChange={(e) => setNewShootData({ ...newShootData, date: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Horário</label>
                                    <input
                                        type="time"
                                        value={newShootData.time}
                                        onChange={(e) => setNewShootData({ ...newShootData, time: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Endereço / Local</label>
                                <input
                                    type="text"
                                    value={newShootData.location}
                                    onChange={(e) => setNewShootData({ ...newShootData, location: e.target.value })}
                                    placeholder="Rua, número, cidade..."
                                    className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Observações Iniciais</label>
                                <textarea
                                    rows={2}
                                    value={newShootData.notes}
                                    onChange={(e) => setNewShootData({ ...newShootData, notes: e.target.value })}
                                    placeholder="Instruções de portaria, contatos..."
                                    className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                                />
                            </div>

                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center p-6 bg-gray-50/50 dark:bg-[#0a0a0c]/50 mt-2">
                            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
                                <CheckCircle2 size={12} /> Checklist padrão será gerado
                            </span>
                            <div className="flex gap-3">
                                <button onClick={() => { tryPlaySound('close'); setIsNewShootModalOpen(false); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors ios-btn">
                                    Cancelar
                                </button>
                                <button onClick={handleCreateShoot} disabled={!newShootData.client || !newShootData.date} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all ios-btn">
                                    Criar Diária
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
