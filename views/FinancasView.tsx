import React, { useState, useEffect } from 'react';
import {
    ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard,
    Search, Plus, MoreHorizontal, Calendar, X, ArrowUpRight, ArrowDownRight,
    CheckCircle2, DollarSign, BarChart3, Filter, Trash2, Edit3, Clock,
    PieChart, ChevronDown, Repeat, CalendarClock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
// DADOS MOCK INICIAIS (COM RECORRÊNCIA)
// ==========================================
const CATEGORIAS: Record<string, string[]> = {
    entrada: ['Gestão de Tráfego', 'Social Media', 'Design Gráfico', 'Consultoria', 'Produção de Vídeo'],
    saida: ['Equipamento', 'Software', 'Impostos', 'Marketing', 'Pró-Labore'],
    assinatura: ['Ferramentas IA', 'Hospedagem', 'Bancos de Imagem', 'Outros']
};

export default function FinancasTab({ data = [], onAdd, onUpdate, onDelete, clients }: any) {
    const [searchQuery, setSearchQuery] = useState('');

    // Estados do Modal de Criação / Edição
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        tipo: 'entrada',
        categoria: '',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        status: 'pago',
        frequencia: 'unica', // 'unica', 'mensal', 'anual'
        clienteId: ''
    });

    // Estados de Filtro
    const [filterPeriod, setFilterPeriod] = useState('all');
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterCliente, setFilterCliente] = useState('all');

    // Remove accents and ensure standard lowercase format
    const formatType = (tipo: string) => {
        const val = tipo?.toLowerCase()?.normalize("NFD")?.replace(/[\u0300-\u036f]/g, "") || 'entrada';
        if (val.includes('saida') || val.includes('despesa')) return 'saida';
        if (val.includes('assinatura')) return 'assinatura';
        return 'entrada';
    };

    const transactions = React.useMemo(() => {
        return data.map((t: any) => ({
            id: t.id,
            tipo: formatType(t.Tipo),
            categoria: t.Categoria || '',
            descricao: t.Descrição || '',
            valor: parseFloat(t.Valor) || 0,
            data: t.Data || '',
            status: t.Status || 'pago',
            frequencia: t.Recorrência?.toLowerCase() === 'mensal' ? 'mensal' : t.Recorrência?.toLowerCase() === 'anual' ? 'anual' : 'unica',
            clienteId: t.Cliente_ID || '',
            raw: t
        }));
    }, [data]);

    // ==========================================
    // CÁLCULOS DO DASHBOARD
    // ==========================================
    const totais = transactions.reduce((acc, curr) => {
        if (curr.status === 'pago') {
            if (curr.tipo === 'entrada') acc.entradas += curr.valor;
            if (curr.tipo === 'saida') acc.saidas += curr.valor;
            if (curr.tipo === 'assinatura') acc.assinaturas += curr.valor;
        } else if (curr.status === 'pendente' && curr.tipo === 'entrada') {
            acc.aReceber += curr.valor;
        }
        return acc;
    }, { entradas: 0, saidas: 0, despesas: 0, assinaturas: 0, aReceber: 0 });

    totais.despesas = totais.saidas + totais.assinaturas;
    const saldoFinal = totais.entradas - totais.despesas;

    // Cálculos de Pró-Labore (30/30/40)
    const lucroParaDistribuir = saldoFinal > 0 ? saldoFinal : 0;
    const proLaborePedro = lucroParaDistribuir * 0.30;
    const proLaboreLucas = lucroParaDistribuir * 0.30;
    const caixaAgencia = lucroParaDistribuir * 0.40;

    // Agrupamento de Gráfico de Barras Mensal
    const monthlyData = React.useMemo(() => {
        const groups: Record<string, { month: string, entradas: number, saidas: number }> = {};
        transactions.forEach(t => {
            if (!t.data || t.status !== 'pago') return;
            const date = new Date(t.data);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
            
            if (!groups[monthKey]) groups[monthKey] = { month: monthLabel, entradas: 0, saidas: 0 };
            
            if (t.tipo === 'entrada') groups[monthKey].entradas += t.valor;
            else groups[monthKey].saidas += t.valor;
        });

        return Object.keys(groups).sort().map(k => groups[k]);
    }, [transactions]);

    // ==========================================
    // AÇÕES
    // ==========================================
    const handleOpenModal = (tipoPreDefinido = 'entrada') => {
        tryPlaySound('open');
        setEditingId(null);
        setFormData({
            tipo: tipoPreDefinido,
            categoria: '',
            descricao: '',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            status: 'pago',
            // Assinaturas costumam ser mensais por predefinição
            frequencia: tipoPreDefinido === 'assinatura' ? 'mensal' : 'unica',
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
            clienteId: tx.clienteId || ''
        });
        setIsModalOpen(true);
    };

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.valor || !formData.descricao || !formData.categoria) return;

        tryPlaySound('success');

        const dbItem = {
            Tipo: formData.tipo === 'entrada' ? 'Entrada' : formData.tipo === 'assinatura' ? 'Assinatura' : 'Saída',
            Categoria: formData.categoria,
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
        tryPlaySound('close');
        if (onDelete) onDelete([id], 'FINANCAS');
    };

    const filteredTransactions = transactions.filter(t => {
        const matchSearch = t.descricao.toLowerCase().includes(searchQuery.toLowerCase()) || t.categoria.toLowerCase().includes(searchQuery.toLowerCase());
        const matchTipo = filterTipo === 'all' || t.tipo === filterTipo || (filterTipo === 'saida' && t.tipo === 'assinatura');
        const matchCliente = filterCliente === 'all' || t.clienteId === filterCliente;
        
        let matchPeriod = true;
        if (filterPeriod !== 'all' && t.data) {
            const now = new Date();
            const txDate = new Date(t.data);
            if (filterPeriod === 'month') {
                matchPeriod = txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
            } else if (filterPeriod === 'lastMonth') {
                const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                matchPeriod = txDate.getMonth() === lastMonth && txDate.getFullYear() === year;
            }
        }

        return matchSearch && matchTipo && matchCliente && matchPeriod;
    });

    return (
        <div className="p-6 lg:p-8 font-sans bg-gray-50 dark:bg-[#0a0a0c] min-h-screen text-gray-900 dark:text-zinc-200 overflow-y-auto custom-scrollbar" >

            {/* =========================================
          CABEÇALHO
          ========================================= */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 w-full">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Finanças</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">
                        Gestão de Caixa e Lançamentos
                    </p>
                </div>
            </div>

            <div className="w-full">
                {/* =========================================
            CARDS DE RESUMO
            ========================================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                    {/* Card Entradas */}
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between group hover:border-emerald-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                <ArrowUpCircle size={16} /> Receita Total
                            </span>
                            <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><ArrowUpRight size={12}/> 12.5%</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formatBRL(totais.entradas)}</span>
                        </div>
                    </div>

                    {/* Card Saídas */}
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between group hover:border-rose-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500 flex items-center gap-2">
                                <ArrowDownCircle size={16} /> Despesas
                            </span>
                            <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><ArrowUpRight size={12}/> 4.2%</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formatBRL(totais.despesas)}</span>
                        </div>
                    </div>

                    {/* Card Saldo */}
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between group hover:border-indigo-500/50 transition-colors relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-4 translate-y-4">
                            <Wallet size={80} />
                        </div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 flex items-center gap-2">
                                <Wallet size={16} /> Saldo Atual
                            </span>
                            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md flex items-center gap-1"><ArrowUpRight size={12}/> 8.9%</span>
                        </div>
                        <div className="flex items-end justify-between relative z-10">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formatBRL(saldoFinal)}</span>
                        </div>
                    </div>

                    {/* Card A Receber */}
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col justify-between group hover:border-amber-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                                <Clock size={16} /> A Receber
                            </span>
                            <span className="text-[10px] font-black text-gray-400 bg-gray-50 dark:bg-zinc-800 px-2 py-0.5 rounded-md">PENDENTES</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-black text-gray-900 dark:text-white">{formatBRL(totais.aReceber)}</span>
                        </div>
                    </div>
                </div>

                {/* =========================================
            GRÁFICO E PRÓ-LABORE
            ========================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    <div className="lg:col-span-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-indigo-500" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300">Fluxo de Caixa Mensal</h3>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-[250px] min-h-[250px]">
                            {monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#888' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                                        <Tooltip 
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ backgroundColor: '#111114', border: '1px solid #27272a', borderRadius: '12px', color: '#fff' }}
                                            formatter={(value: number) => [formatBRL(value), '']}
                                        />
                                        <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs font-bold text-gray-400 uppercase tracking-widest">Sem dados suficientes</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-6">
                            <PieChart size={18} className="text-emerald-500" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300">Distribuição (30/30/40)</h3>
                        </div>

                        <div className="space-y-5">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800/80">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Pró-Labore Pedro</p>
                                    <p className="text-[10px] font-bold uppercase text-gray-500">30% do Saldo</p>
                                </div>
                                <span className="text-lg font-black text-emerald-600">{formatBRL(proLaborePedro)}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800/80">
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">Pró-Labore Lucas</p>
                                    <p className="text-[10px] font-bold uppercase text-gray-500">30% do Saldo</p>
                                </div>
                                <span className="text-lg font-black text-emerald-600">{formatBRL(proLaboreLucas)}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                                <div>
                                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-400">Caixa Agência</p>
                                    <p className="text-[10px] font-bold uppercase text-indigo-500/70 dark:text-indigo-500">40% do Saldo</p>
                                </div>
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{formatBRL(caixaAgencia)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================================
            LEMBRETES DE PAGAMENTOS RECORRENTES
            ========================================= */}
                {transactions.some(t => t.frequencia !== 'unica' && t.tipo !== 'entrada') && (
                    <div className="mb-8 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                                <CalendarClock size={18} className="text-indigo-500" /> Lembretes de Vencimento
                            </h3>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full uppercase tracking-widest">
                                Gerado Automaticamente
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {transactions
                                .filter(t => t.frequencia !== 'unica' && t.tipo !== 'entrada')
                                .map(tx => (
                                    <div key={`rec-${tx.id}`} className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-[#151518] flex flex-col relative overflow-hidden group hover:border-indigo-300 dark:hover:border-zinc-600 transition-colors">
                                        {/* Barra lateral de cor */}
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${tx.tipo === 'assinatura' ? 'bg-purple-500' : 'bg-rose-500'}`}></div>

                                        <div className="pl-3 flex flex-col h-full">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-500 mb-1 flex items-center gap-1.5">
                                                <Calendar size={12} /> Todo dia {tx.data.split('-')[2]}
                                            </span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-4 line-clamp-1" title={tx.descricao}>
                                                {tx.descricao}
                                            </span>
                                            <div className="mt-auto flex items-center justify-between">
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                                    <Repeat size={12} /> {tx.frequencia}
                                                </span>
                                                <span className="text-sm font-black font-mono text-gray-900 dark:text-white">{formatBRL(tx.valor)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* =========================================
            HISTÓRICO DE LANÇAMENTOS
            ========================================= */}
                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">

                    <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 dark:bg-zinc-900/30">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                            <Calendar size={16} className="text-indigo-500" /> Histórico Completo
                        </h3>

                        <div className="flex flex-col lg:flex-row items-center gap-3 w-full md:w-auto">
                            {/* Filter Periodo */}
                            <select
                                value={filterPeriod}
                                onChange={(e) => setFilterPeriod(e.target.value)}
                                className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 w-full sm:w-auto text-gray-700 dark:text-zinc-300"
                            >
                                <option value="all">Todo o Período</option>
                                <option value="month">Este Mês</option>
                                <option value="lastMonth">Mês Passado</option>
                            </select>

                            {/* Filter Tipo */}
                            <select
                                value={filterTipo}
                                onChange={(e) => setFilterTipo(e.target.value)}
                                className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 w-full sm:w-auto text-gray-700 dark:text-zinc-300"
                            >
                                <option value="all">Tipos (Entrada/Saída)</option>
                                <option value="entrada">Apenas Entradas</option>
                                <option value="saida">Apenas Saídas</option>
                            </select>

                            {/* Filter Cliente */}
                            <select
                                value={filterCliente}
                                onChange={(e) => setFilterCliente(e.target.value)}
                                className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs font-bold uppercase tracking-wider rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 w-full lg:w-48 text-gray-700 dark:text-zinc-300 truncate"
                            >
                                <option value="all">Todos os Clientes</option>
                                {clients?.map((c: any) => (
                                    <option key={c.id} value={c.id}>{c.Nome || c.Nome_Fantasia}</option>
                                ))}
                            </select>

                            {/* Search */}
                            <div className="relative w-full lg:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar lançamento..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-xs font-medium rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Descrição & Categoria</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-right">Valor</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                                {filteredTransactions.map((tx) => {
                                    const txClient = clients?.find((c: any) => c.id === tx.clienteId);
                                    
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 even:bg-gray-50/30 dark:even:bg-zinc-900/10 transition-colors group">
                                            
                                            {/* DATA */}
                                            <td className="px-6 py-4 w-[120px]">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">{new Date(tx.data).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </td>

                                            {/* DESCRIÇÃO E CLIENTE */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[300px]" title={tx.descricao}>{tx.descricao}</span>
                                                    {txClient ? (
                                                        <div className="flex items-center gap-1.5 w-fit bg-gray-100 dark:bg-zinc-800 pr-2 rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700">
                                                            <div className="w-5 h-5 flex flex-shrink-0 items-center justify-center text-[9px] font-black text-white" style={{ backgroundColor: txClient.Cor || '#6366f1' }}>
                                                                {(txClient.Nome || txClient.Nome_Fantasia || 'C').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-300 truncate max-w-[120px]">
                                                                {txClient.Nome || txClient.Nome_Fantasia}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 italic">Sem cliente</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* CATEGORIA/BADGE */}
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest truncate max-w-[120px]" title={tx.categoria}>
                                                    {tx.categoria}
                                                </span>
                                            </td>

                                            {/* TIPO */}
                                            <td className="px-6 py-4">
                                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${tx.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                    tx.tipo === 'assinatura' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                                        'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                                    }`}>
                                                    {tx.tipo === 'entrada' ? <ArrowUpCircle size={14} /> : tx.tipo === 'assinatura' ? <CreditCard size={14} /> : <ArrowDownCircle size={14} />}
                                                    {tx.tipo}
                                                </div>
                                            </td>

                                            {/* VALOR */}
                                            <td className="px-6 py-4 text-right">
                                                <span className={`text-sm font-black font-mono ${tx.tipo === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {tx.tipo === 'entrada' ? '+' : '-'} {formatBRL(tx.valor)}
                                                </span>
                                            </td>

                                            {/* STATUS */}
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tx.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                    }`}>
                                                    {tx.status === 'pago' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                    {tx.status}
                                                </span>
                                            </td>

                                            {/* AÇÕES */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(tx)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {filteredTransactions.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-zinc-500">
                                            Nenhum lançamento encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* =========================================
          MODAL DE CRIAÇÃO
          ========================================= */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>

                        <div className="relative w-full max-w-xl bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                            <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#0a0a0c]/50">
                                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                    <DollarSign className="text-indigo-500" /> {editingId ? 'Editar Lançamento' : 'Registrar Lançamento'}
                                </h2>
                                <button onClick={() => { tryPlaySound('close'); setIsModalOpen(false); setEditingId(null); }} className="p-1.5 text-gray-400 hover:text-rose-500 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors ios-btn">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveTransaction} className="p-6 space-y-5">

                                {/* Seleção de Tipo */}
                                <div className="flex p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
                                    {[
                                        { id: 'entrada', label: 'Entrada', color: 'text-emerald-600' },
                                        { id: 'saida', label: 'Saída/Despesa', color: 'text-rose-600' },
                                        { id: 'assinatura', label: 'Assinatura', color: 'text-purple-600' }
                                    ].map(t => (
                                        <button
                                            key={t.id} type="button"
                                            onClick={() => {
                                                tryPlaySound('tap');
                                                setFormData({
                                                    ...formData,
                                                    tipo: t.id,
                                                    categoria: '',
                                                    frequencia: t.id === 'assinatura' ? 'mensal' : 'unica' // Assinatura sugere 'mensal'
                                                });
                                            }}
                                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${formData.tipo === t.id ? `bg-white dark:bg-zinc-800 shadow-sm ${t.color}` : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400'}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Valor (R$)</label>
                                        <input
                                            type="number" step="0.01" required autoFocus
                                            value={formData.valor}
                                            onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                            placeholder="0.00"
                                            className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-lg font-black font-mono rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Data do Ocorrido / Vencimento</label>
                                        <input
                                            type="date" required
                                            value={formData.data}
                                            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Descrição Breve</label>
                                    <input
                                        type="text" required
                                        value={formData.descricao}
                                        onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                        placeholder="Ex: Pagamento Cliente XYZ, Compra de Mouse..."
                                        className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>

                                {/* INPUT DE CATEGORIA E FREQUÊNCIA */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Categoria (Digite ou Escolha)</label>
                                        <input
                                            type="text" required
                                            value={formData.categoria}
                                            onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                            placeholder="Escreva a categoria..."
                                            className="w-full bg-white dark:bg-[#151518] border border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                                        />
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {CATEGORIAS[formData.tipo].map(cat => (
                                                <button
                                                    key={cat} type="button"
                                                    onClick={() => { tryPlaySound('tap'); setFormData({ ...formData, categoria: cat }); }}
                                                    className="px-2 py-1 bg-gray-100 hover:bg-indigo-50 dark:bg-zinc-800 dark:hover:bg-indigo-500/20 text-gray-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors"
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* SELECT DE CLIENTE */}
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Vincular Cliente (Opcional)</label>
                                            <div className="relative">
                                                <select
                                                    value={formData.clienteId}
                                                    onChange={(e) => setFormData({ ...formData, clienteId: e.target.value })}
                                                    className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-bold rounded-xl pl-4 pr-10 py-3 focus:outline-none cursor-pointer appearance-none"
                                                >
                                                    <option value="">Nenhum</option>
                                                    {clients?.map((c: any) => (
                                                        <option key={c.id} value={c.id}>{c.Nome || c.Nome_Fantasia}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        {/* SELECT DE FREQUÊNCIA E STATUS */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                                                    <Repeat size={12} /> Recorrência
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.frequencia}
                                                        onChange={(e) => setFormData({ ...formData, frequencia: e.target.value })}
                                                        className="w-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-sm font-bold rounded-xl pl-3 pr-8 py-3 focus:outline-none cursor-pointer appearance-none"
                                                    >
                                                        <option value="unica">Único</option>
                                                        <option value="mensal">Mensal</option>
                                                        <option value="anual">Anual</option>
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Status</label>
                                                <div className="relative">
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                        className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-bold rounded-xl pl-3 pr-8 py-3 focus:outline-none cursor-pointer appearance-none"
                                                    >
                                                        <option value="pago">Efetuado</option>
                                                        <option value="pendente">Pendente</option>
                                                    </select>
                                                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3 mt-4">
                                    <button type="button" onClick={() => { tryPlaySound('close'); setIsModalOpen(false); setEditingId(null); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors ios-btn">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all ios-btn">
                                        {editingId ? 'Salvar Alterações' : 'Salvar Lançamento'}
                                    </button>
                                </div>

                            </form>
                        </div>
                    </div>
                )
            }

            {/* =========================================
            FAB (FLOATING ACTION BUTTON)
            ========================================= */}
            <button
                onClick={() => handleOpenModal('entrada')}
                className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-[80] w-14 h-14 md:w-16 md:h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 group"
            >
                <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" strokeWidth={2.5} />
            </button>

        </div >
    );
}
