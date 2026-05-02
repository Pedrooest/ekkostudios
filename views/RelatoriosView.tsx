import React, { useState, useMemo } from 'react';
import { Cliente, ItemPlanejamento, Tarefa, LancamentoFinancas, ItemRdc } from '../types';
import { Card, Button, StatCard, Badge } from '../Components';
import { FileText, Download, Calendar, Users, TrendingUp, CheckCircle2, AlertCircle, Globe } from 'lucide-react';

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

  const stats = useMemo(() => {
    if (!selectedClientId) return null;
    
    const clientTasks = tasks.filter(t => t.Cliente_ID === selectedClientId);
    const clientPosts = planejamento.filter(p => p.Cliente_ID === selectedClientId);
    const clientFinancas = financas.filter(f => f.Cliente_ID === selectedClientId);

    const completedTasks = clientTasks.filter(t => t.Status === 'concluido').length;
    const publishedPosts = clientPosts.filter(p => p["Status do conteúdo"] === 'Concluído').length;
    
    const receita = clientFinancas.filter(f => f.Tipo === 'Entrada').reduce((acc, curr) => acc + (Number(curr.Valor) || 0), 0);
    const despesa = clientFinancas.filter(f => f.Tipo === 'Saída' || f.Tipo === 'Despesa').reduce((acc, curr) => acc + (Number(curr.Valor) || 0), 0);

    return {
      tasksTotal: clientTasks.length,
      tasksDone: completedTasks,
      tasksPerc: clientTasks.length > 0 ? Math.round((completedTasks / clientTasks.length) * 100) : 0,
      postsTotal: clientPosts.length,
      postsDone: publishedPosts,
      postsPerc: clientPosts.length > 0 ? Math.round((publishedPosts / clientPosts.length) * 100) : 0,
      receita,
      despesa,
      saldo: receita - despesa
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
          <select 
            value={selectedClientId} 
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="h-11 bg-app-bg border border-app-border rounded-xl px-4 text-xs font-bold uppercase outline-none focus:border-blue-500 transition-all text-app-text-strong"
          >
            <option value="">Selecionar Cliente</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.Nome}</option>
            ))}
          </select>

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
        <div className="py-20 text-center space-y-4 bg-app-surface/50 rounded-[32px] border border-dashed border-app-border">
           <div className="w-20 h-20 bg-blue-500/5 rounded-full flex items-center justify-center mx-auto text-blue-500/20">
              <Users size={40} />
           </div>
           <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-app-text-muted">Selecione um cliente para começar</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            <StatCard 
              label="Posts Publicados" 
              value={`${stats?.postsDone || 0}/${stats?.postsTotal || 0}`} 
              trend={{ value: stats?.postsPerc || 0, isUp: (stats?.postsPerc || 0) >= 50 }}
              icon={<TrendingUp size={20} />}
            />
            <StatCard 
              label="Tarefas Concluídas" 
              value={`${stats?.tasksDone || 0}/${stats?.tasksTotal || 0}`} 
              trend={{ value: stats?.tasksPerc || 0, isUp: (stats?.tasksPerc || 0) >= 50 }}
              icon={<CheckCircle2 size={20} />}
              color="emerald"
            />
            <StatCard 
              label="Resultado Financeiro" 
              value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.saldo || 0)} 
              trend={{ value: 100, isUp: (stats?.receita || 0) > 0 }}
              icon={<TrendingUp size={20} />}
              color="blue"
            />
          </div>

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
