import React, { useState, useMemo } from 'react';
import {
    ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard,
    Search, Plus, Calendar, X,
    CheckCircle2, DollarSign, BarChart3, Filter, Trash2, Edit3, Clock,
    PieChart, ChevronDown
} from 'lucide-react';
import { playUISound } from '../utils/uiSounds';
import { LancamentoFinancas, TipoTabela, Cliente } from '../types';

// ==========================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO
// ==========================================
const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const CATEGORIAS: Record<string, string[]> = {
    entrada: ['Gestão de Tráfego', 'Social Media', 'Design Gráfico', 'Consultoria', 'Produção de Vídeo'],
    saida: ['Equipamento', 'Software', 'Impostos', 'Marketing', 'Pró-Labore'],
    assinatura: ['Ferramentas IA', 'Hospedagem', 'Bancos de Imagem', 'Outros']
};

interface FinancasViewProps {
    data: LancamentoFinancas[];
    onAdd: (tab: TipoTabela, item: any) => void;
    onUpdate: (tab: TipoTabela, id: string, item: any) => void;
    onDelete: (ids: string[], tab: TipoTabela) => void;
    onArchive: (ids: string[], tab: TipoTabela, arquivar: boolean) => void;
    selection: string[];
    onSelect: (ids: string[]) => void;
    onClearSelection: () => void;
    clients: Cliente[];
    activeClient: Cliente | null;
    onSelectClient: (client: Cliente | null) => void;
    activeRegMode: string;
}

export function FinancasView({
    data, onAdd, onUpdate, onDelete, onArchive,
    selection, onSelect, onClearSelection,
    clients, activeClient, onSelectClient,
    activeRegMode
}: FinancasViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        tipo: 'entrada',
        categoria: '',
        descrição: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        status: 'pago' as 'pago' | 'pendente'
    });

    // ==========================================
    // CÁLCULOS DO DASHBOARD
    // ==========================================
    const totais = useMemo(() => {
        const res = { entradas: 0, saidas: 0, despesas: 0, assinaturas: 0 };
        data.forEach((f: LancamentoFinancas) => {
            const v = f.Valor || 0;
            const status = f.Status?.toLowerCase();
            // Somente somar se for pago ou não tiver status (legado)
            if (status === 'pago' || !status) {
                if (f.Tipo === 'Entrada') res.entradas += v;
                else if (f.Tipo === 'Saída' || f.Tipo === 'Despesa') res.saidas += v;
                else if (f.Tipo === 'Assinatura') res.assinaturas += v;
            }
        });

        res.despesas = res.saidas + res.assinaturas;
        const saldo = res.entradas - res.despesas;

        // Distribuição (30/30/40)
        const saldoDistribuivel = saldo > 0 ? saldo : 0;
        const proLaborePedro = saldoDistribuivel * 0.3;
        const proLaboreLucas = saldoDistribuivel * 0.3;
        const caixaAgencia = saldoDistribuivel * 0.4;

        return { ...res, saldo, proLaborePedro, proLaboreLucas, caixaAgencia };
    }, [data]);

    const chartMax = Math.max(totais.entradas, totais.saidas, totais.despesas, totais.assinaturas, totais.saldo, 1000);

    const getBarHeight = (value: number) => {
        if (value === 0) return '5%';
        return `${Math.max((value / chartMax) * 100, 5)}%`;
    };

    // ==========================================
    // AÇÕES
    // ==========================================
    const handleOpenModal = (tipoPreDefinido = 'entrada') => {
        playUISound('open');
        setFormData({
            tipo: tipoPreDefinido,
            categoria: '',
            descrição: '',
            valor: '',
            data: new Date().toISOString().split('T')[0],
            status: 'pago'
        });
        setIsModalOpen(true);
    };

    const handleSaveTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.valor || !formData.descrição || !formData.categoria) return;

        playUISound('success');
        onAdd('FINANCAS', {
            Tipo: formData.tipo === 'entrada' ? 'Entrada' : formData.tipo === 'assinatura' ? 'Assinatura' : 'Saída',
            Categoria: formData.categoria,
            Descrição: formData.descrição,
            Valor: parseFloat(formData.valor),
            Data: formData.data,
            Status: formData.status,
            Observações: formData.descrição
        });
        setIsModalOpen(false);
    };

    const filteredTransactions = useMemo(() => {
        return data.filter(t =>
            t.Descrição?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.Categoria?.toLowerCase().includes(searchQuery.toLowerCase())
        ).sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime());
    }, [data, searchQuery]);

    return (
        <div className="p-6 lg:p-8 font-sans bg-gray-50 dark:bg-[#0a0a0c] min-h-screen text-gray-900 dark:text-zinc-200">
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Finanças</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-bold uppercase tracking-widest mt-1">
                        Gestão de Caixa e Lançamentos
                    </p>
                </div>

                <button
                    onClick={() => handleOpenModal('entrada')}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 ios-btn"
                >
                    <Plus size={18} /> Novo Lançamento
                </button>
            </div>

            {/* CARDS DE RESUMO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                            <ArrowUpCircle size={16} /> Entradas
                        </span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatBRL(totais.entradas)}</span>
                        <button onClick={() => handleOpenModal('entrada')} className="ios-btn p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 rounded-xl transition-colors">
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500 flex items-center gap-2">
                            <ArrowDownCircle size={16} /> Saídas Gerais
                        </span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatBRL(totais.saidas)}</span>
                        <button onClick={() => handleOpenModal('saida')} className="ios-btn p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 rounded-xl transition-colors">
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-purple-500 flex items-center gap-2">
                            <CreditCard size={16} /> Assinaturas
                        </span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{formatBRL(totais.assinaturas)}</span>
                        <button onClick={() => handleOpenModal('assinatura')} className="ios-btn p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 rounded-xl transition-colors">
                            <Plus size={18} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10 flex justify-between items-start mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-100 flex items-center gap-2">
                            <Wallet size={16} /> Saldo Final
                        </span>
                    </div>
                    <div className="relative z-10 flex items-end justify-between">
                        <span className="text-3xl font-black">{formatBRL(totais.saldo)}</span>
                    </div>
                </div>
            </div>

            {/* GRÁFICO E PRÓ-LABORE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* GRÁFICO DE FLUXO */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                            <BarChart3 size={18} className="text-indigo-500" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300">Fluxo de Caixa Operacional</h3>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-around gap-2 mt-auto h-56 pb-2">
                        {[
                            { label: 'Entradas', value: totais.entradas, color: 'bg-emerald-400 dark:bg-emerald-500', textColor: 'text-emerald-600' },
                            { label: 'Saídas', value: totais.saidas, color: 'bg-rose-400 dark:bg-rose-500', textColor: 'text-rose-500' },
                            { label: 'Despesas', value: totais.despesas, color: 'bg-orange-400 dark:bg-orange-500', textColor: 'text-orange-500' },
                            { label: 'Assinaturas', value: totais.assinaturas, color: 'bg-purple-400 dark:bg-purple-500', textColor: 'text-purple-500' },
                            { label: 'Saldo', value: totais.saldo, color: 'bg-indigo-500 dark:bg-indigo-600', textColor: 'text-indigo-500' }
                        ].map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center w-full max-w-[80px] h-full justify-end group cursor-pointer">
                                <span className={`text-[10px] font-bold ${item.textColor} opacity-0 group-hover:opacity-100 transition-opacity mb-2`}>
                                    {formatBRL(item.value)}
                                </span>
                                <div className="w-16 w-full flex-1 bg-gray-100 dark:bg-zinc-800/80 rounded-2xl p-1.5 flex items-end">
                                    <div
                                        className={`w-full ${item.color} rounded-xl transition-all duration-1000 ease-out`}
                                        style={{ height: getBarHeight(item.value) }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 mt-3 uppercase tracking-wider">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DISTRIBUIÇÃO PRÓ-LABORE */}
                <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-6">
                        <PieChart size={18} className="text-emerald-500" />
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300">Distribuição (30/30/40)</h3>
                    </div>

                    <div className="space-y-5">
                        {[
                            { label: 'Pró-Labore Pedro', share: '30%', value: totais.proLaborePedro, color: 'text-emerald-600' },
                            { label: 'Pró-Labore Lucas', share: '30%', value: totais.proLaboreLucas, color: 'text-emerald-600' },
                            { label: 'Caixa Agência', share: '40%', value: totais.caixaAgencia, color: 'text-indigo-600 dark:text-indigo-400', special: true }
                        ].map((item, idx) => (
                            <div key={idx} className={`flex justify-between items-center p-3 rounded-xl border ${item.special ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-gray-50 dark:bg-zinc-900/50 border-gray-100 dark:border-zinc-800/80'}`}>
                                <div>
                                    <p className={`text-sm font-bold ${item.special ? 'text-indigo-900 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>{item.label}</p>
                                    <p className={`text-[10px] font-bold uppercase ${item.special ? 'text-indigo-500/70 dark:text-indigo-500' : 'text-gray-500'}`}>{item.share} do Saldo</p>
                                </div>
                                <span className={`text-lg font-black ${item.color}`}>{formatBRL(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* HISTÓRICO DE LANÇAMENTOS */}
            <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-zinc-900/30">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                        <Calendar size={16} className="text-indigo-500" /> Histórico de Lançamentos
                    </h3>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar lançamento..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-sm font-medium rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/50">
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">ID / Data</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Descrição & Categoria</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-center">Tipo</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-right">Valor</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
                            {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-zinc-900/40 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(tx.Data).toLocaleDateString('pt-BR')}</span>
                                            <span className="text-[10px] text-gray-500 font-mono mt-0.5">{tx.Lançamento || tx.id.slice(0, 8)}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-1.5">
                                            <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{tx.Descrição}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                {tx.Categoria}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className={`inline-flex items-center justify-center p-1.5 rounded-lg ${tx.Tipo === 'Entrada' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                            tx.Tipo === 'Assinatura' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                                'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                            }`}>
                                            {tx.Tipo === 'Entrada' ? <ArrowUpCircle size={16} /> : tx.Tipo === 'Assinatura' ? <CreditCard size={16} /> : <ArrowDownCircle size={16} />}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-black font-mono ${tx.Tipo === 'Entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                            {tx.Tipo === 'Entrada' ? '+' : '-'} {formatBRL(tx.Valor)}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tx.Status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                            }`}>
                                            {tx.Status === 'pago' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                            {tx.Status || 'pago'}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => onDelete([tx.id], 'FINANCAS')} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

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

            {/* MODAL DE CRIAÇÃO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setIsModalOpen(false)}></div>

                    <div className="relative w-full max-w-xl bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#0a0a0c]/50">
                            <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                                <DollarSign className="text-indigo-500" /> Registrar Lançamento
                            </h2>
                            <button onClick={() => { playUISound('close'); setIsModalOpen(false); }} className="p-1.5 text-gray-400 hover:text-rose-500 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors ios-btn">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveTransaction} className="p-6 space-y-5">
                            <div className="flex p-1 bg-gray-100 dark:bg-zinc-900 rounded-xl">
                                {[
                                    { id: 'entrada', label: 'Entrada', color: 'text-emerald-600' },
                                    { id: 'saida', label: 'Saída/Despesa', color: 'text-rose-600' },
                                    { id: 'assinatura', label: 'Assinatura', color: 'text-purple-600' }
                                ].map(t => (
                                    <button
                                        key={t.id} type="button"
                                        onClick={() => { playUISound('tap'); setFormData({ ...formData, tipo: t.id, categoria: '' }); }}
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
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Data do Ocorrido</label>
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
                                    value={formData.descrição}
                                    onChange={(e) => setFormData({ ...formData, descrição: e.target.value })}
                                    placeholder="Ex: Pagamento Cliente XYZ, Compra de Mouse..."
                                    className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white text-sm font-medium rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                            </div>

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
                                        {(CATEGORIAS[formData.tipo] || []).map(cat => (
                                            <button
                                                key={cat} type="button"
                                                onClick={() => { playUISound('tap'); setFormData({ ...formData, categoria: cat }); }}
                                                className="px-2 py-1 bg-gray-100 hover:bg-indigo-50 dark:bg-zinc-800 dark:hover:bg-indigo-500/20 text-gray-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors"
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Status de Pagamento</label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as 'pago' | 'pendente' })}
                                            className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-bold rounded-xl pl-4 pr-10 py-3 focus:outline-none cursor-pointer appearance-none"
                                        >
                                            <option value="pago">Efetivado / Pago</option>
                                            <option value="pendente">Pendente / Agendado</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => { playUISound('close'); setIsModalOpen(false); }} className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors ios-btn">
                                    Cancelar
                                </button>
                                <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all ios-btn">
                                    Salvar Lançamento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
