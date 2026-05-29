import React, { useMemo, useState, useEffect } from 'react';
import { Card, Badge } from '../Components';
import {
    Calendar, Clock, Users, DollarSign, ListChecks, CheckCircle2,
    AlertTriangle, TrendingUp, TrendingDown, Activity, Star,
    Briefcase, Zap, Layers, Target, ArrowUpRight, ArrowRight,
    Flame, BarChart3, Wallet, Plus, ChevronRight, Bell,
    FileText, Sparkles, RefreshCcw
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, ComposedChart, Line
} from 'recharts';

interface DashboardViewProps {
    clients: any[];
    tasks: any[];
    financas: any[];
    planejamento: any[];
    rdc: any[];
    setActiveTab: (tab: any) => void;
    perfilUsuario?: any;
}

// ─── Live Clock ──────────────────────────────────────────────
const LiveClock = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);
    return (
        <span className="tabular-nums font-black text-zinc-400 text-sm tracking-widest">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
    );
};

// ─── KPI Card ────────────────────────────────────────────────
const KpiCard = React.memo(({ label, value, sub, icon: Icon, gradient, trend, onClick, badge }: any) => (
    <button
        onClick={onClick}
        className="group relative w-full text-left overflow-hidden rounded-[22px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 cursor-pointer"
    >
        {/* Gradient glow */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-500 ${gradient}`} />

        <div className="relative flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg ${gradient}`}>
                <Icon size={17} strokeWidth={2.5} />
            </div>
            {trend && (
                <span className={`text-[8px] font-black px-2 py-1 rounded-xl border flex items-center gap-1 ${
                    trend.isUp
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20'
                        : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500 border-rose-200/50 dark:border-rose-500/20'
                }`}>
                    {trend.isUp ? '▲' : '▼'} {trend.value}
                </span>
            )}
            {badge && (
                <span className="text-[8px] font-black px-2 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">{badge}</span>
            )}
        </div>
        <div className="relative">
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em] mb-1 truncate">{label}</p>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums leading-tight tracking-tight">{value}</p>
            {sub && <p className="text-[9px] font-bold text-zinc-400 mt-1 truncate">{sub}</p>}
        </div>
    </button>
));

// ─── Section heading ─────────────────────────────────────────
const SectionLabel = ({ children }: any) => (
    <div className="flex items-center gap-3 mb-3">
        <span className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400">{children}</span>
        <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
    </div>
);

// ─── Main Component ───────────────────────────────────────────
export const DashboardView = React.memo(({ clients = [], tasks = [], financas = [], planejamento = [], rdc = [], setActiveTab, perfilUsuario }: DashboardViewProps) => {

    const isDark = document.documentElement.classList.contains('dark');

    const headerInfo = useMemo(() => {
        const hour = new Date().getHours();
        let greeting = 'Boa noite';
        let greetingIcon = '🌙';
        if (hour >= 5 && hour < 12) { greeting = 'Bom dia'; greetingIcon = '☀️'; }
        else if (hour >= 12 && hour < 18) { greeting = 'Boa tarde'; greetingIcon = '🌤️'; }

        const userName = perfilUsuario?.full_name?.split(' ')[0] || 'Usuário';
        const today = new Date().toISOString().split('T')[0];

        const dateFormatted = new Date().toLocaleDateString('pt-BR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });

        const contentsToday = planejamento.filter(p => p.Data === today && !p.__archived).length;
        const pendingTasks  = tasks.filter(t => t.Status !== 'done' && t.Status !== 'arquivado').length;
        const meetingsToday = (rdc || []).filter((r: any) => r.data === today).length;

        return { greeting, greetingIcon, userName, dateFormatted, contentsToday, pendingTasks, meetingsToday };
    }, [perfilUsuario, planejamento, tasks, rdc]);

    const financialStats = useMemo(() => {
        const now = new Date();
        const cm = now.getMonth(), cy = now.getFullYear();
        const pm = cm === 0 ? 11 : cm - 1;
        const py = cm === 0 ? cy - 1 : cy;

        const parseVal = (v: any) => typeof v === 'number' ? v : parseFloat(String(v || 0).replace(/\./g, '').replace(',', '.')) || 0;

        const curr = financas.filter(f => { if (!f.Data) return false; const d = new Date(f.Data + 'T12:00:00'); return d.getMonth() === cm && d.getFullYear() === cy && !f.__archived; });
        const prev = financas.filter(f => { if (!f.Data) return false; const d = new Date(f.Data + 'T12:00:00'); return d.getMonth() === pm && d.getFullYear() === py && !f.__archived; });

        const calc = (items: any[]) => {
            const rev = items.filter(f => ['Entrada','Receita'].includes(f.Tipo) && f.Status === 'Pago').reduce((a, b) => a + parseVal(b.Valor), 0);
            const exp = items.filter(f => ['Saída','Despesa'].includes(f.Tipo) && f.Status === 'Pago').reduce((a, b) => a + parseVal(b.Valor), 0);
            return { rev, exp, profit: rev - exp };
        };

        const c = calc(curr), p = calc(prev);
        const trend = (curr: number, prev: number) => {
            if (prev === 0) return null;
            const d = ((curr - prev) / prev) * 100;
            return { value: `${Math.abs(Math.round(d))}%`, isUp: d >= 0 };
        };

        const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
        const mrr = clients.filter(cl => cl.Status === 'Ativo').reduce((a, b) => a + (Number(b.Fee) || 0), 0);

        return {
            revenue:  { val: c.rev,    fmt: fmt(c.rev),    trend: trend(c.rev,    p.rev)    },
            expenses: { val: c.exp,    fmt: fmt(c.exp),    trend: trend(c.exp,    p.exp)    },
            profit:   { val: c.profit, fmt: fmt(c.profit), trend: trend(c.profit, p.profit) },
            mrr:      { val: mrr,      fmt: fmt(mrr),      trend: null }
        };
    }, [financas, clients]);

    const operationalStats = useMemo(() => {
        const now = new Date();
        const cm = now.getMonth(), cy = now.getFullYear();
        const activeClients       = clients.filter(c => c.Status === 'Ativo').length;
        const pendingTasks        = tasks.filter(t => t.Status !== 'done' && t.Status !== 'arquivado').length;
        const completedThisMonth  = tasks.filter(t => { if (!t.updated_at || t.Status !== 'done') return false; const d = new Date(t.updated_at); return d.getMonth() === cm && d.getFullYear() === cy; }).length;
        const publishedThisMonth  = planejamento.filter(p => { if (!p.Data || p['Status do conteúdo'] !== 'Concluído') return false; const d = new Date(p.Data + 'T12:00:00'); return d.getMonth() === cm && d.getFullYear() === cy; }).length;
        return { activeClients, pendingTasks, completedThisMonth, publishedThisMonth };
    }, [clients, tasks, planejamento]);

    const chartData = useMemo(() => {
        const today = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
            const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
            const key   = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const base  = financas.filter(f => !f.__archived && f.Data?.startsWith(key));
            const parseVal = (v: any) => typeof v === 'number' ? v : parseFloat(String(v || 0).replace(/\./g, '').replace(',', '.')) || 0;
            const rev = base.filter(f => ['Entrada','Receita'].includes(f.Tipo) && f.Status === 'Pago').reduce((a, b) => a + parseVal(b.Valor), 0);
            const exp = base.filter(f => ['Saída','Despesa'].includes(f.Tipo)  && f.Status === 'Pago').reduce((a, b) => a + parseVal(b.Valor), 0);
            return { name: label, Receita: rev, Despesa: exp, Lucro: rev - exp };
        });
    }, [financas]);

    const urgentTasks = useMemo(() => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return tasks
            .filter((t: any) => t.Status !== 'done' && t.Status !== 'arquivado' && t.Data_Entrega && new Date(t.Data_Entrega) <= today)
            .sort((a, b) => new Date(a.Data_Entrega).getTime() - new Date(b.Data_Entrega).getTime())
            .slice(0, 5);
    }, [tasks]);

    const upcomingContent = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return planejamento
            .filter(p => p.Data >= today && p['Status do conteúdo'] !== 'Concluído' && !p.__archived)
            .sort((a, b) => a.Data.localeCompare(b.Data))
            .slice(0, 6);
    }, [planejamento]);

    const topClientsByRevenue = useMemo(() => {
        const parseVal = (v: any) => typeof v === 'number' ? v : parseFloat(String(v || 0).replace(/\./g, '').replace(',', '.')) || 0;
        const dict: Record<string, number> = {};
        financas.filter(f => ['Entrada','Receita'].includes(f.Tipo)).forEach(f => {
            if (!f.Cliente) return;
            dict[f.Cliente] = (dict[f.Cliente] || 0) + parseVal(f.Valor);
        });
        const sorted = Object.entries(dict).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const max = sorted[0]?.revenue || 1;
        return sorted.map(c => ({ ...c, pct: (c.revenue / max) * 100, fmt: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(c.revenue) }));
    }, [financas]);

    const recentActivity = useMemo(() => {
        const timeSince = (d: string) => {
            const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
            if (s < 60) return 'agora';
            const m = Math.floor(s / 60); if (m < 60) return `${m}m atrás`;
            const h = Math.floor(m / 60); if (h < 24) return `${h}h atrás`;
            return `${Math.floor(h / 24)}d atrás`;
        };
        return [
            ...tasks.map(t => ({ id: t.id, type: 'task', title: t.Título, date: t.updated_at || t.created_at, action: t.Status === 'done' ? 'Concluiu' : 'Atualizou', sub: t.Cliente || '' })),
            ...planejamento.filter(p => p.updated_at).map(p => ({ id: p.id, type: 'content', title: p.Conteúdo, date: p.updated_at, action: 'Planejamento', sub: p.Rede_Social || '' })),
            ...financas.filter(f => f.created_at).map(f => ({ id: f.id, type: 'finance', title: f.Descrição || f.Lançamento || 'Lançamento', date: f.created_at, action: f.Tipo === 'Entrada' ? 'Receita' : 'Despesa', sub: '' }))
        ]
            .filter(i => i.date)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 7)
            .map(i => ({ ...i, relative: timeSince(i.date) }));
    }, [tasks, planejamento, financas]);

    const tooltipStyle = { borderRadius: '14px', border: 'none', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.25)', background: isDark ? '#18181b' : '#fff', color: isDark ? '#f4f4f5' : '#111827', fontSize: '11px', fontWeight: 700, padding: '10px 16px' };

    return (
        <div className="view-root flex-1 min-h-0 p-5 sm:p-6 space-y-6 animate-fade-blur overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950">

            {/* ══ HEADER ═══════════════════════════════════════════ */}
            <header className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-5 sm:p-7 shadow-2xl">
                {/* Glow blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/8 rounded-full -ml-16 -mb-16 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                            <LiveClock />
                            <span className="text-zinc-600 dark:text-zinc-600 text-xs">·</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hidden sm:inline">{headerInfo.dateFormatted}</span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                            {headerInfo.greetingIcon} {headerInfo.greeting},{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{headerInfo.userName}!</span>
                        </h1>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-1 hidden sm:block">Aqui está o resumo do seu negócio hoje</p>
                    </div>

                    {/* Quick stats — horizontal compact row */}
                    <div className="flex flex-row gap-2 shrink-0">
                        {[
                            { label: 'Pendentes', value: headerInfo.pendingTasks,  color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: ListChecks },
                            { label: 'Posts hoje', value: headerInfo.contentsToday, color: 'bg-blue-500/15 text-blue-400 border-blue-500/20',     icon: Layers },
                            { label: 'Ativos',value: operationalStats.activeClients, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: Users },
                            ...(headerInfo.meetingsToday > 0 ? [{ label: 'Reuniões', value: headerInfo.meetingsToday, color: 'bg-violet-500/15 text-violet-400 border-violet-500/20', icon: Bell }] : []),
                        ].map((s, i) => (
                            <div key={i} className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border ${s.color}`}>
                                <s.icon size={12} className="shrink-0" />
                                <div>
                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-70 leading-none hidden sm:block">{s.label}</p>
                                    <p className="text-sm font-black leading-none">{s.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick actions */}
                <div className="relative grid grid-cols-4 gap-1.5 mt-4 pt-4 border-t border-white/8">
                    {[
                        { label: 'Tarefa',      tab: 'TAREFAS',       color: 'hover:bg-orange-500/20 hover:text-orange-300 hover:border-orange-500/30' },
                        { label: 'Lançamento',  tab: 'FINANCAS',      color: 'hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/30' },
                        { label: 'Conteúdo',    tab: 'PLANEJAMENTO',  color: 'hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30' },
                        { label: 'Reunião',     tab: 'REUNIOES',      color: 'hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30' },
                    ].map((a, i) => (
                        <button key={i} onClick={() => setActiveTab(a.tab)} className={`px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 text-[8px] sm:text-[9px] font-black uppercase tracking-wide sm:tracking-widest transition-all text-center ${a.color}`}>
                            + {a.label}
                        </button>
                    ))}
                </div>
            </header>

            {/* ══ KPI GRID ══════════════════════════════════════════ */}
            <div className="space-y-4">
                <SectionLabel>Operacional</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger">
                    <KpiCard label="Clientes Ativos"       value={operationalStats.activeClients}      icon={Users}        gradient="bg-gradient-to-br from-blue-500 to-indigo-600"     badge="Base ativa"     onClick={() => setActiveTab('CLIENTES')} />
                    <KpiCard label="Tarefas Pendentes"     value={operationalStats.pendingTasks}       icon={ListChecks}   gradient="bg-gradient-to-br from-amber-500 to-orange-600"    badge="Em aberto"      onClick={() => setActiveTab('TAREFAS')} />
                    <KpiCard label="Concluídas no Mês"     value={operationalStats.completedThisMonth} icon={CheckCircle2} gradient="bg-gradient-to-br from-emerald-500 to-teal-600"   badge="este mês"       onClick={() => setActiveTab('TAREFAS')} />
                    <KpiCard label="Posts Publicados"      value={operationalStats.publishedThisMonth} icon={Layers}       gradient="bg-gradient-to-br from-indigo-500 to-purple-600"   badge="este mês"       onClick={() => setActiveTab('PLANEJAMENTO')} />
                </div>

                <SectionLabel>Financeiro</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger">
                    <KpiCard label="Receita do Mês"   value={financialStats.revenue.fmt}  icon={TrendingUp}   gradient="bg-gradient-to-br from-emerald-500 to-teal-600"  trend={financialStats.revenue.trend}  onClick={() => setActiveTab('FINANCAS')} />
                    <KpiCard label="Despesas do Mês"  value={financialStats.expenses.fmt} icon={TrendingDown} gradient="bg-gradient-to-br from-rose-500 to-pink-600"      trend={financialStats.expenses.trend} onClick={() => setActiveTab('FINANCAS')} />
                    <KpiCard label="Lucro Líquido"    value={financialStats.profit.fmt}   icon={Wallet}       gradient={financialStats.profit.val >= 0 ? "bg-gradient-to-br from-blue-500 to-indigo-600" : "bg-gradient-to-br from-rose-600 to-pink-600"} trend={financialStats.profit.trend} onClick={() => setActiveTab('FINANCAS')} />
                    <KpiCard label="MRR Operacional"  value={financialStats.mrr.fmt}      icon={Target}       gradient="bg-gradient-to-br from-violet-500 to-purple-600"  sub="Receita recorrente mensal"       onClick={() => setActiveTab('CLIENTES')} />
                </div>
            </div>

            {/* ══ MAIN CONTENT AREA ════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Chart — 3 cols */}
                <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Últimos 6 meses</p>
                            <h3 className="text-sm font-black text-zinc-900 dark:text-white">Fluxo Financeiro</h3>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-1 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500" />Receita</span>
                            <span className="flex items-center gap-1 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500" />Despesa</span>
                        </div>
                    </div>
                    <div className="h-[240px] px-4 pb-4 pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="dbGradRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}   />
                                    </linearGradient>
                                    <linearGradient id="dbGradExp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}    />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.07} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} tickFormatter={v => `${v/1000 >= 1 ? (v/1000).toFixed(0) + 'k' : v}`} />
                                <Tooltip contentStyle={tooltipStyle} formatter={(v: any, n: string) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v as number), n]} />
                                <Area type="monotone" dataKey="Receita" stroke="#10b981" strokeWidth={2.5} fill="url(#dbGradRev)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                                <Area type="monotone" dataKey="Despesa" stroke="#f43f5e" strokeWidth={2.5} fill="url(#dbGradExp)" dot={false} activeDot={{ r: 5, fill: '#f43f5e' }} />
                                <Line type="monotone" dataKey="Lucro"   stroke="#6366f1" strokeWidth={2}   dot={false} strokeDasharray="4 2" activeDot={{ r: 4, fill: '#6366f1' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Urgent + Content — 2 cols */}
                <div className="lg:col-span-2 grid grid-rows-2 gap-4">

                    {/* Tarefas críticas */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                    <Flame size={12} className="text-rose-500" />
                                </div>
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.18em]">Tarefas Críticas</span>
                            </div>
                            <button onClick={() => setActiveTab('TAREFAS')} className="text-[8px] font-black uppercase text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-0.5 transition-colors">
                                Ver todas <ChevronRight size={10} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {urgentTasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-2 py-6 px-4 text-center">
                                    <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 size={18} className="text-emerald-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tudo em dia!</p>
                                </div>
                            ) : urgentTasks.map((t: any, i) => (
                                <div key={t.id} onClick={() => setActiveTab('TAREFAS')} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 cursor-pointer border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 transition-colors group"
                                    style={{ animation: `fadeInUp 0.2s ease ${i * 40}ms both` }}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 truncate group-hover:text-rose-500 transition-colors">{t.Título}</p>
                                        <p className="text-[8px] font-bold text-zinc-400 uppercase truncate">{t.Cliente || 'Sem cliente'}</p>
                                    </div>
                                    <span className="text-[7px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-md shrink-0">ATRASADO</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Próximos conteúdos */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                        <div className="px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Calendar size={12} className="text-blue-500" />
                                </div>
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.18em]">Fluxo de Postagem</span>
                            </div>
                            <button onClick={() => setActiveTab('PLANEJAMENTO')} className="text-[8px] font-black uppercase text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-0.5 transition-colors">
                                Ver todos <ChevronRight size={10} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {upcomingContent.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-2 py-6 px-4 text-center">
                                    <Sparkles size={18} className="text-zinc-300 dark:text-zinc-700" />
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Sem posts agendados</p>
                                    <button onClick={() => setActiveTab('PLANEJAMENTO')} className="text-[9px] font-black text-blue-500 hover:underline">Criar conteúdo →</button>
                                </div>
                            ) : upcomingContent.map((p: any, i) => (
                                <div key={p.id} onClick={() => setActiveTab('PLANEJAMENTO')} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 cursor-pointer border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 transition-colors group"
                                    style={{ animation: `fadeInUp 0.2s ease ${i * 40}ms both` }}>
                                    <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[6px] font-black text-zinc-400 uppercase leading-none">{new Date(p.Data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                        <span className="text-sm font-black text-zinc-900 dark:text-white leading-none">{new Date(p.Data + 'T12:00:00').getDate()}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">{p.Conteúdo}</p>
                                        <p className="text-[8px] font-bold text-zinc-400 uppercase truncate">{p.Rede_Social} · {p.Cliente || 'Geral'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ BOTTOM ROW ═══════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-6">

                {/* Top Clientes */}
                <div className="relative overflow-hidden rounded-[24px] bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 -ml-16 -mb-16 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative p-7">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.25em] mb-1">Gestão de Receita</p>
                                <h3 className="text-lg font-black text-white">Top Clientes</h3>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center border border-blue-500/20">
                                <Star size={16} className="text-blue-400" />
                            </div>
                        </div>
                        {topClientsByRevenue.length === 0 ? (
                            <p className="text-zinc-600 text-[9px] text-center py-6 uppercase tracking-widest font-black">Sem dados de receita</p>
                        ) : (
                            <div className="space-y-4">
                                {topClientsByRevenue.map((c, i) => (
                                    <div key={i} className="space-y-1.5" style={{ animation: `fadeInUp 0.2s ease ${i * 60}ms both` }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-black text-white shrink-0 ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-indigo-500' : 'bg-zinc-600'}`}>{i + 1}</div>
                                                <span className="text-[10px] font-black text-white uppercase tracking-wide truncate max-w-[140px]">{c.name}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-zinc-400 tabular-nums shrink-0">{c.fmt}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${i === 0 ? 'bg-gradient-to-r from-blue-500 to-indigo-400' : i === 1 ? 'bg-gradient-to-r from-indigo-500 to-purple-400' : 'bg-zinc-700'}`}
                                                style={{ width: `${c.pct}%`, transitionDelay: `${i * 100}ms` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button onClick={() => setActiveTab('CLIENTES')} className="mt-6 w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-1.5">
                            Ver todos os clientes <ArrowRight size={12} />
                        </button>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                <Activity size={13} className="text-zinc-400" />
                            </div>
                            <h3 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Atividade Recente</h3>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Ao vivo" />
                    </div>
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-0">
                        {recentActivity.length === 0 ? (
                            <div className="h-full flex items-center justify-center opacity-40 py-8">
                                <p className="text-[9px] font-black uppercase tracking-widest">Nenhuma atividade registrada.</p>
                            </div>
                        ) : recentActivity.map((act: any, i) => {
                            const colors: any = { task: 'bg-amber-500', content: 'bg-blue-500', finance: 'bg-emerald-500' };
                            const icons: any  = { task: ListChecks, content: FileText, finance: DollarSign };
                            const Ic = icons[act.type] || Activity;
                            return (
                                <div key={i} className="flex gap-3.5 group" style={{ animation: `fadeInUp 0.2s ease ${i * 30}ms both` }}>
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className={`w-6 h-6 rounded-xl ${colors[act.type] || 'bg-zinc-400'} flex items-center justify-center z-10 mt-0.5 shrink-0 shadow-sm`}>
                                            <Ic size={11} className="text-white" strokeWidth={2.5} />
                                        </div>
                                        {i < recentActivity.length - 1 && <div className="w-px flex-1 bg-zinc-100 dark:bg-zinc-800/80 my-1" />}
                                    </div>
                                    <div className="pb-4 last:pb-0 min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="text-[10px] font-black text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                                                <span className="font-bold text-zinc-400">{act.action}:</span>{' '}{act.title || 'Sem título'}
                                            </p>
                                            <span className="text-[8px] font-black text-zinc-400 tabular-nums shrink-0 mt-0.5">{act.relative}</span>
                                        </div>
                                        {act.sub && <p className="text-[8px] font-bold text-zinc-400 uppercase mt-0.5 truncate">{act.sub}</p>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
});
