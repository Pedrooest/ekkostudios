import React, { useMemo } from 'react';
import {
    Calendar, Clock, Users, DollarSign, ListChecks, CheckCircle2,
    AlertTriangle, TrendingUp, TrendingDown,
    Activity, Star, Briefcase, Zap, Layers, Target, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';

// ─── BRAND PALETTE ────────────────────────────────────────────────────────────
const B = {
    black:  '#000000',
    cream:  '#f8f2dc',
    orange: '#fe3a00',
    yellow: '#ffba15',
    brown:  '#b3713f',
};

interface DashboardViewProps {
    clients: any[];
    tasks: any[];
    financas: any[];
    planejamento: any[];
    rdc: any[];
    setActiveTab: (tab: any) => void;
    perfilUsuario?: any;
}

// ─── METRIC CARD ──────────────────────────────────────────────────────────────
// variant: 'dark' | 'accent' | 'warm' | 'light'
const MetricCard = React.memo(({ label, value, icon: Icon, variant = 'light', trend, onClick }: any) => {
    const styles: Record<string, { wrap: string; icon: string; label: string; value: string; trend: string }> = {
        dark: {
            wrap:  'bg-[#000000] border-[#1a1a1a] hover:border-[#333] shadow-xl shadow-black/30',
            icon:  'bg-[#fe3a00]/15 text-[#fe3a00]',
            label: 'text-zinc-400',
            value: 'text-[#f8f2dc]',
            trend: 'bg-white/5 text-zinc-300',
        },
        accent: {
            wrap:  'border-[#fe3a00]/30 hover:border-[#fe3a00]/60 shadow-lg shadow-[#fe3a00]/10',
            icon:  'bg-[#fe3a00] text-white',
            label: 'text-zinc-500 dark:text-zinc-400',
            value: 'text-zinc-900 dark:text-zinc-100',
            trend: 'bg-[#fe3a00]/10 text-[#fe3a00]',
        },
        warm: {
            wrap:  'bg-[#f8f2dc] dark:bg-[#1e1710] border-[#e8dfc0] dark:border-[#332e1f] hover:border-[#d4c98c] dark:hover:border-[#4a4228] shadow-sm',
            icon:  'bg-[#b3713f]/15 text-[#b3713f]',
            label: 'text-[#8a7355] dark:text-[#a89060]',
            value: 'text-[#2a1f0e] dark:text-[#f8f2dc]',
            trend: 'bg-[#b3713f]/10 text-[#b3713f]',
        },
        light: {
            wrap:  'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md',
            icon:  'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400',
            label: 'text-zinc-500 dark:text-zinc-400',
            value: 'text-zinc-900 dark:text-zinc-100',
            trend: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500',
        },
    };
    const s = styles[variant] || styles.light;

    return (
        <button
            onClick={onClick}
            className={`group relative w-full text-left rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 active:scale-[0.98] overflow-hidden ${s.wrap}`}
        >
            {/* Background decoration */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-[0.04] pointer-events-none">
                <Icon size={80} />
            </div>

            <div className="flex items-start justify-between relative z-10 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.icon}`}>
                    <Icon size={16} strokeWidth={2.5} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${s.trend}`}>
                        {trend.isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {trend.value}
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <p className={`text-[9px] font-black uppercase tracking-[0.18em] mb-1 ${s.label}`}>{label}</p>
                <p className={`text-[22px] font-black tabular-nums leading-tight tracking-tight ${s.value}`}>{value}</p>
            </div>
        </button>
    );
});

// ─── CUSTOM TOOLTIP ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-black border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <p key={i} className="text-[11px] font-black" style={{ color: p.fill }}>
                    {p.name}: R$ {Number(p.value).toLocaleString('pt-BR')}
                </p>
            ))}
        </div>
    );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const DashboardView = React.memo(({ clients = [], tasks = [], financas = [], planejamento = [], rdc = [], setActiveTab, perfilUsuario }: DashboardViewProps) => {

    // ── DATA (unchanged logic) ────────────────────────────────────────────────

    const headerInfo = useMemo(() => {
        const hour = new Date().getHours();
        let greeting = 'Boa noite 🌙';
        if (hour >= 5 && hour < 12) greeting = 'Bom dia ☀️';
        else if (hour >= 12 && hour < 18) greeting = 'Boa tarde 🌤️';
        const userName = perfilUsuario?.full_name?.split(' ')[0] || 'Usuário';
        const today = new Date().toISOString().split('T')[0];
        const contentsToday = planejamento.filter(p => p.Data === today).length;
        const pendingTasks = tasks.filter(t => t.Status !== 'done' && t.Status !== 'arquivado').length;
        const dateFormatted = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        return { greeting, userName, dateFormatted, contentsToday, pendingTasks };
    }, [perfilUsuario, planejamento, tasks]);

    const financialStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const parseVal = (v: any) => {
            if (typeof v === 'number') return v;
            if (!v) return 0;
            return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
        };
        const currentMonthItems = financas.filter(f => {
            if (!f.Data) return false;
            const d = new Date(f.Data);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear && !f.__archived;
        });
        const prevMonthItems = financas.filter(f => {
            if (!f.Data) return false;
            const d = new Date(f.Data);
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear && !f.__archived;
        });
        const calcMetrics = (items: any[]) => {
            const rev = items.filter(f => f.Tipo === 'Entrada' || f.Tipo === 'Receita').reduce((a, b) => a + parseVal(b.Valor), 0);
            const exp = items.filter(f => f.Tipo === 'Saída' || f.Tipo === 'Despesa').reduce((a, b) => a + parseVal(b.Valor), 0);
            return { rev, exp, profit: rev - exp };
        };
        const current = calcMetrics(currentMonthItems);
        const previous = calcMetrics(prevMonthItems);
        const calcTrend = (curr: number, prev: number) => {
            if (prev === 0) return { value: 'Novo', isUp: true };
            const diff = ((curr - prev) / prev) * 100;
            return { value: `${Math.abs(Math.round(diff))}%`, isUp: diff >= 0 };
        };
        const mrr = clients.filter(c => c.Status === 'Ativo').reduce((a, b) => a + (Number(b.Fee) || 0), 0);
        const formatBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        return {
            revenue:  { current: formatBRL(current.rev),     trend: calcTrend(current.rev, previous.rev) },
            expenses: { current: formatBRL(current.exp),     trend: calcTrend(current.exp, previous.exp) },
            profit:   { current: formatBRL(current.profit),  trend: calcTrend(current.profit, previous.profit) },
            mrr:      { current: formatBRL(mrr),             trend: { value: 'Estável', isUp: true } },
        };
    }, [financas, clients]);

    const operationalStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const activeClients = clients.filter(c => c.Status === 'Ativo').length;
        const pendingTasks = tasks.filter(t => t.Status !== 'done' && t.Status !== 'arquivado').length;
        const completedThisMonth = tasks.filter(t => {
            if (!t.updated_at || t.Status !== 'done') return false;
            const d = new Date(t.updated_at);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
        const publishedThisMonth = planejamento.filter(p => {
            if (!p.Data || p['Status do conteúdo'] !== 'Concluído') return false;
            const d = new Date(p.Data);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).length;
        return { activeClients, pendingTasks, completedThisMonth, publishedThisMonth };
    }, [clients, tasks, planejamento]);

    const chartData6Months = useMemo(() => {
        const months: any[] = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            months.push({ label, key, revenue: 0, expenses: 0 });
        }
        financas.filter(f => !f.__archived).forEach(f => {
            if (!f.Data) return;
            const d = new Date(f.Data);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const node = months.find(m => m.key === key);
            if (node) {
                const val = parseFloat(String(f.Valor || 0).replace(/\./g, '').replace(',', '.')) || 0;
                if (f.Tipo === 'Entrada' || f.Tipo === 'Receita') node.revenue += val;
                else if (f.Tipo === 'Saída' || f.Tipo === 'Despesa') node.expenses += val;
            }
        });
        return months;
    }, [financas]);

    const urgentTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return tasks
            .filter((t: any) => {
                if (t.Status === 'done' || t.Status === 'arquivado' || !t.Data_Entrega) return false;
                return new Date(t.Data_Entrega) <= today;
            })
            .sort((a, b) => new Date(a.Data_Entrega || 0).getTime() - new Date(b.Data_Entrega || 0).getTime())
            .slice(0, 5);
    }, [tasks]);

    const upcomingContent = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return planejamento
            .filter(p => p.Data >= today && p['Status do conteúdo'] !== 'Concluído' && !p.__archived)
            .sort((a, b) => a.Data.localeCompare(b.Data))
            .slice(0, 5);
    }, [planejamento]);

    const topClientsByRevenue = useMemo(() => {
        const revByClient: Record<string, number> = {};
        financas.filter(f => f.Tipo === 'Entrada' || f.Tipo === 'Receita').forEach(f => {
            if (!f.Cliente) return;
            const val = parseFloat(String(f.Valor || 0).replace(/\./g, '').replace(',', '.')) || 0;
            revByClient[f.Cliente] = (revByClient[f.Cliente] || 0) + val;
        });
        const sorted = Object.entries(revByClient).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
        const max = sorted.length > 0 ? sorted[0].revenue : 1;
        return sorted.map(c => ({ ...c, percentage: (c.revenue / max) * 100 }));
    }, [financas]);

    const recentActivity = useMemo(() => {
        const all = [
            ...tasks.map(t => ({ id: t.id, type: 'TASK', title: t.Título, date: t.updated_at || t.created_at, action: t.Status === 'done' ? 'Concluiu tarefa' : 'Atualizou tarefa' })),
            ...planejamento.filter(p => p.updated_at).map(p => ({ id: p.id, type: 'CONTENT', title: p.Conteúdo, date: p.updated_at, action: 'Editou planejamento' })),
            ...financas.filter(f => f.created_at).map(f => ({ id: f.id, type: 'FINANCE', title: f.Lançamento, date: f.created_at, action: 'Adicionou lançamento' })),
        ];
        const timeSince = (dateStr: string) => {
            if (!dateStr) return '';
            const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
            if (seconds < 60) return 'agora';
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `há ${minutes}m`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `há ${hours}h`;
            return `há ${Math.floor(hours / 24)}d`;
        };
        return all.filter(i => i.date).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6).map(i => ({ ...i, relative: timeSince(i.date!) }));
    }, [tasks, planejamento, financas]);

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        <div className="view-root h-full overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-[#0a0a0a] transition-colors">
            <div className="max-w-[1400px] mx-auto p-5 sm:p-7 space-y-6">

                {/* ── 1. HEADER ─────────────────────────────────────────── */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-2 capitalize" style={{ color: B.orange }}>
                            {headerInfo.dateFormatted}
                        </p>
                        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-[#f8f2dc] tracking-tight leading-tight">
                            {headerInfo.greeting},&nbsp;
                            <span style={{ color: B.orange }}>{headerInfo.userName}!</span>
                        </h1>
                        <div className="flex flex-wrap items-center gap-2.5 mt-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm">
                                <ListChecks size={12} className="shrink-0" style={{ color: B.orange }} />
                                {headerInfo.pendingTasks} tarefas pendentes
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 shadow-sm">
                                <Zap size={12} className="shrink-0" style={{ color: B.yellow }} />
                                {headerInfo.contentsToday} conteúdos hoje
                            </div>
                        </div>
                    </div>

                    {/* Mini KPI strip on the right */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Clientes ativos</p>
                            <p className="text-2xl font-black text-zinc-900 dark:text-[#f8f2dc] tabular-nums">{operationalStats.activeClients}</p>
                        </div>
                        <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Posts este mês</p>
                            <p className="text-2xl font-black tabular-nums" style={{ color: B.orange }}>{operationalStats.publishedThisMonth}</p>
                        </div>
                    </div>
                </header>

                {/* ── 2. OPERATIONAL METRIC CARDS ───────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 card-grid">
                    <MetricCard label="Clientes Ativos"        value={operationalStats.activeClients}       icon={Users}       variant="dark"   onClick={() => setActiveTab('CLIENTES')} />
                    <MetricCard label="Tarefas Pendentes"      value={operationalStats.pendingTasks}        icon={ListChecks}  variant="accent" onClick={() => setActiveTab('TAREFAS')} />
                    <MetricCard label="Tasks Concluídas (Mês)" value={operationalStats.completedThisMonth} icon={CheckCircle2} variant="warm"  onClick={() => setActiveTab('TAREFAS')} />
                    <MetricCard label="Posts Publicados (Mês)" value={operationalStats.publishedThisMonth} icon={Layers}      variant="light"  onClick={() => setActiveTab('PLANEJAMENTO')} />
                </div>

                {/* ── 3. FINANCIAL METRIC CARDS ─────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 card-grid">
                    <MetricCard label="Receita do Mês"   value={financialStats.revenue.current}  icon={TrendingUp}   variant="accent" trend={financialStats.revenue.trend}   onClick={() => setActiveTab('FINANCAS')} />
                    <MetricCard label="Despesas do Mês"  value={financialStats.expenses.current} icon={TrendingDown} variant="light"  trend={financialStats.expenses.trend}  onClick={() => setActiveTab('FINANCAS')} />
                    <MetricCard label="Lucro Líquido"    value={financialStats.profit.current}   icon={DollarSign}   variant="dark"   trend={financialStats.profit.trend}    onClick={() => setActiveTab('FINANCAS')} />
                    <MetricCard label="MRR Operacional"  value={financialStats.mrr.current}      icon={Target}       variant="warm"   onClick={() => setActiveTab('CLIENTES')} />
                </div>

                {/* ── 4. MAIN SECTION (chart + lists) ───────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

                    {/* Chart — 2 cols */}
                    <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0d0d0d] shadow-sm">
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.22em] mb-0.5" style={{ color: B.orange }}>Performance Financeira</p>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-[#f8f2dc]">Últimos 6 meses</h3>
                            </div>
                            <Activity size={16} className="text-zinc-300 dark:text-zinc-700" />
                        </div>
                        <div className="h-[280px] px-4 py-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData6Months} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barCategoryGap="35%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#71717a' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#71717a' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                    <Bar dataKey="revenue"  name="Receita"  fill={B.orange} radius={[5,5,0,0]} maxBarSize={22} />
                                    <Bar dataKey="expenses" name="Despesa"  fill={B.brown}  radius={[5,5,0,0]} maxBarSize={22} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Chart legend */}
                        <div className="flex items-center gap-5 px-6 pb-5 pt-1">
                            <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: B.orange }} /><span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Receita</span></div>
                            <div className="flex items-center gap-2"><span className="w-3 h-2 rounded-sm inline-block" style={{ background: B.brown }} /><span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Despesa</span></div>
                        </div>
                    </div>

                    {/* Tarefas Críticas — 1 col */}
                    <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d0d] shadow-sm flex flex-col">
                        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${B.orange}15` }}>
                                <AlertTriangle size={13} style={{ color: B.orange }} />
                            </div>
                            <h2 className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: B.orange }}>Tarefas Críticas</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-50 dark:divide-zinc-800/70">
                            {urgentTasks.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-3">
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${B.orange}10` }}>
                                        <CheckCircle2 size={20} style={{ color: B.orange }} />
                                    </div>
                                    <p className="text-[11px] font-black text-zinc-700 dark:text-zinc-300">Tudo sob controle</p>
                                    <p className="text-[9px] text-zinc-400 uppercase tracking-wider">Nenhuma tarefa atrasada.</p>
                                </div>
                            ) : (
                                urgentTasks.map((t: any) => (
                                    <div key={t.id} onClick={() => setActiveTab('TAREFAS')} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all cursor-pointer group">
                                        <div className="flex justify-between items-start mb-1.5 gap-2">
                                            <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1 group-hover:text-[#fe3a00] transition-colors">{t.Título}</h4>
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md shrink-0 uppercase" style={{ background: `${B.orange}15`, color: B.orange }}>ATRASADO</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-tight">
                                            <Briefcase size={8} /> {t.Cliente || 'Geral'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={() => setActiveTab('TAREFAS')} className="p-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#fe3a00] transition-colors border-t border-zinc-50 dark:border-zinc-800">
                            Ver todas →
                        </button>
                    </div>

                    {/* Próximos Conteúdos — 1 col */}
                    <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d0d] shadow-sm flex flex-col">
                        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${B.yellow}20` }}>
                                <Calendar size={13} style={{ color: B.yellow }} />
                            </div>
                            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Fluxo de Postagem</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {upcomingContent.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-3">
                                    <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: `${B.yellow}20` }}>
                                        <Calendar size={20} style={{ color: B.yellow }} />
                                    </div>
                                    <p className="text-[11px] font-black text-zinc-700 dark:text-zinc-300">Sem posts próximos</p>
                                    <button onClick={() => setActiveTab('PLANEJAMENTO')} className="text-[9px] font-black uppercase tracking-wider transition-colors" style={{ color: B.orange }}>
                                        Criar conteúdo →
                                    </button>
                                </div>
                            ) : (
                                upcomingContent.map((p: any) => {
                                    const postDate = new Date(p.Data + 'T12:00:00');
                                    return (
                                        <div key={p.id} onClick={() => setActiveTab('PLANEJAMENTO')} className="p-4 border-b border-zinc-50 dark:border-zinc-800/70 last:border-0 cursor-pointer group flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all">
                                            <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
                                                <span className="text-[7px] font-black uppercase" style={{ color: B.orange }}>{postDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                                <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-none">{postDate.getDate()}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-[#fe3a00] transition-colors">{p.Conteúdo}</h4>
                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-tight truncate">{p.Rede_Social} • {p.Cliente || 'Geral'}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* ── 5. BOTTOM SECTION ──────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-8">

                    {/* Top Clientes — dark brand card */}
                    <div className="rounded-2xl overflow-hidden relative" style={{ background: B.black }}>
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${B.orange}18 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
                        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${B.yellow}10 0%, transparent 70%)`, transform: 'translate(-30%, 30%)' }} />

                        <div className="relative z-10 p-7">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1" style={{ color: B.orange }}>Gestão de Receita</p>
                                    <h3 className="text-xl font-black" style={{ color: B.cream }}>Top Clientes</h3>
                                </div>
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${B.orange}15` }}>
                                    <Star size={18} style={{ color: B.orange }} />
                                </div>
                            </div>

                            <div className="space-y-5">
                                {topClientsByRevenue.length === 0 ? (
                                    <p className="text-zinc-600 text-[10px] text-center py-6 uppercase tracking-widest font-black">Sem dados financeiros.</p>
                                ) : (
                                    topClientsByRevenue.map((c: any, idx: number) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[11px] font-black uppercase tracking-wide truncate pr-4" style={{ color: B.cream }}>{c.name}</span>
                                                <span className="text-[10px] font-bold tabular-nums" style={{ color: idx === 0 ? B.orange : B.brown }}>
                                                    R$ {c.revenue.toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                            <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                                    style={{
                                                        width: `${c.percentage}%`,
                                                        background: idx === 0
                                                            ? `linear-gradient(90deg, ${B.orange}, ${B.yellow})`
                                                            : `linear-gradient(90deg, ${B.brown}, ${B.brown}80)`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Log de Atividade */}
                    <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0d0d0d] shadow-sm flex flex-col">
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${B.brown}20` }}>
                                <Activity size={13} style={{ color: B.brown }} />
                            </div>
                            <h2 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Log de Atividade</h2>
                        </div>
                        <div className="flex-1 px-6 py-5 space-y-5 overflow-y-auto custom-scrollbar">
                            {recentActivity.length === 0 ? (
                                <div className="h-full flex items-center justify-center opacity-40">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Nenhuma atividade registrada.</span>
                                </div>
                            ) : (
                                recentActivity.map((act: any, idx: number) => {
                                    const dotColor = act.type === 'TASK' ? B.orange : act.type === 'CONTENT' ? B.yellow : B.brown;
                                    return (
                                        <div key={idx} className="flex gap-4 group">
                                            <div className="flex flex-col items-center shrink-0">
                                                <div className="w-2 h-2 rounded-full z-10 transition-transform group-hover:scale-150 mt-1" style={{ background: dotColor }} />
                                                {idx < recentActivity.length - 1 && (
                                                    <div className="w-px flex-1 mt-1" style={{ background: 'rgba(0,0,0,0.06)' }} />
                                                )}
                                            </div>
                                            <div className="pb-5 last:pb-0 min-w-0 flex-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate pr-3">
                                                        <span className="text-zinc-400 font-medium">{act.action}:</span> {act.title || 'Sem título'}
                                                    </p>
                                                    <span className="text-[9px] font-black text-zinc-400 tabular-nums shrink-0">{act.relative}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
});
