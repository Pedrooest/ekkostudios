import React, { useMemo, Suspense, lazy } from 'react';
import { Card, StatCard, Badge } from '../Components';
import { Calendar, Clock, Users, DollarSign, ListChecks, CheckCircle2, AlertTriangle, Info, Coffee } from 'lucide-react';

const DashboardCharts = lazy(() => import('./DashboardCharts'));

interface DashboardViewProps {
    clients: any[];
    tasks: any[];
    financas: any[];
    planejamento: any[];
    rdc: any[];
}

export const DashboardView = React.memo(({ clients, tasks, financas, planejamento, rdc }: DashboardViewProps) => {
    const stats = useMemo(() => {
        const safeArray = (arr: any) => Array.isArray(arr) ? arr : [];
        
        const validClients = safeArray(clients);
        const activeClients = validClients.length === 0 ? '-' : validClients.filter((c: any) => c.Status === 'Ativo').length;
        
        const validPlanning = safeArray(planejamento);
        const pendingPlanning = validPlanning.length === 0 ? '-' : validPlanning.filter((p: any) => p['Status do conteúdo'] !== 'Concluído').length;
        
        const validTasks = safeArray(tasks);
        const pendingTasks = validTasks.length === 0 ? '-' : validTasks.filter((t: any) => t.Status !== 'done' && t.Status !== 'arquivado').length;
        
        const validFinancas = safeArray(financas);
        const revenueValue = validFinancas
            .filter((f: any) => f.Tipo === 'Entrada')
            .reduce((acc: number, cur: any) => {
                if (typeof cur.Valor === 'number') return acc + (isNaN(cur.Valor) ? 0 : cur.Valor);
                const num = parseFloat(String(cur.Valor || 0).replace(/\./g, '').replace(',', '.'));
                return acc + (isNaN(num) ? 0 : num);
            }, 0);
        
        const revenue = validFinancas.length === 0 
            ? '-' 
            : `R$ ${revenueValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return { activeClients, pendingPlanning, pendingTasks, revenue };
    }, [clients, tasks, planejamento, financas]);

    const recentTasks = useMemo(() => {
        const validTasks = Array.isArray(tasks) ? tasks : [];
        return validTasks
            .filter((t: any) => t.Status !== 'done' && t.Status !== 'arquivado')
            .sort((a: any, b: any) => new Date(a.Data_Entrega || 0).getTime() - new Date(b.Data_Entrega || 0).getTime())
            .slice(0, 5);
    }, [tasks]);

    const alerts = useMemo(() => {
        const msgs = [];
        if (stats.pendingPlanning === '-') msgs.push({ icon: <Calendar size={14} />, text: 'Adicione planejamentos para começar', color: 'indigo' });
        
        const hasOverdue = recentTasks.some(t => {
            if (!t.Data_Entrega) return false;
            return new Date(t.Data_Entrega).getTime() < new Date().setHours(0,0,0,0);
        });
        
        if (hasOverdue) {
            msgs.push({ icon: <Clock size={14} />, text: 'Existem tarefas com entrega atrasada', color: 'red' });
        }
        if (stats.activeClients === '-') msgs.push({ icon: <Users size={14} />, text: 'Seu workspace não tem clientes cadastrados', color: 'blue' });

        if (msgs.length === 0) {
            msgs.push({ icon: <CheckCircle2 size={14} />, text: 'Operação dentro da normalidade', color: 'emerald' });
        }
        return msgs;
    }, [stats, recentTasks]);

    const getStatusTheme = (status: string): { color: any, label: string } => {
        switch(status?.toLowerCase()) {
            case 'todo': return { color: 'blue', label: 'A Fazer' };
            case 'doing': return { color: 'orange', label: 'Fazendo' };
            case 'review': return { color: 'indigo', label: 'Aprovação' };
            case 'blocked': return { color: 'red', label: 'Bloqueado' };
            default: return { color: 'slate', label: status || 'Pendente' };
        }
    };

    return (
        <div className="space-y-6 animate-fade">
            {/* Standardized Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
                            <Info size={18} />
                        </div>
                        Visão Geral
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest mt-1.5 opacity-60">
                        Métricas, prazos e alertas para sua operação.
                    </p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Receita Bruta" value={stats.revenue} icon="fa-money-bill-trend-up" color="emerald" />
                <StatCard label="Contratos Ativos" value={stats.activeClients} icon="fa-users" color="blue" />
                <StatCard label="Produção Ativa" value={stats.pendingPlanning} icon="fa-calendar-check" color="orange" />
                <StatCard label="Sprint Pendente" value={stats.pendingTasks} icon="fa-list-check" color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Tasks */}
                <Card title="TAREFAS CRÍTICAS" className="lg:col-span-2 overflow-hidden !p-0">
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {recentTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                                <Coffee size={32} className="mb-4 opacity-20" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Nada pendente no momento.</span>
                            </div>
                        ) : (
                            recentTasks.map((task: any, idx: number) => {
                                const theme = getStatusTheme(task.Status);
                                return (
                                    <div key={idx} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-tight truncate group-hover:text-blue-500 transition-colors">
                                                {task.Título || 'Tarefa Sem Título'}
                                            </span>
                                            <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                                                <Clock size={10} className="shrink-0" /> 
                                                {task.Data_Entrega ? new Date(task.Data_Entrega).toLocaleDateString('pt-BR') : 'Sem data'}
                                            </div>
                                        </div>
                                        <Badge color={theme.color} className="text-[9px] font-black uppercase tracking-widest shrink-0">
                                            {theme.label}
                                        </Badge>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Alerts Area */}
                <Card title="ALERTAS E INSIGHTS" className="!p-5">
                    <div className="space-y-3">
                        {alerts.map((alert, i) => (
                            <div key={i} className={`flex items-start gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm`}>
                                <div className={`shrink-0 mt-0.5 p-2 rounded-lg bg-${alert.color}-500/10 text-${alert.color}-500`}>
                                    {alert.icon}
                                </div>
                                <p className={`text-[11px] font-bold text-zinc-600 dark:text-zinc-400 leading-snug`}>
                                    {alert.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 gap-6">
                <Suspense fallback={
                    <Card className="h-[400px] flex items-center justify-center">
                        <div className="animate-pulse flex flex-col items-center opacity-40">
                            <ListChecks size={32} className="mb-4 text-zinc-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Inicializando módulo visual...</span>
                        </div>
                    </Card>
                }>
                    <DashboardCharts stats={stats} financas={financas} tasks={tasks} planejamento={planejamento} clients={clients} />
                </Suspense>
            </div>
        </div>
    );
});
