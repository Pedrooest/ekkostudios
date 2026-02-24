import React, { useMemo } from 'react';
import { Card, StatCard } from '../Components';

interface DashboardViewProps {
    clients: any[];
    tasks: any[];
    financas: any[];
    planejamento: any[];
    rdc: any[];
}

export function DashboardView({ clients, tasks, financas, planejamento, rdc }: DashboardViewProps) {
    const stats = useMemo(() => {
        const activeClients = (clients || []).filter((c: any) => c.Status === 'Ativo').length;
        const pendingPlanning = (planejamento || []).filter((p: any) => p['Status do conteúdo'] !== 'Concluído').length;
        const pendingTasks = (tasks || []).filter((t: any) => t.Status !== 'done' && t.Status !== 'arquivado').length;
        const revenue = (financas || []).filter((f: any) => f.Tipo === 'Entrada').reduce((acc: number, cur: any) => acc + (cur.Valor || 0), 0);
        return { activeClients, pendingPlanning, pendingTasks, revenue };
    }, [clients, tasks, planejamento, financas]);

    return (
        <div className="pb-10 space-y-6 md:space-y-8 animate-fade text-left mobile-container">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard label="Receita Bruta" value={`R$ ${stats.revenue.toLocaleString('pt-BR')}`} icon="fa-money-bill-trend-up" color="emerald" />
                <StatCard label="Contratos Ativos" value={stats.activeClients} icon="fa-users" color="blue" />
                <StatCard label="Produção Ativa" value={stats.pendingPlanning} icon="fa-calendar-check" color="orange" />
                <StatCard label="Sprint Pendente" value={stats.pendingTasks} icon="fa-list-check" color="rose" />
            </div>
            <Card title="Operações Globais" className="w-full">
                <div className="p-8 h-[300px] md:h-[350px] flex items-center justify-center opacity-30">
                    <i className="fa-solid fa-chart-simple text-4xl mr-4"></i>
                    <span className="font-black uppercase tracking-widest text-center">Painel Consolidado</span>
                </div>
            </Card>
        </div>
    );
}
