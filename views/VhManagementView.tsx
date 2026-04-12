import React, { useState, useMemo, useEffect } from 'react';
import {
    TrendingUp, Users, DollarSign, Target, Plus, Zap, Trash2,
    Calculator, Info, LayoutDashboard, Settings, BarChart3, Clock, Check
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Card, StatCard, Button, InputSelect, Badge } from '../Components';
import { TableView } from '../components/TableView';
import { Colaborador, Cliente, Tarefa, LancamentoFinancas } from '../types';

    tasks: Tarefa[];
    financas: LancamentoFinancas[];
    savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
}

const SavingIndicator = ({ status }: { status?: 'saving' | 'success' | 'error' }) => {
    if (!status) return null;
    return (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10 animate-fade">
            {status === 'saving' && (
                <div className="w-2 h-2 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin"></div>
            )}
            {status === 'success' && (
                <Check size={10} className="text-emerald-500" />
            )}
        </div>
    );
};

export function VhManagementView({
    clients, collaborators, setCollaborators, onUpdate,
    selection, onSelect, tasks, financas, savingStatus = {}
}: VhManagementViewProps) {
    const [subTab, setSubTab] = useState<'dashboard' | 'clients' | 'config'>('dashboard');
    const [simulator, setSimulator] = useState({ fee: 0, hours: 0 });

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleUpdateCollab = (id: string, field: string, value: any) => {
        // Optimistic local update
        setCollaborators((prev: Colaborador[]) => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
        // Sync to backend
        onUpdate(id, 'VH', field, value);
    };

    const dashboardData = useMemo(() => {
        const activeClients = clients.filter(c => c.Status === 'Ativo');
        const totalFees = activeClients.reduce((acc, cur) => acc + (Number(cur.Fee) || 0), 0);
        const totalCosts = collaborators.reduce((acc, cur) => acc + (Number(cur.Remuneracao) || 0), 0);
        const profit = totalFees - totalCosts;
        const margin = totalFees > 0 ? (profit / totalFees) * 100 : 0;

        const collabData = collaborators.map(c => ({
            name: c.Nome.split(' ')[0],
            vh: c.calculatedVh || 0,
            remuneracao: Number(c.Remuneracao) || 0
        }));

        const profitabilityData = activeClients.map(c => ({
            name: c.Nome,
            fee: Number(c.Fee) || 0
        })).sort((a, b) => b.fee - a.fee).slice(0, 5);

        return { totalFees, totalCosts, profit, margin, collabData, profitabilityData };
    }, [clients, collaborators]);

    // Cálculo real de rentabilidade por cliente
    const clientMetrics = useMemo(() => {
        return clients.filter(c => c.Status === 'Ativo').map(client => {
            const clientTasks = tasks.filter(t => t.Cliente_ID === client.id);
            
            // Somar custo baseado nas horas gastas e VH do responsável
            const totalCost = clientTasks.reduce((acc, task) => {
                const responsible = collaborators.find(col => col.Nome === task.Responsável);
                const vh = responsible?.calculatedVh || 0;
                return acc + ((Number(task.Tempo_Gasto_H) || 0) * vh);
            }, 0);

            const totalHours = clientTasks.reduce((acc, task) => acc + (Number(task.Tempo_Gasto_H) || 0), 0);
            const fee = Number(client.Fee) || 0;
            const profit = fee - totalCost;
            const margin = fee > 0 ? (profit / fee) * 100 : 0;

            return {
                id: client.id,
                name: client.Nome,
                fee,
                cost: totalCost,
                profit,
                margin,
                hours: totalHours
            };
        }).sort((a, b) => b.margin - a.margin);
    }, [clients, tasks, collaborators]);

    const simResult = useMemo(() => {
        const avgVh = collaborators.length > 0
            ? collaborators.reduce((acc, cur) => acc + (cur.calculatedVh || 0), 0) / collaborators.length
            : 0;
        const cost = simulator.hours * avgVh;
        const profit = simulator.fee - cost;
        const margin = simulator.fee > 0 ? (profit / simulator.fee) * 100 : 0;
        return { cost, profit, margin };
    }, [simulator, collaborators]);

    return (
        <div className="view-root flex flex-col h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors">
            
            {/* SUB-NAVIGATION HEADER */}
            <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900 shadow-sm">
                        <TrendingUp size={16} className="shrink-0" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">Gestão VH</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Análise de Rentabilidade</p>
                    </div>
                </div>

                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'clients', label: 'Rentabilidade', icon: TrendingUp },
                        { id: 'config', label: 'Equipe', icon: Settings }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSubTab(t.id as any)}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all
                                ${subTab === t.id ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                        >
                            <t.icon size={12} className="shrink-0" /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
                <div className="max-w-7xl mx-auto space-y-6">
                    
                    {subTab === 'dashboard' && (
                        <>
                            {/* KPI row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Faturamento" value={formatBRL(dashboardData.totalFees)} icon="fa-money-bill-wave" color="emerald" />
                                <StatCard label="Custo Op." value={formatBRL(dashboardData.totalCosts)} icon="fa-calculator" color="rose" />
                                <StatCard label="Lucro Bruto" value={formatBRL(dashboardData.profit)} icon="fa-chart-line" color="blue" />
                                <StatCard label="Margem" value={`${dashboardData.margin.toFixed(1)}%`} icon="fa-percentage" color="orange" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* VH Chart */}
                                <Card title="Valor Hora por Colaborador">
                                    <div className="h-[250px] w-full pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={dashboardData.collabData}>
                                                <defs>
                                                    <linearGradient id="colorVh" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#71717a" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#71717a" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#a1a1aa" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '10px' }}
                                                    labelStyle={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
                                                />
                                                <Area type="monotone" dataKey="vh" stroke="#3f3f46" strokeWidth={2} fillOpacity={1} fill="url(#colorVh)" name="R$/h" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>

                                {/* Profitability Chart */}
                                <Card title="Margem por Cliente (%)">
                                    <div className="h-[250px] w-full pt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={clientMetrics.slice(0, 8)}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.01)" />
                                                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} axisLine={false} tickLine={false} />
                                                <YAxis stroke="#a1a1aa" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                                                <Tooltip 
                                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e4e4e7', borderRadius: '8px', fontSize: '10px' }} 
                                                />
                                                <Bar dataKey="margin" name="Margem" radius={[4, 4, 0, 0]}>
                                                    {clientMetrics.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.margin > 50 ? '#10b981' : entry.margin > 20 ? '#3b82f6' : '#f43f5e'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </div>
                        </>
                    )}

                    {subTab === 'clients' && (
                        <div className="space-y-6">
                            <Card className="!p-0 overflow-hidden">
                                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-bold uppercase text-zinc-900 dark:text-white tracking-tight">Rentabilidade Real por Contrato</h3>
                                        <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">Calculado com base nas horas registradas em tarefas.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-zinc-400">Total Alocado</p>
                                            <p className="text-xs font-bold text-zinc-900 dark:text-white">{clientMetrics.reduce((acc, c) => acc + c.hours, 0).toFixed(1)}h</p>
                                        </div>
                                        <Badge color="blue" className="h-9 px-4 uppercase text-[10px] flex items-center justify-center">
                                            Melhor Margem: {Math.max(...clientMetrics.map(c => c.margin)).toFixed(1)}%
                                        </Badge>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-zinc-50 dark:bg-zinc-800/30 uppercase text-[10px] font-bold text-zinc-500 tracking-wider">
                                                <th className="px-6 py-4">Cliente</th>
                                                <th className="px-6 py-4">Fee Mensal</th>
                                                <th className="px-6 py-4">Custo Ops (H)</th>
                                                <th className="px-6 py-4">Lucro Bruto</th>
                                                <th className="px-6 py-4 text-right">Margem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {clientMetrics.map(metric => (
                                                <tr key={metric.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all font-mono text-xs">
                                                    <td className="px-6 py-4 font-sans font-bold text-zinc-900 dark:text-white">{metric.name}</td>
                                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{formatBRL(metric.fee)}</td>
                                                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                                                        <div className="flex flex-col">
                                                            <span>{formatBRL(metric.cost)}</span>
                                                            <span className="text-[9px] font-black uppercase text-zinc-400 flex items-center gap-1"><Clock size={10} /> {metric.hours.toFixed(1)}h</span>
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-4 font-bold ${metric.profit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {formatBRL(metric.profit)}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Badge color={metric.margin > 50 ? 'emerald' : metric.margin > 20 ? 'blue' : 'red'}>
                                                            {metric.margin.toFixed(1)}%
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* SIMULATOR PANEL */}
                            <Card title="Simulador de Lucratividade">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-2">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Fee Desejado</label>
                                            <div className="flex items-center gap-1.5 w-full h-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 focus-within:border-zinc-500 transition-all shadow-inner">
                                                <span className="text-[10px] font-bold text-zinc-400 shrink-0">R$</span>
                                                <input
                                                    type="number" value={simulator.fee}
                                                    onChange={e => setSimulator(prev => ({ ...prev, fee: Number(e.target.value) }))}
                                                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-zinc-900 dark:text-white min-w-0"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">Horas Estimadas</label>
                                            <div className="relative">
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 uppercase">H</span>
                                                <input
                                                    type="number" value={simulator.hours}
                                                    onChange={e => setSimulator(prev => ({ ...prev, hours: Number(e.target.value) }))}
                                                    className="w-full h-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 text-sm font-bold text-zinc-900 dark:text-white focus:border-zinc-500 outline-none transition-all shadow-inner"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-center gap-1.5">
                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest opacity-70">Custo Op.</span>
                                            <span className="text-lg font-bold text-rose-500">{formatBRL(simResult.cost)}</span>
                                        </div>
                                        <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-500/20 rounded-xl p-5 flex flex-col justify-center gap-1.5 relative overflow-hidden group">
                                            <Zap size={32} className="absolute -right-2 -bottom-2 text-emerald-500/10 group-hover:scale-110 transition-transform shrink-0" />
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Lucro Est.</span>
                                            <span className="text-xl font-bold text-emerald-600">{formatBRL(simResult.profit)}</span>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200/50 dark:border-blue-500/20 rounded-xl p-5 flex flex-col justify-center gap-1.5">
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Margem Final</span>
                                            <span className="text-xl font-bold text-blue-600">{simResult.margin.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {subTab === 'config' && (
                        <Card className="!p-0 overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-sm font-bold uppercase text-zinc-900 dark:text-white tracking-tight">Equipe e Custos</h3>
                                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mt-0.5">Configuração individual de valor hora.</p>
                            </div>
                            
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left table-fixed border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-zinc-50 dark:bg-zinc-800/30 uppercase text-[10px] font-bold text-zinc-500 tracking-wider">
                                            <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 w-[250px]">Colaborador</th>
                                            <th className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">Remuneração</th>
                                            <th className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 text-center">Horas</th>
                                            <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 text-right">Resultado VH</th>
                                            <th className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 w-[80px]"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collaborators.map(c => (
                                            <tr key={c.id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                                                <td className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center text-xs font-bold border border-zinc-200 dark:border-zinc-700">{c.Nome.charAt(0)}</div>
                                                        <div className="min-w-0">
                                                            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate block">{c.Nome}</span>
                                                            <span className="text-[9px] text-zinc-500 uppercase font-medium">{c.Cargo || 'Sem Cargo'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/50">
                                                    <div className="flex items-center gap-1 w-full h-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2.5 focus-within:border-zinc-500 transition-all shadow-sm relative">
                                                        <span className="text-[10px] font-bold text-zinc-400 shrink-0">R$</span>
                                                        <input
                                                            type="number" 
                                                            defaultValue={c.Remuneracao}
                                                            onBlur={(e) => {
                                                                if (e.target.value !== String(c.Remuneracao)) {
                                                                    handleUpdateCollab(c.id, 'Remuneracao', e.target.value);
                                                                }
                                                            }}
                                                            className="flex-1 bg-transparent border-none outline-none font-mono text-xs font-bold text-zinc-900 dark:text-white min-w-0"
                                                        />
                                                        <SavingIndicator status={savingStatus[`VH:${c.id}:Remuneracao`]} />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800/50 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 relative">
                                                        <input
                                                            type="number" 
                                                            defaultValue={c.HorasProdutivas}
                                                            onBlur={(e) => {
                                                                if (e.target.value !== String(c.HorasProdutivas)) {
                                                                    handleUpdateCollab(c.id, 'HorasProdutivas', e.target.value);
                                                                }
                                                            }}
                                                            className="w-12 h-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-center font-mono text-xs font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-zinc-500 px-1 rounded-md transition-all shadow-sm"
                                                        />
                                                        <span className="text-[10px] font-bold text-zinc-400">H</span>
                                                        <SavingIndicator status={savingStatus[`VH:${c.id}:HorasProdutivas`]} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50 text-right">
                                                    <Badge color="blue" className="font-mono font-bold text-[11px] h-7 px-3">
                                                        {formatBRL(c.calculatedVh || 0)}/h
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/50 text-center">
                                                    <button
                                                        onClick={() => setCollaborators((prev: Colaborador[]) => prev.filter(p => p.id !== c.id))}
                                                        className="w-8 h-8 rounded-lg text-zinc-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                                    >
                                                        <Trash2 size={16} className="shrink-0" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
 
                            <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/10 border-t border-zinc-100 dark:border-zinc-800 text-center">
                                <span className="inline-flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    <Info size={14} className="shrink-0" /> O Valor Hora (VH) é calculado dividindo a remuneração pelas horas produtivas mensais.
                                </span>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
