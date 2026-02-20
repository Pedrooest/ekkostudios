import { TableType } from '../types';

export function buildContext(tab: TableType, state: any): any {
    const { clients, cobo, matriz, planejamento, rdc, tasks, financas, collaborators, vhConfig, systematicModeling } = state;

    switch (tab) {
        case 'CLIENTES':
            return {
                description: 'Lista de clientes ativos e seus objetivos.',
                data: clients.map((c: any) => ({
                    name: c.Nome,
                    niche: c.Nicho,
                    objective: c.Objetivo,
                    status: c.Status
                }))
            };

        case 'RDC':
            return {
                description: 'Matriz RDC (Resolução, Demanda, Competição) para validação de ideias.',
                data: rdc.map((r: any) => ({
                    idea: r['Ideia de Conteúdo'],
                    network: r.Rede_Social,
                    score: r['Score (R×D×C)'],
                    decision: r.Decisão
                })).filter((r: any) => r.decision !== 'Descartar e redirecionar')
            };

        case 'PLANEJAMENTO':
            // Filter for current/next week to reduce context size
            const today = new Date();
            const planningData = planejamento.map((p: any) => ({
                date: p.Data,
                content: p.Conteúdo,
                network: p.Rede_Social,
                status: p['Status do conteúdo']
            })).slice(0, 50); // Limit to recent/upcoming items

            return {
                description: 'Cronograma de postagens e status de produção.',
                data: planningData
            };

        case 'TAREFAS':
            const pendingTasks = tasks.filter((t: any) => t.Status !== 'Concluído').map((t: any) => ({
                title: t.Título,
                status: t.Status,
                priority: t.Prioridade,
                responsible: t.Responsável
            }));
            return {
                description: 'Lista de tarefas pendentes e status operacional.',
                data: pendingTasks
            };

        case 'VH':
            return {
                description: 'Dados de Valor Hora e rentabilidade.',
                config: vhConfig,
                collaborators: collaborators.map((c: any) => ({ name: c.Nome, role: c.Cargo, hours: c.HorasProdutivas }))
            };

        case 'COBO':
            return {
                description: 'Matriz COBO (Conteúdo, Objetivo, Brand, Oferta).',
                data: cobo.map((c: any) => ({ channel: c.Canal, frequency: c.Frequência, intent: c.Intenção }))
            };

        case 'MATRIZ':
            // Try to find the first selected client to provide niche/objective context
            const activeMatrizClient = state.clients.find((c: any) => state.selectedClientIds?.includes(c.id));
            return {
                description: 'Matriz Estratégica de Conteúdo.',
                clientInfo: activeMatrizClient ? {
                    name: activeMatrizClient.Nome,
                    niche: activeMatrizClient.Nicho,
                    objective: activeMatrizClient.Objetivo
                } : null,
                data: matriz.map((m: any) => ({ network: m.Rede_Social, function: m.Função, role: m['Papel estratégico'] }))
            };

        default:
            return {
                description: 'Visão geral do dashboard.',
                data: {
                    totalClients: clients.length,
                    totalTasks: tasks.length,
                    activeCampaigns: planejamento.length
                }
            };
    }
}
