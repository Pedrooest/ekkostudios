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
  Bot, Castle, Antenna, CalendarDays, Coins, ListTodo, Presentation, Hourglass, ArrowLeft
} from 'lucide-react';
import { AssistantDrawer } from './AssistantDrawer';
import { AssistantAction } from './ai/types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, PieChart, Pie
} from 'recharts';
import {
  Client, CoboItem, MatrizEstrategicaItem, PlanejamentoItem, RdcItem,
  FinancasLancamento, Task, TableType, TaskViewMode,
  VhConfig, ContentLibrary, Collaborator, TaskChecklistItem, PresentationConfig, TaskAttachment, TaskActivity, AppNotification, UserProfile, SystematicModelingData,
  Workspace
} from './types';
import { WorkspaceSelector } from './WorkspaceSelector';
import { WorkspaceSettingsModal } from './WorkspaceSettingsModal';
import { DatabaseService } from './DatabaseService';
import { logDebug } from './components/DebugOverlay';

import {
  CLIENTES_COLS, RDC_COLS,
  COBO_CANAL_OPTIONS, COBO_FREQUENCIA_OPTIONS, COBO_PUBLICO_OPTIONS, COBO_VOZ_OPTIONS, COBO_ZONA_OPTIONS, COBO_INTENCAO_OPTIONS, COBO_FORMATO_OPTIONS,
  DEFAULT_TASK_STATUSES,
  WEEKDAYS_BR, TABLE_LABELS,
  MATRIZ_ESTRATEGICA_COLS, COBO_COLS, PRIORIDADE_OPTIONS,
  DEFAULT_TASK_VIEWS, DEFAULT_VH_CONFIG, DEFAULT_CONTENT_LIBRARY,
  FINANCAS_COLS, FINANCAS_TIPO_OPTIONS, FINANCAS_SERVICOS_OPTIONS, PLANNING_STATUS_OPTIONS, EXPORT_LEGENDS,
  SYSTEMATIC_MODELING_ROWS, MODELAGEM_OPTIONS, PERMEABILIDADE_OPTIONS, CONVERSAO_OPTIONS, DESDOBRAMENTO_OPTIONS, HORARIO_RESUMO_OPTIONS,
  PLANEJAMENTO_COLS, TAREFAS_COLS,
  MATRIZ_FUNCAO_OPTIONS, MATRIZ_QUEM_FALA_OPTIONS, MATRIZ_PAPEL_ESTRATEGICO_OPTIONS, MATRIZ_TIPO_CONTEUDO_OPTIONS, MATRIZ_RESULTADO_ESPERADO_OPTIONS
} from './constants';
import { Button, Card, Badge, Stepper, FloatingPopover, InputSelect, MobileFloatingAction, SimpleMarkdown } from './Components';
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
import WorkspaceManager from './components/WorkspaceManager';


const generateId = () => {
  try {
    return window.crypto.randomUUID();
  } catch (e) {
    // Fallback for non-secure contexts if any
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
};

const mergeItems = <T extends { id: string, updated_at?: string }>(local: T[], remote: T[]): T[] => {
  const merged = [...local];
  console.log(`[EKKO-SYNC] MERGE_START | LOCAL: ${local.length} | REMOTE: ${remote.length}`);

  remote.forEach(remoteItem => {
    const localIndex = merged.findIndex(i => i.id === remoteItem.id);
    if (localIndex === -1) {
      // New item from remote
      merged.push(remoteItem);
    } else {
      // Reconcile by updated_at
      const localItem = merged[localIndex];
      const remoteDate = remoteItem.updated_at ? new Date(remoteItem.updated_at).getTime() : 0;
      const localDate = localItem.updated_at ? new Date(localItem.updated_at).getTime() : 0;

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

function DeletionBar({ count, onDelete, onArchive, onClear }: { count: number; onDelete: () => void; onArchive: () => void; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-fade pointer-events-auto">
      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{count} Selecionados</span>
      <div className="w-px h-4 bg-rose-500/20 mx-1"></div>
      <button onClick={onArchive} className="text-app-text-muted hover:text-app-text-strong text-[10px] font-black uppercase tracking-widest transition-all">Arquivar</button>
      <button onClick={onDelete} className="text-rose-500 hover:text-rose-400 text-[10px] font-black uppercase tracking-widest transition-all ml-2">Excluir Permanente</button>
      <button onClick={onClear} className="text-[#4B5563] hover:text-app-text-strong text-[10px] font-black uppercase tracking-widest transition-all ml-1 underline">Limpar</button>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<TableType>('DASHBOARD');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('theme') as 'dark' | 'light') || 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024);
  const [tabOrder, setTabOrder] = useState<TableType[]>(['DASHBOARD', 'CLIENTES', 'ORGANICKIA', 'RDC', 'MATRIZ', 'COBO', 'PLANEJAMENTO', 'FINANCAS', 'TAREFAS', 'VH', 'WHITEBOARD']);

  const [clients, setClients] = useState<Client[]>([]);
  const [cobo, setCobo] = useState<CoboItem[]>([]);
  const [matriz, setMatriz] = useState<MatrizEstrategicaItem[]>([]);
  const [planejamento, setPlanejamento] = useState<PlanejamentoItem[]>([]);
  const [rdc, setRdc] = useState<RdcItem[]>([]);
  const [financas, setFinancas] = useState<FinancasLancamento[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [systematicModeling, setSystematicModeling] = useState<SystematicModelingData>({});

  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [selection, setSelection] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const [contentLibrary, setContentLibrary] = useState<ContentLibrary>(DEFAULT_CONTENT_LIBRARY);
  const [isLibraryEditorOpen, setIsLibraryEditorOpen] = useState(false);
  const [vhConfig, setVhConfig] = useState<VhConfig>(DEFAULT_VH_CONFIG);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activeTaskViewId, setActiveTaskViewId] = useState<string>(DEFAULT_TASK_VIEWS[0].id);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const clientFilterButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDetailViewMode, setTaskDetailViewMode] = useState<TaskViewMode>('sidebar');
  const [isClientFilterOpen, setIsClientFilterOpen] = useState(false);
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  const [isGeminiSidebarOpen, setIsGeminiSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const [selectedClientIdIA, setSelectedClientIdIA] = useState<string>('');
  const [iaAudioInsight, setIaAudioInsight] = useState<string>('');
  const [iaPdfInsight, setIaPdfInsight] = useState<string>('');
  const [iaHistory, setIaHistory] = useState<any[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<AppNotification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const mobileExportButtonRef = useRef<HTMLButtonElement>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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
      console.error(error);
    } finally {
      setWorkspaceLoading(false);
    }
  }, [currentUser]);

  const loadWorkspaceData = useCallback(async (wsId: string) => {
    const data = await DatabaseService.fetchAllWorkspaceData(wsId);
    if (data) {
      setClients(prev => mergeItems(prev, data.clients as Client[]));
      setCobo(prev => mergeItems(prev, data.cobo as CoboItem[]));
      setMatriz(prev => mergeItems(prev, data.matriz as MatrizEstrategicaItem[]));
      setRdc(prev => mergeItems(prev, data.rdc as RdcItem[]));
      setPlanejamento(prev => mergeItems(prev, data.planning as PlanejamentoItem[]));
      setFinancas(prev => mergeItems(prev, data.financas as FinancasLancamento[]));
      setTasks(prev => mergeItems(prev, data.tasks as Task[]));
      setCollaborators(prev => mergeItems(prev, data.collaborators as Collaborator[]));
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
      return selectedClientIds.includes(item.Cliente_ID);
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
      client: currentClient?.Nome || (selectedClientIds.length > 0 ? 'Múltiplos Clientes' : 'Geral'),
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
            setToasts(prev => [...prev, { id: generateId(), type: 'success', title: 'Sucesso', message: 'Você entrou no workspace com sucesso!', timestamp: new Date().toISOString(), read: false }]);
            window.location.reload();
          } catch (e: any) {
            // alert('Erro ao aceitar convite: ' + e.message);
            let msg = e.message;
            if (msg.includes('policy')) msg = 'Você não tem permissão para entrar neste workspace ou o convite expirou.';
            setToasts(prev => [...prev, { id: generateId(), type: 'error', title: 'Erro no Convite', message: msg, timestamp: new Date().toISOString(), read: false }]);
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
            setToasts(prev => [...prev, { id: generateId(), type: 'success', title: 'Sucesso', message: 'Você entrou no workspace com sucesso!', timestamp: new Date().toISOString(), read: false }]);
            window.location.reload();
          } catch (e: any) {
            // alert('Erro ao aceitar convite pendente: ' + e.message);
            let msg = e.message;
            if (msg.includes('policy')) msg = 'Você não tem permissão para entrar neste workspace ou o convite expirou.';
            setToasts(prev => [...prev, { id: generateId(), type: 'error', title: 'Erro no Convite', message: msg, timestamp: new Date().toISOString(), read: false }]);
            sessionStorage.removeItem('pending_invite');
          }
        }
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
      // Check invite on initial load
      if (session) checkInvite(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        const savedProfile = localStorage.getItem(`profile_${session.user.id}`);
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
        } else {
          setUserProfile({
            id: session.user.id,
            email: session.user.email ?? '',
            full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário',
            role: 'Especialista EKKO',
            status: 'online',
            description: ''
          });
        }
      } else {
        setUserProfile(null);
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
  // SMART NOTIFICATIONS (CHECKS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  useEffect(() => {
    logDebug('ActiveTab Changed', { activeTab });
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
        const defaultOrder: TableType[] = ['DASHBOARD', 'CLIENTES', 'ORGANICKIA', 'RDC', 'MATRIZ', 'COBO', 'PLANEJAMENTO', 'FINANCAS', 'TAREFAS', 'VH', 'WHITEBOARD'];
        const uniqueTabs = new Set([...p.tabOrder, ...defaultOrder]);
        setTabOrder(Array.from(uniqueTabs));
      }
      if (p.vhConfig) setVhConfig(p.vhConfig);
      if (p.contentLibrary) setContentLibrary(p.contentLibrary);
      if (p.selectedClientIdIA) setSelectedClientIdIA(p.selectedClientIdIA);
      if (p.iaAudioInsight) setIaAudioInsight(p.iaAudioInsight);
      if (p.iaPdfInsight) setIaPdfInsight(p.iaPdfInsight);
      if (p.iaHistory) setIaHistory(p.iaHistory);
    }
  }, []);

  useEffect(() => {
    // Only persist UI state to LocalStorage
    localStorage.setItem('ekko_os_ui_v17', JSON.stringify({
      tabOrder, vhConfig, contentLibrary, selectedClientIdIA, iaAudioInsight, iaPdfInsight, iaHistory
    }));
  }, [tabOrder, vhConfig, contentLibrary, selectedClientIdIA, iaAudioInsight, iaPdfInsight, iaHistory]);

  useEffect(() => {
    setSelection([]);
  }, [activeTab]);

  const addNotification = useCallback((type: AppNotification['type'], title: string, message: string) => {
    const newNotif: AppNotification = {
      id: generateId(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
  }, []);


  const handleUpdate = useCallback(async (id: string, tab: TableType, field: string, value: any, skipLog: boolean = false) => {
    // Permission Check
    const member = currentWorkspace?.workspace_members?.find((m: any) => m.user_id === currentUser?.id);
    if (member && member.role === 'viewer') {
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

    // Task Activity Logging
    if (tab === 'TAREFAS' && field !== 'Activities' && field !== 'Comentarios' && !skipLog) {
      const activity: TaskActivity = {
        id: generateId(),
        type: field === 'Status' ? 'status_change' : 'update',
        user: currentUser?.email || 'Agência Ekko',
        message: field === 'Status' ? `alterou o status para ${value}` : `alterou ${field.toLowerCase()} para ${value}`,
        timestamp: new Date().toISOString()
      };
      updated.Activities = [activity, ...(updated.Activities || [])];
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

  const handleAddRow = useCallback(async (tab: TableType, initial: Partial<any> = {}) => {
    // Permission Check
    const member = currentWorkspace?.workspace_members?.find((m: any) => m.user_id === currentUser?.id);
    if (member && member.role === 'viewer') {
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
    else if (tab === 'FINANCAS') newItem = { id, Lancamento_ID: `FIN-${generateId().toUpperCase().slice(0, 4)}`, Data: new Date().toISOString().split('T')[0], Cliente_ID: defaultClientId, Tipo: 'Entrada', Categoria: 'Serviço', Descrição: 'Novo Lançamento', Valor: 0, Recorrência: 'Única', Data_Início: new Date().toISOString().split('T')[0], Data_Fim: '', Dia_Pagamento: 1, Observações: '', ...initial };
    else if (tab === 'PLANEJAMENTO') {
      const date = initial.Data || new Date().toISOString().split('T')[0];
      newItem = { id, Cliente_ID: initial.Cliente_ID || defaultClientId, Data: date, Hora: initial.Hora || '09:00', Conteúdo: initial.Conteúdo || '', Função: initial.Função || 'Hub', Rede_Social: initial.Rede_Social || 'Instagram', "Tipo de conteúdo": initial["Tipo de conteúdo"] || '', Intenção: initial.Intenção || 'Relacionamento', Canal: initial.Canal || '', Formato: initial.Formato || '', Zona: initial.Zona || 'Morna', "Quem fala": initial["Quem fala"] || '', "Status do conteúdo": 'Pendente', ...initial };
    } else if (tab === 'TAREFAS') {
      const resp = currentUser?.email || '';
      const activity: TaskActivity = {
        id: generateId(),
        type: 'create',
        user: resp || 'Agência Ekko',
        message: 'criou esta tarefa',
        timestamp: new Date().toISOString()
      };
      newItem = { id, Task_ID: `TASK-${generateId().toUpperCase().slice(0, 4)}`, Cliente_ID: initial.Cliente_ID || defaultClientId, Título: initial.Título || 'Nova Tarefa', Área: initial.Área || 'Conteúdo', Status: initial.Status || 'todo', Prioridade: initial.Prioridade || 'Média', Responsável: resp, Data_Entrega: initial.Data_Entrega || new Date().toISOString().split('T')[0], Checklist: [], Anexos: [], Comentarios: [], Activities: [activity], Criado_Em: new Date().toISOString(), Atualizado_Em: new Date().toISOString(), ...initial };
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

  const performDelete = useCallback((ids: string[], tab: TableType | 'IA_HISTORY') => {
    // Permission Check
    const member = currentWorkspace?.workspace_members?.find((m: any) => m.user_id === currentUser?.id);
    if (member && member.role === 'viewer') {
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

  const performArchive = useCallback((ids: string[], tab: TableType | 'IA_HISTORY', archive: boolean = true) => {
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
  const [colorPickerTarget, setColorPickerTarget] = useState<{ id: string, tab: TableType, field: string, value: string } | null>(null);






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
      const activity: TaskActivity = {
        id: generateId(),
        type: 'create',
        user: resp,
        message: 'criou esta tarefa via Assistente IA',
        timestamp: today
      };

      const newTask: Task = {
        id: generateId(),
        workspace_id: currentWorkspace.id,
        Task_ID: `TASK-${generateId().toUpperCase().slice(0, 4)}`,
        Created_At: today,
        Atualizado_Em: today,
        Status: 'todo',
        Prioridade: 'Média',
        Checklist: [],
        Anexos: [],
        Comentarios: [],
        Activities: [activity],
        Responsável: resp,
        ...payload
      };

      setTasks(prev => [newTask, ...prev]);
      await DatabaseService.syncItem('tasks', newTask, currentWorkspace.id);
      addNotification('success', 'Ação Confirmada', `Tarefa "${newTask.Título}" criada com sucesso.`);
    }

    if (type === 'suggest_rdc') {
      const newRdc: RdcItem = {
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
      const newPlan: PlanejamentoItem = {
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
      const newClient: Client = {
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
      const newItem: MatrizEstrategicaItem = {
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
    <div className="flex h-[100dvh] bg-app-bg text-app-text font-sans overflow-hidden transition-colors duration-300">
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-[2000] lg:hidden backdrop-blur-sm animate-fade" onClick={() => setSidebarCollapsed(true)}></div>
      )}

      <aside className={`transition-all duration-300 flex flex-col dark:bg-app-surface-2 bg-white border-r border-app-border shrink-0 z-[2100] fixed inset-y-0 left-0 lg:relative ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-[85vw] sm:w-64 shadow-2xl lg:shadow-none'}`}>
        <div className={`h-24 flex items-center border-b border-app-border justify-center overflow-hidden ${sidebarCollapsed ? 'px-0' : 'px-5'}`}>
          <Logo collapsed={sidebarCollapsed} theme={theme} />
        </div>
        <nav className="flex-1 py-6 px-0 space-y-2 overflow-y-auto custom-scrollbar flex flex-col items-center">
          {tabOrder.map(tab => (
            <button key={`nav-tab-${tab}`} onClick={() => { setActiveTab(tab); if (window.innerWidth < 1024) setSidebarCollapsed(true); }} className={`w-[90%] flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-4'} py-3 rounded-xl transition-all group ${activeTab === tab ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-app-text-muted hover:bg-app-surface hover:text-app-text-strong'}`}>
              <i className={`fa-solid ${getIcon(tab)} text-xl transition-transform group-hover:scale-110`}></i>
              {!sidebarCollapsed && <span className="text-[11px] font-bold uppercase tracking-widest truncate">{TABLE_LABELS[tab]}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-app-border space-y-2 bg-app-surface-2/80 backdrop-blur-md flex flex-col items-center">
          <button onClick={() => setIsLibraryEditorOpen(true)} className={`w-[90%] flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-4'} py-3 rounded-xl text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all group`}>
            <i className="fa-solid fa-layer-group text-xl transition-transform group-hover:scale-110"></i>{!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Tipos</span>}
          </button>
          <button onClick={() => setIsReorderOpen(true)} className={`w-[90%] flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-4'} py-3 rounded-xl text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all group`}>
            <i className="fa-solid fa-arrows-up-down-left-right text-xl transition-transform group-hover:scale-110"></i>{!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Ordem</span>}
          </button>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className={`w-[90%] flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-4'} py-3 rounded-xl text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all group flex`}>
            <i className={`fa-solid ${sidebarCollapsed ? 'fa-expand' : 'fa-arrow-left'} text-xl transition-transform group-hover:scale-110`}></i>{!sidebarCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest">Recolher</span>}
          </button>
        </div>
      </aside>

      {/* APPLE-STYLE NOTIFICATION TOAST OVERLAY (PATCH: BOTTOM-RIGHT) */}
      <div className="fixed bottom-6 z-[9999] pointer-events-none flex flex-col-reverse left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 items-center sm:items-end">
        {notifications.slice(0, 2).map((n) => (
          <NotificationToast
            key={n.id}
            notification={n}
            onClose={(id) => setNotifications(prev => prev.filter(x => x.id !== id))}
          />
        ))}
      </div>


      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-app-bg transition-colors duration-300">
        <header className={`sticky top-0 z-[50] px-4 sm:px-8 py-3 lg:h-[72px] border-b transition-colors flex justify-between items-center w-full backdrop-blur-md ${theme === 'dark' ? 'dark bg-[#0a0a0c]/80 border-zinc-800/80 text-zinc-300' : 'bg-white/80 border-gray-200 text-gray-800'}`}>
          {/* LEFT: Menu | Workspace */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all p-2.5 -ml-2 relative z-[2200] bg-zinc-100 dark:bg-white/5 rounded-xl active:scale-90" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
              <Menu size={22} />
            </button>
            <WorkspaceSelector
              workspaces={workspaces}
              currentWorkspace={currentWorkspace}
              onSelect={setCurrentWorkspace}
              onManageMembers={() => setActiveTab('WORKSPACE')}
              onCreate={async (name) => {
                try {
                  const newWs = await DatabaseService.createWorkspace(name);
                  setWorkspaces(prev => [newWs, ...prev]);
                  setCurrentWorkspace(newWs);
                  alert('Workspace criado com sucesso!');
                } catch (e: any) {
                  console.error(e);
                  alert('Erro ao criar workspace: ' + (e.message || e));
                }
              }}
              loading={workspaceLoading}
            />
          </div>

          {/* RIGHT: Global Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={toggleTheme} className="p-2.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-white/5 dark:bg-white/5 dark:text-zinc-400 dark:hover:text-white transition-colors active:scale-90">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2.5 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-white/5 dark:bg-white/5 dark:text-zinc-400 dark:hover:text-white transition-colors active:scale-90 relative"
              >
                <Bell size={18} />
                {notifications.some(n => !n.read) && (
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
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                      className="text-[9px] font-black uppercase text-blue-500 hover:text-app-text-strong transition-all"
                    >
                      Limpar Tudo
                    </button>
                  </div>
                  <div className="max-h-[450px] overflow-y-auto custom-scrollbar bg-app-surface">
                    {notifications.length === 0 ? (
                      <div className="p-12 text-center opacity-20">
                        <BellOff size={40} className="mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Silêncio absoluto</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-5 border-b border-app-border/50 hover:bg-app-bg transition-all cursor-pointer group ${!n.read ? 'bg-blue-500/5' : ''}`}>
                          <div className="flex gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              n.type === 'warning' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                              {n.type === 'success' ? <CheckCircle size={16} /> : n.type === 'warning' ? <AlertTriangle size={16} /> : <Info size={16} />}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-baseline">
                                <p className="text-[11px] font-black text-app-text-strong uppercase tracking-tight">{n.title}</p>
                                <span className="text-[8px] font-bold text-[#334155] uppercase">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-[10px] font-medium text-app-text-muted leading-relaxed uppercase tracking-tight">{n.message}</p>
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
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:border-zinc-700 rounded-lg text-xs font-bold transition-colors shadow-sm dark:shadow-none uppercase tracking-widest">
                <Search size={14} /> BUSCAR
              </button>

              <button
                onClick={() => setIsAssistantOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/20 rounded-lg text-xs font-bold transition-colors shadow-sm uppercase tracking-widest"
              >
                <Sparkles size={14} /> ASSISTENTE GEMINI
              </button>
              {userProfile && (
                <ProfilePopover
                  profile={userProfile}
                  tasks={tasks}
                  onUpdate={(updates) => {
                    const newProfile = { ...userProfile, ...updates };
                    setUserProfile(newProfile);
                    localStorage.setItem(`profile_${userProfile.id}`, JSON.stringify(newProfile));
                  }}
                  onLogout={() => supabase.auth.signOut()}
                />
              )}
            </div>
          </div>
        </header>

        {/* Action Controls (Mobile-friendly row) */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar px-4 sm:px-8 py-2 border-b border-app-border/40 lg:border-none no-scrollbar">
          <button
            ref={clientFilterButtonRef}
            onClick={() => setIsClientFilterOpen(!isClientFilterOpen)}
            className={`flex items-center gap-2 text-[10px] font-black uppercase transition-all border px-4 py-2.5 rounded-xl whitespace-nowrap ${selectedClientIds.length > 0 ? 'bg-blue-600/10 border-blue-600 text-blue-600' : 'text-zinc-500 border-white/10 hover:border-white/20 hover:text-zinc-300'}`}
          >
            <Filter size={14} />
            {selectedClientIds.length > 0 ? `${selectedClientIds.length} Clientes` : <><span className="md:hidden">Todos</span><span className="hidden md:inline">Todos Clientes</span></>}
          </button>

          <button onClick={() => setShowArchived(!showArchived)} className={`shrink-0 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border transition-all whitespace-nowrap flex items-center gap-2 ${showArchived ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'text-zinc-500 border-white/10 hover:border-white/20 hover:text-zinc-300'}`}>
            {showArchived ? <Eye size={14} /> : <EyeOff size={14} />}
            {showArchived ? 'Ocultar' : 'Arquivados'}
          </button>

          <Button ref={exportButtonRef} variant="secondary" onClick={() => setIsExportModalOpen(true)} className="!rounded-xl !h-[38px] !px-4 !text-[10px] !font-black !uppercase !tracking-widest flex items-center gap-2">
            <Download size={14} /> Exportar
          </Button>

          {/* Desktop Assistant (Hidden here as it's in the top bar for MD+) */}
          <Button variant="secondary" onClick={() => setIsAssistantOpen(true)} className="md:hidden !border-blue-600/30 hover:!border-blue-600 !text-blue-500 !rounded-xl !h-[38px] !px-4 !text-[10px] !font-black !uppercase !tracking-widest flex items-center gap-2">
            <Sparkles size={14} /> Gemini
          </Button>
        </div>



        <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-10 pb-[calc(100px+env(safe-area-inset-bottom))] lg:pb-10 custom-scrollbar animate-fade bg-app-bg">
          {activeTab === 'DASHBOARD' && <DashboardView clients={clients} tasks={currentTasks} financas={currentFinancas} planejamento={currentPlanejamento} rdc={currentRdc} />}
          {activeTab === 'CLIENTES' && <TableView tab="CLIENTES" data={filterArchived(clients)} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('CLIENTES')} clients={clients} library={contentLibrary} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} onOpenColorPicker={(id: string, val: string) => setColorPickerTarget({ id, tab: 'CLIENTES', field: 'Cor (HEX)', value: val })} />}
          {activeTab === 'RDC' && <TableView tab="RDC" data={currentRdc} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('RDC')} library={contentLibrary} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} />}
          {activeTab === 'MATRIZ' && <TableView tab="MATRIZ" data={matriz} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('MATRIZ')} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} library={contentLibrary} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} />}

          {activeTab === 'COBO' && <TableView tab="COBO" data={currentCobo} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('COBO')} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} library={contentLibrary} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} />}

          {activeTab === 'PLANEJAMENTO' && <PlanningView data={currentPlanejamento} clients={clients} onUpdate={handleUpdate} onAdd={handleAddRow} rdc={rdc} matriz={matriz} cobo={cobo} tasks={tasks} iaHistory={iaHistory} setActiveTab={setActiveTab} performArchive={performArchive} performDelete={performDelete} library={contentLibrary} />}
          {activeTab === 'FINANCAS' && <FinanceView data={currentFinancas} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('FINANCAS')} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} clients={clients} activeClient={clients.find((c: any) => c.id === selectedClientIds[0])} onSelectClient={(id: any) => setSelectedClientIds([id])} />}
          {activeTab === 'TAREFAS' && <TaskFlowView tasks={currentTasks} clients={clients} collaborators={collaborators} activeViewId={activeTaskViewId} setActiveViewId={setActiveTaskViewId} onUpdate={handleUpdate} onDelete={performDelete} onArchive={performArchive} onAdd={() => handleAddRow('TAREFAS')} onSelectTask={setSelectedTaskId} selection={selection} onSelect={toggleSelection} onClearSelection={() => setSelection([])} />}
          {activeTab === 'VH' && <VhManagementView config={vhConfig} setConfig={setVhConfig} collaborators={collaborators} setCollaborators={setCollaborators} clients={clients} tasks={tasks} finances={currentFinancas} />}
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
          {activeTab === 'WORKSPACE' && <WorkspaceManager />}
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
                  viewMode={taskDetailViewMode}
                  setViewMode={setTaskDetailViewMode}
                />
              </div>
            </div>
          )
        }


        <CopilotChat appData={fullAppContext} />
        <AssistantDrawer
          isOpen={isAssistantOpen}
          onClose={() => setIsAssistantOpen(false)}
          activeTab={activeTab}
          appState={{ clients, cobo, matriz, planejamento, rdc, tasks, financas, collaborators, vhConfig, systematicModeling }}
          onApplyAction={handleApplyAction}
        />

      </main >

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
                                activeTab === 'RDC' ? rdc.filter((r: any) => r.Cliente_ID === currentClient?.id && !r.__archived) :
                                  activeTab === 'COBO' ? currentCobo :
                                    activeTab === 'PLANEJAMENTO' ? currentPlanejamento :
                                      activeTab === 'TAREFAS' ? currentTasks : []
                            }
                          />
                        ) : (
                          <PresentationSlide tab={activeTab} config={{ agencyName: 'EKKO STUDIOS', title: presentationBrief.title, subtitle: presentationBrief.subtitle, theme: 'dark', aspectRatio: '16:9', detailLevel: 'Completo' }} data={{ clients, rdc, planning: currentPlanejamento, finances: currentFinancas, tasks: currentTasks, cobo: currentCobo, matriz: currentMatriz }} selectedClient={currentClient} clientColor={currentClient?.['Cor (HEX)']} />
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

      {isLibraryEditorOpen && <LibraryEditorModal library={contentLibrary} onClose={() => setIsLibraryEditorOpen(false)} />}
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

      {/* Toast Notifications */}
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

function PlanningView({ data, clients, onUpdate, onAdd, rdc, matriz, cobo, tasks, iaHistory, setActiveTab, performArchive, performDelete, library }: any) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedEvent = useMemo(() => data.find((e: any) => e.id === selectedEventId), [data, selectedEventId]);

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    if (filterStatus === 'All') return data;
    return data.filter((p: any) => p['Status do conteúdo'] === filterStatus);
  }, [data, filterStatus]);

  const bankItems = useMemo(() => {
    const res: any[] = [];
    (rdc || []).forEach((r: any) => res.push({ ...r, _source: 'RDC', _label: r['Ideia de Conteúdo'] }));
    (matriz || []).forEach((m: any) => res.push({ ...m, _source: 'MATRIZ', _label: m['Papel estratégico'] || m['Tipo de conteúdo'] }));
    (tasks || []).forEach((t: any) => res.push({ ...t, _source: 'TAREFAS', _label: t.Título }));
    (iaHistory || []).forEach((h: any) => { if (h.type === 'BRIEFING') res.push({ ...h, _source: 'ORGANICKIA', _label: `IA: ${h.clientName}` }); });
    return res;
  }, [rdc, matriz, tasks, iaHistory]);

  const handleImport = (item: any) => {
    onAdd('PLANEJAMENTO', {
      Cliente_ID: item.Cliente_ID || 'GERAL',
      Conteúdo: item._label,
      Fonte_Origem: item._source,
      Origem_ID: item.id
    });
  };

  return (
    <div className="flex flex-col lg:flex-row lg:h-full h-auto gap-6 animate-fade text-left relative lg:overflow-hidden overflow-visible">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm animate-fade" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      <div className="flex-1 transition-all duration-500 h-full flex flex-col min-w-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-app-surface/40 p-4 md:p-8 rounded-2xl md:rounded-[32px] border border-white/5 backdrop-blur-md">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"></div>
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-app-text-strong">Planejamento Estratégico</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {['All', ...PLANNING_STATUS_OPTIONS].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 ${filterStatus === s ? 'bg-blue-600 border-blue-500 text-app-text-strong shadow-lg shadow-blue-900/40' : 'bg-app-bg/60 border-white/5 text-app-text-muted hover:text-gray-300 hover:border-white/10'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 self-end lg:self-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105 active:scale-95 relative z-[60] ${isSidebarOpen ? 'bg-blue-600/10 border-blue-500 text-blue-500' : 'bg-gray-800/40 border-white/5 text-app-text-muted hover:text-app-text-strong hover:border-white/10'}`}
            >
              <i className={`fa-solid ${isSidebarOpen ? 'fa-eye-slash' : 'fa-database'}`}></i>
              {isSidebarOpen ? 'Esconder Banco' : 'Banco de Conteúdo'}
            </button>
            <Button
              onClick={() => onAdd('PLANEJAMENTO')}
              className="hidden lg:flex !px-6 !py-3 !rounded-2xl !bg-gradient-to-r !from-blue-600 !to-indigo-700 !shadow-xl !shadow-blue-900/20"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              Novo Conteúdo
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-app-surface/30 border border-app-border rounded-[32px] p-5 md:p-8 shadow-2xl md:overflow-y-auto min-h-[100dvh] lg:min-h-0 relative pb-[calc(160px+env(safe-area-inset-bottom))] md:pb-8">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
            initialView={window.innerWidth < 1024 ? "listWeek" : "dayGridMonth"}
            events={filteredData.map((p: any) => {
              const client = clients.find((c: any) => c.id === p.Cliente_ID);
              return {
                id: p.id,
                title: p.Conteúdo,
                start: p.Data + (p.Hora ? `T${p.Hora}` : ''),
                backgroundColor: client?.['Cor (HEX)'] || '#3B82F6',
                borderColor: 'transparent',
                extendedProps: { ...p, clientName: client?.Nome || 'Geral' }
              };
            })}
            height="auto"
            contentHeight="auto"
            handleWindowResize={true}
            locale="pt-br"
            headerToolbar={{
              left: isMobile ? 'prev,next' : 'prev,next today',
              center: 'title',
              right: isMobile ? 'today' : 'dayGridMonth,listWeek'
            }}
            eventContent={(eventInfo) => {
              const p = eventInfo.event.extendedProps;
              const bgColor = eventInfo.event.backgroundColor || '#3B82F6';
              const isDone = p['Status do conteúdo'] === 'Concluído';
              const network = p['Canal / Rede'];

              const getIcon = (item: any) => {
                const type = item['Formato'];
                if (type?.toLowerCase().includes('video') || type?.toLowerCase().includes('reels')) return <Video size={10} />;
                if (type?.toLowerCase().includes('imagem') || type?.toLowerCase().includes('foto')) return <ImageIcon size={10} />;
                if (type?.toLowerCase().includes('texto') || type?.toLowerCase().includes('artigo')) return <FileText size={10} />;
                return <Share2 size={10} />;
              };

              return (
                <div className={`p-1.5 md:p-2 rounded-lg border border-app-border bg-app-surface/90 hover:border-accent cursor-pointer transition-all relative overflow-hidden group/event w-full h-full shadow-sm ${isDone ? 'opacity-50' : ''}`}>
                  <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-full" style={{ backgroundColor: bgColor }} />

                  <div className="flex justify-between items-center mb-1 pl-1.5">
                    <span className="flex items-center gap-1 text-[8px] md:text-[9px] text-app-text-muted font-mono">
                      <Clock size={8} className="text-app-text-muted" /> {p.Hora || '--:--'}
                    </span>
                    <div className="flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 rounded-[4px] bg-accent/10 text-accent">
                      {getIcon(p)}
                    </div>
                  </div>

                  <div className="pl-1.5">
                    <p className={`text-[10px] md:text-xs font-bold leading-tight truncate ${isDone ? 'text-app-text-muted line-through' : 'text-app-text-strong'}`}>
                      {eventInfo.event.title}
                    </p>
                    <p className="text-[8px] md:text-[9px] text-app-text-muted uppercase tracking-widest mt-1 truncate">
                      {p.clientName}
                    </p>
                  </div>
                </div>
              );
            }}
            buttonText={{
              today: 'Hoje',
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
              list: 'Lista'
            }}
            dayMaxEvents={3}
            eventClick={(info) => setSelectedEventId(info.event.id)}
            editable={true}
            eventDrop={(info) => {
              onUpdate(info.event.id, 'PLANEJAMENTO', 'Data', info.event.startStr.split('T')[0]);
              if (info.event.startStr.includes('T')) onUpdate(info.event.id, 'PLANEJAMENTO', 'Hora', info.event.startStr.split('T')[1].slice(0, 5));
            }}
          />
        </div>
      </div>

      <ContentBankSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        bankItems={bankItems}
        onImport={handleImport}
        onUpdate={(id, source, field, value) => {
          const tableMap: Record<string, string> = {
            'RDC': 'RDC',
            'MATRIZ': 'MATRIZ',
            'TAREFAS': 'TAREFAS',
            'ORGANICKIA': 'IA_HISTORY'
          };
          onUpdate(id, tableMap[source] as any, field, value);
        }}
        onDelete={(id, source) => {
          const tableMap: Record<string, string> = {
            'RDC': 'RDC',
            'MATRIZ': 'MATRIZ',
            'TAREFAS': 'TAREFAS',
            'ORGANICKIA': 'IA_HISTORY'
          };
          performDelete(id, tableMap[source] as any);
        }}
      />

      {selectedEvent && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-app-surface-2 border-l border-app-border shadow-2xl z-[100] animate-fade flex flex-col pointer-events-auto">
          <div className="h-16 flex items-center justify-between px-8 border-b border-app-border bg-app-surface">
            <div className="flex items-center gap-3">
              <Badge color="blue">EDIÇÃO</Badge>
              <span className="text-[10px] font-black uppercase text-[#3B82F6]">{clients.find((c: any) => c.id === selectedEvent.Cliente_ID)?.Nome || 'Geral'}</span>
            </div>
            <button onClick={() => setSelectedEventId(null)} className="text-app-text-muted hover:text-app-text-strong transition-all"><i className="fa-solid fa-xmark text-xl"></i></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <section>
              <label className="text-[9px] font-black uppercase text-[#334155] block mb-2 tracking-widest">Conteúdo do Planejamento</label>
              <textarea className="text-xl font-black text-app-text-strong bg-transparent border-none p-0 w-full focus:ring-0 uppercase tracking-tighter min-h-[60px]" value={selectedEvent.Conteúdo} onChange={e => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Conteúdo', e.target.value)} />
            </section>

            <div className="grid grid-cols-2 gap-6 bg-app-surface p-6 rounded-2xl border border-app-border">
              <div>
                <InputSelect
                  value={selectedEvent.Cliente_ID}
                  onChange={(val) => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Cliente_ID', val)}
                  options={[{ value: 'GERAL', label: 'Geral' }, ...clients.map((c: any) => ({ value: c.id, label: c.Nome }))]}
                  className="w-full text-[11px] font-bold uppercase bg-transparent text-app-text-strong"
                  label="Cliente"
                  placeholder="Selecione..."
                />
              </div>
              <div>
                <InputSelect
                  value={selectedEvent['Status do conteúdo']}
                  onChange={(val) => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Status do conteúdo', val)}
                  options={PLANNING_STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
                  className="w-full text-[11px] font-bold uppercase bg-transparent text-app-text-strong"
                  label="Status"
                  placeholder="Selecione..."
                />
              </div>
              <div><label className="text-[9px] font-black text-[#334155] uppercase block mb-1">Data</label><input type="date" className="w-full text-[11px] font-bold bg-transparent text-app-text-strong" value={selectedEvent.Data} onChange={e => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Data', e.target.value)} /></div>
              <div><label className="text-[9px] font-black text-[#334155] uppercase block mb-1">Hora</label><input type="time" className="w-full text-[11px] font-bold bg-transparent text-app-text-strong" value={selectedEvent.Hora} onChange={e => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Hora', e.target.value)} /></div>
            </div>

            <section className="space-y-4">
              <div>
                <InputSelect
                  value={selectedEvent.Rede_Social}
                  onChange={(val) => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Rede_Social', val)}
                  options={RDC_NETWORKS.map(opt => ({ value: opt, label: opt }))}
                  className="w-full text-[11px] font-bold uppercase bg-transparent text-app-text-strong border-b border-app-border pb-2"
                  label="Canal/Rede"
                  placeholder="Selecione..."
                />
              </div>
              <div>
                <InputSelect
                  value={selectedEvent['Tipo de conteúdo']}
                  onChange={(val) => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Tipo de conteúdo', val)}
                  options={(RDC_FORMATS[selectedEvent.Rede_Social] || []).map(opt => ({ value: opt, label: opt }))}
                  className="w-full text-[11px] font-bold uppercase bg-transparent text-app-text-strong border-b border-app-border pb-2"
                  label="Tipo/Formato"
                  placeholder="-- Selecione --"
                />
              </div>
            </section>

            <section>
              <label className="text-[9px] font-black text-[#3B82F6] uppercase block mb-2 tracking-widest">Observações Táticas</label>
              <textarea className="w-full h-32 bg-app-bg border border-app-border rounded-xl p-4 text-[10px] text-gray-300 font-bold uppercase leading-relaxed outline-none focus:border-blue-500/50" value={selectedEvent.Observações || ''} onChange={e => onUpdate(selectedEvent.id, 'PLANEJAMENTO', 'Observações', e.target.value)} placeholder="..." />
            </section>

            {selectedEvent.Fonte_Origem && (
              <section className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Origem Conectada</span>
                  <p className="text-[10px] font-bold text-app-text-strong uppercase">{selectedEvent.Fonte_Origem} #{selectedEvent.Origem_ID.slice(0, 5)}</p>
                </div>
                <Button variant="secondary" className="!h-8 !px-4 !text-[8px]" onClick={() => { setActiveTab(selectedEvent.Fonte_Origem as TableType); setSelectedEventId(null); }}>Abrir Origem</Button>
              </section>
            )}
          </div>
          <div className="p-8 border-t border-app-border bg-app-surface flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={() => { onAdd('PLANEJAMENTO', { ...selectedEvent, id: generateId(), Conteúdo: `${selectedEvent.Conteúdo} (Cópia)` }); setSelectedEventId(null); }}>Duplicar</Button>
            <Button variant="secondary" className="flex-1" onClick={() => { performArchive([selectedEvent.id], 'PLANEJAMENTO', !selectedEvent.__archived); setSelectedEventId(null); }}>Arquivar</Button>
            <Button variant="danger" className="flex-1" onClick={() => { performDelete([selectedEvent.id], 'PLANEJAMENTO'); setSelectedEventId(null); }}>Excluir</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function FinanceView({ data, onUpdate, onDelete, onArchive, onAdd, selection, onSelect, onClearSelection, clients, activeClient, onSelectClient }: any) {
  const [activeRegMode, setActiveRegMode] = useState<'entrada' | 'saida' | 'despesa' | 'assinatura' | null>(null);

  const totals = useMemo(() => {
    const res = { entradas: 0, saidas: 0, despesas: 0, assinaturas: 0 };
    data.forEach((f: FinancasLancamento) => {
      const v = f.Valor || 0;
      if (f.Tipo === 'Entrada') res.entradas += v;
      else if (f.Tipo === 'Saída') res.saidas += v;
      else if (f.Tipo === 'Despesa') res.despesas += v;
      else if (f.Tipo === 'Assinatura') res.assinaturas += v;
    });
    const saldo = res.entradas - (res.saidas + res.despesas + res.assinaturas);

    // Distribuição (30/30/40) apenas se houver saldo positivo
    const saldoDistribuivel = saldo > 0 ? saldo : 0;
    const proLaborePedro = saldoDistribuivel * 0.3;
    const proLaboreLucas = saldoDistribuivel * 0.3;
    const caixaAgencia = saldoDistribuivel * 0.4;

    return { ...res, saldo, proLaborePedro, proLaboreLucas, caixaAgencia };
  }, [data]);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const quickCategories: any = {
    'entrada': FINANCAS_SERVICOS_OPTIONS,
    'saida': ['Reembolso', 'Devolução', 'Pagamento Fornecedor', 'Outros'],
    'despesa': ['Equipamento', 'Software', 'Impostos', 'Marketing da Agência', 'Outros'],
    'assinatura': ['Ferramentas IA', 'Hospedagem', 'Bancos de Imagem', 'Outros']
  };

  const chartData = useMemo(() => [
    { label: 'Entradas', value: totals.entradas, color: 'bg-emerald-500 dark:bg-emerald-500 shadow-emerald-500/30' },
    { label: 'Saídas', value: totals.saidas, color: 'bg-rose-500 dark:bg-rose-500 shadow-rose-500/30' },
    { label: 'Despesas', value: totals.despesas, color: 'bg-amber-500 dark:bg-amber-500 shadow-amber-500/30' },
    { label: 'Assinaturas', value: totals.assinaturas, color: 'bg-purple-500 dark:bg-purple-500 shadow-purple-500/30' },
    { label: 'Saldo', value: totals.saldo, color: 'bg-indigo-500 dark:bg-indigo-500 shadow-indigo-500/30' },
  ], [totals]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade text-left mobile-container pb-10">

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Card Entradas */}
        <button
          onClick={() => setActiveRegMode(activeRegMode === 'entrada' ? null : 'entrada')}
          className={`flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
            ${activeRegMode === 'entrada'
              ? 'bg-emerald-50 border-emerald-300 shadow-md dark:bg-emerald-500/10 dark:border-emerald-500/50 dark:shadow-[0_0_30px_rgba(16,185,129,0.1)]'
              : 'bg-app-surface border-app-border hover:border-emerald-300 dark:hover:border-emerald-500/30 shadow-sm dark:shadow-none'}`}
        >
          <div className="flex justify-between items-center w-full mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Entradas</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <span className={`text-2xl font-black transition-colors text-emerald-600 dark:text-emerald-400`}>
            {formatBRL(totals.entradas)}
          </span>
        </button>

        {/* Card Saídas */}
        <button
          onClick={() => setActiveRegMode(activeRegMode === 'saida' ? null : 'saida')}
          className={`flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
            ${activeRegMode === 'saida'
              ? 'bg-rose-50 border-rose-300 shadow-md dark:bg-rose-500/10 dark:border-rose-500/50 dark:shadow-[0_0_30px_rgba(244,63,94,0.1)]'
              : 'bg-app-surface border-app-border hover:border-rose-300 dark:hover:border-rose-500/30 shadow-sm dark:shadow-none'}`}
        >
          <div className="flex justify-between items-center w-full mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Saídas</span>
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
          </div>
          <span className={`text-2xl font-black transition-colors text-rose-600 dark:text-rose-400`}>
            {formatBRL(totals.saidas)}
          </span>
        </button>

        {/* Card Despesas */}
        <button
          onClick={() => setActiveRegMode(activeRegMode === 'despesa' ? null : 'despesa')}
          className={`flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
            ${activeRegMode === 'despesa'
              ? 'bg-amber-50 border-amber-300 shadow-md dark:bg-amber-500/10 dark:border-amber-500/50 dark:shadow-[0_0_30px_rgba(245,158,11,0.1)]'
              : 'bg-app-surface border-app-border hover:border-amber-300 dark:hover:border-amber-500/30 shadow-sm dark:shadow-none'}`}
        >
          <div className="flex justify-between items-center w-full mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Despesas</span>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 flex items-center justify-center">
              <Receipt size={16} />
            </div>
          </div>
          <span className={`text-2xl font-black transition-colors text-amber-600 dark:text-amber-400`}>
            {formatBRL(totals.despesas)}
          </span>
        </button>

        {/* Card Assinaturas */}
        <button
          onClick={() => setActiveRegMode(activeRegMode === 'assinatura' ? null : 'assinatura')}
          className={`flex flex-col p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group
            ${activeRegMode === 'assinatura'
              ? 'bg-purple-50 border-purple-300 shadow-md dark:bg-purple-500/10 dark:border-purple-500/50 dark:shadow-[0_0_30px_rgba(168,85,247,0.1)]'
              : 'bg-app-surface border-app-border hover:border-purple-300 dark:hover:border-purple-500/30 shadow-sm dark:shadow-none'}`}
        >
          <div className="flex justify-between items-center w-full mb-4">
            <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Assinaturas</span>
            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 flex items-center justify-center">
              <CreditCard size={16} />
            </div>
          </div>
          <span className={`text-2xl font-black transition-colors text-purple-600 dark:text-purple-400`}>
            {formatBRL(totals.assinaturas)}
          </span>
        </button>

        {/* Card Saldo Final */}
        <div className="flex flex-col p-5 rounded-2xl border bg-app-surface border-app-border shadow-sm dark:shadow-none relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 dark:opacity-10"><Wallet size={100} /></div>
          <div className="flex justify-between items-center w-full mb-4 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-app-text-muted">Saldo Final</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <span className={`text-2xl font-black relative z-10 ${totals.saldo >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatBRL(totals.saldo)}
          </span>
        </div>

      </div>

      {/* QUICK REGISTRATION PANEL */}
      {activeRegMode && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">

            <div className="flex-1">
              <h3 className="text-sm font-black text-app-text-strong uppercase tracking-wider mb-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full 
                  ${activeRegMode === 'entrada' ? 'bg-emerald-500' :
                    activeRegMode === 'saida' ? 'bg-rose-500' :
                      activeRegMode === 'despesa' ? 'bg-amber-500' : 'bg-purple-500'}`}
                />
                Novo Registro: {activeRegMode}
              </h3>
              <p className="text-xs text-app-text-muted uppercase tracking-widest font-bold">Selecione uma categoria abaixo para lançar.</p>
            </div>

            <div className="flex-2 flex flex-wrap gap-2 justify-start md:justify-end">
              {quickCategories[activeRegMode].map((cat: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => onAdd('FINANCAS', {
                    Tipo: activeRegMode === 'entrada' ? 'Entrada' : activeRegMode === 'saida' ? 'Saída' : activeRegMode === 'despesa' ? 'Despesa' : 'Assinatura',
                    Categoria: cat,
                    Observações: cat
                  })}
                  className="px-4 py-2 bg-app-bg text-app-text-muted hover:text-app-text-strong border border-app-border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  + {cat}
                </button>
              ))}
            </div>

            <div className="shrink-0 flex items-center">
              <button
                onClick={() => onAdd('FINANCAS', {
                  Tipo: activeRegMode === 'entrada' ? 'Entrada' : activeRegMode === 'saida' ? 'Saída' : activeRegMode === 'despesa' ? 'Despesa' : 'Assinatura',
                  Descrição: `Solicitado em: ${new Date().toLocaleDateString()}`
                })}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all
                ${activeRegMode === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' :
                    activeRegMode === 'saida' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' :
                      activeRegMode === 'despesa' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20' :
                        'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'}`}
              >
                Lançar Avulso <ArrowRight size={16} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DASHBOARDS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Custom Operational Flow Chart */}
        <div className="lg:col-span-2 bg-app-surface border border-app-border rounded-2xl p-8 shadow-sm transition-colors flex flex-col min-h-[400px]">
          <h3 className="text-sm font-black text-app-text-strong uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <Activity size={16} className="text-indigo-500" /> Fluxo de Caixa Operacional
          </h3>

          <div className="flex-1 flex items-end justify-around pt-6 pb-2 relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-6">
              {[1, 2, 3].map(i => <div key={i} className="border-b border-app-border border-dashed w-full h-0"></div>)}
            </div>

            {chartData.map((item, idx) => {
              const maxVal = Math.max(...chartData.map(d => Math.abs(d.value)), 1);
              const heightPercentage = Math.max(5, Math.min(100, Math.abs((item.value / maxVal) * 100)));

              return (
                <div key={idx} className="flex flex-col items-center gap-4 z-10 w-full group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-app-text-strong text-app-bg text-[10px] font-black py-1 px-2 rounded-md mb-2 absolute -top-10 pointer-events-none whitespace-nowrap">
                    {formatBRL(item.value)}
                  </div>
                  <div className="w-12 sm:w-20 bg-app-bg/50 border border-app-border rounded-t-2xl overflow-hidden flex items-end justify-center h-[250px] relative">
                    <div
                      className={`w-full rounded-t-2xl transition-all duration-1000 ease-out shadow-lg ${item.color}`}
                      style={{ height: `${heightPercentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-app-text-muted group-hover:text-app-text-strong transition-colors">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Distribution Card */}
        <div className="bg-app-surface border border-app-border rounded-2xl p-8 shadow-xl transition-colors flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>

          <h3 className="text-sm font-black text-app-text-strong uppercase tracking-[0.2em] mb-8 flex items-center gap-2 relative z-10">
            <DollarSign size={16} className="text-emerald-500" /> Distribuição (30/30/40)
          </h3>

          <div className="flex-1 flex flex-col justify-center gap-8 relative z-10">
            {[
              { label: 'Pró-labore Pedro', share: '30%', value: totals.proLaborePedro, color: 'text-indigo-500' },
              { label: 'Pró-labore Lucas', share: '30%', value: totals.proLaboreLucas, color: 'text-indigo-500' },
              { label: 'Caixa Agência', share: '40%', value: totals.caixaAgencia, color: 'text-emerald-500' }
            ].map((dist, i) => (
              <React.Fragment key={i}>
                <div className="flex justify-between items-center group">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-app-text-muted tracking-widest mb-1">{dist.label}</h4>
                    <span className={`text-[10px] font-black ${dist.color} bg-current/10 px-2 py-0.5 rounded-md`}>{dist.share} do Saldo</span>
                  </div>
                  <span className={`text-xl font-black ${dist.color === 'text-emerald-500' ? 'text-2xl' : ''}`}>
                    {formatBRL(dist.value)}
                  </span>
                </div>
                {i < 2 && <div className="w-full h-px bg-app-border/50"></div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* HISTORIC TABLE */}
      <div className="bg-app-surface border border-app-border rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-8 py-6 border-b border-app-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-app-surface-2/50 backdrop-blur-md">
          <h3 className="text-xs font-black text-app-text-strong uppercase tracking-[0.3em]">Histórico de Lançamentos</h3>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'FINANCAS')} onArchive={() => onArchive(selection, 'FINANCAS', true)} onClear={onClearSelection} />
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={14} />
              <input
                type="text"
                placeholder="BUSCAR LANÇAMENTO..."
                className="w-full h-10 !bg-app-bg !border-app-border !text-app-text-strong !placeholder-app-text-muted !rounded-xl !pl-10 text-[10px] font-black uppercase tracking-widest"
              />
            </div>
            <button
              onClick={() => onAdd('FINANCAS')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
            >
              <Plus size={14} /> Novo Registo
            </button>
          </div>
        </div>

        <TableView
          tab="FINANCAS"
          data={data}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onArchive={onArchive}
          onAdd={undefined}
          selection={selection}
          onSelect={onSelect}
          onClearSelection={onClearSelection}
          activeCategory={activeRegMode}
          hideHeader={true}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "blue", onClick, active }: any) {
  const colors: any = { emerald: "text-emerald-500", rose: "text-rose-500", blue: "text-[#3B82F6]", orange: "text-orange-500", slate: "text-slate-400" };
  const borderColors: any = { emerald: "border-emerald-500/30 bg-emerald-500/5", rose: "border-rose-500/30 bg-rose-500/5", blue: "border-[#3B82F6]/30 bg-[#3B82F6]/5", orange: "border-orange-500/30 bg-orange-500/5", slate: "border-slate-400/30 bg-slate-400/5" };

  return (
    <div
      onClick={onClick}
      className={`p-4 md:p-6 rounded-2xl md:rounded-3xl border ${active ? borderColors[color] : 'bg-app-surface border-app-border'} flex flex-col gap-3 md:gap-4 transition-all ${onClick ? 'cursor-pointer hover:border-[#3B82F6]/20' : ''} shadow-xl group w-full`}
    >
      <div className="flex justify-between items-start">
        <span className={`text-[9px] font-black tracking-[0.2em] transition-colors uppercase flex-1 ${active ? 'text-app-text-strong' : 'text-app-text-muted group-hover:text-app-text-strong'}`}>{label}</span>
        {icon && <i className={`fa-solid ${icon} transition-colors shrink-0 ml-2 ${active ? colors[color] : 'text-[#334155] group-hover:text-[#3B82F6]'}`}></i>}
      </div>
      <p className={`text-2xl md:text-3xl font-black tracking-tighter leading-none break-all ${colors[color]}`}>{value}</p>
    </div>
  );
}

function SystematicModelingView({ activeClient, clients, onSelectClient, rdc, planning, library, data, onUpdate }: any) {
  const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const rows = SYSTEMATIC_MODELING_ROWS;

  const contentOptions = useMemo(() => {
    const list: string[] = [];
    if (!activeClient) return ["Selecionar conteúdo"];

    // RDC
    rdc.filter((r: any) => r.Cliente_ID === activeClient.id).forEach((r: any) => list.push(r['Ideia de Conteúdo']));
    // Planning
    planning.filter((p: any) => p.Cliente_ID === activeClient.id).forEach((p: any) => list.push(p.Conteúdo));

    return ["Selecionar conteúdo", ...Array.from(new Set(list))];
  }, [activeClient, rdc, planning]);

  const updateCell = (day: string, rowId: string, value: string) => {
    if (!activeClient) {
      alert("Selecione um cliente para editar.");
      return;
    }
    const clientData = { ... (data && data[activeClient.id] ? data[activeClient.id] : {}) };
    clientData[`${day}-${rowId}`] = value;
    onUpdate({ ... (data || {}), [activeClient.id]: clientData });
  };

  const counts = useMemo(() => {
    let hero = 0, hub = 0, help = 0;
    if (activeClient && data[activeClient.id]) {
      days.forEach(day => {
        const val = data[activeClient.id][`${day}-modelagem`];
        if (val === 'Hero') hero++;
        if (val === 'Hub') hub++;
        if (val === 'Help') help++;
      });
    }
    return { hero, hub, help };
  }, [data, activeClient, days]);



  return (
    <div className="bg-app-surface/40 border border-white/5 rounded-2xl md:rounded-[40px] p-4 md:p-10 backdrop-blur-xl animate-fade overflow-x-auto shadow-2xl relative">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-app-text-strong">Modelagem Sistemática</h2>
            <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest leading-none">Matriz Estratégica</p>
          </div>
          <div className="w-full sm:w-64">
            <InputSelect
              value={activeClient ? activeClient.id : ""}
              onChange={(val) => onSelectClient && onSelectClient(val)}
              options={clients?.map((c: any) => ({ value: c.id, label: c.Nome })) || []}
              placeholder="Selecione um Cliente"
              className="w-full text-[10px] font-bold uppercase bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="px-3 md:px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2">
            <span className="text-[9px] md:text-[10px] font-bold uppercase text-rose-500/70">Equilíbrio:</span>
            <span className="text-xs font-black text-rose-500">HERO: {counts.hero}</span>
          </div>
          <div className="px-3 md:px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center gap-2">
            <span className="text-[9px] md:text-[10px] font-bold uppercase text-blue-500/70">Equilíbrio:</span>
            <span className="text-xs font-black text-blue-500">HUB: {counts.hub}</span>
          </div>
          <div className="px-3 md:px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-2">
            <span className="text-[9px] md:text-[10px] font-bold uppercase text-emerald-500/70">Equilíbrio:</span>
            <span className="text-xs font-black text-emerald-500">HELP: {counts.help}</span>
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        <table className="w-full min-w-[1000px] border-separate border-spacing-x-4 border-spacing-y-2">
          <thead>
            <tr>
              <th className="text-left text-[11px] font-black uppercase tracking-[0.2em] text-app-text-muted pb-8 pl-4 w-[150px]">Atributo</th>
              {days.map(day => (
                <th key={day} className="text-center pb-8">
                  <div className="px-6 py-3 rounded-2xl bg-app-surface border border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-app-text-strong shadow-lg">
                    {day}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 py-4 pl-4">
                  {row.label}
                </td>
                {days.map(day => {
                  const value = (activeClient && data && data[activeClient.id]) ? (data[activeClient.id][`${day}-${row.id}`] || '') : '';
                  return (
                    <td key={`${day}-${row.id}`} className="py-2">
                      <div className="relative group">
                        {row.id === 'conteudo' ? (
                          <select
                            value={value}
                            onChange={(e) => updateCell(day, row.id, e.target.value)}
                            disabled={!activeClient}
                            className="w-full bg-app-bg/80 border border-white/5 rounded-[20px] px-5 py-3 text-[10px] font-bold text-gray-300 focus:text-app-text-strong focus:border-rose-500/30 outline-none appearance-none transition-all hover:bg-app-bg uppercase tracking-tight shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {contentOptions.map(opt => <option key={opt} value={opt} className="bg-app-surface">{opt}</option>)}
                          </select>
                        ) : (
                          <div className="relative">
                            <select
                              value={value}
                              onChange={(e) => updateCell(day, row.id, e.target.value)}
                              disabled={!activeClient}
                              className="w-full bg-app-surface/40 border border-transparent rounded-xl px-4 py-3 text-[10px] font-bold text-app-text-muted focus:text-app-text-strong focus:bg-app-bg/60 outline-none appearance-none cursor-pointer text-center uppercase transition-all hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="" className="bg-app-surface">-</option>
                              {(() => {
                                if (row.id === 'formato') {
                                  const selectedContent = activeClient && data && data[activeClient.id] ? data[activeClient.id][`${day}-conteudo`] : null;
                                  if (selectedContent) {
                                    const rdcItem = rdc.find((r: any) => r['Ideia de Conteúdo'] === selectedContent && r.Cliente_ID === activeClient.id);
                                    const planItem = planning.find((p: any) => p.Conteúdo === selectedContent && p.Cliente_ID === activeClient.id);
                                    const network = rdcItem?.Rede_Social || planItem?.Rede_Social;
                                    if (network && library[network]) return library[network].map((opt: any) => <option key={opt} value={opt} className="bg-app-surface">{opt}</option>);
                                  }
                                  return Object.values(library).flat().map((opt: any) => <option key={opt} value={opt} className="bg-app-surface">{opt}</option>);
                                }
                                return row.options?.map((opt: any) => <option key={opt} value={opt} className="bg-app-surface">{opt}</option>);
                              })()}
                            </select>
                            <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                              <i className="fa-solid fa-chevron-down text-[7px] text-gray-600"></i>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-6">
        {days.map(day => (
          <div key={day} className="bg-app-bg/50 border border-white/5 rounded-[32px] p-5 md:p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-[40px] rounded-full"></div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-app-text-strong mb-6 pl-2 border-l-4 border-blue-500">{day}</h3>
            <div className="space-y-5">
              {rows.map(row => {
                const value = (activeClient && data && data[activeClient.id]) ? (data[activeClient.id][`${day}-${row.id}`] || '') : '';
                return (
                  <div key={row.id}>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-app-text-muted block mb-2 ml-1">{row.label}</label>
                    {row.id === 'conteudo' ? (
                      <InputSelect
                        value={value}
                        onChange={(val) => updateCell(day, row.id, val)}
                        options={contentOptions.map(opt => ({ value: opt, label: opt }))}
                        className="w-full bg-app-surface border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-bold text-app-text-strong outline-none focus:border-blue-500/50 uppercase tracking-wide appearance-none"
                        placeholder="Selecione..."
                        label={row.label}
                      />
                    ) : (
                      <InputSelect
                        value={value}
                        onChange={(val) => updateCell(day, row.id, val)}
                        options={(() => {
                          if (row.id === 'formato') {
                            const selectedContent = activeClient && data && data[activeClient.id] ? data[activeClient.id][`${day}-conteudo`] : null;
                            if (selectedContent) {
                              const rdcItem = rdc.find((r: any) => r['Ideia de Conteúdo'] === selectedContent && r.Cliente_ID === activeClient.id);
                              const planItem = planning.find((p: any) => p.Conteúdo === selectedContent && p.Cliente_ID === activeClient.id);
                              const network = rdcItem?.Rede_Social || planItem?.Rede_Social;
                              if (network && library[network]) return library[network].map((opt: any) => ({ value: opt, label: opt }));
                            }
                            return Object.values(library).flat().map((opt: any) => ({ value: opt, label: opt }));
                          }
                          return row.options?.map((opt: any) => ({ value: opt, label: opt })) || [];
                        })()}
                        className="w-full bg-app-surface border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-bold text-app-text-strong outline-none focus:border-blue-500/50 uppercase tracking-wide appearance-none"
                        placeholder="-"
                        label={row.label}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardView({ clients, tasks, financas, planejamento, rdc }: any) {
  const stats = useMemo(() => {
    const activeClients = (clients || []).filter((c: any) => c.Status === 'Ativo').length;
    const pendingPlanning = (planejamento || []).filter((p: any) => p['Status do conteúdo'] !== 'Concluído').length;
    const pendingTasks = (tasks || []).filter((t: any) => t.Status !== 'done' && t.Status !== 'arquivado').length;
    const revenue = (financas || []).filter((f: any) => f.Tipo === 'Entrada').reduce((acc: number, cur: any) => acc + (cur.Valor || 0), 0);
    return { activeClients, pendingPlanning, pendingTasks, revenue };
  }, [clients, tasks, planejamento, financas]);

  return (
    <div className="pb-10 space-y-6 md:space-y-8 animate-fade text-left mobile-container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label="Receita Bruta" value={`R$ ${stats.revenue.toLocaleString('pt-BR')}`} icon="fa-money-bill-trend-up" color="emerald" />
        <StatCard label="Contratos Ativos" value={stats.activeClients} icon="fa-users" color="blue" />
        <StatCard label="Produção Ativa" value={stats.pendingPlanning} icon="fa-calendar-check" color="orange" />
        <StatCard label="Sprint Pendente" value={stats.pendingTasks} icon="fa-list-check" color="rose" />
      </div>
      <Card title="Operações Globais" className="w-full">
        <div className="p-8 h-[300px] md:h-[350px] flex items-center justify-center opacity-30">
          <i className="fa-solid fa-chart-simple text-4xl mr-4"></i>
          <span className="font-black uppercase tracking-widest text-center">Painel Consolidado</span>
        </div>
      </Card>

    </div>
  );
}

function TaskFlowView({ tasks, clients, collaborators, activeViewId, setActiveViewId, onUpdate, onDelete, onArchive, onAdd, onSelectTask, selection, onSelect, onClearSelection }: any) {
  const [globalSearch, setGlobalSearch] = useState('');
  const filteredTasks = useMemo(() => tasks.filter((t: any) => (!globalSearch || t.Título.toLowerCase().includes(globalSearch.toLowerCase())) && t.Status !== 'arquivado'), [tasks, globalSearch]);

  const viewType = useMemo(() => DEFAULT_TASK_VIEWS.find(v => v.id === activeViewId)?.type || 'List', [activeViewId]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPriorityInfo = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'baixa': return { color: 'text-emerald-500 bg-emerald-500/10', icon: 'fa-flag' };
      case 'média':
      case 'media': return { color: 'text-amber-500 bg-amber-500/10', icon: 'fa-flag' };
      case 'alta': return { color: 'text-rose-500 bg-rose-500/10', icon: 'fa-flag' };
      case 'urgente': return { color: 'text-purple-500 bg-purple-500/10', icon: 'fa-bolt' };
      default: return { color: 'text-zinc-500 bg-zinc-500/10', icon: 'fa-flag' };
    }
  };

  return (
    <div className="flex flex-col h-full pointer-events-auto text-left">
      {/* TOP BAR */}
      <div className="px-6 py-4 border-b border-app-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-app-surface-2/50 backdrop-blur-md rounded-t-[32px] shrink-0">

        {/* View Toggles */}
        <div className="flex bg-app-bg border border-app-border rounded-lg p-1">
          {DEFAULT_TASK_VIEWS.map((v: any) => (
            <button
              key={v.id}
              onClick={() => setActiveViewId(v.id)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${activeViewId === v.id ? 'bg-app-surface text-app-text-strong shadow-lg border border-app-border' : 'text-app-text-muted hover:text-app-text-strong'}`}
            >
              {v.type === 'List' ? <List size={14} /> : v.type === 'Board' ? <LayoutGrid size={14} /> : <LucideCalendar size={14} />}
              {v.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-app-text-muted" size={16} />
            <input
              type="text"
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              placeholder="Filtro global..."
              className="w-full h-10 !bg-app-bg !border-app-border !text-app-text-strong !placeholder-app-text-muted !rounded-xl !pl-10 text-[11px] font-bold uppercase tracking-widest"
            />
          </div>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border rounded-xl text-[10px] font-black uppercase text-app-text-muted hover:text-app-text-strong transition-all">
              <Filter size={14} /> Filtros
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-app-surface border border-app-border rounded-xl text-[10px] font-black uppercase text-app-text-muted hover:text-app-text-strong transition-all">
              <ArrowUpDown size={14} /> Ordenar
            </button>
          </div>

          {/* Deletion Bar integration */}
          <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'TAREFAS')} onArchive={() => onArchive(selection, 'TAREFAS', true)} onClear={onClearSelection} />
          {/* New Task Button */}
          <button
            onClick={() => onAdd('TAREFAS')}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all whitespace-nowrap"
          >
            <Plus size={16} /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden p-6 bg-app-bg/50 rounded-b-[32px]">

        {viewType === 'Board' && (
          <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar-horizontal">
            {DEFAULT_TASK_STATUSES.map(status => (
              <div key={status.id} className="w-[320px] flex flex-col max-h-full shrink-0">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                    <h3 className="text-[11px] font-black text-app-text-strong uppercase tracking-[0.2em]">{status.label}</h3>
                    <span className="text-[10px] font-black text-app-text-muted bg-app-surface-2 px-2 py-0.5 rounded-full">
                      {filteredTasks.filter(t => t.Status === status.id).length}
                    </span>
                  </div>
                  <button onClick={() => onAdd('TAREFAS', { Status: status.id })} className="text-app-text-muted hover:text-blue-500 transition-colors"><Plus size={16} /></button>
                </div>

                {/* Column Tasks Area */}
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 pb-2">
                  {filteredTasks.filter(t => t.Status === status.id).map(task => {
                    const client = clients.find((c: any) => c.id === task.Cliente_ID);
                    const prio = getPriorityInfo(task.Prioridade);

                    return (
                      <div
                        key={task.id} onClick={() => onSelectTask(task.id)}
                        className={`bg-app-surface border border-app-border p-4 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500/30 cursor-pointer transition-all group flex flex-col gap-3 relative overflow-hidden ${selection.includes(task.id) ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}
                      >
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: status.color }} />

                        {/* Top row: Client Tag & Priority */}
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-black uppercase tracking-widest text-app-text-muted truncate max-w-[180px]">
                            {client?.Nome || 'Agência'}
                          </span>
                          <div className={`p-1 rounded flex items-center justify-center ${prio.color}`}>
                            <i className={`fa-solid ${prio.icon} text-[10px]`}></i>
                          </div>
                        </div>

                        {/* Title */}
                        <h4 className="text-sm font-bold text-app-text-strong leading-snug group-hover:text-blue-500 transition-colors uppercase tracking-tight">
                          {task.Título}
                        </h4>

                        {/* Bottom Row: Date, Comments, Assignee */}
                        <div className="flex items-center justify-between mt-1 pt-3 border-t border-app-border/50">
                          <div className="flex items-center gap-3 text-[10px] font-bold text-app-text-muted uppercase tracking-tight">
                            <span className="flex items-center gap-1.5"><Clock size={12} /> {task.Data_Entrega || '--/--'}</span>
                            {task.Comentarios?.length > 0 && <span className="flex items-center gap-1.5"><MessageSquare size={12} /> {task.Comentarios.length}</span>}
                          </div>
                          <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-black border border-blue-500/20 group-hover:ring-4 group-hover:ring-blue-500/10 transition-all">
                            {task.Responsável?.slice(0, 1).toUpperCase() || '?'}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => onAdd('TAREFAS', { Status: status.id })}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] font-black text-app-text-muted hover:text-app-text-strong hover:bg-app-surface-2 rounded-xl border border-dashed border-app-border hover:border-app-border-strong transition-all uppercase tracking-widest"
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewType === 'List' && (
          <div className="h-full overflow-y-auto custom-scrollbar pb-32 space-y-6">
            {DEFAULT_TASK_STATUSES.map(status => {
              const statusTasks = filteredTasks.filter(t => t.Status === status.id);
              if (statusTasks.length === 0) return null;

              return (
                <div key={status.id} className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                    <h3 className="text-[11px] font-black text-app-text-strong uppercase tracking-[0.2em]">{status.label}</h3>
                    <span className="text-[10px] font-black text-app-text-muted bg-app-surface-2 px-2 py-0.5 rounded-full">{statusTasks.length}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {statusTasks.map(task => {
                      const client = clients.find((c: any) => c.id === task.Cliente_ID);
                      const prio = getPriorityInfo(task.Prioridade);
                      return (
                        <div
                          key={task.id}
                          onClick={() => onSelectTask(task.id)}
                          className={`flex items-center gap-6 p-4 bg-app-surface border border-app-border rounded-2xl hover:border-blue-500/50 cursor-pointer transition-all group ${selection.includes(task.id) ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}
                        >
                          <div className="flex items-center justify-center w-5 h-5 rounded border border-app-border group-hover:border-blue-500/50 bg-app-bg transition-all" onClick={e => { e.stopPropagation(); onSelect(task.id); }}>
                            <input type="checkbox" checked={selection.includes(task.id)} readOnly className="w-3 h-3 text-blue-500 rounded focus:ring-0 bg-transparent border-none" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black text-app-text-muted uppercase tracking-widest block mb-1 leading-none">{client?.Nome || 'Agência'}</span>
                            <h5 className="text-sm font-bold text-app-text-strong uppercase truncate group-hover:text-blue-500 transition-colors">{task.Título}</h5>
                          </div>

                          <div className="flex items-center gap-10 shrink-0">
                            <div className="flex items-center gap-2 w-28">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prio.color}`}>
                                <i className={`fa-solid ${prio.icon} text-[10px]`}></i>
                              </div>
                              <span className="text-[10px] font-black uppercase text-app-text-muted tracking-tight">{task.Prioridade}</span>
                            </div>

                            <div className="flex items-center gap-3 w-32 border-l border-app-border/50 pl-6">
                              <Clock size={12} className="text-app-text-muted" />
                              <span className="text-[10px] font-black uppercase text-app-text-muted tracking-tight">{task.Data_Entrega || '--/--'}</span>
                            </div>

                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-black border border-blue-500/20">
                              {task.Responsável?.slice(0, 1).toUpperCase() || '?'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewType === 'Calendar' && (
          <div className="h-full bg-app-surface/30 border border-app-border rounded-[32px] p-8 shadow-2xl overflow-hidden relative">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
              initialView={isMobile ? "listWeek" : "dayGridMonth"}
              events={filteredTasks.filter(t => t.Data_Entrega).map(t => {
                const client = clients.find((c: any) => c.id === t.Cliente_ID);
                return {
                  id: t.id,
                  title: t.Título,
                  start: t.Data_Entrega + (t.Hora_Entrega ? `T${t.Hora_Entrega}` : ''),
                  backgroundColor: client?.['Cor (HEX)'] || '#3B82F6',
                  borderColor: 'transparent',
                  extendedProps: { ...t, clientName: client?.Nome || 'Agência' }
                };
              })}
              height="100%"
              locale="pt-br"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,listWeek' }}
              dayMaxEvents={3}
              eventClick={(info) => onSelectTask(info.event.id)}
              editable={true}
              eventDrop={(info) => {
                onUpdate(info.event.id, 'TAREFAS', 'Data_Entrega', info.event.startStr.split('T')[0]);
                if (info.event.startStr.includes('T')) {
                  onUpdate(info.event.id, 'TAREFAS', 'Hora_Entrega', info.event.startStr.split('T')[1].slice(0, 5));
                }
              }}
              eventContent={(eventInfo) => {
                const ep = eventInfo.event.extendedProps;
                const bgColor = eventInfo.event.backgroundColor || '#3B82F6';
                const isDone = ep.Status === 'done';

                return (
                  <div className={`p-2 rounded-xl border border-app-border bg-app-surface/90 hover:border-blue-500 cursor-pointer transition-all relative overflow-hidden group/event w-full h-full shadow-sm ${isDone ? 'opacity-50' : ''}`}>
                    <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r-xl" style={{ backgroundColor: bgColor }} />

                    <div className="flex justify-between items-center mb-1 pl-1.5">
                      <span className="flex items-center gap-1 text-[9px] text-app-text-muted font-bold uppercase tracking-tight">
                        <Clock size={10} /> {ep.Hora_Entrega || '--:--'}
                      </span>
                    </div>

                    <div className="pl-1.5">
                      <p className={`text-[11px] font-bold leading-tight truncate uppercase ${isDone ? 'text-app-text-muted line-through' : 'text-app-text-strong'}`}>
                        {eventInfo.event.title}
                      </p>
                      <p className="text-[9px] font-black text-app-text-muted uppercase tracking-widest mt-1 truncate">
                        {ep.clientName}
                      </p>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar-horizontal::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar-horizontal::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-horizontal::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.05); border-radius: 20px; }
        .custom-scrollbar-horizontal:hover::-webkit-scrollbar-thumb { background-color: rgba(255,255,255,0.1); }
      `}} />
    </div>
  );
}

function TaskDetailPanel({ taskId, tasks, clients, collaborators, onClose, onUpdate, onArchive, onDelete, onAdd, viewMode, setViewMode }: any) {
  const t = tasks.find((task: Task) => task.id === taskId);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [activityTab, setActivityTab] = useState<'atividade' | 'links' | 'mais'>('atividade');
  const [comment, setComment] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!t) return null;

  const updateChecklist = (items: TaskChecklistItem[]) => onUpdate(t.id, 'TAREFAS', 'Checklist', items);
  const updateTags = (tags: string[]) => onUpdate(t.id, 'TAREFAS', 'Tags', tags);
  const updateAttachments = (anexos: TaskAttachment[]) => onUpdate(t.id, 'TAREFAS', 'Anexos', anexos);

  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newAnexos = [...(t.Anexos || [])];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
          alert(`Arquivo ${file.name} excede o limite de 20MB.`);
          continue;
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAnexos.push({
          id: generateId(),
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          data: base64,
          createdAt: new Date().toISOString()
        });
      }
      updateAttachments(newAnexos);
    } catch (err) {
      console.error(err);
      alert("Falha no upload de alguns arquivos.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleAddComment = () => {
    if (!comment.trim()) return;
    const newComment = {
      id: generateId(),
      Task_ID: t.id,
      Autor: 'Você', // In a real app, this would be the logged-in user
      Texto: comment,
      Data: new Date().toISOString()
    };
    onUpdate(t.id, 'TAREFAS', 'Comentarios', [...(t.Comentarios || []), newComment]);

    // Also log as activity
    const newActivity = {
      id: generateId(),
      type: 'comment',
      user: 'Você',
      message: `Comentou: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
      timestamp: new Date().toISOString()
    };
    onUpdate(t.id, 'TAREFAS', 'Activities', [...(t.Activities || []), newActivity]);

    setComment('');
  };

  const client = clients.find((c: any) => c.id === t.Cliente_ID);

  return (
    <div className="flex flex-col h-full bg-app-surface text-left overflow-hidden">
      {/* PANEL HEADER */}
      <div className="h-20 px-8 border-b border-app-border flex items-center justify-between bg-app-surface-2/30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Box size={20} />
          </div>
          <div>
            <div className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] mb-0.5 leading-none">
              {client?.Nome || 'Agência'} • {t.Task_ID}
            </div>
            <h3 className="text-sm font-black text-app-text-strong uppercase tracking-tight">Detalhes da Tarefa</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Modes */}
          <div className="flex bg-app-bg p-1 rounded-lg border border-app-border mr-2 hidden md:flex">
            <button onClick={() => setViewMode('sidebar')} className={`p-1.5 rounded transition-all ${viewMode === 'sidebar' ? 'bg-app-surface text-blue-500 shadow-sm' : 'text-app-text-muted hover:text-app-text-strong'}`}><LayoutGrid size={14} /></button>
            <button onClick={() => setViewMode('modal')} className={`p-1.5 rounded transition-all ${viewMode === 'modal' ? 'bg-app-surface text-blue-500 shadow-sm' : 'text-app-text-muted hover:text-app-text-strong'}`}><ExternalLink size={14} /></button>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-xl bg-app-bg border border-app-border flex items-center justify-center text-app-text-muted hover:text-app-text-strong hover:border-app-border-strong transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
        {/* TASK TITLE */}
        <section>
          <label className="text-[10px] font-black text-app-text-muted uppercase tracking-[0.2em] block mb-3 ml-1">Título</label>
          <input
            className="w-full text-2xl font-black text-app-text-strong bg-transparent border-none p-0 focus:ring-0 uppercase tracking-tight placeholder-app-text-muted/30"
            value={t.Título}
            onChange={e => onUpdate(t.id, 'TAREFAS', 'Título', e.target.value, true)}
            onBlur={e => onUpdate(t.id, 'TAREFAS', 'Título', e.target.value)}
            placeholder="NOME DA TAREFA"
          />
        </section>

        {/* METRICS GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex flex-col gap-1 hover:border-blue-500/30 transition-colors">
            <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
              <HistoryIcon size={10} className="text-blue-500" /> Status
            </label>
            <select
              value={t.Status}
              onChange={e => onUpdate(t.id, 'TAREFAS', 'Status', e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-app-text-strong uppercase focus:ring-0 p-0 cursor-pointer"
            >
              {DEFAULT_TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex flex-col gap-1 hover:border-rose-500/30 transition-colors">
            <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
              <ShieldAlert size={10} className="text-rose-500" /> Prioridade
            </label>
            <select
              value={t.Prioridade}
              onChange={e => onUpdate(t.id, 'TAREFAS', 'Prioridade', e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-app-text-strong uppercase focus:ring-0 p-0 cursor-pointer"
            >
              {PRIORIDADE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex flex-col gap-1 hover:border-emerald-500/30 transition-colors">
            <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
              <User size={10} className="text-emerald-500" /> Responsável
            </label>
            <select
              value={t.Responsável}
              onChange={e => onUpdate(t.id, 'TAREFAS', 'Responsável', e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-app-text-strong uppercase focus:ring-0 p-0 cursor-pointer"
            >
              <option value="">Sem Resp.</option>
              {collaborators.map((c: any) => <option key={c.id} value={c.Nome}>{c.Nome}</option>)}
            </select>
          </div>
          <div className="bg-app-bg/50 border border-app-border rounded-2xl p-4 flex flex-col gap-1 hover:border-indigo-500/30 transition-colors">
            <label className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.1em] flex items-center gap-1.5">
              <Clock size={10} className="text-indigo-500" /> Entrega
            </label>
            <input
              type="date"
              value={t.Data_Entrega || ''}
              onChange={e => onUpdate(t.id, 'TAREFAS', 'Data_Entrega', e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold text-app-text-strong uppercase focus:ring-0 p-0 cursor-pointer"
            />
          </div>
        </div>

        {/* DESCRIPTION */}
        <section>
          <div className="flex items-center justify-between mb-4 border-b border-app-border pb-2">
            <h4 className="text-[10px] font-black uppercase text-app-text-strong tracking-[0.2em] flex items-center gap-2">
              <FileText size={14} className="text-blue-500" /> Descrição Estratégica
            </h4>
          </div>
          <textarea
            className="w-full h-32 bg-app-bg border border-app-border rounded-2xl p-5 text-[11px] font-bold text-app-text-strong uppercase leading-relaxed outline-none focus:border-blue-500/50 transition-all custom-scrollbar placeholder-app-text-muted/20"
            value={t.Descrição || ''}
            onChange={e => onUpdate(t.id, 'TAREFAS', 'Descrição', e.target.value, true)}
            onBlur={e => onUpdate(t.id, 'TAREFAS', 'Descrição', e.target.value)}
            placeholder="DESCREVA OS DETALHES TÁTICOS, LINKS E PAUTAS..."
          />
        </section>

        {/* CHECKLIST */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-app-border pb-2">
            <h4 className="text-[10px] font-black uppercase text-app-text-strong tracking-[0.2em] flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" /> Etapas de Execução
            </h4>
            <span className="text-[10px] font-black text-app-text-muted bg-app-surface-2 px-3 py-1 rounded-full uppercase tracking-widest">
              {t.Checklist?.filter(i => i.completed).length || 0} / {t.Checklist?.length || 0}
            </span>
          </div>
          <div className="space-y-4 px-2">
            {t.Checklist?.map(item => (
              <div key={item.id} className="flex items-center gap-4 group">
                <button
                  onClick={() => updateChecklist(t.Checklist.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i))}
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-app-border bg-app-bg text-transparent'}`}
                >
                  <Plus size={14} className={item.completed ? 'rotate-45' : ''} />
                </button>
                <span className={`text-[11px] font-black uppercase tracking-tight transition-all flex-1 ${item.completed ? 'opacity-30 line-through' : 'text-app-text-strong'}`}>
                  {item.text}
                </span>
                <button onClick={() => updateChecklist(t.Checklist.filter(i => i.id !== item.id))} className="opacity-0 group-hover:opacity-100 text-app-text-muted hover:text-rose-500 transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <input
                value={newCheckItem}
                onChange={e => setNewCheckItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (() => { if (!newCheckItem.trim()) return; updateChecklist([...(t.Checklist || []), { id: generateId(), text: newCheckItem.toUpperCase(), completed: false }]); setNewCheckItem(''); })()}
                placeholder="NOVA ETAPA..."
                className="flex-1 h-11 bg-app-bg border border-app-border rounded-xl px-4 text-[11px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all"
              />
              <button
                onClick={() => { if (!newCheckItem.trim()) return; updateChecklist([...(t.Checklist || []), { id: generateId(), text: newCheckItem.toUpperCase(), completed: false }]); setNewCheckItem(''); }}
                className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* ATTACHMENTS */}
        <section>
          <div className="flex items-center justify-between mb-6 border-b border-app-border pb-2">
            <h4 className="text-[10px] font-black uppercase text-app-text-strong tracking-[0.2em] flex items-center gap-2">
              <ImageIcon size={14} className="text-orange-500" /> Ativos e Mídia
            </h4>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 transition-colors flex items-center gap-2"
            >
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} /> Upload</>}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {(t.Anexos || []).map(file => (
              <div key={file.id} className="group relative aspect-video rounded-2xl overflow-hidden bg-app-bg border border-app-border hover:border-blue-500/30 transition-all">
                <img src={file.data} alt={file.filename} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-[2px]">
                  <button onClick={() => setLightboxImage(file.data)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-all"><Eye size={18} /></button>
                  <button onClick={() => updateAttachments((t.Anexos || []).filter(a => a.id !== file.id))} className="w-10 h-10 rounded-full bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center backdrop-blur-md transition-all"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
            {(!t.Anexos || t.Anexos.length === 0) && (
              <div className="col-span-2 border-2 border-dashed border-app-border rounded-3xl py-12 flex flex-col items-center justify-center gap-4 text-app-text-muted group hover:border-blue-500/30 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-14 h-14 rounded-full bg-app-bg flex items-center justify-center border border-app-border group-hover:scale-110 transition-transform"><ImageIcon size={24} /></div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest">Arraste Ativos Aqui</p>
                  <p className="text-[8px] font-bold uppercase opacity-50 mt-1">Imagens até 20MB</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ACTIVITY & COMMENTS */}
        <section className="space-y-6 pt-4 border-t border-app-border">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase text-app-text-strong tracking-[0.2em] flex items-center gap-2">
              <MessageSquare size={14} className="text-purple-500" /> Atividade e Timeline
            </h4>
          </div>

          <div className="space-y-6">
            {(t.Activities || []).map(act => (
              <div key={act.id} className="flex gap-4 group">
                <div className="w-8 h-8 rounded-xl bg-app-bg border border-app-border flex items-center justify-center shrink-0">
                  {act.type === 'comment' ? <MessageSquare size={12} className="text-purple-500" /> : <Zap size={12} className="text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-black text-app-text-strong uppercase tracking-tight">{act.user}</span>
                    <span className="text-[8px] font-bold text-app-text-muted uppercase">{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-[11px] font-bold text-app-text-muted leading-relaxed uppercase tracking-tight">{act.message}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="ESCREVA UM COMENTÁRIO..."
              className="w-full bg-app-bg border border-app-border rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest placeholder-app-text-muted/30 outline-none focus:border-purple-500/50 transition-all min-h-[80px]"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={handleAddComment}
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/10"
              >
                Publicar Comentário
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="px-8 py-6 border-t border-app-border bg-app-surface-2/30 flex gap-3">
        <button
          onClick={() => { onArchive([t.id], 'TAREFAS', !t.__archived); onClose(); }}
          className="flex-1 h-12 rounded-xl border border-app-border bg-app-bg text-app-text-muted hover:text-app-text-strong hover:bg-app-surface transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Box size={16} /> {t.__archived ? 'RESTAURAR' : 'ARQUIVAR'}
        </button>
        <button
          onClick={() => { if (window.confirm("EXCLUIR DEFINITIVAMENTE?")) { onDelete([t.id], 'TAREFAS'); onClose(); } }}
          className="flex-1 h-12 rounded-xl border border-app-border bg-app-bg text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/5 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Trash2 size={16} /> EXCLUIR
        </button>
        <button
          onClick={onClose}
          className="flex-[1.5] h-12 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/10"
        >
          <CheckCircle2 size={16} /> FINALIZAR
        </button>
      </div>

      {/* LIGHTBOX */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[3000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-10 animate-fade" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-10 right-10 text-white opacity-50 hover:opacity-100 transition-opacity"><X size={32} /></button>
          <img src={lightboxImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function VhManagementView({ config, setConfig, collaborators, setCollaborators, clients, tasks, finances }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'CONFIG' | 'CLIENTES' | 'DASHBOARD'>('DASHBOARD');
  const [viewMode, setViewMode] = useState<'CLIENT' | 'COLLABORATOR'>('CLIENT');
  const [simParams, setSimParams] = useState({ clientId: '', collaboratorId: '', hours: 0 });

  // ==========================================
  // FUNÇÕES DE SEGURANÇA (Previnem a Tela Branca)
  // ==========================================

  // Impede divisão por zero no cálculo do valor hora
  const calcVH = (custo: number, proLabore: number, horas: number) => {
    const h = Number(horas);
    if (isNaN(h) || h <= 0) return 0;
    const totalCost = (Number(custo) || 0) + (Number(proLabore) || 0);
    return totalCost / h;
  };

  // Garante que a largura (width) do CSS nunca será "NaN%" ou "Infinity%"
  const getSafeWidth = (value: number, total: number) => {
    const numValue = Number(value) || 0;
    const numTotal = Number(total) || 1; // Impede divisão por zero
    let percent = (numValue / numTotal) * 100;
    if (!isFinite(percent) || isNaN(percent)) percent = 0;
    return Math.max(0, Math.min(100, percent)); // Prende o valor entre 0 e 100
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORE CALCULATIONS (MEMOIZED)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const vhResults = useMemo(() => {
    // 0. Safety guards
    const safeCollaborators = Array.isArray(collaborators) ? collaborators : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const safeClients = Array.isArray(clients) ? clients : [];
    const safeFinances = Array.isArray(finances) ? finances : [];

    // 1. Calculate VH for each collaborator
    const collabVHs = safeCollaborators.map((c: Collaborator) => {
      const costs = parseNumericValue(c.CustosIndividuais);
      const profit = parseNumericValue(c.ProLabore);
      const hours = parseNumericValue(c.HorasProdutivas);

      // Cálculo Dinâmico de VH Seguro
      const calculatedVh = calcVH(costs, profit, hours);

      return { ...c, calculatedVh };
    });

    // 2. Sum hours from Fluxo de Tarefas
    const taskHoursMap: Record<string, { total: number; manual: boolean }> = {};
    safeTasks.forEach((t: Task) => {
      if (!t || t.Status === 'arquivado') return;
      const key = `${t.Cliente_ID}-${t.Responsável}`;
      const hours = parseNumericValue(t.Tempo_Gasto_H);
      if (!taskHoursMap[key]) taskHoursMap[key] = { total: 0, manual: false };
      taskHoursMap[key].total += hours;
    });

    // 3. Profitability Data
    const profitability = safeClients.map((client: Client) => {
      const clientTasks = safeTasks.filter(t => t && t.Cliente_ID === client.id && t.Status !== 'arquivado');
      const clientHours = clientTasks.reduce((acc, t) => acc + parseNumericValue(t.Tempo_Gasto_H), 0);

      // Calculate real cost based on who did what
      let totalCost = 0;
      const breakdown: any[] = [];

      clientTasks.forEach(t => {
        const collab = collabVHs.find(cv => cv.Nome === t.Responsável);
        const vh = collab ? collab.calculatedVh : 0;
        const hours = parseNumericValue(t.Tempo_Gasto_H);
        const cost = hours * vh;
        totalCost += cost;

        const existing = breakdown.find(b => b.name === t.Responsável);
        if (existing) {
          existing.hours += hours;
          existing.cost += cost;
        } else {
          breakdown.push({ name: t.Responsável || 'Indefinido', hours, cost });
        }
      });

      // Get billing from Finances (Entradas for this client)
      const billing = safeFinances
        .filter((f: FinancasLancamento) => f && f.Cliente_ID === client.id && f.Tipo === 'Entrada')
        .reduce((acc: number, f: FinancasLancamento) => acc + parseNumericValue(f.Valor), 0);

      return {
        id: client.id,
        name: client.Nome,
        hours: clientHours,
        cost: totalCost,
        billing: billing,
        result: billing - totalCost,
        breakdown
      };
    });

    const totalHours = profitability.reduce((acc, p) => acc + p.hours, 0);
    const totalCost = profitability.reduce((acc, p) => acc + p.cost, 0);
    const avgVh = collabVHs.length > 0
      ? collabVHs.reduce((acc, c) => acc + c.calculatedVh, 0) / collabVHs.length
      : 0;
    const deficitClients = profitability.filter(p => p.result < 0).length;

    return { collabVHs, profitability, totalHours, totalCost, avgVh, deficitClients };
  }, [collaborators, tasks, clients, finances]);

  const handleUpdateCollab = (id: string, field: string, value: any) => {
    setCollaborators((prev: Collaborator[]) => prev.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleAddCollab = () => {
    const newCollab: Collaborator = {
      id: generateId(),
      Nome: 'Novo Colaborador',
      Cargo: 'Editor/Designer',
      CustosIndividuais: 0,
      ProLabore: 0,
      HorasProdutivas: 160
    };
    setCollaborators((prev: Collaborator[]) => [...prev, newCollab]);
  };

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SIMULATOR LOGIC
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const simResult = useMemo(() => {
    if (!simParams.clientId || !simParams.collaboratorId) return null;
    const client = vhResults.profitability.find(p => p.id === simParams.clientId);
    const collab = vhResults.collabVHs.find(c => c.id === simParams.collaboratorId);
    if (!client || !collab) return null;

    const additionalCost = simParams.hours * collab.calculatedVh;
    const newCost = client.cost + additionalCost;
    const newResult = client.billing - newCost;
    const newMargin = client.billing > 0 ? (newResult / client.billing) * 100 : 0;

    return { newCost, newResult, newMargin, diff: additionalCost };
  }, [simParams, vhResults]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade text-left pb-20 max-w-7xl mx-auto px-4 md:px-0">

      {/* NAVEGAÇÃO DE SUB-ABAS (Pills) */}
      <div className="flex justify-center mb-10 mt-4">
        <div className="inline-flex bg-app-surface border border-app-border p-1.5 rounded-2xl shadow-2xl transition-colors">
          {[
            { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'CLIENTES', label: 'Gestão por Cliente', icon: Briefcase },
            { id: 'CONFIG', label: 'Equipe & Custos', icon: Users }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeSubTab === t.id ? 'bg-[#3B82F6] text-white shadow-lg shadow-blue-500/20' : 'text-[#4B5563] hover:text-app-text-muted'}`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================
          VIEW: DASHBOARD
          ========================================= */}
      {activeSubTab === 'DASHBOARD' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-app-surface border border-app-border p-6 rounded-[2rem] shadow-xl flex flex-col justify-between transition-colors group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4B5563]">VH Médio Agência</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/5"><DollarSign size={18} /></div>
              </div>
              <span className="text-4xl font-black text-blue-500 relative z-10">{formatBRL(vhResults.avgVh)}</span>
            </div>

            <div className="bg-app-surface border border-app-border p-6 rounded-[2rem] shadow-xl flex flex-col justify-between transition-colors group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4B5563]">Horas Operadas</span>
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/5"><Clock size={18} /></div>
              </div>
              <span className="text-4xl font-black text-app-text-strong relative z-10">{vhResults.totalHours.toFixed(1)}<span className="text-xl text-app-text-muted ml-1 uppercase font-bold tracking-tighter">h</span></span>
            </div>

            <div className="bg-app-surface border border-app-border p-6 rounded-[2rem] shadow-xl flex flex-col justify-between transition-colors group relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#4B5563]">Custo Operacional</span>
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/5"><Activity size={18} /></div>
              </div>
              <span className="text-4xl font-black text-app-text-strong relative z-10">{formatBRL(vhResults.totalCost)}</span>
            </div>

            <div className={`border p-6 rounded-[2rem] shadow-xl flex flex-col justify-between transition-colors group relative overflow-hidden ${vhResults.deficitClients > 0 ? 'bg-rose-500/5 border-rose-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
              <div className={`absolute -right-4 -top-4 w-32 h-32 rounded-full blur-3xl pointer-events-none ${vhResults.deficitClients > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}></div>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] ${vhResults.deficitClients > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>Foco de Risco</span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${vhResults.deficitClients > 0 ? 'bg-rose-500/10 text-rose-500 animate-pulse shadow-rose-500/5' : 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5'}`}>
                  {vhResults.deficitClients > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                </div>
              </div>
              <div className="relative z-10">
                <span className={`text-4xl font-black ${vhResults.deficitClients > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{vhResults.deficitClients}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ml-3 ${vhResults.deficitClients > 0 ? 'text-rose-500/70' : 'text-emerald-500/70'}`}>
                  {vhResults.deficitClients === 1 ? 'Cliente no vermelho' : 'Clientes no vermelho'}
                </span>
              </div>
            </div>
          </div>

          {/* Gráficos em Lista */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card title="Custo e VH por Colaborador">
              <div className="p-8 space-y-6 min-h-[400px]">
                <div className="h-[250px] mb-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={vhResults.collabVHs}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} opacity={0.3} />
                      <XAxis dataKey="Nome" stroke="#4B5563" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#4B5563" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1F2937', borderRadius: '16px', fontSize: '12px' }} />
                      <Bar dataKey="calculatedVh" name="VH Calculado" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  {vhResults.collabVHs.slice(0, 3).map((item, idx) => {
                    const widthCSS = getSafeWidth(item.calculatedVh, vhResults.avgVh || 1);
                    return (
                      <div key={idx} className="group">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-app-text-strong">{item.Nome}</span>
                          <span className="text-xs font-black text-blue-500">VH: {formatBRL(item.calculatedVh)}/h</span>
                        </div>
                        <div className="w-full bg-app-surface border border-app-border rounded-full h-1.5 overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${widthCSS}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card title="Margem de Lucratividade por Cliente">
              <div className="p-8 space-y-6">
                <div className="space-y-6">
                  {vhResults.profitability.sort((a, b) => b.result - a.result).map((c, idx) => {
                    const lucro = c.result;
                    const margem = c.billing > 0 ? (lucro / c.billing) * 100 : 0;
                    const isNegativo = lucro < 0;

                    return (
                      <div key={idx} className="group p-5 bg-app-bg/20 border border-app-border rounded-2xl hover:bg-app-bg/40 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs font-black text-app-text-strong uppercase tracking-tight truncate pr-4">{c.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold text-[#4B5563] uppercase tracking-widest">{c.hours.toFixed(1)}h consumidas</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-black font-mono ${isNegativo ? 'text-rose-500' : 'text-emerald-500'}`}>{formatBRL(lucro)}</span>
                            <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${isNegativo ? 'text-rose-500/50' : 'text-emerald-500/50'}`}>Resultado</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-app-surface border border-app-border rounded-full h-2 overflow-hidden flex">
                            {/* Barra de Custo vs Lucro (Visualização protegida) */}
                            <div className="bg-amber-400 h-2" style={{ width: `${getSafeWidth(c.cost, c.billing)}%` }}></div>
                            {!isNegativo && <div className="bg-emerald-500 h-2" style={{ width: `${getSafeWidth(lucro, c.billing)}%` }}></div>}
                            {isNegativo && <div className="bg-rose-500 h-2 w-full" style={{ width: '100%' }}></div>}
                          </div>
                          <span className={`text-[10px] font-black w-14 text-right tracking-tighter ${isNegativo ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {getSafeWidth(lucro, c.billing).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================
          VIEW: GESTÃO POR CLIENTE (Tabela + Simulador)
          ========================================= */}
      {activeSubTab === 'CLIENTES' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Tabela Esquerda */}
          <div className="xl:col-span-2 space-y-6">
            <Card title="Relatório de Lucratividade Operacional" extra={
              <div className="flex bg-app-bg rounded-xl p-1 border border-app-border shadow-inner">
                <button onClick={() => setViewMode('CLIENT')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'CLIENT' ? 'bg-[#3B82F6] text-white shadow-lg' : 'text-[#4B5563]'}`}>Cliente</button>
                <button onClick={() => setViewMode('COLLABORATOR')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'COLLABORATOR' ? 'bg-[#3B82F6] text-white shadow-lg' : 'text-[#4B5563]'}`}>Time</button>
              </div>
            }>
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-app-border bg-app-surface-2">
                      <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em]">{viewMode === 'CLIENT' ? 'Cliente Alvo' : 'Profissional'}</th>
                      <th className="px-6 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] text-center">Horas Reais</th>
                      <th className="px-6 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] text-right">Custo Operacional</th>
                      <th className="px-6 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] text-right">Faturamento Ativo</th>
                      <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937]">
                    {vhResults.profitability.map((c, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-black text-xs uppercase shadow-sm border border-blue-500/10">
                              {(c.name || '??').substring(0, 2)}
                            </div>
                            <span className="text-sm font-black text-app-text-strong uppercase tracking-tight">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-mono">
                          <span className="bg-app-bg px-3 py-1.5 rounded-lg border border-app-border text-xs font-black text-blue-500">{c.hours.toFixed(1)}h</span>
                        </td>
                        <td className="px-6 py-5 text-sm font-mono font-bold text-app-text-muted text-right">{formatBRL(c.cost)}</td>
                        <td className="px-6 py-5 text-sm font-mono font-bold text-app-text-muted text-right">{formatBRL(c.billing)}</td>
                        <td className="px-8 py-5 text-right">
                          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black font-mono text-sm shadow-sm ${c.result >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                            {c.result >= 0 ? '+' : ''}{formatBRL(c.result)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-[2rem] flex items-start gap-4 shadow-xl">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0"><Info size={20} /></div>
              <div className="space-y-1">
                <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Sincronização Ativa</p>
                <p className="text-xs text-app-text-muted leading-relaxed font-medium">
                  As horas são importadas automaticamente do <span className="text-app-text-strong">Fluxo de Tarefas</span> (campo "Tempo Gasto H") e o faturamento das entradas vinculadas em <span className="text-app-text-strong">Finanças</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Simulador de Impacto (Direita) */}
          <div className="flex-1">
            <Card title="Simulador de Impacto">
              <div className="p-8 space-y-8 relative overflow-hidden flex flex-col min-h-[500px]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-bl-full pointer-events-none"></div>

                <div className="space-y-6 flex-1 relative z-10">
                  <div>
                    <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] mb-3 block">Selecionar Cliente</label>
                    <div className="relative group">
                      <select
                        value={simParams.clientId}
                        onChange={e => setSimParams({ ...simParams, clientId: e.target.value })}
                        className="w-full bg-app-bg border border-app-border text-app-text-strong text-[11px] font-black uppercase rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-xl"
                      >
                        <option value="">-- Escolher Cliente --</option>
                        {clients.filter((c: any) => !c.__archived).map((c: any) => <option key={c.id} value={c.id}>{c.Nome}</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none group-hover:text-blue-500 transition-colors" size={16} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] mb-3 block">Alocar Colaborador</label>
                    <div className="relative group">
                      <select
                        value={simParams.collaboratorId}
                        onChange={e => setSimParams({ ...simParams, collaboratorId: e.target.value })}
                        className="w-full bg-app-bg border border-app-border text-app-text-strong text-[11px] font-black uppercase rounded-2xl px-6 py-4 focus:outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer shadow-xl"
                      >
                        <option value="">-- Escolher Profissional --</option>
                        {vhResults.collabVHs.map((c: any) => <option key={c.id} value={c.id}>{c.Nome} (VH: {formatBRL(c.calculatedVh)})</option>)}
                      </select>
                      <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-[#4B5563] pointer-events-none group-hover:text-blue-500 transition-colors" size={16} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] mb-3 block">Horas Adicionais</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSimParams({ ...simParams, hours: Math.max(0, simParams.hours - 1) })} className="w-14 h-14 rounded-2xl border border-app-border bg-app-surface text-app-text-strong hover:bg-app-surface-2 flex items-center justify-center font-bold text-xl transition-all shadow-xl">-</button>
                      <div className="flex-1 h-14 bg-app-bg border border-app-border rounded-2xl flex items-center justify-center font-mono font-black text-2xl text-blue-500 shadow-inner">{simParams.hours}</div>
                      <button onClick={() => setSimParams({ ...simParams, hours: simParams.hours + 1 })} className="w-14 h-14 rounded-2xl border border-app-border bg-app-surface text-app-text-strong hover:bg-app-surface-2 flex items-center justify-center font-bold text-xl transition-all shadow-xl">+</button>
                    </div>
                  </div>
                </div>

                {/* Resultado Simulado */}
                <div className="pt-8 border-t border-app-border relative z-10">
                  {simResult ? (
                    <div className="space-y-6 animate-fade">
                      <div className="flex justify-between items-center bg-app-bg/30 p-4 rounded-xl border border-app-border">
                        <span className="text-[10px] font-black text-[#4B5563] uppercase tracking-widest">Aumento de Custo</span>
                        <span className="text-sm font-mono font-black text-rose-500 underline decoration-rose-500/30 decoration-2">+{formatBRL(simResult.diff)}</span>
                      </div>

                      <div className={`p-6 border rounded-[2rem] text-center flex flex-col items-center justify-center shadow-2xl ${simResult.newResult >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${simResult.newResult >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Novo Resultado Projetado</span>
                        <span className={`text-4xl font-black tracking-tighter ${simResult.newResult >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {formatBRL(simResult.newResult)}
                        </span>
                        <div className="flex items-center gap-2 mt-4">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${simResult.newMargin > 20 ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'}`}>
                            {simResult.newMargin.toFixed(1)}% Margem
                          </span>
                        </div>
                      </div>

                      <button onClick={() => setSimParams({ clientId: '', collaboratorId: '', hours: 0 })} className="w-full text-center text-[10px] font-black uppercase text-[#4B5563] hover:text-app-text-strong transition-all underline tracking-[0.2em] decoration-zinc-800">
                        Limpar Simulação
                      </button>
                    </div>
                  ) : (
                    <div className="py-12 border-2 border-dashed border-app-border rounded-[2.5rem] flex flex-col items-center justify-center opacity-30 text-center px-10">
                      <Calculator size={48} className="text-blue-500 mb-6" />
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-app-text-muted">Selecione dados acima para simular lucratividade</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================
          VIEW: EQUIPE E CONFIGURAÇÕES
          ========================================= */}
      {activeSubTab === 'CONFIG' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card title="Engenharia de Recursos" extra={
            <Button onClick={handleAddCollab} className="h-10 px-6 text-[10px] !bg-blue-600 shadow-xl shadow-blue-500/20 font-black uppercase tracking-widest">
              <Plus size={14} className="mr-2" /> Adicionar Membro
            </Button>
          }>
            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-app-border bg-app-surface-2">
                    <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em]">Colaborador</th>
                    <th className="px-6 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em]">Custo Licenças</th>
                    <th className="px-6 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em]">Remuneração Fixa</th>
                    <th className="px-6 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] text-center">Horas Produtivas</th>
                    <th className="px-10 py-5 text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] text-right">VH Final</th>
                    <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-[0.2em] text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]">
                  {vhResults.collabVHs.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center font-black text-xs uppercase shadow-inner border border-zinc-700/50"><User size={18} /></div>
                          <div className="flex flex-col">
                            <input
                              type="text" value={c.Nome}
                              onChange={(e) => handleUpdateCollab(c.id, 'Nome', e.target.value)}
                              className="bg-transparent font-black text-sm text-app-text-strong focus:outline-none focus:bg-app-bg px-2 py-1 rounded-lg transition-all w-48 uppercase tracking-tight"
                            />
                            <input
                              type="text" value={c.Cargo}
                              onChange={(e) => handleUpdateCollab(c.id, 'Cargo', e.target.value)}
                              className="bg-transparent text-[10px] font-bold text-[#4B5563] focus:outline-none focus:bg-app-bg px-2 py-0.5 rounded-md transition-all w-48 mt-0.5 uppercase tracking-widest"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="relative group/input flex items-center">
                          <span className="text-[10px] font-mono text-[#4B5563] mr-2">R$</span>
                          <input
                            type="number" value={c.CustosIndividuais}
                            onChange={(e) => handleUpdateCollab(c.id, 'CustosIndividuais', e.target.value)}
                            className="w-24 bg-app-bg/50 border border-app-border font-mono text-sm font-black text-amber-500 focus:outline-none focus:border-amber-500/50 px-3 py-2 rounded-xl transition-all shadow-inner"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="relative group/input flex items-center">
                          <span className="text-[10px] font-mono text-[#4B5563] mr-2">R$</span>
                          <input
                            type="number" value={c.ProLabore}
                            onChange={(e) => handleUpdateCollab(c.id, 'ProLabore', e.target.value)}
                            className="w-28 bg-app-bg/50 border border-app-border font-mono text-sm font-black text-emerald-500 focus:outline-none focus:border-emerald-500/50 px-3 py-2 rounded-xl transition-all shadow-inner"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number" value={c.HorasProdutivas}
                            onChange={(e) => handleUpdateCollab(c.id, 'HorasProdutivas', e.target.value)}
                            className="w-16 bg-app-bg/50 border border-app-border text-center font-mono text-sm font-black text-app-text-strong focus:outline-none focus:border-blue-500/50 px-2 py-2 rounded-xl transition-all shadow-inner"
                          />
                          <span className="text-[10px] font-black text-[#4B5563]">H</span>
                        </div>
                      </td>
                      <td className="px-10 py-5 text-right">
                        <span className="inline-flex bg-blue-500/10 border border-blue-500/20 text-blue-500 font-mono font-black text-sm px-4 py-2 rounded-2xl shadow-lg shadow-blue-500/5">
                          {formatBRL(c.calculatedVh)}/h
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <button
                          onClick={() => setCollaborators((prev: Collaborator[]) => prev.filter(p => p.id !== c.id))}
                          className="w-10 h-10 rounded-2xl bg-rose-500/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-xl"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-app-bg/50 border-t border-app-border text-center">
              <div className="inline-flex items-center gap-3 bg-app-bg px-6 py-3 rounded-full border border-app-border shadow-xl">
                <Zap size={14} className="text-amber-500" />
                <p className="text-[10px] font-black text-[#4B5563] uppercase tracking-[0.3em]">
                  Engenharia VH: <span className="text-app-text-strong">(Custos + Remuneração) ÷ Horas</span>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function TableRow({ row, tab, cols, onUpdate, clients, library, onOpenColorPicker, onArchive, onDelete, selection, onSelect }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isRDC = tab === 'RDC';

  return (
    <tr
      key={row.id}
      className={`hover:bg-app-surface group transition-colors ${selection.includes(row.id) ? 'bg-[#3B82F6]/5' : ''} ${row.__archived ? 'opacity-50' : ''} 
      ${isRDC ? 'min-h-[64px]' : 'min-h-[56px]'}`}
    >
      <td className={`px-4 py-4 text-center ${isRDC ? 'w-[50px]' : 'w-10'}`}>
        <input type="checkbox" checked={selection.includes(row.id)} onChange={() => onSelect(row.id)} className="rounded bg-app-bg border-app-border text-blue-500 focus:ring-0 focus:ring-offset-0" />
      </td>
      {cols.map((col: string) => {
        let widthStyle = {};
        if (isRDC) {
          if (col === 'Ideia de Conteúdo') widthStyle = { minWidth: '320px' };
          else if (col === 'Rede_Social') widthStyle = { width: '160px' };
          else if (col === 'Tipo de conteúdo') widthStyle = { width: '200px' };
          else if (["Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)"].includes(col)) widthStyle = { width: '160px' };
          else if (col === 'Score (R×D×C)') widthStyle = { width: '100px' };
          else if (col === 'Decisão') widthStyle = { width: '180px' };
        }
        return (
          <td key={col} className="px-4 py-4 align-middle" style={widthStyle}>
            {renderCell(tab, row, col, onUpdate, clients, library, onOpenColorPicker)}
          </td>
        );
      })}
      <td className={`px-4 py-4 text-right align-middle ${isRDC ? 'w-[80px]' : ''}`}>
        <div className="relative inline-block text-left">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-8 h-8 rounded-lg bg-app-surface text-app-text-muted hover:text-app-text-strong transition-all flex items-center justify-center border border-app-border shadow-sm hover:shadow-md"
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
              <div className="absolute right-0 bottom-full mb-2 w-40 bg-app-surface rounded-xl shadow-2xl border border-app-border z-20 overflow-hidden text-left animate-fade">
                <button onClick={() => { onArchive([row.id], tab, !row.__archived); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#3B82F6] transition-all flex items-center gap-3 font-bold uppercase text-[9px] tracking-widest text-app-text-strong">
                  <i className={`fa-solid ${row.__archived ? 'fa-box-open' : 'fa-box-archive'}`}></i>
                  {row.__archived ? 'Restaurar' : 'Arquivar'}
                </button>
                <button onClick={() => { onDelete([row.id], tab); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-rose-600 transition-all flex items-center gap-3 font-bold uppercase text-[9px] tracking-widest text-rose-400 hover:text-app-text-strong">
                  <i className="fa-solid fa-trash-can"></i>
                  Excluir
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function TableView({ tab, data, onUpdate, onDelete, onArchive, onAdd, clients, library, selection, onSelect, onClearSelection, onOpenColorPicker, activeCategory, activeClient, onSelectClient, hideHeader }: any) {
  const [mobileActionRow, setMobileActionRow] = useState<any>(null);

  const cols = useMemo(() => {
    let c = tab === 'CLIENTES' ? CLIENTES_COLS : tab === 'MATRIZ' ? MATRIZ_ESTRATEGICA_COLS : tab === 'COBO' ? COBO_COLS : tab === 'RDC' ? RDC_COLS : tab === 'FINANCAS' ? (
      activeCategory === 'Assinatura' ? FINANCAS_COLS : FINANCAS_COLS.filter(c => !['Recorrência', 'Dia_Pagamento', 'Data_Início', 'Data_Fim'].includes(c))
    ) : [];
    if (activeClient && (tab === 'RDC' || tab === 'COBO')) {
      c = c.filter(col => col !== 'Cliente_ID');
    }
    return c;
  }, [tab, activeCategory, activeClient]);

  if (tab === 'RDC' && !activeClient) {
    return (
      <Card title={TABLE_LABELS['RDC']}>
        <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade">
          <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 text-4xl shadow-[0_0_30px_rgba(37,99,235,0.2)]">
            <i className="fa-solid fa-bolt"></i>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-app-text-strong uppercase tracking-widest">Selecione um Cliente</h3>
            <p className="text-xs font-bold text-app-text-muted uppercase tracking-widest">Para acessar a Validação RDC, escolha um cliente para focar a estratégia.</p>
          </div>
          <div className="w-full max-w-sm relative">
            <select
              value=""
              onChange={(e) => onSelectClient && onSelectClient(e.target.value)}
              className="w-full h-12 bg-app-surface text-app-text-strong text-xs font-bold uppercase pl-4 pr-10 rounded-xl border border-app-border outline-none appearance-none cursor-pointer hover:border-blue-500 transition-colors shadow-xl"
            >
              <option value="" disabled>Selecionar Cliente Agora</option>
              {clients?.map((c: any) => (
                <option key={c.id} value={c.id} className="bg-app-surface text-app-text-strong">{c.Nome}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <i className="fa-solid fa-chevron-down text-[10px] text-app-text-strong"></i>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Custom RDC Header Logic
  const isRDC = tab === 'RDC';
  const rdcHeader = (
    <div className="p-4 md:p-6 border-b border-app-border flex flex-col gap-4 md:grid md:grid-cols-3 items-center bg-app-surface-2">
      <div className="text-center md:text-left w-full">
        <h3 className="font-bold text-app-text-strong text-xs uppercase tracking-widest">{TABLE_LABELS['RDC']} (R×D×C)</h3>
      </div>
      <div className="flex justify-center w-full px-0 md:px-4">
        {onSelectClient && (
          <div className="relative w-full max-w-md group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
              <i className="fa-solid fa-user text-[10px] text-blue-500"></i>
            </div>
            <InputSelect
              value={activeClient ? activeClient.id : ""}
              onChange={(val) => onSelectClient && onSelectClient(val)}
              options={clients?.map((c: any) => ({ value: c.id, label: c.Nome })) || []}
              placeholder="Selecionar Cliente"
              className="w-full bg-app-bg text-app-text-strong text-xs font-bold uppercase py-3 pl-10 pr-10 rounded-xl border border-app-border outline-none transition-all shadow-lg text-center tracking-widest hover:border-blue-500"
            />
          </div>
        )}
      </div>
      <div className="flex justify-center md:justify-end gap-4 items-center w-full">
        <DeletionBar count={selection.length} onDelete={() => onDelete(selection, tab)} onArchive={() => onArchive(selection, tab, true)} onClear={onClearSelection} />
        {onAdd && <Button onClick={onAdd} className="hidden md:flex w-full md:w-auto !bg-blue-600 !text-white hover:!bg-blue-700 !border-none shadow-lg">+ Novo Registro</Button>}
      </div>
    </div>
  );

  return (
    <Card
      className=""
      title={hideHeader ? undefined : (isRDC ? undefined : TABLE_LABELS[tab as TableType])}
      extra={hideHeader ? undefined : (isRDC ? undefined : (
        <div className="flex gap-4 items-center">
          {tab !== 'CLIENTES' && onSelectClient && (
            <div className="relative w-48">
              <InputSelect
                value={activeClient ? activeClient.id : ""}
                onChange={(val: any) => onSelectClient && onSelectClient(val)}
                options={clients?.map((c: any) => ({ value: c.id, label: c.Nome })) || []}
                placeholder="Selecionar Cliente"
                className="bg-blue-600 text-app-text-strong text-[10px] font-bold uppercase py-1.5 pl-4 pr-8 rounded-lg outline-none transition-colors shadow-lg shadow-blue-900/20 w-full hover:bg-blue-700"
              />
            </div>
          )}
          <DeletionBar count={selection.length} onDelete={() => onDelete(selection, tab)} onArchive={() => onArchive(selection, tab, true)} onClear={onClearSelection} />
          {tab !== 'FINANCAS' && onAdd && <Button onClick={onAdd} variant="secondary" className="hidden md:flex w-full md:w-auto !bg-blue-600 !text-white hover:!bg-blue-700 !border-none shadow-lg">+ Novo Registro</Button>}
        </div>
      ))}
    >
      {!hideHeader && isRDC && rdcHeader}
      <div className={`hidden md:block custom-scrollbar bg-app-bg/50 w-full ${(tab === 'MATRIZ' || tab === 'RDC') ? 'overflow-auto max-h-[70vh]' : ''}`}>
        <table className={`w-full text-left text-[11px] border-separate border-spacing-0 ${(tab === 'MATRIZ' || tab === 'RDC') ? 'whitespace-nowrap min-w-max' : ''}`}>
          <thead className="sticky top-0 z-20">
            <tr className="border-b border-app-border bg-app-surface-2 shadow-md">
              <th className={`px-4 py-5 text-center bg-app-surface-2 border-b border-app-border ${tab === 'RDC' ? 'w-[50px]' : 'w-10'}`}>
                <input type="checkbox" onChange={e => { if (e.target.checked) data.forEach((r: any) => !selection.includes(r.id) && onSelect(r.id)); else onClearSelection(); }} checked={data.length > 0 && data.every((r: any) => selection.includes(r.id))} className="rounded bg-app-bg border-app-border text-blue-500 focus:ring-0 focus:ring-offset-0" />
              </th>
              {cols.map(c => {
                let widthStyle = {};
                if (tab === 'RDC') {
                  if (c === 'Ideia de Conteúdo') widthStyle = { minWidth: '320px' };
                  else if (c === 'Rede_Social') widthStyle = { width: '160px' };
                  else if (c === 'Tipo de conteúdo') widthStyle = { width: '200px' };
                  else if (["Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)"].includes(c)) widthStyle = { width: '160px' };
                  else if (c === 'Score (R×D×C)') widthStyle = { width: '100px' };
                  else if (c === 'Decisão') widthStyle = { width: '180px' };
                }
                return (
                  <th key={c} style={widthStyle} className="px-4 py-5 font-black text-[#64748B] uppercase tracking-[0.15em] bg-app-surface-2 border-b border-app-border min-w-[120px] whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {c}
                    </div>
                  </th>
                );
              })}
              <th className={`px-4 py-5 text-right bg-app-surface-2 border-b border-app-border ${tab === 'RDC' ? 'w-[80px]' : ''}`}>Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937]">
            {data.map((row: any) => (
              <TableRow
                key={row.id}
                row={row}
                tab={tab}
                cols={cols}
                onUpdate={onUpdate}
                clients={clients}
                library={library}
                onOpenColorPicker={onOpenColorPicker}
                onArchive={onArchive}
                onDelete={onDelete}
                selection={selection}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-6 px-1 pb-20">
        {data.map((row: any) => {
          // Define groups for mobile view
          const mobileGroups = tab === 'COBO' ? [
            { title: 'Veiculação', cols: ['Canal', 'Frequência'] },
            { title: 'Público & Voz', cols: ['Público', 'Voz'] },
            { title: 'Estratégia', cols: ['Zona', 'Intenção', 'Formato'] },
          ] : tab === 'RDC' ? [
            { title: 'Conteúdo', cols: ['Ideia de Conteúdo', 'Rede_Social', 'Tipo de conteúdo'] },
            { title: 'Avaliação', cols: ['Resolução (1–5)', 'Demanda (1–5)', 'Competição (1–5)'] },
            { title: 'Resultado', cols: ['Score (R×D×C)', 'Decisão'] },
          ] : tab === 'CLIENTES' ? [
            { title: 'Dados Gerais', cols: ['Nicho', 'Responsável', 'Objetivo'] },
            { title: 'Contato & Social', cols: ['WhatsApp', 'Instagram'] },
            { title: 'Configuração', cols: ['Cor (HEX)', 'Status'] },
          ] : null;

          return (
            <div key={row.id} className={`p-6 rounded-[2rem] border ${selection.includes(row.id) ? 'bg-blue-600/5 border-blue-500/50 shadow-[0_8px_30px_rgba(37,99,235,0.15)]' : 'bg-app-surface border-app-border shadow-xl'} transition-all relative overflow-hidden group`}>

              {/* Card Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-bl-[4rem] pointer-events-none -z-0"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6 border-b border-app-border pb-4 gap-4">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <input type="checkbox" checked={selection.includes(row.id)} onChange={() => onSelect(row.id)} className="shrink-0 rounded-lg bg-app-bg border-app-border text-blue-600 focus:ring-0 w-6 h-6 transition-all" />
                    {tab === 'CLIENTES' && (
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-base font-black text-app-text-strong uppercase leading-none tracking-tight truncate">{row.Nome}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${row.Status === 'Ativo' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'}`}>{row.Status}</span>
                          {row['Nicho'] && <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider truncate">{row['Nicho']}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setMobileActionRow(row)} className="w-[44px] h-[44px] rounded-xl bg-app-surface-2 border border-app-border text-app-text-muted hover:text-app-text-strong flex items-center justify-center transition-all active:scale-95 shadow-sm"><i className="fa-solid fa-ellipsis-vertical text-lg"></i></button>
                  </div>
                </div>
                <div className="space-y-8">
                  {mobileGroups ? (
                    mobileGroups.map((group, idx) => {
                      const groupCols = group.cols.filter(c => cols.includes(c));
                      if (groupCols.length === 0) return null;
                      return (
                        <div key={idx} className={idx > 0 ? "border-t border-app-border pt-6" : ""}>
                          <h4 className="text-[10px] font-black uppercase text-app-text-muted mb-5 tracking-[0.2em] flex items-center gap-3">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3B82F6]"></span>
                            {group.title}
                          </h4>
                          <div className="grid grid-cols-1 gap-5">
                            {groupCols.map((col: string) => (
                              <div key={col}>
                                <label className="text-[9px] font-black uppercase text-[#4B5563] tracking-widest block mb-2">{col}</label>
                                <div className="text-sm">{renderCell(tab, row, col, onUpdate, clients, library, onOpenColorPicker)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {cols.map((col: string) => (
                        <div key={col}>
                          <label className="text-[9px] font-black uppercase text-[#4B5563] tracking-widest block mb-2">{col}</label>
                          <div className="text-sm">{renderCell(tab, row, col, onUpdate, clients, library, onOpenColorPicker)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <BottomSheet
        isOpen={!!mobileActionRow}
        onClose={() => setMobileActionRow(null)}
        title="Ações do Registro"
      >
        <div className="p-4 space-y-3 bg-app-surface">
          <Button
            variant="secondary"
            onClick={() => {
              if (mobileActionRow) onArchive([mobileActionRow.id], tab, !mobileActionRow.__archived);
              setMobileActionRow(null);
            }}
            className="w-full !justify-start !h-12 !text-[13px]"
          >
            <i className={`fa-solid ${mobileActionRow?.__archived ? 'fa-box-open' : 'fa-box-archive'} mr-3 w-5 text-center`}></i>
            {mobileActionRow?.__archived ? 'Desarquivar Registro' : 'Arquivar Registro'}
          </Button>

          <Button
            variant="danger"
            onClick={() => {
              if (mobileActionRow) onDelete([mobileActionRow.id], tab);
              setMobileActionRow(null);
            }}
            className="w-full !justify-start !h-12 !text-[13px] !bg-rose-500/10 !border-rose-500/20 !text-rose-500"
          >
            <i className="fa-solid fa-trash-can mr-3 w-5 text-center"></i> Excluir Permanentemente
          </Button>
        </div>
      </BottomSheet>
    </Card>
  );
}

function renderCell(tab: TableType, row: any, col: string, update: Function, clients: Client[] = [], library: ContentLibrary = {}, onOpenColorPicker?: Function) {
  const common = "w-full text-[11px] font-bold bg-transparent border-none text-app-text-strong pointer-events-auto outline-none transition-all focus:text-[#3B82F6]";

  if (tab === 'RDC') {
    if (col === 'Rede_Social') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={RDC_NETWORKS} className={common} placeholder="Selecione..." label={col} />);
    if (col === 'Tipo de conteúdo') {
      const social = row['Rede_Social'] || 'Instagram';
      const formats = RDC_FORMATS[social] || [];
      return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={formats} className={common} placeholder="-- Selecione --" label={col} />);
    }
    if (["Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)"].includes(col)) {
      return (
        <div className="flex justify-center">
          <Stepper
            value={parseInt(row[col]) || 0}
            onChange={(val) => update(row.id, tab, col, val)}
            min={1}
            max={5}
            className="border-none bg-[#0B0B0E]/30"
          />
        </div>
      );
    }
    if (col === 'Score (R×D×C)') return (<div className="text-center"><span className="text-[12px] font-black text-blue-500 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">{row[col] || 0}</span></div>);
    if (col === 'Decisão') {
      const val = row[col] || "Preencha R/D/C";
      let badgeColor = 'slate';
      if (val === 'Implementar já') badgeColor = 'green';
      if (val === 'Ajustar e testar') badgeColor = 'orange';
      return (
        <div className="flex justify-center">
          <Badge color={badgeColor} className="!text-[9px] whitespace-nowrap px-4 py-2 rounded-xl shadow-lg truncate max-w-full">{val}</Badge>
        </div>
      );
    }
    if (col === 'Ideia de Conteúdo') {
      return (
        <div className="relative group/cell">
          <input
            type="text"
            value={row[col]}
            onChange={e => update(row.id, tab, col, e.target.value)}
            className={`${common} w-full truncate focus:text-app-text-strong transition-all`}
            placeholder="Descreva a ideia..."
          />
        </div>
      );
    }
  }

  if (tab === 'COBO') {
    if (col === 'Canal') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={COBO_CANAL_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Frequência') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={COBO_FREQUENCIA_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Público') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={COBO_PUBLICO_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Voz') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={COBO_VOZ_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Zona') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={COBO_ZONA_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Intenção') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={COBO_INTENCAO_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Formato') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={COBO_FORMATO_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
  }

  if (tab === 'MATRIZ') {
    if (col === 'Função') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={MATRIZ_FUNCAO_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Quem fala') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={MATRIZ_QUEM_FALA_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Papel estratégico') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={MATRIZ_PAPEL_ESTRATEGICO_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Tipo de conteúdo') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={MATRIZ_TIPO_CONTEUDO_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    if (col === 'Resultado esperado') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={MATRIZ_RESULTADO_ESPERADO_OPTIONS} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
  }

  if (col === 'Cliente_ID' && tab !== 'FINANCAS') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={[{ value: "GERAL", label: "AGÊNCIA" }, ...clients.map(c => ({ value: c.id, label: c.Nome }))]} className={common} placeholder="AGÊNCIA" label={col} />);
  if (col === 'Tipo' && tab === 'FINANCAS') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={FINANCAS_TIPO_OPTIONS} className={common} placeholder="Selecione..." label={col} />);
  if ((col === 'Rede_Social' || col === 'Canal') && tab !== 'COBO') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={Object.keys(library)} className={common} placeholder="Selecione..." label={col} />);

  if (tab === 'FINANCAS') {
    const isSub = row.Tipo === 'Assinatura';
    if (col === 'Recorrência') return isSub ? (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={["Mensal", "Única"]} className={common} placeholder="Selecione..." label={col} />) : null;
    if (col === 'Dia_Pagamento') return isSub ? (<input type="number" min="1" max="31" value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={common} />) : null;
    if (col === 'Data_Início' || col === 'Data_Fim') return isSub ? (<input type="date" value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={common} />) : null;
    if (col === 'Observações' && row.Tipo === 'Entrada') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={FINANCAS_SERVICOS_OPTIONS} className={common} placeholder="-- Serviço --" label={col} />);
  }

  if (col === 'Cor (HEX)') {
    return (
      <div onClick={() => onOpenColorPicker && onOpenColorPicker(row.id, row[col])} className="flex items-center gap-2 cursor-pointer group pointer-events-auto select-none">
        <div className="w-6 h-6 rounded-full border border-white/20 shadow-sm transition-transform group-hover:scale-110" style={{ backgroundColor: row[col] }}></div>
        <span className="text-[10px] uppercase font-bold text-app-text-muted group-hover:text-app-text-strong transition-colors">{row[col]}</span>
      </div>
    );
  }


  if (tab === 'FINANCAS' && col === 'Valor') {
    return (
      <input
        type="number"
        step="0.01"
        value={row[col]}
        onChange={e => update(row.id, tab, col, e.target.value)}
        className={common}
        placeholder="0.00"
      />
    );
  }

  if (col === 'Conteúdo') {
    return (
      <textarea
        value={row[col]}
        onChange={e => update(row.id, tab, col, e.target.value)}
        className={`${common} min-w-[300px] h-auto min-h-[40px] resize-y overflow-hidden leading-relaxed whitespace-pre-wrap`}
        placeholder="Escreva o conteúdo..."
        style={{ height: 'auto' }}
        rows={1}
        onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
      />
    );
  }

  const inputType = (col === 'Data') ? 'date' : col === 'Hora' ? 'time' : 'text';
  return (<input type={inputType} value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={common} placeholder="..." />);
}

function getIcon(tab: TableType) {
  const icons: any = { DASHBOARD: 'fa-table-columns', CLIENTES: 'fa-address-card', ORGANICKIA: 'fa-robot', RDC: 'fa-bolt', MATRIZ: 'fa-chess-rook', COBO: 'fa-tower-cell', PLANEJAMENTO: 'fa-calendar-days', FINANCAS: 'fa-coins', TAREFAS: 'fa-list-check', VH: 'fa-hourglass', WHITEBOARD: 'fa-object-group' };
  return icons[tab] || 'fa-folder';
}

function LibraryEditorModal({ library, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md md:p-10 pointer-events-auto text-left">
      <div className="w-full h-full md:h-[80vh] md:max-w-4xl bg-app-surface-2 border border-app-border md:rounded-[30px] shadow-2xl flex flex-col">
        <div className="h-20 flex items-center justify-between px-10 border-b border-app-border"><h3 className="text-xl font-bold uppercase text-app-text-strong">Biblioteca de Formatos</h3><button onClick={onClose} className="text-app-text-muted hover:text-app-text-strong"><i className="fa-solid fa-xmark text-2xl"></i></button></div>
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
          <div className="grid grid-cols-2 gap-8">
            {Object.keys(library).map(net => (
              <div key={net} className="p-6 rounded-2xl bg-app-surface border border-app-border space-y-4">
                <h4 className="text-sm font-black text-[#3B82F6] uppercase">{net}</h4>
                <div className="flex flex-wrap gap-2">{library[net].map((type: string, idx: number) => (<Badge key={idx} color="slate">{type}</Badge>))}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-10 border-t border-app-border text-right"><Button onClick={onClose}>Fechar</Button></div>
      </div>
    </div>
  );
}

function ReorderTabsModal({ tabOrder, setTabOrder, onClose }: { tabOrder: TableType[], setTabOrder: (order: TableType[]) => void, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-10 pointer-events-auto text-left">
      <div className="w-full max-w-lg bg-app-surface-2 border border-app-border rounded-2xl shadow-2xl p-8 flex flex-col">
        <h3 className="text-xl font-bold uppercase text-app-text-strong mb-6">Ordem das Abas</h3>
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2 mb-8">
          {tabOrder.map((tab) => (
            <div key={tab} className="flex items-center gap-4 p-4 rounded-xl border border-app-border bg-app-surface">
              <span className="text-xs font-black uppercase text-app-text-strong">{TABLE_LABELS[tab]}</span>
            </div>
          ))}
        </div>
        <Button onClick={onClose} className="w-full h-12 !bg-[#3B82F6]">Fechar</Button>
      </div>
    </div>
  );
}

function ColorPickerModal({ target, onClose, onConfirm }: any) {
  const PRESETS = [
    '#3B82F6', '#10b981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
    '#14B8A6', '#6366F1', '#F43F5E', '#84CC16', '#06B6D4', '#D946EF',
    '#1E293B', '#64748B', '#94A3B8', '#CBD5E1'
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade pointer-events-auto" onClick={onClose}>
      <div className="bg-app-surface-2 border border-app-border rounded-3xl p-8 shadow-2xl space-y-6 w-full max-w-sm transform transition-all scale-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-app-text-strong tracking-widest">Escolher Cor</h3>
          <button onClick={onClose} className="text-app-text-muted hover:text-app-text-strong transition-colors"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {PRESETS.map(color => (
            <button
              key={color}
              onClick={() => onConfirm(color)}
              className="group aspect-square rounded-2xl border border-white/10 hover:border-white transition-all shadow-lg hover:shadow-xl hover:shadow-white/10 relative overflow-hidden"
              style={{ backgroundColor: color }}
            >
              {target.value === color && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><i className="fa-solid fa-check text-app-text-strong drop-shadow-md"></i></div>}
            </button>
          ))}

          <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-600 hover:border-white transition-all flex items-center justify-center relative cursor-pointer group bg-app-surface">
            <i className="fa-solid fa-plus text-app-text-muted group-hover:text-app-text-strong text-xl"></i>
            <input
              type="color"
              value={target.value}
              onChange={e => onConfirm(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-app-border flex gap-2">
          <div className="flex-1 h-10 rounded-xl bg-app-surface border border-app-border flex items-center px-4 gap-3">
            <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: target.value }}></div>
            <span className="text-xs font-bold text-app-text-muted uppercase tracking-widest">{target.value}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganickIAView({ clients, cobo, matriz, rdc, planning, selectedClientId, setSelectedClientId, audioInsight, setAudioInsight, pdfInsight, setPdfInsight, history, setHistory, onArchive, onDelete, showArchived, onGenerateSlide, onAddItem, addNotification }: any) {
  const [briefing, setBriefing] = useState('');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lastImportedIds, setLastImportedIds] = useState<{ tab: string, id: string }[]>([]);
  const [importSelection, setImportSelection] = useState({ cobo: true, estrategia: true, rdc: true, planejamento: true });
  const [loading, setLoading] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<string[]>([]);

  const selectedClient = useMemo(() => clients.find((c: any) => c.id === selectedClientId), [clients, selectedClientId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'pdf') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    try {
      const fileData = await Promise.all(Array.from(files).map(async (file: File) => {
        return new Promise<{ data: string, mimeType: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (ev) => { resolve({ data: ev.target?.result as string, mimeType: file.type }); };
          reader.onerror = () => { reject(new Error(`Falha ao ler arquivo: ${file.name}`)); };
          reader.readAsDataURL(file);
        });
      }));

      const result = await transcribeAndExtractInsights(fileData);

      if (type === 'audio') {
        setAudioInsight(result);
        addNotification('success', 'Áudio Processado', 'Insights extraídos com sucesso.');
      } else {
        setPdfInsight(result);
        addNotification('success', 'PDF Analisado', 'Resumo executivo gerado com sucesso.');
        try {
          const structured = await extractStructuredDataFromPDF(fileData);
          if (structured && !structured.error) {
            setImportPreview(structured);
            setImportSelection({ cobo: true, estrategia: true, rdc: true, planejamento: true });
            setIsImportModalOpen(true);
          } else if (structured?.error) {
            console.warn("Structured extraction logic issue:", structured.error);
          }
        } catch (e) {
          console.error("Structured extraction failed", e);
        }
      }
    } catch (err: any) {
      console.error(err);
      addNotification('error', 'Erro no Processamento', err.message || 'Ocorreu uma falha ao analisar os arquivos.');
    } finally {
      setLoading(false);
      if (e.target) e.target.value = ''; // Reset input to allow re-upload of same file
    }
  };

  const handleConfirmImport = async (targetClientId: string) => {
    if (!importPreview || !onAddItem) return;

    const newIds: { tab: string, id: string }[] = [];
    const clientId = targetClientId;

    // Process COBO
    if (importSelection.cobo && importPreview.cobo) {
      for (const item of importPreview.cobo) {
        const id = await onAddItem('COBO', { Cliente_ID: clientId, Canal: item.Canal, Frequência: item.Frequência, Público: item.Público, Voz: item.Voz, Zona: item.Zona, Intenção: item.Intenção, Formato: item.Formato, __status: 'Rascunho' });
        if (id) newIds.push({ tab: 'COBO', id });
      }
    }

    // Process Strategy
    if (importSelection.estrategia && importPreview.estrategia) {
      for (const item of importPreview.estrategia) {
        const id = await onAddItem('MATRIZ', { Cliente_ID: clientId, Função: item.Função, "Quem fala": item['Quem fala'], "Papel estratégico": item['Papel estratégico'], "Tipo de conteúdo": item['Tipo de conteúdo'], "Resultado esperado": item['Resultado esperado'], __status: 'Rascunho' });
        if (id) newIds.push({ tab: 'MATRIZ', id });
      }
    }

    // Process RDC
    if (importSelection.rdc && importPreview.rdc) {
      for (const item of importPreview.rdc) {
        const id = await onAddItem('RDC', { Cliente_ID: clientId, "Ideia de Conteúdo": item['Ideia de Conteúdo'], Rede_Social: item['Rede Social'], "Tipo de conteúdo": item['Tipo de conteúdo'], "Resolução (1–5)": item['Resolução (1–5)'], "Demanda (1–5)": item['Demanda (1–5)'], "Competição (1–5)": item['Competição (1–5)'], Decisão: 'Ajustar e testar', __status: 'Rascunho' });
        if (id) newIds.push({ tab: 'RDC', id });
      }
    }

    // Process Planning
    if (importSelection.planejamento && importPreview.planejamento) {
      for (const item of importPreview.planejamento) {
        const id = await onAddItem('PLANEJAMENTO', { Cliente_ID: clientId, Data: item.Data, Hora: item.Hora, Conteúdo: item.Conteúdo, Formato: item.Formato, Zona: item.Zona, Intenção: item.Intenção, "Status do conteúdo": item.Status || 'Pendente', __status: 'Rascunho' });
        if (id) newIds.push({ tab: 'PLANEJAMENTO', id });
      }
    }

    setLastImportedIds(newIds);
    setIsImportModalOpen(false);
    setImportPreview(null);
    alert(`Importação concluída! ${newIds.length} itens foram criados como rascunho.`);
  };

  const handleUndoImport = async () => {
    if (lastImportedIds.length === 0) return;
    if (!confirm("Deseja desfazer a última importação? Isso excluirá todos os itens criados.")) return;

    // Group by tab
    const tabs = ['COBO', 'MATRIZ', 'RDC', 'PLANEJAMENTO'];
    for (const tab of tabs) {
      const idsToDelete = lastImportedIds.filter(i => i.tab === tab).map(i => i.id);
      if (idsToDelete.length > 0) {
        await onDelete(idsToDelete, tab);
      }
    }
    setLastImportedIds([]);
    alert("Importação desfeita com sucesso.");
  };

  const generateBriefing = useCallback(() => {
    if (!selectedClient) { alert("Selecione um cliente primeiro."); return; }
    const clientCobo = cobo.filter((i: any) => i.Cliente_ID === selectedClientId);
    const clientMatriz = matriz.filter((i: any) => i.Cliente_ID === selectedClientId);
    const clientRdc = (rdc || []).filter((i: any) => i.Cliente_ID === selectedClientId && i.Decisão === 'Implementar já');
    const clientPlanning = planning.filter((i: any) => i.Cliente_ID === selectedClientId).slice(0, 5);

    const coboStr = clientCobo.map((i: any) => `${i.Canal} (${i.Frequência}): ${i.Intenção} • ${i.Formato}`).join('\n');
    const strategyStr = clientMatriz.map((i: any) => `${i.Função} (${i.Rede_Social}): ${i['Papel estratégico']} -> ${i['Resultado esperado']}`).join('\n');
    const rdcStr = clientRdc.map((i: any) => `${i['Ideia de Conteúdo']} (Score: ${i['Score (R×D×C)']})`).join('\n');
    const planningStr = clientPlanning.map((i: any) => `${i.Data}: ${i.Conteúdo} (${i['Status do conteúdo']})`).join('\n');
    const combinedInsights = [audioInsight ? `INSIGHT ÁUDIO: ${audioInsight}` : '', pdfInsight ? `INSIGHT PDF: ${pdfInsight}` : ''].filter(Boolean).join('\n\n');

    const template = `BRIEFING ESTRATÉGICO — MÉTODO ORGANICK\n\nCliente: ${selectedClient.Nome}\nNicho: ${selectedClient.Nicho}\nObjetivo: ${selectedClient.Objetivo}\n\nEstratégia:\n${strategyStr || 'Nenhuma estratégia definida.'}\n\nCOBO:\n${coboStr || 'Nenhum canal configurado.'}\n\nRDC:\n${rdcStr || 'Nenhuma ideia prioritária no RDC.'}\n\nPlanejamento:\n${planningStr || 'Nenhum conteúdo agendado.'}\n\nInsights adicionais (Áudio/PDF):\n${combinedInsights || 'Nenhum insight adicional extraído.'}\n\nPedido ao OrganickIA:\nGerar ideias estratégicas, ganchos, roteiros e variações criativas alinhadas ao briefing.`;

    setBriefing(template);
    setHistory((prev: any) => [{ id: generateId(), type: 'BRIEFING', clientName: selectedClient.Nome, timestamp: new Date().toISOString(), content: template, __archived: false }, ...prev]);
  }, [selectedClient, cobo, matriz, rdc, planning, audioInsight, pdfInsight, setHistory]);

  const copyBriefing = () => { if (!briefing) return; navigator.clipboard.writeText(briefing); alert("Briefing copiado!"); };

  const CHATGPT_LINK = 'https://chatgpt.com/g/g-67fe9521201881919187918063e71b75-organickai-2-0';

  const handleCopyAndOpenChat = () => {
    if (!briefing) {
      alert("Gere o briefing antes.");
      return;
    }
    navigator.clipboard.writeText(briefing).then(() => {
      alert("Briefing copiado para a área de transferência! Redirecionando para o ChatGPT...");
      window.open(CHATGPT_LINK, '_blank');
    });
  };

  const filteredHistory = history.filter((h: any) => showArchived ? true : !h.__archived);

  return (
    <div className="space-y-8 animate-fade max-w-5xl mx-auto pb-20 text-left px-4 md:px-0">

      {/* CABEÇALHO PREMIUM */}
      <div className="flex items-center gap-5 mb-10 group">
        <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-500 rotate-3 group-hover:rotate-0">
          <BrainCircuit className="text-white" size={32} />
        </div>
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-app-text-strong tracking-tighter uppercase leading-none mb-2">OrganickIA 2.0</h1>
          <p className="text-[10px] md:text-xs text-app-text-muted font-bold uppercase tracking-[0.2em] opacity-80">
            A inteligência operacional do Método Organick.
          </p>
        </div>
      </div>

      {/* 1. SELETOR DE CONTEXTO */}
      <Card title="Contexto do Cliente">
        <div className="p-6 md:p-8">
          <label className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">
            <CheckCircle2 size={14} /> Selecionar Cliente (Obrigatório)
          </label>
          <div className="relative group">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full h-14 !bg-app-bg border-app-border text-sm font-bold uppercase text-app-text-strong rounded-[16px] px-5 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all cursor-pointer"
            >
              <option value="">-- Escolha um cliente --</option>
              {clients.map((c: any) => <option key={c.id} value={c.id} className="bg-app-bg">{c.Nome}</option>)}
            </select>
            <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-app-text-muted pointer-events-none group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </Card>

      {selectedClientId && (
        <>
          {/* 2. BASE DE CONHECIMENTO */}
          <Card title="Base de Conhecimento (Arquivos)">
            <div className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Audio Upload */}
                <div className="group relative">
                  <input type="file" accept="audio/*" multiple ref={audioInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'audio')} />
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-[24px] py-10 px-6 text-center transition-all hover:border-blue-500 cursor-pointer bg-app-surface/50 hover:bg-blue-500/5 active:scale-[0.98] group"
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <div className="w-14 h-14 bg-app-surface shadow-xl rounded-2xl flex items-center justify-center mb-4 text-blue-500 group-hover:scale-110 transition-transform border border-app-border">
                      <Mic size={24} />
                    </div>
                    <h3 className="text-xs font-black text-app-text-strong uppercase tracking-widest mb-1">Pautas / Áudios</h3>
                    <p className="text-[10px] text-app-text-muted font-bold uppercase mb-6 opacity-60">Áudios de reuniões ou notas de voz.</p>
                    <Button
                      onClick={(e) => { e.stopPropagation(); audioInputRef.current?.click(); }}
                      disabled={loading}
                      className="!px-6 !py-2.5 !bg-blue-500/10 !text-blue-500 hover:!bg-blue-500 hover:!text-white !rounded-xl !text-[10px] !font-black !tracking-widest !uppercase !transition-all border border-blue-500/20"
                    >
                      {loading ? 'Processando...' : 'Carregar Áudio'}
                    </Button>
                  </div>
                </div>

                {/* PDF Upload */}
                <div className="group relative">
                  <input type="file" accept="application/pdf" multiple ref={pdfInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'pdf')} />
                  <div
                    className="flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-[24px] py-10 px-6 text-center transition-all hover:border-rose-500 cursor-pointer bg-app-surface/50 hover:bg-rose-500/5 active:scale-[0.98] group"
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    <div className="w-14 h-14 bg-app-surface shadow-xl rounded-2xl flex items-center justify-center mb-4 text-rose-500 group-hover:scale-110 transition-transform border border-app-border">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-xs font-black text-app-text-strong uppercase tracking-widest mb-1">Documentos PDF</h3>
                    <p className="text-[10px] text-app-text-muted font-bold uppercase mb-6 opacity-60">Briefings, pautas ou relatórios.</p>
                    <Button
                      onClick={(e) => { e.stopPropagation(); pdfInputRef.current?.click(); }}
                      disabled={loading}
                      className="!px-6 !py-2.5 !bg-rose-500/10 !text-rose-500 hover:!bg-rose-500 hover:!text-white !rounded-xl !text-[10px] !font-black !tracking-widest !uppercase !transition-all border border-rose-500/20"
                    >
                      {loading ? 'Analisando...' : 'Carregar PDF'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Undo Import Block */}
              {lastImportedIds.length > 0 && (
                <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-[20px] flex items-center justify-between animate-fade">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                      <HistoryIcon className="text-rose-500" size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Importação Recente ({lastImportedIds.length} itens)</p>
                      <p className="text-[9px] text-rose-400 font-bold uppercase tracking-wider opacity-80">Deseja desfazer? Os itens criados serão excluídos.</p>
                    </div>
                  </div>
                  <Button onClick={handleUndoImport} className="!bg-rose-500 !text-white hover:!bg-rose-600 !text-[9px] !font-black !uppercase !tracking-widest !h-10 !px-6 !rounded-xl shadow-lg shadow-rose-500/20 border border-rose-500">
                    <Trash2 className="mr-2" size={14} /> DESFAZER
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* 3. CÉREBRO OPERACIONAL (Console) */}
          <Card title="Cérebro Operacional">
            <div className="p-6 md:p-8 space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Sparkles className="text-amber-500" size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-app-text-strong uppercase tracking-widest">Processamento IA</h4>
                    <p className="text-[9px] text-app-text-muted font-bold uppercase mt-1 opacity-70">Gere briefings baseados na sua base de conhecimento.</p>
                  </div>
                </div>
                <Button
                  onClick={generateBriefing}
                  disabled={loading}
                  className="!h-14 !px-8 !bg-emerald-600 !text-white !rounded-[16px] shadow-xl shadow-emerald-600/20 !text-[11px] !font-black !tracking-widest !uppercase !transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <BrainCircuit size={18} />}
                  Compilar Briefing Organick
                </Button>
              </div>

              {/* TERMINAL / LOG AREA */}
              <div className={`w-full rounded-[20px] p-6 font-mono text-[11px] leading-relaxed min-h-[160px] border transition-all duration-500 overflow-hidden relative
                ${!briefing && !loading ? 'bg-app-bg border-app-border text-app-text-muted flex items-center justify-center text-center italic' : ''}
                ${loading ? 'bg-blue-500/5 border-blue-500/20 text-blue-500 flex items-center justify-center' : ''}
                ${briefing && !loading ? 'bg-[#111114] border-emerald-500/30 text-app-text-strong' : ''}
              `}>
                {!briefing && !loading && (
                  <div className="space-y-3 px-10">
                    <Loader2 size={24} className="mx-auto mb-2 opacity-20" />
                    <p className="uppercase tracking-widest font-bold text-[9px]">Aguardando comando para analisar a base de conhecimento...</p>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center gap-3 font-bold uppercase tracking-widest">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Extraindo insights e formatando dados estratégicos...</span>
                  </div>
                )}

                {briefing && !loading && (
                  <div className="animate-fade space-y-4">
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-2 font-black text-emerald-400 uppercase tracking-widest">
                        <CheckCircle2 size={14} /> Briefing Extraído com Sucesso
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={copyBriefing} variant="secondary" className="!h-8 !px-3 !text-[9px] !font-black !rounded-lg border-white/10"><Copy size={12} className="mr-2" /> Copiar</Button>
                        <Button onClick={() => onGenerateSlide(briefing)} className="!h-8 !px-3 !text-[9px] !font-black !rounded-lg !bg-blue-600 !text-white border-none"><FileImage size={12} className="mr-2" /> Gerar Slide</Button>
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar font-sans pr-2">
                      <SimpleMarkdown content={briefing} />
                    </div>
                  </div>
                )}

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                  <BrainCircuit size={120} />
                </div>
              </div>

              {/* Insights Grid */}
              {(audioInsight || pdfInsight) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade">
                  {audioInsight && (
                    <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-[20px] space-y-3 group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 uppercase tracking-widest font-black text-blue-500 text-[9px]">
                          <Zap size={12} /> Insight Áudio
                        </div>
                        <CheckCircle2 size={12} className="text-blue-500/40" />
                      </div>
                      <p className="text-[11px] text-app-text-muted leading-relaxed font-bold uppercase italic line-clamp-3">{audioInsight}</p>
                    </div>
                  )}
                  {pdfInsight && (
                    <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-[20px] space-y-3 group hover:border-rose-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 uppercase tracking-widest font-black text-rose-500 text-[9px]">
                          <Sparkles size={12} /> Insight PDF
                        </div>
                        <CheckCircle2 size={12} className="text-rose-500/40" />
                      </div>
                      <p className="text-[11px] text-app-text-muted leading-relaxed font-bold uppercase italic line-clamp-3">{pdfInsight}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* 4. CHAT ORGANICKIA (Gateway) */}
          <Card title="Chat OrganickIA">
            <div className="p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-3xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  <MessageSquare size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-app-text-strong tracking-[0.1em] mb-1">Central de Inteligência</h3>
                  <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest opacity-80">Acesse o OrganickAI 2.0 no ChatGPT.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={() => window.open(CHATGPT_LINK, '_blank')} className="!h-16 !bg-app-surface !text-app-text-strong border border-app-border hover:!border-blue-500 !rounded-[18px] !text-[10px] !font-black !uppercase !tracking-widest flex items-center gap-3">
                  <ExternalLink size={16} /> Abrir Chat OrganickIA
                </Button>
                <Button onClick={handleCopyAndOpenChat} className="!h-16 !bg-emerald-600 !text-white !rounded-[18px] !text-[10px] !font-black !uppercase !tracking-widest flex items-center gap-3 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform">
                  <Copy size={16} /> Copiar Briefing + Abrir Chat
                </Button>
              </div>

              {/* SAFETY ALERT (ELEGANT VERSION) */}
              <div className="bg-app-bg/50 border border-dashed border-app-border rounded-[24px] p-8 flex flex-col items-center justify-center text-center group">
                <ShieldAlert size={32} className="text-app-text-muted mb-4 group-hover:text-rose-500 transition-colors duration-500" />
                <p className="max-w-md text-[10px] text-app-text-muted font-bold uppercase tracking-widest leading-relaxed opacity-60">
                  O ChatGPT não permite exibição embutida por segurança. <br />
                  Utilize os botões acima para interagir em uma nova aba dedicada.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* 5. HISTÓRICO */}
      <div className="space-y-8 pt-8">
        <div className="flex items-center justify-between border-b border-app-border pb-6">
          <div className="flex items-center gap-3">
            <HistoryIcon className="text-app-text-muted" size={18} />
            <h3 className="text-xs font-black uppercase text-app-text-strong tracking-[0.3em]">Histórico de Inteligência</h3>
          </div>
          <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'IA_HISTORY')} onArchive={() => onArchive(selection, 'IA_HISTORY')} onClear={() => setSelection([])} />
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-app-border rounded-[32px] opacity-40">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-app-text-muted">Nenhum registro processado recentemente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item: any) => (
              <div key={item.id} className={`p-6 bg-app-surface border border-app-border rounded-[28px] shadow-2xl hover:border-blue-500/30 transition-all duration-300 group relative overflow-hidden ${selection.includes(item.id) ? 'border-blue-500 ring-4 ring-blue-500/10' : ''}`}>
                <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                  <input type="checkbox" checked={selection.includes(item.id)} onChange={() => setSelection(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])} className="w-6 h-6 rounded-lg cursor-pointer" />
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-lg ${item.type === 'SLIDE' ? 'bg-blue-500/10 text-blue-500 shadow-blue-500/5' : 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5'}`}>
                    {item.type === 'SLIDE' ? <FileImage size={24} /> : <FileText size={24} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-app-text-strong tracking-widest mb-1">{item.clientName}</h4>
                    <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider opacity-60">
                      {new Date(item.timestamp).toLocaleDateString('pt-BR')} • {item.type}
                    </span>
                  </div>
                </div>

                {item.type === 'SLIDE' ? (
                  <div className="space-y-4">
                    <p className="text-[11px] font-black text-blue-500 uppercase tracking-wider line-clamp-1">{item.content.title}</p>
                    <p className="text-[10px] text-app-text-muted font-bold leading-relaxed line-clamp-3 uppercase tracking-tight">{item.content.subtitle}</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-app-text-muted font-bold leading-relaxed line-clamp-4 italic uppercase tracking-tight opacity-70">
                    {item.content.slice(0, 300)}...
                  </p>
                )}

                <div className="mt-8 pt-5 border-t border-app-border flex gap-3">
                  <Button variant="secondary" className="flex-1 !h-10 !text-[9px] !font-black !rounded-xl border-app-border" onClick={() => { if (item.type === 'SLIDE') { /* logic */ } else { setBriefing(item.content); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>
                    <Eye size={14} className="mr-2" /> Visualizar
                  </Button>
                  <Button variant="secondary" className="!h-10 !w-10 !p-0 !rounded-xl border-app-border" onClick={() => onArchive([item.id], 'IA_HISTORY', !item.__archived)}>
                    {item.__archived ? <FolderOpen size={16} /> : <Box size={16} />}
                  </Button>
                </div>

                {/* Subtle Hover Decoration */}
                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-app-text-strong/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import Preview Modal (Design Refinement) */}
      {isImportModalOpen && importPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6 pointer-events-auto transition-all animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-4xl bg-[#111114] border border-white/10 rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#111114] to-[#1a1a1e]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <Plus size={24} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase text-white tracking-tighter mb-1">Confirmação de Importação</h3>
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-[0.2em]">Revise os dados extraídos pelo OrganickIA.</p>
                </div>
              </div>
              <button onClick={() => setIsImportModalOpen(false)} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Client Info Detectada */}
              <div className="bg-white/5 p-8 rounded-[24px] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700"><User size={120} /></div>
                <h4 className="text-[10px] font-black uppercase text-blue-500 mb-6 tracking-[0.3em] flex items-center gap-2">
                  <User size={14} /> Dados do Cliente Detectados
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Nome do Cliente</span>
                    <span className="text-lg font-black text-white tracking-tight">{importPreview.cliente?.nome || "Não Detectado"}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Nicho / Setor</span>
                    <span className="text-lg font-black text-white tracking-tight">{importPreview.cliente?.nicho || "Geral"}</span>
                  </div>
                  <div className="space-y-1 md:col-span-2 lg:col-span-1">
                    <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Objetivo Principal</span>
                    <span className="text-sm font-bold text-zinc-300 leading-snug">{importPreview.cliente?.objetivo || "Não Especificado"}</span>
                  </div>
                </div>
              </div>

              {/* Stats & Selection Section */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.3em] flex items-center gap-2 px-1">
                  <CheckCircle2 size={14} /> Selecionar Módulos para Importação
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { id: 'cobo', label: 'Canais', color: 'purple', count: importPreview.cobo?.length, icon: Radio },
                    { id: 'estrategia', label: 'Estratégias', color: 'emerald', count: importPreview.estrategia?.length, icon: Target },
                    { id: 'rdc', label: 'Ideias', color: 'amber', count: importPreview.rdc?.length, icon: Lightbulb },
                    { id: 'planejamento', label: 'Calendário', color: 'rose', count: importPreview.planejamento?.length, icon: LucideCalendar }
                  ].map((tab) => (
                    <div
                      key={tab.id}
                      onClick={() => setImportSelection((prev: any) => ({ ...prev, [tab.id]: !prev[tab.id] }))}
                      className={`p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center
                        ${(importSelection as any)[tab.id]
                          ? `bg-${tab.color}-500/10 border-${tab.color}-500 ring-4 ring-${tab.color}-500/10`
                          : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:bg-white/[0.08]'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 
                        ${(importSelection as any)[tab.id] ? `bg-${tab.color}-500 text-white` : 'bg-white/10 text-zinc-500'}`}>
                        <tab.icon size={24} />
                      </div>
                      <div className={`text-2xl font-black mb-1 ${(importSelection as any)[tab.id] ? 'text-white' : 'text-zinc-500'}`}>{tab.count || 0}</div>
                      <div className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">{tab.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pendencias / Avisos */}
              {importPreview.pendencias && importPreview.pendencias.length > 0 && (
                <div className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[24px] space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-rose-500 tracking-[0.3em] flex items-center gap-2">
                    <ShieldAlert size={16} /> Atenção aos seguintes pontos
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {importPreview.pendencias.map((p: string, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /></div>
                        <p className="text-[11px] font-bold text-rose-400/90 leading-relaxed uppercase tracking-tight">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-[#111114] flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="flex flex-col gap-2 w-full md:w-auto">
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest pl-1">Destino da Importação</span>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="bg-zinc-900 border border-white/10 text-white text-[11px] font-black uppercase rounded-xl px-5 h-12 min-w-[260px] outline-none focus:border-emerald-500 transition-all cursor-pointer shadow-inner"
                >
                  <option value="">-- Vincular a um Cliente --</option>
                  {clients.map((c: any) => <option key={c.id} value={c.id}>{c.Nome}</option>)}
                </select>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <Button variant="ghost" onClick={() => setIsImportModalOpen(false)} className="!h-12 !px-8 !text-[10px] !font-black !uppercase !tracking-[0.2em]">Cancelar</Button>
                <Button
                  onClick={() => handleConfirmImport(selectedClientId)}
                  disabled={!selectedClientId}
                  className="!h-12 !px-10 !bg-emerald-600 !text-white !rounded-xl !text-[10px] !font-black !uppercase !tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                >
                  Confirmar Importação
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
