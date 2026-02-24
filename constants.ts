
import { TipoTabela, ModeloTarefa, StatusTarefa, ConfiguracaoVisaoTarefa, VhConfig, BibliotecaConteudo } from './types';

export const REDES_SOCIAIS = ["Instagram", "YouTube", "TikTok", "LinkedIn", "Facebook", "Threads", "Twitter/X"];

export const BIBLIOTECA_CONTEUDO_PADRAO: BibliotecaConteudo = {
  "Instagram": ["Reels", "Carrossel", "Post Feed", "Stories", "Live", "Colab"],
  "YouTube": ["Shorts", "Vídeo longo", "Live", "Comunidade"],
  "TikTok": ["Vídeo curto", "Trend", "Educativo", "Narrativa"],
  "LinkedIn": ["Post", "Carrossel", "Artigo", "Vídeo"],
  "Facebook": ["Post", "Vídeo", "Stories", "Live"]
};

export const REDES_SOCIAIS_RDC = ["Instagram", "YouTube", "TikTok", "Facebook", "LinkedIn", "Pinterest", "X (Twitter)", "Kwai"];
export const FORMATOS_RDC: Record<string, string[]> = {
  "Instagram": ["Reels", "Stories", "Carrossel", "Post Feed", "Live", "Guia", "Collab"],
  "YouTube": ["Shorts", "Vídeo longo", "Live", "Comunidade", "Premiere"],
  "TikTok": ["Vídeo", "Live", "Carrossel", "Série"],
  "Facebook": ["Reels", "Post", "Stories", "Live", "Grupo"],
  "LinkedIn": ["Post texto", "Carrossel (PDF)", "Artigo", "Vídeo", "Newsletter"],
  "Pinterest": ["Pin estático", "Pin vídeo", "Idea Pin"],
  "X (Twitter)": ["Post curto", "Thread", "Espaços"],
  "Kwai": ["Vídeo", "Live"]
};

export const COLUNAS_CLIENTES = ["Nome", "Nicho", "Responsável", "WhatsApp", "Instagram", "Objetivo", "Cor (HEX)", "Status"];
export const COLUNAS_COBO = ["Cliente", "Canal", "Frequência", "Público", "Voz", "Zona", "Intenção", "Formato"];
export const COLUNAS_MATRIZ_ESTRATEGICA = ["Cliente", "Rede_Social", "Função", "Quem fala", "Papel estratégico", "Tipo de conteúdo", "Resultado esperado"];

// CONSTANTES MATRIZ ESTRATEGICA (Dropdowns)
export const OPCOES_FUNCAO_MATRIZ = [
  "Autoridade", "Posicionamento", "Conversão", "Relacionamento",
  "Educação", "Prova Social", "Diferenciação", "Aquecimento de Lead", "Retenção"
];

export const OPCOES_QUEM_FALA_MATRIZ = [
  "Fundador", "Sócio", "Especialista", "Equipe",
  "Marca (Institucional)", "Cliente", "Parceiro", "Narrador / IA"
];

export const OPCOES_PAPEL_ESTRATEGICO_MATRIZ = [
  "Gerar demanda", "Aumentar percepção de valor", "Diminuir objeção",
  "Educar mercado", "Atrair lead qualificado", "Reforçar autoridade",
  "Engajar base", "Preparar para oferta", "Escalar awareness"
];

export const OPCOES_TIPO_CONTEUDO_MATRIZ = [
  "Conteúdo raiz", "Corte", "Reaproveitamento", "Bastidores", "Tutorial",
  "Storytelling", "Prova social", "Diagnóstico", "Lista / Carrossel", "Opinião"
];

export const OPCOES_RESULTADO_ESPERADO_MATRIZ = [
  "Comentário", "Direct", "Clique no link", "Salvamento",
  "Compartilhamento", "Agendamento", "Compra", "Seguir perfil", "Responder Story"
];

// CONSTANTES COBO (Dropdowns)
export const OPCOES_CANAL_COBO = [
  "Instagram Reels", "Instagram Feed", "Instagram Stories", "YouTube Shorts", "YouTube Vídeo longo",
  "TikTok", "LinkedIn", "Facebook", "Pinterest", "Kwai", "WhatsApp", "Email", "Telegram"
];

export const OPCOES_FREQUENCIA_COBO = [
  "Diário", "5x por semana", "3x por semana", "2x por semana", "Semanal", "Quinzenal", "Mensal", "Sob demanda"
];

export const OPCOES_PUBLICO_COBO = [
  "Frio", "Morno", "Quente", "Leads", "Clientes", "Comunidade"
];

export const OPCOES_VOZ_COBO = [
  "Educativa", "Autoridade", "Conversacional", "Provocativa", "Inspiradora", "Técnica", "Humana/Próxima", "Comercial"
];

export const OPCOES_ZONA_COBO = [
  "Primária", "Secundária", "Paralela", "Aquisição", "Nutrição", "Conversão", "Retenção"
];

export const OPCOES_INTENCAO_COBO = [
  "Atenção", "Engajamento", "Educação", "Autoridade", "Desejo", "Conversão", "Relacionamento", "Retenção"
];

export const OPCOES_FORMATO_COBO = [
  "Vídeo curto", "Carrossel", "Post imagem", "Stories", "Live", "Bastidores", "Tutorial", "Prova social", "Oferta", "Texto educativo"
];
export const COLUNAS_RDC = ["Cliente", "Ideia de Conteúdo", "Rede_Social", "Tipo de conteúdo", "Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)", "Score (R×D×C)", "Decisão"];

export const COLUNAS_PLANEJAMENTO = [
  "Cliente", "Data", "Hora", "Conteúdo", "Rede_Social", "Tipo de conteúdo", "Função", "Intenção", "Gancho", "CTA", "Status do conteúdo"
];

export const COLUNAS_FINANCAS = [
  "Lançamento", "Data", "Tipo", "Categoria", "Descrição", "Valor", "Status",
  "Recorrência", "Data_Início", "Data_Fim", "Dia_Pagamento", "Observações"
];

export const COLUNAS_TAREFAS = ["Task_ID", "Cliente", "Título", "Status", "Prioridade", "Responsável", "Data_Entrega", "Área", "Relacionado_Conteudo"];

export const OPCOES_FUNCAO = ["Hero", "Hub", "Help", "Autoridade", "Relacional"];
export const OPCOES_ZONA = ["Quente", "Morna", "Fria"];
export const OPCOES_STATUS = ["Ativo", "Pausado", "Prospect"];

export const OPCOES_TIPO_FINANCAS = ["Entrada", "Saída", "Despesa", "Assinatura"];
export const OPCOES_SERVICOS_FINANCAS = [
  "Gestão de Tráfego", "Social Media", "Design Gráfico", "Consultoria Estratégica",
  "Produção de Vídeo", "Criação de Conteúdo", "Assessoria", "Outros"
];

export const OPCOES_STATUS_PLANEJAMENTO = ['Em espera', 'Aguardando aprovação', 'Produção', 'Publicado', 'Concluído'];

export const OPCOES_AREA = [
  "Conteúdo", "Design", "Captação/Comercial", "Tráfego", "Financeiro",
  "Reunião/Cliente", "Operação interna", "Estratégia", "Aprovação", "Suporte"
];
export const OPCOES_PRIORIDADE = ["Urgente", "Alta", "Média", "Baixa"];

export const ROTULOS_TABELAS: Record<TipoTabela, string> = {
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
  WHITEBOARD: 'Quadro Branco',
  IA_HISTORY: 'Histórico IA',
  WORKSPACE: 'Workspace'
};

export const DIAS_SEMANA_BR = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export const STATUS_TAREFA_PADRAO: StatusTarefa[] = [
  { id: 'backlog', rotulo: 'Backlog', ordem: 1, cor: '#6B7280' },
  { id: 'todo', rotulo: 'A Fazer', ordem: 2, cor: '#3B82F6' },
  { id: 'doing', rotulo: 'Em Andamento', ordem: 3, cor: '#F59E0B' },
  { id: 'review', rotulo: 'Em Aprovação', ordem: 4, cor: '#A855F7' },
  { id: 'blocked', rotulo: 'Bloqueado', ordem: 5, cor: '#EF4444' },
  { id: 'done', rotulo: 'Concluído', ordem: 6, cor: '#22C55E' }
];

export const MODELOS_TAREFA: ModeloTarefa[] = [
  { id: 'tpl-reels', modelo: 'Reels', area: 'Conteúdo', checklist: ['Briefing/Gancho', 'Roteiro Estruturado', 'Gravação', 'Edição Dinâmica', 'Legenda/Tags/Postar'], tags: ['Vídeo Curto', 'Engajamento'] },
  { id: 'tpl-carrossel', modelo: 'Carrossel', area: 'Design', checklist: ['Copy dos Slides', 'Design Visual', 'Revisão Ortográfica', 'Exportar PNGs', 'Legenda/Agendar'], tags: ['Estático', 'Educação'] },
  { id: 'tpl-cobranca', modelo: 'Cobrança Mensal', area: 'Financeiro', checklist: ['Emitir Nota Fiscal', 'Gerar Boleto', 'Enviar para Cliente', 'Confirmar Recebimento'], tags: ['Financeiro', 'Recorrência'] },
  { id: 'tpl-reuniao', modelo: 'Reunião Mensal', area: 'Estratégia', checklist: ['Preparar Apresentação PNG', 'Enviar Link Zoom/Meet', 'Fazer Ata de Reunião', 'Criar Tarefas de Follow-up'], tags: ['Atendimento', 'Alinhamento'] }
];

export const VISOES_TAREFA_PADRAO: ConfiguracaoVisaoTarefa[] = [
  {
    id: 'view-list',
    nome: 'Lista',
    tipo: 'List',
    filtros: {},
    colunasVisiveis: COLUNAS_TAREFAS,
    ordenarPor: 'order',
    ordemOrdenacao: 'asc',
    agruparPor: 'Status'
  },
  {
    id: 'view-board',
    nome: 'Board',
    tipo: 'Board',
    filtros: {},
    colunasVisiveis: COLUNAS_TAREFAS,
    ordenarPor: 'Prioridade',
    ordemOrdenacao: 'desc',
    agruparPor: 'Status'
  },
  {
    id: 'view-calendar',
    nome: 'Calendário',
    tipo: 'Calendar',
    filtros: {},
    colunasVisiveis: COLUNAS_TAREFAS,
    ordenarPor: 'Data_Entrega',
    ordemOrdenacao: 'asc',
    agruparPor: 'Nenhum'
  }
];

export const CONFIG_VH_PADRAO: VhConfig = {
  custosFixosGerais: 2000,
  lucroDesejado: 5000
};

export const LEGENDAS_EXPORTACAO: Record<string, { title: string, summary: string, blocks: Record<string, string> }> = {
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
export const OPCOES_MODELAGEM = ["Hero", "Hub", "Help", "Autoridade", "Conversão", "Relacional"];
export const OPCOES_PERMEABILIDADE = ["Alta", "Média", "Baixa"];
export const OPCOES_CONVERSAO = ["Engajamento", "Autoridade", "Captação", "Venda", "Relacionamento", "Educação"];
export const OPCOES_DESDOBRAMENTO = ["Corte", "Carrossel derivado", "Stories", "Repost", "Sequência"];
export const OPCOES_HORARIO_RESUMO = ["Manhã", "Tarde", "Noite"];

export const LINHAS_MODELAGEM_SISTEMATICA = [
  { id: 'conteudo', label: 'Conteúdo', dynamic: true },
  { id: 'modelagem', label: 'Modelagem', options: OPCOES_MODELAGEM },
  { id: 'permeabilidade', label: 'Permeab.', options: OPCOES_PERMEABILIDADE },
  { id: 'formato', label: 'Formato', dynamic: true },
  { id: 'conversao', label: 'Conversão', options: OPCOES_CONVERSAO },
  { id: 'desdobramento', label: 'Desdobr.', options: OPCOES_DESDOBRAMENTO },
  { id: 'horario', label: 'Horário', options: OPCOES_HORARIO_RESUMO }
];
