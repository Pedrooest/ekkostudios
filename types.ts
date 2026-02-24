
export interface Cliente {
  id: string;
  Nome: string;
  Nicho: string;
  Responsável: string;
  WhatsApp: string;
  Instagram: string;
  Objetivo: string;
  Observações: string;
  "Cor (HEX)": string;
  Status: 'Ativo' | 'Pausado' | 'Prospect';
  Fee: number;
  __arquivado?: boolean;
}

export interface ItemCobo {
  id: string;
  Cliente_ID: string;
  Canal: string; // Rede Social
  Frequência: string;
  Público: string;
  Voz: string;
  Zona: string;
  Intenção: string;
  Formato: string; // Tipo de Conteúdo
  __arquivado?: boolean;
}

export interface ItemMatrizEstrategica {
  id: string;
  Cliente_ID: string;
  Rede_Social: string;
  Função: string;
  "Quem fala": string;
  "Papel estratégico": string;
  "Tipo de conteúdo": string;
  "Resultado esperado": string;
  __arquivado?: boolean;
}

export interface ItemRdc {
  id: string;
  Cliente_ID: string;
  "Ideia de Conteúdo": string;
  Rede_Social: string;
  "Tipo de conteúdo": string;
  "Resolução (1–5)": number;
  "Demanda (1–5)": number;
  "Competição (1–5)": number;
  "Score (R×D×C)": number;
  Decisão: string;
  __arquivado?: boolean;
}

export interface ItemPlanejamento {
  id: string;
  Cliente_ID: string;
  Data: string;
  Hora: string;
  DataHora: string;
  "Dia da semana": string;
  "Semana (ISO)": number;
  Conteúdo: string;
  Função: string;
  Rede_Social: string;
  "Tipo de conteúdo": string;
  Intenção: string;
  Canal: string;
  Formato: string;
  Zona: string;
  "Quem fala": string;
  "Status do conteúdo": 'Pendente' | 'Em produção' | 'Em aprovação' | 'Concluído' | 'Arquivado';
  Observações?: string;
  Gancho?: string;
  CTA?: string;
  Fonte_Origem?: 'RDC' | 'Estratégia' | 'COBO' | 'Tarefa' | 'IA' | 'Manual' | 'Gemini';
  Origem_ID?: string;
  __arquivado?: boolean;
}

export interface LancamentoFinancas {
  id: string;
  Lancamento_ID: string;
  Data: string;
  Cliente_ID: string;
  Tipo: 'Entrada' | 'Saída' | 'Despesa' | 'Assinatura';
  Categoria: string;
  Descrição: string;
  Valor: number;
  Recorrência?: 'Mensal' | 'Única';
  Data_Início?: string;
  Data_Fim?: string;
  Dia_Pagamento?: number;
  Observações?: string;
  __arquivado?: boolean;
}

export interface ItemChecklistTarefa {
  id: string;
  texto: string;
  concluido: boolean;
}

export interface AnexoTarefa {
  id: string;
  nomeArquivo: string;
  tipoMime: string;
  tamanho: number;
  dados: string; // Dados codificados em Base64
  criadoEm: string;
}

export interface Subtarefa {
  id: string;
  Tarefa_ID: string;
  texto: string;
  concluido: boolean;
}

export interface ComentarioTarefa {
  id: string;
  Tarefa_ID: string;
  Autor: string;
  Texto: string;
  Data: string;
}

export interface AtividadeTarefa {
  id: string;
  tipo: 'update' | 'upload' | 'comment' | 'status_change' | 'create';
  usuario: string;
  mensagem: string;
  timestamp: string;
  metadados?: any;
}

export interface Tarefa {
  id: string;
  Task_ID: string;
  Cliente_ID: string;
  Título: string;
  Descrição?: string;
  Área: string;
  Status: string;
  Prioridade: 'Urgente' | 'Alta' | 'Média' | 'Baixa';
  Responsável: string;
  Data_Entrega?: string;
  Hora_Entrega?: string;
  Tags?: string[];
  Estimativa_H?: number;
  Tempo_Gasto_H?: number;
  Relacionado_A?: 'RDC' | 'Planejamento' | 'COBO' | 'Matriz' | 'Nenhum';
  Relacionado_ID?: string;
  Relacionado_Conteudo?: string;
  Checklist: ItemChecklistTarefa[];
  Anexos?: AnexoTarefa[];
  Comentarios: ComentarioTarefa[];
  Atividades: AtividadeTarefa[];
  Criado_Em: string;
  Atualizado_Em: string;
  __arquivado?: boolean;
}

export interface Colaborador {
  id: string;
  Nome: string;
  Cargo: string;
  Remuneracao: number;
  CustosIndividuais: number;
  ProLabore: number;
  HorasProdutivas: number;
  valorHora?: number;
  calculatedVh?: number;
  horasMensais?: number;
}

export interface VhConfig {
  custosFixosGerais: number;
  lucroDesejado: number;
}

export interface MetricaClienteVh {
  clienteId: string;
  nome: string;
  horasConsumidas: number;
  valorCobrado: number;
  custoOperacional: number;
  resultado: number;
  margem: number;
}

export interface StatusTarefa {
  id: string;
  rotulo: string;
  ordem: number;
  cor: string;
}

export interface ConfiguracaoVisaoTarefa {
  id: string;
  nome: string;
  tipo: 'List' | 'Board' | 'Calendar';
  filtros: {
    status?: string[];
    prioridade?: string[];
    area?: string[];
    cliente?: string[];
  };
  colunasVisiveis: string[];
  ordenarPor: string;
  ordemOrdenacao: 'asc' | 'desc';
  agruparPor: 'Status' | 'Cliente_ID' | 'Área' | 'Nenhum';
}

export interface ModeloTarefa {
  id: string;
  modelo: string;
  area: string;
  checklist: string[];
  tags?: string[];
}

export type BibliotecaConteudo = Record<string, string[]>;

export type ModoVisaoTarefa = 'sidebar' | 'modal' | 'fullscreen';

export type TipoTabela = 'DASHBOARD' | 'CLIENTES' | 'RDC' | 'MATRIZ' | 'COBO' | 'PLANEJAMENTO' | 'FINANCAS' | 'TAREFAS' | 'VH' | 'ORGANICKIA' | 'WHITEBOARD' | 'IA_HISTORY' | 'WORKSPACE';

export interface ConfiguracaoApresentacao {
  nomeAgencia: string;
  titulo: string;
  subtitulo: string;
  tema: 'dark' | 'light';
  proporcao: '16:9' | '9:16';
  nivelDetalhe: 'Resumido' | 'Completo';
  usarCorCliente?: boolean;
}

export interface ModeloApresentacao {
  aba: TipoTabela;
  rotulo: string;
  subtitulo: string;
  proximoPasso: string;
  chamadas: { id: number; titulo: string; desc: string; top: string; left: string }[];
}

export interface SugestaoGemini {
  ideia: string;
  funcao: string;
  tipo: string;
  gancho: string;
  cta: string;
  canal: string;
  intencao: string;
  r?: number;
  d?: number;
  c?: number;
}

export interface MensagemChat {
  role: 'user' | 'model';
  texto: string;
  timestamp: string;
}

export interface NotificacaoApp {
  id: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  titulo: string;
  mensagem: string;
  timestamp: string;
  lida: boolean;
  actionUrl?: string;
  metadados?: any;
}

export interface PerfilUsuario {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  status: 'online' | 'ocupado' | 'ausente' | 'offline';
  descricao?: string;
  prioridades?: string[];
}

export type DadosModelagemSistematica = Record<string, Record<string, string>>; // clientId -> { "day-rowId": "value" }

export interface Workspace {
  id: string;
  nome: string;
  id_proprietario: string;
  criado_em: string;
  cor?: string;
  membros_workspace?: MembroWorkspace[];
}

export interface MembroWorkspace {
  id_workspace: string;
  id_usuario: string;
  papel: 'admin' | 'editor' | 'viewer';
  entrou_em: string;
  perfis: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface Convite {
  id: string;
  id_workspace: string;
  email?: string;
  token: string;
  papel: string;
  expira_em: string;
}
