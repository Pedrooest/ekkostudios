import React, { useState } from 'react';
import {
    Search, Plus, Calendar, Clock, MapPin,
    Video, CheckCircle2, Circle, X, Trash2,
    Battery, Mic, Camera, Briefcase, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { Button, Card, Badge, InputSelect } from '../Components';
import { Cliente, ChecklistShoot, TipoTabela } from '../types';

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

interface ChecklistsTabProps {
    clients: Cliente[];
    data: ChecklistShoot[];
    onAdd: (tab: TipoTabela, initial?: Partial<any>) => Promise<string>;
    onUpdate: (id: string, tab: TipoTabela, field: string, value: any, skipLog?: boolean) => Promise<void>;
    onDelete: (ids: string[], tab: TipoTabela) => void;
}

export default function ChecklistsTab({ clients, data, onAdd, onUpdate, onDelete }: ChecklistsTabProps) {
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

    const activeShoot = data.find(s => s.id === activeShootId);

    // ==========================================
    // FUNÇÕES DE LÓGICA
    // ==========================================
    const handleCreateShoot = async () => {
        if (!newShootData.client || !newShootData.date) return;
        tryPlaySound('success');

        const newShoot = {
            ...newShootData,
            status: 'pending',
            checklist: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST))
        };

        const id = await onAdd('CHECKLISTS', newShoot);
        if (id) {
            setIsNewShootModalOpen(false);
            setNewShootData({ client: '', title: '', date: '', time: '', location: '', notes: '' });
        }
    };

    const handleDeleteShoot = (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta gravação?')) return;
        tryPlaySound('close');
        onDelete([id], 'CHECKLISTS');
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
        const shoot = data.find(s => s.id === shootId);
        if (!shoot) return;

        const newChecklist = shoot.checklist.map((cat: any) => {
            if (cat.id !== categoryId) return cat;
            return {
                ...cat,
                items: cat.items.map((item: any) => item.id === itemId ? { ...item, checked: !item.checked } : item)
            };
        });

        const updatedShoot = updateShootStatus({ ...shoot, checklist: newChecklist });
        onUpdate(shootId, 'CHECKLISTS', 'checklist', updatedShoot.checklist, true);
        onUpdate(shootId, 'CHECKLISTS', 'status', updatedShoot.status, true);
    };

    const handleAddItem = (shootId: string, categoryId: string) => {
        const text = newItemTexts[categoryId];
        if (!text || !text.trim()) return;

        tryPlaySound('tap');
        const shoot = data.find(s => s.id === shootId);
        if (!shoot) return;

        const newChecklist = shoot.checklist.map((cat: any) => {
            if (cat.id !== categoryId) return cat;
            return {
                ...cat,
                items: [...cat.items, { id: `item_${Date.now()}`, text: text.trim(), checked: false }]
            };
        });

        const updatedShoot = updateShootStatus({ ...shoot, checklist: newChecklist });
        onUpdate(shootId, 'CHECKLISTS', 'checklist', updatedShoot.checklist, true);
        onUpdate(shootId, 'CHECKLISTS', 'status', updatedShoot.status, true);

        // Limpa o input após adicionar
        setNewItemTexts(prev => ({ ...prev, [categoryId]: '' }));
    };

    const handleRemoveItem = (shootId: string, categoryId: string, itemId: string) => {
        tryPlaySound('close');
        const shoot = data.find(s => s.id === shootId);
        if (!shoot) return;

        const newChecklist = shoot.checklist.map((cat: any) => {
            if (cat.id !== categoryId) return cat;
            return {
                ...cat,
                items: cat.items.filter((item: any) => item.id !== itemId)
            };
        });

        const updatedShoot = updateShootStatus({ ...shoot, checklist: newChecklist });
        onUpdate(shootId, 'CHECKLISTS', 'checklist', updatedShoot.checklist, true);
        onUpdate(shootId, 'CHECKLISTS', 'status', updatedShoot.status, true);
    };

    const calculateProgress = (checklist: any) => {
        if (!checklist) return { total: 0, checked: 0, percentage: 0 };
        const total = checklist.reduce((acc: number, cat: any) => acc + cat.items.length, 0);
        const checked = checklist.reduce((acc: number, cat: any) => acc + cat.items.filter((i: any) => i.checked).length, 0);
        const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
        return { total, checked, percentage };
    };

    // Filtragem
    const filteredShoots = data.filter(s =>
        s.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors relative">

            {/* HEADER */}
            <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-sm">
                        <Video size={16} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">Checklists de Gravação</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Controle de Equipamentos</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-2 group hidden sm:flex h-9 w-48 bg-zinc-100 dark:bg-zinc-800 rounded-lg px-2.5 focus-within:ring-2 focus-within:ring-zinc-500/20 transition-all shadow-inner">
                        <Search className="text-zinc-400 w-3.5 h-3.5 shrink-0" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0"
                        />
                    </div>
                    <Button
                        onClick={() => { tryPlaySound('open'); setIsNewShootModalOpen(true); }}
                        className="h-9"
                    >
                        <Plus size={16} /> Nova Gravação
                    </Button>
                </div>
            </div>

            {/* ÁREA PRINCIPAL */}
            <div className={`flex-1 overflow-y-auto px-6 py-6 transition-all duration-300 ${activeShootId ? 'mr-0 lg:mr-[450px]' : ''} custom-scrollbar`}>

                <div className="max-w-6xl mx-auto">
                    {/* Grid de Cards de Gravação */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredShoots.map(shoot => {
                            const progress = calculateProgress(shoot.checklist);
                            const isReady = progress.percentage === 100 && progress.total > 0;

                            return (
                                <Card
                                    key={shoot.id}
                                    onClick={() => { tryPlaySound('tap'); setActiveShootId(shoot.id); }}
                                    className={`cursor-pointer group relative overflow-hidden flex flex-col ${activeShootId === shoot.id ? 'ring-2 ring-zinc-500 border-zinc-500' : ''}`}
                                >
                                    {/* Faixa lateral de status */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isReady ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

                                    <div className="flex justify-between items-start mb-2">
                                        <Badge color="slate" className="text-[9px] uppercase tracking-tighter">
                                            {shoot.client}
                                        </Badge>
                                        {isReady && (
                                            <Badge color="emerald" className="text-[9px] uppercase tracking-widest gap-1">
                                                <CheckCircle2 size={10} /> Mala Pronta
                                            </Badge>
                                        )}
                                    </div>

                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-tight mb-3 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                                        {shoot.title}
                                    </h3>

                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                            <Calendar size={12} className="shrink-0" /> {new Date(shoot.date).toLocaleDateString('pt-BR')}
                                            <span className="mx-1 opacity-30">•</span>
                                            <Clock size={12} className="shrink-0" /> {shoot.time}
                                        </div>
                                        <div className="flex items-start gap-2 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                            <MapPin size={12} className="mt-0.5 shrink-0" />
                                            <span className="truncate">{shoot.location}</span>
                                        </div>
                                    </div>

                                    {/* Barra de Progresso do Checklist */}
                                    <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                                        <div className="flex justify-between items-end mb-1.5">
                                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Progresso</span>
                                            <span className={`text-[10px] font-bold ${isReady ? 'text-emerald-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                                {progress.checked}/{progress.total} itens
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${isReady ? 'bg-emerald-500' : 'bg-zinc-900 dark:bg-zinc-100'}`}
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    {filteredShoots.length === 0 && (
                        <div className="text-center py-20">
                            <Briefcase size={40} className="mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nenhuma gravação agendada</p>
                        </div>
                    )}
                </div>
            </div>

            {/* SIDEBAR LATERAL */}
            <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${activeShootId ? 'translate-x-0' : 'translate-x-full'}`}>

                {activeShoot ? (
                    <>
                        {/* Header da Sidebar */}
                        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                            <div className="min-w-0 flex-1">
                                <button onClick={() => { tryPlaySound('close'); setActiveShootId(null); }} className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 uppercase tracking-widest mb-1 transition-colors">
                                    <ArrowLeft size={10} /> Voltar à lista
                                </button>
                                <h3 className="text-base font-bold text-zinc-900 dark:text-white truncate">{activeShoot.title}</h3>
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{activeShoot.client}</p>
                            </div>
                            <div className="flex gap-1 ml-4">
                                <Button variant="danger" className="p-2 h-auto rounded-lg" onClick={() => handleDeleteShoot(activeShoot.id)}>
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Info Resumo */}
                        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/50 shrink-0 grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <Calendar size={14} className="text-zinc-400" />
                                <span>{new Date(activeShoot.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <Clock size={14} className="text-zinc-400" />
                                <span>{activeShoot.time}</span>
                            </div>
                            <div className="col-span-2 flex items-start gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                <MapPin size={14} className="text-zinc-400 mt-0.5 shrink-0" />
                                <span className="break-all">{activeShoot.location}</span>
                            </div>
                            {activeShoot.notes && (
                                <div className="col-span-2 flex items-start gap-2 text-xs font-medium text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-lg border border-amber-100 dark:border-amber-500/20">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
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
                                        <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                                            <IconComponent size={12} /> {category.category}
                                        </h4>

                                        <div className="space-y-2">
                                            {category.items.map((item: any) => (
                                                <div
                                                    key={item.id}
                                                    className={`flex items-start justify-between p-3 rounded-lg transition-all border group ${item.checked ? 'bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                                                >
                                                    <label className="flex items-start gap-3 cursor-pointer flex-1">
                                                        <div className="mt-0.5 relative shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only"
                                                                checked={item.checked}
                                                                onChange={() => toggleChecklistItem(activeShoot.id, category.id, item.id)}
                                                            />
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${item.checked ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900' : 'border-zinc-300 dark:border-zinc-700 bg-transparent'}`}>
                                                                {item.checked && <CheckCircle2 size={10} strokeWidth={4} />}
                                                            </div>
                                                        </div>
                                                        <span className={`text-[13px] font-medium transition-colors select-none ${item.checked ? 'text-zinc-400 dark:text-zinc-500 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                            {item.text}
                                                        </span>
                                                    </label>

                                                    <button
                                                        onClick={() => handleRemoveItem(activeShoot.id, category.id, item.id)}
                                                        className="text-zinc-300 hover:text-rose-500 dark:text-zinc-600 dark:hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 ml-2"
                                                        title="Remover item"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Input para Adicionar Novo Item */}
                                            <div className="flex items-center gap-2 mt-3 pt-2">
                                                <input
                                                    type="text"
                                                    placeholder="Adicionar item..."
                                                    value={newItemTexts[category.id] || ''}
                                                    onChange={(e) => setNewItemTexts({ ...newItemTexts, [category.id]: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem(activeShoot.id, category.id)}
                                                    className="flex-1 h-9 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 transition-all shadow-inner"
                                                />
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => handleAddItem(activeShoot.id, category.id)}
                                                    disabled={!newItemTexts[category.id]?.trim()}
                                                    className="h-9 px-3"
                                                >
                                                    <Plus size={14} />
                                                </Button>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer da Sidebar (Barra de Progresso Fixa) */}
                        <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Status da Mala</span>
                                <span className={`text-[11px] font-bold ${calculateProgress(activeShoot.checklist).percentage === 100 && calculateProgress(activeShoot.checklist).total > 0 ? 'text-emerald-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {calculateProgress(activeShoot.checklist).percentage}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${calculateProgress(activeShoot.checklist).percentage === 100 && calculateProgress(activeShoot.checklist).total > 0 ? 'bg-emerald-500' : 'bg-zinc-900 dark:bg-zinc-100'}`}
                                    style={{ width: `${calculateProgress(activeShoot.checklist).percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                        <Briefcase size={32} className="mb-4 opacity-20" />
                        <p className="text-xs font-medium uppercase tracking-widest">Selecione uma gravação para ver detalhes</p>
                    </div>
                )}
            </div>

            {/* OVERLAY PARA SIDEBAR NO MOBILE */}
            {activeShootId && (
                <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm z-40 lg:hidden transition-opacity" onClick={() => setActiveShootId(null)}></div>
            )}

            {/* MODAL: CRIAR NOVA GRAVAÇÃO */}
            {isNewShootModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity" onClick={() => setIsNewShootModalOpen(false)}></div>

                    <Card className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 !p-0">

                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 flex justify-between items-center">
                            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                <Video size={18} /> Agendar Diária
                            </h2>
                            <button onClick={() => { tryPlaySound('close'); setIsNewShootModalOpen(false); }} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <div>
                                <InputSelect
                                    label="Cliente"
                                    value={newShootData.client}
                                    onChange={(val) => setNewShootData({ ...newShootData, client: val })}
                                    options={clients.map(c => ({ value: c.Nome, label: c.Nome }))}
                                    placeholder="Selecione um cliente..."
                                    className="!h-10"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block">Título / Objetivo</label>
                                <input
                                    type="text"
                                    value={newShootData.title}
                                    onChange={(e) => setNewShootData({ ...newShootData, title: e.target.value })}
                                    placeholder="Ex: Gravação Institucional..."
                                    className="w-full h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block">Data</label>
                                    <input
                                        type="date"
                                        value={newShootData.date}
                                        onChange={(e) => setNewShootData({ ...newShootData, date: e.target.value })}
                                        className="w-full h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block">Horário</label>
                                    <input
                                        type="time"
                                        value={newShootData.time}
                                        onChange={(e) => setNewShootData({ ...newShootData, time: e.target.value })}
                                        className="w-full h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block">Endereço / Local</label>
                                <input
                                    type="text"
                                    value={newShootData.location}
                                    onChange={(e) => setNewShootData({ ...newShootData, location: e.target.value })}
                                    placeholder="Rua, número, cidade..."
                                    className="w-full h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block">Observações</label>
                                <textarea
                                    rows={3}
                                    value={newShootData.notes}
                                    onChange={(e) => setNewShootData({ ...newShootData, notes: e.target.value })}
                                    placeholder="Instruções de portaria, contatos..."
                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500 resize-none transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-800/30">
                            <Button variant="ghost" className="h-9 px-4" onClick={() => setIsNewShootModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                disabled={!newShootData.client || !newShootData.date}
                                onClick={handleCreateShoot}
                                className="h-9 px-6"
                            >
                                Criar Diária
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
}
