import React, { useState, useEffect } from 'react';
import {
    ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard,
    Search, Plus, MoreHorizontal, Calendar, X,
    CheckCircle2, DollarSign, BarChart3, Filter, Trash2, Edit3, Clock,
    PieChart, ChevronDown, Repeat, CalendarClock
} from 'lucide-react';

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

import { LancamentoFinancas, TipoTabela } from '../types';

interface FinancasTabProps {
    data: LancamentoFinancas[];
    onUpdate: (tab: TipoTabela, id: string, item: any) => void;
    onDelete: (ids: string[], tab: TipoTabela) => void;
    onAdd: (tab: TipoTabela, initial: Partial<LancamentoFinancas>) => void;
}

export default function FinancasTab({ data, onUpdate, onDelete, onAdd }: FinancasTabProps) {
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
        frequencia: 'unica' // 'unica', 'mensal', 'anual'
    });

    // Mapeamento interno de Supabase -> UI para compatibilidade com o layout existente
    const mappedTransactions = data?.map(d => ({
        id: d.id,
        tipo: d.Tipo?.toLowerCase().replace('saída', 'saida').replace('despesa', 'saida') || 'saida',
        categoria: d.Categoria || 'Geral',
        descricao: d.Descrição || 'Lançamento',
        valor: d.Valor || 0,
        data: d.Data ? d.Data.split('T')[0] : new Date().toISOString().split('T')[0],
        status: d.Status?.toLowerCase() || 'pendente',
        frequencia: d.Recorrência?.toLowerCase().replace('única', 'unica') || 'unica'
    })) || [];

    // ==========================================
    // CÁLCULOS DO DASHBOARD
    // ==========================================
    const totais = mappedTransactions.reduce((acc, curr) => {
        if (curr.status === 'pago') {
            if (curr.tipo === 'entrada') acc.entradas += curr.valor;
            if (curr.tipo === 'saida') acc.saidas += curr.valor;
            if (curr.tipo === 'assinatura') acc.assinaturas += curr.valor;
        }
        return acc;
    }, { entradas: 0, saidas: 0, despesas: 0, assinaturas: 0 });

    totais.despesas = totais.saidas + totais.assinaturas;
    const saldoFinal = totais.entradas - totais.despesas;

    // Cálculos de Pró-Labore (30/30/40)
    const lucroParaDistribuir = saldoFinal > 0 ? saldoFinal : 0;
    const proLaborePedro = lucroParaDistribuir * 0.30;
    const proLaboreLucas = lucroParaDistribuir * 0.30;
    const caixaAgencia = lucroParaDistribuir * 0.40;

    // Lógica do Gráfico de Barras
    const chartMax = Math.max(totais.entradas, totais.saidas, totais.despesas, totais.assinaturas, saldoFinal, 1000);

    const getBarHeight = (value: number) => {
        if (value === 0) return '5%';
        return `${Math.max((value / chartMax) * 100, 5)}%`;
    };

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
            frequencia: tipoPreDefinido === 'assinatura' ? 'mensal' : 'unica'
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
            frequencia: tx.frequencia
        });
        setIsModalOpen(true);
    };

    const handleSaveTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.valor || !formData.descricao || !formData.categoria) return;

        tryPlaySound('success');

        const sbTipo = formData.tipo === 'entrada' ? 'Entrada' : formData.tipo === 'assinatura' ? 'Assinatura' : 'Saída';
        const sbRecorrencia = formData.frequencia === 'unica' ? 'Única' : formData.frequencia === 'mensal' ? 'Mensal' : 'Única';

        if (editingId) {
            onUpdate('FINANCAS', editingId, {
                Tipo: sbTipo,
                Categoria: formData.categoria,
                Descrição: formData.descricao,
                Valor: parseFloat(formData.valor),
                Data: formData.data,
                Status: formData.status,
                Recorrência: sbRecorrencia
            });
        } else {
            onAdd('FINANCAS', {
                Tipo: sbTipo as any,
                Categoria: formData.categoria,
                Descrição: formData.descricao,
                Valor: parseFloat(formData.valor),
                Data: formData.data,
                Status: formData.status as any,
                Recorrência: sbRecorrencia as any
            });
        }

        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        tryPlaySound('close');
        onDelete([id], 'FINANCAS');
    };

    // Filtro
    const filteredTransactions = mappedTransactions.filter(t =>
        t.descricao.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.categoria.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 lg:p-8 font-sans bg-gray-50 dark:bg-[#0a0a0c] min-h-screen text-gray-900 dark:text-zinc-200 overflow-y-auto custom-scrollbar">

            {/* =========================================
          CABEÇALHO
          ========================================= */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 max-w-[1600px] mx-auto">
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

            <div className="max-w-[1600px] mx-auto">
                {/* =========================================
            CARDS DE RESUMO
            ========================================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                    {/* Card Entradas */}
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                <ArrowUpCircle size={16} /> Entradas
                            </span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatBRL(totais.entradas)}</span>
                            <button onClick={() => handleOpenModal('entrada')} className="ios-btn p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 rounded-xl transition-colors" title="Nova Entrada">
                                <Plus size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Card Saídas */}
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500 flex items-center gap-2">
                                <ArrowDownCircle size={16} /> Saídas Gerais
                            </span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatBRL(totais.saidas)}</span>
                            <button onClick={() => handleOpenModal('saida')} className="ios-btn p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 rounded-xl transition-colors" title="Nova Saída">
                                <Plus size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Card Assinaturas */}
                    <div className="bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-purple-500 flex items-center gap-2">
                                <CreditCard size={16} /> Assinaturas
                            </span>
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{formatBRL(totais.assinaturas)}</span>
                            <button onClick={() => handleOpenModal('assinatura')} className="ios-btn p-2 bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 text-purple-600 rounded-xl transition-colors" title="Nova Assinatura">
                                <Plus size={18} strokeWidth={3} />
                            </button>
                        </div>
                    </div>

                    {/* Card Saldo */}
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
                            <span className="text-3xl font-black">{formatBRL(saldoFinal)}</span>
                        </div>
                    </div>
                </div>

                {/* =========================================
            GRÁFICO E PRÓ-LABORE
            ========================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

                    <div className="lg:col-span-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={18} className="text-indigo-500" />
                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300">Fluxo de Caixa Operacional</h3>
                            </div>
                        </div>

                        <div className="flex-1 flex items-end justify-around gap-2 mt-auto h-56 pb-2">
                            <div className="flex flex-col items-center w-full max-w-[80px] h-full justify-end group cursor-pointer">
                                <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity mb-2">{formatBRL(totais.entradas)}</span>
                                <div className="w-16 w-full flex-1 bg-gray-100 dark:bg-zinc-800/80 rounded-2xl p-1.5 flex items-end">
                                    <div className="w-full bg-emerald-400 dark:bg-emerald-500 rounded-xl transition-all duration-1000 ease-out" style={{ height: getBarHeight(totais.entradas) }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 mt-3 uppercase tracking-wider">Entradas</span>
                            </div>

                            <div className="flex flex-col items-center w-full max-w-[80px] h-full justify-end group cursor-pointer">
                                <span className="text-[10px] font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">{formatBRL(totais.saidas)}</span>
                                <div className="w-16 w-full flex-1 bg-gray-100 dark:bg-zinc-800/80 rounded-2xl p-1.5 flex items-end">
                                    <div className="w-full bg-rose-400 dark:bg-rose-500 rounded-xl transition-all duration-1000 ease-out delay-75" style={{ height: getBarHeight(totais.saidas) }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 mt-3 uppercase tracking-wider">Saídas</span>
                            </div>

                            <div className="flex flex-col items-center w-full max-w-[80px] h-full justify-end group cursor-pointer">
                                <span className="text-[10px] font-bold text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">{formatBRL(totais.despesas)}</span>
                                <div className="w-16 w-full flex-1 bg-gray-100 dark:bg-zinc-800/80 rounded-2xl p-1.5 flex items-end">
                                    <div className="w-full bg-orange-400 dark:bg-orange-500 rounded-xl transition-all duration-1000 ease-out delay-150" style={{ height: getBarHeight(totais.despesas) }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 mt-3 uppercase tracking-wider">Despesas</span>
                            </div>

                            <div className="flex flex-col items-center w-full max-w-[80px] h-full justify-end group cursor-pointer">
                                <span className="text-[10px] font-bold text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">{formatBRL(totais.assinaturas)}</span>
                                <div className="w-16 w-full flex-1 bg-gray-100 dark:bg-zinc-800/80 rounded-2xl p-1.5 flex items-end">
                                    <div className="w-full bg-purple-400 dark:bg-purple-500 rounded-xl transition-all duration-1000 ease-out delay-200" style={{ height: getBarHeight(totais.assinaturas) }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 mt-3 uppercase tracking-wider">Assinaturas</span>
                            </div>

                            <div className="flex flex-col items-center w-full max-w-[80px] h-full justify-end group cursor-pointer">
                                <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity mb-2">{formatBRL(saldoFinal)}</span>
                                <div className="w-16 w-full flex-1 bg-gray-100 dark:bg-zinc-800/80 rounded-2xl p-1.5 flex items-end">
                                    <div className="w-full bg-indigo-500 dark:bg-indigo-600 rounded-xl transition-all duration-1000 ease-out delay-300" style={{ height: getBarHeight(saldoFinal) }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-gray-500 dark:text-zinc-500 mt-3 uppercase tracking-wider">Saldo</span>
                            </div>
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
                {mappedTransactions.some(t => t.frequencia !== 'unica' && t.tipo !== 'entrada') && (
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
                            {mappedTransactions
                                .filter(t => t.status === 'pendente' && (t.frequencia === 'mensal' || t.frequencia === 'anual'))
                                .slice(0, 3) // Limit to 3 reminders
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

                    <div className="p-5 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-zinc-900/30">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-zinc-300 flex items-center gap-2">
                            <Calendar size={16} className="text-indigo-500" /> Histórico Completo
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
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Descrição & Categoria</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest">Tipo</th>
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
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{new Date(tx.data).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-[10px] text-gray-500 font-mono mt-0.5">{tx.id}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col items-start gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-800 dark:text-zinc-200">{tx.descricao}</span>
                                                    {/* BADGE DE RECORRÊNCIA NA TABELA */}
                                                    {tx.frequencia !== 'unica' && (
                                                        <span className="flex items-center gap-1 text-[9px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                            <Repeat size={10} /> {tx.frequencia}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                                                    {tx.categoria}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center justify-center p-1.5 rounded-lg ${tx.tipo === 'entrada' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                tx.tipo === 'assinatura' ? 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' :
                                                    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                                }`}>
                                                {tx.tipo === 'entrada' ? <ArrowUpCircle size={16} /> : tx.tipo === 'assinatura' ? <CreditCard size={16} /> : <ArrowDownCircle size={16} />}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-black font-mono ${tx.tipo === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                                {tx.tipo === 'entrada' ? '+' : '-'} {formatBRL(tx.valor)}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${tx.status === 'pago' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                }`}>
                                                {tx.status === 'pago' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                                {tx.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(tx)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors">
                                                    <Edit3 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(tx.id)} className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
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

            </div>

            {/* =========================================
          MODAL DE CRIAÇÃO
          ========================================= */}
            {isModalOpen && (
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
                                    {/* SELECT DE FREQUÊNCIA (NOVO) */}
                                    <div>
                                        <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5 block flex items-center gap-1">
                                            <Repeat size={12} /> Recorrência
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={formData.frequencia}
                                                onChange={(e) => setFormData({ ...formData, frequencia: e.target.value })}
                                                className="w-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-sm font-bold rounded-xl pl-4 pr-10 py-3 focus:outline-none cursor-pointer appearance-none"
                                            >
                                                <option value="unica">Pagamento Único</option>
                                                <option value="mensal">Mensal (Todo mês)</option>
                                                <option value="anual">Anual (Todo ano)</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5 block">Status de Pagamento</label>
                                        <div className="relative">
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 text-sm font-bold rounded-xl pl-4 pr-10 py-3 focus:outline-none cursor-pointer appearance-none"
                                            >
                                                <option value="pago">Efetivado / Pago</option>
                                                <option value="pendente">Pendente / Agendado</option>
                                            </select>
                                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
            )}

        </div>
    );
}
