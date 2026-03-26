import React, { useState, useEffect } from 'react';
import {
    ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard,
    Search, Plus, X, ArrowUpRight, ArrowDownRight,
    DollarSign, BarChart3, Filter, Trash2, Edit3, Clock,
    PieChart, ChevronDown, Repeat, CalendarClock, Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Badge, Button, InputSelect } from '../Components';

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
        <div className="p-6 lg:p-8 font-sans bg-gray-50 dark:bg-[#0a0a0c] min-h-screen text-gray-900 dark:text-zinc-200 overflow-y-auto custom-scrollbar">
            
            {/* HEADER */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Finanças</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Gestão Estratégica de Caixa</p>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    label="Receita Total" 
                    value={formatBRL(summary.receita)} 
                    icon={ArrowUpCircle} 
                    trend={{ value: 12.5, isUp: true }}
                    color="emerald"
                />
                <StatCard 
                    label="Despesas Totais" 
                    value={formatBRL(summary.despesas)} 
                    icon={ArrowDownCircle} 
                    trend={{ value: 4.2, isUp: true }}
                    color="rose"
                />
                <StatCard 
                    label="Saldo Disponível" 
                    value={formatBRL(saldoFinal)} 
                    icon={Wallet} 
                    trend={{ value: 8.9, isUp: true }}
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
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                <div className="xl:col-span-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-8 rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <BarChart3 size={20} className="text-indigo-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Fluxo de Caixa 2024</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(val) => `R$${val/1000}k`} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="entradas" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
                                <Bar dataKey="saidas" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-8 rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <PieChart size={20} className="text-emerald-500" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Profit Sharing (30/30/40)</h3>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Pedro (30%)', value: proLaborePedro, color: 'emerald' },
                            { label: 'Lucas (30%)', value: proLaboreLucas, color: 'emerald' },
                            { label: 'Agência (40%)', value: caixaAgencia, color: 'indigo' }
                        ].map((item, i) => (
                            <div key={i} className="flex justify-between items-center p-5 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border border-gray-100 dark:border-zinc-800/50">
                                <div>
                                    <p className="text-xs font-black text-gray-900 dark:text-white uppercase">{item.label}</p>
                                    <p className="text-[9px] font-bold text-gray-500 mt-0.5">ESTIMATIVA ATUAL</p>
                                </div>
                                <span className={`text-lg font-black text-${item.color}-500 font-mono`}>{formatBRL(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RECURRING REMINDERS */}
            {recurrences.length > 0 && (
                <div className="mb-8 overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 ml-1">
                        <Repeat size={14} className="text-indigo-500" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Próximos Pagamentos Recorrentes</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {recurrences.map(r => (
                            <div key={r.id} className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                        <CalendarClock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase truncate max-w-[120px]">{r.descricao}</p>
                                        <p className="text-[9px] font-bold text-gray-400">DIA {r.data.split('-')[2]}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-black tabular-nums">{formatBRL(r.valor)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TABLE & FILTERS */}
            <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
                <div className="p-8 border-b border-gray-100 dark:border-zinc-800 flex flex-col xl:flex-row justify-between xl:items-center gap-6 bg-gray-50/30 dark:bg-zinc-900/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest">Histórico de Lançamentos</h3>
                            <p className="text-[10px] font-bold text-gray-500 mt-0.5">Total de {filteredTransactions.length} registros ativos</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-3">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text" placeholder="BUSCAR..."
                                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-[10px] font-black uppercase focus:outline-none focus:border-indigo-500 transition-all font-mono"
                            />
                        </div>
                        <InputSelect 
                            value={filterTipo} onChange={setFilterTipo}
                            options={[{value: 'all', label: 'TODOS OS TIPOS'}, {value: 'entrada', label: 'ENTRADAS'}, {value: 'saida', label: 'SAÍDAS'}]}
                            className="!rounded-xl !text-[10px] !h-12 !min-w-[140px]"
                        />
                        <InputSelect 
                            value={filterCliente} onChange={setFilterCliente}
                            options={[{value: 'all', label: 'TODOS CLIENTES'}, ...(clients?.map((cl: any) => ({value: cl.id, label: (cl.Nome || cl.Nome_Fantasia).toUpperCase()})) || [])]}
                            className="!rounded-xl !text-[10px] !h-12 !min-w-[180px]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-zinc-950/20 border-b border-gray-100 dark:border-zinc-800">
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Data</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descrição</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoria</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Valor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                            {filteredTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                                    <td className="px-8 py-5 text-[11px] font-black font-mono text-gray-500 tabular-nums">
                                        {new Date(tx.data).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-xs font-black uppercase text-gray-900 dark:text-white truncate max-w-[200px]" title={tx.descricao}>{tx.descricao}</p>
                                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">
                                            {clients?.find((cl: any) => cl.id === tx.clienteId)?.Nome || 'AVULSO'}
                                        </p>
                                    </td>
                                    <td className="px-8 py-5">
                                        <Badge color="slate" className="!text-[9px] !px-3 font-black">{tx.categoria.toUpperCase()}</Badge>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className={`flex flex-col font-mono`}>
                                            <span className={`text-sm font-black ${tx.tipo === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {tx.tipo === 'entrada' ? '+' : '-'} {formatBRL(tx.valor)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <Badge color={tx.status === 'pago' ? 'green' : 'orange'} className="shadow-sm">
                                            {tx.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleEdit(tx)} className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(tx.id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                        <div className="py-24 flex flex-col items-center justify-center opacity-20">
                            <Search size={48} />
                            <p className="mt-4 font-black uppercase text-xs tracking-widest">Nenhum Registro</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PREMIUM MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* MODAL HEADER */}
                        <div className="p-10 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-950/20">
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                                    {editingId ? 'Editar Registro' : 'Novo Lançamento'}
                                </h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configure os parâmetros financeiros</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTransaction} className="p-10 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                            <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
                                {[
                                    { id: 'entrada', label: 'RECEITA', color: 'bg-emerald-500', icon: ArrowUpRight },
                                    { id: 'saida', label: 'DESPESA', color: 'bg-rose-500', icon: ArrowDownRight },
                                    { id: 'assinatura', label: 'ASSINATURA', color: 'bg-indigo-600', icon: Repeat }
                                ].map(t => (
                                    <button
                                        key={t.id} type="button"
                                        onClick={() => setFormData({...formData, tipo: t.id, categoria: '', frequencia: t.id === 'assinatura' ? 'mensal' : 'unica'})}
                                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all ${formData.tipo === t.id ? `${t.color} text-white shadow-lg` : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                    >
                                        <t.icon size={14} /> {t.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Valor do Montante</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm group-focus-within:text-app-text-strong transition-colors">R$</span>
                                        <input 
                                            type="number" step="0.01" required
                                            value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl pl-12 pr-6 py-5 text-2xl font-black font-mono focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Data Efetiva</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input 
                                            type="date" required
                                            value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})}
                                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl pl-12 pr-6 py-6 text-[11px] font-black uppercase focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Identificação / Nota</label>
                                <input 
                                    type="text" required
                                    value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})}
                                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-6 py-5 text-xs font-black uppercase tracking-widest focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                    placeholder="DIGITE O NOME DO PROJETO OU COMPRA..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Categoria Estratégica</label>
                                    <input 
                                        type="text" required
                                        value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})}
                                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest mb-2"
                                        placeholder="OUTROS..."
                                    />
                                    <div className="flex flex-wrap gap-1.5">
                                        {CATEGORIAS[formData.tipo]?.map(c => (
                                            <button key={c} type="button" onClick={() => setFormData({...formData, categoria: c})} className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${formData.categoria === c ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-200 dark:border-zinc-800 text-gray-400 hover:border-gray-400'}`}>{c.toUpperCase()}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Vincular Cliente</label>
                                        <InputSelect 
                                            value={formData.clienteId} onChange={v => setFormData({...formData, clienteId: v})}
                                            options={[{value: '', label: 'LANÇAMENTO AVULSO'}, ...(clients?.map((cl: any) => ({value: cl.id, label: (cl.Nome || cl.Nome_Fantasia).toUpperCase()})) || [])]}
                                            className="!rounded-2xl !py-5 !bg-gray-50 dark:!bg-zinc-900 !text-[10px] !h-auto"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Recorrência</label>
                                            <InputSelect 
                                                value={formData.frequencia} onChange={v => setFormData({...formData, frequencia: v})}
                                                options={[{value: 'unica', label: 'ÚNICA'}, {value: 'mensal', label: 'MENSAL'}, {value: 'anual', label: 'ANUAL'}]}
                                                className="!rounded-2xl !py-5 !bg-indigo-500/5 !text-indigo-500 !text-[10px] !h-auto"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Fluxo</label>
                                            <InputSelect 
                                                value={formData.status} onChange={v => setFormData({...formData, status: v})}
                                                options={[{value: 'pago', label: 'CONCLUÍDO'}, {value: 'pendente', label: 'PENDENTE'}]}
                                                className={`!rounded-2xl !py-5 !text-[10px] !h-auto ${formData.status === 'pago' ? '!bg-emerald-500/5 !text-emerald-500' : '!bg-amber-500/5 !text-amber-500'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* MODAL FOOTER */}
                        <div className="p-10 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/20 flex justify-end gap-4">
                            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="!px-8 !py-6 !rounded-2xl text-[10px] font-black uppercase tracking-widest">Descartar</Button>
                            <Button variant="primary" onClick={() => handleSaveTransaction()} className="!px-10 !py-6 !rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20">Finalizar Registro</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAB */}
            <button 
                onClick={() => handleOpenModal('entrada')}
                className="fixed bottom-12 right-12 z-[100] w-20 h-20 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group hover:rotate-90"
            >
                <Plus size={36} strokeWidth={3} />
            </button>

        </div>
    );
}
