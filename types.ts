
export interface Client {
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
  __archived?: boolean;
}

export interface CoboItem {
  id: string;
  Cliente_ID: string;
  Canal: string; // Social Network
  Frequência: string;
  Público: string;
  Voz: string;
  Zona: string;
  Intenção: string;
  Formato: string; // Content Type
  __archived?: boolean;
}

export interface MatrizEstrategicaItem {
  id: string;
  Cliente_ID: string;
  Rede_Social: string;
  Função: string;
  "Quem fala": string;
  "Papel estratégico": string;
  "Tipo de conteúdo": string;
  "Resultado esperado": string;
  __archived?: boolean;
}

export interface RdcItem {
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
  __archived?: boolean;
}

export interface PlanejamentoItem {
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
  __archived?: boolean;
}

export interface FinancasLancamento {
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
  __archived?: boolean;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TaskAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data: string; // Base64 encoded data
  createdAt: string;
}

export interface Subtask {
  id: string;
  Task_ID: string;
  text: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  Task_ID: string;
  Autor: string;
  Texto: string;
  Data: string;
}

export interface TaskActivity {
  id: string;
  type: 'update' | 'upload' | 'comment' | 'status_change' | 'create';
  user: string;
  message: string;
  timestamp: string;
  metadata?: any;
}

export interface Task {
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
  Checklist: TaskChecklistItem[];
  Anexos?: TaskAttachment[];
  Comentarios: TaskComment[];
  Activities: TaskActivity[]; // Added for activity tracking
  Criado_Em: string;
  Atualizado_Em: string;
  __archived?: boolean;
}

export interface Collaborator {
  id: string;
  Nome: string;
  Cargo: string;
  CustosIndividuais: number;
  ProLabore: number;
  HorasProdutivas: number;
  valorHora?: number;
  horasMensais?: number;
}

export interface VhConfig {
  custosFixosGerais: number;
  lucroDesejado: number;
}

export interface ClientVhMetric {
  clientId: string;
  nome: string;
  horasConsumidas: number;
  valorCobrado: number;
  custoOperacional: number;
  resultado: number;
  margem: number;
}

export interface TaskStatus {
  id: string;
  label: string;
  order: number;
  color: string;
}

export interface TaskViewConfig {
  id: string;
  name: string;
  type: 'List' | 'Board' | 'Calendar';
  filters: {
    status?: string[];
    priority?: string[];
    area?: string[];
    client?: string[];
  };
  visibleColumns: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  groupBy: 'Status' | 'Cliente_ID' | 'Área' | 'Nenhum';
}

export interface TaskTemplate {
  id: string;
  modelo: string;
  area: string;
  checklist: string[];
  tags?: string[];
}

export type ContentLibrary = Record<string, string[]>;

export type TaskViewMode = 'sidebar' | 'modal' | 'fullscreen';

export type TableType = 'DASHBOARD' | 'CLIENTES' | 'RDC' | 'MATRIZ' | 'COBO' | 'PLANEJAMENTO' | 'FINANCAS' | 'TAREFAS' | 'VH' | 'ORGANICKIA' | 'WHITEBOARD' | 'IA_HISTORY' | 'WORKSPACE';

export interface PresentationConfig {
  agencyName: string;
  title: string;
  subtitle: string;
  theme: 'dark' | 'light';
  aspectRatio: '16:9' | '9:16';
  detailLevel: 'Resumido' | 'Completo';
  useClientColor?: boolean;
}

export interface PresentationTemplate {
  tab: TableType;
  label: string;
  subtitle: string;
  nextStep: string;
  callouts: { id: number; title: string; desc: string; top: string; left: string }[];
}

export interface GeminiSuggestion {
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

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: any;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  status: 'online' | 'ocupado' | 'ausente' | 'offline';
  description?: string;
  priorities?: string[];
}
export type SystematicModelingData = Record<string, Record<string, string>>; // clientId -> { "day-rowId": "value" }

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  color?: string;
  workspace_members?: WorkspaceMember[];
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: 'admin' | 'editor' | 'viewer';
  joined_at: string;
  profiles: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface Invite {
  id: string;
  workspace_id: string;
  email?: string;
  token: string;
  role: string;
  expires_at: string;
}
