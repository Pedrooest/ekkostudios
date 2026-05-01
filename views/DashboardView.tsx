import React, { useMemo } from 'react';
import { Card, Badge } from '../Components';
import { 
    Calendar, Clock, Users, DollarSign, ListChecks, CheckCircle2, 
    AlertTriangle, TrendingUp, TrendingDown, 
    Activity, Star, Briefcase, Zap, Layers, Target
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Legend
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

// ==========================================
// COMPONENTES AUXILIARES LOCAIS
// ==========================================

const MetricCard = React.memo(({ label, value, icon: Icon, color, trend, onClick }: any) => {
    const colorClasses: any = {
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
        rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
        indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    };

    return (
        <Card
            className="group lift hover:shadow-xl cursor-pointer border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 !p-4 relative overflow-hidden"
            onClick={onClick}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] flex items-center justify-center pointer-events-none`}>
                <Icon size={80} />
            </div>

            <div className="flex items-start justify-between relative z-10">
                <div className={`p-2 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
                    <Icon size={16} strokeWidth={2.5} className="shrink-0" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${trend.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend.isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {trend.value}
                    </div>
                )}
            </div>

            <div className="mt-3 relative z-10">
                <h3 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em]">{label}</h3>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 tabular-nums">
                    {value}
                </p>
            </div>
        </Card>
    );
});

export const DashboardView = React.memo(({ clients = [], tasks = [], financas = [], planejamento = [], rdc = [], setActiveTab, perfilUsuario }: DashboardViewProps) => {
    
    // ==========================================
    // CÁLCULOS DE DADOS (useMemo)
    // ==========================================

    const headerInfo = useMemo(() => {
        const hour = new Date().getHours();
        let greeting = 'Boa noite 🌙';
        if (hour >= 5 && hour < 12) greeting = 'Bom dia ☀️';
        else if (hour >= 12 && hour < 18) greeting = 'Boa tarde 🌤️';

        const userName = perfilUsuario?.full_name?.split(' ')[0] || 'Usuário';
        const today = new Date().toISOString().split('T')[0];
        
        const contentsToday = planejamento.filter(p => p.Data === today).length;
        const pendingTasks = tasks.filter(t => t.Status !== 'done' && t.Status !== 'arquivado').length;

        const dateFormatted = new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });

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
            revenue: { current: formatBRL(current.rev), trend: calcTrend(current.rev, previous.rev) },
            expenses: { current: formatBRL(current.exp), trend: calcTrend(current.exp, previous.exp) },
            profit: { current: formatBRL(current.profit), trend: calcTrend(current.profit, previous.profit) },
            mrr: { current: formatBRL(mrr), trend: { value: 'Estável', isUp: true } } // Simplified trend for MRR
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
        const months = [];
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
                const delivery = new Date(t.Data_Entrega);
                return delivery <= today;
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

        const sorted = Object.entries(revByClient)
            .map(([name, revenue]) => ({ name, revenue }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        
        const max = sorted.length > 0 ? sorted[0].revenue : 1;
        return sorted.map(c => ({ ...c, percentage: (c.revenue / max) * 100 }));
    }, [financas]);

    const recentActivity = useMemo(() => {
        const all = [
            ...tasks.map(t => ({ id: t.id, type: 'TASK', title: t.Título, date: t.updated_at || t.created_at, action: t.Status === 'done' ? 'Concluiu tarefa' : 'Atualizou tarefa' })),
            ...planejamento.filter(p => p.updated_at).map(p => ({ id: p.id, type: 'CONTENT', title: p.Conteúdo, date: p.updated_at, action: 'Editou planejamento' })),
            ...financas.filter(f => f.created_at).map(f => ({ id: f.id, type: 'FINANCE', title: f.Lançamento, date: f.created_at, action: 'Adicionou lançamento' }))
        ];

        const timeSince = (dateStr: string) => {
            if (!dateStr) return '';
            const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
            if (seconds < 60) return 'agora';
            const minutes = Math.floor(seconds / 60);
            if (minutes < 60) return `há ${minutes}m`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `há ${hours}h`;
            const days = Math.floor(hours / 24);
            return `há ${days}d`;
        };

        return all
            .filter(i => i.date)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 6)
            .map(i => ({ ...i, relative: timeSince(i.date!) }));
    }, [tasks, planejamento, financas]);

    // ==========================================
    // RENDERIZAÇÃO
    // ==========================================

    return (
        <div className="view-root p-4 sm:p-6 space-y-6 animate-fade h-full overflow-y-auto custom-scrollbar bg-zinc-50 dark:bg-zinc-950 transition-colors">
            
            {/* 1. HEADER */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                    <span className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-2 block">{headerInfo.dateFormatted}</span>
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">
                        {headerInfo.greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">{headerInfo.userName}!</span>
                    </h1>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm">
                            <ListChecks size={14} className="text-zinc-400 shrink-0" />
                            <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 tracking-tighter">
                                {headerInfo.pendingTasks} tarefas pendentes
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-sm">
                            <Zap size={14} className="text-amber-500 shrink-0" />
                            <span className="text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 tracking-tighter">
                                {headerInfo.contentsToday} conteúdos hoje
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. DASHBOARD CARDS (2 LINES) */}
            <div className="space-y-4">
                {/* Linha 1: Operacional */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                    <MetricCard label="Clientes Ativos" value={operationalStats.activeClients} icon={Users} color="blue" onClick={() => setActiveTab('CLIENTES')} />
                    <MetricCard label="Tarefas Pendentes" value={operationalStats.pendingTasks} icon={ListChecks} color="orange" onClick={() => setActiveTab('TAREFAS')} />
                    <MetricCard label="Tasks Concluídas (Mês)" value={operationalStats.completedThisMonth} icon={CheckCircle2} color="emerald" onClick={() => setActiveTab('TAREFAS')} />
                    <MetricCard label="Posts Publicados (Mês)" value={operationalStats.publishedThisMonth} icon={Layers} color="indigo" onClick={() => setActiveTab('PLANEJAMENTO')} />
                </div>

                {/* Linha 2: Financeiro */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                    <MetricCard label="Receita do Mês" value={financialStats.revenue.current} icon={TrendingUp} color="emerald" trend={financialStats.revenue.trend} onClick={() => setActiveTab('FINANCAS')} />
                    <MetricCard label="Despesas do Mês" value={financialStats.expenses.current} icon={TrendingDown} color="rose" trend={financialStats.expenses.trend} onClick={() => setActiveTab('FINANCAS')} />
                    <MetricCard label="Lucro Líquido" value={financialStats.profit.current} icon={DollarSign} color="amber" trend={financialStats.profit.trend} onClick={() => setActiveTab('FINANCAS')} />
                    <MetricCard label="MRR Operacional" value={financialStats.mrr.current} icon={Target} color="cyan" onClick={() => setActiveTab('CLIENTES')} />
                </div>
            </div>

            {/* 3. SEÇÃO CENTRAL - 3 COLUNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Col 1 (50%): Gráfico de Barras */}
                <Card className="lg:col-span-2 !p-0 overflow-hidden bg-white dark:bg-zinc-900 border-none shadow-xl">
                    <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                        <div>
                            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-0.5">Performance Financeira</h2>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">Últimos 6 meses</p>
                        </div>
                        <Activity size={18} className="text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <div className="h-[320px] p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData6Months} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.05} />
                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#71717a' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#71717a' }} tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#09090b', color: '#fff' }}
                                />
                                <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }} verticalAlign="bottom" />
                                <Bar dataKey="revenue" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                <Bar dataKey="expenses" name="Despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Col 2 (25%): Tarefas Críticas */}
                <Card className="!p-0 border-none bg-white dark:bg-zinc-900 shadow-xl flex flex-col">
                    <div className="px-5 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-rose-500" />
                        <h2 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Tarefas Críticas</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-zinc-50 dark:divide-zinc-800">
                        {urgentTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <CheckCircle2 size={22} className="text-emerald-500" />
                                </div>
                                <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">Tudo sob controle</p>
                                <p className="text-[10px] text-zinc-400">Nenhuma tarefa atrasada.</p>
                            </div>
                        ) : (
                            urgentTasks.map((t: any) => (
                                <div key={t.id} onClick={() => setActiveTab('TAREFAS')} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate flex-1 pr-4">{t.Título}</h4>
                                        <span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded leading-none shrink-0 group-hover:scale-110 transition-transform">ATRASADO</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                                        <Briefcase size={8} /> {t.Cliente || 'Geral'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button onClick={() => setActiveTab('TAREFAS')} className="p-3 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500 transition-colors border-t border-zinc-50 dark:border-zinc-800">Ver todas</button>
                </Card>

                {/* Col 3 (25%): Próximos Conteúdos */}
                <Card className="!p-0 border-none bg-white dark:bg-zinc-900 shadow-xl flex flex-col">
                    <div className="px-5 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" />
                        <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Fluxo de Postagem</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {upcomingContent.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Calendar size={22} className="text-blue-500" />
                                </div>
                                <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">Sem posts próximos</p>
                                <button onClick={() => setActiveTab('PLANEJAMENTO')} className="text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors">
                                    Criar conteúdo →
                                </button>
                            </div>
                        ) : (
                            upcomingContent.map((p: any) => (
                                <div key={p.id} onClick={() => setActiveTab('PLANEJAMENTO')} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all border-b border-zinc-50 dark:border-zinc-800 last:border-0 cursor-pointer group flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700">
                                        <span className="text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase leading-none mb-0.5">{new Date(p.Data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                                        <span className="text-xs font-black text-zinc-900 dark:text-white leading-none">{new Date(p.Data + 'T12:00:00').getDate()}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-500 transition-colors">{p.Conteúdo}</h4>
                                        <p className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter truncate">{p.Rede_Social} • {p.Cliente || 'Geral'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* 4. SEÇÃO INFERIOR - 2 COLUNAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Col 1: Top Clientes */}
                <Card className="!p-8 bg-zinc-900 text-white border-none shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-blue-500 rounded-full blur-[100px] opacity-[0.05] group-hover:opacity-[0.1] transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1">Gestão de Receita</h2>
                                <h3 className="text-xl font-black">Top Clientes</h3>
                            </div>
                            <Star size={24} className="text-blue-500" />
                        </div>
                        <div className="space-y-6">
                            {topClientsByRevenue.length === 0 ? (
                                <p className="text-zinc-500 text-xs text-center py-4 uppercase tracking-widest font-black opacity-40">Sem dados financeiros para processar.</p>
                            ) : (
                                topClientsByRevenue.map((c: any, idx: number) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <span className="text-xs font-black uppercase tracking-wide truncate pr-4">{c.name}</span>
                                            <span className="text-[11px] font-bold tabular-nums">R$ {c.revenue.toLocaleString('pt-BR')}</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 rounded-full bg-gradient-to-r ${idx === 0 ? 'from-blue-600 to-indigo-500' : 'from-zinc-700 to-zinc-600'}`} 
                                                style={{ width: `${c.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </Card>

                {/* Col 2: Atividade Recente */}
                <Card className="!p-0 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-zinc-400" />
                            <h2 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Log de Atividade</h2>
                        </div>
                    </div>
                    <div className="flex-1 p-6 space-y-6">
                        {recentActivity.length === 0 ? (
                            <div className="h-full flex items-center justify-center opacity-40 grayscale">
                                <span className="text-[10px] font-black uppercase tracking-widest text-center">Nenhuma atividade registrada.</span>
                            </div>
                        ) : (
                            recentActivity.map((act: any, idx: number) => (
                                <div key={idx} className="flex gap-4 group">
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className={`w-2 h-2 rounded-full z-10 transition-transform group-hover:scale-150 ${act.type === 'TASK' ? 'bg-orange-500' : act.type === 'CONTENT' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                        {idx < recentActivity.length - 1 && <div className="w-0.5 h-full bg-zinc-100 dark:bg-zinc-800 mt-1" />}
                                    </div>
                                    <div className="pb-6 last:pb-0 min-w-0 flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate pr-4">
                                                <span className="text-zinc-400 dark:text-zinc-500 font-medium">{act.action}:</span> {act.title || 'Sem título'}
                                            </p>
                                            <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tabular-nums shrink-0 mt-0.5">{act.relative}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

            </div>

        </div>
    );
});
