import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
    Search, Plus, Calendar, Clock, MapPin,
    Video, CheckCircle2, X, Trash2, Check,
    Briefcase, AlertTriangle, ArrowLeft,
    CheckSquare, Square
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
// TEMPLATE DE DIÁRIA DE GRAVAÇÃO
// ==========================================
const DEFAULT_LEVAR = [
    { id: '101', text: 'Câmera Principal e Lentes', checked: false },
    { id: '102', text: 'Tripé / Gimbal', checked: false },
    { id: '103', text: 'Microfone de Lapela (Baterias 100%)', checked: false },
    { id: '104', text: 'Cartões SD formatados', checked: false },
    { id: '105', text: 'Baterias Extras Carregadas', checked: false },
    { id: '106', text: 'Iluminação / LEDs', checked: false }
];

const DEFAULT_TRAZER = [
    { id: '201', text: 'Câmera e Lentes Completas', checked: false },
    { id: '202', text: 'Tripé Guardado na Bolsa', checked: false },
    { id: '203', text: 'Todos os cabos e microfones', checked: false },
    { id: '204', text: 'Conferir Cartões SD de Backup', checked: false },
    { id: '205', text: 'Carregadores de Parede', checked: false }
];

const DEFAULT_GRAVAR = [
    { id: '301', text: 'Institucional: Setup com 2 Câmeras', type: 'Feed/YouTube', checked: false },
    { id: '302', text: 'Takes Rápidos / Bastidores do consultório', type: 'B-Roll', checked: false },
    { id: '303', text: 'Vídeos de Resposta (Top 3 Dúvidas)', type: 'Reels', checked: false }
];

interface ChecklistsTabProps {
    clients: Cliente[];
    data: ChecklistShoot[];
    onAdd: (tab: TipoTabela, initial?: Partial<any>) => Promise<string>;
    onUpdate: (id: string, tab: TipoTabela, field: string, value: any, skipLog?: boolean) => Promise<void>;
    onDelete: (ids: string[], tab: TipoTabela) => void;
    savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
}

export default function ChecklistsTab({ clients, data, onAdd, onUpdate, onDelete, savingStatus = {} }: ChecklistsTabProps) {
    const [searchQuery, setSearchQuery] = useState('');

    // Controle de Interface
    const [activeShootId, setActiveShootId] = useState<string | null>(null);
    const [isNewShootModalOpen, setIsNewShootModalOpen] = useState(false);

    // Escape listener para fechar modais/vistas
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isNewShootModalOpen) setIsNewShootModalOpen(false);
                if (activeShootId) setActiveShootId(null);
                setAddingItemToCategory(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isNewShootModalOpen, activeShootId]);
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');

    // Formulário de Nova Gravação
    const [newShootData, setNewShootData] = useState({
        client: '', title: '', date: '', time: '', location: '', notes: ''
    });

    // Estado para gerenciar os inputs de novos itens do checklist
    const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});
    const [addingItemToCategory, setAddingItemToCategory] = useState<string | null>(null);
    const [newSceneType, setNewSceneType] = useState<string>('Reels');
    const [isSaving, setIsSaving] = useState(false);

    const activeShoot = data.find(s => s.id === activeShootId);

    // ==========================================
    // FUNÇÕES DE LÓGICA
    // ==========================================
    const handleCreateShoot = async () => {
        if (!newShootData.client || !newShootData.date) {
            setCreateError('Selecione um cliente e uma data.');
            return;
        }
        setCreateError('');
        setIsCreating(true);
        
        tryPlaySound('success');

        const newShoot = {
            ...newShootData,
            status: 'pending',
            itens_levar: JSON.parse(JSON.stringify(DEFAULT_LEVAR)),
            itens_trazer: JSON.parse(JSON.stringify(DEFAULT_TRAZER)),
            itens_gravar: JSON.parse(JSON.stringify(DEFAULT_GRAVAR))
        };

        try {
            const id = await onAdd('CHECKLISTS', newShoot);
            if (id) {
                setIsNewShootModalOpen(false);
                setNewShootData({ client: '', title: '', date: '', time: '', location: '', notes: '' });
                // Limpar filtros caso existam para gartantir que o card apareça
                setSearchQuery('');
                
                // Aguardar o React atualizar a DOM e scrollar até o card
                setTimeout(() => {
                    const el = document.getElementById(`shoot-card-${id}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            } else {
                setCreateError('Falha ao criar a gravação. Verifique sua conexão.');
            }
        } catch (e: any) {
            setCreateError('Erro interno: ' + e.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteShoot = (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta gravação?')) return;
        tryPlaySound('close');
        onDelete([id], 'CHECKLISTS');
        if (activeShootId === id) setActiveShootId(null);
    };

    const updateShootStatus = (shoot: any, forcedStatus?: 'pending' | 'ready' | 'done') => {
        if (forcedStatus) {
            return { ...shoot, status: forcedStatus };
        }
        
        const totalItems = (shoot.itens_levar?.length || 0) + (shoot.itens_trazer?.length || 0) + (shoot.itens_gravar?.length || 0);
        const checkedItems = 
            (shoot.itens_levar?.filter((i: any) => i.checked).length || 0) +
            (shoot.itens_trazer?.filter((i: any) => i.checked).length || 0) +
            (shoot.itens_gravar?.filter((i: any) => i.checked).length || 0);

        let newStatus = shoot.status;
        if (checkedItems === totalItems && totalItems > 0) newStatus = 'done';
        else if (checkedItems > 0) newStatus = 'ready';
        else newStatus = 'pending';

        return { ...shoot, status: newStatus };
    };

    const performSave = async (shootId: string, updatedShoot: any) => {
        setIsSaving(true);
        await onUpdate(shootId, 'CHECKLISTS', null, { 
            itens_levar: updatedShoot.itens_levar,
            itens_trazer: updatedShoot.itens_trazer,
            itens_gravar: updatedShoot.itens_gravar,
            status: updatedShoot.status 
        }, true);
        setTimeout(() => setIsSaving(false), 1000);
    };

    const toggleChecklistItem = (shootId: string, categoryId: string, itemId: string) => {
        tryPlaySound('tap');
        const shoot = data.find(s => s.id === shootId);
        if (!shoot) return;

        const field = categoryId === 'levar' ? 'itens_levar' : (categoryId === 'trazer' ? 'itens_trazer' : 'itens_gravar');
        const newList = (shoot as any)[field].map((item: any) => 
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );

        const updatedShoot = updateShootStatus({ ...shoot, [field]: newList });
        performSave(shootId, updatedShoot);
    };

    const handleAddItem = (shootId: string, categoryId: string, itemText: string) => {
        if (!itemText || !itemText.trim()) return;

        tryPlaySound('tap');
        const shoot = data.find(s => s.id === shootId);
        if (!shoot) return;

        const newItem: any = { id: `item_${Date.now()}`, text: itemText.trim(), checked: false };
        if (categoryId === 'gravar') {
            newItem.type = newSceneType;
        }

        const field = categoryId === 'levar' ? 'itens_levar' : (categoryId === 'trazer' ? 'itens_trazer' : 'itens_gravar');
        const newList = [...((shoot as any)[field] || []), newItem];

        const updatedShoot = updateShootStatus({ ...shoot, [field]: newList });
        performSave(shootId, updatedShoot);
    };

    const handleRemoveItem = (shootId: string, categoryId: string, itemId: string) => {
        const shoot = data.find(s => s.id === shootId);
        if (!shoot) return;

        const field = categoryId === 'levar' ? 'itens_levar' : (categoryId === 'trazer' ? 'itens_trazer' : 'itens_gravar');
        const list = (shoot as any)[field] || [];
        const item = list.find((i: any) => i.id === itemId);

        if (item && item.text.trim().length > 0) {
            if (!window.confirm('Tem certeza que deseja remover este item?')) return;
        }

        tryPlaySound('close');
        
        const newList = list.filter((item: any) => item.id !== itemId);

        const updatedShoot = updateShootStatus({ ...shoot, [field]: newList });
        performSave(shootId, updatedShoot);
    };

    const calculateProgress = (shoot: ChecklistShoot) => {
        if (!shoot) return { total: 0, checked: 0, percentage: 0 };
        
        const total = (shoot.itens_levar?.length || 0) + (shoot.itens_trazer?.length || 0) + (shoot.itens_gravar?.length || 0);
        const checked = 
            (shoot.itens_levar?.filter((i: any) => i.checked).length || 0) +
            (shoot.itens_trazer?.filter((i: any) => i.checked).length || 0) +
            (shoot.itens_gravar?.filter((i: any) => i.checked).length || 0);
            
        const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
        return { total, checked, percentage };
    };

    // Filtragem
    const filteredShoots = data.filter(s =>
        s.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.title?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ==========================================
    // RENDERIZAÇÃO SECUNDÁRIAS
    // ==========================================
    const renderNewShootModal = () => {
        if (!isNewShootModalOpen) return null;

        const modalContent = (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity" onClick={() => setIsNewShootModalOpen(false)}></div>

                <Card className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 !p-0">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 flex justify-between items-center">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                            <Video size={18} className="shrink-0" /> Agendar Gravação
                        </h2>
                        <button onClick={() => { tryPlaySound('close'); setIsNewShootModalOpen(false); }} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700">
                            <X size={16} className="shrink-0" />
                        </button>
                    </div>

                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            <div>
                                <InputSelect
                                    label="* Cliente da Gravação"
                                    value={newShootData.client}
                                    onChange={(val) => setNewShootData({ ...newShootData, client: val })}
                                    options={clients.map(c => ({ value: c.Nome, label: c.Nome }))}
                                    placeholder="Selecione um cliente..."
                                    className="!h-10 border border-zinc-200 dark:border-zinc-700 w-full"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block uppercase tracking-wide">Título / Tema</label>
                                <input
                                    type="text"
                                    value={newShootData.title}
                                    onChange={(e) => setNewShootData({ ...newShootData, title: e.target.value })}
                                    placeholder="Ex: Captação Mês 04 + Institucional Externo"
                                    className="w-full h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block uppercase tracking-wide">* Data Prevista</label>
                                    <input
                                        type="date"
                                        value={newShootData.date}
                                        onChange={(e) => setNewShootData({ ...newShootData, date: e.target.value })}
                                        className="w-full h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block uppercase tracking-wide">Horário Início</label>
                                    <input
                                        type="time"
                                        value={newShootData.time}
                                        onChange={(e) => setNewShootData({ ...newShootData, time: e.target.value })}
                                        className="w-full h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block uppercase tracking-wide">Endereço / Local</label>
                                <input
                                    type="text"
                                    value={newShootData.location}
                                    onChange={(e) => setNewShootData({ ...newShootData, location: e.target.value })}
                                    placeholder="Consultório Matriz, Clínica Central..."
                                    className="w-full h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-black text-zinc-600 dark:text-zinc-400 mb-1.5 ml-1 block uppercase tracking-wide">Observações Gerais</label>
                                <textarea
                                    rows={3}
                                    value={newShootData.notes}
                                    onChange={(e) => setNewShootData({ ...newShootData, notes: e.target.value })}
                                    placeholder="Avisos importantes sobre a locação, contatos visuais..."
                                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                        
                        {createError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 text-red-600 dark:text-red-400 text-xs font-bold rounded-r-lg">
                                {createError}
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-800/30">
                        <Button variant="ghost" className="h-10 px-5 text-zinc-500 hover:text-zinc-900 border-none font-bold !bg-transparent" onClick={() => setIsNewShootModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            disabled={!newShootData.client || !newShootData.date || isCreating}
                            onClick={handleCreateShoot}
                            className={`h-10 px-6 font-bold uppercase tracking-widest shadow-lg ${isCreating ? '!bg-blue-400 cursor-not-allowed opacity-80' : '!bg-blue-600 hover:!bg-blue-700'} !text-white !border-none transition-all flex items-center justify-center min-w-[160px]`}
                        >
                            {isCreating ? (
                                <><i className="fa-solid fa-spinner animate-spin mr-2 shrink-0"></i> Criando...</>
                            ) : (
                                'Criar Gravação'
                            )}
                        </Button>
                    </div>
                </Card>
            </div>
        );

        return typeof window !== 'undefined' ? ReactDOM.createPortal(modalContent, document.body) : modalContent;
    };

    const renderActiveShootView = () => {
        if (!activeShoot) return null;

        const p = calculateProgress(activeShoot);
        const isMasterReady = p.percentage === 100 && p.total > 0;
        const colorByCat: Record<string, string> = { 'levar': 'blue', 'trazer': 'emerald', 'gravar': 'purple' };
        
        const checklistCategories = [
            { id: 'levar', category: '📦 O QUE LEVAR', color: 'blue', items: activeShoot.itens_levar || [] },
            { id: 'trazer', category: '🔄 O QUE TRAZER DE VOLTA', color: 'emerald', items: activeShoot.itens_trazer || [] },
            { id: 'gravar', category: '🎬 O QUE GRAVAR', color: 'purple', items: activeShoot.itens_gravar || [] }
        ];

        return (
            <div className="view-root absolute inset-0 bg-zinc-50 dark:bg-zinc-950 flex flex-col z-[40] animate-in fade-in duration-200" onKeyDown={(e) => e.key === 'Escape' && setActiveShootId(null)}>
                {/* Internal Header */}
                <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                         <div className="group cursor-pointer flex items-center gap-3 pr-4 border-r border-zinc-200 dark:border-zinc-800 transition-all hover:-translate-x-1" onClick={() => { tryPlaySound('close'); setActiveShootId(null); }}>
                             <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 dark:group-hover:border-zinc-600 transition-all shadow-sm">
                                <ArrowLeft size={16} className="mb-0.5 shrink-0" />
                                <span className="text-[8px] font-black uppercase tracking-widest leading-none">Voltar</span>
                             </div>
                         </div>
                         <div className="flex flex-col min-w-0 pr-2 relative">
                             {/* Indicator de Salvando */}
                             {isSaving && (
                                <span className="absolute -top-3 left-0 text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1 animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Salvando</span>
                             )}
                             <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 truncate flex items-center gap-2">
                                {activeShoot.title}
                            </h2>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <Badge color="slate" className="text-[10px] uppercase font-bold tracking-widest shadow-sm">{activeShoot.client}</Badge>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                    <Calendar size={12} className="shrink-0" /> {new Date(activeShoot.date).toLocaleDateString('pt-BR')} 
                                    {activeShoot.time && <><span className="opacity-30">|</span> {activeShoot.time}</>}
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 uppercase tracking-widest px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30">
                                   <MapPin size={12} className="shrink-0"/> {activeShoot.location || 'Local a definir'}
                                </div>
                            </div>
                         </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                             <Button 
                                variant={activeShoot.status === 'done' ? 'secondary' : 'primary'} 
                                onClick={() => {
                                    tryPlaySound('success');
                                    onUpdate(activeShoot.id, 'CHECKLISTS', 'status', activeShoot.status === 'done' ? 'ready' : 'done', true);
                                }}
                                className={`text-[10px] font-bold uppercase tracking-widest !h-9 !rounded-xl !border-none ${activeShoot.status === 'done' ? '!bg-zinc-100 dark:!bg-zinc-800 !text-zinc-500' : isMasterReady ? '!bg-emerald-500 hover:!bg-emerald-600 !text-white shadow-lg shadow-emerald-500/20 animate-pulse' : '!bg-blue-600 hover:!bg-blue-700 !text-white shadow-lg'}`}
                             >
                                 <CheckCircle2 size={14} className="mr-1.5 shrink-0" /> 
                                 {activeShoot.status === 'done' ? 'Desconcluir Gravação' : 'Finalizar Gravação'}
                             </Button>
                             <Button variant="danger" onClick={() => handleDeleteShoot(activeShoot.id)} className="h-9 w-9 p-0 flex items-center justify-center !rounded-xl shadow-sm"><Trash2 size={14} className="shrink-0"/></Button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar Master */}
                <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 relative shadow-inner overflow-hidden shrink-0">
                    <div 
                        className={`h-full absolute left-0 top-0 transition-all duration-700 ease-in-out ${activeShoot.status === 'done' ? 'bg-indigo-500' : isMasterReady ? 'bg-emerald-500 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:20px_20px] animate-stripes' : 'bg-blue-500'}`} 
                        style={{ width: `${p.percentage}%` }}
                    ></div>
                </div>

                {/* Overview Notes (If present) */}
                {activeShoot.notes && (
                    <div className="mx-6 mt-6 px-4 py-3 bg-amber-50 dark:bg-amber-500/5 rounded-xl border-l-4 border-amber-400 dark:border-amber-500 flex items-start gap-3 shadow-sm shrink-0">
                         <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                         <p className="text-xs font-bold text-amber-700 dark:text-amber-500/90 leading-relaxed uppercase tracking-wide">{activeShoot.notes}</p>
                    </div>
                )}

                {/* 3 Columns Flex Layout */}
                <div className="flex-1 overflow-x-hidden overflow-y-auto px-6 py-6 custom-scrollbar">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full items-start">
                        {checklistCategories.map((category: any) => {
                            const cColor = colorByCat[category.id] || 'blue'; // blue, emerald, purple
                            const isScene = category.id === 'gravar';

                            return (
                                <Card key={category.id} className="h-auto flex flex-col shadow-xl !border-0 bg-white dark:bg-zinc-900 !rounded-[2rem] overflow-hidden relative">
                                    <div className={`absolute top-0 left-0 right-0 h-1.5 ${cColor === 'blue' ? 'bg-blue-500' : cColor === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'}`}></div>
                                    <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                                        <h3 className={`text-sm font-black uppercase tracking-widest ${cColor === 'blue' ? 'text-blue-600 dark:text-blue-400' : cColor === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-purple-600 dark:text-purple-400'}`}>
                                            {category.category}
                                        </h3>
                                        <span className="text-[10px] font-bold text-zinc-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                                            {category.items.filter((i:any)=>i.checked).length}/{category.items.length}
                                        </span>
                                    </div>
                                    
                                    <div className="p-5 space-y-3 flex-1 overflow-y-auto custom-scrollbar-mini min-h-[300px]">
                                        {category.items.map((item: any) => (
                                            <div 
                                                key={item.id}
                                                className={`group flex items-start gap-3 p-3 rounded-xl border transition-all ${item.checked ? `bg-zinc-50 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800` : `bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-${cColor}-300 dark:hover:border-${cColor}-700`}`}
                                            >
                                                <div 
                                                    onClick={() => toggleChecklistItem(activeShoot.id, category.id, item.id)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer shrink-0 transition-all ${
                                                        item.checked 
                                                            ? `bg-${cColor === 'emerald' ? 'emerald' : cColor === 'blue' ? 'blue' : 'purple'}-500 border-${cColor === 'emerald' ? 'emerald' : cColor === 'blue' ? 'blue' : 'purple'}-500 shadow-lg shadow-${cColor}-500/20` 
                                                            : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
                                                    }`}
                                                >
                                                    {item.checked && <Check size={12} strokeWidth={4} className="text-white shrink-0" />}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <span className={`block text-[11px] font-bold transition-all uppercase tracking-tight ${item.checked ? 'text-zinc-400 dark:text-zinc-500 line-through opacity-70' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                        {item.text}
                                                    </span>
                                                    {isScene && item.type && (
                                                        <Badge color="slate" className={`mt-2 !text-[8px] !font-black !uppercase transition-all tracking-widest ${item.checked ? 'opacity-40 grayscale' : ''}`}>
                                                            {item.type}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveItem(activeShoot.id, category.id, item.id); }}
                                                    className="ml-auto p-1.5 rounded-lg text-zinc-300 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-500 transition-all flex items-center justify-center shrink-0 mt-0.5 opacity-0 group-hover:opacity-100"
                                                    title="Excluir item"
                                                >
                                                    <X size={14} strokeWidth={2.5} className="shrink-0"/>
                                                </button>
                                            </div>
                                        ))}

                                        {/* INLINE NEW ITEM INPUT */}
                                        {addingItemToCategory === category.id && (
                                            <div className={`group flex items-start gap-3 p-3 rounded-xl border bg-white dark:bg-zinc-900 border-${cColor}-300 dark:border-${cColor}-700 shadow-sm transition-all`}>
                                                <div className="mt-0.5 shrink-0 transition-colors">
                                                    <Square size={18} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
                                                </div>
                                                <div className="flex-1 w-full flex flex-col gap-2">
                                                    {isScene && (
                                                        <select 
                                                            value={newSceneType} 
                                                            onChange={(e) => setNewSceneType(e.target.value)}
                                                            className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg h-7 text-[10px] font-bold uppercase text-zinc-600 dark:text-zinc-400 px-2 outline-none focus:border-purple-500 shadow-sm"
                                                        >
                                                            <option>Feed/YouTube</option>
                                                            <option>Reels</option>
                                                            <option>B-Roll</option>
                                                            <option>Entrevista</option>
                                                            <option>Cena Específica</option>
                                                        </select>
                                                    )}
                                                    <input 
                                                        type="text" 
                                                        autoFocus
                                                        placeholder={isScene ? "+ Roteiro/Cena" : "Digite e aperte Enter..."}
                                                        value={newItemTexts[category.id] || ''}
                                                        onChange={(e) => setNewItemTexts({ ...newItemTexts, [category.id]: e.target.value })}
                                                        onBlur={() => {
                                                            if (newItemTexts[category.id]?.trim()) {
                                                                handleAddItem(activeShoot.id, category.id, newItemTexts[category.id]);
                                                            }
                                                            setAddingItemToCategory(null);
                                                            setNewItemTexts(prev => ({ ...prev, [category.id]: '' }));
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                if (newItemTexts[category.id]?.trim()) {
                                                                    handleAddItem(activeShoot.id, category.id, newItemTexts[category.id]);
                                                                    setNewItemTexts(prev => ({ ...prev, [category.id]: '' }));
                                                                } else {
                                                                    setAddingItemToCategory(null);
                                                                }
                                                            } else if (e.key === 'Escape') {
                                                                setAddingItemToCategory(null);
                                                                setNewItemTexts(prev => ({ ...prev, [category.id]: '' }));
                                                            }
                                                        }}
                                                        className="w-full bg-transparent border-none text-xs font-bold text-zinc-800 dark:text-zinc-200 outline-none p-0 focus:ring-0 placeholder:text-zinc-400"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {addingItemToCategory !== category.id && (
                                            <button 
                                                onClick={() => setAddingItemToCategory(category.id)}
                                                className={`flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-${cColor}-500 py-2 transition-colors inline-block`}
                                            >
                                                <Plus size={14} className="inline shrink-0"/> Adicionar item
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="view-root flex flex-col h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors relative">
            
            {/* RENDER ACTIVE DIARY (If Open) */}
            {renderActiveShootView()}

            {/* HEADER LIST VIEW */}
            <div className={`flex items-center justify-between flex-wrap gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 transition-opacity duration-300 ${activeShootId ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <Video size={20} className="shrink-0" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Gravações</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Organize seus Dias de Gravação e Logística</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 group hidden sm:flex h-10 w-64 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl px-3 focus-within:ring-2 focus-within:ring-indigo-500/20 border border-transparent focus-within:border-indigo-500/30 transition-all shadow-inner">
                        <Search className="text-zinc-400 w-4 h-4 shrink-0 transition-colors group-focus-within:text-indigo-500" />
                        <input
                            type="text"
                            placeholder="Buscar gravações..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 min-w-0"
                        />
                    </div>
                    <Button
                        onClick={() => { tryPlaySound('open'); setIsNewShootModalOpen(true); }}
                        className="h-10 px-5 text-[11px] font-bold uppercase tracking-widest bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg hover:scale-105 transition-transform !border-none"
                    >
                        <Plus size={16} className="mr-1.5 shrink-0" /> Nova Gravação
                    </Button>
                </div>
            </div>

            {/* LIST AREA (GRID 2 COLS) */}
            <div className={`flex-1 overflow-y-auto px-6 py-8 transition-opacity duration-300 custom-scrollbar ${activeShootId ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'}`}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredShoots.map(shoot => {
                            const p = calculateProgress(shoot);
                            const clientData = clients.find(c => c.Nome === shoot.client);
                            const clientColor = clientData?.['Cor (HEX)'] || '#6366f1';
                            
                            return (
                                <Card 
                                    key={shoot.id} 
                                    id={`shoot-card-${shoot.id}`}
                                    onClick={() => { tryPlaySound('tap'); setActiveShootId(shoot.id); }}
                                    className="cursor-pointer group flex flex-col sm:flex-row shadow-xl shadow-zinc-200/50 dark:shadow-none !border-zinc-200/50 dark:!border-zinc-800 bg-white dark:bg-zinc-900/80 transition-all hover:scale-[1.01] hover:shadow-2xl overflow-hidden p-0 rounded-[2rem]"
                                >
                                    <div className="w-full sm:w-2 bg-zinc-100 dark:bg-zinc-800 relative h-2 sm:h-auto">
                                        <div className="absolute top-0 bottom-0 left-0 right-0 opacity-80" style={{ backgroundColor: clientColor }}></div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                                <Badge color="slate" className="!text-[10px] !uppercase !tracking-widest !bg-zinc-100 dark:!bg-zinc-800 flex items-center gap-1.5 shadow-sm">
                                                    <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: clientColor }}></span>
                                                    {shoot.client}
                                                </Badge>
                                                
                                                {shoot.status === 'done' ? (
                                                     <Badge color="blue" className="!bg-indigo-500 !text-white !border-indigo-600 shadow-sm flex items-center gap-1">Concluído <CheckCircle2 size={12}/></Badge>
                                                ) : shoot.status === 'ready' ? (
                                                     <Badge color="emerald" className="!bg-emerald-500 !text-white !border-emerald-600 shadow-sm">Em andamento</Badge>
                                                ) : (
                                                     <Badge color="slate" className="shadow-sm border border-zinc-200">Planejada</Badge>
                                                )}
                                            </div>

                                            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50 uppercase tracking-tight mb-3 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                                                {shoot.title}
                                            </h3>

                                            <div className="flex flex-col gap-2 mb-6">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 capitalize bg-zinc-50 dark:bg-zinc-800/50 self-start px-2 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80">
                                                    <Calendar size={13} className="text-zinc-400"/>
                                                    <span>{new Date(shoot.date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</span>
                                                    {shoot.time ? <span className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-700 pl-2 ml-1"><Clock size={13} className="text-zinc-400"/> {shoot.time}</span> : null}
                                                </div>
                                                {shoot.location && (
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 self-start px-2 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800/80 max-w-full">
                                                        <MapPin size={13} className="text-zinc-400 shrink-0"/>
                                                        <span className="truncate">{shoot.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
                                             <div className="flex justify-between items-end mb-2">
                                                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progresso</span>
                                                 <span className={`text-[10px] font-black uppercase tracking-widest ${p.percentage === 100 && p.total > 0 ? 'text-emerald-500' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                                     {p.checked} de {p.total} listados
                                                 </span>
                                             </div>
                                             <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
                                                 <div 
                                                     className={`h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-700 ease-in-out ${p.percentage === 100 && p.total > 0 ? '!bg-emerald-500' : ''}`}
                                                     style={{ width: `${p.percentage}%` }}
                                                 ></div>
                                             </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                    {filteredShoots.length === 0 && (
                        <div className="text-center py-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] mt-8 bg-zinc-50/50 dark:bg-zinc-900/20">
                            <Video size={48} className="mb-6 text-zinc-300 dark:text-zinc-700/50" strokeWidth={1}/>
                            <h3 className="text-lg font-black uppercase tracking-tight text-zinc-400 mb-2">Plataforma Livre</h3>
                            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest w-2/3">Ainda não há nenhuma gravação registrada no calendário da agência.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RENDER MODAL OUTSIDE FLOW OVERALL (Uses Portal in body hook implicitly above) */}
            {renderNewShootModal()}

        </div>
    );
}
