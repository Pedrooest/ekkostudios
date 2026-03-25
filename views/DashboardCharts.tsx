import React, { useMemo } from 'react';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Card } from '../Components';

interface DashboardChartsProps {
    stats: any;
    financas: any[];
    tasks: any[];
    planejamento: any[];
    clients: any[];
}

export default function DashboardCharts({ stats, financas, tasks, planejamento, clients }: DashboardChartsProps) {
    const financas6Meses = useMemo(() => {
        if (!Array.isArray(financas)) return [];
        const months = new Map();
        const today = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace(' de ', '/');
            months.set(key, { name: label, Entrada: 0, Saida: 0 });
        }

        financas.filter(f => !f.__archived).forEach(f => {
            if (!f.Data) return;
            const date = new Date(f.Data);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (months.has(key)) {
                const monthNode = months.get(key);
                const val = parseFloat(String(f.Valor || 0).replace(/\./g, '').replace(',', '.')) || 0;
                if (f.Tipo === 'Entrada' || f.Tipo === 'Receita') monthNode.Entrada += val;
                else if (f.Tipo === 'Saída' || f.Tipo === 'Despesa') monthNode.Saida += val;
            }
        });

        return Array.from(months.values());
    }, [financas]);

    const distribuicaoTarefas = useMemo(() => {
        if (!Array.isArray(tasks)) return [];
        const counts: Record<string, number> = { todo: 0, doing: 0, review: 0, blocked: 0, done: 0 };
        tasks.filter(t => !t.__archived).forEach(t => {
            const st = t.Status?.toLowerCase();
            if (counts[st] !== undefined) counts[st]++;
            else counts.todo++;
        });
        
        return [
            { name: 'A Fazer', value: counts.todo, color: '#3b82f6' },
            { name: 'Fazendo', value: counts.doing, color: '#f59e0b' },
            { name: 'Aprovação', value: counts.review, color: '#a855f7' },
            { name: 'Bloqueado', value: counts.blocked, color: '#ef4444' },
            { name: 'Concluído', value: counts.done, color: '#22c55e' }
        ].filter(i => i.value > 0);
    }, [tasks]);

    const planejamentoPorCliente = useMemo(() => {
        if (!Array.isArray(planejamento) || !Array.isArray(clients)) return [];
        const activePosts = planejamento.filter(p => !p.__archived && p['Status do conteúdo'] !== 'Concluído');
        
        const counts: Record<string, number> = {};
        activePosts.forEach(p => {
            const cId = p.Cliente_ID;
            if (cId) counts[cId] = (counts[cId] || 0) + 1;
        });

        const data = Object.keys(counts).map(cId => {
            const cliente = clients.find(c => c.id === cId);
            return {
                name: cliente ? (cliente.Nome.split(' ')[0]) : 'Geral',
                posts: counts[cId]
            };
        }).sort((a, b) => b.posts - a.posts).slice(0, 5);
        
        return data;
    }, [planejamento, clients]);

    const tooltipStyle = { 
        borderRadius: '12px', 
        border: '1px solid rgba(255,255,255,0.05)', 
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3)', 
        backgroundColor: '#0f1930', 
        color: '#fff', 
        fontWeight: 600,
        fontSize: '12px'
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full animate-fade">
            
            {/* Line Chart: Financas */}
            <Card title="Evolução Financeira (Últimos 6 meses)" className="lg:col-span-2 shadow-xl border border-gray-200 dark:border-white/5">
                <div className="p-4 sm:p-6 h-[300px]">
                    {financas6Meses.filter(m => m.Entrada > 0 || m.Saida > 0).length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">Sem lançamentos nos últimos 6 meses.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={financas6Meses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}`} />
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                                <Line type="monotone" name="Entradas" dataKey="Entrada" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                <Line type="monotone" name="Saídas" dataKey="Saida" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>

            {/* Pie Chart: Status das Tarefas */}
            <Card title="Distribuição de Tarefas" className="shadow-xl border border-gray-200 dark:border-white/5 h-full hover:border-[#a855f7]/30 transition-colors">
                <div className="p-4 sm:p-6 h-[250px] flex items-center justify-center">
                    {distribuicaoTarefas.length === 0 ? (
                        <div className="text-gray-500 font-medium">Nenhuma tarefa ativa computada.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
                                <Pie 
                                    data={distribuicaoTarefas} 
                                    cx="50%" 
                                    cy="50%" 
                                    innerRadius={50} 
                                    outerRadius={80} 
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {distribuicaoTarefas.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>

            {/* Bar Chart: Posts por Cliente */}
            <Card title="Top Planejamento de Posts (Ativos)" className="shadow-xl border border-gray-200 dark:border-white/5 h-full hover:border-[#3b82f6]/30 transition-colors">
                <div className="p-4 sm:p-6 h-[250px]">
                    {planejamentoPorCliente.length === 0 ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">Nenhum post ativo no planejamento.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={planejamentoPorCliente} margin={{ top: 10, right: 30, left: -20, bottom: 0 }} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" opacity={0.05} horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} hide />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={tooltipStyle} itemStyle={{ color: '#fff' }} />
                                <Bar dataKey="posts" name="Posts Planejados" radius={[0, 4, 4, 0]} maxBarSize={30}>
                                    {planejamentoPorCliente.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#3b82f6" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>

        </div>
    );
}
