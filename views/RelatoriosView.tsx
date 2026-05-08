import React, { useState, useMemo } from 'react';
import { Cliente, ItemPlanejamento, Tarefa, LancamentoFinancas, ItemRdc } from '../types';
import { Card, Button, StatCard, Badge, PSelectPortal } from '../Components';
import { FileText, Download, Calendar, Users, TrendingUp, CheckCircle2, AlertCircle, Globe, Target, DollarSign, BarChart3, Zap } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';

interface RelatoriosViewProps {
  clients: Cliente[];
  planejamento: ItemPlanejamento[];
  tasks: Tarefa[];
  financas: LancamentoFinancas[];
  rdc: ItemRdc[];
}

const RelatoriosView: React.FC<RelatoriosViewProps> = ({ clients, planejamento, tasks, financas, rdc }) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [periodo, setPeriodo] = useState<'mes' | 'trimestre' | 'ano'>('mes');

  const selectedClient = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  const stats = useMemo(() => {
    if (!selectedClientId) return null;

    const clientTasks = tasks.filter(t => t.Cliente_ID === selectedClientId);
    const clientPosts = planejamento.filter(p => p.Cliente_ID === selectedClientId);
    const clientFinancas = financas.filter(f => f.Cliente_ID === selectedClientId);

    const completedTasks = clientTasks.filter(t => ['done', 'concluido', 'Concluído', 'CONCLUÍDO'].includes(t.Status)).length;
    const publishedPosts = clientPosts.filter(p => p["Status do conteúdo"] === 'Concluído').length;

    const receita = clientFinancas.filter(f => f.Tipo === 'Entrada').reduce((acc, curr) => acc + (Number(curr.Valor) || 0), 0);
    const despesa = clientFinancas.filter(f => f.Tipo === 'Saída' || f.Tipo === 'Despesa').reduce((acc, curr) => acc + (Number(curr.Valor) || 0), 0);

    // Posts por plataforma
    const postsByPlatform: Record<string, { total: number; done: number }> = {};
    clientPosts.forEach(p => {
      const net = p.Rede_Social || 'Outros';
      if (!postsByPlatform[net]) postsByPlatform[net] = { total: 0, done: 0 };
      postsByPlatform[net].total++;
      if (p["Status do conteúdo"] === 'Concluído') postsByPlatform[net].done++;
    });
    const platformData = Object.entries(postsByPlatform).map(([name, v]) => ({ name, total: v.total, done: v.done }));

    // Tasks por status
    const taskStatusData = [
      { name: 'Concluídas', value: completedTasks, color: '#10b981' },
      { name: 'Pendentes', value: clientTasks.filter(t => t.Status === 'todo').length, color: '#6366f1' },
      { name: 'Em progresso', value: clientTasks.filter(t => t.Status === 'in-progress').length, color: '#f59e0b' },
    ].filter(d => d.value > 0);

    return {
      tasksTotal: clientTasks.length,
      tasksDone: completedTasks,
      tasksPerc: clientTasks.length > 0 ? Math.round((completedTasks / clientTasks.length) * 100) : 0,
      postsTotal: clientPosts.length,
      postsDone: publishedPosts,
      postsPerc: clientPosts.length > 0 ? Math.round((publishedPosts / clientPosts.length) * 100) : 0,
      receita, despesa, saldo: receita - despesa,
      platformData, taskStatusData,
    };
  }, [selectedClientId, tasks, planejamento, financas]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade">
      {/* Header & Controls - Hidden in Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-app-surface p-6 rounded-[24px] border border-app-border print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-app-text-strong">Relatórios de Performance</h1>
            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest">Gere e exporte relatórios estratégicos por cliente</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <PSelectPortal
            value={selectedClientId}
            onChange={setSelectedClientId}
            placeholder="Selecionar Cliente"
            className="min-w-[200px]"
            options={clients.map(c => ({ value: c.id, label: c.Nome }))}
          />

          <div className="flex bg-app-bg p-1 rounded-xl border border-app-border">
            {(['mes', 'trimestre', 'ano'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${periodo === p ? 'bg-blue-600 text-white shadow-lg' : 'text-app-text-muted hover:text-app-text-strong'}`}
              >
                {p === 'mes' ? 'Mês' : p === 'trimestre' ? 'Trimestre' : 'Ano'}
              </button>
            ))}
          </div>

          <Button 
            onClick={handlePrint} 
            disabled={!selectedClientId}
            className="!h-11 !rounded-xl !bg-app-text-strong !text-app-bg hover:scale-105 active:scale-95 transition-all"
          >
            <Download size={16} className="mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>

      {!selectedClientId ? (
        <div className="py-28 text-center flex flex-col items-center justify-center border border-app-border rounded-[32px] bg-app-surface/30 gap-5">
          <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
            <BarChart3 size={32} className="text-white" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-black uppercase tracking-tight text-app-text-strong">Selecione um cliente</h3>
            <p className="text-[11px] font-bold text-app-text-muted uppercase tracking-widest max-w-xs">Escolha um cliente no seletor acima para visualizar o relatório completo de performance.</p>
          </div>
        </div>
      ) : (
        <div className="report-content space-y-8 animate-fade-up">
          {/* Print Only Header */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-app-border pb-6 mb-10">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black" style={{ backgroundColor: selectedClient?.['Cor (HEX)'] || '#3b82f6' }}>
                    {selectedClient?.Nome?.charAt(0)}
                </div>
                <div>
                   <h1 className="text-3xl font-black uppercase tracking-tighter text-black">{selectedClient?.Nome}</h1>
                   <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Relatório Estratégico | {periodo === 'mes' ? 'Mês Atual' : periodo === 'trimestre' ? 'Trimestre' : 'Anual'}</p>
                </div>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black uppercase text-gray-400">Gerado em</p>
                <p className="text-sm font-bold text-black">{new Date().toLocaleDateString('pt-BR')}</p>
             </div>
          </div>

          {/* Resumo Executivo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 card-grid">
            <div className="bg-app-surface rounded-[24px] border border-app-border p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Globe size={24} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-app-text-muted mb-0.5">Posts Publicados</p>
                <p className="text-2xl font-black text-app-text-strong tabular-nums">{stats?.postsDone || 0}<span className="text-sm text-app-text-muted font-bold">/{stats?.postsTotal || 0}</span></p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${stats?.postsPerc || 0}%` }}/>
                  </div>
                  <span className="text-[9px] font-black text-indigo-500">{stats?.postsPerc || 0}%</span>
                </div>
              </div>
            </div>
            <div className="bg-app-surface rounded-[24px] border border-app-border p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-app-text-muted mb-0.5">Tarefas Concluídas</p>
                <p className="text-2xl font-black text-app-text-strong tabular-nums">{stats?.tasksDone || 0}<span className="text-sm text-app-text-muted font-bold">/{stats?.tasksTotal || 0}</span></p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${stats?.tasksPerc || 0}%` }}/>
                  </div>
                  <span className="text-[9px] font-black text-emerald-500">{stats?.tasksPerc || 0}%</span>
                </div>
              </div>
            </div>
            <div className={`rounded-[24px] border p-6 flex items-center gap-5 ${(stats?.saldo || 0) >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-900/30' : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-900/30'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${(stats?.saldo || 0) >= 0 ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                <DollarSign size={24} className={(stats?.saldo || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-app-text-muted mb-0.5">Resultado Financeiro</p>
                <p className={`text-xl font-black tabular-nums ${(stats?.saldo || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(stats?.saldo || 0)}
                </p>
                <p className="text-[9px] font-bold text-app-text-muted mt-0.5">
                  R$ {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(stats?.receita || 0)} in · R$ {new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(stats?.despesa || 0)} out
                </p>
              </div>
            </div>
          </div>

          {/* CHARTS ROW */}
          {stats && (stats.platformData.length > 0 || stats.taskStatusData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Posts por plataforma */}
              {stats.platformData.length > 0 && (
                <Card className="p-6 !rounded-[28px] space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <BarChart3 size={18} className="text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-app-text-strong">Posts por Plataforma</h3>
                      <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Total planejado vs. publicado</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={stats.platformData} barCategoryGap="35%" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#f4f4f5'} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 700, fill: isDark ? '#71717a' : '#a1a1aa', textTransform: 'uppercase' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: isDark ? '#71717a' : '#a1a1aa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', background: isDark ? '#18181b' : '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '11px', fontWeight: 700 }}
                        cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                      />
                      <Bar dataKey="total" name="Planejados" fill={isDark ? '#3f3f46' : '#e4e4e7'} radius={[4,4,0,0]} />
                      <Bar dataKey="done" name="Publicados" fill="#6366f1" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 pt-1">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: isDark ? '#3f3f46' : '#e4e4e7' }}/><span className="text-[9px] font-bold text-app-text-muted uppercase">Planejados</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"/><span className="text-[9px] font-bold text-app-text-muted uppercase">Publicados</span></div>
                  </div>
                </Card>
              )}

              {/* Tasks por status */}
              {stats.taskStatusData.length > 0 && (
                <Card className="p-6 !rounded-[28px] space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Target size={18} className="text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-app-text-strong">Status das Tarefas</h3>
                      <p className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">{stats.tasksDone} de {stats.tasksTotal} concluídas</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <ResponsiveContainer width={160} height={160}>
                        <PieChart>
                          <Pie
                            data={stats.taskStatusData}
                            cx="50%" cy="50%"
                            innerRadius={52} outerRadius={72}
                            paddingAngle={3}
                            dataKey="value"
                            isAnimationActive
                            animationBegin={0}
                            animationDuration={800}
                          >
                            {stats.taskStatusData.map((entry, index) => (
                              <Cell key={index} fill={entry.color} strokeWidth={0} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', background: isDark ? '#18181b' : '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontSize: '11px', fontWeight: 700 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-app-text-strong">{stats.tasksPerc}%</span>
                        <span className="text-[8px] font-black text-app-text-muted uppercase tracking-widest">concluído</span>
                      </div>
                    </div>
                    <div className="ml-6 space-y-2">
                      {stats.taskStatusData.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }}/>
                          <span className="text-[10px] font-bold text-app-text-muted uppercase">{d.name}</span>
                          <span className="text-[10px] font-black text-app-text-strong ml-1">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 stagger">
            {/* Metas e OKRs */}
            <Card className="p-8 !rounded-[32px] space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-app-text-strong">Metas & OKRs</h3>
                <Badge color="blue">Operacional</Badge>
              </div>
              <div className="space-y-6">
                {selectedClient?.metas && selectedClient.metas.length > 0 ? (
                  selectedClient.metas.map((meta, idx) => {
                    const progresso = meta.valor_meta > 0 ? Math.round((meta.valor_atual / meta.valor_meta) * 100) : 0;
                    return (
                      <div key={idx} className="space-y-2">
                         <div className="flex justify-between text-[11px] font-bold uppercase text-app-text-muted">
                            <span>{meta.titulo}</span>
                            <span>{progresso}%</span>
                         </div>
                         <div className="h-2 bg-app-bg border border-app-border rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 transition-all duration-1000" 
                              style={{ width: `${Math.min(100, progresso)}%` }}
                            />
                         </div>
                         <p className="text-xs font-bold text-app-text-strong">{meta.metrica}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-app-text-muted italic">Nenhuma meta configurada para este cliente.</p>
                )}
              </div>
            </Card>

            {/* Conteúdo Produzido */}
            <Card className="p-8 !rounded-[32px] space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-app-text-strong">Conteúdo Concluído</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-app-text-muted border-b border-app-border">
                      <th className="pb-3 px-2">Data</th>
                      <th className="pb-3 px-2">Plataforma</th>
                      <th className="pb-3 px-2">Conteúdo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/50">
                    {planejamento
                      .filter(p => p.Cliente_ID === selectedClientId && p["Status do conteúdo"] === 'Concluído')
                      .slice(0, 5)
                      .map((p, idx) => (
                        <tr key={idx} className="text-[10px] font-bold uppercase text-app-text-strong">
                          <td className="py-4 px-2">{new Date(p.Data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                          <td className="py-4 px-2">
                             <div className="flex items-center gap-2">
                                <Globe size={14} className="text-blue-500" />
                                {p.Rede_Social}
                             </div>
                          </td>
                          <td className="py-4 px-2 truncate max-w-[150px]">{p.Conteúdo}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Próximos Passos */}
          <Card className="p-8 !rounded-[32px] bg-blue-600 dark:bg-blue-600/10 border-none">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                   <h3 className="text-sm font-black uppercase tracking-widest text-white">Próximos Passos & Estratégia</h3>
                   <p className="text-xs font-medium text-blue-100 dark:text-blue-300">Foque nas tarefas de alta prioridade e na constância de publicações para atingir as metas de {periodo === 'mes' ? 'próximo mês' : 'ciclo'}.</p>
                </div>
                <div className="flex gap-4">
                   <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-center min-w-[100px]">
                      <p className="text-[10px] font-black uppercase text-blue-100 mb-1">Pendentes</p>
                      <p className="text-2xl font-black text-white">{stats?.tasksTotal ? stats.tasksTotal - stats.tasksDone : 0}</p>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl text-center min-w-[100px]">
                      <p className="text-[10px] font-black uppercase text-blue-100 mb-1">Em Produção</p>
                      <p className="text-2xl font-black text-white">{planejamento.filter(p => p.Cliente_ID === selectedClientId && p["Status do conteúdo"] === 'Em produção').length}</p>
                   </div>
                </div>
             </div>
          </Card>
        </div>
      )}

      {/* Styled Print Layout */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .app-main-content { margin: 0 !important; padding: 0 !important; }
          .report-content { display: block !important; }
          .print\\:hidden { display: none !important; }
          .print\\:flex { display: flex !important; }
          @page {
            size: A4;
            margin: 20mm;
          }
          .bg-app-surface, .bg-app-bg {
            background: white !important;
            border: 1px solid #eee !important;
          }
           .bg-blue-600 {
            background-color: #2563eb !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
          }
          .text-app-text-strong { color: black !important; }
          .text-app-text-muted { color: #666 !important; }
        }
      `}</style>
    </div>
  );
};

export default RelatoriosView;
