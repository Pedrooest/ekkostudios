import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
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
  Bot, Castle, Antenna, CalendarDays, Coins, ListTodo, Presentation, Hourglass, ArrowLeft, ChevronRight as ChevronRightIcon, WifiOff,
  Contact, Handshake, ClipboardCheck, Move, Maximize2, Banknote, FilePen, Wand2
} from 'lucide-react';
import { AssistantDrawer } from './AssistantDrawer';
import { AssistantAction } from './ai/types';

// Extracted Views — lazy-loaded so each route ships its own chunk
const DashboardView = lazy(() => import('./views/DashboardView').then(m => ({ default: m.DashboardView })));
const ClientesView = lazy(() => import('./views/ClientesView').then(m => ({ default: m.ClientesView })));
const OrganickIAView = lazy(() => import('./views/OrganickIAView').then(m => ({ default: m.OrganickIAView })));
const MatrizEstrategicaView = lazy(() => import('./views/MatrizEstrategicaView').then(m => ({ default: m.MatrizEstrategicaView })));
const ChecklistsTab = lazy(() => import('./views/ChecklistsView'));
const ReunioesView = lazy(() => import('./views/ReunioesView').then(m => ({ default: m.ReunioesView })));
const RelatoriosView = lazy(() => import('./views/RelatoriosView'));
const VhManagementView = lazy(() => import('./views/VhManagementView').then(m => ({ default: m.VhManagementView })));
const TaskFlowView = lazy(() => import('./views/TaskFlowView').then(m => ({ default: m.TaskFlowView })));
const TaskDetailPanel = lazy(() => import('./views/TaskFlowView').then(m => ({ default: m.TaskDetailPanel })));
const FinancasTab = lazy(() => import('./views/FinancasView'));
const PlanejamentoTab = lazy(() => import('./views/PlanejamentoTab'));
const CoboView = lazy(() => import('./views/CoboView').then(m => ({ default: m.CoboView })));
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
  Workspace, MembroWorkspace, ChecklistShoot, Reuniao, Meta, Lembrete, LembreteTipo
} from './types';
import { DatabaseService } from './DatabaseService';
import { WorkspaceSelector } from './WorkspaceSelector';
import { WorkspaceManagerFullscreen } from './components/WorkspaceManagerFullscreen';
import { NewWorkspaceModal } from './components/NewWorkspaceModal';
import { LembreteModal } from './components/LembreteModal';
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
const Whiteboard = lazy(() => import('./components/Whiteboard').then(m => ({ default: m.Whiteboard })));

import { useAuth } from './context/AuthContext';
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




const mergeItems = <T extends { id: string, updated_at?: string, created_at?: string, Atualizado_Em?: string }>(local: T[], remote: T[]): T[] => {
  const merged = [...local];

  remote.forEach(remoteItem => {
    const localIndex = merged.findIndex(i => i.id === remoteItem.id);
    if (localIndex === -1) {
      merged.push(remoteItem);
    } else {
      const localItem = merged[localIndex];
      const remoteDate = new Date(remoteItem.updated_at || remoteItem.Atualizado_Em || remoteItem.created_at || 0).getTime();
      const localDate = new Date(localItem.updated_at || localItem.Atualizado_Em || localItem.created_at || 0).getTime();

      if (remoteDate > localDate) {
        merged[localIndex] = remoteItem;
      }
    }
  });

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
    case 'REUNIOES': return 'reunioes';
    case 'RDC': return 'rdc';
    case 'MATRIZ': return 'matriz_estrategica';
    case 'COBO': return 'cobo';
    case 'PLANEJAMENTO': return 'planejamento';
    case 'FINANCAS': return 'financas';
    case 'TAREFAS': return 'tasks';
    case 'CHECKLISTS': return 'checklists';
    case 'VH': return 'collaborators';
    case 'LEMBRETES': return 'lembretes';
    default: return null;
  }
};



import { PortalPopover } from './components/PortalPopover';

// Fallback shown while a lazy-loaded view is being fetched.
const RouteFallback = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[300px]">
    <Loader2 className="w-8 h-8 animate-spin text-app-text-muted" />
  </div>
);

export default function App() {

  const { currentUser, setCurrentUser, perfilUsuario, setPerfilUsuario, authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<TipoTabela>('DASHBOARD');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [tabOrder, setTabOrder] = useState<TipoTabela[]>(['DASHBOARD', 'CLIENTES', 'REUNIOES', 'ORGANICKIA', 'RDC', 'MATRIZ', 'COBO', 'PLANEJAMENTO', 'FINANCAS', 'VH', 'RELATORIOS', 'WHITEBOARD', 'CHECKLISTS']);

  const [clients, setClients] = useState<Cliente[]>([]);
  const [cobo, setCobo] = useState<ItemCobo[]>([]);
  const [matriz, setMatriz] = useState<ItemMatrizEstrategica[]>([]);
  const [planejamento, setPlanejamento] = useState<ItemPlanejamento[]>([]);
  const [rdc, setRdc] = useState<ItemRdc[]>([]);
  const [financas, setFinancas] = useState<LancamentoFinancas[]>([]);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [checklists, setChecklists] = useState<ChecklistShoot[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
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
  const loadedWorkspaceRef = useRef<string | null>(null);

  const [isGeminiSidebarOpen, setIsGeminiSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const [selectedClientIdIA, setSelectedClientIdIA] = useState<string>('');
  const [iaAudioInsight, setIaAudioInsight] = useState<string>('');
  const [iaPdfInsight, setIaPdfInsight] = useState<string>('');
  const [iaHistory, setIaHistory] = useState<any[]>([]);

  const [notificacoes, setNotificacoes] = useState<NotificacaoApp[]>([]);
  const [toasts, setToasts] = useState<NotificacaoApp[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeNotifTab, setActiveNotifTab] = useState<'notificacoes' | 'lembretes'>('notificacoes');
  const [isLembreteModalOpen, setIsLembreteModalOpen] = useState(false);
  const [editingLembrete, setEditingLembrete] = useState<Lembrete | null>(null);
  
  // Track persistence status: { "tab:id:field": "saving" | "success" | "error" }
  const [savingStatus, setSavingStatus] = useState<Record<string, 'saving' | 'success' | 'error'>>({});

  const clearSavingStatus = useCallback((key: string) => {
    setTimeout(() => {
      setSavingStatus(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 2000);
  }, []);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const mobileExportButtonRef = useRef<HTMLButtonElement>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean, ids: string[], tab: TipoTabela | 'IA_HISTORY' | null }>({ isOpen: false, ids: [], tab: null });
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const [isSettingsFullscreenOpen, setIsSettingsFullscreenOpen] = useState(false);

  const pendingRemindersCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return lembretes.filter(l => !l.concluido && (l.data <= todayStr)).length;
  }, [lembretes]);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'configuracoes' | 'pessoas'>('configuracoes');
  const [isNewWorkspaceModalOpen, setIsNewWorkspaceModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const safeParseArray = (val: any) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
          } catch { return []; }
        }
        return [];
      };

      const parsedClients = (data.clients as Cliente[]).map(c => ({
        ...c,
        links: safeParseArray(c.links),
        log_comunicacao: safeParseArray(c.log_comunicacao),
        assets: safeParseArray(c.assets),
        paleta_cores: safeParseArray(c.paleta_cores),
        fontes: safeParseArray(c.fontes),
        metas: safeParseArray(c.metas),
      }));

      const parsedTasks = (data.tasks as Tarefa[]).map(t => ({
        ...t,
        Checklist: safeParseArray(t.Checklist),
        Anexos: safeParseArray(t.Anexos),
        Comentarios: safeParseArray(t.Comentarios),
        Atividades: safeParseArray(t.Atividades)
      }));

      const parsedChecklists = (data.checklists as ChecklistShoot[]).map(c => ({
        ...c,
        itens_levar: safeParseArray(c.itens_levar),
        itens_trazer: safeParseArray(c.itens_trazer),
        itens_gravar: safeParseArray(c.itens_gravar),
      }));

      setClients(prev => mergeItems(prev, parsedClients));
      setCobo(prev => mergeItems(prev, data.cobo as ItemCobo[]));
      setMatriz(prev => mergeItems(prev, data.matriz as ItemMatrizEstrategica[]));
      setRdc(prev => mergeItems(prev, data.rdc as ItemRdc[]));
      setPlanejamento(prev => mergeItems(prev, data.planning as ItemPlanejamento[]));
      setFinancas(prev => mergeItems(prev, data.financas as LancamentoFinancas[]));
      setTasks(prev => mergeItems(prev, parsedTasks));
      setChecklists(prev => mergeItems(prev, parsedChecklists));
      setCollaborators(prev => mergeItems(prev, data.collaborators as Colaborador[]));
      setReunioes(prev => mergeItems(prev, (data.reunioes || []) as Reuniao[]));
      setLembretes(prev => mergeItems(prev, (data.lembretes || []) as Lembrete[]));
    }
  }, []);

  const generateAutoReminders = useCallback(async () => {
    if (!currentWorkspace || tasks.length === 0) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    const newReminders: Partial<Lembrete>[] = [];

    // 1. Tarefas vencendo amanhã
    tasks.forEach(t => {
      if (t.Data_Entrega === tomorrowStr && t.Status !== 'done') {
        newReminders.push({
          titulo: `Tarefa "${t.Título}" vence amanhã`,
          data: todayStr,
          tipo: 'Tarefa',
          cliente_id: t.Cliente_ID,
          auto_gerado: true,
          auto_id: `task_vence_tomorrow:${t.id}`
        });
      }
    });

    // 2. Posts para hoje
    const postsHoje = planejamento.filter(p => p.Data === todayStr && p["Status do conteúdo"] !== 'Concluído');
    if (postsHoje.length > 0) {
      newReminders.push({
        titulo: `${postsHoje.length} posts para publicar hoje`,
        data: todayStr,
        tipo: 'Post',
        auto_gerado: true,
        auto_id: `posts_hoje:${todayStr}`
      });
    }

    // 3. Contas a vencer em 3 dias
    financas.forEach(f => {
      if (f.Data === in3DaysStr && f.Status === 'Pendente') {
        newReminders.push({
          titulo: `Conta "${f.Lançamento}" vence em 3 dias`,
          data: todayStr,
          tipo: 'Pagamento',
          cliente_id: f.Cliente_ID,
          auto_gerado: true,
          auto_id: `financa_vence_3d:${f.id}`
        });
      }
    });

    // 4. MRR / Contratos em 5 dias (Dia_Pagamento)
    const dayToday = today.getDate();
    financas.filter(f => (f.Tipo === 'Assinatura' || f.Tipo === 'Entrada') && f.Dia_Pagamento).forEach(f => {
        const diaPag = Number(f.Dia_Pagamento);
        const diff = (diaPag - dayToday + 31) % 31;
        if (diff >= 0 && diff <= 5) {
            newReminders.push({
                titulo: `Cobrança de cliente em ${diff} dias: ${f.Lançamento}`,
                data: todayStr,
                tipo: 'Contrato',
                cliente_id: f.Cliente_ID,
                auto_gerado: true,
                auto_id: `mrr_cobranca_5d:${f.id}:${today.getMonth()}`
            });
        }
    });

    // Sync
    for (const rem of newReminders) {
        if (!lembretes.some(l => l.auto_id === rem.auto_id)) {
            const fullRem: Lembrete = {
                id: generateId(),
                workspace_id: currentWorkspace.id,
                titulo: rem.titulo!,
                data: rem.data!,
                hora: '09:00',
                tipo: rem.tipo as any,
                cliente_id: rem.cliente_id,
                descricao: '',
                concluido: false,
                auto_gerado: true,
                auto_id: rem.auto_id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            await DatabaseService.syncItem('lembretes', fullRem, currentWorkspace.id);
            setLembretes(prev => [...prev, fullRem]);
        }
    }
  }, [currentWorkspace, tasks, planejamento, financas, lembretes]);

  useEffect(() => {
    if (currentUser && currentWorkspace && tasks.length > 0) {
      const timer = setTimeout(generateAutoReminders, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, currentWorkspace?.id, tasks.length > 0]);

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
  // Invite handling — watches currentUser from AuthContext.
  // Auth state itself is owned by AuthProvider; this effect only deals with
  // the workspace-invite flow that lives at App level (uses setToasts).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');

    // Case A: invite in URL, but user not logged in yet -> stash for post-login.
    if (inviteToken && !currentUser) {
      sessionStorage.setItem('pending_invite', inviteToken);
      return;
    }

    const acceptAndReload = (token: string, fromPending: boolean) => {
      DatabaseService.acceptInvite(token)
        .then(() => {
          if (fromPending) {
            sessionStorage.removeItem('pending_invite');
          } else {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          setToasts(prev => [...prev, { id: generateId(), tipo: 'success', titulo: 'Sucesso', mensagem: 'Você entrou no workspace com sucesso!', timestamp: new Date().toISOString(), lida: false }]);
          window.location.reload();
        })
        .catch((e: any) => {
          let msg = e.message;
          if (msg.includes('policy')) msg = 'Você não tem permissão para entrar neste workspace ou o convite expirou.';
          setToasts(prev => [...prev, { id: generateId(), tipo: 'error', titulo: 'Erro no Convite', mensagem: msg, timestamp: new Date().toISOString(), lida: false }]);
          if (fromPending) sessionStorage.removeItem('pending_invite');
        });
    };

    // Case B: invite in URL and user is logged in -> accept now.
    if (inviteToken && currentUser) {
      acceptAndReload(inviteToken, false);
      return;
    }

    // Case C: no URL token, but a pending invite was stashed before login.
    const pending = sessionStorage.getItem('pending_invite');
    if (pending && currentUser) {
      acceptAndReload(pending, true);
    }
  }, [currentUser]);

  // Clear workspace state when the user signs out.
  useEffect(() => {
    if (!currentUser) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      refreshWorkspaces();
    }
  }, [currentUser, refreshWorkspaces]);

  useEffect(() => {
    if (currentWorkspace?.id) {
      if (loadedWorkspaceRef.current === currentWorkspace.id) return;
      loadedWorkspaceRef.current = currentWorkspace.id;
      loadWorkspaceData(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, loadWorkspaceData]);

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
        const defaultOrder: TipoTabela[] = ['DASHBOARD', 'CLIENTES', 'ORGANICKIA', 'RDC', 'MATRIZ', 'COBO', 'PLANEJAMENTO', 'FINANCAS', 'TAREFAS', 'CHECKLISTS', 'VH', 'WHITEBOARD'];
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

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      try {
          const queueStr = localStorage.getItem('ekko_offline_queue');
          if (!queueStr) return;
          const queue = JSON.parse(queueStr);
          if (queue.length > 0) {
             addNotification('info', 'Sincronizando', `Conexão restabelecida. Sincronizando ${queue.length} alterações...`);
             for (const item of queue) {
                 if (item.action === 'UPDATE' || item.action === 'CREATE') {
                     await DatabaseService.syncItem(item.tableName, item.data, item.workspaceId);
                 } else if (item.action === 'DELETE') {
                     await DatabaseService.deleteItem(item.tableName, item.id);
                 } else if (item.action === 'ARCHIVE') {
                     await DatabaseService.updateItem(item.tableName, item.id, item.data);
                 }
             }
             localStorage.removeItem('ekko_offline_queue');
             addNotification('success', 'Sincronizado', 'Todas as alterações pendentes foram salvas no Supabase!');
          }
      } catch (e) {
          console.error("Sync error", e);
      }
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);


  const handleUpdate = useCallback(async (id: string, tab: TipoTabela, field: string, value: any, skipLog: boolean = false) => {
    console.log(`[EKKO-SYNC] handleUpdate | Tab: ${tab} | ID: ${id} | Field: ${field}`, value);

    // Permission Check
    const member = currentWorkspace?.membros_workspace?.find((m: any) => m.id_usuario === currentUser?.id);
    if (member && member.papel === 'viewer') {
      alert('Você tem permissão apenas de visualização.');
      return;
    }

    const key = `${tab}:${id}:${field}`;
    setSavingStatus(prev => ({ ...prev, [key]: 'saving' }));

    // Identificar a lista correta
    let currentList: any[] = [];
    if (tab === 'CLIENTES') currentList = clients;
    else if (tab === 'RDC') currentList = rdc;
    else if (tab === 'MATRIZ') currentList = matriz;
    else if (tab === 'COBO') currentList = cobo;
    else if (tab === 'PLANEJAMENTO') currentList = planejamento;
    else if (tab === 'FINANCAS') currentList = financas;
    else if (tab === 'TAREFAS') currentList = tasks;
    else if (tab === 'CHECKLISTS') currentList = checklists;
    else if (tab === 'REUNIOES') currentList = reunioes;
    else if (tab === 'LEMBRETES') currentList = lembretes;
    else if (tab === 'IA_HISTORY') currentList = iaHistory;
    else if (tab === 'VH') currentList = collaborators;

    const originalItem = currentList.find(i => i.id === id);
    if (!originalItem) {
      console.warn(`[EKKO-SYNC] UPDATE_FAILED | Could not find original item for tab: ${tab} with ID: ${id}. Ensure currentList is mapped correctly.`);
      setSavingStatus(prev => ({ ...prev, [key]: 'error' }));
      clearSavingStatus(key);
      return;
    }

    let updated = { ...originalItem };
    if (field === '__MULTIPLE__' || field === null) {
      updated = { ...updated, ...value };
    } else {
      updated[field] = value;
    }
    // Force updated_at to be the very last thing applied to ensure it's always current
    updated.updated_at = new Date().toISOString();

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
    const revertFn = (list: any[]) => list.map(i => i.id === id ? originalItem : i);

    if (tab === 'CLIENTES') setClients(updateFn);
    else if (tab === 'RDC') setRdc(updateFn);
    else if (tab === 'PLANEJAMENTO') setPlanejamento(updateFn);
    else if (tab === 'FINANCAS') setFinancas(updateFn);
    else if (tab === 'TAREFAS') setTasks(updateFn);
    else if (tab === 'CHECKLISTS') setChecklists(updateFn as any);
    else if (tab === 'COBO') setCobo(updateFn);
    else if (tab === 'MATRIZ') setMatriz(updateFn);
    else if (tab === 'REUNIOES') setReunioes(updateFn);
    else if (tab === 'IA_HISTORY') setIaHistory(updateFn);

    // Sync to Backend
    if (currentWorkspace) {
      const tableName = getTableName(tab);
      if (tableName) {
        try {
          if (!navigator.onLine) {
             const queue = JSON.parse(localStorage.getItem('ekko_offline_queue') || '[]');
             queue.push({ action: 'UPDATE', tableName, data: updated, workspaceId: currentWorkspace.id });
             localStorage.setItem('ekko_offline_queue', JSON.stringify(queue));
             setSavingStatus(prev => ({ ...prev, [key]: 'success' }));
             clearSavingStatus(key);
             return;
          }

          console.log(`[EKKO-SYNC] UPDATE_TRIGGERED | Table: ${tableName} | ID: ${id}`);
          const error = await DatabaseService.syncItem(tableName, updated, currentWorkspace.id);

        if (error) {
          console.error(`[EKKO-SYNC] UPDATE_FAILURE | Table: ${tableName} | ID: ${id}`, error);
          setSavingStatus(prev => ({ ...prev, [key]: 'error' }));
          addNotification('error', 'Falha ao salvar', `Erro: ${error.message || JSON.stringify(error) || 'Não foi possível sincronizar as alterações.'}`);
          // Reverte o snapshot anterior caso o backend falhe
          if (tab === 'CLIENTES') setClients(revertFn);
          else if (tab === 'RDC') setRdc(revertFn);
          else if (tab === 'PLANEJAMENTO') setPlanejamento(revertFn);
          else if (tab === 'FINANCAS') setFinancas(revertFn);
          else if (tab === 'TAREFAS') setTasks(revertFn);
          else if (tab === 'CHECKLISTS') setChecklists(revertFn as any);
          else if (tab === 'COBO') setCobo(revertFn);
          else if (tab === 'MATRIZ') setMatriz(revertFn);
          else if (tab === 'IA_HISTORY') setIaHistory(revertFn);
        } else {
          console.log(`[EKKO-SYNC] UPDATE_SUCCESS | Table: ${tableName} | ID: ${id}`);
          setSavingStatus(prev => ({ ...prev, [key]: 'success' }));
          clearSavingStatus(key);
        }
      } catch (error: any) {
        console.error(`[EKKO-SYNC] CRITICAL_ERROR | Table: ${tableName} | ID: ${id}`, error);
        addNotification('error', 'Falha na Sincronização', error.message || 'Erro inesperado ao salvar.');
        
        // REVERT state
        const revertFn = (prev: any[]) => prev.map((i: any) => i.id === id ? originalItem : i);
        if (tab === 'CLIENTES') setClients(revertFn);
        else if (tab === 'FINANCAS') setFinancas(revertFn);
        else if (tab === 'TAREFAS') setTasks(revertFn);
        else if (tab === 'PLANEJAMENTO') setPlanejamento(revertFn);
        else if (tab === 'RDC') setRdc(revertFn);
        else if (tab === 'MATRIZ') setMatriz(revertFn);
        else if (tab === 'COBO') setCobo(revertFn);
        else if (tab === 'REUNIOES') setReunioes(revertFn);
        else if (tab === 'VH') setCollaborators(revertFn);
        else if (tab === 'CHECKLISTS') setChecklists(revertFn as any);
        else if (tab === 'REUNIOES') setReunioes(revertFn);
        else if (tab === 'LEMBRETES') setLembretes(revertFn);
        
        clearSavingStatus(key);
      }
    }
  }
}, [currentWorkspace, currentUser, addNotification, clients, rdc, matriz, cobo, planejamento, financas, tasks, iaHistory, clearSavingStatus]);

  const handleAddRow = useCallback(async (tab: TipoTabela, initial: Partial<any> = {}): Promise<string> => {
    console.log(`[EKKO-DIAGNOSTIC] handleAddRow started | Tab: ${tab} | WorkspaceID: ${currentWorkspace?.id} | initialData:`, initial);
    
    // Permission Check
    const member = currentWorkspace?.membros_workspace?.find((m: any) => m.id_usuario === currentUser?.id);
    if (member && member.papel === 'viewer') {
      alert('Você tem permissão apenas de visualização.');
      return '';
    }
    if (!currentWorkspace) {
      alert("Nenhum workspace selecionado. Selecione um Workspace primeiro.");
      addNotification('error', 'Sem Workspace', 'Nenhum workspace selecionado. Selecione um Workspace primeiro.');
      return '';
    }
    // Fix: Prevent creation of items with invalid Foreign Key if no clients exist
    if (clients.length === 0 && !['CLIENTES', 'DASHBOARD', 'VH', 'ORGANICKIA'].includes(tab)) {
      alert('Para criar itens nesta tabela, cadastre pelo menos um Cliente primeiro.');
      return;
    }
    const id = generateId();
    const now = new Date().toISOString();
    const defaultProps = { id, updated_at: now, created_at: now };
    const defaultClientId = selectedClientIds.length === 1 ? selectedClientIds[0] : (clients[0]?.id || null);
    let newItem: any = null;

    if (tab === 'CLIENTES') newItem = { ...defaultProps, Nome: 'Novo Cliente', Nicho: '', Responsável: '', WhatsApp: '', Instagram: '', Objetivo: '', Observações: '', "Cor (HEX)": '#3B82F6', Status: 'Ativo', links: [], log_comunicacao: [], assets: [], paleta_cores: [], fontes: [], tom_de_voz: '', ...initial };
    else if (tab === 'FINANCAS') newItem = { ...defaultProps, Lançamento: `FIN-${generateId().toUpperCase().slice(0, 4)}`, Data: new Date().toISOString().split('T')[0], Cliente_ID: defaultClientId, Tipo: 'Entrada', Categoria: 'Serviço', Descrição: 'Novo Lançamento', Valor: 0, Recorrência: 'Única', Data_Início: new Date().toISOString().split('T')[0], Data_Fim: '', Dia_Pagamento: 1, Observações: '', ...initial };
    else if (tab === 'PLANEJAMENTO') {
      const date = initial.Data || new Date().toISOString().split('T')[0];
      newItem = { ...defaultProps, Cliente_ID: initial.Cliente_ID || defaultClientId, Data: date, Hora: initial.Hora || '09:00', Conteúdo: initial.Conteúdo || '', Função: initial.Função || 'Hub', Rede_Social: initial.Rede_Social || 'Instagram', "Tipo de conteúdo": initial["Tipo de conteúdo"] || '', Intenção: initial.Intenção || 'Relacionamento', Canal: initial.Canal || '', Formato: initial.Formato || '', Zona: initial.Zona || 'Morna', "Quem fala": initial["Quem fala"] || '', "Status do conteúdo": 'Pendente', ...initial };
    } else if (tab === 'TAREFAS') {
      const resp = currentUser?.email || '';
      const activity: AtividadeTarefa = {
        id: generateId(),
        tipo: 'create',
        usuario: resp || 'Agência Ekko',
        mensagem: 'criou a tarefa',
        timestamp: new Date().toISOString()
      };
      newItem = { ...defaultProps, Task_ID: `Tarefa-${generateId().toUpperCase().slice(0, 4)}`, Cliente_ID: initial.Cliente_ID || defaultClientId, Título: initial.Título || 'Nova Tarefa', Área: initial.Área || 'Conteúdo', Status: initial.Status || 'todo', Prioridade: initial.Prioridade || 'Média', Responsável: resp, Data_Entrega: initial.Data_Entrega || new Date().toISOString().split('T')[0], Checklist: [], Anexos: [], Comentarios: [], Atividades: [activity], ...initial };
    } else if (tab === 'COBO') newItem = { ...defaultProps, Cliente_ID: defaultClientId, Canal: 'Instagram', Frequência: '', Público: '', Voz: '', Zona: '', Intenção: '', Formato: '', ...initial };
    else if (tab === 'MATRIZ') newItem = { ...defaultProps, Cliente_ID: defaultClientId, Rede_Social: 'Instagram', Função: 'Hub', "Quem fala": '', "Papel estratégico": '', "Tipo de conteúdo": '', "Resultado esperado": '', ...initial };
    else if (tab === 'RDC') newItem = { ...defaultProps, Cliente_ID: defaultClientId, "Ideia de Conteúdo": '', Rede_Social: 'Instagram', "Tipo de conteúdo": '', "Resolução (1–5)": 1, "Demanda (1–5)": 1, "Competição (1–5)": 1, "Score (R×D×C)": 1, Decisão: 'Preencha R/D/C', ...initial };
    else if (tab === 'CHECKLISTS') newItem = { ...defaultProps, titulo: 'Novo Checklist', data: new Date().toISOString().split('T')[0], cliente_id: defaultClientId, local: '', observacoes: '', status: 'Pendente', hora: '10:00', itens_levar: [], itens_trazer: [], itens_gravar: [], ...initial };
    else if (tab === 'REUNIOES') newItem = { ...defaultProps, cliente_id: initial.cliente_id || defaultClientId, titulo: initial.titulo || 'Nova Reunião', data: initial.data || new Date().toISOString().split('T')[0], hora: initial.hora || '10:00', formato: 'Online', participantes: '', pauta: '', decisoes: '', proximos_passos: [], status: 'Agendada', ...initial };
    else if (tab === 'LEMBRETES') newItem = { ...defaultProps, titulo: 'Novo Lembrete', data: new Date().toISOString().split('T')[0], hora: '09:00', tipo: 'Tarefa', cliente_id: initial.cliente_id || null, descricao: '', concluido: false, auto_gerado: false, ...initial };

    if (newItem) {
      console.log(`[EKKO-SYNC] CREATE_TRIGGERED | Table: ${tab} | ID: ${id}`, newItem);

      // Optimistic update
      if (tab === 'CLIENTES') setClients(prev => [...prev, newItem]);
      else if (tab === 'FINANCAS') setFinancas(prev => [...prev, newItem]);
      else if (tab === 'PLANEJAMENTO') setPlanejamento(prev => [...prev, newItem]);
      else if (tab === 'TAREFAS') setTasks(prev => [...prev, newItem]);
      else if (tab === 'CHECKLISTS') setChecklists(prev => [...prev, newItem]);
      else if (tab === 'COBO') setCobo(prev => [...prev, newItem]);
      else if (tab === 'MATRIZ') setMatriz(prev => [...prev, newItem]);
      else if (tab === 'RDC') setRdc(prev => [...prev, newItem]);
      else if (tab === 'REUNIOES') setReunioes(prev => [...prev, newItem]);
      else if (tab === 'LEMBRETES') setLembretes(prev => [...prev, newItem]);

      const tableName = getTableName(tab);
      if (tableName && currentWorkspace) {
        if (!navigator.onLine) {
           const queue = JSON.parse(localStorage.getItem('ekko_offline_queue') || '[]');
           queue.push({ action: 'CREATE', tableName, data: newItem, workspaceId: currentWorkspace.id });
           localStorage.setItem('ekko_offline_queue', JSON.stringify(queue));
           
           if (tab === 'CLIENTES') addNotification('info', 'Salvo Offline', 'Cliente adicionado localmente.');
           else if (tab === 'TAREFAS') addNotification('info', 'Salvo Offline', 'A tarefa foi criada localmente.');
           else addNotification('info', 'Salvo Offline', `Novo item salvo offline.`);
           return id;
        }

        try {
          const error = await DatabaseService.syncItem(tableName, newItem, currentWorkspace.id);
          if (error) throw error;
          
          if (tab === 'CLIENTES') addNotification('success', 'Cliente criado com sucesso', 'Um novo perfil de cliente foi adicionado.');
          else if (tab === 'TAREFAS') addNotification('success', 'Nova tarefa adicionada', 'A tarefa foi criada no fluxo de trabalho.');
          else addNotification('success', 'Item Criado', `Novo item adicionado em ${TABLE_LABELS[tab]}.`);
        } catch (error: any) {
          console.error(`[EKKO-SYNC] CREATE_FAILURE | Table: ${tableName} | ID: ${id} | Error:`, error);
          addNotification('error', 'Erro ao sincronizar', `O item foi criado localmente mas não pôde ser salvo no servidor: ${error.message || 'Erro de constraint ou permissão'}`);
          // Rollback local state
          const filterFn = (prev: any[]) => prev.filter((i: any) => i.id !== id);
          if (tab === 'CLIENTES') setClients(filterFn);
          else if (tab === 'FINANCAS') setFinancas(filterFn);
          else if (tab === 'PLANEJAMENTO') setPlanejamento(filterFn);
          else if (tab === 'TAREFAS') setTasks(filterFn);
          else if (tab === 'CHECKLISTS') setChecklists(filterFn as any);
          else if (tab === 'COBO') setCobo(filterFn);
          else if (tab === 'MATRIZ') setMatriz(filterFn);
          else if (tab === 'RDC') setRdc(filterFn);

          addNotification('error', 'Erro ao salvar', `Erro: ${error.message || JSON.stringify(error) || 'O registro não pôde ser criado no servidor.'}`);
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
    setDeleteModalState({ isOpen: true, ids, tab });
    setDeleteConfirmationText("");
  }, [currentWorkspace, currentUser]);

  const executeDelete = useCallback(() => {
    const { ids, tab } = deleteModalState;
    if (!tab || ids.length === 0) return;
    if (deleteConfirmationText.toUpperCase() !== 'EXCLUIR') return;

    if (tab === 'CLIENTES') setClients(prev => prev.filter(c => !ids.includes(c.id)));
    if (tab === 'RDC') setRdc(prev => prev.filter(r => !ids.includes(r.id)));
    if (tab === 'MATRIZ') setMatriz(prev => prev.filter(m => !ids.includes(m.id)));
    if (tab === 'COBO') setCobo(prev => prev.filter(c => !ids.includes(c.id)));
    if (tab === 'PLANEJAMENTO') setPlanejamento(prev => prev.filter(p => !ids.includes(p.id)));
    if (tab === 'FINANCAS') setFinancas(prev => prev.filter(f => !ids.includes(f.id)));
    if (tab === 'TAREFAS') setTasks(prev => prev.filter(t => !ids.includes(t.id)));
    if (tab === 'CHECKLISTS') setChecklists(prev => prev.filter(c => !ids.includes(c.id)));
    if (tab === 'REUNIOES') setReunioes(prev => prev.filter(r => !ids.includes(r.id)));
    if (tab === 'LEMBRETES') setLembretes(prev => prev.filter(l => !ids.includes(l.id)));
    if (tab === 'IA_HISTORY') setIaHistory(prev => prev.filter(h => !ids.includes(h.id)));
    setSelection([]);

    if (currentWorkspace) {
      const tableName = getTableName(tab as string);
      if (tableName) {
        if (!navigator.onLine) {
           const queue = JSON.parse(localStorage.getItem('ekko_offline_queue') || '[]');
           ids.forEach(id => queue.push({ action: 'DELETE', tableName, id }));
           localStorage.setItem('ekko_offline_queue', JSON.stringify(queue));
           addNotification('info', 'Offline', `${ids.length} item(s) deletado(s) localmente.`);
        } else {
           ids.forEach(id => DatabaseService.deleteItem(tableName, id));
           addNotification('error', 'Item removido', `${ids.length} item(s) excluído(s).`);
        }
      }
    }
    
    setDeleteModalState({ isOpen: false, ids: [], tab: null });
  }, [currentWorkspace, deleteModalState, deleteConfirmationText, addNotification]);

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
    if (tab === 'CHECKLISTS') setChecklists(updateFn as any);
    if (tab === 'IA_HISTORY') setIaHistory(updateFn);
    setSelection([]);

    if (currentWorkspace) {
      const tableName = getTableName(tab as string);
      if (tableName) {
        if (!navigator.onLine) {
           const queue = JSON.parse(localStorage.getItem('ekko_offline_queue') || '[]');
           ids.forEach(id => queue.push({ action: 'ARCHIVE', tableName, id, data: { __archived: archive } }));
           localStorage.setItem('ekko_offline_queue', JSON.stringify(queue));
        } else {
           ids.forEach(id => DatabaseService.updateItem(tableName, id, { __archived: archive }));
        }
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
  const currentChecklists = useMemo(() => filterArchived(checklists), [checklists, showArchived]);
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
        created_at: today,
        updated_at: today,
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

  const handleSaveLembrete = async (data: Partial<Lembrete>) => {
    if (!currentWorkspace) return;
    
    if (data.id) {
       // Update
       await handleUpdate(data.id, 'LEMBRETES', '__MULTIPLE__', data);
    } else {
       // Create
       const id = await handleAddRow('LEMBRETES', data);
       console.log("Lembrete criado com ID:", id);
    }
    setIsLembreteModalOpen(false);
    setEditingLembrete(null);
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    const now = new Date().toISOString();
    const fullUpdates = { ...updates, updated_at: now };
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...fullUpdates } : t));
    await DatabaseService.updateItem('tasks', taskId, fullUpdates);
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
      className="flex h-[100dvh] bg-app-bg text-app-text font-sans overflow-hidden transition-colors duration-300 relative overflow-x-hidden"
    >
      {isOffline && (
        <div className="absolute top-0 left-0 w-full z-[99999] bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 text-center shadow-md animate-fade-down flex items-center justify-center gap-2">
          <WifiOff size={14} /> Você está offline — alterações serão sincronizadas quando a conexão voltar
        </div>
      )}

      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-zinc-950/50 z-[2000] lg:hidden backdrop-blur-sm animate-fade" onClick={() => setSidebarCollapsed(true)}></div>
      )}

      <aside className={`transition-all duration-300 flex flex-col dark:bg-zinc-900 bg-white border-r border-zinc-200 dark:border-zinc-800 shrink-0 z-[2100] fixed inset-y-0 left-0 lg:relative ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-[85vw] sm:w-64 shadow-2xl lg:shadow-none'}`}>
        <div className={`h-20 flex items-center border-b border-zinc-100 dark:border-zinc-800 justify-center overflow-hidden ${sidebarCollapsed ? 'px-0' : 'px-5'}`}>
          <Logo collapsed={sidebarCollapsed} theme={theme} />
        </div>
        
        <nav className="flex-1 py-4 px-2 space-y-6 overflow-y-auto custom-scrollbar flex flex-col">
          {/* GRUPOS DE ABAS */}
          {[
            { label: 'Visão Geral', tabs: ['DASHBOARD', 'CLIENTES', 'REUNIOES', 'ORGANICKIA'] },
            { label: 'Estratégia', tabs: ['RDC', 'MATRIZ', 'COBO'] },
            { label: 'Execução', tabs: ['PLANEJAMENTO', 'TAREFAS', 'CHECKLISTS'] },
            { label: 'Gestão/Extras', tabs: ['FINANCAS', 'VH', 'RELATORIOS', 'WHITEBOARD'] }
          ].map((group, gIdx) => (
            <div key={group.label} className="space-y-1">
              {!sidebarCollapsed && (
                <p className="px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 dark:text-zinc-400 mb-2">
                  {group.label}
                </p>
              )}
              {group.tabs.filter(t => tabOrder.includes(t as TipoTabela)).map(tab => {
                const TabIcon = getIcon(tab as TipoTabela);
                return (
                  <button
                    key={`nav-tab-${tab}`}
                    onClick={() => { playUISound('tap'); setActiveTab(tab as TipoTabela); if (window.innerWidth < 1024) setSidebarCollapsed(true); }}
                    title={sidebarCollapsed ? TABLE_LABELS[tab as TipoTabela] : undefined}
                    className={`w-full flex items-center transition-all group rounded-lg h-9 relative
                      ${activeTab === tab ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60'}
                      ${sidebarCollapsed ? 'justify-center px-0' : 'px-3 gap-3'}`}
                  >
                    {activeTab === tab && (
                      <span aria-hidden className="absolute left-0 inset-y-1.5 w-1 rounded-r-full bg-purple-600 dark:bg-purple-400" />
                    )}
                    <TabIcon size={18} className="shrink-0 transition-transform group-hover:scale-110" />
                    {!sidebarCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest truncate min-w-0 flex-1 text-left">{TABLE_LABELS[tab as TipoTabela]}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1 bg-white dark:bg-zinc-900 flex flex-col">
          <button onClick={() => { playUISound('tap'); setIsLibraryEditorOpen(true); }} title={sidebarCollapsed ? "Configurações Globais" : undefined} className={`w-full flex items-center transition-all group rounded-lg h-9 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 ${sidebarCollapsed ? 'justify-center px-0' : 'px-3 gap-3'}`}>
            <Layers size={18} className="shrink-0 transition-transform group-hover:scale-110" />
            {!sidebarCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest truncate min-w-0 flex-1 text-left">Tipos</span>}
          </button>
          <button onClick={() => { playUISound('tap'); setIsReorderOpen(true); }} title={sidebarCollapsed ? "Ordenar Abas" : undefined} className={`w-full flex items-center transition-all group rounded-lg h-9 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 ${sidebarCollapsed ? 'justify-center px-0' : 'px-3 gap-3'}`}>
            <Move size={18} className="shrink-0 transition-transform group-hover:scale-110" />
            {!sidebarCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest truncate min-w-0 flex-1 text-left">Ordem</span>}
          </button>
          <button onClick={() => { playUISound('tap'); setSidebarCollapsed(!sidebarCollapsed); }} title={sidebarCollapsed ? "Expandir Sidebar" : "Recolher Sidebar"} className={`w-full flex items-center transition-all group rounded-lg h-9 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 ${sidebarCollapsed ? 'justify-center px-0' : 'px-3 gap-3'}`}>
            {sidebarCollapsed ? <Maximize2 size={18} className="shrink-0 transition-transform group-hover:scale-110" /> : <ArrowLeft size={18} className="shrink-0 transition-transform group-hover:scale-110" />}
            {!sidebarCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest truncate min-w-0 flex-1 text-left">{sidebarCollapsed ? 'Expandir' : 'Recolher'}</span>}
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
          <div className="flex items-center gap-3">
            {/* System controls cluster — single pill grouping low-frequency utilities */}
            <div className="flex items-center gap-0.5 p-1 rounded-full bg-zinc-100/80 dark:bg-white/[0.04] border border-zinc-200/60 dark:border-white/[0.06]">
            <button
              onClick={async () => {
                if (!currentWorkspace) return;
                playUISound('tap');
                addNotification('info', 'Sincronizando...', 'Buscando dados atualizados do servidor.');
                try {
                  await loadWorkspaceData(currentWorkspace.id);
                  addNotification('success', 'Sincronizado', 'Dados atualizados com sucesso.');
                } catch (e) {
                  addNotification('error', 'Erro na Sincronização', 'Não foi possível atualizar os dados.');
                }
              }}
              title="Forçar Sincronização"
              className="ios-btn p-2 rounded-full text-gray-600 hover:bg-white hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors active:scale-90"
            >
              <Database size={16} />
            </button>

            <button onClick={() => { playUISound('tap'); toggleTheme(); }} title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'} className="ios-btn p-2 rounded-full text-gray-600 hover:bg-white hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors active:scale-90">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={() => {
                  if (!isNotificationOpen) playUISound('open');
                  setIsNotificationOpen(!isNotificationOpen);
                }}
                title="Notificações"
                className="ios-btn p-2 rounded-full text-gray-600 hover:bg-white hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors active:scale-90 relative"
              >
                <Bell size={16} />
                {(notificacoes.some(n => !n.lida) || pendingRemindersCount > 0) && (
                  <span className={`absolute top-1 right-1 ${pendingRemindersCount > 0 ? 'min-w-[14px] h-[14px] px-0.5 bg-red-500' : 'w-2 h-2 bg-blue-500'} rounded-full text-[8px] font-black text-white flex items-center justify-center`}>
                    {pendingRemindersCount > 0 ? pendingRemindersCount : ''}
                  </span>
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
                  {/* TABS HEADER */}
                  <div className="p-2 border-b border-app-border flex bg-app-surface-2/50 backdrop-blur-md">
                    <button 
                      onClick={() => { playUISound('tap'); setActiveNotifTab('notificacoes'); }}
                      className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeNotifTab === 'notificacoes' ? 'bg-white dark:bg-zinc-800 text-app-text-strong shadow-sm' : 'text-app-text-muted hover:text-app-text-strong'}`}
                    >
                      Notificações
                    </button>
                    <button 
                      onClick={() => { playUISound('tap'); setActiveNotifTab('lembretes'); }}
                      className={`flex-1 py-5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${activeNotifTab === 'lembretes' ? 'bg-white dark:bg-zinc-800 text-app-text-strong shadow-sm' : 'text-app-text-muted hover:text-app-text-strong'}`}
                    >
                      Lembretes
                      {pendingRemindersCount > 0 && <span className="w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center text-white">{pendingRemindersCount}</span>}
                    </button>
                  </div>

                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-app-surface">
                    {activeNotifTab === 'notificacoes' ? (
                      <div className="divide-y divide-app-border/50">
                        <div className="p-3 flex justify-between items-center bg-app-bg/30 sticky top-0 z-10 backdrop-blur-md">
                           <span className="text-[8px] font-bold uppercase text-app-text-muted tracking-widest">Recentes</span>
                           {notificacoes.length > 0 && (
                             <button
                               onClick={() => { playUISound('tap'); setNotificacoes([]); }}
                               className="text-[8px] font-black uppercase text-rose-500 hover:text-rose-600 transition-colors flex items-center gap-1"
                               title="Excluir todas as notificações"
                             >
                               <Trash2 size={10} /> Limpar tudo
                             </button>
                           )}
                        </div>
                        {notificacoes.length === 0 ? (
                          <div className="p-12 text-center opacity-20">
                            <BellOff size={40} className="mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Nada por enquanto</p>
                          </div>
                        ) : (
                          notificacoes.map(n => (
                            <div key={n.id} className={`p-4 hover:bg-app-bg transition-all cursor-pointer group relative ${!n.lida ? 'bg-blue-500/5' : ''}`}>
                              <button
                                onClick={(e) => { e.stopPropagation(); playUISound('tap'); setNotificacoes(prev => prev.filter(x => x.id !== n.id)); }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-app-surface text-app-text-muted hover:bg-rose-500/10 hover:text-rose-500 z-10 shadow-sm"
                                title="Excluir notificação"
                              >
                                <X size={12} />
                              </button>
                              <div className="flex gap-3">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${n.tipo === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                  n.tipo === 'warning' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                  }`}>
                                  {n.tipo === 'success' ? <CheckCircle2 size={14} /> : n.tipo === 'warning' ? <AlertTriangle size={14} /> : <Info size={14} />}
                                </div>
                                <div className="flex-1 min-w-0 pr-7">
                                  <div className="flex justify-between items-baseline mb-0.5 gap-2">
                                    <p className="text-[10px] font-black text-app-text-strong uppercase truncate">{n.titulo}</p>
                                    <span className="text-[7px] font-bold text-app-text-muted uppercase shrink-0 group-hover:opacity-0 transition-opacity">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                  <p className="text-[9px] font-medium text-app-text-muted leading-snug uppercase line-clamp-2">{n.mensagem}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-app-border/50">
                        <div className="p-3 flex justify-between items-center bg-app-bg/30 sticky top-0 z-10 backdrop-blur-md">
                           <span className="text-[8px] font-bold uppercase text-app-text-muted tracking-widest">Meus Lembretes</span>
                           <button onClick={() => { playUISound('tap'); setIsLembreteModalOpen(true); setEditingLembrete(null); }} className="text-[8px] font-black uppercase text-app-accent-blue bg-app-accent-blue/10 px-2 py-1 rounded-md hover:bg-app-accent-blue/20 transition-all">+ Criar</button>
                        </div>
                        
                        {lembretes.length === 0 ? (
                           <div className="p-12 text-center opacity-20">
                              <CalendarDays size={40} className="mx-auto mb-4" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Sem lembretes</p>
                           </div>
                        ) : (
                          [...lembretes]
                            .sort((a,b) => b.data.localeCompare(a.data))
                            .map(l => {
                               const isToday = l.data === new Date().toISOString().split('T')[0];
                               const isOverdue = l.data < new Date().toISOString().split('T')[0] && !l.concluido;
                               
                               return (
                                 <div key={l.id} className={`p-4 transition-all group relative ${l.concluido ? 'opacity-50' : ''} ${isToday && !l.concluido ? 'border-l-4 border-blue-500 bg-blue-500/5' : ''} ${isOverdue ? 'border-l-4 border-red-500 bg-red-500/5' : ''}`}>
                                    <div className="flex gap-3">
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); playUISound('tap'); handleUpdate(l.id, 'LEMBRETES', 'concluido', !l.concluido); }}
                                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${l.concluido ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-app-border hover:border-app-text-strong'}`}
                                       >
                                          {l.concluido && <CheckIcon size={12} />}
                                       </button>
                                       
                                       <div className="flex-1 min-w-0 cursor-pointer" onClick={() => { setEditingLembrete(l); setIsLembreteModalOpen(true); }}>
                                          <div className="flex justify-between items-start mb-0.5">
                                             <p className={`text-[10px] font-black uppercase tracking-tight ${l.concluido ? 'line-through' : 'text-app-text-strong'} ${isOverdue ? 'text-red-500' : ''}`}>
                                                {l.titulo}
                                             </p>
                                             <div className="flex items-center gap-2">
                                                {l.auto_gerado && <span className="text-[6px] font-black bg-zinc-100 dark:bg-white/5 text-app-text-muted px-1 py-0.5 rounded uppercase">AUTO</span>}
                                                <button onClick={(e) => { e.stopPropagation(); playUISound('tap'); performDelete([l.id], 'LEMBRETES'); }} className="opacity-0 group-hover:opacity-100 text-app-text-muted hover:text-red-500 transition-all">
                                                   <Trash2 size={10} />
                                                </button>
                                             </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-2 mt-1">
                                             <span className="text-[7px] font-black uppercase text-app-text-muted border border-app-border/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                {l.tipo === 'Post' ? <Share2 size={6} /> : l.tipo === 'Reunião' ? <Handshake size={6} /> : l.tipo === 'Pagamento' ? <Banknote size={6} /> : l.tipo === 'Tarefa' ? <ListTodo size={6} /> : <FilePen size={6} />}
                                                {l.tipo}
                                             </span>
                                             <span className={`text-[7px] font-bold uppercase ${isOverdue ? 'text-red-500' : 'text-app-text-muted'}`}>
                                                {new Date(l.data + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})} {l.hora && `às ${l.hora}`}
                                             </span>
                                             {l.cliente_id && (
                                               <span className="text-[7px] font-black text-app-accent-blue bg-app-accent-blue/10 px-1 rounded uppercase truncate max-w-[80px]">
                                                  {clients.find(c => c.id === l.cliente_id)?.Nome || 'Cliente'}
                                               </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                               );
                            })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </PortalPopover>
            </div>
            </div>

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
        {activeTab !== 'WHITEBOARD' && activeTab !== 'PLANEJAMENTO' && activeTab !== 'CHECKLISTS' && (
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
                <Download size={14} /> <span className="hidden sm:inline">Exportar</span>
              </Button>

              {/* Desktop Assistant (Hidden here as it's in the top bar for MD+) */}
              <Button variant="secondary" onClick={() => setIsAssistantOpen(true)} className="md:hidden !border-blue-600/30 hover:!border-blue-600 !text-blue-500 !rounded-xl !h-[38px] !px-4 !text-[10px] !font-black !uppercase !tracking-widest flex items-center gap-2 snap-start whitespace-nowrap">
                <Sparkles size={14} /> <span className="hidden sm:inline">Gemini</span>
              </Button>
            </div>
            {/* Visual fade indicators for scroll */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-app-bg to-transparent pointer-events-none opacity-0 sm:group-hover/scroll:opacity-100 transition-opacity"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-app-bg to-transparent pointer-events-none opacity-40 sm:group-hover/scroll:opacity-100 transition-opacity"></div>
          </div>
        )}



        {/* --- GLOBAL SAVE INDICATOR --- */}
        {Object.keys(savingStatus).length > 0 && (
          <div className="fixed bottom-4 right-4 z-[9999]">
            {Object.values(savingStatus).includes('saving') ? (
              <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </div>
            ) : Object.values(savingStatus).includes('error') ? (
              <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
                <X className="w-4 h-4" />
                <span>Erro ao salvar</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium">
                <CheckIcon className="w-4 h-4" />
                <span>Salvo ✓</span>
              </div>
            )}
          </div>
        )}

        <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar animate-fade bg-app-bg ${(activeTab === 'WHITEBOARD' || activeTab === 'CLIENTES' || activeTab === 'PLANEJAMENTO' || activeTab === 'CHECKLISTS') ? 'p-0 overflow-hidden' : 'p-4 sm:p-6 pb-[calc(100px+env(safe-area-inset-bottom))] sm:pb-6'}`}>
          <Suspense fallback={<RouteFallback />}>
          {activeTab === 'DASHBOARD' && <DashboardView clients={clients} tasks={currentTasks} financas={currentFinancas} planejamento={currentPlanejamento} rdc={currentRdc} setActiveTab={setActiveTab} perfilUsuario={perfilUsuario} />}
          {activeTab === 'CLIENTES' && <ClientesView clients={filterArchived(clients)} onUpdate={handleUpdate} onDelete={performDelete} onAdd={() => handleAddRow('CLIENTES')} onOpenColorPicker={(id: string, val: string) => setColorPickerTarget({ id, tab: 'CLIENTES', field: 'Cor (HEX)', value: val })} savingStatus={savingStatus} />}
          {activeTab === 'REUNIOES' && <ReunioesView reunioes={reunioes} clients={clients} onUpdate={handleUpdate} onDelete={performDelete} onAdd={() => handleAddRow('REUNIOES')} savingStatus={savingStatus} />}
          {activeTab === 'RDC' && <TableView tab="RDC" data={currentRdc} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('RDC')} library={BibliotecaConteudo} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} savingStatus={savingStatus} />}
          {activeTab === 'MATRIZ' && <MatrizEstrategicaView data={currentMatriz} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('MATRIZ')} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} savingStatus={savingStatus} />}


          {activeTab === 'COBO' && (
            <CoboView
              data={currentCobo}
              onUpdate={handleUpdate}
              onDelete={performDelete}
              onArchive={performArchive}
              onAdd={() => handleAddRow('COBO')}
              clients={clients}
              activeClient={clients.find((c: any) => c.id === selectedClientIds[0]) || null}
              onSelectClient={(id: any) => setSelectedClientIds([id])}
              selection={selection}
              onSelect={toggleSelection}
              onClearSelection={() => setSelection([])}
              savingStatus={savingStatus}
            />
          )}

          {activeTab === 'PLANEJAMENTO' && <PlanejamentoTab data={currentPlanejamento} clients={clients} onUpdate={handleUpdate} onAdd={handleAddRow} rdc={currentRdc} matriz={matriz} cobo={cobo} tasks={currentTasks} iaHistory={iaHistory} setActiveTab={setActiveTab} performArchive={performArchive} performDelete={performDelete} library={BibliotecaConteudo} activeClientId={selectedClientIds.length === 1 ? selectedClientIds[0] : undefined} showArchived={showArchived} setShowArchived={setShowArchived} setIsClientFilterOpen={setIsClientFilterOpen} savingStatus={savingStatus} />}
          {activeTab === 'FINANCAS' && <FinancasTab financas={currentFinancas} onAdd={(initial: any) => handleAddRow('FINANCAS', initial)} onUpdate={(id: any, field: any, value: any) => handleUpdate(id, 'FINANCAS', field, value)} onDelete={(ids: any) => performDelete(ids, 'FINANCAS')} clients={clients} currentWorkspace={currentWorkspace} savingStatus={savingStatus} />}
          {activeTab === 'TAREFAS' && <TaskFlowView tasks={currentTasks} clients={clients} collaborators={collaborators} activeViewId={activeTaskViewId} setActiveViewId={setActiveTaskViewId} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('TAREFAS')} onSelectTask={setSelectedTaskId} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} savingStatus={savingStatus} />}
          {activeTab === 'CHECKLISTS' && <ChecklistsTab data={currentChecklists} onAdd={handleAddRow} onUpdate={handleUpdate} onDelete={performDelete} clients={clients} savingStatus={savingStatus} />}
          { activeTab === 'VH' && <VhManagementView clients={clients} collaborators={collaborators} setCollaborators={setCollaborators} onUpdate={handleUpdate} selection={selection} onSelect={toggleSelection} tasks={currentTasks} financas={currentFinancas} savingStatus={savingStatus} /> }
          { activeTab === 'RELATORIOS' && <RelatoriosView clients={clients} planejamento={planejamento} tasks={tasks} financas={financas} rdc={rdc} /> }
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
              <Whiteboard workspaceId={currentWorkspace?.id} />
            </ErrorBoundary>
          )}
          </Suspense>
        </div>

        {
          selectedTaskId && (
            <div className={`fixed inset-0 z-[2000] flex animate-fade pointer-events-none ${taskDetailViewMode === 'sidebar' ? 'justify-end' : 'items-center justify-center bg-zinc-950/60 backdrop-blur-sm pointer-events-auto'}`}>
              <div className={`bg-app-surface-2 shadow-2xl transition-all pointer-events-auto overflow-hidden
              ${taskDetailViewMode === 'sidebar' ? 'h-[calc(100dvh-32px)] w-[550px] my-4 mr-4 rounded-3xl border border-app-border' : ''}
              ${taskDetailViewMode === 'modal' ? 'w-[900px] h-[85dvh] rounded-[32px] border border-app-border' : ''}
              ${taskDetailViewMode === 'fullscreen' ? 'fixed inset-4 rounded-[40px] border border-app-border' : ''}
            `}>
                <Suspense fallback={<RouteFallback />}>
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
                </Suspense>
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
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl md:p-10 pointer-events-auto">
            <div className="w-full h-full md:h-[90dvh] md:max-w-6xl bg-app-surface border border-white/10 md:rounded-[30px] shadow-2xl flex flex-col overflow-hidden text-left">
              <div className="h-20 flex items-center justify-between px-6 md:px-10 border-b border-white/5 bg-app-surface-2 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500"><Wand2 size={18} /></div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-app-text-strong tracking-widest">Assistente de Slide IA</h3>
                  </div>
                </div>
                <button onClick={() => setIsPresentationOpen(false)} className="text-app-text-muted hover:text-app-text-strong"><X size={24} /></button>
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
                <FileSpreadsheet size={20} />
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
                <ImageIcon size={20} />
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
                <FileText size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-app-text-strong font-bold text-xs uppercase tracking-tight group-hover:text-rose-500 transition-colors">PDF</h4>
                <p className="text-app-text-muted text-[9px] font-medium uppercase mt-0.5">Relatório Paginado</p>
              </div>
            </button>
          </div>
          {isExporting && (
            <div className="p-3 bg-blue-500/5 text-blue-500 text-[9px] font-black uppercase text-center border-t border-blue-500/10 animate-pulse">
              <Loader2 size={14} className="animate-spin mr-2 inline" /> Exportando...
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

      {/* Delete Confirmation Modal */}
      {deleteModalState.isOpen && (
        <div className="fixed inset-0 z-[999] bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center p-4 min-h-screen animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f1930] w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden transform transition-all">
            <div className="p-8">
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mb-6 text-red-600 dark:text-red-400 border border-red-500/20">
                <Trash2 size={28} />
              </div>
              <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-gray-500 dark:text-[#a3aac4] text-sm mb-6 leading-relaxed">
                Você tem certeza que deseja deletar <strong>{deleteModalState.ids.length}</strong> item(s)?<br/>Essa ação é permanente e não pode ser desfeita.
              </p>
              
              <div className="mb-8">
                <label className="block text-[10px] font-black text-gray-700 dark:text-[#dee5ff] uppercase tracking-widest mb-3">
                  Digite "EXCLUIR" para confirmar
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full bg-gray-50 dark:bg-[#091328] border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all font-bold tracking-widest text-center"
                  autoFocus
                />
              </div>

              <div className="flex gap-4 w-full">
                <button
                  onClick={() => setDeleteModalState({ isOpen: false, ids: [], tab: null })}
                  className="flex-1 px-4 py-4 rounded-2xl font-black tracking-widest text-xs uppercase text-gray-700 dark:text-[#dee5ff] bg-gray-100 dark:bg-[#192540] hover:bg-gray-200 dark:hover:bg-[#1f2b49] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  disabled={deleteConfirmationText.toUpperCase() !== 'EXCLUIR'}
                  className="flex-1 px-4 py-4 rounded-2xl font-black tracking-widest text-xs uppercase text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLembreteModalOpen && (
        <LembreteModal
          lembrete={editingLembrete}
          clients={clients}
          onClose={() => { setIsLembreteModalOpen(false); setEditingLembrete(null); }}
          onSave={handleSaveLembrete}
        />
      )}

      {isLembreteModalOpen && (
        <LembreteModal
          lembrete={editingLembrete}
          clients={clients}
          onClose={() => { setIsLembreteModalOpen(false); setEditingLembrete(null); }}
          onSave={handleSaveLembrete}
        />
      )}

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

function getIcon(tab: TipoTabela): React.ComponentType<{ size?: number; className?: string }> {
  const icons: Record<string, React.ComponentType<any>> = {
    DASHBOARD: LayoutDashboard, CLIENTES: Contact, REUNIOES: Handshake, ORGANICKIA: Bot,
    RDC: Zap, MATRIZ: Castle, COBO: Antenna, PLANEJAMENTO: CalendarDays,
    FINANCAS: Coins, TAREFAS: ListTodo, CHECKLISTS: ClipboardCheck,
    VH: Hourglass, WHITEBOARD: Presentation, RELATORIOS: Receipt,
  };
  return icons[tab] || FolderOpen;
}
