
import React from 'react';
import { ConfiguracaoApresentacao, ModeloApresentacao, TipoTabela, Cliente, ItemRdc, ItemPlanejamento, Tarefa, ItemCobo, ItemMatrizEstrategica } from './types';

const TAB_TEMPLATES: Record<TipoTabela, ModeloApresentacao> = {
  DASHBOARD: {
    aba: 'DASHBOARD',
    rotulo: 'Overview Estratégico',
    subtitulo: 'Monitoramento em tempo real de ativos e pautas.',
    proximoPasso: 'Analisar gargalos operacionais e pautas pendentes.',
    chamadas: [
      { id: 1, titulo: 'Monitor de Ativos', desc: 'Controle central de clientes ativos.', top: '25%', left: '15%' }
    ]
  },
  CLIENTES: {
    aba: 'CLIENTES',
    rotulo: 'Ecossistema de Stakeholders',
    subtitulo: 'Gestão de branding e segmentação da carteira.',
    proximoPasso: 'Atualizar objetivos estratégicos de cada conta.',
    chamadas: [
      { id: 1, titulo: 'Identidade', desc: 'Cromia e nicho do parceiro.', top: '30%', left: '10%' },
      { id: 2, titulo: 'Foco e Objetivo', desc: 'Meta trimestral definida.', top: '50%', left: '50%' }
    ]
  },
  RDC: {
    aba: 'RDC',
    rotulo: 'Matriz de Validação Científica',
    subtitulo: 'Priorização de conteúdo baseada em dados objetivos.',
    proximoPasso: 'Agendar as ideias marcadas como "Implementar já".',
    chamadas: [
      { id: 1, titulo: 'Validação Objetiva', desc: 'Resolução, Demanda e Competição.', top: '35%', left: '15%' },
      { id: 2, titulo: 'Decisão Ágil', desc: 'Filtro automático do que gera ROI.', top: '60%', left: '70%' }
    ]
  },
  COBO: {
    aba: 'COBO',
    rotulo: 'Mix de Distribuição (COBO)',
    subtitulo: 'Estrutura de canais e frequência de veiculação.',
    proximoPasso: 'Garantir que a frequência sugerida está sendo cumprida.',
    chamadas: [
      { id: 1, titulo: 'Intenção por Canal', desc: 'Onde focar em atenção vs relacionamento.', top: '25%', left: '20%' },
      { id: 2, titulo: 'Formatos Táticos', desc: 'Adequação de peça para cada veículo.', top: '55%', left: '60%' }
    ]
  },
  MATRIZ: {
    aba: 'MATRIZ',
    rotulo: 'DNA de Conteúdo',
    subtitulo: 'Definição de pilares e autoridade de marca.',
    proximoPasso: 'Refinar os papéis Hero/Hub para a pauta mensal.',
    chamadas: [
      { id: 1, titulo: 'Função Estratégica', desc: 'O papel de cada post no funil.', top: '30%', left: '15%' },
      { id: 2, titulo: 'Resultado Projetado', desc: 'Expectativa de conversão ou engajamento.', top: '65%', left: '55%' }
    ]
  },
  PLANEJAMENTO: {
    aba: 'PLANEJAMENTO',
    rotulo: 'Cronograma de Produção 2026',
    subtitulo: 'Execução tática com sincronia multicanal.',
    proximoPasso: 'Iniciar produção das pautas agendadas para esta semana.',
    chamadas: [
      { id: 1, titulo: 'Status Operacional', desc: 'Acompanhamento do pipeline de aprovação.', top: '25%', left: '70%' },
      { id: 2, titulo: 'Biblioteca Integrada', desc: 'Puxar ideias validadas no RDC.', top: '55%', left: '15%' }
    ]
  },
  FINANCAS: {
    aba: 'FINANCAS',
    rotulo: 'Gestão Financeira e Fluxo',
    subtitulo: 'Controle de rentabilidade e distribuição de resultados.',
    proximoPasso: 'Revisar saldo líquido e provisionar repasses.',
    chamadas: [
      { id: 1, titulo: 'Saldo Operacional', desc: 'Visão de entradas vs saídas reais.', top: '25%', left: '15%' },
      { id: 2, titulo: 'Regra de Lucros', desc: 'Divisão estratégica 30/30/40.', top: '60%', left: '70%' }
    ]
  },
  TAREFAS: {
    aba: 'TAREFAS',
    rotulo: 'Workflow de Operações',
    subtitulo: 'Pipeline de design, copy e atendimento.',
    proximoPasso: 'Desbloquear tarefas em aprovação.',
    chamadas: [
      { id: 1, titulo: 'Vínculo Direto', desc: 'Tarefa ligada ao post do plano.', top: '30%', left: '15%' },
      { id: 2, titulo: 'Prioridade ClickUp', desc: 'Foco total no que é urgente.', top: '60%', left: '70%' }
    ]
  },
  VH: {
    aba: 'VH',
    rotulo: 'Gestão de Valor Hora',
    subtitulo: 'Engenharia operacional e lucratividade.',
    proximoPasso: 'Avaliar contratos com carga operacional acima do esperado.',
    chamadas: [
      { id: 1, titulo: 'Custo de Hora Real', desc: 'Quanto custa 60min de agência.', top: '25%', left: '15%' },
      { id: 2, titulo: 'Carga Horária', desc: 'Resultado operacional por cliente.', top: '60%', left: '75%' }
    ]
  },
  ORGANICKIA: {
    aba: 'ORGANICKIA',
    rotulo: 'OrganickAI 2.0',
    subtitulo: 'Inteligência Artificial aplicada ao Método Organick.',
    proximoPasso: 'Utilizar a IA para gerar roteiros e ganchos de alta conversão.',
    chamadas: [
      { id: 1, titulo: 'Cérebro Estratégico', desc: 'Briefing consolidado para ganchos magnéticos.', top: '30%', left: '20%' },
      { id: 2, titulo: 'Integração Direta', desc: 'Dados reais transformados em criatividade.', top: '55%', left: '70%' }
    ]
  },
  WHITEBOARD: {
    aba: 'WHITEBOARD',
    rotulo: 'Ecossistema Visual (Whiteboard)',
    subtitulo: 'Mapeamento de ideias e conexões estratégicas.',
    proximoPasso: 'Consolidar as conexões visuais no plano tático.',
    chamadas: []
  },
  IA_HISTORY: {
    aba: 'IA_HISTORY',
    rotulo: 'Log de Inteligência',
    subtitulo: 'Histórico de conversas e insights gerados pela IA.',
    proximoPasso: 'Reativar insights antigos para novas campanhas.',
    chamadas: []
  },
  WORKSPACE: {
    aba: 'WORKSPACE',
    rotulo: 'Configuração de Workspace',
    subtitulo: 'Gestão de membros e ativos do ecossistema.',
    proximoPasso: 'Garantir que todos os membros tenham acesso aos ativos.',
    chamadas: []
  }
};

interface PresentationSlideProps {
  tab: TipoTabela;
  config: ConfiguracaoApresentacao;
  data: {
    clients: Cliente[];
    rdc: ItemRdc[];
    planning: ItemPlanejamento[];
    tasks: Tarefa[];
    cobo: ItemCobo[];
    matriz: ItemMatrizEstrategica[];
    finances: any[];
  };
  clientColor?: string;
  selectedClient?: Cliente;
}

export const PresentationSlide: React.FC<PresentationSlideProps> = ({ tab, config, data, clientColor, selectedClient }) => {
  const template = TAB_TEMPLATES[tab];
  const isDark = config.tema === 'dark';
  const bgColor = isDark ? '#0B0F19' : '#F9FAFB';
  const textColor = isDark ? '#F9FAFB' : '#0B0F19';
  const accentColor = clientColor || '#3B82F6';

  const renderDataPreview = () => {
    switch (tab) {
      case 'CLIENTES':
        return (
          <div className="space-y-4">
            {(data?.clients || []).slice(0, 4).map(c => (
              <div key={c.id} className="p-4 border border-gray-700/30 bg-gray-900/40 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold uppercase tracking-tight">{c.Nome}</div>
                  <div className="text-[10px] opacity-60 font-semibold">{c.Nicho}</div>
                </div>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c["Cor (HEX)"] }}></div>
              </div>
            ))}
          </div>
        );
      case 'RDC':
        return (
          <div className="space-y-2">
            {(data?.rdc || []).slice(0, 5).map(r => (
              <div key={r.id} className="p-3 border border-gray-700/30 bg-gray-900/40 rounded-lg grid grid-cols-4 items-center">
                <div className="col-span-2 text-xs font-bold truncate tracking-tight">{r["Ideia de Conteúdo"]}</div>
                <div className="text-[10px] text-center font-bold">Score: {r["Score (R×D×C)"]}</div>
                <div className={`text-[9px] uppercase font-black text-right ${r.Decisão.includes('já') ? 'text-emerald-500' : 'text-blue-500'}`}>{r.Decisão}</div>
              </div>
            ))}
          </div>
        );
      case 'PLANEJAMENTO':
        return (
          <div className="grid grid-cols-7 gap-1 h-full">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square border border-gray-700/20 rounded bg-gray-900/20 p-1">
                {i % 4 === 0 && <div className="w-full h-1 rounded-full bg-blue-500 opacity-40"></div>}
              </div>
            ))}
          </div>
        );
      case 'FINANCAS':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                <div className="text-[10px] font-black uppercase text-emerald-500">Fluxo de Entradas</div>
                <div className="text-2xl font-black text-white">R$ --.--</div>
              </div>
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                <div className="text-[10px] font-black uppercase text-rose-500">Saídas e Custos</div>
                <div className="text-2xl font-black text-white">R$ --.--</div>
              </div>
            </div>
            <div className="p-6 border border-gray-700/30 bg-gray-900/40 rounded-2xl">
              <div className="text-[10px] font-black uppercase text-gray-400 mb-2">Engenharia de Lucros</div>
              <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[60%]"></div>
              </div>
            </div>
          </div>
        );
      case 'TAREFAS':
        return (
          <div className="space-y-4">
            {(data?.tasks || []).filter(t => !t.__arquivado).slice(0, 5).map(t => (
              <div key={t.id} className="p-3 border border-gray-700/30 bg-gray-900/40 rounded-xl flex items-center gap-3">
                <div className="w-1 h-8 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <div className="text-[11px] font-black uppercase truncate tracking-tight">{t.Título}</div>
                  <div className="text-[9px] opacity-40 uppercase tracking-[0.1em] font-bold">{t.Responsável || 'Sem Resp.'} • {t.Status}</div>
                </div>
                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${t.Prioridade === 'Alta' ? 'bg-rose-500 text-white' : 'border border-gray-600'}`}>{t.Prioridade}</div>
              </div>
            ))}
          </div>
        );
      case 'VH':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-10 border-2 border-dashed border-gray-800 rounded-[30px]">
              <div className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-40">Engenharia VH</div>
              <div className="text-6xl font-black tracking-tighter" style={{ color: accentColor }}>OPERACIONAL</div>
              <div className="text-xs font-bold uppercase tracking-widest mt-2 opacity-60">Foco em Produtividade Agência</div>
            </div>
          </div>
        );
      case 'ORGANICKIA':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-24 h-24 rounded-3xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shadow-xl">
              <i className="fa-solid fa-robot text-5xl text-blue-500"></i>
            </div>
            <div className="text-center">
              <div className="text-sm font-black uppercase tracking-[0.3em] text-blue-500">Inteligência Ativa</div>
              <div className="text-xs text-gray-500 mt-2 uppercase font-bold tracking-widest">Processamento de Briefing Organick</div>
            </div>
          </div>
        );
      default:
        return <div className="text-sm opacity-20 italic">Visualização não disponível</div>;
    }
  };

  return (
    <div
      className="p-20 flex flex-col h-full w-full relative overflow-hidden"
      style={{ backgroundColor: bgColor, color: textColor, fontFamily: 'var(--font-main)' }}
    >
      <div className="absolute top-10 right-20 opacity-20 text-xs font-bold tracking-[0.5em] flex gap-1 items-baseline">
        <span>E</span><span>K</span><span style={{ transform: 'scaleX(-1)', display: 'inline-block' }}>K</span><span>O</span>
      </div>

      <header className="mb-16">
        <div className="flex flex-col gap-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.5em]" style={{ color: accentColor }}>EKKO STUDIOS — DOCUMENTAÇÃO DE ATIVOS</h4>
          <h1 className="text-7xl font-bold tracking-tighter leading-none uppercase">
            {selectedClient ? `${selectedClient.Nome} — ` : ''}{template?.rotulo || 'Apresentação'}
          </h1>
        </div>
        <p className="text-2xl font-medium mt-6 max-w-3xl leading-relaxed text-gray-400">
          {template?.subtitulo || 'Relatório operacional e tático.'}
        </p>
      </header>

      <div className="flex-1 flex gap-20">
        <div className="flex-[1.8] relative border border-gray-800/30 bg-gray-500/5 rounded-[40px] p-12 overflow-hidden flex flex-col">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `linear-gradient(${accentColor} 1px, transparent 1px), linear-gradient(90deg, ${accentColor} 1px, transparent 1px)`, backgroundSize: '80px 80px' }}></div>

          <div className="relative z-10 flex-1">
            {renderDataPreview()}
          </div>

          {template?.chamadas?.map((c) => (
            <div key={c.id} className="absolute z-20 flex flex-col items-center group pointer-events-none" style={{ top: c.top, left: c.left }}>
              <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-lg shadow-2xl backdrop-blur-md"
                style={{ borderColor: accentColor, backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', color: textColor }}>
                {c.id}
              </div>
              <div className="mt-4 px-6 py-3 bg-black/80 backdrop-blur-xl rounded-2xl text-center border border-white/10 shadow-2xl min-w-[180px]">
                <h5 className="text-[11px] font-black uppercase tracking-widest text-white mb-1">{c.titulo}</h5>
                <p className="text-[9px] text-gray-400 font-medium leading-tight">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-12">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8" style={{ color: accentColor }}>Propriedades da Aba</h3>
            <div className="space-y-10">
              {template?.chamadas?.map((c) => (
                <div key={c.id} className="flex gap-6 items-start border-l-2 border-gray-800/30 pl-8 py-2">
                  <div className="text-4xl font-black opacity-10" style={{ color: accentColor }}>{String(c.id).padStart(2, '0')}</div>
                  <div>
                    <h3 className="text-lg font-bold uppercase tracking-widest leading-none mb-2">{c.titulo}</h3>
                    <p className="text-sm font-semibold leading-relaxed text-gray-500">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-16 flex justify-between items-end border-t border-gray-800/20 pt-10">
        <div className="space-y-1">
          <div className="text-[9px] font-black tracking-[0.3em] uppercase opacity-30">MÉTODO ORGANICK — AGENCY INTELLIGENCE</div>
          <div className="text-[10px] font-bold text-gray-400"><i className="fa-solid fa-arrow-right mr-2 opacity-40"></i>{template?.proximoPasso || 'Ação sugerida.'}</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-[9px] font-black text-gray-600 uppercase">Status</div>
            <div className="text-xs font-bold uppercase tracking-tighter" style={{ color: accentColor }}>Verificado • EKKO STUDIOS</div>
          </div>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-800/50 border border-gray-700/50">
            <i className="fa-solid fa-layer-group text-lg opacity-40"></i>
          </div>
        </div>
      </footer>
    </div>
  );
};
