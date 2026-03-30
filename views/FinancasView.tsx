import React, { useState, useEffect } from 'react';
import {
    ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard,
    Search, Plus, X, ArrowUpRight, ArrowDownRight,
    DollarSign, BarChart3, Filter, Trash2, Edit3, Clock,
    PieChart, ChevronDown, Repeat, CalendarClock, Calendar, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Badge, Button, InputSelect, Card } from '../Components';

// ==========================================
// FUNÇÕES AUXILIARES DE SOM E FORMATAÇÃO
// ==========================================
const tryPlaySound = (type: string) => {
    if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
};

const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

// ==========================================
// CONFIGURAÇÕES E CONSTANTES
// ==========================================
const CATEGORIAS: Record<string, string[]> = {
    entrada: ['Gestão de Tráfego', 'Social Media', 'Design Gráfico', 'Consultoria', 'Produção de Vídeo', 'Outros'],
    saida: ['Equipamento', 'Software', 'Impostos', 'Marketing', 'Pró-Labore', 'Hospedagem', 'Infraestrutura', 'Outros'],
    assinatura: ['Streaming', 'SaaS', 'Hospedagem', 'Internet', 'Seguros', 'Outros']
};

export default function FinancasTab({ data = [], onAdd, onUpdate, onDelete, clients }: any) {
    const [searchQuery, setSearchQuery] = useState('');

    // Estados do Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        tipo: 'entrada',
        categoria: '',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        status: 'pago',
        frequencia: 'unica', 
        clienteId: ''
    });

    // Estados de Filtro
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterCliente, setFilterCliente] = useState('all');

    // Normalização de Dados do Supabase
    const transactions = React.useMemo(() => {
        return data.map((t: any) => {
            const rawType = t.Tipo?.toLowerCase()?.normalize("NFD")?.replace(/[\u0300-\u036f]/g, "") || 'entrada';
            let tipo = 'entrada';
            if (rawType.includes('saida') || rawType.includes('despesa')) tipo = 'saida';
            if (rawType.includes('assinatura')) tipo = 'assinatura';

            return {
                id: t.id,
                tipo,
                categoria: t.Categoria || 'Geral',
                descricao: t.Descrição || '',
                valor: parseFloat(t.Valor) || 0,
                data: t.Data || '',
                status: t.Status || 'pago',
                frequencia: t.Recorrência?.toLowerCase() === 'mensal' ? 'mensal' : t.Recorrência?.toLowerCase() === 'anual' ? 'anual' : 'unica',
                clienteId: t.Cliente_ID || '',
                raw: t
            };
        });
    }, [data]);

    // ==========================================
    // CÁLCULOS DO DASHBOARD
    // ==========================================
    const summary = React.useMemo(() => {
        return transactions.reduce((acc, curr) => {
            if (curr.status === 'pago') {
                if (curr.tipo === 'entrada') acc.receita += curr.valor;
                else acc.despesas += curr.valor;
            } else if (curr.status === 'pendente' && curr.tipo === 'entrada') {
                acc.aReceber += curr.valor;
            }
            return acc;
        }, { receita: 0, despesas: 0, aReceber: 0 });
    }, [transactions]);

    const saldoFinal = summary.receita - summary.despesas;
    const proLaborePedro = Math.max(0, saldoFinal * 0.30);
    const proLaboreLucas = Math.max(0, saldoFinal * 0.30);
    const caixaAgencia = Math.max(0, saldoFinal * 0.40);

    // Dados do Gráfico (Mensal)
    const monthlyData = React.useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const currentYear = new Date().getFullYear();
        const map = months.map(m => ({ month: m, entradas: 0, saidas: 0 }));

        transactions.forEach(t => {
            if (!t.data || t.status !== 'pago') return;
            const d = new Date(t.data);
            if (d.getFullYear() === currentYear) {
                const mIdx = d.getMonth();
                if (t.tipo === 'entrada') map[mIdx].entradas += t.valor;
                else map[mIdx].saidas += t.valor;
            }
        });
        return map;
    }, [transactions]);

    // Lançamentos Recorrentes
    const recurrences = React.useMemo(() => {
        return transactions.filter(t => t.frequencia !== 'unica' && t.tipo !== 'entrada').slice(0, 4);
    }, [transactions]);

    // ==========================================
    // HANDLERS
    // ==========================================
    const handleOpenModal = (tipo = 'entrada') => {
        tryPlaySound('open');
        setEditingId(null);
        setFormData({
            tipo,
            categoria: '',
            descricao: '',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            status: 'pago',
            frequencia: tipo === 'assinatura' ? 'mensal' : 'unica',
            clienteId: ''
        });
        setIsModalOpen(true);
    };

    const handleEdit = (tx: any) => {
        tryPlaySound('open');
        setEditingId(tx.id);
        setFormData({
            tipo: tx.tipo,
            categoria: tx.categoria,
            descricao: tx.descricao,
            valor: tx.valor.toString(),
            data: tx.data.split('T')[0],
            status: tx.status,
            frequencia: tx.frequencia,
            clienteId: tx.clienteId
        });
        setIsModalOpen(true);
    };

    const handleSaveTransaction = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.valor || !formData.descricao) return;

        tryPlaySound('success');
        const dbItem = {
            Tipo: formData.tipo === 'entrada' ? 'Entrada' : formData.tipo === 'assinatura' ? 'Assinatura' : 'Saída',
            Categoria: formData.categoria || 'Geral',
            Descrição: formData.descricao,
            Valor: parseFloat(formData.valor),
            Data: formData.data,
            Status: formData.status,
            Recorrência: formData.frequencia === 'unica' ? 'Única' : formData.frequencia === 'mensal' ? 'Mensal' : 'Anual',
            Cliente_ID: formData.clienteId || null
        };

        if (editingId) {
            if (onUpdate) await onUpdate('FINANCAS', editingId, dbItem);
        } else {
            if (onAdd) await onAdd('FINANCAS', dbItem);
        }

        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Deseja realmente excluir este lançamento?')) {
            tryPlaySound('close');
            if (onDelete) onDelete([id], 'FINANCAS');
        }
    };

    const filteredTransactions = transactions.filter(t => {
        const matchSearch = t.descricao.toLowerCase().includes(searchQuery.toLowerCase()) || t.categoria.toLowerCase().includes(searchQuery.toLowerCase());
        const matchTipo = filterTipo === 'all' || t.tipo === filterTipo;
        const matchCliente = filterCliente === 'all' || t.clienteId === filterCliente;
        return matchSearch && matchTipo && matchCliente;
    });

    return (
        <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden animate-fade">
            
            {/* MODERN HEADER */}
            <div className="shrink-0 flex items-center justify-between flex-wrap gap-4 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Finanças</h1>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-0.5 opacity-60">Gestão estratégica de caixa e rentabilidade.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge color="slate" className="text-[10px] font-black uppercase tracking-widest px-3 py-1">
                        {filteredTransactions.length} Registros
                    </Badge>
                    <Button 
                        onClick={() => handleOpenModal('entrada')}
                        className="!h-10 px-4 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 hover:opacity-90 transition-all shadow-xl shadow-zinc-500/10"
                    >
                        <Plus size={16} className="mr-2" /> Novo Lançamento
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                {/* KPI GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        label="Receita Total" 
                        value={formatBRL(summary.receita)} 
                        icon={ArrowUpCircle} 
                        color="emerald"
                    />
                    <StatCard 
                        label="Despesas Totais" 
                        value={formatBRL(summary.despesas)} 
                        icon={ArrowDownCircle} 
                        color="rose"
                    />
                    <StatCard 
                        label="Saldo Disponível" 
                        value={formatBRL(saldoFinal)} 
                        icon={Wallet} 
                        color="indigo"
                    />
                    <StatCard 
                        label="A Receber" 
                        value={formatBRL(summary.aReceber)} 
                        icon={Clock} 
                        color="amber"
                    />
                </div>

                {/* ANALYTICS & DISTRIBUTION */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <Card title="FLUXO DE CAIXA ANUAL" className="xl:col-span-2 !p-6">
                        <div className="h-[280px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717a', fontWeight: 'bold' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717a', fontWeight: 'bold' }} tickFormatter={(val) => `R$${val/1000}k`} />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                                    />
                                    <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                    <Bar dataKey="saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card title="DISTRIBUIÇÃO ESTRATÉGICA" className="!p-6">
                        <div className="space-y-3 mt-4">
                            {[
                                { label: 'Pro-Labore Pedro (30%)', value: proLaborePedro, color: 'emerald', icon: <DollarSign size={14} /> },
                                { label: 'Pro-Labore Lucas (30%)', value: proLaboreLucas, color: 'emerald', icon: <DollarSign size={14} /> },
                                { label: 'Caixa Agência (40%)', value: caixaAgencia, color: 'blue', icon: <CreditCard size={14} /> }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                                        <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{formatBRL(item.value)}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 text-${item.color}-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                        {item.icon}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* RECURRING REMINDERS */}
                {recurrences.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Repeat size={14} className="text-zinc-900 dark:text-white" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900 dark:text-white">Assinaturas Críticas</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recurrences.map(r => (
                                <div key={r.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm flex items-center justify-between group hover:border-zinc-400 dark:hover:border-zinc-600 transition-all cursor-pointer ring-1 ring-transparent hover:ring-zinc-900/5 dark:hover:ring-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                                            <CalendarClock size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-black text-zinc-900 dark:text-zinc-100 truncate w-32 uppercase tracking-tight">{r.descricao}</p>
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">VENC. DIA {r.data.split('-')[2]}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{formatBRL(r.valor)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TABLE SECTION */}
                <Card title="HISTÓRICO DE LANÇAMENTOS" className="!p-0 overflow-hidden">
                    <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col xl:flex-row justify-between xl:items-center gap-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 w-full md:w-72 group h-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 focus-within:ring-4 focus-within:ring-zinc-500/10 transition-all shadow-sm">
                                <Search className="text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-white transition-colors shrink-0" size={14} />
                                <input 
                                    type="text" placeholder="BUSCAR LANÇAMENTO..."
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 font-sans"
                                />
                            </div>
                            <InputSelect 
                                value={filterTipo} onChange={setFilterTipo}
                                options={[{value: 'all', label: 'TODOS OS TIPOS'}, {value: 'entrada', label: 'RECEITAS'}, {value: 'saida', label: 'DESPESAS'}, {value: 'assinatura', label: 'ASSINATURAS'}]}
                                className="!rounded-xl !text-[9px] !font-black !h-10 border-zinc-200 dark:border-zinc-800"
                            />
                            <InputSelect 
                                value={filterCliente} onChange={setFilterCliente}
                                options={[{value: 'all', label: 'TODOS CLIENTES'}, ...(clients?.map((cl: any) => ({value: cl.id, label: (cl.Nome || cl.Nome_Fantasia).toUpperCase()})) || [])]}
                                className="!rounded-xl !text-[9px] !font-black !h-10 border-zinc-200 dark:border-zinc-800"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                            <thead>
                                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/10">
                                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-[12%]">Venc.</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-[18%]">Cliente</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-[25%]">Descrição</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-[15%]">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-[15%] text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-[15%] text-center">Categoria</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] w-[100px] text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {filteredTransactions.map(tx => (
                                    <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                                        <td className="px-6 py-5 text-[10px] font-black text-zinc-500 tabular-nums truncate" title={new Date(tx.data).toLocaleDateString('pt-BR')}>
                                            {new Date(tx.data).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-5" title={clients?.find((cl: any) => cl.id === tx.clienteId)?.Nome || 'AVULSO'}>
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <Badge color="slate" className="!text-[8px] font-black tracking-widest px-1.5 py-0.5 opacity-60 truncate">
                                                    {clients?.find((cl: any) => cl.id === tx.clienteId)?.Nome || 'AVULSO'}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5" title={tx.descricao}>
                                            <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 truncate uppercase tracking-tight group-hover:text-blue-500 transition-colors">{tx.descricao}</p>
                                        </td>
                                        <td className="px-6 py-5 truncate" title={formatBRL(tx.valor)}>
                                            <span className={`text-xs font-black tabular-nums ${tx.tipo === 'entrada' ? 'text-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.1)]' : 'text-rose-600'}`}>
                                                {tx.tipo === 'entrada' ? '+' : '-'} {formatBRL(tx.valor)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <Badge color={tx.status === 'pago' ? 'emerald' : 'orange'} className="text-[9px] font-black tracking-widest shadow-sm px-3 truncate">
                                                {tx.status.toUpperCase()}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-5 text-center truncate" title={tx.categoria}>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{tx.categoria}</span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(tx)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-800 rounded-lg transition-all hover:scale-110 active:scale-90 border border-zinc-100 dark:border-zinc-700">
                                                    <Edit3 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(tx.id)} className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-rose-500 bg-zinc-50 dark:bg-zinc-800 rounded-lg transition-all hover:scale-110 active:scale-90 border border-zinc-100 dark:border-zinc-700">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTransactions.length === 0 && (
                            <div className="py-24 flex flex-col items-center justify-center opacity-40 bg-zinc-50/50 dark:bg-zinc-900/20">
                                <Wallet size={48} className="text-zinc-300 mb-4" />
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Limbo Financeiro</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* MODERN MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[2200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-fade" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in ring-1 ring-white/10">
                        
                        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.1em]">
                                    {editingId ? 'AJUSTAR LANÇAMENTO' : 'NOVA ENTRADA NO FLUXO'}
                                </h3>
                                <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase tracking-widest opacity-60">Controladoria Estratégica</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:rotate-90 shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTransaction} className="p-8 space-y-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
                            <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-inner">
                                {[
                                    { id: 'entrada', label: 'RECEITA', color: 'bg-emerald-500', icon: ArrowUpRight },
                                    { id: 'saida', label: 'DESPESA', color: 'bg-rose-500', icon: ArrowDownRight },
                                    { id: 'assinatura', label: 'RECORRENTE', color: 'bg-zinc-900 dark:bg-zinc-100', icon: Repeat }
                                ].map(t => (
                                    <button
                                        key={t.id} type="button"
                                        onClick={() => setFormData({...formData, tipo: t.id, categoria: '', frequencia: t.id === 'assinatura' ? 'mensal' : 'unica'})}
                                        className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${formData.tipo === t.id ? `${t.color} ${t.id === 'assinatura' ? 'text-white dark:text-zinc-900' : 'text-white'} shadow-lg scale-105 z-10` : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}`}
                                    >
                                        <t.icon size={13} strokeWidth={3} /> {t.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">VALOR BRUTO</label>
                                    <div className="flex items-center gap-2 group w-full h-12 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 focus-within:border-zinc-900/10 dark:focus-within:border-white/10 transition-all">
                                        <div className="font-black text-zinc-400 text-xs shrink-0">R$</div>
                                        <input 
                                            type="number" step="0.01" required
                                            value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})}
                                            className="flex-1 bg-transparent border-none outline-none text-xl font-black tabular-nums text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 min-w-0 cursor-text"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">DATA EFETIVA</label>
                                    <div className="flex items-center gap-2 w-full h-12 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 focus-within:border-zinc-900/10 dark:focus-within:border-white/10 transition-all">
                                        <Calendar className="text-zinc-400 shrink-0" size={16} />
                                        <input 
                                            type="date" required
                                            value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})}
                                            className="flex-1 bg-transparent border-none outline-none text-[11px] font-black uppercase text-zinc-900 dark:text-zinc-100 min-w-0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">DESCRIÇÃO DO LANÇAMENTO</label>
                                <input 
                                    type="text" required
                                    value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})}
                                    className="w-full h-12 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 text-[11px] font-black uppercase tracking-tight outline-none focus:border-zinc-900/10 dark:focus:border-white/10 transition-all placeholder-zinc-400"
                                    placeholder="EX: MENSALIDADE HUB DESIGN..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">VINCULAR CONTA</label>
                                    <InputSelect 
                                        value={formData.clienteId} onChange={v => setFormData({...formData, clienteId: v})}
                                        options={[{value: '', label: 'LANÇAMENTO AVULSO'}, ...(clients?.map((cl: any) => ({value: cl.id, label: (cl.Nome || cl.Nome_Fantasia).toUpperCase()})) || [])]}
                                        className="!rounded-2xl !h-12 !bg-zinc-50 dark:!bg-zinc-800 border-2 !border-zinc-100 dark:!border-zinc-800 !text-[10px] !font-black !uppercase"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">ESTADO ATUAL</label>
                                    <InputSelect 
                                        value={formData.status} onChange={v => setFormData({...formData, status: v})}
                                        options={[{value: 'pago', label: 'PAGO / RECEBIDO'}, {value: 'pendente', label: 'PENDENTE / AGENDADO'}]}
                                        className={`!rounded-2xl !h-12 border-2 !border-zinc-100 dark:!border-zinc-800 !text-[10px] !font-black !uppercase ${formData.status === 'pago' ? '!text-emerald-500' : '!text-amber-500'}`}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">CATEGORIA ESTRATÉGICA</label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIAS[formData.tipo]?.map(c => (
                                        <button 
                                            key={c} type="button" 
                                            onClick={() => setFormData({...formData, categoria: c})} 
                                            className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 transition-all duration-300 ${formData.categoria === c ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent shadow-xl scale-105' : 'bg-transparent border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </form>

                        <div className="px-8 py-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-rose-500 transition-colors">Abortar</button>
                            <Button 
                                onClick={() => handleSaveTransaction()}
                                className="flex-1 !h-14 !rounded-2xl !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-zinc-500/20 active:scale-95 transition-all"
                            >
                                <CheckCircle2 size={18} className="mr-2" /> {editingId ? 'SALVAR ALTERAÇÕES' : 'EFETIVAR REGISTRO'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* QUICK FAB - hidden on mobile to avoid overlap with global + NOVO FAB */}
            <button 
                onClick={() => handleOpenModal('entrada')}
                className="hidden md:flex fixed bottom-8 right-8 z-[1100] w-16 h-16 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl shadow-2xl items-center justify-center transition-all hover:scale-110 hover:-rotate-6 active:scale-90 group ring-4 ring-zinc-500/10 focus:outline-none"
            >
                <Plus size={32} strokeWidth={3} />
            </button>
        </div>
    );
}
