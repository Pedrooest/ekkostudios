import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import {
    ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard,
    Search, Plus, X, ArrowUpRight, ArrowDownRight,
    DollarSign, Filter, Trash2, Edit3, Clock,
    ChevronDown, Repeat, CalendarClock, Calendar, CheckCircle2,
    PieChart as PieChartIcon, TrendingUp, TrendingDown, Building, 
    AlertTriangle, Check, Layers, User, ArrowRight, History, 
    Save, PieChart as PieChartLucide, TrendingUp as TrendingUpLucide,
    Sparkles, Mail, Bell
} from 'lucide-react';
import { sendEmail, templates } from '../utils/emailService';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, AreaChart, Area, 
    LineChart, Line, CartesianGrid 
} from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StatCard, Badge, Button, InputSelect, Card } from '../Components';
import { generateId } from '../utils/id';

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
                                <i className="fa-solid fa-calendar-day mb-3 text-2xl opacity-20"></i>
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
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10 animate-fade">
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
            if (workspaceId !== 'default' && (window as any).DatabaseService) {
                try {
                    const data = await (window as any).DatabaseService.fetchRetiradasSocios(workspaceId);
                    setRetiradas(data || []);
                } catch (err) {
                    console.error('Erro ao carregar retiradas:', err);
                }
            }
        };
        loadRetiradas();
    }, [workspaceId]);

    // Estado local para sócios
    const [sociosConfig, setSociosConfig] = useState<SociosConfig>(() => {
        const cached = localStorage.getItem(configKey);
        return cached ? JSON.parse(cached) : {
            socio1: { nome: 'Sócio 1', percentual: 50 },
            socio2: { nome: 'Sócio 2', percentual: 50 }
        };
    });
    
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
            const next = { ...prev };
            
            if (field === 'percentual') {
                const val = Math.min(100, Math.max(0, Number(value) || 0));
                next[socio].percentual = val;
                
                // Balancear o outro socio para somar 100%
                const otherSocio = socio === 'socio1' ? 'socio2' : 'socio1';
                next[otherSocio].percentual = 100 - val;
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
    }, [transactions, filterPeriod, dataInicio, dataFim, filterTipo, filterCliente]);

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
        
        // Usar as chaves do frontend (camelCase) para consistência
        const updatedObject = {
            tipo: formData.tipo,
            categoria: formData.categoria || 'Geral',
            descricao: formData.descricao,
            valor: parseNumericValue(formData.valor),
            data: formData.data,
            status: formData.status === 'pago' ? 'Pago' : formData.status === 'pendente' ? 'Pendente' : formData.status,
            frequencia: formData.frequencia,
            clienteId: formData.clienteId || null,
            diaPagamento: formData.diaPagamento ? parseInt(formData.diaPagamento) : null
        };

        if (editingId) {
            // Bulk update passando null no campo
            if (onUpdate) await onUpdate(editingId, null, updatedObject);
        } else {
            if (onAdd) await onAdd(updatedObject);
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
        if (!withdrawalData.valor || !workspaceId) return;
        tryPlaySound('success');
        
        try {
            const novaRetirada = {
                workspace_id: workspaceId,
                socio: withdrawalData.socio,
                valor: parseNumericValue(withdrawalData.valor),
                data: withdrawalData.data,
                mes_referencia: withdrawalData.mes_referencia,
                observacao: withdrawalData.observacao
            };

            const result = await (window as any).DatabaseService.createRetiradaSocio(novaRetirada);
            if (result) {
                setRetiradas(prev => [...prev, result]);
                setIsWithdrawalModalOpen(false);
            }
        } catch (err) {
            console.error('Erro ao salvar retirada:', err);
        }
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
        <div className="view-root flex-1 min-h-0 flex flex-col bg-white dark:bg-zinc-950 overflow-hidden animate-fade">
            {/* Header */}
            <div className="shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Wallet size={20} className="shrink-0" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">Financeiro Corporate</h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">Gestão Estratégica de Capital</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                        {[
                            { id: 'VISAO_GERAL', label: 'Dashboard' },
                            { id: 'LANCAMENTOS', label: 'Lançamentos' },
                            { id: 'SOCIOS', label: 'Sócios' },
                            { id: 'MRR', label: 'Gestão MRR' },
                            { id: 'PENDENCIAS', label: `Pendências (${totalPendencias})` }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveInternalTab(tab.id as any)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeInternalTab === tab.id ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <Button onClick={() => handleOpenModal()} className="!h-[36px] px-4 shrink-0 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 shadow-xl border-none">
                        <Plus size={16} className="mr-2 shrink-0" /> Lancar
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-zinc-50 dark:bg-[#0a0a0b]">
                
                {/* ===============================================================
                    TAB 1: VISÃO GERAL
                =============================================================== */}
                {activeInternalTab === 'VISAO_GERAL' && (
                    <div className="space-y-6">
                        {/* Seletor de Período */}
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Visão Financeira</h2>
                            
                            <div className="flex items-center gap-1.5 p-1 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-2xl">
                                {[
                                    { id: 'este_mes', label: 'Este mês' },
                                    { id: 'mes_passado', label: 'Mês passado' },
                                    { id: 'ultimos_3_meses', label: '3 Meses' },
                                    { id: 'este_ano', label: 'Este ano' },
                                    { id: 'tudo', label: 'Tudo' },
                                    { id: 'personalizado', label: 'Personalizado' }
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setFilterPeriod(p.id)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${filterPeriod === p.id ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filterPeriod === 'personalizado' && (
                            <div className="flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">De</span>
                                    <input 
                                        type="date" 
                                        value={customDateRange.start}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                        className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <ArrowRight size={14} className="text-zinc-400 shrink-0" />
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-zinc-400">Até</span>
                                    <input 
                                        type="date" 
                                        value={customDateRange.end}
                                        onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                        className="bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                            <StatCard label="Receita" value={formatBRL(summary.receita)} icon={TrendingUp} color="emerald" />
                            <StatCard label="Despesas" value={formatBRL(summary.despesas)} icon={TrendingDown} color="rose" />
                            <StatCard label="Lucro Líquido" value={formatBRL(summary.lucro)} icon={Wallet} color={summary.lucro >= 0 ? "emerald" : "rose"} />
                            <StatCard label="Inadimplência" value={formatBRL(summary.inadimplenciaValue)} icon={AlertTriangle} color="amber" />
                            <StatCard label="A Receber" value={formatBRL(summary.aReceber)} icon={Clock} color="blue" />
                            <StatCard label="MRR Atual" value={formatBRL(mrrValue)} icon={Repeat} color="indigo" />
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            <Card title="Fluxo Semestral (R$)" className="xl:col-span-2 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 !p-6 rounded-3xl">
                                <div className="h-[280px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a', fontWeight: 'bold' }} tickFormatter={(v) => `R$${v/1000}k`} />
                                            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#18181b', color: '#fff', fontSize: '11px', fontWeight: 'bold' }} />
                                            <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                            <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                            <Bar dataKey="Despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <div className="space-y-6 flex flex-col">
                                <Card title="Despesas (Centro de Custo)" className="flex-1 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl">
                                    <div className="h-[200px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#18181b', color: '#fff', fontSize: '11px' }} formatter={(v:any) => formatBRL(v)} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="px-6 pb-6 pt-0 space-y-2 max-h-[140px] overflow-y-auto custom-scrollbar">
                                        {pieData.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                                                    <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">{item.name}</span>
                                                </div>
                                                <span className="text-xs font-black text-zinc-900 dark:text-white tabular-nums">{formatBRL(item.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card title="Top Clientes Mês" className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-3xl">
                                    <div className="p-6 space-y-4">
                                        {topClientes.map((c, i) => (
                                            <div key={c.id}>
                                                <div className="flex justify-between text-[10px] font-black tracking-wide uppercase mb-1">
                                                    <span className="text-zinc-600 dark:text-zinc-300">{i+1}. {c.nome}</span>
                                                    <span className="text-emerald-500">{formatBRL(c.valor)}</span>
                                                </div>
                                                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(c.valor / topClientes[0].valor) * 100}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
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
                    TAB 2: LANÇAMENTOS
                =============================================================== */}
                {activeInternalTab === 'LANCAMENTOS' && (
                    <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 !p-0 rounded-3xl overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="flex-1 min-w-[200px] relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 shrink-0" size={14} />
                                <input 
                                    type="text" placeholder="Buscar LANÇAMENTO..."
                                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 text-[11px] font-black uppercase tracking-widest outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-300">
                                <option value="all">Tipos</option>
                                <option value="entrada">Receitas</option>
                                <option value="saida">Despesas</option>
                            </select>
                            <select value={filterCliente} onChange={e => setFilterCliente(e.target.value)} className="h-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:border-emerald-500 text-zinc-700 dark:text-zinc-300">
                                <option value="all">Clientes (Todos)</option>
                                {clients?.map((cl:any) => <option key={cl.id} value={cl.id}>{cl.Nome}</option>)}
                            </select>
                        </div>
                        <div className="table-responsive flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
                                <thead>
                                    <tr className="bg-zinc-50/80 dark:bg-zinc-900/40 text-[9px] font-black text-zinc-400 uppercase tracking-widest sticky top-0 backdrop-blur-sm z-10">
                                        <th className="px-6 py-4 w-[110px]">Data</th>
                                        <th className="px-6 py-4 w-[60px]">Dia</th>
                                        <th className="px-6 py-4">Descrição</th>
                                        <th className="px-6 py-4 w-[160px]">Cliente</th>
                                        <th className="px-6 py-4 w-[120px]">Categoria</th>
                                        <th className="px-6 py-4 w-[110px]">Valor</th>
                                        <th className="px-6 py-4 w-[110px] text-center">Status</th>
                                        <th className="px-6 py-4 w-[100px] text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                    {financasFiltradas
                                        .sort((a,b) => b.data.localeCompare(a.data))
                                        .map(tx => {
                                            const isAtrasado = tx.status !== 'Pago' && tx.data < new Date().toISOString().split('T')[0];
                                            return (
                                                <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 group transition-colors">
                                                    <td className="px-6 py-4 text-[10px] font-black text-zinc-500">{new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                        {new Date(tx.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-black text-zinc-900 dark:text-white uppercase truncate">{tx.descricao}</p>
                                                            {tx._auto_gerado && <span title="Gerado Automaticamente" className="p-1 rounded-full bg-blue-500/10 text-blue-500"><Sparkles size={10}/></span>}
                                                        </div>
                                                        {tx.frequencia !== 'unica' && <p className="text-[9px] text-indigo-500 font-bold mt-0.5"><Repeat size={10} className="inline mr-1 shrink-0"/>{tx.frequencia.toUpperCase()}</p>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge color="slate" className="!text-[9px] px-2 py-0.5 truncate max-w-[130px] block">
                                                            {clients?.find((cl:any) => cl.id === tx.clienteId)?.Nome || '-'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-[9px] font-black text-zinc-500 uppercase tracking-wider">{tx.categoria}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-xs font-black tabular-nums ${tx.tipo === 'entrada' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {tx.tipo === 'entrada' ? '+' : '-'}{formatBRL(tx.valor)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center relative">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onUpdate(tx.id, 'FINANCAS', 'Status', tx.status === 'Pago' ? 'Pendente' : 'Pago');
                                                            }}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all border ${
                                                                tx.status === 'Pago' 
                                                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                                                    : isAtrasado 
                                                                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                                                        : 'bg-zinc-100 text-zinc-400 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700'
                                                            }`}
                                                        >
                                                            {tx.status === 'Pago' ? <Check size={10}/> : <Clock size={10}/>}
                                                            {tx.status}
                                                        </button>
                                                        <SavingIndicator status={savingStatus[`FINANCAS:${tx.id}:Status`]} />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            {tx.tipo === 'entrada' && tx.status !== 'Pago' && (
                                                                <button onClick={() => handleSendReminder(tx)} title="Enviar Lembrete" className="p-1.5 rounded-md hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-500 transition-all"><Bell size={14} /></button>
                                                            )}
                                                            <button onClick={() => handleOpenModal(tx.raw)} className="p-1.5 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500"><Edit3 size={14} /></button>
                                                            <button onClick={() => handleDelete(tx.id)} className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500"><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    }
                                </tbody>
                            </table>
                        </div>
                        {/* Tabela Footer: Totais Rápidos */}
                        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-8">
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-1">Total Entradas</p>
                                    <p className="text-sm font-black text-emerald-500 tabular-nums">
                                        {formatBRL(financasFiltradas.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0))}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-1">Total Saídas</p>
                                    <p className="text-sm font-black text-rose-500 tabular-nums">
                                        {formatBRL(financasFiltradas.filter(t => t.tipo === 'saida' || t.tipo === 'assinatura').reduce((acc, t) => acc + t.valor, 0))}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-zinc-800 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-1">Saldo Líquido do Período</p>
                                <p className={`text-xl font-black tabular-nums ${
                                    financasFiltradas.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0) - 
                                    financasFiltradas.filter(t => t.tipo === 'saida' || t.tipo === 'assinatura').reduce((acc, t) => acc + t.valor, 0) >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-500'
                                }`}>
                                    {formatBRL(
                                        financasFiltradas.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + t.valor, 0) - 
                                        financasFiltradas.filter(t => t.tipo === 'saida' || t.tipo === 'assinatura').reduce((acc, t) => acc + t.valor, 0)
                                    )}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}


                {/* ===============================================================
                    TAB 3: SOCIOS (REDESIGN)
                =============================================================== */}
                {activeInternalTab === 'SOCIOS' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { id: 1, config: sociosConfig.socio1, gradient: 'from-blue-600 via-indigo-600 to-purple-600', shadow: 'shadow-indigo-500/20', iconColor: 'text-indigo-500' },
                                { id: 2, config: sociosConfig.socio2, gradient: 'from-emerald-500 via-teal-500 to-cyan-500', shadow: 'shadow-teal-500/20', iconColor: 'text-teal-500' }
                            ].map((s) => {
                                const repasseValue = Math.max(0, summary.lucro) * (s.config.percentual / 100);
                                const jaRetirado = retiradas
                                    .filter(r => r.socio === s.id && r.mes_referencia === new Date().toISOString().slice(0, 7))
                                    .reduce((acc, r) => acc + r.valor, 0);

                                return (
                                    <div key={s.id} className="relative group">
                                        <div className={`absolute -inset-0.5 bg-gradient-to-r ${s.gradient} rounded-[32px] opacity-20 blur group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-tilt`}></div>
                                        <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-[28px] shadow-sm flex flex-col h-full overflow-hidden">
                                            <div className="flex items-start justify-between mb-8">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white text-2xl font-black shadow-lg ${s.shadow}`}>
                                                        {s.config.nome.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <input 
                                                            type="text" 
                                                            value={s.config.nome}
                                                            onChange={e => handleSocioChange(s.id === 1 ? 'socio1' : 'socio2', 'nome', e.target.value)}
                                                            className="bg-transparent border-none outline-none text-lg font-black text-zinc-900 dark:text-white uppercase w-full"
                                                        />
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sócio Quote-Share</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter mb-1">Share atual</div>
                                                    <div className={`text-2xl font-black ${s.iconColor}`}>{s.config.percentual}%</div>
                                                </div>
                                            </div>

                                            <div className="space-y-6 flex-1">
                                                <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                                    <div className="flex justify-between items-end mb-4">
                                                        <div>
                                                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Disponível este mês</p>
                                                            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{formatBRL(repasseValue)}</h3>
                                                        </div>
                                                        {jaRetirado >= repasseValue && repasseValue > 0 && (
                                                            <Badge color="emerald" className="animate-bounce">RETIRADO ✓</Badge>
                                                        )}
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="0" max="100" 
                                                        value={s.config.percentual}
                                                        onChange={e => handleSocioChange(s.id === 1 ? 'socio1' : 'socio2', 'percentual', e.target.value)}
                                                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                                                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Aguardando Fechamento</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            setWithdrawalData(prev => ({ ...prev, socio: s.id as 1|2, valor: repasseValue.toFixed(2) }));
                                                            setIsWithdrawalModalOpen(true);
                                                        }}
                                                        className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${jaRetirado > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-600 hover:scale-[1.02] shadow-sm hover:shadow-blue-500/10'}`}
                                                    >
                                                        <DollarSign size={16} />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Registrar Retirada</span>
                                                    </button>
                                                </div>
                                            </div>
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
                                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#18181b', color: '#fff' }} />
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
                                                {retiradas.sort((a,b) => b.data.localeCompare(a.data)).slice(0, 5).map(r => (
                                                    <tr key={r.id} className="group">
                                                        <td className="py-4 text-xs font-bold text-zinc-500">{new Date(r.data).toLocaleDateString('pt-BR')}</td>
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
                                                                    if(confirm('Tem certeza?')) {
                                                                        await (window as any).DatabaseService.deleteRetiradaSocio(r.id);
                                                                        setRetiradas(prev => prev.filter(x => x.id !== r.id));
                                                                    }
                                                                }}
                                                                className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {retiradas.length === 0 && (
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
                                            <span className="text-sm font-black text-rose-600">{formatBRL(retiradas.reduce((a,b)=>a+b.valor, 0))}</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===============================================================
                    TAB 4: MRR (REDESIGN)
                =============================================================== */}
                {activeInternalTab === 'MRR' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <Card className="lg:col-span-3 !p-8 shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-[32px]">
                                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Monthly Recurring Revenue</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{formatBRL(mrrValue)}</h2>
                                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-500/20">
                                                +12.5% MoM
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                                        <button className="px-4 py-1.5 bg-white dark:bg-zinc-900 shadow-sm rounded-lg text-[10px] font-bold text-zinc-900 dark:text-white">EVOLUÇÃO 12M</button>
                                        <button className="px-4 py-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-700">CHURN RATE</button>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" opacity={0.1} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} hide />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#18181b', color: '#fff' }} />
                                            <Area type="monotone" dataKey="Receita" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorMrr)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <div className="space-y-6">
                                <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-80">Quick Actions</p>
                                    <h3 className="text-lg font-black leading-tight mb-6">Expanda sua recorrência mensal agora.</h3>
                                    <button 
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, tipo: 'assinatura', frequencia: 'mensal', status: 'pendente' }));
                                            setIsModalOpen(true);
                                        }}
                                        className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                                    >
                                        Novo Contrato MRR
                                    </button>
                                </div>

                                <Card title="Metas do Q2" className="!bg-zinc-900 border-zinc-800 rounded-[32px]">
                                    <div className="p-6 space-y-6">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                                                <span>Atingir R$ 50k MRR</span>
                                                <span className="text-zinc-300">72%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 rounded-full" style={{ width: '72%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {transactions.filter(t => t.tipo === 'entrada' && t.frequencia === 'mensal').map(t => {
                                const client = clients?.find((c:any)=>c.id===t.clienteId);
                                return (
                                    <div key={t.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[28px] shadow-sm hover:border-indigo-400/50 transition-all group relative overflow-hidden">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase truncate max-w-[120px]">{client?.Nome || t.descricao}</h4>
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Dia {t.data.split('-')[2]} • {t.status}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-emerald-500">{formatBRL(t.valor)}</p>
                                                <Badge color="blue" className="!text-[8px] px-1 py-0 italic mt-1">RECORRENTE</Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenModal(t)} className="flex-1 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-[9px] font-black uppercase text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">Editar</button>
                                            <button className="flex-1 py-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-[9px] font-black uppercase text-zinc-500 hover:text-indigo-500 transition-colors">Relatório</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ===============================================================
                    TAB 5: PENDENCIAS
                =============================================================== */}
                {activeInternalTab === 'PENDENCIAS' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Atrasadas */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 p-3 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                                <AlertTriangle className="text-rose-500" size={16} />
                                <h3 className="text-xs font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Atrasadas</h3>
                            </div>
                            {pendencias.atrasadas.map(t => (
                                <div key={t.id} className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 p-5 rounded-2xl shadow-sm hover:border-rose-300 transition-colors relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                                    <Badge color="rose" className="!bg-rose-100 dark:!bg-rose-900/40 mb-3 block w-max">{new Date(t.data).toLocaleDateString('pt-BR')}</Badge>
                                    <p className="text-sm font-black text-zinc-900 dark:text-white uppercase mb-1">{t.descricao}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{clients?.find((c:any)=>c.id===t.clienteId)?.Nome || 'Sem cliente'}</p>
                                    <p className="text-lg font-black text-emerald-600 mt-3">{formatBRL(t.valor)}</p>
                                    
                                    <div className="flex gap-2">
                                        <button onClick={() => handleQuickStatusUpdate(t.id, 'pago')} className="mt-4 flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-colors">
                                            <Check size={14} /> Recebido
                                        </button>
                                        <button onClick={() => handleSendReminder(t)} className="mt-4 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center transition-colors">
                                            <Bell size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {pendencias.atrasadas.length === 0 && <p className="text-[10px] font-black text-zinc-400 text-center uppercase tracking-widest p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">Nada atrasado</p>}
                        </div>

                        {/* Vencendo */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 p-3 bg-orange-50 dark:bg-orange-500/10 rounded-2xl border border-orange-100 dark:border-orange-500/20">
                                <Clock className="text-orange-500" size={16} />
                                <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">Vencendo (7 dias)</h3>
                            </div>
                            {pendencias.vencendo.map(t => (
                                <div key={t.id} className="bg-white dark:bg-zinc-900 border border-orange-200 dark:border-orange-900 p-5 rounded-2xl shadow-sm hover:border-orange-300 transition-colors relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                                    <Badge color="orange" className="!bg-orange-100 dark:!bg-orange-900/40 mb-3 block w-max">{new Date(t.data).toLocaleDateString('pt-BR')}</Badge>
                                    <p className="text-sm font-black text-zinc-900 dark:text-white uppercase mb-1">{t.descricao}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{clients?.find((c:any)=>c.id===t.clienteId)?.Nome || 'Sem cliente'}</p>
                                    <p className={`text-lg font-black mt-3 ${t.tipo === 'entrada' ? 'text-emerald-600':'text-rose-600'}`}>{formatBRL(t.valor)}</p>
                                    
                                    <div className="flex gap-2">
                                        <button onClick={() => handleQuickStatusUpdate(t.id, 'pago')} className="mt-4 flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-colors">
                                            <Check size={14} /> Dar Baixa
                                        </button>
                                        {t.tipo === 'entrada' && (
                                            <button onClick={() => handleSendReminder(t)} className="mt-4 px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center transition-colors">
                                                <Bell size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {pendencias.vencendo.length === 0 && <p className="text-[10px] font-black text-zinc-400 text-center uppercase tracking-widest p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">Nada a vencer</p>}
                        </div>

                        {/* A Pagar (Agendado Futuro) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
                                <CalendarClock className="text-blue-500" size={16} />
                                <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">A Pagar (Saídas Futuras)</h3>
                            </div>
                            {pendencias.aPagar.map(t => (
                                <div key={t.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm hover:border-zinc-300 transition-colors relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <Badge color="slate" className="mb-3 block w-max">{new Date(t.data).toLocaleDateString('pt-BR')}</Badge>
                                    <p className="text-sm font-black text-zinc-900 dark:text-white uppercase mb-1">{t.descricao}</p>
                                    <p className="text-lg font-black text-rose-600 mt-3">{formatBRL(t.valor)}</p>
                                    
                                    <button onClick={() => handleQuickStatusUpdate(t.id, 'pago')} className="mt-4 w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-colors">
                                        <Check size={14} /> Marcar Pago
                                    </button>
                                </div>
                            ))}
                            {pendencias.aPagar.length === 0 && <p className="text-[10px] font-black text-zinc-400 text-center uppercase tracking-widest p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">Livre de contas futuras</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* MODERN MODAL VIA PORTAL */}
            {isModalOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md animate-fade" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in ring-1 ring-white/10 max-h-[90vh]">
                        
                        <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div>
                                <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-[0.1em]">
                                    {editingId ? 'AJUSTAR LANÇAMENTO' : 'NOVA MOVIMENTAÇÃO'}
                                </h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all hover:rotate-90 shadow-sm">
                                <X size={20} />
                            </button>
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
                                    <div className="flex items-center gap-2 w-full h-14 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-4 focus-within:border-zinc-900/10 dark:focus-within:border-white/10 transition-all">
                                        <Calendar className="text-zinc-400 shrink-0" size={16} />
                                        <input type="date" required value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} className="flex-1 bg-transparent border-none outline-none text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 min-w-0" />
                                    </div>
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
                            <Button onClick={() => handleSaveTransaction()} className="w-full md:flex-1 !h-14 !rounded-2xl !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 text-xs font-black uppercase tracking-[0.1em] shadow-xl hover:scale-[1.01] transition-all">
                                <CheckCircle2 size={18} className="mr-2" /> {editingId ? 'Salvar Edição' : 'Confirmar Lançamento'}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* MODAL DE RETIRADA */}
            {isWithdrawalModalOpen && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm animate-fade" onClick={() => setIsWithdrawalModalOpen(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-zoom-in">
                        <div className="p-8 text-center">
                            <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl font-black text-white bg-gradient-to-br ${withdrawalData.socio === 1 ? 'from-blue-600 to-indigo-600' : 'from-emerald-500 to-teal-500'}`}>
                                {withdrawalData.socio === 1 ? sociosConfig.socio1.nome.charAt(0) : sociosConfig.socio2.nome.charAt(0)}
                            </div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase mb-2">Confirmar Retirada</h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-8">
                                Registrando saída para {withdrawalData.socio === 1 ? sociosConfig.socio1.nome : sociosConfig.socio2.nome}
                            </p>

                            <div className="space-y-4">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase block mb-2">Valor da Retirada</label>
                                    <input 
                                        type="number" 
                                        value={withdrawalData.valor}
                                        onChange={e => setWithdrawalData(prev => ({ ...prev, valor: e.target.value }))}
                                        className="bg-transparent border-none outline-none text-2xl font-black text-zinc-900 dark:text-white text-center w-full"
                                    />
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                                    <label className="text-[9px] font-black text-zinc-400 uppercase block mb-2">Referência (Mês/Ano)</label>
                                    <input 
                                        type="month" 
                                        value={withdrawalData.mes_referencia}
                                        onChange={e => setWithdrawalData(prev => ({ ...prev, mes_referencia: e.target.value }))}
                                        className="bg-transparent border-none outline-none text-sm font-black text-zinc-900 dark:text-white text-center w-full uppercase"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-10">
                                <button 
                                    onClick={() => setIsWithdrawalModalOpen(false)}
                                    className="py-4 text-[10px] font-black uppercase text-zinc-500 hover:text-rose-500"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSaveWithdrawal}
                                    className="py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"
                                >
                                    Confirmar ✓
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
