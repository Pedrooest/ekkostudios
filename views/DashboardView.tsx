import React, { useMemo, Suspense, lazy } from 'react';
import { Card, StatCard } from '../Components';

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
            .slice(0, 4);
    }, [tasks]);

    const alerts = useMemo(() => {
        const msgs = [];
        if (stats.pendingPlanning === '-') msgs.push({ icon: 'fa-calendar-plus', text: 'Adicione planejamentos para começar', color: 'text-orange-500', bg: 'bg-orange-500/10' });
        
        const hasOverdue = recentTasks.some(t => {
            if (!t.Data_Entrega) return false;
            return new Date(t.Data_Entrega).getTime() < new Date().setHours(0,0,0,0);
        });
        
        if (hasOverdue) {
            msgs.push({ icon: 'fa-clock-rotate-left', text: 'Existem tarefas com entrega atrasada', color: 'text-red-500', bg: 'bg-red-500/10' });
        }
        if (stats.activeClients === '-') msgs.push({ icon: 'fa-handshake', text: 'Parece que seu workspace não tem clientes', color: 'text-blue-500', bg: 'bg-blue-500/10' });

        if (msgs.length === 0) {
            msgs.push({ icon: 'fa-check-circle', text: 'Operação dentro da normalidade', color: 'text-emerald-500', bg: 'bg-emerald-500/10' });
        }
        return msgs;
    }, [stats, recentTasks]);

    const getStatusColor = (status: string) => {
        switch(status?.toLowerCase()) {
            case 'todo': return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
            case 'doing': return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
            case 'review': return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
            case 'blocked': return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400';
        }
    };

    const getStatusText = (status: string) => {
        switch(status?.toLowerCase()) {
            case 'todo': return 'A Fazer';
            case 'doing': return 'Fazendo';
            case 'review': return 'Aprovação';
            case 'blocked': return 'Bloqueado';
            default: return status || 'Pendente';
        }
    };

    return (
        <div className="pb-10 space-y-6 md:space-y-8 animate-fade text-left mobile-container">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Visão Geral</h2>
                    <p className="text-gray-500 dark:text-[#a3aac4] text-sm mt-1">Acompanhe métricas globais, tarefas pendentes e alertas importantes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard label="Receita Bruta" value={stats.revenue} icon="fa-money-bill-trend-up" color="emerald" />
                <StatCard label="Contratos Ativos" value={stats.activeClients} icon="fa-users" color="blue" />
                <StatCard label="Produção Ativa" value={stats.pendingPlanning} icon="fa-calendar-check" color="orange" />
                <StatCard label="Sprint Pendente" value={stats.pendingTasks} icon="fa-list-check" color="rose" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card title="Tarefas Recentes / Urgentes" className="lg:col-span-2 shadow-xl border border-gray-200 dark:border-white/5">
                    <div className="p-1">
                        {recentTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-10 text-gray-400 dark:text-gray-500">
                                <i className="fa-solid fa-mug-hot text-4xl mb-4 opacity-50"></i>
                                <span className="text-sm font-medium">Nenhuma tarefa pendente no momento.</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {recentTasks.map((task: any, idx: number) => (
                                    <div key={idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors rounded-xl mx-2 my-1">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-gray-900 dark:text-white text-base">{task.Título || 'Tarefa Sem Título'}</span>
                                            <span className="text-xs text-gray-500 dark:text-[#a3aac4] font-medium flex items-center gap-2">
                                                <i className="fa-regular fa-clock"></i> 
                                                {task.Data_Entrega ? new Date(task.Data_Entrega).toLocaleDateString('pt-BR') : 'Sem data definida'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 self-start sm:self-auto">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${getStatusColor(task.Status)}`}>
                                                {getStatusText(task.Status)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                <Card title="Alertas do Workspace" className="shadow-xl border border-gray-200 dark:border-white/5 bg-gradient-to-br from-gray-50 to-white dark:from-[#091328] dark:to-[#0f1930]">
                    <div className="p-5 space-y-4">
                        {alerts.map((alert, i) => (
                            <div key={i} className={`flex items-start gap-4 p-4 rounded-2xl ${alert.bg} border border-white/5`}>
                                <div className={`mt-0.5 ${alert.color}`}>
                                    <i className={`fa-solid ${alert.icon} text-xl`}></i>
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${alert.color} leading-snug`}>{alert.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 mt-2">
                <Suspense fallback={
                    <Card className="h-[360px] shadow-xl flex items-center justify-center border border-gray-200 dark:border-white/5">
                        <div className="animate-pulse flex flex-col items-center opacity-40">
                            <i className="fa-solid fa-chart-pie text-4xl mb-4 text-gray-400"></i>
                            <span className="text-sm font-bold tracking-wide uppercase text-gray-500">Inicializando módulo visual...</span>
                        </div>
                    </Card>
                }>
                    <DashboardCharts stats={stats} financas={financas} tasks={tasks} planejamento={planejamento} clients={clients} />
                </Suspense>
            </div>
            
        </div>
    );
});
