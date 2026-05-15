import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
    ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard,
    Search, Plus, X, ArrowUpRight, ArrowDownRight,
    DollarSign, Filter, Trash2, Edit3, Clock,
    ChevronDown, Repeat, CalendarClock, Calendar, CheckCircle2,
    PieChart as PieChartIcon, TrendingUp, TrendingDown, Building,
    AlertTriangle, Check, Layers, User, ArrowRight, History,
    Save, PieChart as PieChartLucide, TrendingUp as TrendingUpLucide,
    Sparkles, Mail, Bell, CalendarDays, LayoutDashboard, Receipt,
    Users2, Repeat2, CircleAlert, SlidersHorizontal, Zap,
    ChevronRight, BarChart3, Activity, CreditCard as CreditCardIcon,
    Target, Award, Flame, Star
} from 'lucide-react';
import { sendEmail, templates } from '../utils/emailService';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area,
    LineChart, Line, CartesianGrid, ComposedChart, ReferenceLine
} from 'recharts';
import { ChevronLeft } from 'lucide-react';
import { StatCard, Badge, Button, InputSelect, Card, PSelectPortal, DatePickerPortal } from '../Components';
import { generateId } from '../utils/id';
import { DatabaseService } from '../DatabaseService';

// ==========================================
// UTILS
// ==========================================
const tryPlaySound = (type: string) => {
    if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
};

const formatBRL = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const parseNumericValue = (val: string | number): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = val.toString().replace(/\s/g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

// ==========================================
// CONSTANTS
// ==========================================
const CATEGORIAS: Record<string, string[]> = {
    entrada: ['Gestão de Tráfego', 'Social Media', 'Design Gráfico', 'Consultoria', 'Produção de Vídeo', 'Outros'],
    saida: ['Equipamento', 'Software', 'Impostos', 'Marketing', 'Pró-Labore', 'Hospedagem', 'Infraestrutura', 'Outros'],
    assinatura: ['Streaming', 'SaaS', 'Hospedagem', 'Internet', 'Seguros', 'Outros']
};

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#64748b'];

const normalizarData = (data: string) => {
    if (!data) return '';
    if (data.includes('/')) {
        const [d, m, a] = data.split('/');
        return `${a}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return data.slice(0, 10);
};

// ==========================================
// TYPES
// ==========================================
interface SociosConfig {
    socio1: { nome: string; percentual: number };
    socio2: { nome: string; percentual: number };
}

interface RetiradaSocio {
    id: string;
    workspace_id: string;
    socio: 1 | 2;
    valor: number;
    data: string;
    mes_referencia: string;
    observacao?: string;
    updated_at?: string;
    created_at?: string;
}

// ==========================================
// CALENDAR COMPONENT
// ==========================================
const CalendarView: React.FC<{ 
    transactions: any[], 
    onOpenModal: (tx?: any) => void 
}> = ({ transactions, onOpenModal }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = Array.from({ length: 42 }, (_, i) => {
        const day = i - firstDayOfMonth + 1;
        if (day <= 0 || day > daysInMonth) return null;
        return day;
    });

    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

    const getDayTransactions = (day: number) => {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return transactions.filter(t => t.data === dateStr);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col">
                <div className="p-8 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{monthName}</h3>
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-blue-500 transition-all active:scale-90"><ChevronLeft size={18} /></button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all">Hoje</button>
                        <button onClick={nextMonth} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-blue-500 transition-all active:scale-90"><ChevronRight size={18} /></button>
                    </div>
                </div>
                
                <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                        <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{d}</div>
                    ))}
                </div>

                <div className="flex-1 grid grid-cols-7 grid-rows-6">
                    {days.map((day, i) => {
                        if (day === null) return <div key={`empty-${i}`} className="border-r border-b border-zinc-50 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-900/10"></div>;
                        
                        const dayTxs = getDayTransactions(day);
                        const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                        const dateKey = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                        const isSelected = selectedDay === dateKey;

                        return (
                            <div 
                                key={day} 
                                onClick={() => setSelectedDay(dateKey)}
                                className={`group border-r border-b border-zinc-100 dark:border-zinc-800 p-2 min-h-[100px] transition-all cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-500/5 ${isSelected ? 'bg-blue-50/50 dark:bg-blue-500/10' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-black w-7 h-7 flex items-center justify-center rounded-lg transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                                        {day}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {dayTxs.slice(0, 3).map(t => (
                                        <div 
                                            key={t.id} 
                                            className={`truncate px-2 py-1 rounded-md text-[9px] font-bold border ${
                                                t.tipo === 'entrada' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                                                t.tipo === 'saida' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' : 
                                                'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                            }`}
                                        >
                                            {t.descricao}
                                        </div>
                                    ))}
                                    {dayTxs.length > 3 && (
                                        <div className="text-[8px] font-black text-zinc-400 pl-1">+{dayTxs.length - 3} itens</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-full lg:w-[320px] space-y-4">
                <Card title={selectedDay ? `Dia ${selectedDay.split('-')[2]}/${selectedDay.split('-')[1]}` : "Selecione um dia"} className="shadow-xl bg-white dark:bg-zinc-900 rounded-[32px] border-zinc-200 dark:border-zinc-800">
                    <div className="p-2 space-y-3">
                        {selectedDay ? (
                            <>
                                {getDayTransactions(parseInt(selectedDay.split('-')[2])).length > 0 ? (
                                    getDayTransactions(parseInt(selectedDay.split('-')[2])).map(t => (
                                        <div 
                                            key={t.id} 
                                            onClick={() => onOpenModal(t.raw)}
                                            className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 hover:border-blue-500/50 transition-all cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <Badge color={t.tipo === 'entrada' ? 'green' : t.tipo === 'saida' ? 'red' : 'indigo'}>{t.categoria}</Badge>
                                                <span className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">{formatBRL(t.valor)}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-zinc-500 group-hover:text-blue-500 transition-colors line-clamp-2 uppercase">{t.descricao}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                            <CalendarClock size={20} className="text-zinc-300" />
                                        </div>
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nenhum lançamento</p>
                                        <Button 
                                            onClick={() => onOpenModal({ Data: selectedDay })}
                                            className="mt-4 !h-10 !bg-blue-600/10 !text-blue-600 !border !border-blue-600/20 hover:!bg-blue-600 hover:!text-white !text-[10px]"
                                        >
                                            Novo Item
                                        </Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-20 text-center text-zinc-400">
                                <CalendarDays size={32} className="mb-3 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Escolha uma data para ver detalhes</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

const SavingIndicator = ({ status }: { status?: 'saving' | 'success' | 'error' }) => {
    if (!status) return null;
    return (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10 animate-fade-blur">
            {status === 'saving' && (
                <div className="w-2.5 h-2.5 border-2 border-zinc-400/30 border-t-zinc-400 rounded-full animate-spin"></div>
            )}
            {status === 'success' && (
                <Check size={10} className="text-emerald-500" />
            )}
        </div>
    );
};

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function FinancasTab({ financas = [], onAdd, onUpdate, onDelete, clients, currentWorkspace, savingStatus = {} }: any) {
    const [activeInternalTab, setActiveInternalTab] = useState<'VISAO_GERAL' | 'LANCAMENTOS' | 'CALENDARIO' | 'SOCIOS' | 'MRR' | 'PENDENCIAS'>('VISAO_GERAL');
    const workspaceId = currentWorkspace?.id || 'default';
    const configKey = `ekko_socios_${workspaceId}`;

    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
    const [withdrawalSuggestion, setWithdrawalSuggestion] = useState(0); // valor calculado sugerido
    const [isContractModalOpen, setIsContractModalOpen] = useState(false);
    
    const [editingId, setEditingId] = useState<string | null>(null);
    const [retiradas, setRetiradas] = useState<RetiradaSocio[]>([]);

    // Escape listener for modals
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsModalOpen(false);
                setIsWithdrawalModalOpen(false);
                setIsContractModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);
    
    const [formData, setFormData] = useState({
        tipo: 'entrada',
        categoria: '',
        descricao: '',
        valor: '',
        data: new Date().toISOString().split('T')[0],
        status: 'pago',
        frequencia: 'unica',
        clienteId: '',
        dataFim: '',
        diaPagamento: ''
    });

    const [withdrawalData, setWithdrawalData] = useState({
        socio: 1 as 1 | 2,
        valor: '',
        data: new Date().toISOString().split('T')[0],
        mes_referencia: new Date().toISOString().slice(0, 7),
        observacao: ''
    });

    const [filterPeriod, setFilterPeriod] = useState(() => localStorage.getItem(`ekko_fin_period_${workspaceId}`) || 'este_mes');
    const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
    const [customDateRange, setCustomDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [filterTipo, setFilterTipo] = useState('all');
    const [filterCliente, setFilterCliente] = useState('all');

    const dataInicio = customDateRange.start;
    const dataFim = customDateRange.end;

    // Persist filter
    useEffect(() => {
        localStorage.setItem(`ekko_fin_period_${workspaceId}`, filterPeriod);
    }, [filterPeriod, workspaceId]);

    // Buscar retiradas
    useEffect(() => {
        const loadRetiradas = async () => {
            if (workspaceId && workspaceId !== 'default') {
                try {
                    const data = await DatabaseService.fetchRetiradasSocios(workspaceId);
                    setRetiradas(data || []);
                } catch (err) {
                    console.error('Erro ao carregar retiradas:', err);
                }
            }
        };
        loadRetiradas();
    }, [workspaceId]);

    // Estado local para sócios — reinicia quando workspace muda
    const [sociosConfig, setSociosConfig] = useState<SociosConfig>(() => {
        const cached = localStorage.getItem(configKey);
        return cached ? JSON.parse(cached) : {
            socio1: { nome: 'Sócio 1', percentual: 50 },
            socio2: { nome: 'Sócio 2', percentual: 50 }
        };
    });

    // Re-lê a config quando workspaceId muda (workspace pode carregar depois do mount)
    useEffect(() => {
        const cached = localStorage.getItem(configKey);
        if (cached) {
            setSociosConfig(JSON.parse(cached));
        } else {
            setSociosConfig({ socio1: { nome: 'Sócio 1', percentual: 50 }, socio2: { nome: 'Sócio 2', percentual: 50 } });
        }
    }, [configKey]);
    
    // ==========================================
    // RECURRENCE ENGINE
    // ==========================================
    useEffect(() => {
        if (!financas.length || !onAdd) return;

        const hoje = new Date();
        const mesAtual = hoje.toISOString().slice(0, 7); // '2026-04'
        
        const recorrentes = financas.filter((l: any) => 
            l.Recorrência !== 'Única' && 
            l.Recorrência && 
            l.Data &&
            !l._origem_id // Apenas lançamentos "pai"
        );

        recorrentes.forEach((l: any) => {
            const diaCobranca = l.Dia_Pagamento || new Date(l.Data + 'T12:00:00').getDate();
            const dataGerada = `${mesAtual}-${String(diaCobranca).padStart(2, '0')}`;

            // Se a data gerada for no futuro do mês (ex: hoje é dia 5, vencimento dia 15), ainda geramos
            // Se for no passado do mês e não existe, geramos também.

            const jaExiste = financas.some((x: any) => 
                x.Data === dataGerada && 
                x.Descrição === l.Descrição && 
                (x._origem_id === l.id || x.id === l.id)
            );

            if (!jaExiste) {
                const novoLancamento = {
                    ...l,
                    id: generateId(),
                    Data: dataGerada,
                    Status: 'Pendente',
                    _origem_id: l.id,
                    _auto_gerado: true,
                    workspace_id: workspaceId
                };
                onAdd(novoLancamento);
            }
        });
    }, [workspaceId, financas.length]); // Executa ao carregar ou trocar workspace

    useEffect(() => {
        localStorage.setItem(configKey, JSON.stringify(sociosConfig));
    }, [sociosConfig, configKey]);

    const handleSocioChange = (socio: 'socio1' | 'socio2', field: 'nome' | 'percentual', value: any) => {
        setSociosConfig(prev => {
            const next = { ...prev, [socio]: { ...prev[socio] } };
            if (field === 'percentual') {
                // Valor livre — sem auto-balancear o outro sócio
                next[socio].percentual = Math.min(100, Math.max(0, Number(value) || 0));
            } else {
                next[socio].nome = value;
            }
            return next;
        });
    };

    // Normalização 
    const transactions = React.useMemo(() => {
        return financas.map((t: any) => {
            const rawType = t.Tipo?.toLowerCase()?.normalize("NFD")?.replace(/[\u0300-\u036f]/g, "") || 'entrada';
            let tipo = 'entrada';
            if (rawType.includes('saida') || rawType.includes('despesa')) tipo = 'saida';
            if (rawType.includes('assinatura') || rawType.includes('recorrente')) tipo = 'assinatura';

            return {
                id: t.id,
                tipo,
                categoria: t.Categoria || 'Geral',
                descricao: t.Descrição || '',
                valor: parseNumericValue(t.Valor),
                data: t.Data || '',
                status: t.Status || 'Pendente',
                frequencia: t.Recorrência === 'Mensal' ? 'mensal' : t.Recorrência === 'Anual' ? 'anual' : 'unica',
                clienteId: t.Cliente_ID || '',
                _origem_id: t._origem_id,
                _auto_gerado: !!t._auto_gerado,
                diaPagamento: t.Dia_Pagamento,
                raw: t,
                __archived: !!t.__archived
            };
        });
    }, [financas]);

    // ── Retiradas derivadas do extrato FINANCAS (fonte única de verdade) ──
    const retiradasDerived = useMemo(() => {
        return transactions
            .filter(t =>
                t.tipo === 'saida' &&
                t.categoria?.toLowerCase() === 'pró-labore' &&
                t.descricao?.toLowerCase().includes('retirada')
            )
            .map(t => {
                const isSocio1 = t.descricao?.includes(sociosConfig.socio1.nome);
                return {
                    id: t.id,
                    socio: (isSocio1 ? 1 : 2) as 1 | 2,
                    valor: t.valor,
                    data: t.data || '',
                    mes_referencia: t.data?.slice(0, 7) || '',
                    observacao: t.descricao || ''
                };
            });
    }, [transactions, sociosConfig.socio1.nome]);

    // Data Helpers
    // Filtro de Período do Usuário
    const filtrarPorPeriodo = (lancamentos: any[]) => {
        const hoje = new Date();
        const anoAtual = hoje.getFullYear();
        const mesAtual = hoje.getMonth();

        // Limpar apenas validos
        const validos = lancamentos.filter(f => f.data && f.data.length >= 10);

        switch (filterPeriod) {
            case 'este_mes': {
                const inicio = new Date(anoAtual, mesAtual, 1).toISOString().slice(0, 10);
                const fim = new Date(anoAtual, mesAtual + 1, 0).toISOString().slice(0, 10);
                return validos.filter(f => f.data >= inicio && f.data <= fim);
            }
            case 'mes_passado': {
                const inicio = new Date(anoAtual, mesAtual - 1, 1).toISOString().slice(0, 10);
                const fim = new Date(anoAtual, mesAtual, 0).toISOString().slice(0, 10);
                return validos.filter(f => f.data >= inicio && f.data <= fim);
            }
            case 'ultimos_3_meses': {
                const inicio = new Date(anoAtual, mesAtual - 2, 1).toISOString().slice(0, 10);
                const fim = new Date(anoAtual, mesAtual + 1, 0).toISOString().slice(0, 10);
                return validos.filter(f => f.data >= inicio && f.data <= fim);
            }
            case 'este_ano': {
                const inicio = `${anoAtual}-01-01`;
                const fim = `${anoAtual}-12-31`;
                return validos.filter(f => f.data >= inicio && f.data <= fim);
            }
            case 'tudo':
                return validos;
            case 'personalizado': {
                if (!dataInicio || !dataFim) return validos;
                return validos.filter(f => f.data >= dataInicio && f.data <= dataFim);
            }
            case 'mes_especifico': {
                if (!selectedMonth) return validos;
                const inicio = `${selectedMonth}-01`;
                const fim = new Date(
                    parseInt(selectedMonth.split('-')[0]),
                    parseInt(selectedMonth.split('-')[1]),
                    0
                ).toISOString().slice(0, 10);
                return validos.filter(f => f.data >= inicio && f.data <= fim);
            }
            default:
                return validos;
        }
    };

    const financasFiltradas = useMemo(() => {
        const bkp = filtrarPorPeriodo(transactions);
        return bkp.filter(t => {
            const matchesTipo = filterTipo === 'all' || t.tipo === filterTipo;
            const matchesCliente = filterCliente === 'all' || t.clienteId === filterCliente;
            return matchesTipo && matchesCliente && !t.__archived;
        });
    }, [transactions, filterPeriod, selectedMonth, dataInicio, dataFim, filterTipo, filterCliente]);

    // Relatórios (Tab 1)
    const summary = React.useMemo(() => {
        const receita = financasFiltradas.filter(t => t.tipo === 'entrada' && t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0);
        const despesas = financasFiltradas.filter(t => t.tipo === 'saida' && t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0);
        const aReceber = financasFiltradas.filter(t => t.tipo === 'entrada' && t.status === 'Pendente').reduce((acc, t) => acc + t.valor, 0);
        const inadimplenciaValue = financasFiltradas.filter(t => t.tipo === 'entrada' && t.status === 'Atrasado').reduce((acc, t) => acc + t.valor, 0);
        
        return { receita, despesas, aReceber, inadimplenciaValue, lucro: receita - despesas };
    }, [financasFiltradas]);

    const mrrValue = React.useMemo(() => {
        // Para MRR, consideramos todos os contratos ativos (assinaturas) nesse período (ou vigentes/vigindo agora)
        // Simplificação: todas as entradas recorrentes com status Pendente ou Pago no período.
        return transactions
            .filter(t => t.tipo === 'entrada' && t.frequencia === 'mensal' && !t.__archived)
            .reduce((sum, t) => sum + t.valor, 0);
    }, [transactions]);
    
    // Graficos
    // Graficos Dinâmicos
    const chartData = React.useMemo(() => {
        const isDaily = filterPeriod === 'este_mes' || filterPeriod === 'mes_passado';
        
        if (isDaily) {
            const now = new Date();
            const year = now.getFullYear();
            const month = filterPeriod === 'este_mes' ? now.getMonth() : now.getMonth() - 1;
            const dateObj = new Date(year, month, 1);
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            return Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dayStr = dayNum.toString().padStart(2, '0');
                const monthStr = (month + 1).toString().padStart(2, '0');
                const prefix = `${year}-${monthStr}-${dayStr}`;
                
                return {
                    name: dayStr,
                    Receita: financasFiltradas.filter(t => t.data.startsWith(prefix) && t.tipo === 'entrada' && t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0),
                    Despesa: financasFiltradas.filter(t => t.data.startsWith(prefix) && t.tipo === 'saida' && t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0),
                };
            });
        }

        // Caso contrário: Visão Mensal (últimos 3, 12 meses ou ano atual)
        let months: string[] = [];
        const now = new Date();
        const year = now.getFullYear();

        if (filterPeriod === 'ultimos_3_meses') {
            months = Array.from({ length: 3 }, (_, i) => {
                const d = new Date(year, now.getMonth() - (2 - i), 1);
                return d.toISOString().slice(0, 7);
            });
        } else if (filterPeriod === 'este_ano') {
            months = Array.from({ length: 12 }, (_, i) => `${year}-${(i + 1).toString().padStart(2, '0')}`);
        } else {
            // Tudo ou Personalizado (longo prazo) - últimos 12 meses
            months = Array.from({ length: 12 }, (_, i) => {
                const d = new Date(year, now.getMonth() - (11 - i), 1);
                return d.toISOString().slice(0, 7);
            });
        }

        return months.map(mes => {
            const label = new Date(mes + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase();
            // Para visão macro, usamos o transactions completo mas filtramos pelo mês, 
            // e também respeitamos o filtro de tipo/cliente se necessário (embora o gráfico seja geralmente visão geral)
            // Para consistência, usaremos o transactions completo SEM o filtro de período lateral, mas com o filtro de tipo/cliente
            const base = transactions.filter(t => t.data?.startsWith(mes) && !t.__archived && (filterTipo==='all' || t.tipo === filterTipo) && (filterCliente==='all' || t.clienteId === filterCliente));
            
            return {
                name: label,
                Receita: base.filter(t => t.tipo === 'entrada' && t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0),
                Despesa: base.filter(t => t.tipo === 'saida' && t.status === 'Pago').reduce((acc, t) => acc + t.valor, 0),
            };
        });
    }, [filterPeriod, financasFiltradas, transactions]);

    const pieData = React.useMemo(() => {
        const map: any = {};
        financasFiltradas.forEach(t => {
            if (t.tipo !== 'entrada' && t.status === 'Pago') {
                if (!map[t.categoria]) map[t.categoria] = 0;
                map[t.categoria] += t.valor;
            }
        });
        return Object.keys(map).map(k => ({ name: k, value: map[k] })).sort((a,b) => b.value - a.value);
    }, [financasFiltradas]);

    const topClientes = React.useMemo(() => {
        const dict: any = {};
        financasFiltradas.forEach(t => {
           if (t.tipo === 'entrada' && t.status === 'Pago' && t.clienteId) {
               if(!dict[t.clienteId]) dict[t.clienteId] = 0;
               dict[t.clienteId] += t.valor;
           }
        });
        return Object.keys(dict).map(id => ({
            id,
            nome: clients?.find((c:any) => c.id === id)?.Nome || 'AVULSO',
            valor: dict[id]
        })).sort((a,b) => b.valor - a.valor).slice(0, 5);
    }, [financasFiltradas, clients]);

    // ── Resumo por mês (últimos 24 meses) para o month-picker ──
    const monthlyResults = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 24 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (23 - i), 1);
            const mes = d.toISOString().slice(0, 7);
            const base = transactions.filter(t => !t.__archived && t.data?.startsWith(mes) && t.status === 'Pago');
            const entrada = base.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
            const saida   = base.filter(t => t.tipo === 'saida' || t.tipo === 'assinatura').reduce((a, t) => a + t.valor, 0);
            const resultado = entrada - saida;
            return {
                mes,
                label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase(),
                ano: d.getFullYear().toString().slice(2),
                resultado,
                entrada,
                saida,
                hasData: entrada > 0 || saida > 0
            };
        });
    }, [transactions]);

    // ── ENTERPRISE METRICS ──────────────────────────────────────

    // Posição de caixa líquida (all-time net cash received vs spent)
    const cashPosition = React.useMemo(() => {
        const recebido = transactions.filter(t => t.tipo === 'entrada' && t.status === 'Pago' && !t.__archived).reduce((a, t) => a + t.valor, 0);
        const pago     = transactions.filter(t => (t.tipo === 'saida' || t.tipo === 'assinatura') && t.status === 'Pago' && !t.__archived).reduce((a, t) => a + t.valor, 0);
        return recebido - pago;
    }, [transactions]);

    // Burn rate = média das despesas dos últimos 3 meses completos
    const burnRate = React.useMemo(() => {
        const now = new Date();
        const meses = Array.from({ length: 3 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (i + 1), 1);
            return d.toISOString().slice(0, 7);
        });
        const total = transactions
            .filter(t => (t.tipo === 'saida' || t.tipo === 'assinatura') && t.status === 'Pago' && !t.__archived && meses.some(m => t.data?.startsWith(m)))
            .reduce((a, t) => a + t.valor, 0);
        return total / 3;
    }, [transactions]);

    // Runway = meses que o caixa aguenta no burn rate atual
    const runway = React.useMemo(() => {
        if (burnRate <= 0 || cashPosition <= 0) return null;
        return cashPosition / burnRate;
    }, [cashPosition, burnRate]);

    // Margem líquida do período
    const margemLiquida = React.useMemo(() => {
        if (summary.receita <= 0) return 0;
        return (summary.lucro / summary.receita) * 100;
    }, [summary]);

    // Comparativo com período anterior
    const previousSummary = React.useMemo(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        let inicioAnt = '', fimAnt = '';
        if (filterPeriod === 'este_mes') {
            inicioAnt = new Date(y, m - 1, 1).toISOString().slice(0, 10);
            fimAnt    = new Date(y, m, 0).toISOString().slice(0, 10);
        } else if (filterPeriod === 'mes_passado') {
            inicioAnt = new Date(y, m - 2, 1).toISOString().slice(0, 10);
            fimAnt    = new Date(y, m - 1, 0).toISOString().slice(0, 10);
        } else if (filterPeriod === 'este_ano') {
            inicioAnt = `${y - 1}-01-01`;
            fimAnt    = `${y - 1}-12-31`;
        } else if (filterPeriod === 'mes_especifico' && selectedMonth) {
            // Comparar com mês anterior ao selecionado
            const [sy, sm] = selectedMonth.split('-').map(Number);
            inicioAnt = new Date(sy, sm - 2, 1).toISOString().slice(0, 10);
            fimAnt    = new Date(sy, sm - 1, 0).toISOString().slice(0, 10);
        } else {
            return null;
        }
        const base = transactions.filter(t => !t.__archived && t.data >= inicioAnt && t.data <= fimAnt);
        const rec  = base.filter(t => t.tipo === 'entrada' && t.status === 'Pago').reduce((a, t) => a + t.valor, 0);
        const desp = base.filter(t => t.tipo === 'saida' && t.status === 'Pago').reduce((a, t) => a + t.valor, 0);
        return { receita: rec, despesas: desp, lucro: rec - desp };
    }, [transactions, filterPeriod, selectedMonth]);

    // Cash Flow chart — 12 meses com saldo acumulado corrente
    const cashFlowMonthly = React.useMemo(() => {
        const now = new Date();
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return d.toISOString().slice(0, 7);
        });
        let saldoCorrente = 0;
        return months.map(mes => {
            const base = transactions.filter(t => !t.__archived && t.data?.startsWith(mes) && t.status === 'Pago');
            const entrada = base.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
            const saida   = base.filter(t => t.tipo === 'saida' || t.tipo === 'assinatura').reduce((a, t) => a + t.valor, 0);
            saldoCorrente += entrada - saida;
            return {
                name: new Date(mes + '-01T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase(),
                mes,
                Entradas: entrada,
                Saídas: saida,
                Saldo: saldoCorrente,
                Resultado: entrada - saida
            };
        });
    }, [transactions]);

    // Projeções próximos 3 meses (baseado no MRR + recorrentes de saída)
    const projecoes = React.useMemo(() => {
        const now = new Date();
        const recorrentes = transactions.filter(t => t.frequencia === 'mensal' && !t.__archived);
        return Array.from({ length: 3 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
            const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const proj_entrada = recorrentes.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
            const proj_saida   = recorrentes.filter(t => t.tipo === 'saida' || t.tipo === 'assinatura').reduce((a, t) => a + t.valor, 0);
            return { mes: label, entrada: proj_entrada, saida: proj_saida, resultado: proj_entrada - proj_saida };
        });
    }, [transactions]);

    // Health score 0-100
    const healthScore = React.useMemo(() => {
        let score = 50;
        // Margem
        if (margemLiquida >= 30) score += 20;
        else if (margemLiquida >= 15) score += 10;
        else if (margemLiquida < 0) score -= 20;
        // Runway
        if (runway !== null) {
            if (runway >= 6) score += 20;
            else if (runway >= 3) score += 10;
            else if (runway < 1) score -= 20;
        }
        // Inadimplência
        const taxaInad = summary.receita > 0 ? (summary.inadimplenciaValue / (summary.receita + summary.inadimplenciaValue)) * 100 : 0;
        if (taxaInad < 5) score += 10;
        else if (taxaInad > 20) score -= 10;
        return Math.max(0, Math.min(100, score));
    }, [margemLiquida, runway, summary]);

    // Helpers de crescimento
    const deltaReceita = previousSummary && previousSummary.receita > 0
        ? ((summary.receita - previousSummary.receita) / previousSummary.receita) * 100
        : null;
    const deltaDespesas = previousSummary && previousSummary.despesas > 0
        ? ((summary.despesas - previousSummary.despesas) / previousSummary.despesas) * 100
        : null;
    const deltaLucro = previousSummary && previousSummary.lucro !== 0
        ? ((summary.lucro - previousSummary.lucro) / Math.abs(previousSummary.lucro)) * 100
        : null;
    // ────────────────────────────────────────────────────────────

    // AI Insights narrative text (pierre.finance-inspired)
    const insightText = useMemo(() => {
        const nomeMes = new Date().toLocaleDateString('pt-BR', { month: 'long' });
        const parts: string[] = [];

        if (summary.receita > 0) {
            parts.push(`Em ${nomeMes}, sua receita foi de ${formatBRL(summary.receita)}`);
            if (deltaReceita !== null) {
                parts.push(` — ${deltaReceita >= 0 ? `crescimento de ${deltaReceita.toFixed(1)}%` : `queda de ${Math.abs(deltaReceita).toFixed(1)}%`} em relação ao mês anterior.`);
            } else {
                parts.push(` no período selecionado.`);
            }
        } else {
            parts.push(`Nenhuma receita registrada no período selecionado.`);
        }

        if (summary.despesas > 0 && pieData.length > 0) {
            parts.push(` Sua principal categoria de despesa foi ${pieData[0].name} com ${formatBRL(pieData[0].value)}.`);
        }

        if (summary.lucro > 0) {
            parts.push(` O resultado líquido foi positivo em ${formatBRL(summary.lucro)}, com margem de ${margemLiquida.toFixed(1)}%.`);
        } else if (summary.lucro < 0) {
            parts.push(` Resultado negativo de ${formatBRL(Math.abs(summary.lucro))} — revise as despesas do período.`);
        }

        if (summary.inadimplenciaValue > 0) {
            parts.push(` Há ${formatBRL(summary.inadimplenciaValue)} em inadimplência a cobrar.`);
        }

        return parts.length > 0 ? parts.join('') : 'Adicione lançamentos para visualizar a análise financeira do período.';
    }, [summary, deltaReceita, margemLiquida, pieData]);


    // Handlers Modal
    const handleOpenModal = (tx?: any) => {
        tryPlaySound('open');
        if (tx) {
            setEditingId(tx.id);
            setFormData({
                tipo: tx.tipo,
                categoria: tx.categoria,
                descricao: tx.descricao,
                valor: tx.valor.toString(),
                data: tx.data.split('T')[0],
                status: tx.status,
                frequencia: tx.frequencia,
                clienteId: tx.clienteId,
                dataFim: '',
                diaPagamento: tx.diaPagamento ? tx.diaPagamento.toString() : ''
            });
        } else {
            setEditingId(null);
            setFormData({
                tipo: 'entrada',
                categoria: '',
                descricao: '',
                valor: '',
                data: new Date().toISOString().split('T')[0],
                status: 'pago',
                frequencia: 'unica',
                clienteId: '',
                dataFim: '',
                diaPagamento: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveTransaction = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.valor || !formData.descricao) return;

        tryPlaySound('success');
        
        // Mapear para as chaves reais do banco de dados (Pretty Case com Acentos)
        const dbObject = {
            'Tipo': formData.tipo.charAt(0).toUpperCase() + formData.tipo.slice(1),
            'Categoria': formData.categoria || 'Geral',
            'Descrição': formData.descricao,
            'Valor': parseNumericValue(formData.valor),
            'Data': formData.data,
            'Status': formData.status === 'pago' ? 'Pago' : formData.status === 'pendente' ? 'Pendente' : formData.status,
            'Recorrência': formData.frequencia === 'mensal' ? 'Mensal' : formData.frequencia === 'anual' ? 'Anual' : 'Única',
            'Cliente_ID': formData.clienteId || null,
            'Dia_Pagamento': formData.diaPagamento ? parseInt(formData.diaPagamento) : null
        };

        if (editingId) {
            // Bulk update passando null no campo para o App.tsx tratar como objeto
            if (onUpdate) await onUpdate(editingId, null, dbObject);
        } else {
            if (onAdd) await onAdd(dbObject);
        }

        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;

        const isRecorrente = tx.frequencia !== 'unica';
        
        if (isRecorrente) {
            const msg = "ESTE É UM LANÇAMENTO RECORRENTE.\n\n" +
                        "Clique em OK para excluir ESTE E TODOS OS FILHOS vinculados.\n" +
                        "Clique em CANCELAR para excluir APENAS este lançamento (ou cancelar a ação).";
            
            if (window.confirm(msg)) {
                tryPlaySound('close');
                const idsParaExcluir = transactions
                    .filter(t => t.id === tx.id || t._origem_id === tx.id)
                    .map(t => t.id);
                
                if (onDelete) onDelete(idsParaExcluir);
                return;
            }
        }

        if (window.confirm('Deseja realmente excluir este lançamento?')) {
            tryPlaySound('close');
            if (onDelete) onDelete([id]);
        }
    };

    // Handlers para Retiradas
    const handleSaveWithdrawal = async () => {
        const valorNumerico = parseNumericValue(withdrawalData.valor);
        if (!valorNumerico || valorNumerico <= 0) return;
        tryPlaySound('success');

        const socioNome = withdrawalData.socio === 1 ? sociosConfig.socio1.nome : sociosConfig.socio2.nome;
        const mesRef = withdrawalData.mes_referencia
            ? new Date(withdrawalData.mes_referencia + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            : '';

        const descricao = [
            `Retirada — ${socioNome}`,
            mesRef ? `Ref: ${mesRef}` : '',
            withdrawalData.observacao || ''
        ].filter(Boolean).join(' · ');

        // 1. Registrar como Saída no extrato (operação principal — nunca bloqueia)
        if (onAdd) {
            await onAdd({
                'Tipo': 'Saída',
                'Categoria': 'Pró-Labore',
                'Descrição': descricao,
                'Valor': valorNumerico,
                'Data': withdrawalData.data,
                'Status': 'Pago',
                'Recorrência': 'Única',
                'Cliente_ID': null
            });
        }

        // 2. Salvar no histórico de retiradas (secundário)
        if (workspaceId && workspaceId !== 'default') {
            try {
                const novaRetirada = {
                    workspace_id: workspaceId,
                    socio: withdrawalData.socio,
                    valor: valorNumerico,
                    data: withdrawalData.data,
                    mes_referencia: withdrawalData.mes_referencia,
                    observacao: withdrawalData.observacao
                };
                const result = await DatabaseService.saveRetiradaSocio(novaRetirada, workspaceId);
                if (result) setRetiradas(prev => [...prev, result]);
            } catch (err) {
                console.error('Histórico de retiradas: erro não crítico', err);
            }
        }

        setIsWithdrawalModalOpen(false);
    };

    // Quick Actions
    const handleQuickStatusUpdate = async (id: string, newStatus: string) => {
        tryPlaySound('success');
        const statusMap: any = { 'pago': 'Pago', 'pendente': 'Pendente' };
        if (onUpdate) await onUpdate(id, 'Status', statusMap[newStatus] || newStatus);
    };

    // Pendencias Filter
    const todayStr = new Date().toISOString().split('T')[0];
    const umDiasFrenteStr = new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0];
    
    const pendencias = useMemo(() => ({
        atrasadas: transactions.filter(t => t.tipo === 'entrada' && (t.status === 'Pendente' || t.status === 'Atrasado') && t.data < todayStr && !t.__archived).sort((a,b) => a.data.localeCompare(b.data)),
        vencendo: transactions.filter(t => (t.status === 'Pendente' || t.status === 'Atrasado') && t.data >= todayStr && t.data <= umDiasFrenteStr && !t.__archived).sort((a,b) => a.data.localeCompare(b.data)),
        aPagar: transactions.filter(t => t.tipo !== 'entrada' && t.status === 'Pendente' && t.data > umDiasFrenteStr && !t.__archived).sort((a,b) => a.data.localeCompare(b.data))
    }), [transactions, todayStr, umDiasFrenteStr]);

    const totalPendencias = pendencias.atrasadas.length + pendencias.vencendo.length + pendencias.aPagar.length;

    const handleSendReminder = async (tx: any) => {
        try {
            const settings = JSON.parse(localStorage.getItem(`ekko_settings_${workspaceId}`) || '{}');
            const targetEmail = settings.emailFinanceiro || clients.find((c: any) => c.id === tx.clienteId)?.['Email Financeiro'] || clients.find((c: any) => c.id === tx.clienteId)?.['Email'];
            
            if (!targetEmail) {
                alert('E-mail para financeiro não configurado nas configurações ou no cliente.');
                return;
            }

            const clientName = clients.find((c: any) => c.id === tx.clienteId)?.Nome || 'Cliente';
            const emailData = templates.lembretePagamento(tx.descricao, tx.valor, tx.data, clientName);
            
            await sendEmail({
                to: targetEmail,
                ...emailData
            });
            alert(`Lembrete enviado para ${targetEmail}`);
        } catch (err) {
            console.error('Erro ao enviar lembrete:', err);
            alert('Falha ao enviar lembrete.');
        }
    };

    return (
        <div className="view-root flex-1 min-h-0 flex flex-col bg-zinc-50 dark:bg-[#0a0a0b] overflow-hidden animate-fade-blur">
            {/* ── HEADER PREMIUM ── */}
            <div className="shrink-0 relative overflow-hidden border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 sticky top-0 z-20">
                {/* Mesh gradient background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-400/5 dark:bg-emerald-500/5 rounded-full blur-3xl" />
                    <div className="absolute -top-10 right-0 w-60 h-60 bg-teal-400/5 dark:bg-teal-500/5 rounded-full blur-2xl" />
                </div>

                <div className="relative flex flex-col gap-0">
                    {/* Top row: logo + action */}
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-3.5">
                            <div className="relative">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
                                    <Wallet size={20} strokeWidth={2.5} />
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-zinc-900 rounded-full shadow-sm" />
                            </div>
                            <div>
                                <h1 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">Financeiro</h1>
                                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-400 mt-0.5 hidden sm:block">Gestão Estratégica de Capital</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center gap-2 h-9 px-3 sm:px-4 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-emerald-500/20 shrink-0"
                        >
                            <Plus size={14} strokeWidth={3} />
                            <span className="hidden sm:inline">Lançamento</span>
                            <span className="sm:hidden">Novo</span>
                        </button>
                    </div>

                    {/* Tab navigation — pill style with indicator */}
                    <div className="px-6 pb-0">
                        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar -mb-px">
                            {[
                                { id: 'VISAO_GERAL',  label: 'Dashboard',     icon: LayoutDashboard },
                                { id: 'LANCAMENTOS',  label: 'Lançamentos',   icon: Receipt },
                                { id: 'SOCIOS',       label: 'Sócios',        icon: Users2 },
                                { id: 'MRR',          label: 'MRR',           icon: Activity },
                                { id: 'PENDENCIAS',   label: `Pendências${totalPendencias > 0 ? ` · ${totalPendencias}` : ''}`, icon: CircleAlert }
                            ].map(tab => {
                                const active = activeInternalTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveInternalTab(tab.id as any)}
                                        className={`relative flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
                                            active
                                                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                                                : 'border-transparent text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                        }`}
                                    >
                                        <tab.icon size={12} strokeWidth={active ? 3 : 2} />
                                        {tab.label}
                                        {tab.id === 'PENDENCIAS' && totalPendencias > 0 && (
                                            <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-50 dark:bg-[#0a0a0b]">

                {/* ===============================================================
                    TAB 1: VISÃO GERAL — ENTERPRISE LEVEL
                =============================================================== */}
                {activeInternalTab === 'VISAO_GERAL' && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">

                        {/* ── AI INSIGHTS PANEL (pierre.finance-inspired) ── */}
                        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-zinc-900 via-zinc-800/90 to-zinc-900 dark:from-[#0d1117] dark:via-zinc-900/95 dark:to-[#0d1117] border border-zinc-700/40 shadow-2xl shadow-zinc-900/40 p-6">
                            {/* Ambient glow orbs */}
                            <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-teal-500/8 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                            <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left col: narrative */}
                                <div className="lg:col-span-2 flex flex-col justify-between gap-5">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/25 flex items-center justify-center">
                                                <Sparkles size={13} className="text-emerald-400" />
                                            </div>
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Análise Inteligente · Ekko</span>
                                        </div>
                                        <p className="text-sm font-semibold text-zinc-200 leading-relaxed max-w-lg">
                                            {insightText}
                                        </p>
                                    </div>

                                    {/* Bottom row: health + date */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${
                                            healthScore >= 70
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                : healthScore >= 45
                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                        }`}>
                                            <span className="animate-pulse">●</span>
                                            Score {healthScore} — {healthScore >= 70 ? 'Saudável' : healthScore >= 45 ? 'Atenção' : 'Crítico'}
                                        </div>
                                        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                                            {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>

                                {/* Right col: 3 KPI chips (pierre-style) */}
                                <div className="flex flex-col gap-2.5">
                                    {[
                                        {
                                            label: 'Gasto no mês',
                                            value: formatBRL(summary.despesas),
                                            sub: 'despesas pagas',
                                            color: 'text-rose-400',
                                            icon: TrendingDown,
                                            bg: 'bg-rose-500/10 border-rose-500/15'
                                        },
                                        {
                                            label: 'vs. mês anterior',
                                            value: deltaDespesas !== null ? `${deltaDespesas >= 0 ? '+' : ''}${deltaDespesas.toFixed(1)}%` : '—',
                                            sub: deltaDespesas !== null ? (deltaDespesas <= 0 ? 'despesas reduziram ✓' : 'despesas aumentaram') : 'sem comparativo',
                                            color: deltaDespesas === null ? 'text-zinc-400' : deltaDespesas <= 0 ? 'text-emerald-400' : 'text-rose-400',
                                            icon: deltaDespesas !== null && deltaDespesas <= 0 ? TrendingDown : TrendingUp,
                                            bg: deltaDespesas !== null && deltaDespesas <= 0 ? 'bg-emerald-500/10 border-emerald-500/15' : 'bg-rose-500/10 border-rose-500/15'
                                        },
                                        {
                                            label: 'Maior despesa',
                                            value: pieData[0]?.name || '—',
                                            sub: pieData[0] ? formatBRL(pieData[0].value) : 'sem dados',
                                            color: 'text-amber-400',
                                            icon: Flame,
                                            bg: 'bg-amber-500/10 border-amber-500/15'
                                        },
                                    ].map((chip, i) => (
                                        <div key={i} className={`flex items-center gap-3 px-4 py-3 border rounded-2xl hover:bg-white/[0.05] transition-all cursor-default ${chip.bg}`}>
                                            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                                                <chip.icon size={13} className={chip.color} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em] leading-none mb-1">{chip.label}</p>
                                                <p className={`text-sm font-black leading-none tabular-nums truncate ${chip.color}`}>{chip.value}</p>
                                                <p className="text-[8px] font-bold text-zinc-600 mt-0.5 truncate">{chip.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── Period selector + Month strip ── */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-3 space-y-3">
                            {/* Top row: title + quick filters */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-5 rounded-full bg-gradient-to-b from-emerald-400 to-teal-500" />
                                    <h2 className="text-xs font-black uppercase tracking-tight text-zinc-900 dark:text-white">Painel Financeiro</h2>
                                </div>
                                <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                    {[
                                        { id: 'este_mes',        label: 'Este mês'  },
                                        { id: 'ultimos_3_meses', label: '3 Meses'   },
                                        { id: 'este_ano',        label: 'Este ano'  },
                                        { id: 'tudo',            label: 'Tudo'      },
                                        { id: 'personalizado',   label: '…'         },
                                    ].map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setFilterPeriod(p.id)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterPeriod === p.id && filterPeriod !== 'mes_especifico' ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Month strip — sempre visível, scrollable */}
                            <div className="relative">
                                <div className="flex items-end gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
                                    {monthlyResults.map((m, i) => {
                                        const isSelected = filterPeriod === 'mes_especifico' && selectedMonth === m.mes;
                                        const maxAbs = Math.max(...monthlyResults.map(x => Math.abs(x.resultado)), 1);
                                        const barH = m.hasData ? Math.max(4, Math.round((Math.abs(m.resultado) / maxAbs) * 36)) : 4;
                                        return (
                                            <button
                                                key={m.mes}
                                                onClick={() => {
                                                    setSelectedMonth(m.mes);
                                                    setFilterPeriod('mes_especifico');
                                                }}
                                                title={`${m.label} ${m.ano} — ${m.hasData ? (m.resultado >= 0 ? '+' : '') + formatBRL(m.resultado) : 'Sem dados'}`}
                                                className={`group flex flex-col items-center gap-1 px-1.5 py-1 rounded-xl transition-all duration-150 shrink-0 ${isSelected ? 'bg-zinc-900 dark:bg-zinc-100' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                            >
                                                {/* Bar */}
                                                <div className="flex flex-col justify-end" style={{ height: 40 }}>
                                                    <div
                                                        className={`w-5 rounded-sm transition-all duration-300 ${
                                                            !m.hasData
                                                                ? 'bg-zinc-200 dark:bg-zinc-700 opacity-40'
                                                                : m.resultado >= 0
                                                                    ? isSelected ? 'bg-emerald-400' : 'bg-emerald-500/70 group-hover:bg-emerald-500'
                                                                    : isSelected ? 'bg-rose-400' : 'bg-rose-500/70 group-hover:bg-rose-500'
                                                        }`}
                                                        style={{ height: barH }}
                                                    />
                                                </div>
                                                {/* Label */}
                                                <span className={`text-[7px] font-black uppercase leading-none ${isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                                    {m.label}
                                                </span>
                                                <span className={`text-[6px] font-bold leading-none ${isSelected ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400 dark:text-zinc-600'}`}>
                                                    {m.ano}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Fade edges */}
                                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-white dark:from-zinc-900 to-transparent pointer-events-none" />
                                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-zinc-900 to-transparent pointer-events-none" />
                            </div>

                            {/* Selected month info pill */}
                            {filterPeriod === 'mes_especifico' && (() => {
                                const m = monthlyResults.find(x => x.mes === selectedMonth);
                                if (!m) return null;
                                return (
                                    <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 animate-in fade-in slide-in-from-top-1 duration-150">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={11} className="text-zinc-400" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                                                {m.label} {20}{m.ano} — {m.hasData ? 'dados disponíveis' : 'sem movimentações'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {m.hasData && (
                                                <>
                                                    <span className="text-[9px] font-black text-emerald-500">+{formatBRL(m.entrada)}</span>
                                                    <span className="text-[9px] font-black text-rose-500">−{formatBRL(m.saida)}</span>
                                                    <span className={`text-[9px] font-black tabular-nums ${m.resultado >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-500'}`}>
                                                        = {m.resultado >= 0 ? '+' : ''}{formatBRL(m.resultado)}
                                                    </span>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setFilterPeriod('este_mes')}
                                                className="text-[8px] font-black text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                                            >
                                                ✕ limpar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {filterPeriod === 'personalizado' && (
                            <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">De</span>
                                    <DatePickerPortal value={customDateRange.start} onChange={val => setCustomDateRange(p => ({ ...p, start: val }))} size="sm" clearable={false} className="w-40" />
                                </div>
                                <ChevronRight size={14} className="text-zinc-300" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Até</span>
                                    <DatePickerPortal value={customDateRange.end} onChange={val => setCustomDateRange(p => ({ ...p, end: val }))} size="sm" clearable={false} className="w-40" />
                                </div>
                            </div>
                        )}

                        {/* ══ ROW 1: Posição de Caixa + Saúde Financeira ══ */}
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                            {/* Posição de Caixa — hero card */}
                            <div className="lg:col-span-3 relative overflow-hidden rounded-[28px] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-7 shadow-2xl shadow-zinc-900/30 group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/8 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-emerald-500/12 transition-all duration-1000" />
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/8 rounded-full -ml-16 -mb-16 blur-3xl" />
                                <div className="relative">
                                    <div className="flex items-center justify-between mb-5">
                                        <div>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.25em] mb-1">Posição de Caixa Líquida</p>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Saldo acumulado de todas as movimentações</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20">
                                            <Wallet size={18} className="text-emerald-400" />
                                        </div>
                                    </div>
                                    <p className={`text-5xl font-black tabular-nums tracking-tight mb-2 ${cashPosition >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                        {formatBRL(cashPosition)}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/8">
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Burn Rate / mês</p>
                                            <p className="text-sm font-black text-zinc-300 tabular-nums">{formatBRL(burnRate)}</p>
                                        </div>
                                        {runway !== null && (
                                            <div>
                                                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Runway</p>
                                                <p className={`text-sm font-black tabular-nums ${runway >= 6 ? 'text-emerald-400' : runway >= 3 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                    {runway.toFixed(1)} meses
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Margem Líquida</p>
                                            <p className={`text-sm font-black tabular-nums ${margemLiquida >= 20 ? 'text-emerald-400' : margemLiquida >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                {margemLiquida.toFixed(1)}%
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">MRR</p>
                                            <p className="text-sm font-black text-indigo-400 tabular-nums">{formatBRL(mrrValue)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Saúde Financeira */}
                            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm flex flex-col gap-5">
                                <div>
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Saúde Financeira</p>
                                    <div className="flex items-end justify-between">
                                        <p className={`text-4xl font-black tabular-nums ${healthScore >= 70 ? 'text-emerald-500' : healthScore >= 45 ? 'text-amber-500' : 'text-rose-500'}`}>{healthScore}</p>
                                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-xl border ${healthScore >= 70 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : healthScore >= 45 ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                                            {healthScore >= 70 ? '● Saudável' : healthScore >= 45 ? '● Atenção' : '● Crítico'}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-3">
                                        <div className={`h-full rounded-full transition-all duration-1000 ${healthScore >= 70 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : healthScore >= 45 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`} style={{ width: `${healthScore}%` }} />
                                    </div>
                                </div>
                                {/* Indicadores */}
                                <div className="space-y-2.5">
                                    {[
                                        { label: 'Margem líquida', value: `${margemLiquida.toFixed(1)}%`, ok: margemLiquida >= 15 },
                                        { label: 'Runway', value: runway !== null ? `${runway.toFixed(1)} meses` : '—', ok: runway === null || runway >= 3 },
                                        { label: 'Inadimplência', value: formatBRL(summary.inadimplenciaValue), ok: summary.inadimplenciaValue < summary.receita * 0.1 },
                                        { label: 'A Receber', value: formatBRL(summary.aReceber), ok: true },
                                    ].map((ind, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${ind.ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{ind.label}</span>
                                            </div>
                                            <span className={`text-[10px] font-black tabular-nums ${ind.ok ? 'text-zinc-900 dark:text-white' : 'text-rose-500'}`}>{ind.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ══ ROW 2: KPI Strip com comparativo ══ */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 stagger">
                            {[
                                { label: 'Receita', value: summary.receita, delta: deltaReceita, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/8' },
                                { label: 'Despesas', value: summary.despesas, delta: deltaDespesas ? -deltaDespesas : null, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/8' },
                                { label: 'Resultado', value: summary.lucro, delta: deltaLucro, icon: BarChart3, color: summary.lucro >= 0 ? 'text-emerald-500' : 'text-rose-500', bg: summary.lucro >= 0 ? 'bg-emerald-500/8' : 'bg-rose-500/8' },
                                { label: 'A Receber', value: summary.aReceber, delta: null, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/8' },
                                { label: 'Inadimplente', value: summary.inadimplenciaValue, delta: null, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/8' },
                            ].map((kpi, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                                            <kpi.icon size={13} className={kpi.color} />
                                        </div>
                                        {kpi.delta !== null && (
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg ${kpi.delta >= 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-500'}`}>
                                                {kpi.delta >= 0 ? '▲' : '▼'} {Math.abs(kpi.delta).toFixed(1)}%
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-base font-black tabular-nums leading-none ${kpi.color}`}>{formatBRL(kpi.value)}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mt-1">{kpi.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* ══ ROW 3: Fluxo de Caixa 12 meses (Saldo Corrente) ══ */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Demonstrativo de Fluxo de Caixa</p>
                                    <h3 className="text-sm font-black text-zinc-900 dark:text-white">Evolução 12 meses — Entradas, Saídas e Saldo Corrente</h3>
                                </div>
                                <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5 text-emerald-500"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/70" />Entradas</span>
                                    <span className="flex items-center gap-1.5 text-rose-500"><span className="inline-block w-3 h-3 rounded-sm bg-rose-500/70" />Saídas</span>
                                    <span className="flex items-center gap-1.5 text-indigo-500"><span className="inline-block w-8 h-0.5 bg-indigo-500 rounded" />Saldo</span>
                                </div>
                            </div>
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={cashFlowMonthly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradSaldo" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.06} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} tickFormatter={(v: any) => `${Math.abs(v / 1000).toFixed(0)}k`} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', background: document.documentElement.classList.contains('dark') ? '#18181b' : '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 16px' }}
                                            formatter={(v: any, name: string) => [formatBRL(v as number), name]}
                                        />
                                        <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="4 4" opacity={0.3} />
                                        <Bar dataKey="Entradas" fill="#10b981" opacity={0.75} radius={[3, 3, 0, 0]} maxBarSize={16} />
                                        <Bar dataKey="Saídas" fill="#f43f5e" opacity={0.75} radius={[3, 3, 0, 0]} maxBarSize={16} />
                                        <Line type="monotone" dataKey="Saldo" stroke="#6366f1" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* ══ ROW 4: DFC Formal + Projeções + Custos ══ */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 stagger">

                            {/* DFC — Demonstrativo Formal */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                        <Receipt size={14} className="text-zinc-500" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">DFC</p>
                                        <p className="text-xs font-black text-zinc-900 dark:text-white">Demonstrativo do Período</p>
                                    </div>
                                </div>
                                <div className="space-y-0">
                                    {[
                                        { label: '(+) Receitas Recebidas', value: summary.receita, color: 'text-emerald-600 dark:text-emerald-400', indent: false, bold: false },
                                        { label: '(−) Despesas Pagas', value: -summary.despesas, color: 'text-rose-500', indent: false, bold: false },
                                        { label: '(=) Resultado Operacional', value: summary.lucro, color: summary.lucro >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600', indent: false, bold: true },
                                        null,
                                        { label: 'A Receber (Pendente)', value: summary.aReceber, color: 'text-blue-500', indent: true, bold: false },
                                        { label: 'Inadimplente (Atrasado)', value: -summary.inadimplenciaValue, color: 'text-amber-500', indent: true, bold: false },
                                        null,
                                        { label: 'Caixa Acumulado Total', value: cashPosition, color: cashPosition >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-500', indent: false, bold: true },
                                    ].map((row, i) => row === null ? (
                                        <div key={i} className="h-px bg-zinc-100 dark:bg-zinc-800 my-3" />
                                    ) : (
                                        <div key={i} className={`flex items-center justify-between py-2.5 ${row.bold ? 'border-t border-zinc-200 dark:border-zinc-700 mt-1 pt-3' : ''}`}>
                                            <span className={`text-[9px] font-${row.bold ? 'black' : 'bold'} uppercase tracking-widest text-zinc-${row.indent ? '400' : '600'} dark:text-zinc-${row.indent ? '500' : '400'} ${row.indent ? 'pl-3' : ''}`}>{row.label}</span>
                                            <span className={`text-[10px] font-black tabular-nums ${row.color}`}>{row.value >= 0 ? '+' : ''}{formatBRL(row.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Projeção de caixa — 3 meses */}
                            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-5">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                        <TrendingUp size={14} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Projeção</p>
                                        <p className="text-xs font-black text-zinc-900 dark:text-white">Próximos 3 meses (MRR)</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {projecoes.map((p, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 truncate max-w-[130px]">{p.mes}</span>
                                                <span className={`text-[10px] font-black tabular-nums ${p.resultado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{p.resultado >= 0 ? '+' : ''}{formatBRL(p.resultado)}</span>
                                            </div>
                                            <div className="w-full h-5 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex">
                                                {p.entrada > 0 && <div className="h-full bg-emerald-500/60 transition-all duration-700 rounded-l-xl" style={{ width: `${(p.entrada / (p.entrada + p.saida)) * 100}%`, transitionDelay: `${i * 150}ms` }} title={`Entrada: ${formatBRL(p.entrada)}`} />}
                                                {p.saida > 0 && <div className="h-full bg-rose-500/60 flex-1 transition-all duration-700" style={{ transitionDelay: `${i * 150}ms` }} title={`Saída: ${formatBRL(p.saida)}`} />}
                                            </div>
                                            <div className="flex justify-between text-[8px] font-bold text-zinc-400">
                                                <span>Entrada {formatBRL(p.entrada)}</span>
                                                <span>Saída {formatBRL(p.saida)}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {projecoes.every(p => p.entrada === 0 && p.saida === 0) && (
                                        <div className="flex flex-col items-center gap-2 py-8 text-zinc-300 dark:text-zinc-700">
                                            <Repeat size={28} strokeWidth={1} />
                                            <p className="text-[9px] font-black uppercase tracking-widest text-center">Cadastre contratos MRR para ver a projeção</p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Total projetado</span>
                                    <span className={`text-sm font-black tabular-nums ${projecoes.reduce((a, p) => a + p.resultado, 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                        {formatBRL(projecoes.reduce((a, p) => a + p.resultado, 0))}
                                    </span>
                                </div>
                            </div>

                            {/* Centro de Custo + Top Clientes */}
                            <div className="flex flex-col gap-4">
                                {/* Donut */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-5 shadow-sm flex-1">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Centro de Custo</p>
                                    <p className="text-xs font-black text-zinc-900 dark:text-white mb-3">Despesas por Categoria</p>
                                    {pieData.length > 0 ? (
                                        <>
                                            <div className="h-[110px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={3} dataKey="value" strokeWidth={0}>
                                                            {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                                                        </Pie>
                                                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', background: document.documentElement.classList.contains('dark') ? '#18181b' : '#fff', fontSize: '10px' }} formatter={(v: any) => formatBRL(v)} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="space-y-1.5 max-h-[90px] overflow-y-auto custom-scrollbar">
                                                {pieData.slice(0, 5).map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                            <span className="text-[8px] font-black tracking-widest text-zinc-500 uppercase truncate max-w-[80px]">{item.name}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-zinc-900 dark:text-white tabular-nums">{formatBRL(item.value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-28 text-zinc-300 dark:text-zinc-700">
                                            <p className="text-[9px] font-black uppercase tracking-widest">Sem despesas</p>
                                        </div>
                                    )}
                                </div>
                                {/* Top Clientes */}
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Award size={12} className="text-amber-500" />
                                        <p className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-tight">Top Clientes</p>
                                    </div>
                                    <div className="space-y-2.5">
                                        {topClientes.length === 0 && <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest py-3 text-center">Nenhuma receita</p>}
                                        {topClientes.map((c, i) => {
                                            const pct = Math.round((c.valor / (topClientes[0]?.valor || 1)) * 100);
                                            const cols = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-zinc-400'];
                                            return (
                                                <div key={c.id}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-black text-white shrink-0 ${cols[i] || 'bg-zinc-400'}`}>{i + 1}</div>
                                                            <span className="text-[9px] font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide truncate max-w-[80px]">{c.nome}</span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">{formatBRL(c.valor)}</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                                                        <div className={`h-full rounded-full ${cols[i] || 'bg-zinc-400'}`} style={{ width: `${pct}%`, transition: 'width 0.8s ease', transitionDelay: `${i * 100}ms` }} />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* ===============================================================
                    TAB: CALENDÁRIO
                =============================================================== */}
                {activeInternalTab === 'CALENDARIO' && (
                    <CalendarView 
                        transactions={transactions} 
                        onOpenModal={handleOpenModal} 
                    />
                )}


                {/* ===============================================================
                    TAB 2: LANÇAMENTOS — REDESIGN PREMIUM
                =============================================================== */}
                {activeInternalTab === 'LANCAMENTOS' && (() => {
                    const totalEntradas = financasFiltradas.filter(t => t.tipo === 'entrada').reduce((a, t) => a + t.valor, 0);
                    const totalSaidas = financasFiltradas.filter(t => t.tipo === 'saida' || t.tipo === 'assinatura').reduce((a, t) => a + t.valor, 0);
                    const saldo = totalEntradas - totalSaidas;
                    return (
                    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-300 h-full">
                        {/* Filters bar */}
                        <div className="flex flex-wrap gap-3 items-center">
                            <div className="flex-1 min-w-[180px] relative group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-700 dark:group-focus-within:text-zinc-300 transition-colors" size={14} />
                                <input
                                    type="text" placeholder="Buscar lançamento..."
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 text-[11px] font-black uppercase tracking-widest outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors shadow-sm"
                                />
                            </div>
                            {/* Type filter chips */}
                            <div className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                                {[
                                    { id: 'all', label: 'Todos' },
                                    { id: 'entrada', label: '↑ Receitas' },
                                    { id: 'saida', label: '↓ Despesas' },
                                ].map(t => (
                                    <button key={t.id} onClick={() => setFilterTipo(t.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterTipo === t.id ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <PSelectPortal
                                value={filterCliente}
                                onChange={val => setFilterCliente(val)}
                                options={[{ value: 'all', label: 'Todos clientes' }, ...(clients?.map((cl: any) => ({ value: cl.id, label: cl.Nome })) ?? [])]}
                            />
                            <div className="flex items-center gap-1 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                                {[
                                    { id: 'este_mes', label: 'Mês' },
                                    { id: 'este_ano', label: 'Ano' },
                                    { id: 'tudo', label: 'Tudo' },
                                ].map(p => (
                                    <button key={p.id} onClick={() => setFilterPeriod(p.id)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filterPeriod === p.id ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Table card */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 300px)', minHeight: '400px' }}>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse table-fixed min-w-[780px]">
                                    <thead>
                                        <tr className="bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700/60 sticky top-0 backdrop-blur-sm z-10">
                                            <th className="px-5 py-3 w-[120px] text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em]">Data</th>
                                            <th className="px-5 py-3 text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em]">Descrição</th>
                                            <th className="px-5 py-3 w-[150px] text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em]">Cliente</th>
                                            <th className="px-5 py-3 w-[120px] text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em]">Categoria</th>
                                            <th className="px-5 py-3 w-[120px] text-right text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em]">Valor</th>
                                            <th className="px-5 py-3 w-[115px] text-center text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em]">Status</th>
                                            <th className="px-5 py-3 w-[88px] text-center text-[8px] font-black text-zinc-400 uppercase tracking-[0.18em]">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100/80 dark:divide-zinc-800/40">
                                        {financasFiltradas.sort((a, b) => b.data.localeCompare(a.data)).map((tx, txIdx) => {
                                            const isAtrasado = tx.status !== 'Pago' && tx.data < new Date().toISOString().split('T')[0];
                                            const accentColor = tx.status === 'Pago' ? 'bg-emerald-500' : isAtrasado ? 'bg-rose-500' : tx.tipo === 'entrada' ? 'bg-amber-400' : 'bg-zinc-300 dark:bg-zinc-600';
                                            const clienteNome = clients?.find((cl: any) => cl.id === tx.clienteId)?.Nome;
                                            return (
                                                <tr key={tx.id}
                                                    className="group hover:bg-zinc-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                                                    style={{ animation: `fadeInUp 0.25s cubic-bezier(0.32,0.72,0,1) ${Math.min(txIdx * 15, 250)}ms both` }}
                                                >
                                                    <td className="pl-0 pr-5 py-3.5 text-[10px] font-black text-zinc-500 relative">
                                                        <div className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full ${accentColor}`} />
                                                        <div className="pl-5">
                                                            <div>{new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</div>
                                                            <div className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest">{new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase truncate leading-tight">{tx.descricao}</p>
                                                            {tx._auto_gerado && <Sparkles size={9} className="text-blue-400 shrink-0" />}
                                                        </div>
                                                        {tx.frequencia !== 'unica' && (
                                                            <p className="text-[8px] text-indigo-500 font-black mt-0.5 flex items-center gap-1">
                                                                <Repeat size={8} className="shrink-0" />{tx.frequencia.toUpperCase()}
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        {clienteNome ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black text-zinc-600 dark:text-zinc-300 uppercase truncate max-w-[130px]">
                                                                {clienteNome}
                                                            </span>
                                                        ) : <span className="text-[9px] text-zinc-300 dark:text-zinc-700 font-bold">—</span>}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-[9px] font-black text-zinc-500 uppercase tracking-wide truncate">{tx.categoria}</td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <span className={`text-[11px] font-black tabular-nums ${tx.tipo === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                                            {tx.tipo === 'entrada' ? '+' : '−'}{formatBRL(tx.valor)}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center relative">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); onUpdate(tx.id, 'FINANCAS', 'Status', tx.status === 'Pago' ? 'Pendente' : 'Pago'); }}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider transition-all border hover:scale-105 active:scale-95 ${
                                                                tx.status === 'Pago'
                                                                    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                                                                    : isAtrasado
                                                                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 animate-pulse'
                                                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                                                            }`}
                                                        >
                                                            {tx.status === 'Pago' ? <Check size={8} strokeWidth={3} /> : <Clock size={8} />}
                                                            {tx.status}
                                                        </button>
                                                        <SavingIndicator status={savingStatus[`FINANCAS:${tx.id}:Status`]} />
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                                            {tx.tipo === 'entrada' && tx.status !== 'Pago' && (
                                                                <button onClick={() => handleSendReminder(tx)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-500/10 text-zinc-400 hover:text-blue-500 transition-colors">
                                                                    <Bell size={13} />
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleOpenModal(tx)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                                                                <Edit3 size={13} />
                                                            </button>
                                                            <button onClick={() => handleDelete(tx.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {financasFiltradas.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-zinc-300 dark:text-zinc-700">
                                                        <Receipt size={36} strokeWidth={1} />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhum lançamento encontrado</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer totals */}
                            <div className="px-5 py-3.5 bg-zinc-50/80 dark:bg-zinc-800/30 border-t border-zinc-200/80 dark:border-zinc-700/50 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Entradas</span>
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatBRL(totalEntradas)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Saídas</span>
                                        <span className="text-xs font-black text-rose-500 tabular-nums">{formatBRL(totalSaidas)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Saldo líquido</span>
                                    <span className={`text-sm font-black tabular-nums ${saldo >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-500'}`}>{formatBRL(saldo)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    );
                })()}


                {/* ===============================================================
                    TAB 3: SOCIOS (REDESIGN)
                =============================================================== */}
                {activeInternalTab === 'SOCIOS' && (
                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">

                        {/* ── CONFIGURAÇÃO DE SHARES ── */}
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-sm font-black uppercase text-zinc-900 dark:text-white tracking-tight">Participação dos Sócios</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Configure livremente o percentual de cada sócio</p>
                                </div>
                                {(() => {
                                    const total = sociosConfig.socio1.percentual + sociosConfig.socio2.percentual;
                                    const ok = Math.abs(total - 100) < 0.01;
                                    return (
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${ok ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'}`}>
                                            {ok ? <CheckCircle2 size={12} className="shrink-0" /> : <AlertTriangle size={12} className="shrink-0" />}
                                            Total: {total.toFixed(1)}%
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { key: 'socio1' as const, config: sociosConfig.socio1, gradient: 'from-blue-600 to-indigo-600', color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500', ring: 'focus:ring-blue-500/20 focus:border-blue-500' },
                                    { key: 'socio2' as const, config: sociosConfig.socio2, gradient: 'from-emerald-500 to-teal-500', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500', ring: 'focus:ring-emerald-500/20 focus:border-emerald-500' }
                                ].map(s => (
                                    <div key={s.key} className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4">
                                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-lg font-black shadow-sm shrink-0`}>
                                            {s.config.nome.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <input
                                                type="text"
                                                value={s.config.nome}
                                                onChange={e => handleSocioChange(s.key, 'nome', e.target.value)}
                                                className="bg-transparent border-none outline-none text-sm font-black text-zinc-900 dark:text-white uppercase w-full truncate"
                                                placeholder="Nome do sócio"
                                            />
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Clique para editar o nome</p>
                                        </div>
                                        {/* Percentual livre */}
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                value={s.config.percentual}
                                                onChange={e => handleSocioChange(s.key, 'percentual', e.target.value)}
                                                className={`w-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2 py-2 text-lg font-black ${s.color} focus:outline-none focus:ring-2 ${s.ring} transition-all tabular-nums`}
                                            />
                                            <span className={`text-lg font-black ${s.color}`}>%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── CARDS DE RETIRADA ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
                            {[
                                { id: 1, key: 'socio1' as const, config: sociosConfig.socio1, gradient: 'from-blue-600 via-indigo-600 to-purple-600', shadow: 'shadow-indigo-500/20', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
                                { id: 2, key: 'socio2' as const, config: sociosConfig.socio2, gradient: 'from-emerald-500 via-teal-500 to-cyan-500', shadow: 'shadow-teal-500/20', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' }
                            ].map(s => {
                                const repasseValue = Math.max(0, summary.lucro) * (s.config.percentual / 100);
                                const jaRetirado = retiradasDerived
                                    .filter(r => r.socio === s.id && r.mes_referencia === new Date().toISOString().slice(0, 7))
                                    .reduce((acc, r) => acc + r.valor, 0);
                                const restante = Math.max(0, repasseValue - jaRetirado);

                                return (
                                    <div key={s.id} className="relative group">
                                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${s.gradient} rounded-[32px] opacity-15 blur group-hover:opacity-35 transition duration-700`} />
                                        <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-7 rounded-[28px] shadow-sm flex flex-col gap-5 overflow-hidden">

                                            {/* Header */}
                                            <div className="flex items-center gap-4">
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-2xl font-black shadow-lg ${s.shadow} shrink-0`}>
                                                    {s.config.nome.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-black text-zinc-900 dark:text-white uppercase truncate">{s.config.nome}</h3>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${s.color}`}>{s.config.percentual}% do lucro</p>
                                                </div>
                                                {jaRetirado > 0 && (
                                                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border ${restante > 0.01 ? s.bg + ' ' + s.border + ' ' + s.color : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
                                                        <CheckCircle2 size={10} className="shrink-0" />
                                                        {restante > 0.01 ? 'Parcial' : 'Retirado'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Valores */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className={`p-3.5 rounded-2xl border ${s.bg} ${s.border}`}>
                                                    <p className={`text-[8px] font-black uppercase tracking-widest ${s.color} mb-1`}>Calculado</p>
                                                    <p className={`text-sm font-black ${s.color} tabular-nums leading-none`}>{formatBRL(repasseValue)}</p>
                                                    <p className="text-[8px] text-zinc-400 mt-0.5">{s.config.percentual}% do lucro</p>
                                                </div>
                                                <div className="p-3.5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Retirado</p>
                                                    <p className="text-sm font-black text-zinc-700 dark:text-zinc-300 tabular-nums leading-none">{formatBRL(jaRetirado)}</p>
                                                    <p className="text-[8px] text-zinc-400 mt-0.5">este mês</p>
                                                </div>
                                                <div className={`p-3.5 rounded-2xl border ${restante > 0.01 ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20' : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-800'}`}>
                                                    <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${restante > 0.01 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`}>Restante</p>
                                                    <p className={`text-sm font-black tabular-nums leading-none ${restante > 0.01 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`}>{formatBRL(restante)}</p>
                                                    <p className="text-[8px] text-zinc-400 mt-0.5">a retirar</p>
                                                </div>
                                            </div>

                                            {/* Botão registrar retirada */}
                                            <button
                                                onClick={() => {
                                                    setWithdrawalData(prev => ({ ...prev, socio: s.id as 1|2, valor: '', observacao: '' }));
                                                    setWithdrawalSuggestion(repasseValue);
                                                    setIsWithdrawalModalOpen(true);
                                                }}
                                                className="w-full py-3.5 rounded-2xl border flex items-center justify-center gap-2.5 transition-all font-black text-[11px] uppercase tracking-widest hover:scale-[1.01] hover:shadow-lg active:scale-[0.98] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-transparent shadow-sm"
                                            >
                                                <DollarSign size={15} className="shrink-0" />
                                                Registrar Retirada
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Histórico e Gráfico */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <Card title="Histórico de Retiradas (Últimos 6 meses)" className="xl:col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden">
                                <div className="p-6">
                                    <div className="h-[250px] w-full mb-6">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.1} />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} tickFormatter={v => `R$${v/1000}k`} />
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.08)', background: document.documentElement.classList.contains('dark') ? '#18181b' : '#fff', color: document.documentElement.classList.contains('dark') ? '#f4f4f5' : '#111827' }} />
                                                <Legend />
                                                <Line type="monotone" dataKey="Receita" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                                <Line type="monotone" dataKey="Despesa" stroke="#f43f5e" strokeWidth={3} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                                                    <th className="pb-4">Data</th>
                                                    <th className="pb-4">Sócio</th>
                                                    <th className="pb-4">Referência</th>
                                                    <th className="pb-4 text-right">Valor</th>
                                                    <th className="pb-4 text-right">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                                {[...retiradasDerived].sort((a,b) => b.data.localeCompare(a.data)).slice(0, 5).map(r => (
                                                    <tr key={r.id} className="group">
                                                        <td className="py-4 text-xs font-bold text-zinc-500">{r.data ? new Date(r.data + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                                                        <td className="py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${r.socio === 1 ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                                                                <span className="text-xs font-black uppercase text-zinc-900 dark:text-white">
                                                                    {r.socio === 1 ? sociosConfig.socio1.nome : sociosConfig.socio2.nome}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 text-xs font-bold text-zinc-400">{r.mes_referencia}</td>
                                                        <td className="py-4 text-right text-xs font-black text-zinc-900 dark:text-white">{formatBRL(r.valor)}</td>
                                                        <td className="py-4 text-right">
                                                            <button
                                                                onClick={async () => {
                                                                    if(confirm('Tem certeza? O lançamento será removido do extrato financeiro.')) {
                                                                        if (onDelete) await onDelete([r.id]);
                                                                    }
                                                                }}
                                                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {retiradasDerived.length === 0 && (
                                                    <tr>
                                                        <td colSpan={5} className="py-10 text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest">Nenhuma retirada registrada.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </Card>

                            <div className="space-y-6">
                                <Card title="Resumo do Período" className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-[28px]">
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><ArrowUpCircle size={20}/></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Lucro Acumulado</span>
                                            </div>
                                            <span className="text-sm font-black text-emerald-600">{formatBRL(summary.lucro)}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 rounded-2xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500"><ArrowDownCircle size={20}/></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Retiradas Totais</span>
                                            </div>
                                            <span className="text-sm font-black text-rose-600">{formatBRL(retiradasDerived.reduce((a,b)=>a+b.valor, 0))}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===============================================================
                    TAB 4: MRR — REDESIGN
                =============================================================== */}
                {activeInternalTab === 'MRR' && (
                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-6">
                        {/* Hero MRR */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 stagger">
                            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] p-7 shadow-sm">
                                <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-[0.2em]">Monthly Recurring Revenue</p>
                                        </div>
                                        <div className="flex items-baseline gap-3">
                                            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter tabular-nums">{formatBRL(mrrValue)}</h2>
                                        </div>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{transactions.filter(t => t.tipo === 'entrada' && t.frequencia === 'mensal').length} contratos ativos</p>
                                    </div>
                                </div>
                                <div className="h-[260px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorMrr2" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.07} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} tickFormatter={v => `${v/1000}k`} />
                                            <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', background: document.documentElement.classList.contains('dark') ? '#18181b' : '#fff', fontSize: '11px', fontWeight: 'bold', padding: '10px 16px' }} />
                                            <Area type="monotone" dataKey="Receita" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr2)" dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="space-y-5">
                                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[28px] p-7 text-white shadow-2xl shadow-indigo-600/25 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                    <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-white/15 transition-all duration-700" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Ação rápida</p>
                                    <h3 className="text-base font-black leading-snug mb-6">Adicionar novo contrato recorrente</h3>
                                    <button
                                        onClick={() => { setFormData(prev => ({ ...prev, tipo: 'assinatura', frequencia: 'mensal', status: 'pendente' })); setIsModalOpen(true); }}
                                        className="w-full py-3.5 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} strokeWidth={3} /> Novo Contrato MRR
                                    </button>
                                </div>
                                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[24px] p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target size={14} className="text-indigo-500" />
                                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-900 dark:text-white">Meta MRR</p>
                                    </div>
                                    <div className="space-y-1 mb-3">
                                        <div className="flex justify-between text-[9px] font-black uppercase text-zinc-400">
                                            <span>Atingir R$ 50k</span>
                                            <span className="text-indigo-500">{Math.min(100, Math.round((mrrValue / 50000) * 100))}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (mrrValue / 50000) * 100)}%` }} />
                                        </div>
                                    </div>
                                    <p className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">{formatBRL(mrrValue)} <span className="text-[9px] text-zinc-400 font-bold">/ {formatBRL(50000)}</span></p>
                                </div>
                            </div>
                        </div>

                        {/* Contract cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                            {transactions.filter(t => t.tipo === 'entrada' && t.frequencia === 'mensal').map((t, i) => {
                                const client = clients?.find((c: any) => c.id === t.clienteId);
                                return (
                                    <div key={t.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-[24px] shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300/50 dark:hover:border-indigo-500/30 transition-all duration-300 relative overflow-hidden"
                                        style={{ animation: `fadeInUp 0.25s ease ${i * 50}ms both` }}>
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/3 rounded-full -mr-8 -mt-8 group-hover:bg-indigo-500/8 transition-all duration-500" />
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase truncate max-w-[110px]">{client?.Nome || t.descricao}</h4>
                                                    <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Dia {t.data.split('-')[2]}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-base font-black text-emerald-500 tabular-nums">{formatBRL(t.valor)}</p>
                                                <span className={`inline-block text-[7px] font-black px-1.5 py-0.5 rounded-md mt-0.5 ${t.status === 'Pago' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{t.status}</span>
                                            </div>
                                        </div>
                                        <button onClick={() => handleOpenModal(t)} className="w-full py-2.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl text-[9px] font-black uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                            Editar Contrato
                                        </button>
                                    </div>
                                );
                            })}
                            {transactions.filter(t => t.tipo === 'entrada' && t.frequencia === 'mensal').length === 0 && (
                                <div className="col-span-3 flex flex-col items-center gap-3 py-16 text-zinc-300 dark:text-zinc-700">
                                    <Repeat2 size={40} strokeWidth={1} />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhum contrato MRR cadastrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ===============================================================
                    TAB 5: PENDÊNCIAS — REDESIGN
                =============================================================== */}
                {activeInternalTab === 'PENDENCIAS' && (
                    <div className="animate-in fade-in slide-in-from-bottom-3 duration-300 space-y-5">
                        {/* Summary strip */}
                        <div className="grid grid-cols-3 gap-4 stagger">
                            {[
                                { label: 'Atrasadas', count: pendencias.atrasadas.length, total: pendencias.atrasadas.reduce((a, t) => a + t.valor, 0), color: 'text-rose-500', bg: 'bg-rose-500/8', icon: AlertTriangle },
                                { label: 'Vencendo em 7 dias', count: pendencias.vencendo.length, total: pendencias.vencendo.reduce((a, t) => a + t.valor, 0), color: 'text-amber-500', bg: 'bg-amber-500/8', icon: Clock },
                                { label: 'A Pagar (Futuro)', count: pendencias.aPagar.length, total: pendencias.aPagar.reduce((a, t) => a + t.valor, 0), color: 'text-blue-500', bg: 'bg-blue-500/8', icon: CalendarClock },
                            ].map((s, i) => (
                                <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                                        <s.icon size={16} className={s.color} />
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{s.label}</p>
                                        <p className={`text-sm font-black tabular-nums ${s.color}`}>{s.count > 0 ? formatBRL(s.total) : '—'}</p>
                                        <p className="text-[8px] text-zinc-400 font-bold">{s.count} item{s.count !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Atrasadas */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 dark:bg-rose-500/8 rounded-2xl border border-rose-100 dark:border-rose-500/15">
                                <AlertTriangle className="text-rose-500 shrink-0" size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Atrasadas</span>
                                {pendencias.atrasadas.length > 0 && <span className="ml-auto text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded-full">{pendencias.atrasadas.length}</span>}
                            </div>
                            {pendencias.atrasadas.map((t, i) => (
                                <div key={t.id} className="group bg-white dark:bg-zinc-900 border border-rose-200/70 dark:border-rose-900/60 rounded-[20px] p-4 shadow-sm hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 transition-all relative overflow-hidden"
                                    style={{ animation: `fadeInUp 0.2s ease ${i * 40}ms both` }}>
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-rose-500 rounded-l-full" />
                                    <div className="pl-2">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase leading-tight flex-1">{t.descricao}</p>
                                            <span className="text-[8px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded-lg border border-rose-200/50 dark:border-rose-500/15 shrink-0 whitespace-nowrap">
                                                {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-[8px] text-zinc-400 font-bold uppercase truncate mb-2.5">{clients?.find((c: any) => c.id === t.clienteId)?.Nome || 'Sem cliente'}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black text-zinc-900 dark:text-white tabular-nums">{formatBRL(t.valor)}</span>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleQuickStatusUpdate(t.id, 'pago')} className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-black uppercase rounded-lg transition-all hover:scale-105 active:scale-95">
                                                    <Check size={10} strokeWidth={3} /> Pago
                                                </button>
                                                <button onClick={() => handleSendReminder(t)} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-zinc-400 hover:text-blue-500 flex items-center justify-center transition-colors">
                                                    <Bell size={11} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {pendencias.atrasadas.length === 0 && (
                                <div className="flex flex-col items-center gap-2 py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-300 dark:text-zinc-700">
                                    <Check size={24} strokeWidth={1} />
                                    <p className="text-[9px] font-black uppercase tracking-widest">Nada atrasado</p>
                                </div>
                            )}
                        </div>

                        {/* Vencendo */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 dark:bg-amber-500/8 rounded-2xl border border-amber-100 dark:border-amber-500/15">
                                <Clock className="text-amber-500 shrink-0" size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">Vencendo (7 dias)</span>
                                {pendencias.vencendo.length > 0 && <span className="ml-auto text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{pendencias.vencendo.length}</span>}
                            </div>
                            {pendencias.vencendo.map((t, i) => (
                                <div key={t.id} className="group bg-white dark:bg-zinc-900 border border-amber-200/70 dark:border-amber-900/60 rounded-[20px] p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                                    style={{ animation: `fadeInUp 0.2s ease ${i * 40}ms both` }}>
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-full" />
                                    <div className="pl-2">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase leading-tight flex-1">{t.descricao}</p>
                                            <span className="text-[8px] font-black text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-200/50 dark:border-amber-500/15 shrink-0 whitespace-nowrap">
                                                {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-[8px] text-zinc-400 font-bold uppercase truncate mb-2.5">{clients?.find((c: any) => c.id === t.clienteId)?.Nome || 'Sem cliente'}</p>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-black tabular-nums ${t.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-500'}`}>{formatBRL(t.valor)}</span>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleQuickStatusUpdate(t.id, 'pago')} className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[8px] font-black uppercase rounded-lg transition-all hover:scale-105 active:scale-95">
                                                    <Check size={10} strokeWidth={3} /> Baixa
                                                </button>
                                                {t.tipo === 'entrada' && (
                                                    <button onClick={() => handleSendReminder(t)} className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-zinc-400 hover:text-blue-500 flex items-center justify-center transition-colors">
                                                        <Bell size={11} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {pendencias.vencendo.length === 0 && (
                                <div className="flex flex-col items-center gap-2 py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-300 dark:text-zinc-700">
                                    <Clock size={24} strokeWidth={1} />
                                    <p className="text-[9px] font-black uppercase tracking-widest">Nada a vencer</p>
                                </div>
                            )}
                        </div>

                        {/* A Pagar */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-500/8 rounded-2xl border border-blue-100 dark:border-blue-500/15">
                                <CalendarClock className="text-blue-500 shrink-0" size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">A Pagar (Futuro)</span>
                                {pendencias.aPagar.length > 0 && <span className="ml-auto text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-full">{pendencias.aPagar.length}</span>}
                            </div>
                            {pendencias.aPagar.map((t, i) => (
                                <div key={t.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[20px] p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                                    style={{ animation: `fadeInUp 0.2s ease ${i * 40}ms both` }}>
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-400 rounded-l-full" />
                                    <div className="pl-2">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase leading-tight flex-1">{t.descricao}</p>
                                            <span className="text-[8px] font-black text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-lg border border-blue-200/50 dark:border-blue-500/15 shrink-0 whitespace-nowrap">
                                                {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <p className="text-[8px] text-zinc-400 font-bold uppercase truncate mb-2.5">{clients?.find((c: any) => c.id === t.clienteId)?.Nome || 'Sem cliente'}</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black text-rose-500 tabular-nums">{formatBRL(t.valor)}</span>
                                            <button onClick={() => handleQuickStatusUpdate(t.id, 'pago')} className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[8px] font-black uppercase rounded-lg transition-colors">
                                                <Check size={10} strokeWidth={3} /> Pago
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {pendencias.aPagar.length === 0 && (
                                <div className="flex flex-col items-center gap-2 py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-300 dark:text-zinc-700">
                                    <CalendarClock size={24} strokeWidth={1} />
                                    <p className="text-[9px] font-black uppercase tracking-widest">Livre de contas futuras</p>
                                </div>
                            )}
                        </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── MODAL PREMIUM ── */}
            {isModalOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/75 backdrop-blur-lg animate-fade-blur" onClick={() => setIsModalOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-[32px] shadow-2xl shadow-zinc-900/20 flex flex-col overflow-hidden animate-zoom-in max-h-[92vh]">

                        {/* Modal header */}
                        <div className="relative overflow-hidden px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-50/80 to-transparent dark:from-zinc-800/30 dark:to-transparent" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${editingId ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-zinc-800 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800'}`}>
                                        {editingId ? <Edit3 size={15} /> : <Plus size={15} strokeWidth={3} />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.1em] leading-none">
                                            {editingId ? 'Editar Lançamento' : 'Nova Movimentação'}
                                        </h3>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                                            {editingId ? 'Ajuste os dados do lançamento' : 'Registre uma entrada, saída ou recorrente'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all hover:rotate-90">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSaveTransaction} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-inner">
                                {[
                                    { id: 'entrada', label: 'RECEITA', color: 'bg-emerald-500', icon: ArrowUpRight },
                                    { id: 'saida', label: 'DESPESA', color: 'bg-rose-500', icon: ArrowDownRight },
                                    { id: 'assinatura', label: 'RECORRENTE', color: 'bg-indigo-500', icon: Repeat }
                                ].map(t => (
                                    <button
                                        key={t.id} type="button"
                                        onClick={() => setFormData({...formData, tipo: t.id, frequencia: t.id === 'assinatura' ? 'mensal' :'unica'})}
                                        className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${formData.tipo === t.id ? `${t.color} text-white shadow-lg scale-[1.02] z-10` : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-white/50 dark:hover:bg-zinc-700/50'}`}
                                    >
                                        <t.icon size={14} strokeWidth={3} /> {t.label}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">VALOR</label>
                                    <div className="flex items-center gap-2 group w-full h-14 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 focus-within:border-zinc-900/10 dark:focus-within:border-white/10 transition-all">
                                        <div className="font-black text-zinc-400 text-xs shrink-0">R$</div>
                                        <input type="number" step="0.01" required value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="flex-1 bg-transparent border-none outline-none text-xl font-black tabular-nums text-zinc-900 dark:text-zinc-100 placeholder-zinc-300 min-w-0" placeholder="0,00" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">DATA EFETIVA</label>
                                    <DatePickerPortal
                                        value={formData.data}
                                        onChange={val => setFormData({...formData, data: val})}
                                        clearable={false}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">DESCRIÇÃO</label>
                                <input type="text" required value={formData.descricao} onChange={e => setFormData({...formData, descricao: e.target.value})} className="w-full h-14 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 text-sm font-black uppercase tracking-tight outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-all placeholder-zinc-400" placeholder="Ex: Licença Adobe..." />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">CLIENTE</label>
                                    <InputSelect value={formData.clienteId} onChange={v => setFormData({...formData, clienteId: v})} options={[{value: '', label: 'LANÇAMENTO AVULSO'}, ...(clients?.map((cl:any) => ({value: cl.id, label: cl.Nome.toUpperCase()})) || [])]} className="!rounded-2xl !h-14 !bg-zinc-50 dark:!bg-zinc-800 border-2 !border-zinc-100 dark:!border-zinc-800 !text-xs !font-black !uppercase" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">STATUS</label>
                                    <InputSelect value={formData.status} onChange={v => setFormData({...formData, status: v})} options={[{value: 'pago', label: 'PAGO / CONCLUÍDO'}, {value: 'pendente', label: 'PENDENTE'}]} className={`!rounded-2xl !h-14 border-2 !border-zinc-100 dark:!border-zinc-800 !text-xs !font-black !uppercase ${formData.status === 'pago' ? '!text-emerald-500' : '!text-amber-500'}`} />
                                </div>
                            </div>

                            {formData.tipo === 'assinatura' && (
                                <div className="p-5 border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-2xl space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-indigo-500 flex items-center gap-2"><Repeat size={14}/> DETALHES DA RECORRÊNCIA</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">CICLO</p>
                                            <InputSelect value={formData.frequencia} onChange={v => setFormData({...formData, frequencia: v})} options={[{value:'mensal', label:'MENSAL'}, {value:'anual', label:'ANUAL'}]} className="!h-10 !rounded-xl !text-[10px] !font-black" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1">DIA VENCIMENTO</p>
                                            <input 
                                                type="number" min="1" max="31"
                                                value={formData.diaPagamento}
                                                onChange={e => setFormData({...formData, diaPagamento: e.target.value})}
                                                placeholder="Ex: 10"
                                                className="w-full h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 text-[10px] font-black focus:border-indigo-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">CATEGORIA</label>
                                <InputSelect 
                                    editable
                                    value={formData.categoria} 
                                    onChange={v => setFormData({...formData, categoria: v})} 
                                    options={CATEGORIAS[formData.tipo]?.map(c => ({value: c, label: c})) || []} 
                                    className="!rounded-2xl !h-14 !bg-zinc-50 dark:!bg-zinc-800 border-2 !border-zinc-100 dark:!border-zinc-800 !text-xs !font-black !uppercase"
                                />
                            </div>
                        </form>

                        <div className="px-8 py-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col md:flex-row items-center gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="w-full md:w-auto px-6 py-4 md:py-3 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-rose-500 transition-colors">Cancelar</button>
                            <button
                                type="button"
                                onClick={() => handleSaveTransaction()}
                                className={`w-full md:flex-1 h-14 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                                    formData.tipo === 'entrada'    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/25'
                                    : formData.tipo === 'assinatura' ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-indigo-500/25'
                                    : 'bg-gradient-to-br from-rose-500 to-pink-600 shadow-rose-500/25'
                                }`}
                            >
                                <CheckCircle2 size={18} className="shrink-0" /> {editingId ? 'Salvar Edição' : 'Confirmar Lançamento'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL DE RETIRADA */}
            {isWithdrawalModalOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-sm animate-fade-blur" onClick={() => setIsWithdrawalModalOpen(false)} />
                    <div className="relative w-full max-w-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[28px] shadow-2xl animate-fade-up">

                        {/* Header */}
                        <div className="flex items-center justify-between px-7 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-black text-white bg-gradient-to-br shrink-0 shadow-md ${withdrawalData.socio === 1 ? 'from-blue-600 to-indigo-600 shadow-indigo-500/20' : 'from-emerald-500 to-teal-500 shadow-teal-500/20'}`}>
                                    {(withdrawalData.socio === 1 ? sociosConfig.socio1.nome : sociosConfig.socio2.nome).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">Retirada de Sócio</p>
                                    <p className="text-base font-black text-zinc-900 dark:text-white uppercase leading-none">
                                        {withdrawalData.socio === 1 ? sociosConfig.socio1.nome : sociosConfig.socio2.nome}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsWithdrawalModalOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
                                <X size={16} strokeWidth={2.5} />
                            </button>
                        </div>

                        <div className="px-7 py-6 space-y-5">

                            {/* Valor */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Valor da Retirada</label>
                                    {withdrawalSuggestion > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setWithdrawalData(prev => ({ ...prev, valor: withdrawalSuggestion.toFixed(2) }))}
                                            className="text-[9px] font-black text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-500/20 transition-all flex items-center gap-1"
                                        >
                                            Usar: {formatBRL(withdrawalSuggestion)}
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-200 dark:border-zinc-700 focus-within:border-blue-500 dark:focus-within:border-blue-500 rounded-2xl px-5 py-3.5 transition-all">
                                    <span className="text-lg font-black text-zinc-300 dark:text-zinc-600 shrink-0 select-none">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        autoFocus
                                        placeholder="0,00"
                                        value={withdrawalData.valor}
                                        onChange={e => setWithdrawalData(prev => ({ ...prev, valor: e.target.value }))}
                                        className="flex-1 min-w-0 bg-transparent border-none outline-none text-2xl font-black text-zinc-900 dark:text-white tabular-nums placeholder:text-zinc-300 dark:placeholder:text-zinc-700 [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden"
                                    />
                                </div>
                            </div>

                            {/* Data + Referência */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Data da Saída</label>
                                    <input
                                        type="date"
                                        value={withdrawalData.data}
                                        onChange={e => setWithdrawalData(prev => ({ ...prev, data: e.target.value }))}
                                        className="w-full h-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Referência</label>
                                    <input
                                        type="month"
                                        value={withdrawalData.mes_referencia}
                                        onChange={e => setWithdrawalData(prev => ({ ...prev, mes_referencia: e.target.value }))}
                                        className="w-full h-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all [&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Observação */}
                            <div>
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Observação <span className="normal-case font-medium text-zinc-300">(opcional)</span></label>
                                <input
                                    type="text"
                                    placeholder="Ex: Pró-labore maio, comissão, adiantamento..."
                                    value={withdrawalData.observacao}
                                    onChange={e => setWithdrawalData(prev => ({ ...prev, observacao: e.target.value }))}
                                    className="w-full h-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 text-[11px] text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                                />
                            </div>

                            {/* Aviso */}
                            <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-3">
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                                <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                    Registrado como <strong className="font-black">Saída · Pró-Labore</strong> no extrato
                                </p>
                            </div>

                            {/* Botões */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => setIsWithdrawalModalOpen(false)}
                                    className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveWithdrawal}
                                    disabled={!withdrawalData.valor || parseNumericValue(withdrawalData.valor) <= 0}
                                    className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5"
                                >
                                    <Check size={14} className="shrink-0" /> Registrar Saída
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
