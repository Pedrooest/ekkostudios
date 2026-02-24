import React, { useState, useMemo } from 'react';
import {
    TrendingUp, Users, DollarSign, Target, Plus, Zap, Trash2,
    Calculator, Info, LayoutDashboard, Settings
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { Card, StatCard, Button, InputSelect } from '../Components';
import { TableView } from '../components/TableView';
import { Colaborador, Cliente } from '../types';

interface VhManagementViewProps {
    clients: Client[];
    collaborators: Collaborator[];
    setCollaborators: any;
    onUpdate: (id: string, table: string, field: string, value: any, silent?: boolean) => void;
    selection: string[];
    onSelect: (id: string) => void;
}

export function VhManagementView({
    clients, collaborators, setCollaborators, onUpdate,
    selection, onSelect
}: VhManagementViewProps) {
    const [subTab, setSubTab] = useState<'dashboard' | 'clients' | 'config'>('dashboard');
    const [simulator, setSimulator] = useState({ fee: 0, hours: 0 });

    const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const handleUpdateCollab = (id: string, field: string, value: any) => {
        setCollaborators((prev: Collaborator[]) => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const dashboardData = useMemo(() => {
        const totalFees = clients.filter(c => c.Status === 'Ativo').reduce((acc, cur) => acc + (Number(cur.Fee) || 0), 0);
        const totalCosts = collaborators.reduce((acc, cur) => acc + (Number(cur.Remuneracao) || 0), 0);
        const profit = totalFees - totalCosts;
        const margin = totalFees > 0 ? (profit / totalFees) * 100 : 0;

        const collabData = collaborators.map(c => ({
            name: c.Nome.split(' ')[0],
            vh: c.calculatedVh || 0,
            remuneracao: Number(c.Remuneracao) || 0
        }));

        const profitabilityData = clients.filter(c => c.Status === 'Ativo').map(c => ({
            name: c.Nome,
            fee: Number(c.Fee) || 0
        })).sort((a, b) => b.fee - a.fee).slice(0, 5);

        return { totalFees, totalCosts, profit, margin, collabData, profitabilityData };
    }, [clients, collaborators]);

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
        <div className="space-y-8 animate-fade text-left pb-20">
            {/* SUB-NAVIGATION */}
            <div className="flex bg-app-surface border border-app-border p-1.5 rounded-2xl w-fit mb-4">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                    { id: 'clients', label: 'Rentabilidade', icon: TrendingUp },
                    { id: 'config', label: 'Equipe e Custos', icon: Settings }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => { setSubTab(t.id as any); }}
                        className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
                            ${subTab === t.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-app-text-muted hover:text-app-text-strong'}`}
                    >
                        <t.icon size={14} /> {t.label}
                    </button>
                ))}
            </div>

            {subTab === 'dashboard' && (
                <div className="space-y-8">
                    {/* KPI row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard label="Faturamento Total" value={formatBRL(dashboardData.totalFees)} icon="fa-money-bill-wave" color="emerald" />
                        <StatCard label="Custo Operacional" value={formatBRL(dashboardData.totalCosts)} icon="fa-calculator" color="rose" />
                        <StatCard label="Lucro Bruto" value={formatBRL(dashboardData.profit)} icon="fa-chart-line" color="blue" />
                        <StatCard label="Margem de Lucro" value={`${dashboardData.margin.toFixed(1)}%`} icon="fa-percentage" color="orange" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* VH Chart */}
                        <Card title="Valor Hora por Colaborador">
                            <div className="h-[300px] w-full p-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dashboardData.collabData}>
                                        <defs>
                                            <linearGradient id="colorVh" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="name" stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#6B7280" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111114', borderColor: '#333', borderRadius: '12px' }}
                                            labelStyle={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}
                                        />
                                        <Area type="monotone" dataKey="vh" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorVh)" name="Valor Hora (R$)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Profitability Chart */}
                        <Card title="Ranking de Rentabilidade (Fee)">
                            <div className="h-[300px] w-full p-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dashboardData.profitabilityData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={10} width={80} axisLine={false} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#111114', borderColor: '#333', borderRadius: '12px' }} />
                                        <Area type="monotone" dataKey="fee" stroke="#10B981" strokeWidth={3} fillOpacity={0.2} fill="#10B981" name="Fee Mensal (R$)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </div>
            )}

            {subTab === 'clients' && (
                <div className="space-y-8">
                    <div className="bg-app-surface border border-app-border rounded-[32px] overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-app-border flex items-center justify-between bg-app-surface-2/30">
                            <div>
                                <h3 className="text-xl font-black uppercase text-app-text-strong tracking-tighter">Gestão de Rentabilidade</h3>
                                <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest mt-1">Análise individual de lucro por contrato.</p>
                            </div>
                            <div className="flex bg-app-bg px-6 py-3 rounded-2xl border border-app-border gap-4 shadow-inner">
                                <div className="text-center">
                                    <span className="text-[9px] font-black text-app-text-muted uppercase block">Fee Médio</span>
                                    <span className="text-sm font-black text-app-text-strong">{formatBRL(dashboardData.totalFees / (clients.filter(c => c.Status === 'Ativo').length || 1))}</span>
                                </div>
                            </div>
                        </div>

                        <TableView
                            tab="CLIENTES" // Using CLIENTES tab as context for management
                            data={clients.filter(c => c.Status === 'Ativo')}
                            onUpdate={onUpdate}
                            onDelete={() => { }} // Disabled in this view
                            onArchive={() => { }} // Disabled in this view
                            onAdd={() => { }} // Disabled in this view
                            selection={selection}
                            onSelect={onSelect}
                            onClearSelection={() => { }}
                            hideHeader={true}
                        />
                    </div>

                    {/* SIMULATOR PANEL */}
                    <Card title="Simulador de Lucratividade">
                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-app-text-muted uppercase tracking-widest pl-1">Fee Desejado</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500">R$</span>
                                        <input
                                            type="number" value={simulator.fee}
                                            onChange={e => setSimulator(prev => ({ ...prev, fee: Number(e.target.value) }))}
                                            className="w-full h-14 bg-app-bg border border-app-border rounded-xl pl-10 pr-4 text-sm font-black text-app-text-strong focus:border-emerald-500/50 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-app-text-muted uppercase tracking-widest pl-1">Horas Mensais Estimadas</label>
                                    <div className="relative">
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-500 uppercase">H</span>
                                        <input
                                            type="number" value={simulator.hours}
                                            onChange={e => setSimulator(prev => ({ ...prev, hours: Number(e.target.value) }))}
                                            className="w-full h-14 bg-app-bg border border-app-border rounded-xl px-4 text-sm font-black text-app-text-strong focus:border-blue-500/50 outline-none transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-app-bg/50 border border-app-border rounded-2xl p-6 flex flex-col justify-center gap-2">
                                    <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">Custo de Operação</span>
                                    <span className="text-xl font-black text-rose-500">{formatBRL(simResult.cost)}</span>
                                </div>
                                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 flex flex-col justify-center gap-2 relative overflow-hidden group">
                                    <Zap size={40} className="absolute -right-4 -bottom-4 text-emerald-500/10 group-hover:scale-125 transition-transform" />
                                    <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">Lucro Estimado</span>
                                    <span className="text-2xl font-black text-emerald-500">{formatBRL(simResult.profit)}</span>
                                </div>
                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex flex-col justify-center gap-2">
                                    <span className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest">Margem Final</span>
                                    <span className="text-2xl font-black text-blue-500">{simResult.margin.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {subTab === 'config' && (
                <div className="space-y-8">
                    <Card title="Equipe e Configuração VH">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-app-surface-2/30 uppercase text-[9px] font-black text-app-text-muted tracking-[0.2em] border-b border-app-border">
                                        <th className="px-8 py-5">Colaborador</th>
                                        <th className="px-6 py-5">Remuneração (Fixa)</th>
                                        <th className="px-6 py-5 text-center">Horas Disponíveis</th>
                                        <th className="px-10 py-5 text-right">Resultado VH</th>
                                        <th className="px-8 py-5"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {collaborators.map(c => (
                                        <tr key={c.id} className="group hover:bg-app-surface transition-all border-b border-app-border/50">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm font-black border border-blue-500/20">{c.Nome.charAt(0)}</div>
                                                    <div>
                                                        <span className="text-sm font-black text-app-text-strong uppercase truncate max-w-[140px] block leading-none mb-1">{c.Nome}</span>
                                                        <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-widest opacity-60">{c.Papel || 'Time'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-500">R$</span>
                                                    <input
                                                        type="number" value={c.Remuneracao}
                                                        onChange={(e) => handleUpdateCollab(c.id, 'Remuneracao', e.target.value)}
                                                        className="w-full bg-app-bg/50 border border-app-border pl-8 pr-4 py-2 rounded-xl font-mono text-sm font-black text-app-text-strong focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <input
                                                        type="number" value={c.HorasProdutivas}
                                                        onChange={(e) => handleUpdateCollab(c.id, 'HorasProdutivas', e.target.value)}
                                                        className="w-16 bg-app-bg/50 border border-app-border text-center font-mono text-sm font-black text-app-text-strong focus:outline-none focus:border-blue-500/50 px-2 py-2 rounded-xl transition-all shadow-inner"
                                                    />
                                                    <span className="text-[10px] font-black text-[#4B5563]">H</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-5 text-right">
                                                <span className="inline-flex bg-blue-500/10 border border-blue-500/20 text-blue-500 font-mono font-black text-sm px-4 py-2 rounded-2xl shadow-lg shadow-blue-500/5">
                                                    {formatBRL(c.calculatedVh || 0)}/h
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button
                                                    onClick={() => setCollaborators((prev: Colaborador[]) => prev.filter(p => p.id !== c.id))}
                                                    className="w-10 h-10 rounded-2xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-xl"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-8 bg-app-bg/50 border-t border-app-border text-center">
                            <div className="inline-flex items-center gap-3 bg-app-bg px-6 py-3 rounded-full border border-app-border shadow-xl">
                                <Zap size={14} className="text-amber-500" />
                                <p className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.3em]">
                                    Engenharia VH: <span className="text-app-text-strong">(Custos + Remuneração) ÷ Horas</span>
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
