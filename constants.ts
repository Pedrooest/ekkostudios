
import { TableType, TaskTemplate, TaskStatus, TaskViewConfig, VhConfig, ContentLibrary } from './types';

export const SOCIAL_NETWORKS = ["Instagram", "YouTube", "TikTok", "LinkedIn", "Facebook", "Threads", "Twitter/X"];

export const DEFAULT_CONTENT_LIBRARY: ContentLibrary = {
  "Instagram": ["Reels", "Carrossel", "Post Feed", "Stories", "Live", "Colab"],
  "YouTube": ["Shorts", "Vídeo longo", "Live", "Comunidade"],
  "TikTok": ["Vídeo curto", "Trend", "Educativo", "Narrativa"],
  "LinkedIn": ["Post", "Carrossel", "Artigo", "Vídeo"],
  "Facebook": ["Post", "Vídeo", "Stories", "Live"]
};

export const CLIENTES_COLS = ["Nome", "Nicho", "Responsável", "WhatsApp", "Instagram", "Objetivo", "Cor (HEX)", "Status"];
export const COBO_COLS = ["Cliente_ID", "Canal", "Frequência", "Público", "Voz", "Zona", "Intenção", "Formato"];
export const MATRIZ_ESTRATEGICA_COLS = ["Cliente_ID", "Rede_Social", "Função", "Quem fala", "Papel estratégico", "Tipo de conteúdo", "Resultado esperado"];

// CONSTANTES MATRIZ ESTRATEGICA (Dropdowns)
export const MATRIZ_FUNCAO_OPTIONS = [
  "Autoridade", "Posicionamento", "Conversão", "Relacionamento",
  "Educação", "Prova Social", "Diferenciação", "Aquecimento de Lead", "Retenção"
];

export const MATRIZ_QUEM_FALA_OPTIONS = [
  "Fundador", "Sócio", "Especialista", "Equipe",
  "Marca (Institucional)", "Cliente", "Parceiro", "Narrador / IA"
];

export const MATRIZ_PAPEL_ESTRATEGICO_OPTIONS = [
  "Gerar demanda", "Aumentar percepção de valor", "Diminuir objeção",
  "Educar mercado", "Atrair lead qualificado", "Reforçar autoridade",
  "Engajar base", "Preparar para oferta", "Escalar awareness"
];

export const MATRIZ_TIPO_CONTEUDO_OPTIONS = [
  "Conteúdo raiz", "Corte", "Reaproveitamento", "Bastidores", "Tutorial",
  "Storytelling", "Prova social", "Diagnóstico", "Lista / Carrossel", "Opinião"
];

export const MATRIZ_RESULTADO_ESPERADO_OPTIONS = [
  "Comentário", "Direct", "Clique no link", "Salvamento",
  "Compartilhamento", "Agendamento", "Compra", "Seguir perfil", "Responder Story"
];

// CONSTANTES COBO (Dropdowns)
export const COBO_CANAL_OPTIONS = [
  "Instagram Reels", "Instagram Feed", "Instagram Stories", "YouTube Shorts", "YouTube Vídeo longo",
  "TikTok", "LinkedIn", "Facebook", "Pinterest", "Kwai", "WhatsApp", "Email", "Telegram"
];

export const COBO_FREQUENCIA_OPTIONS = [
  "Diário", "5x por semana", "3x por semana", "2x por semana", "Semanal", "Quinzenal", "Mensal", "Sob demanda"
];

export const COBO_PUBLICO_OPTIONS = [
  "Frio", "Morno", "Quente", "Leads", "Clientes", "Comunidade"
];

export const COBO_VOZ_OPTIONS = [
  "Educativa", "Autoridade", "Conversacional", "Provocativa", "Inspiradora", "Técnica", "Humana/Próxima", "Comercial"
];

export const COBO_ZONA_OPTIONS = [
  "Primária", "Secundária", "Paralela", "Aquisição", "Nutrição", "Conversão", "Retenção"
];

export const COBO_INTENCAO_OPTIONS = [
  "Atenção", "Engajamento", "Educação", "Autoridade", "Desejo", "Conversão", "Relacionamento", "Retenção"
];

export const COBO_FORMATO_OPTIONS = [
  "Vídeo curto", "Carrossel", "Post imagem", "Stories", "Live", "Bastidores", "Tutorial", "Prova social", "Oferta", "Texto educativo"
];
export const RDC_COLS = ["Cliente_ID", "Ideia de Conteúdo", "Rede_Social", "Tipo de conteúdo", "Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)", "Score (R×D×C)", "Decisão"];

export const PLANEJAMENTO_COLS = [
  "Cliente_ID", "Data", "Hora", "Conteúdo", "Rede_Social", "Tipo de conteúdo", "Função", "Intenção", "Gancho", "CTA", "Status do conteúdo"
];

export const FINANCAS_COLS = [
  "Lancamento_ID", "Data", "Tipo", "Categoria", "Descrição", "Valor",
  "Recorrência", "Data_Início", "Data_Fim", "Dia_Pagamento", "Observações"
];

export const TAREFAS_COLS = ["Task_ID", "Cliente_ID", "Título", "Status", "Prioridade", "Responsável", "Data_Entrega", "Área", "Relacionado_Conteudo"];

export const FUNCAO_OPTIONS = ["Hero", "Hub", "Help", "Autoridade", "Relacional"];
export const ZONA_OPTIONS = ["Quente", "Morna", "Fria"];
export const STATUS_OPTIONS = ["Ativo", "Pausado", "Prospect"];

export const FINANCAS_TIPO_OPTIONS = ["Entrada", "Saída", "Despesa", "Assinatura"];
export const FINANCAS_SERVICOS_OPTIONS = [
  "Gestão de Tráfego", "Social Media", "Design Gráfico", "Consultoria Estratégica",
  "Produção de Vídeo", "Criação de Conteúdo", "Assessoria", "Outros"
];

export const PLANNING_STATUS_OPTIONS = ['Em espera', 'Aguardando aprovação', 'Produção', 'Publicado', 'Concluído'];

export const AREA_OPTIONS = [
  "Conteúdo", "Design", "Captação/Comercial", "Tráfego", "Financeiro",
  "Reunião/Cliente", "Operação interna", "Estratégia", "Aprovação", "Suporte"
];
export const PRIORIDADE_OPTIONS = ["Urgente", "Alta", "Média", "Baixa"];

export const TABLE_LABELS: Record<TableType, string> = {
  DASHBOARD: 'Dashboard',
  CLIENTES: 'Clientes',
  RDC: 'Validação RDC',
  MATRIZ: 'Matriz Estratégica',
  COBO: 'Canais (COBO)',
  PLANEJAMENTO: 'Planejamento',
  FINANCAS: 'Finanças',
  TAREFAS: 'Fluxo de Tarefas',
  VH: 'Gestão de VH',
  ORGANICKIA: 'ORGANICKIA',
  WHITEBOARD: 'Quadro Branco'
};

export const WEEKDAYS_BR = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const DEFAULT_TASK_STATUSES: TaskStatus[] = [
  { id: 'backlog', label: 'Backlog', order: 1, color: '#6B7280' },
  { id: 'todo', label: 'A Fazer', order: 2, color: '#3B82F6' },
  { id: 'doing', label: 'Em Andamento', order: 3, color: '#F59E0B' },
  { id: 'review', label: 'Em Aprovação', order: 4, color: '#A855F7' },
  { id: 'blocked', label: 'Bloqueado', order: 5, color: '#EF4444' },
  { id: 'done', label: 'Concluído', order: 6, color: '#22C55E' }
];

export const TASK_TEMPLATES: TaskTemplate[] = [
  { id: 'tpl-reels', modelo: 'Reels', area: 'Conteúdo', checklist: ['Briefing/Gancho', 'Roteiro Estruturado', 'Gravação', 'Edição Dinâmica', 'Legenda/Tags/Postar'], tags: ['Vídeo Curto', 'Engajamento'] },
  { id: 'tpl-carrossel', modelo: 'Carrossel', area: 'Design', checklist: ['Copy dos Slides', 'Design Visual', 'Revisão Ortográfica', 'Exportar PNGs', 'Legenda/Agendar'], tags: ['Estático', 'Educação'] },
  { id: 'tpl-cobranca', modelo: 'Cobrança Mensal', area: 'Financeiro', checklist: ['Emitir Nota Fiscal', 'Gerar Boleto', 'Enviar para Cliente', 'Confirmar Recebimento'], tags: ['Financeiro', 'Recorrência'] },
  { id: 'tpl-reuniao', modelo: 'Reunião Mensal', area: 'Estratégia', checklist: ['Preparar Apresentação PNG', 'Enviar Link Zoom/Meet', 'Fazer Ata de Reunião', 'Criar Tarefas de Follow-up'], tags: ['Atendimento', 'Alinhamento'] }
];

export const DEFAULT_TASK_VIEWS: TaskViewConfig[] = [
  {
    id: 'view-list',
    name: 'Lista',
    type: 'List',
    filters: {},
    visibleColumns: TAREFAS_COLS,
    sortBy: 'order',
    sortOrder: 'asc',
    groupBy: 'Status'
  },
  {
    id: 'view-board',
    name: 'Board',
    type: 'Board',
    filters: {},
    visibleColumns: TAREFAS_COLS,
    sortBy: 'Prioridade',
    sortOrder: 'desc',
    groupBy: 'Status'
  },
  {
    id: 'view-calendar',
    name: 'Calendário',
    type: 'Calendar',
    filters: {},
    visibleColumns: TAREFAS_COLS,
    sortBy: 'Data_Entrega',
    sortOrder: 'asc',
    groupBy: 'Nenhum'
  }
];

export const DEFAULT_VH_CONFIG: VhConfig = {
  custosFixosGerais: 2000,
  lucroDesejado: 5000
};
export const EXPORT_LEGENDS: Record<string, { title: string, summary: string, blocks: Record<string, string> }> = {
  FINANCAS: {
    title: "Relatório Financeiro Estratégico",
    summary: "Este documento apresenta a saúde financeira do projeto, detalhando receitas, saídas e compromissos recorrentes.",
    blocks: {
      Metricas: "Principais indicadores de performance financeira no período selecionado.",
      Detalhado: "Listagem individual de todos os lançamentos para conferência técnica.",
      Observacoes: "Análise qualitativa sobre os dados financeiros apresentados."
    }
  },
  PLANEJAMENTO: {
    title: "Cronograma e Estratégia de Conteúdo",
    summary: "Visão geral do planejamento de postagens e ativos de conteúdo, organizados por data e status.",
    blocks: {
      Calendario: "Distribuição visual das postagens ao longo do cronograma.",
      Estrategia: "Resumo dos pilares de conteúdo e formatos priorizados.",
      Acoes: "Próximos passos e demandas operacionais pendentes."
    }
  },
  TAREFAS: {
    title: "Status de Execução e Operação",
    summary: "Acompanhamento tático das tarefas em andamento, concluídas e prioridades do time.",
    blocks: {
      Dashboard: "Resumo da produtividade e status global das demandas.",
      Pendencias: "Detalhamento de tarefas que requerem atenção imediata.",
      Concluido: "Histórico de entregas realizadas no ciclo atual."
    }
  },
  VH: {
    title: "Análise de Rentabilidade e Custos",
    summary: "Métricas de custo operacional e eficiência do time em relação ao faturamento.",
    blocks: {
      Geral: "Resultado líquido e margem de contribuição operacional.",
      Equipe: "Distribuição de custos e Valor Hora (VH) calculado por profissional.",
      Simulacao: "Projeções de impacto para novos cenários de alocação."
    }
  }
};
export const MODELAGEM_OPTIONS = ["Hero", "Hub", "Help", "Autoridade", "Conversão", "Relacional"];
export const PERMEABILIDADE_OPTIONS = ["Alta", "Média", "Baixa"];
export const CONVERSAO_OPTIONS = ["Engajamento", "Autoridade", "Captação", "Venda", "Relacionamento", "Educação"];
export const DESDOBRAMENTO_OPTIONS = ["Corte", "Carrossel derivado", "Stories", "Repost", "Sequência"];
export const HORARIO_RESUMO_OPTIONS = ["Manhã", "Tarde", "Noite"];

export const SYSTEMATIC_MODELING_ROWS = [
  { id: 'conteudo', label: 'Conteúdo', dynamic: true },
  { id: 'modelagem', label: 'Modelagem', options: MODELAGEM_OPTIONS },
  { id: 'permeabilidade', label: 'Permeab.', options: PERMEABILIDADE_OPTIONS },
  { id: 'formato', label: 'Formato', dynamic: true },
  { id: 'conversao', label: 'Conversão', options: CONVERSAO_OPTIONS },
  { id: 'desdobramento', label: 'Desdobr.', options: DESDOBRAMENTO_OPTIONS },
  { id: 'horario', label: 'Horário', options: HORARIO_RESUMO_OPTIONS }
];
