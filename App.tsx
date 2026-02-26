import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { supabase } from './supabase';
import { AuthView } from './AuthView';
import { ProfilePopover } from './ProfilePopover';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  ChevronLeft, ChevronRight, Calendar as LucideCalendar,
  Clock, Share2, Video, Image as ImageIcon, FileText, CheckCircle2,
  BrainCircuit, Mic, Trash2, History as HistoryIcon, Sparkles, Loader2, ChevronDown,
  Zap, Copy, FileImage, MessageSquare, ExternalLink, ShieldAlert,
  Plus, X, User, Target, Lightbulb, Radio, FolderOpen,
  Box, Eye, EyeOff, Search, LayoutGrid, List, Filter, ArrowUpDown, Archive, Briefcase, TrendingUp, TrendingDown, Receipt, CreditCard, Wallet, Activity, DollarSign, ArrowRight, LayoutDashboard, AlertTriangle, Calculator, Info, Users, CheckSquare, MoreVertical, Database,
  Menu, Sun, Moon, Download, Bell, BellOff, Layers, FileSpreadsheet, FileVideo, Palette, Info as InfoIcon, X as XIcon, Check as CheckIcon,
  Bot, Castle, Antenna, CalendarDays, Coins, ListTodo, Presentation, Hourglass, ArrowLeft, ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { AssistantDrawer } from './AssistantDrawer';
import { AssistantAction } from './ai/types';

// Extracted Views
import { DashboardView } from './views/DashboardView';
import { SystematicModelingView } from './views/SystematicModelingView';
import { OrganickIAView } from './views/OrganickIAView';
import { TaskFlowView, TaskDetailPanel } from './views/TaskFlowView';
import { FinancasView } from './views/FinancasView';
import { VhManagementView } from './views/VhManagementView';
import { PlanningView } from './views/PlanningView';
import { TableView } from './components/TableView';
import { generateId } from './utils/id';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, PieChart, Pie
} from 'recharts';
import {
  Cliente, ItemCobo, ItemMatrizEstrategica, ItemRdc, ItemPlanejamento,
  LancamentoFinancas, Tarefa, TipoTabela, ModoVisaoTarefa,
  VhConfig, BibliotecaConteudo, Colaborador, ItemChecklistTarefa, ConfiguracaoApresentacao, AnexoTarefa, AtividadeTarefa, NotificacaoApp, PerfilUsuario, DadosModelagemSistematica,
  Workspace, MembroWorkspace
} from './types';
import { DatabaseService } from './DatabaseService';
import { WorkspaceSelector } from './WorkspaceSelector';
import { WorkspaceManagerFullscreen } from './components/WorkspaceManagerFullscreen';
import { NewWorkspaceModal } from './components/NewWorkspaceModal';
import { initAudio, playUISound } from './utils/uiSounds';


import {
  COLUNAS_CLIENTES as CLIENTES_COLS, COLUNAS_RDC as RDC_COLS,
  OPCOES_CANAL_COBO as COBO_CANAL_OPTIONS, OPCOES_FREQUENCIA_COBO as COBO_FREQUENCIA_OPTIONS, OPCOES_PUBLICO_COBO as COBO_PUBLICO_OPTIONS, OPCOES_VOZ_COBO as COBO_VOZ_OPTIONS, OPCOES_ZONA_COBO as COBO_ZONA_OPTIONS, OPCOES_INTENCAO_COBO as COBO_INTENCAO_OPTIONS, OPCOES_FORMATO_COBO as COBO_FORMATO_OPTIONS,
  STATUS_TAREFA_PADRAO as DEFAULT_TASK_STATUSES,
  DIAS_SEMANA_BR as WEEKDAYS_BR, ROTULOS_TABELAS as TABLE_LABELS,
  COLUNAS_MATRIZ_ESTRATEGICA as MATRIZ_ESTRATEGICA_COLS, COLUNAS_COBO as COBO_COLS, OPCOES_PRIORIDADE as PRIORIDADE_OPTIONS,
  VISOES_TAREFA_PADRAO as DEFAULT_TASK_VIEWS, CONFIG_VH_PADRAO as DEFAULT_VH_CONFIG, BIBLIOTECA_CONTEUDO_PADRAO as DEFAULT_CONTENT_LIBRARY,
  COLUNAS_FINANCAS as FINANCAS_COLS, OPCOES_TIPO_FINANCAS as FINANCAS_TIPO_OPTIONS, OPCOES_SERVICOS_FINANCAS as FINANCAS_SERVICOS_OPTIONS, OPCOES_STATUS_PLANEJAMENTO as PLANNING_STATUS_OPTIONS, LEGENDAS_EXPORTACAO as EXPORT_LEGENDS,
  LINHAS_MODELAGEM_SISTEMATICA as SYSTEMATIC_MODELING_ROWS, OPCOES_MODELAGEM as MODELAGEM_OPTIONS, OPCOES_PERMEABILIDADE as PERMEABILIDADE_OPTIONS, OPCOES_CONVERSAO as CONVERSAO_OPTIONS, OPCOES_DESDOBRAMENTO as DESDOBRAMENTO_OPTIONS, OPCOES_HORARIO_RESUMO as HORARIO_RESUMO_OPTIONS,
  COLUNAS_PLANEJAMENTO as PLANEJAMENTO_COLS, COLUNAS_TAREFAS as TAREFAS_COLS,
  OPCOES_FUNCAO_MATRIZ as MATRIZ_FUNCAO_OPTIONS, OPCOES_QUEM_FALA_MATRIZ as MATRIZ_QUEM_FALA_OPTIONS, OPCOES_PAPEL_ESTRATEGICO_MATRIZ as MATRIZ_PAPEL_ESTRATEGICO_OPTIONS, OPCOES_TIPO_CONTEUDO_MATRIZ as MATRIZ_TIPO_CONTEUDO_OPTIONS, OPCOES_RESULTADO_ESPERADO_MATRIZ as MATRIZ_RESULTADO_ESPERADO_OPTIONS
} from './constants';
import { Button, Card, Badge, Stepper, FloatingPopover, InputSelect, MobileFloatingAction, SimpleMarkdown, StatCard, DeletionBar, LibraryEditorModal, ReorderTabsModal, ColorPickerModal } from './Components';
import { BottomSheet } from './components/BottomSheet';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Whiteboard } from './components/Whiteboard';

import { transcribeAndExtractInsights, generatePresentationBriefing, extractStructuredDataFromPDF, analyzeContextualData } from './geminiService';
import { CopilotChat } from './CopilotChat';
import { PresentationSlide } from './PresentationRenderer';
import { ContentBankSidebar } from './ContentBankSidebar';
import { GeminiSidebar } from './GeminiSidebar';
import { NotificationToast } from './NotificationToast';
import { MasterExportSlide } from './MasterExportSlide';
import { ExportModal } from './export/components/ExportModal';
import { SlideRenderer } from './export/components/SlideRenderer';
import { useExport } from './export/hooks/useExport';
import { ExportConfig } from './export/types';




const mergeItems = <T extends { id: string, updated_at?: string, Atualizado_Em?: string }>(local: T[], remote: T[]): T[] => {
  const merged = [...local];

  remote.forEach(remoteItem => {
    const localIndex = merged.findIndex(i => i.id === remoteItem.id);
    if (localIndex === -1) {
      // New item from remote
      merged.push(remoteItem);
    } else {
      // Reconcile by updated_at or Atualizado_Em
      const localItem = merged[localIndex];
      const remoteDate = (remoteItem.Atualizado_Em || remoteItem.updated_at) ? new Date(remoteItem.Atualizado_Em || remoteItem.updated_at!).getTime() : 0;
      const localDate = (localItem.Atualizado_Em || localItem.updated_at) ? new Date(localItem.Atualizado_Em || localItem.updated_at!).getTime() : 0;

      if (remoteDate > localDate) {
        merged[localIndex] = remoteItem;
      }
    }
  });

  console.log(`[EKKO-SYNC] MERGE_END | RESULT: ${merged.length}`);
  return merged;
};

const parseNumericValue = (val: string | number): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/\s/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

// Formatação Monetária Segura (Prevents blank screens on NaN/Infinity)
const formatBRL = (value: number | string) => {
  const num = Number(value);
  if (isNaN(num) || !isFinite(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

const getWeekInfo = (dateStr: string) => {
  const date = new Date(dateStr + 'T12:00:00');
  if (isNaN(date.getTime())) return { day: "", week: 0 };
  const day = WEEKDAYS_BR[date.getDay()];
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { day, week };
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGO COMPONENT (REF IDENTITY)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOGO COMPONENT (REF IDENTITY)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const Logo: React.FC<{ collapsed?: boolean; className?: string; theme?: 'dark' | 'light' }> = ({ collapsed, className = "", theme = 'dark' }) => {
  const getLogoSrc = () => {
    if (theme === 'light') {
      return collapsed ? "/noturno-logo.png" : "/noturno-logo-ekko.png";
    }
    return collapsed ? "/logo-icon.png" : "/EKKO  LOGO.png";
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <img
        src={getLogoSrc()}
        alt="EKKO Logo"
        className={`${collapsed ? "w-10 h-10" : "w-40 h-auto"} object-contain transition-all duration-300`}
      />
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RDC CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const RDC_NETWORKS = ["Instagram", "YouTube", "TikTok", "Facebook", "LinkedIn", "Pinterest", "X (Twitter)", "Kwai"];
const RDC_FORMATS: Record<string, string[]> = {
  "Instagram": ["Reels", "Stories", "Carrossel", "Post Feed", "Live", "Guia", "Collab"],
  "YouTube": ["Shorts", "Vídeo longo", "Live", "Comunidade", "Premiere"],
  "TikTok": ["Vídeo", "Live", "Carrossel", "Série"],
  "Facebook": ["Reels", "Post", "Stories", "Live", "Grupo"],
  "LinkedIn": ["Post texto", "Carrossel (PDF)", "Artigo", "Vídeo", "Newsletter"],
  "Pinterest": ["Pin estático", "Pin vídeo", "Idea Pin"],
  "X (Twitter)": ["Post curto", "Thread", "Espaços"],
  "Kwai": ["Vídeo", "Live"]
};


const getTableName = (tab: string): string | null => {
  switch (tab) {
    case 'CLIENTES': return 'clients';
    case 'RDC': return 'rdc';
    case 'MATRIZ': return 'matriz_estrategica';
    case 'COBO': return 'cobo';
    case 'PLANEJAMENTO': return 'planejamento';
    case 'FINANCAS': return 'financas';
    case 'TAREFAS': return 'tasks';
    case 'VH': return 'collaborators';
    default: return null;
  }
};



import { PortalPopover } from './components/PortalPopover';

export default function App() {
  const [activeTab, setActiveTab] = useState<TipoTabela>('DASHBOARD');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [tabOrder, setTabOrder] = useState<TipoTabela[]>(['DASHBOARD', 'CLIENTES', 'ORGANICKIA', 'RDC', 'MATRIZ', 'COBO', 'PLANEJAMENTO', 'FINANCAS', 'TAREFAS', 'VH', 'WHITEBOARD']);

  const [clients, setClients] = useState<Cliente[]>([]);
  const [cobo, setCobo] = useState<ItemCobo[]>([]);
  const [matriz, setMatriz] = useState<ItemMatrizEstrategica[]>([]);
  const [planejamento, setPlanejamento] = useState<ItemPlanejamento[]>([]);
  const [rdc, setRdc] = useState<ItemRdc[]>([]);
  const [financas, setFinancas] = useState<LancamentoFinancas[]>([]);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [systematicModeling, setSystematicModeling] = useState<DadosModelagemSistematica>({});

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const [BibliotecaConteudo, setContentLibrary] = useState<BibliotecaConteudo>(DEFAULT_CONTENT_LIBRARY);
  const [isLibraryEditorOpen, setIsLibraryEditorOpen] = useState(false);
  const [vhConfig, setVhConfig] = useState<VhConfig>(DEFAULT_VH_CONFIG);
  const [collaborators, setCollaborators] = useState<Colaborador[]>([]);
  const [activeTaskViewId, setActiveTaskViewId] = useState<string>(DEFAULT_TASK_VIEWS[0].id);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const clientFilterButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailViewMode, setTaskDetailViewMode] = useState<ModoVisaoTarefa>('sidebar');
  const [isClientFilterOpen, setIsClientFilterOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  const [isGeminiSidebarOpen, setIsGeminiSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const [selectedClientIdIA, setSelectedClientIdIA] = useState<string>('');
  const [iaAudioInsight, setIaAudioInsight] = useState<string>('');
  const [iaPdfInsight, setIaPdfInsight] = useState<string>('');
  const [iaHistory, setIaHistory] = useState<any[]>([]);

  const [notificacoes, setNotificacoes] = useState<NotificacaoApp[]>([]);
  const [toasts, setToasts] = useState<NotificacaoApp[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const mobileExportButtonRef = useRef<HTMLButtonElement>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSettingsFullscreenOpen, setIsSettingsFullscreenOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'configuracoes' | 'pessoas'>('configuracoes');
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [perfilUsuario, setPerfilUsuario] = useState<PerfilUsuario | null>(null);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  const refreshWorkspaces = useCallback(async () => {
    if (!currentUser) return;
    setWorkspaceLoading(true);
    try {
      const list = await DatabaseService.getMyWorkspaces();
      setWorkspaces(list);

      // If no workspaces, create default. If workspaces exist but none selected, select first.
      if (list.length === 0) {
        // Double check if we are already creating one (simple race guard)
        const created = await DatabaseService.createWorkspace('Meu Workspace');
        setWorkspaces([created]);
        setCurrentWorkspace(created);
      } else {
        setCurrentWorkspace(prev => {
          // If we already have a selected workspace and it's still in the list, keep it.
          // Otherwise, select the first one.
          const stillExists = list.find(w => w.id === prev?.id);
          return stillExists || list[0];
        });
      }
    } catch (error) {
      console.error('Failed to refresh workspaces:', error);
      // If we are stuck in loading, maybe try one last time or show error
      setWorkspaces([]);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [currentUser]);

  const handleWorkspaceSelect = useCallback((workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    // Optionally, close the settings modal if it's open
    setIsSettingsFullscreenOpen(false);
  }, []);

  const loadWorkspaceData = useCallback(async (wsId: string) => {
    const data = await DatabaseService.fetchAllWorkspaceData(wsId);
    if (data) {
      setClients(prev => mergeItems(prev, data.clients as Cliente[]));
      setCobo(prev => mergeItems(prev, data.cobo as ItemCobo[]));
      setMatriz(prev => mergeItems(prev, data.matriz as ItemMatrizEstrategica[]));
      setRdc(prev => mergeItems(prev, data.rdc as ItemRdc[]));
      setPlanejamento(prev => mergeItems(prev, data.planning as ItemPlanejamento[]));
      setFinancas(prev => mergeItems(prev, data.financas as LancamentoFinancas[]));
      setTasks(prev => mergeItems(prev, data.tasks as Tarefa[]));
      setCollaborators(prev => mergeItems(prev, data.collaborators as Colaborador[]));
    }
  }, []);

  const { isExporting, exportExcel, exportPng, exportPdf } = useExport();

  // Helper to get current export config
  const getExportConfig = (): ExportConfig => {
    let columns: any[] = [];
    let data: any[] = [];
    let title = TABLE_LABELS[activeTab];
    let metrics: any[] = [];
    let priorityColumns: string[] | undefined;
    const selectedClientId = selectedClientIds[0];
    const currentClient = clients.find(c => c.id === selectedClientId);

    const filterByClient = (item: any) => {
      if (selectedClientIds.length === 0) return true;
      const clientId = item.Cliente_ID || item.Cliente;
      return selectedClientIds.includes(clientId);
    };

    // Map data based on active tab
    switch (activeTab) {
      case 'CLIENTES':
        columns = CLIENTES_COLS.map(c => ({ key: c, label: c }));
        data = clients; // Clients are the filter
        if (selectedClientIds.length > 0) {
          data = data.filter(c => selectedClientIds.includes(c.id));
        }
        metrics = [{ label: 'Total Clientes', value: data.length }];
        break;
      case 'RDC':
        columns = RDC_COLS.map(c => ({ key: c, label: c }));
        data = rdc.filter(filterByClient);
        metrics = [{ label: 'Ideias RDC', value: data.length }];
        priorityColumns = ['Ideia de Conteúdo', 'Score', 'Decisão'];
        break;
      case 'COBO':
        columns = COBO_COLS.filter(c => c !== 'Cliente_ID').map(c => ({ key: c, label: c }));
        data = cobo.filter(filterByClient);
        break;
      case 'PLANEJAMENTO':
        columns = PLANEJAMENTO_COLS.map(c => ({ key: c, label: c }));
        data = planejamento.filter(filterByClient);
        metrics = [{ label: 'Posts Planejados', value: data.length }];
        break;
      case 'TAREFAS':
        columns = TAREFAS_COLS.map(c => ({ key: c, label: c }));
        data = tasks.filter(filterByClient);
        metrics = [
          { label: 'Total', value: data.length },
          { label: 'Concluídas', value: data.filter(t => t.Status === 'done').length }
        ];
        priorityColumns = ['Título', 'Responsável', 'Status'];
        break;
      case 'FINANCAS':
        columns = FINANCAS_COLS.map(c => ({ key: c, label: c }));
        data = financas.filter(filterByClient);
        metrics = [{ label: 'Lançamentos', value: data.length }];
        break;
      case 'VH':
        columns = [{ key: 'Nome', label: 'Nome' }, { key: 'Cargo', label: 'Cargo' }, { key: 'Valor Hora', label: 'Valor Hora' }, { key: 'Horas Mensais', label: 'Horas' }];
        data = collaborators.map(c => ({
          ...c,
          'Valor Hora': c.valorHora ? `R$ ${c.valorHora}` : '-',
          'Horas Mensais': c.horasMensais || '-'
        }));
        metrics = [{ label: 'Colaboradores', value: data.length }];
        break;
      case 'MATRIZ':
        columns = MATRIZ_ESTRATEGICA_COLS.map(c => ({ key: c, label: c }));

        // Filter clients using the same logic as TableView
        const targetMatriz = selectedClientIds.length > 0
          ? matriz.filter(m => selectedClientIds.includes(m.Cliente_ID))
          : matriz;

        data = targetMatriz.map(item => ({
          ...item,
          // Ensure we have values for all columns, defaulting to '-' if missing
          ...MATRIZ_ESTRATEGICA_COLS.reduce((acc, col) => ({
            ...acc,
            [col]: item[col] || '-'
          }), {})
        }));

        metrics = [{ label: 'Registros', value: data.length }];
        break;
      default:
        data = [];
    }

    return {
      tab: activeTab,
      title,
      subtitle: `Relatório gerado em ${new Date().toLocaleDateString()}`,
      Cliente: currentClient?.Nome || (selectedClientIds.length > 0 ? 'Múltiplos Clientes' : 'Geral'),
      data,
      columns,
      metrics,
      legends: EXPORT_LEGENDS[activeTab]?.blocks,
      priorityColumns: priorityColumns
    };
  };

  const handleExportExcel = async () => {
    const config = getExportConfig();
    if (!config.data || config.data.length === 0) {
      addNotification('warning', 'Sem dados', 'A tabela atual não possui dados para exportar.');
      return;
    }

    addNotification('info', 'Exportando...', 'Gerando relatório Excel...');
    const result = await exportExcel(config);

    if (result) {
      addNotification('success', 'Sucesso', 'Excel gerado com sucesso.');
    } else {
      addNotification('error', 'Erro', 'Falha ao gerar Excel.');
    }
    setIsExportModalOpen(false);
  };

  const handleExportPNG = async () => {
    const config = getExportConfig();
    if (!config.data || config.data.length === 0) {
      addNotification('warning', 'Sem dados', 'A tabela atual não possui dados para exportar.');
      return;
    }

    addNotification('info', 'Exportando...', 'Gerando imagem PNG...');
    const result = await exportPng(config, 'export-slide-renderer');

    if (result) {
      addNotification('success', 'Sucesso', 'PNG gerado com sucesso.');
    } else {
      addNotification('error', 'Erro', 'Falha ao gerar PNG.');
    }
    setIsExportModalOpen(false);
  };

  const handleExportPDF = async () => {
    const config = getExportConfig();
    if (!config.data || config.data.length === 0) {
      addNotification('warning', 'Sem dados', 'A tabela atual não possui dados para exportar.');
      return;
    }

    addNotification('info', 'Exportando...', 'Gerando relatório PDF...');
    const result = await exportPdf(config);

    if (result) {
      addNotification('success', 'Sucesso', 'PDF gerado com sucesso.');
    } else {
      addNotification('error', 'Erro', 'Falha ao gerar PDF.');
    }
    setIsExportModalOpen(false);
  };
  useEffect(() => {
    // 1. Define checkInvite function first so it's available
    const checkInvite = async (currentSession: any) => {
      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get('invite');

      if (inviteToken) {
        if (!currentSession?.user) {
          // Store for post-login
          sessionStorage.setItem('pending_invite', inviteToken);
        } else {
          try {
            await DatabaseService.acceptInvite(inviteToken);
            window.history.replaceState({}, document.title, window.location.pathname);
            // alert('Você entrou no workspace com sucesso!');
            setToasts(prev => [...prev, { id: generateId(), tipo: 'success', titulo: 'Sucesso', mensagem: 'Você entrou no workspace com sucesso!', timestamp: new Date().toISOString(), lida: false }]);
            window.location.reload();
          } catch (e: any) {
            // alert('Erro ao aceitar convite: ' + e.message);
            let msg = e.message;
            if (msg.includes('policy')) msg = 'Você não tem permissão para entrar neste workspace ou o convite expirou.';
            setToasts(prev => [...prev, { id: generateId(), tipo: 'error', titulo: 'Erro no Convite', mensagem: msg, timestamp: new Date().toISOString(), lida: false }]);
          }
        }
      } else {
        // Check for pending invite
        const pending = sessionStorage.getItem('pending_invite');
        if (pending && currentSession?.user) {
          try {
            await DatabaseService.acceptInvite(pending);
            sessionStorage.removeItem('pending_invite');
            // alert('Você entrou no workspace com sucesso!');
            setToasts(prev => [...prev, { id: generateId(), tipo: 'success', titulo: 'Sucesso', mensagem: 'Você entrou no workspace com sucesso!', timestamp: new Date().toISOString(), lida: false }]);
            window.location.reload();
          } catch (e: any) {
            // alert('Erro ao aceitar convite pendente: ' + e.message);
            let msg = e.message;
            if (msg.includes('policy')) msg = 'Você não tem permissão para entrar neste workspace ou o convite expirou.';
            setToasts(prev => [...prev, { id: generateId(), tipo: 'error', titulo: 'Erro no Convite', mensagem: msg, timestamp: new Date().toISOString(), lida: false }]);
            sessionStorage.removeItem('pending_invite');
          }
        }
      }
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setCurrentUser(session?.user ?? null);
        setAuthLoading(false);
        // Check invite on initial load
        if (session) checkInvite(session);
      })
      .catch((err) => {
        console.error('Supabase getSession Error:', err);
        setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        const savedProfile = localStorage.getItem(`profile_${session.user.id}`);
        if (savedProfile) {
          setPerfilUsuario(JSON.parse(savedProfile));
        } else {
          setPerfilUsuario({
            id: session.user.id,
            email: session.user.email ?? '',
            full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
            role: 'Especialista EKKO',
            status: 'online'
          });
          // Secondary guard: Upsert profile to be absolutely sure it exists
          supabase.from('profiles').upsert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
            role: 'Especialista',
            status: 'online'
          }).then(({ error }) => {
            if (error) console.warn('Secondary profile sync failed:', error);
          });
        }
      } else {
        setPerfilUsuario(null);
        setWorkspaces([]);
        setCurrentWorkspace(null);
      }
      setAuthLoading(false);

      // Check invite on auth change
      checkInvite(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshWorkspaces();
    }
  }, [currentUser, refreshWorkspaces]);

  useEffect(() => {
    if (currentWorkspace) {
      loadWorkspaceData(currentWorkspace.id);
    }
  }, [currentWorkspace, loadWorkspaceData]);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SMART notificacoes (CHECKS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    console.log('ActiveTab Changed', { activeTab });
    if (!currentUser || activeTab === 'DASHBOARD') return;

    const checkSmart = () => {
      const today = new Date().toISOString().split('T')[0];

      // 1. Overdue Tasks
      const lateCount = tasks.filter(t => t.Status !== 'concluido' && t.Data_Entrega && t.Data_Entrega < today).length;
      if (lateCount > 0) {
        addNotification('warning', 'Tarefas Atrasadas', `Você tem ${lateCount} tarefas vencidas. Revise o fluxo.`);
      }

      // 2. Planning Check
      if (activeTab === 'PLANEJAMENTO') {
        const hasToday = planejamento.some(p => p.Data === today);
        if (!hasToday) {
          addNotification('info', 'Aviso de Planejamento', 'Ainda não há conteúdos planejados para hoje.');
        }
      }

      // 3. VH Limit (Simple example)
      if (activeTab === 'VH') {
        const totalHours = tasks
          .filter(t => t.Status === 'concluido')
          .reduce((acc, t) => acc + (Number(t.Tempo_Gasto_H) || 0), 0);
        if (totalHours > 160) {
          addNotification('warning', 'Limite VH', 'O volume de horas executadas está acima da média esperada.');
        }
      }
    };

    // Run after a short delay to avoid spamming on load
    const timer = setTimeout(checkSmart, 5000);
    return () => clearTimeout(timer);
  }, [currentUser, tasks.length, planejamento.length, activeTab]);

  useEffect(() => {
    const saved = localStorage.getItem('ekko_os_ui_v17');
    if (saved) {
      const p = JSON.parse(saved);
      if (p.tabOrder) {
        // Merge saved order with new tabs to ensure missing ones appear
        const defaultOrder: TipoTabela[] = ['DASHBOARD', 'CLIENTES', 'ORGANICKIA', 'RDC', 'MATRIZ', 'COBO', 'PLANEJAMENTO', 'FINANCAS', 'TAREFAS', 'VH', 'WHITEBOARD'];
        const uniqueTabs = new Set([...p.tabOrder, ...defaultOrder]);
        setTabOrder(Array.from(uniqueTabs));
      }
      if (p.vhConfig) setVhConfig(p.vhConfig);
      if (p.BibliotecaConteudo) setContentLibrary(p.BibliotecaConteudo);
      if (p.selectedClientIdIA) setSelectedClientIdIA(p.selectedClientIdIA);
      if (p.iaAudioInsight) setIaAudioInsight(p.iaAudioInsight);
      if (p.iaPdfInsight) setIaPdfInsight(p.iaPdfInsight);
      if (p.iaHistory) setIaHistory(p.iaHistory);
    }
  }, []);

  useEffect(() => {
    // Only persist UI state to LocalStorage
    localStorage.setItem('ekko_os_ui_v17', JSON.stringify({
      tabOrder, vhConfig, BibliotecaConteudo, selectedClientIdIA, iaAudioInsight, iaPdfInsight, iaHistory
    }));
  }, [tabOrder, vhConfig, BibliotecaConteudo, selectedClientIdIA, iaAudioInsight, iaPdfInsight, iaHistory]);

  useEffect(() => {
    setSelection([]);
  }, [activeTab]);

  const addNotification = useCallback((tipo: NotificacaoApp['tipo'], titulo: string, mensagem: string) => {
    const newNotif: NotificacaoApp = {
      id: generateId(),
      tipo,
      titulo,
      mensagem,
      timestamp: new Date().toISOString(),
      lida: false
    };
    setNotificacoes(prev => [newNotif, ...prev].slice(0, 50));
  }, []);


  const handleUpdate = useCallback(async (id: string, tab: TipoTabela, field: string, value: any, skipLog: boolean = false) => {
    // Permission Check
    const member = currentWorkspace?.membros_workspace?.find((m: any) => m.id_usuario === currentUser?.id);
    if (member && member.papel === 'viewer') {
      alert('Você tem permissão apenas de visualização.');
      return;
    }

    // Identificar a lista correta
    let currentList: any[] = [];
    if (tab === 'CLIENTES') currentList = clients;
    else if (tab === 'RDC') currentList = rdc;
    else if (tab === 'MATRIZ') currentList = matriz;
    else if (tab === 'COBO') currentList = cobo;
    else if (tab === 'PLANEJAMENTO') currentList = planejamento;
    else if (tab === 'FINANCAS') currentList = financas;
    else if (tab === 'TAREFAS') currentList = tasks;
    else if (tab === 'IA_HISTORY') currentList = iaHistory;

    const originalItem = currentList.find(i => i.id === id);
    if (!originalItem) return;

    let updated = { ...originalItem, [field]: value, updated_at: new Date().toISOString() };

    // Notification Triggers
    if (tab === 'TAREFAS') {
      if (field === 'Prioridade' && value === 'URGENTE') {
        addNotification('warning', 'Tarefa Urgente', `A tarefa "${originalItem.Título || 'Sem Título'}" foi marcada como URGENCIAL.`);
      }
      if (field === 'Status' && value === 'concluido') {
        addNotification('success', 'Tarefa concluída', `Tarefa marcada como concluída.`);
      }
    }

    // Validation Error Trigger
    if (['Nome', 'Título', 'Conteúdo', 'Descrição'].includes(field) && !value) {
      addNotification('error', 'Campo inválido — revise', `O campo ${field} não pode ficar vazio.`);
    }

    // Financial conversions
    if (tab === 'FINANCAS' && (field === 'Valor')) {
      updated.Valor = parseNumericValue(value);
    }

    // RDC Automation
    if (tab === 'RDC') {
      // Clamp values 1-5
      if (["Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)"].includes(field)) {
        let num = parseNumericValue(value);
        if (num > 5) num = 5;
        if (num < 1 && value !== "" && value !== 0) num = 1;
        updated[field] = num;
      }

      const r = parseNumericValue(updated["Resolução (1–5)"]);
      const d = parseNumericValue(updated["Demanda (1–5)"]);
      const c = parseNumericValue(updated["Competição (1–5)"]);

      const score = r * d * c;
      updated["Score (R×D×C)"] = score;

      if (r === 0 || d === 0 || c === 0) {
        updated["Decisão"] = "Preencha R/D/C";
      } else if (score >= 81) {
        updated["Decisão"] = "Implementar já";
      } else if (score >= 41) {
        updated["Decisão"] = "Ajustar e testar";
      } else {
        updated["Decisão"] = "Descartar e redirecionar";
      }
    }

    // Tarefa Activity Logging
    if (tab === 'TAREFAS' && field !== 'Atividades' && field !== 'Comentarios' && !skipLog) {
      const activity: AtividadeTarefa = {
        id: generateId(),
        tipo: field === 'Status' ? 'status_change' : 'update',
        usuario: currentUser?.email || 'Agência Ekko',
        mensagem: field === 'Status' ? `alterou o status para ${value}` : `alterou ${field.toLowerCase()} para ${value}`,
        timestamp: new Date().toISOString()
      };
      updated.Atividades = [activity, ...(updated.Atividades || [])];
    }

    // Optimistic Update
    const updateFn = (list: any[]) => list.map(i => i.id === id ? updated : i);

    if (tab === 'CLIENTES') setClients(updateFn);
    else if (tab === 'RDC') setRdc(updateFn);
    else if (tab === 'PLANEJAMENTO') setPlanejamento(updateFn);
    else if (tab === 'FINANCAS') setFinancas(updateFn);
    else if (tab === 'TAREFAS') setTasks(updateFn);
    else if (tab === 'COBO') setCobo(updateFn);
    else if (tab === 'MATRIZ') setMatriz(updateFn);
    else if (tab === 'IA_HISTORY') setIaHistory(updateFn);

    // Sync to Backend
    if (currentWorkspace) {
      const tableName = getTableName(tab);
      if (tableName) {
        console.log(`[EKKO-SYNC] UPDATE_TRIGGERED | Table: ${tableName} | ID: ${id}`);
        const error = await DatabaseService.syncItem(tableName, updated, currentWorkspace.id);

        if (error) {
          console.error(`[EKKO-SYNC] UPDATE_FAILURE | Table: ${tableName} | ID: ${id}`, error);
          addNotification('error', 'Falha ao salvar', `Erro: ${error.message || JSON.stringify(error) || 'Não foi possível sincronizar as alterações.'}`);
          // Revert optimistic update? For now, we leave it as complex to revert.
        } else if (!skipLog) {
          // Success notification (optional, maybe too noisy)
          // addNotification('success', 'Alterações salvas', `O campo ${field} foi atualizado.`);
        }
      }
    }
  }, [currentWorkspace, currentUser, addNotification, clients, rdc, matriz, cobo, planejamento, financas, tasks, iaHistory]);

  const handleAddRow = useCallback(async (tab: TipoTabela, initial: Partial<any> = {}): Promise<string> => {
    // Permission Check
    const member = currentWorkspace?.membros_workspace?.find((m: any) => m.id_usuario === currentUser?.id);
    if (member && member.papel === 'viewer') {
      alert('Você tem permissão apenas de visualização.');
      return;
    }
    if (!currentWorkspace) {
      alert("Selecione um Workspace primeiro.");
      return;
    }
    // Fix: Prevent creation of items with invalid Foreign Key if no clients exist
    if (clients.length === 0 && !['CLIENTES', 'DASHBOARD', 'VH', 'ORGANICKIA'].includes(tab)) {
      alert('Para criar itens nesta tabela, cadastre pelo menos um Cliente primeiro.');
      return;
    }
    const id = generateId();
    const defaultClientId = selectedClientIds.length === 1 ? selectedClientIds[0] : (clients[0]?.id || 'GERAL');
    let newItem: any = null;

    if (tab === 'CLIENTES') newItem = { id, Nome: 'Novo Cliente', Nicho: '', Responsável: '', WhatsApp: '', Instagram: '', Objetivo: '', Observações: '', "Cor (HEX)": '#3B82F6', Status: 'Ativo', ...initial };
    else if (tab === 'FINANCAS') newItem = { id, Lançamento: `FIN-${generateId().toUpperCase().slice(0, 4)}`, Data: new Date().toISOString().split('T')[0], Cliente_ID: defaultClientId, Tipo: 'Entrada', Categoria: 'Serviço', Descrição: 'Novo Lançamento', Valor: 0, Recorrência: 'Única', Data_Início: new Date().toISOString().split('T')[0], Data_Fim: '', Dia_Pagamento: 1, Observações: '', ...initial };
    else if (tab === 'PLANEJAMENTO') {
      const date = initial.Data || new Date().toISOString().split('T')[0];
      newItem = { id, Cliente_ID: initial.Cliente_ID || defaultClientId, Data: date, Hora: initial.Hora || '09:00', Conteúdo: initial.Conteúdo || '', Função: initial.Função || 'Hub', Rede_Social: initial.Rede_Social || 'Instagram', "Tipo de conteúdo": initial["Tipo de conteúdo"] || '', Intenção: initial.Intenção || 'Relacionamento', Canal: initial.Canal || '', Formato: initial.Formato || '', Zona: initial.Zona || 'Morna', "Quem fala": initial["Quem fala"] || '', "Status do conteúdo": 'Pendente', ...initial };
    } else if (tab === 'TAREFAS') {
      const resp = currentUser?.email || '';
      const activity: AtividadeTarefa = {
        id: generateId(),
        tipo: 'create',
        usuario: resp || 'Agência Ekko',
        mensagem: 'criou a tarefa',
        timestamp: new Date().toISOString()
      };
      newItem = { id, Task_ID: `Tarefa-${generateId().toUpperCase().slice(0, 4)}`, Cliente_ID: initial.Cliente_ID || defaultClientId, Título: initial.Título || 'Nova Tarefa', Área: initial.Área || 'Conteúdo', Status: initial.Status || 'todo', Prioridade: initial.Prioridade || 'Média', Responsável: resp, Data_Entrega: initial.Data_Entrega || new Date().toISOString().split('T')[0], Checklist: [], Anexos: [], Comentarios: [], Atividades: [activity], Criado_Em: new Date().toISOString(), Atualizado_Em: new Date().toISOString(), ...initial };
    } else if (tab === 'COBO') newItem = { id, Cliente_ID: defaultClientId, Canal: 'Instagram', Frequência: '', Público: '', Voz: '', Zona: '', Intenção: '', Formato: '', ...initial };
    else if (tab === 'MATRIZ') newItem = { id, Cliente_ID: defaultClientId, Rede_Social: 'Instagram', Função: 'Hub', "Quem fala": '', "Papel estratégico": '', "Tipo de conteúdo": '', "Resultado esperado": '', ...initial };
    else if (tab === 'RDC') newItem = { id, Cliente_ID: defaultClientId, "Ideia de Conteúdo": '', Rede_Social: 'Instagram', "Tipo de conteúdo": '', "Resolução (1–5)": 1, "Demanda (1–5)": 1, "Competição (1–5)": 1, "Score (R×D×C)": 1, Decisão: 'Preencha R/D/C', ...initial };

    if (newItem) {
      console.log(`[EKKO-SYNC] CREATE_TRIGGERED | Table: ${tab} | ID: ${id}`, newItem);

      // Optimistic update
      if (tab === 'CLIENTES') setClients(prev => [...prev, newItem]);
      else if (tab === 'FINANCAS') setFinancas(prev => [...prev, newItem]);
      else if (tab === 'PLANEJAMENTO') setPlanejamento(prev => [...prev, newItem]);
      else if (tab === 'TAREFAS') setTasks(prev => [...prev, newItem]);
      else if (tab === 'COBO') setCobo(prev => [...prev, newItem]);
      else if (tab === 'MATRIZ') setMatriz(prev => [...prev, newItem]);
      else if (tab === 'RDC') setRdc(prev => [...prev, newItem]);

      const tableName = getTableName(tab);
      if (tableName && currentWorkspace) {
        const error = await DatabaseService.syncItem(tableName, newItem, currentWorkspace.id);

        if (error) {
          console.error(`[EKKO-SYNC] CREATE_FAILURE | Table: ${tableName} | ID: ${id}`, error);
          // Rollback local state (simple approach: remove it if we failed to save)
          const filterFn = (prev: any[]) => prev.filter(i => i.id !== id);
          if (tab === 'CLIENTES') setClients(filterFn);
          else if (tab === 'FINANCAS') setFinancas(filterFn);
          else if (tab === 'PLANEJAMENTO') setPlanejamento(filterFn);
          else if (tab === 'TAREFAS') setTasks(filterFn);
          else if (tab === 'COBO') setCobo(filterFn);
          else if (tab === 'MATRIZ') setMatriz(filterFn);
          else if (tab === 'RDC') setRdc(filterFn);

          addNotification('error', 'Erro ao salvar', `Erro: ${error.message || JSON.stringify(error) || 'O registro não pôde ser criado no servidor.'}`);
        } else {
          if (tab === 'CLIENTES') addNotification('success', 'Cliente criado com sucesso', 'Um novo perfil de cliente foi adicionado.');
          else if (tab === 'TAREFAS') addNotification('success', 'Nova tarefa adicionada', 'A tarefa foi criada no fluxo de trabalho.');
          else addNotification('success', 'Item Criado', `Novo item adicionado em ${TABLE_LABELS[tab]}.`);
        }
      }
    }
    return id;
  }, [currentWorkspace, selectedClientIds, clients, currentUser, addNotification]);

  const performDelete = useCallback((ids: string[], tab: TipoTabela | 'IA_HISTORY') => {
    // Permission Check
    const member = currentWorkspace?.membros_workspace?.find((m: any) => m.id_usuario === currentUser?.id);
    if (member && member.papel === 'viewer') {
      alert('Você tem permissão apenas de visualização.');
      return;
    }
    if (ids.length === 0) return;
    const confirmStr = window.prompt(`ATENÇÃO: Deseja EXCLUIR DEFINITIVAMENTE estes ${ids.length} item(s)? Digite "EXCLUIR" para confirmar:`);
    if (confirmStr?.toUpperCase() !== 'EXCLUIR') return;

    if (tab === 'CLIENTES') setClients(prev => prev.filter(c => !ids.includes(c.id)));
    if (tab === 'RDC') setRdc(prev => prev.filter(r => !ids.includes(r.id)));
    if (tab === 'MATRIZ') setMatriz(prev => prev.filter(m => !ids.includes(m.id)));
    if (tab === 'COBO') setCobo(prev => prev.filter(c => !ids.includes(c.id)));
    if (tab === 'PLANEJAMENTO') setPlanejamento(prev => prev.filter(p => !ids.includes(p.id)));
    if (tab === 'FINANCAS') setFinancas(prev => prev.filter(f => !ids.includes(f.id)));
    if (tab === 'TAREFAS') setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    if (tab === 'IA_HISTORY') setIaHistory(prev => prev.filter(h => !ids.includes(h.id)));
    setSelection([]);

    if (currentWorkspace) {
      const tableName = getTableName(tab as string);
      if (tableName) {
        ids.forEach(id => DatabaseService.deleteItem(tableName, id));
        addNotification('error', 'Item removido', `${ids.length} item(s) excluído(s).`);

      }
    }

  }, [currentWorkspace]);

  const performArchive = useCallback((ids: string[], tab: TipoTabela | 'IA_HISTORY', archive: boolean = true) => {
    if (ids.length === 0) return;
    const updateFn = (list: any[]) => list.map(i => ids.includes(i.id) ? { ...i, __archived: archive } : i);

    if (tab === 'CLIENTES') setClients(updateFn);
    if (tab === 'RDC') setRdc(updateFn);
    if (tab === 'MATRIZ') setMatriz(updateFn);
    if (tab === 'COBO') setCobo(updateFn);
    if (tab === 'PLANEJAMENTO') setPlanejamento(updateFn);
    if (tab === 'FINANCAS') setFinancas(updateFn);
    if (tab === 'TAREFAS') setTasks(updateFn);
    if (tab === 'IA_HISTORY') setIaHistory(updateFn);
    setSelection([]);

    if (currentWorkspace) {
      const tableName = getTableName(tab as string);
      if (tableName) {
        ids.forEach(id => DatabaseService.updateItem(tableName, id, { __archived: archive }));
      }
    }
  }, [currentWorkspace]);

  const filterArchived = <T extends { __archived?: boolean }>(list: T[]): T[] => {
    return list.filter(i => showArchived ? true : !i.__archived);
  };

  const currentPlanejamento = useMemo(() => filterArchived(selectedClientIds.length > 0 ? planejamento.filter(item => selectedClientIds.includes(item.Cliente_ID)) : planejamento), [planejamento, selectedClientIds, showArchived]);
  const currentRdc = useMemo(() => filterArchived(selectedClientIds.length > 0 ? rdc.filter(item => selectedClientIds.includes(item.Cliente_ID)) : rdc), [rdc, selectedClientIds, showArchived]);
  const currentTasks = useMemo(() => filterArchived(selectedClientIds.length > 0 ? tasks.filter(item => selectedClientIds.includes(item.Cliente_ID)) : tasks), [tasks, selectedClientIds, showArchived]);
  const currentFinancas = useMemo(() => filterArchived(selectedClientIds.length > 0 ? financas.filter(item => selectedClientIds.includes(item.Cliente_ID)) : financas), [financas, selectedClientIds, showArchived]);
  const currentCobo = useMemo(() => filterArchived(selectedClientIds.length > 0 ? cobo.filter(item => selectedClientIds.includes(item.Cliente_ID)) : cobo), [cobo, selectedClientIds, showArchived]);
  const currentMatriz = useMemo(() => filterArchived(selectedClientIds.length > 0 ? matriz.filter(item => selectedClientIds.includes(item.Cliente_ID)) : matriz), [matriz, selectedClientIds, showArchived]);
  const currentClient = useMemo(() => selectedClientIds.length > 0 ? clients.find(c => c.id === selectedClientIds[0]) : null, [clients, selectedClientIds]);

  const fullAppContext = useMemo(() => ({
    clients, rdc: currentRdc, planning: currentPlanejamento, tasks: currentTasks,
    finances: currentFinancas, cobo: currentCobo, matriz: currentMatriz, activeTab
  }), [clients, currentRdc, currentPlanejamento, currentTasks, currentFinancas, currentCobo, currentMatriz, activeTab]);

  const activeTabData = useMemo(() => {
    switch (activeTab) {
      case 'DASHBOARD': return { clients, tasks: currentTasks, financas: currentFinancas };
      case 'CLIENTES': return clients;
      case 'RDC': return currentRdc;
      case 'MATRIZ': return currentMatriz;
      case 'COBO': return currentCobo;
      case 'PLANEJAMENTO': return currentPlanejamento;
      case 'FINANCAS': return currentFinancas;
      case 'TAREFAS': return currentTasks;
      case 'VH': return { vhConfig, collaborators };
      case 'ORGANICKIA': return { iaHistory, audioInsight: iaAudioInsight, pdfInsight: iaPdfInsight };
      default: return null;
    }
  }, [activeTab, clients, currentTasks, currentFinancas, currentRdc, currentMatriz, currentCobo, currentPlanejamento, vhConfig, collaborators, iaHistory, iaAudioInsight, iaPdfInsight]);

  const toggleSelection = useCallback((id: string) => {
    setSelection(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const toggleClientSelection = useCallback((id: string) => {
    setSelectedClientIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }, []);

  const [isPresentationOpen, setIsPresentationOpen] = useState(false);
  const [useMasterSlide, setUseMasterSlide] = useState(false);
  const [presentationStep, setPresentationStep] = useState<'input' | 'preview'>('input');
  const [presentationInput, setPresentationInput] = useState('');
  const [presentationLoading, setPresentationLoading] = useState(false);
  const [presentationBrief, setPresentationBrief] = useState<any>(null);
  const presentationRef = useRef<HTMLDivElement>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<{ id: string, tab: TipoTabela, field: string, value: string } | null>(null);






  const handleStartPresentationGen = async (customPrompt?: string) => {
    const input = customPrompt || presentationInput;
    if (!input.trim()) return;
    setPresentationLoading(true);
    try {
      const brief = await generatePresentationBriefing({
        tab: activeTab,
        clientName: currentClient?.Nome || 'Geral',
        nicho: currentClient?.Nicho || 'N/A',
        userInput: input
      });
      setPresentationBrief(brief);
      setPresentationStep('preview');
      setIsPresentationOpen(true);
      addNotification('success', 'Análise Concluída', 'O Assistente IA gerou novas sugestões para este cliente.');
    } finally {

      setPresentationLoading(false);
    }
  };



  const handleApplyAction = useCallback(async (action: AssistantAction) => {
    if (!currentWorkspace) {
      addNotification('warning', 'Atenção', 'Selecione um workspace para aplicar ações.');
      return;
    }
    const { type, payload } = action;
    const today = new Date().toISOString();

    if (type === 'create_task') {
      const resp = currentUser?.email || 'Agência Ekko';
      const activity: AtividadeTarefa = {
        id: generateId(),
        tipo: 'create',
        usuario: resp,
        mensagem: 'criou a tarefa',
        timestamp: today
      };

      const newTask: Tarefa = {
        id: generateId(),
        workspace_id: currentWorkspace.id,
        Task_ID: `Tarefa-${generateId().toUpperCase().slice(0, 4)}`,
        Criado_Em: today,
        Atualizado_Em: today,
        Status: 'todo',
        Prioridade: 'Média',
        Checklist: [],
        Anexos: [],
        Comentarios: [],
        Atividades: [activity],
        Responsável: resp,
        ...payload
      };

      setTasks(prev => [newTask, ...prev]);
      await DatabaseService.syncItem('tasks', newTask, currentWorkspace.id);
      addNotification('success', 'Ação Confirmada', `Tarefa "${newTask.Título}" criada com sucesso.`);
    }

    if (type === 'suggest_rdc') {
      const newRdc: ItemRdc = {
        id: generateId(),
        workspace_id: currentWorkspace.id,
        "Resolução (1–5)": payload.resolucao || 1,
        "Demanda (1–5)": payload.demanda || 1,
        "Competição (1–5)": payload.competicao || 1,
        "Score (R×D×C)": (payload.resolucao || 1) * (payload.demanda || 1) * (payload.competicao || 1),
        Decisão: 'Ajustar e testar',
        Rede_Social: 'Instagram',
        "Tipo de conteúdo": 'Reels',
        ...payload
      };
      setRdc(prev => [newRdc, ...prev]);
      await DatabaseService.syncItem('rdc', newRdc, currentWorkspace.id);
      addNotification('success', 'Ação Confirmada', `Ideia RDC "${newRdc['Ideia de Conteúdo']}" adicionada.`);
    }

    if (type === 'create_planning_item') {
      const newPlan: ItemPlanejamento = {
        id: generateId(),
        workspace_id: currentWorkspace.id,
        Data: today.split('T')[0],
        "Dia da Semana": new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
        Conteúdo: 'Novo Conteúdo IA',
        Legenda: '',
        "Status do conteúdo": 'Ideia',
        Platforma: 'Instagram',
        Formato: 'Post',
        ...payload
      };
      setPlanejamento(prev => [newPlan, ...prev]);
      await DatabaseService.syncItem('planejamento', newPlan, currentWorkspace.id);
      addNotification('success', 'Ação Confirmada', `Planejamento para ${newPlan.Data} criado.`);
    }

    if (type === 'create_client') {
      const newClient: Cliente = {
        id: generateId(),
        workspace_id: currentWorkspace.id,
        Nome: 'Novo Cliente',
        Nicho: 'Geral',
        "Cor (HEX)": '#3B82F6',
        ...payload
      };
      setClients(prev => [newClient, ...prev]);
      await DatabaseService.syncItem('clients', newClient, currentWorkspace.id);
      addNotification('success', 'Ação Confirmada', `Cliente "${newClient.Nome}" cadastrado.`);
    }

    if (type === 'suggest_matriz') {
      const activeClient = clients.find((c: any) => c.id === selectedClientIds[0]);
      const newItem: ItemMatrizEstrategica = {
        id: generateId(),
        workspace_id: currentWorkspace.id,
        Cliente_ID: activeClient?.id || 'GLOBAL',
        "Quem fala": 'Especialista',
        Rede_Social: payload.Rede_Social || 'Instagram',
        "Função": payload.Função || 'Autoridade',
        "Papel estratégico": payload["Papel estratégico"] || 'Engajar base',
        "Tipo de conteúdo": payload["Tipo de conteúdo"] || 'Reels',
        "Resultado esperado": payload["Resultado esperado"] || 'Seguir perfil',
        ...payload
      };
      setMatriz(prev => [newItem, ...prev]);
      await DatabaseService.syncItem('matriz', newItem, currentWorkspace.id);
      addNotification('success', 'Ação Confirmada', `Nova estratégia para ${newItem.Rede_Social} adicionada.`);
    }

    // Add other action handlers as needed
  }, [currentUser, currentWorkspace, addNotification]);

  const handleUpdateTask = async (taskId: string, updates: any) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
    await DatabaseService.updateItem('tasks', taskId, updates);
    addNotification('success', 'Tarefa Atualizada', 'As alterações do Quadro Branco foram salvas.');
  };

  // SCROLL LOCK: Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (window.innerWidth < 1024 && !sidebarCollapsed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarCollapsed]);



  if (authLoading) return (
    <div className="fixed inset-0 bg-app-bg flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  if (!currentUser) return <AuthView onSuccess={setCurrentUser} />;

  return (
    <div
      onMouseDown={() => initAudio()}
      className="flex h-[100dvh] bg-app-bg text-app-text font-sans overflow-hidden transition-colors duration-300"
    >

      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-[2000] lg:hidden backdrop-blur-sm animate-fade" onClick={() => setSidebarCollapsed(true)}></div>
      )}

      <aside className={`transition-all duration-300 flex flex-col dark:bg-app-surface-2 bg-white border-r border-app-border shrink-0 z-[2100] fixed inset-y-0 left-0 lg:relative ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-[85vw] sm:w-64 shadow-2xl lg:shadow-none'}`}>
        <div className={`h-24 flex items-center border-b border-app-border justify-center overflow-hidden ${sidebarCollapsed ? 'px-0' : 'px-5'}`}>
          <Logo collapsed={sidebarCollapsed} theme={theme} />
        </div>
        <nav className="flex-1 py-6 px-0 space-y-2 overflow-y-auto custom-scrollbar flex flex-col items-center">
          {tabOrder.map(tab => (
            <button key={`nav-tab-${tab}`} onClick={() => { playUISound('tap'); setActiveTab(tab); if (window.innerWidth < 1024) setSidebarCollapsed(true); }} className={`ios-btn w-[90%] flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-4'} py-3 rounded-xl transition-all group ${activeTab === tab ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-app-text-muted hover:bg-app-surface hover:text-app-text-strong'}`}>
              <i className={`fa-solid ${getIcon(tab)} text-xl transition-transform group-hover:scale-110`}></i>
              {!sidebarCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest truncate">{TABLE_LABELS[tab]}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-app-border space-y-2 bg-app-surface-2/80 backdrop-blur-md flex flex-col items-center">
          <button onClick={() => { playUISound('tap'); setIsLibraryEditorOpen(true); }} className={`ios-btn w-[90%] flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-4'} py-3 rounded-xl text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all group`}>
            <i className="fa-solid fa-layer-group text-xl transition-transform group-hover:scale-110"></i>{!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Tipos</span>}
          </button>
          <button onClick={() => { playUISound('tap'); setIsReorderOpen(true); }} className={`ios-btn w-[90%] flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-4'} py-3 rounded-xl text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all group`}>
            <i className="fa-solid fa-arrows-up-down-left-right text-xl transition-transform group-hover:scale-110"></i>{!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Ordem</span>}
          </button>
          <button onClick={() => { playUISound('tap'); setSidebarCollapsed(!sidebarCollapsed); }} className={`ios-btn w-[90%] flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-4'} py-3 rounded-xl text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all group flex`}>
            <i className={`fa-solid ${sidebarCollapsed ? 'fa-expand' : 'fa-arrow-left'} text-xl transition-transform group-hover:scale-110`}></i>{!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* APPLE-STYLE NOTIFICATION TOAST OVERLAY (PATCH: BOTTOM-RIGHT) */}
      <div className="fixed bottom-6 z-[9999] pointer-events-none flex flex-col-reverse left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 items-center sm:items-end">
        {notificacoes.slice(0, 2).map((n) => (
          <NotificationToast
            key={n.id}
            notification={n}
            onClose={(id) => setNotificacoes(prev => prev.filter(x => x.id !== id))}
          />
        ))}
      </div>


      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-app-bg transition-colors duration-300">
        <header className={`sticky top-0 z-[50] px-4 sm:px-8 py-3 lg:h-[72px] border-b transition-colors flex justify-between items-center w-full backdrop-blur-md ${theme === 'dark' ? 'dark bg-[#0a0a0c]/80 border-zinc-800/80 text-zinc-300' : 'bg-white/80 border-gray-200 text-gray-800'}`}>
          {/* LEFT: Menu | Workspace */}
          <div className="flex items-center gap-4">
            <button className="ios-btn lg:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all p-2.5 -ml-2 relative z-[2200] bg-zinc-100 dark:bg-white/5 rounded-xl active:scale-90" onClick={() => { playUISound('tap'); setSidebarCollapsed(!sidebarCollapsed); }}>
              <Menu size={22} />
            </button>
            <WorkspaceSelector
              workspaces={workspaces}
              currentWorkspace={currentWorkspace}
              onSelect={handleWorkspaceSelect}
              onSettings={() => {
                setActiveSettingsTab('configuracoes');
                setIsSettingsFullscreenOpen(true);
              }}
              onManageMembers={() => {
                setActiveSettingsTab('pessoas');
                setIsSettingsFullscreenOpen(true);
              }}
              onCreate={() => setIsNewWorkspaceModalOpen(true)}
              loading={workspaceLoading}
            />
          </div>

          {/* RIGHT: Global Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => { playUISound('tap'); toggleTheme(); }} className="ios-btn p-2.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-white/5 dark:bg-white/5 dark:text-zinc-400 dark:hover:text-white transition-colors active:scale-90">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={() => {
                  if (!isNotificationOpen) playUISound('open');
                  setIsNotificationOpen(!isNotificationOpen);
                }}
                className="ios-btn p-2.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-white/5 dark:bg-white/5 dark:text-zinc-400 dark:hover:text-white transition-colors active:scale-90 relative"
              >
                <Bell size={18} />
                {notificacoes.some(n => !n.lida) && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-app-bg"></span>
                )}
              </button>

              <PortalPopover
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                triggerRef={notificationButtonRef}
                className="w-80"
                align="end"
              >
                <div className="bg-app-surface border border-app-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto">
                  <div className="p-5 border-b border-app-border flex justify-between items-center bg-app-surface-2/50 backdrop-blur-md">
                    <span className="text-[11px] font-black uppercase text-app-text-strong tracking-[0.2em]">Notificações</span>
                    <button
                      onClick={() => {
                        playUISound('tap');
                        setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
                      }}
                      className="ios-btn text-[9px] font-black uppercase text-blue-500 hover:text-app-text-strong transition-all"
                    >
                      Limpar Tudo
                    </button>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-app-surface">
                    {notificacoes.length === 0 ? (
                      <div className="p-12 text-center opacity-20">
                        <BellOff size={40} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Silêncio absoluto</p>
                      </div>
                    ) : (
                      notificacoes.map(n => (
                        <div key={n.id} className={`p-5 border-b border-app-border/50 hover:bg-app-bg transition-all cursor-pointer group ${!n.lida ? 'bg-blue-500/5' : ''}`}>
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${n.tipo === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              n.tipo === 'warning' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                              {n.tipo === 'success' ? <CheckCircle2 size={16} /> : n.tipo === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-baseline">
                                <p className="text-[11px] font-black text-app-text-strong uppercase tracking-tight">{n.titulo}</p>
                                <span className="text-[8px] font-bold text-[#334155] uppercase">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-[10px] font-medium text-app-text-muted leading-relaxed uppercase tracking-tight">{n.mensagem}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </PortalPopover>
            </div>

            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <button className="ios-btn hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:border-zinc-700 rounded-lg text-xs font-bold transition-colors shadow-sm dark:shadow-none uppercase tracking-widest" onClick={() => playUISound('tap')}>
                <Search size={14} /> BUSCAR
              </button>

              <button
                onClick={() => {
                  playUISound('tap');
                  setIsAssistantOpen(true);
                }}
                className="ios-btn flex items-center gap-3 sm:gap-2 px-3 sm:px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-xs font-bold transition-colors shadow-sm uppercase tracking-widest"
              >
                <Sparkles size={14} /> <span className="hidden sm:inline">ASSISTENTE GEMINI</span>
              </button>
              {perfilUsuario && (
                <ProfilePopover
                  profile={perfilUsuario}
                  tasks={tasks}
                  onUpdate={(updates) => {
                    const newProfile = { ...perfilUsuario, ...updates };
                    setPerfilUsuario(newProfile);
                    localStorage.setItem(`profile_${perfilUsuario.id}`, JSON.stringify(newProfile));
                  }}
                  onLogout={() => supabase.auth.signOut()}
                />
              )}
            </div>
          </div>
        </header>

        {/* Action Controls (Mobile-friendly row) */}
        {activeTab !== 'WHITEBOARD' && activeTab !== 'PLANEJAMENTO' && (
          <div className="relative group/scroll">
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar px-4 sm:px-8 py-2 border-b border-app-border/40 lg:border-none no-scrollbar snap-x snap-mandatory">
              <button
                ref={clientFilterButtonRef}
                onClick={() => setIsClientFilterOpen(!isClientFilterOpen)}
                className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all border px-4 py-2.5 rounded-xl whitespace-nowrap snap-start ${selectedClientIds.length > 0 ? 'bg-blue-600/10 border-blue-600 text-blue-600' : 'text-zinc-500 border-white/10 hover:border-white/20 hover:text-zinc-300'}`}
              >
                <Filter size={14} />
                {selectedClientIds.length > 0 ? `${selectedClientIds.length} Clientes` : <><span className="md:hidden">Todos</span><span className="hidden md:inline">Todos Clientes</span></>}
              </button>

              <button onClick={() => setShowArchived(!showArchived)} className={`shrink-0 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-2 snap-start ${showArchived ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'text-zinc-500 border-white/10 hover:border-white/20 hover:text-zinc-300'}`}>
                {showArchived ? <Eye size={14} /> : <EyeOff size={14} />}
                {showArchived ? 'Ocultar' : 'Arquivados'}
              </button>

              <Button ref={exportButtonRef} variant="secondary" onClick={() => setIsExportModalOpen(true)} className="!rounded-xl !h-[38px] !px-4 !text-[10px] !font-black !uppercase !tracking-widest flex items-center gap-2 snap-start whitespace-nowrap">
                <Download size={14} /> Exportar
              </Button>

              {/* Desktop Assistant (Hidden here as it's in the top bar for MD+) */}
              <Button variant="secondary" onClick={() => setIsAssistantOpen(true)} className="md:hidden !border-blue-600/30 hover:!border-blue-600 !text-blue-500 !rounded-xl !h-[38px] !px-4 !text-[10px] !font-black !uppercase !tracking-widest flex items-center gap-2 snap-start whitespace-nowrap">
                <Sparkles size={14} /> Gemini
              </Button>
            </div>
            {/* Visual fade indicators for scroll */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-app-bg to-transparent pointer-events-none opacity-0 sm:group-hover/scroll:opacity-100 transition-opacity"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-app-bg to-transparent pointer-events-none opacity-40 sm:group-hover/scroll:opacity-100 transition-opacity"></div>
          </div>
        )}



        <div className={`flex-1 overflow-y-auto custom-scrollbar animate-fade bg-app-bg ${(activeTab === 'WHITEBOARD' || activeTab === 'PLANEJAMENTO') ? 'p-0 overflow-hidden' : 'p-3 md:p-6 lg:p-10 pb-[calc(100px+env(safe-area-inset-bottom))] lg:pb-10'}`}>
          {activeTab === 'DASHBOARD' && <DashboardView clients={clients} tasks={currentTasks} financas={currentFinancas} planejamento={currentPlanejamento} rdc={currentRdc} />}
          {activeTab === 'CLIENTES' && <TableView tab="CLIENTES" data={filterArchived(clients)} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('CLIENTES')} clients={clients} library={BibliotecaConteudo} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} onOpenColorPicker={(id: string, val: string) => setColorPickerTarget({ id, tab: 'CLIENTES', field: 'Cor (HEX)', value: val })} />}
          {activeTab === 'RDC' && <TableView tab="RDC" data={currentRdc} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('RDC')} library={BibliotecaConteudo} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} />}
          {activeTab === 'MATRIZ' && <TableView tab="MATRIZ" data={currentMatriz} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('MATRIZ')} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} library={BibliotecaConteudo} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} />}


          {activeTab === 'COBO' && <TableView tab="COBO" data={currentCobo} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('COBO')} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} library={BibliotecaConteudo} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} />}

          {activeTab === 'PLANEJAMENTO' && <PlanningView data={currentPlanejamento} clients={clients} onUpdate={handleUpdate} onAdd={handleAddRow} rdc={currentRdc} matriz={matriz} cobo={cobo} tasks={tasks} iaHistory={iaHistory} setActiveTab={setActiveTab} performArchive={performArchive} performDelete={performDelete} library={BibliotecaConteudo} activeClientId={selectedClientIds.length === 1 ? selectedClientIds[0] : undefined} showArchived={showArchived} setShowArchived={setShowArchived} setIsClientFilterOpen={setIsClientFilterOpen} />}
          {activeTab === 'FINANCAS' && <FinancasView data={currentFinancas} onUpdate={async (tab, id, item) => { for (const key of Object.keys(item)) { if (key !== 'id') await handleUpdate(id, tab, key, item[key], true); } }} onDelete={performDelete} onArchive={performArchive} onAdd={(tab, initial) => handleAddRow(tab || 'FINANCAS', initial)} selection={selection} onSelect={setSelection} onClearSelection={() => setSelection([])} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} activeRegMode="lista" />}
          {activeTab === 'TAREFAS' && <TaskFlowView tasks={currentTasks} clients={clients} collaborators={collaborators} activeViewId={activeTaskViewId} setActiveViewId={setActiveTaskViewId} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('TAREFAS')} onSelectTask={setSelectedTaskId} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} />}
          {activeTab === 'VH' && <VhManagementView clients={clients} collaborators={collaborators} setCollaborators={setCollaborators} onUpdate={handleUpdate} selection={selection} onSelect={toggleSelection} />}
          {activeTab === 'ORGANICKIA' && <OrganickIAView
            clients={clients}
            cobo={cobo}
            matriz={matriz}
            rdc={rdc}
            planning={planejamento}
            selectedClientId={selectedClientIdIA}
            setSelectedClientId={setSelectedClientIdIA}
            audioInsight={iaAudioInsight}
            setAudioInsight={setIaAudioInsight}
            onAddItem={handleAddRow}
            pdfInsight={iaPdfInsight}
            setPdfInsight={setIaPdfInsight}
            history={iaHistory}
            setHistory={setIaHistory}
            onArchive={performArchive}
            onDelete={performDelete}
            showArchived={showArchived}
            onGenerateSlide={handleStartPresentationGen}
            addNotification={addNotification}
          />}
          {activeTab === 'WHITEBOARD' && (
            <ErrorBoundary>
              <Whiteboard />
            </ErrorBoundary>
          )}
        </div>

        {
          selectedTaskId && (
            <div className={`fixed inset-0 z-[2000] flex animate-fade pointer-events-none ${taskDetailViewMode === 'sidebar' ? 'justify-end' : 'items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto'}`}>
              <div className={`bg-app-surface-2 shadow-2xl transition-all pointer-events-auto overflow-hidden
              ${taskDetailViewMode === 'sidebar' ? 'h-[calc(100dvh-32px)] w-[550px] my-4 mr-4 rounded-3xl border border-app-border' : ''}
              ${taskDetailViewMode === 'modal' ? 'w-[900px] h-[85dvh] rounded-[32px] border border-app-border' : ''}
              ${taskDetailViewMode === 'fullscreen' ? 'fixed inset-4 rounded-[40px] border border-app-border' : ''}
            `}>
                <TaskDetailPanel
                  taskId={selectedTaskId}
                  tasks={tasks}
                  clients={clients}
                  collaborators={collaborators}
                  onClose={() => setSelectedTaskId(null)}
                  onUpdate={handleUpdate}
                  onArchive={performArchive}
                  onDelete={performDelete}
                  onAdd={handleAddRow}
                  viewMode={taskDetailViewMode as any}
                  setViewMode={setTaskDetailViewMode}
                />
              </div>
            </div>
          )
        }


        {activeTab !== 'WHITEBOARD' && <CopilotChat appData={fullAppContext} />}
        {activeTab !== 'WHITEBOARD' && (
          <AssistantDrawer
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
            activeTab={activeTab}
            appState={{ clients, cobo, matriz, planejamento, rdc, tasks, financas, collaborators, vhConfig, systematicModeling }}
            onApplyAction={handleApplyAction}
          />
        )}

      </main >

      {isSettingsFullscreenOpen && currentWorkspace && currentUser && (
        <WorkspaceManagerFullscreen
          workspace={currentWorkspace}
          currentUser={currentUser}
          initialTab={activeSettingsTab}
          onClose={() => setIsSettingsFullscreenOpen(false)}
          onUpdateWorkspace={(updated) => {
            setWorkspaces(prev => prev.map(ws => ws.id === updated.id ? updated : ws));
            setCurrentWorkspace(updated);
          }}
          onWorkspaceDeleted={() => {
            setIsSettingsFullscreenOpen(false);
            window.location.reload();
          }}
        />
      )}

      {isNewWorkspaceModalOpen && (
        <NewWorkspaceModal
          onClose={() => setIsNewWorkspaceModalOpen(false)}
          onCreate={async (name) => {
            try {
              const newWs = await DatabaseService.createWorkspace(name);
              // Default color or randomized as per snippet logic can be handled here or in service
              setWorkspaces(prev => [newWs, ...prev]);
              setCurrentWorkspace(newWs);
            } catch (e: any) {
              console.error(e);
              alert('Erro ao criar workspace.');
            }
          }}
        />
      )}

      {
        isPresentationOpen && presentationBrief && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl md:p-10 pointer-events-auto">
            <div className="w-full h-full md:h-[90dvh] md:max-w-6xl bg-app-surface border border-white/10 md:rounded-[30px] shadow-2xl flex flex-col overflow-hidden text-left">
              <div className="h-20 flex items-center justify-between px-6 md:px-10 border-b border-white/5 bg-app-surface-2 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-app-text-strong tracking-widest">Assistente de Slide IA</h3>
                  </div>
                </div>
                <button onClick={() => setIsPresentationOpen(false)} className="text-app-text-muted hover:text-app-text-strong"><i className="fa-solid fa-xmark text-2xl"></i></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                {presentationStep === 'input' ? (
                  <div className="max-w-2xl mx-auto py-10 md:py-20 text-center space-y-10">
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tighter text-app-text-strong uppercase">O que você deseja destacar nesta apresentação?</h2>
                    <textarea value={presentationInput} onChange={(e) => setPresentationInput(e.target.value)} placeholder="Ex: Destaque as pautas validadas no RDC e o cronograma de Reels deste mês." className="w-full h-40 bg-app-bg border border-app-border rounded-2xl p-6 text-app-text-strong outline-none" />
                    <Button onClick={() => handleStartPresentationGen()} disabled={presentationLoading} className="w-full h-14 !bg-blue-600">Gerar Slide Estratégico</Button>
                  </div>
                ) : (
                  <div className="space-y-10 animate-fade">
                    <div className="flex justify-between items-center bg-blue-500/5 p-6 border border-blue-500/10 rounded-2xl">
                      <Button variant="secondary" onClick={() => setPresentationStep('input')}>Voltar e Ajustar</Button>

                      <div className="flex items-center gap-3 bg-app-bg p-2 rounded-xl border border-app-border">
                        <span className="text-[10px] font-black uppercase text-app-text-muted px-2">Tipo de Slide:</span>
                        <button
                          onClick={() => setUseMasterSlide(false)}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!useMasterSlide ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-app-text-muted hover:text-app-text-strong'}`}
                        >
                          Standard
                        </button>
                        <button
                          onClick={() => setUseMasterSlide(true)}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${useMasterSlide ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-app-text-muted hover:text-app-text-strong'}`}
                        >
                          Master (High-Fi)
                        </button>
                      </div>
                    </div>
                    <div className="aspect-video w-full bg-white shadow-2xl rounded-xl overflow-hidden flex items-center justify-center overflow-x-auto">
                      <div className="scale-[0.3] md:scale-[0.45] origin-center w-[1920px] h-[1080px] pointer-events-none" ref={presentationRef}>
                        {useMasterSlide ? (
                          <MasterExportSlide
                            tab={activeTab}
                            clientName={currentClient?.Nome || "Geral"}
                            data={
                              activeTab === 'MATRIZ' ? currentMatriz :
                                activeTab === 'RDC' ? rdc.filter((r: any) => r.Cliente_ID === currentClient?.id && !r.__arquivado) :
                                  activeTab === 'COBO' ? currentCobo :
                                    activeTab === 'PLANEJAMENTO' ? currentPlanejamento :
                                      activeTab === 'TAREFAS' ? currentTasks : []
                            }
                          />
                        ) : (
                          <PresentationSlide
                            tab={activeTab}
                            config={{
                              nomeAgencia: 'EKKO STUDIOS',
                              titulo: presentationBrief?.titulo || '',
                              subtitulo: presentationBrief?.subtitulo || '',
                              tema: 'dark',
                              proporcao: '16:9',
                              nivelDetalhe: 'Completo'
                            }}
                            data={{
                              clients: clients,
                              rdc: currentRdc,
                              planning: currentPlanejamento,
                              tasks: currentTasks,
                              cobo: currentCobo,
                              matriz: currentMatriz,
                              finances: currentFinancas
                            }}
                            selectedClient={currentClient || undefined}
                            clientColor={currentClient?.['Cor (HEX)']}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {isLibraryEditorOpen && <LibraryEditorModal library={BibliotecaConteudo} onClose={() => setIsLibraryEditorOpen(false)} />}
      {isReorderOpen && <ReorderTabsModal tabOrder={tabOrder} setTabOrder={setTabOrder} onClose={() => setIsReorderOpen(false)} />}

      {
        colorPickerTarget && (
          <ColorPickerModal
            target={colorPickerTarget}
            onClose={() => setColorPickerTarget(null)}
            onConfirm={(color: string) => { handleUpdate(colorPickerTarget.id, colorPickerTarget.tab, colorPickerTarget.field, color); setColorPickerTarget(null); }}
          />
        )
      }
      <PortalPopover
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        triggerRef={isMobile ? mobileExportButtonRef : exportButtonRef}
        className="w-72"
        align="end"
      >
        <div className="bg-app-surface border border-app-border rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto">
          <div className="p-5 border-b border-app-border bg-app-surface-2/50 backdrop-blur-md">
            <span className="text-[11px] font-black uppercase text-app-text-strong tracking-[0.2em]">Exportar Relatório</span>
          </div>
          <div className="p-2 space-y-1">
            <button
              onClick={() => { handleExportExcel(); setIsExportModalOpen(false); }}
              disabled={isExporting}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-emerald-500/5 group transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-file-excel"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-app-text-strong font-bold text-xs uppercase tracking-tight group-hover:text-emerald-500 transition-colors">Excel</h4>
                <p className="text-app-text-muted text-[9px] font-medium uppercase mt-0.5">Relatório Completo</p>
              </div>
            </button>

            <button
              onClick={() => { handleExportPNG(); setIsExportModalOpen(false); }}
              disabled={isExporting}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-blue-500/5 group transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 text-xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-image"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-app-text-strong font-bold text-xs uppercase tracking-tight group-hover:text-blue-500 transition-colors">Imagem (PNG)</h4>
                <p className="text-app-text-muted text-[9px] font-medium uppercase mt-0.5">Captura de Slide</p>
              </div>
            </button>

            <button
              onClick={() => { handleExportPDF(); setIsExportModalOpen(false); }}
              disabled={isExporting}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-rose-500/5 group transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 text-xl group-hover:scale-110 transition-transform">
                <i className="fa-solid fa-file-pdf"></i>
              </div>
              <div className="flex-1">
                <h4 className="text-app-text-strong font-bold text-xs uppercase tracking-tight group-hover:text-rose-500 transition-colors">PDF</h4>
                <p className="text-app-text-muted text-[9px] font-medium uppercase mt-0.5">Relatório Paginado</p>
              </div>
            </button>
          </div>
          {isExporting && (
            <div className="p-3 bg-blue-500/5 text-blue-500 text-[9px] font-black uppercase text-center border-t border-blue-500/10 animate-pulse">
              <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> Exportando...
            </div>
          )}
        </div>
      </PortalPopover>

      {/* Hidden Renderer for PNG Export */}
      {
        isExporting && (
          <SlideRenderer config={getExportConfig()} elementId="export-slide-renderer" />
        )
      }

      {/* Toast notificacoes */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map(t => (
          <NotificationToast
            key={t.id}
            notification={t}
            onClose={(id) => setToasts(prev => prev.filter(n => n.id !== id))}
          />
        ))}
      </div>

      {/* Mobile Floating Action Button */}
      {
        !['DASHBOARD', 'ORGANICKIA', 'VH'].includes(activeTab) && (
          <MobileFloatingAction
            onClick={() => {
              if (activeTab === 'TAREFAS' && activeTaskViewId === 'board') return; // Board handles its own add? Check logic.
              handleAddRow(activeTab);
            }}
            label="Novo"
            // Ensure it respects safe area and doesn't overlap excessively 
            className="bottom-[calc(24px+env(safe-area-inset-bottom))]"
          />
        )
      }
    </div >
  );
}

function getIcon(tab: TipoTabela) {
  const icons: any = { DASHBOARD: 'fa-table-columns', CLIENTES: 'fa-address-card', ORGANICKIA: 'fa-robot', RDC: 'fa-bolt', MATRIZ: 'fa-chess-rook', COBO: 'fa-tower-cell', PLANEJAMENTO: 'fa-calendar-days', FINANCAS: 'fa-coins', TAREFAS: 'fa-list-check', VH: 'fa-hourglass', WHITEBOARD: 'fa-object-group' };
  return icons[tab] || 'fa-folder';
}
