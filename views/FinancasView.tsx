
import React, { useState, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Receipt, CreditCard, Wallet,
    ArrowRight, Activity, DollarSign, Search, Plus, Target, Filter
} from 'lucide-react';
import { Card, Button, StatCard, DeletionBar } from '../Components';
import { TableView } from '../components/TableView';
import { playUISound } from '../utils/uiSounds';
import { OPCOES_TIPO_FINANCAS, OPCOES_SERVICOS_FINANCAS } from '../constants';
import { LancamentoFinancas, TipoTabela, Cliente } from '../types';

interface FinancasViewProps {
    data: LancamentoFinancas[];
    onUpdate: (id: string, tab: TipoTabela, field: string, value: any) => void;
    onDelete: (ids: string[], tab: TipoTabela) => void;
    onArchive: (ids: string[], tab: TipoTabela, archive: boolean) => void;
    onAdd: Function;
    selection: string[];
    onSelect: (id: string) => void;
    onClearSelection: () => void;
    clients: Cliente[];
    activeClient: Cliente | null;
    onSelectClient: (id: string) => void;
}

export function FinancasView({
    data, onUpdate, onDelete, onArchive, onAdd,
    selection, onSelect, onClearSelection,
    clients, activeClient, onSelectClient
}: FinancasViewProps) {
    const [activeRegMode, setActiveRegMode] = useState<'entrada' | 'saida' | 'despesa' | 'assinatura' | null>(null);

    const totals = useMemo(() => {
        const res = { entradas: 0, saidas: 0, despesas: 0, assinaturas: 0 };
        data.forEach((f: LancamentoFinancas) => {
            const v = f.Valor || 0;
            if (f.Tipo === 'Entrada') res.entradas += v;
            else if (f.Tipo === 'Saída') res.saidas += v;
            else if (f.Tipo === 'Despesa') res.despesas += v;
            else if (f.Tipo === 'Assinatura') res.assinaturas += v;
        });
        const saldo = res.entradas - (res.saidas + res.despesas + res.assinaturas);

        const saldoDistribuivel = saldo > 0 ? saldo : 0;
        const proLaborePedro = saldoDistribuivel * 0.3;
        const proLaboreLucas = saldoDistribuivel * 0.3;
        const caixaAgencia = saldoDistribuivel * 0.4;

        return { ...res, saldo, proLaborePedro, proLaboreLucas, caixaAgencia };
    }, [data]);

    const formatBRL = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const quickCategories: any = {
        'entrada': OPCOES_SERVICOS_FINANCAS,
        'saida': ['Reembolso', 'Devolução', 'Pagamento Fornecedor', 'Outros'],
        'despesa': ['Equipamento', 'Software', 'Impostos', 'Marketing da Agência', 'Outros'],
        'assinatura': ['Ferramentas IA', 'Hospedagem', 'Bancos de Imagem', 'Outros']
    };

    const chartData = useMemo(() => [
        { label: 'Entradas', value: totals.entradas, color: 'bg-emerald-500 shadow-emerald-500/30' },
        { label: 'Saídas', value: totals.saidas, color: 'bg-rose-500 shadow-rose-500/30' },
        { label: 'Despesas', value: totals.despesas, color: 'bg-amber-500 shadow-amber-500/30' },
        { label: 'Assinaturas', value: totals.assinaturas, color: 'bg-purple-500 shadow-purple-500/30' },
        { label: 'Saldo', value: totals.saldo, color: 'bg-indigo-500 shadow-indigo-500/30' },
    ], [totals]);

    return (
        <div className="space-y-6 md:space-y-8 animate-fade text-left mobile-container pb-10">

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <button
                    onClick={() => { playUISound('tap'); setActiveRegMode(activeRegMode === 'entrada' ? null : 'entrada'); }}
                    className={`ios-btn flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
            ${activeRegMode === 'entrada'
                            ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
                            : 'bg-app-surface border-app-border hover:border-emerald-500/30'}`}
                >
                    <div className="flex justify-between items-center w-full mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted group-hover:text-emerald-400 transition-colors">Entradas</span>
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <TrendingUp size={16} />
                        </div>
                    </div>
                    <span className={`text-2xl font-black transition-colors text-emerald-400`}>
                        {formatBRL(totals.entradas)}
                    </span>
                </button>

                <button
                    onClick={() => { playUISound('tap'); setActiveRegMode(activeRegMode === 'saida' ? null : 'saida'); }}
                    className={`ios-btn flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
            ${activeRegMode === 'saida'
                            ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.1)]'
                            : 'bg-app-surface border-app-border hover:border-rose-500/30'}`}
                >
                    <div className="flex justify-between items-center w-full mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted group-hover:text-rose-400 transition-colors">Saídas</span>
                        <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
                            <TrendingDown size={16} />
                        </div>
                    </div>
                    <span className={`text-2xl font-black transition-colors text-rose-400`}>
                        {formatBRL(totals.saidas)}
                    </span>
                </button>

                <button
                    onClick={() => { playUISound('tap'); setActiveRegMode(activeRegMode === 'despesa' ? null : 'despesa'); }}
                    className={`ios-btn flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
            ${activeRegMode === 'despesa'
                            ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
                            : 'bg-app-surface border-app-border hover:border-amber-500/30'}`}
                >
                    <div className="flex justify-between items-center w-full mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted group-hover:text-amber-400 transition-colors">Despesas</span>
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <Receipt size={16} />
                        </div>
                    </div>
                    <span className={`text-2xl font-black transition-colors text-amber-400`}>
                        {formatBRL(totals.despesas)}
                    </span>
                </button>

                <button
                    onClick={() => { playUISound('tap'); setActiveRegMode(activeRegMode === 'assinatura' ? null : 'assinatura'); }}
                    className={`ios-btn flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
            ${activeRegMode === 'assinatura'
                            ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                            : 'bg-app-surface border-app-border hover:border-purple-500/30'}`}
                >
                    <div className="flex justify-between items-center w-full mb-4">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted group-hover:text-purple-400 transition-colors">Assinaturas</span>
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center">
                            <CreditCard size={16} />
                        </div>
                    </div>
                    <span className={`text-2xl font-black transition-colors text-purple-400`}>
                        {formatBRL(totals.assinaturas)}
                    </span>
                </button>

                <div className="flex flex-col p-5 rounded-2xl border bg-app-surface border-app-border shadow-sm dark:shadow-none relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 dark:opacity-10"><Wallet size={100} /></div>
                    <div className="flex justify-between items-center w-full mb-4 relative z-10">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted">Saldo Final</span>
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <span className={`text-2xl font-black relative z-10 ${totals.saldo >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {formatBRL(totals.saldo)}
                    </span>
                </div>
            </div>

            {/* QUICK REGISTRATION PANEL */}
            {activeRegMode && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
                        <div className="flex-1">
                            <h3 className="text-sm font-black text-app-text-strong uppercase tracking-wider mb-2 flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full 
                  ${activeRegMode === 'entrada' ? 'bg-emerald-500' :
                                        activeRegMode === 'saida' ? 'bg-rose-500' :
                                            activeRegMode === 'despesa' ? 'bg-amber-500' : 'bg-purple-500'}`}
                                />
                                Novo Registro: {activeRegMode}
                            </h3>
                            <p className="text-xs text-app-text-muted uppercase tracking-widest font-bold">Selecione uma categoria abaixo para lançar.</p>
                        </div>

                        <div className="flex-2 flex flex-wrap gap-2 justify-start md:justify-end">
                            {quickCategories[activeRegMode].map((cat: string, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => onAdd('FINANCAS', {
                                        Tipo: activeRegMode === 'entrada' ? 'Entrada' : activeRegMode === 'saida' ? 'Saída' : activeRegMode === 'despesa' ? 'Despesa' : 'Assinatura',
                                        Categoria: cat,
                                        Observações: cat
                                    })}
                                    className="px-4 py-2 bg-app-bg text-app-text-muted hover:text-app-text-strong border border-app-border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    + {cat}
                                </button>
                            ))}
                        </div>

                        <div className="shrink-0 flex items-center">
                            <button
                                onClick={() => onAdd('FINANCAS', {
                                    Tipo: activeRegMode === 'entrada' ? 'Entrada' : activeRegMode === 'saida' ? 'Saída' : activeRegMode === 'despesa' ? 'Despesa' : 'Assinatura',
                                    Descrição: `Solicitado em: ${new Date().toLocaleDateString()}`
                                })}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all
                ${activeRegMode === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' :
                                        activeRegMode === 'saida' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' :
                                            activeRegMode === 'despesa' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' :
                                                'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'}`}
                            >
                                Lançar Avulso <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DASHBOARDS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Custom Operational Flow Chart */}
                <div className="lg:col-span-2 bg-app-surface border border-app-border rounded-2xl p-8 shadow-sm transition-colors flex flex-col min-h-[400px]">
                    <h3 className="text-sm font-black text-app-text-strong uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <Activity size={16} className="text-indigo-500" /> Fluxo de Caixa Operacional
                    </h3>
                    <div className="flex-1 flex items-end justify-around pt-6 pb-2 relative">
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-6">
                            {[1, 2, 3].map(i => <div key={i} className="border-b border-app-border border-dashed w-full h-0"></div>)}
                        </div>
                        {chartData.map((item, idx) => {
                            const maxVal = Math.max(...chartData.map(d => Math.abs(d.value)), 1);
                            const heightPercentage = Math.max(5, Math.min(100, Math.abs((item.value / maxVal) * 100)));
                            return (
                                <div key={idx} className="flex flex-col items-center gap-4 z-10 w-full group relative">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-app-text-strong text-app-bg text-[10px] font-black py-1 px-2 rounded-md mb-2 absolute -top-10 pointer-events-none whitespace-nowrap">
                                        {formatBRL(item.value)}
                                    </div>
                                    <div className="w-12 sm:w-20 bg-app-bg/50 border border-app-border rounded-t-2xl overflow-hidden flex items-end justify-center h-[250px] relative">
                                        <div
                                            className={`w-full rounded-t-2xl transition-all duration-1000 ease-out shadow-lg ${item.color}`}
                                            style={{ height: `${heightPercentage}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-app-text-muted group-hover:text-app-text-strong transition-colors">{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Distribution Card */}
                <div className="bg-app-surface border border-app-border rounded-2xl p-8 shadow-xl transition-colors flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
                    <h3 className="text-sm font-black text-app-text-strong uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative z-10">
                        <DollarSign size={16} className="text-emerald-500" /> Distribuição (30/30/40)
                    </h3>
                    <div className="flex-1 flex flex-col justify-center gap-8 relative z-10">
                        {[
                            { label: 'Pró-labore Pedro', share: '30%', value: totals.proLaborePedro, color: 'text-indigo-500' },
                            { label: 'Pró-labore Lucas', share: '30%', value: totals.proLaboreLucas, color: 'text-indigo-500' },
                            { label: 'Caixa Agência', share: '40%', value: totals.caixaAgencia, color: 'text-emerald-500' }
                        ].map((dist, i) => (
                            <React.Fragment key={i}>
                                <div className="flex justify-between items-center group">
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase text-app-text-muted tracking-widest mb-1">{dist.label}</h4>
                                        <span className={`text-[10px] font-black ${dist.color} bg-current/10 px-2 py-0.5 rounded-md`}>{dist.share} do Saldo</span>
                                    </div>
                                    <span className={`text-xl font-black ${dist.color === 'text-emerald-500' ? 'text-2xl' : ''}`}>
                                        {formatBRL(dist.value)}
                                    </span>
                                </div>
                                {i < 2 && <div className="w-full h-px bg-app-border/50"></div>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* HISTORIC TABLE */}
            <div className="bg-app-surface border border-app-border rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-app-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-app-surface-2/50 backdrop-blur-md">
                    <h3 className="text-xs font-black text-app-text-strong uppercase tracking-[0.3em]">Histórico de Lançamentos</h3>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'FINANCAS')} onArchive={() => onArchive(selection, 'FINANCAS', true)} onClear={onClearSelection} />
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={14} />
                            <input
                                type="text"
                                placeholder="BUSCAR LANÇAMENTO..."
                                className="w-full h-10 !bg-app-bg !border-app-border !text-app-text-strong !placeholder-app-text-muted !rounded-xl !pl-10 text-[10px] font-black uppercase tracking-widest"
                            />
                        </div>
                        <button
                            onClick={() => onAdd('FINANCAS')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
                        >
                            <Plus size={14} /> Novo Registo
                        </button>
                    </div>
                </div>

                <TableView
                    tab="FINANCAS"
                    data={data}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onArchive={onArchive}
                    onAdd={undefined}
                    selection={selection}
                    onSelect={onSelect}
                    onClearSelection={onClearSelection}
                    activeCategory={activeRegMode}
                    clients={clients}
                    activeClient={activeClient}
                    onSelectClient={onSelectClient}
                    hideHeader={true}
                />
            </div>
        </div>
    );
}
