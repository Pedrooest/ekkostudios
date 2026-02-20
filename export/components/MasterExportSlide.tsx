import React from 'react';
import {
    Share2, Target, Users, BarChart3, FileText, Calendar,
    CheckCircle2, Clock, AlertCircle, LayoutGrid, Zap, AlignLeft
} from 'lucide-react';

// ==========================================
// CONFIGURAÇÕES DE CADA ABA (Títulos, Textos e Grids)
// ==========================================
const TAB_CONFIGS: any = {
    'MATRIZ': {
        title: 'Matriz Estratégica',
        description: 'Este documento apresenta a visão estratégica consolidada para a comunicação da marca. Ele define o papel principal de cada canal, os porta-vozes responsáveis, os formatos prioritários de conteúdo e os resultados esperados para o ciclo atual.',
        grid: 'grid-cols-[1.5fr_1.5fr_2.5fr_3fr_2fr]',
        headers: ['Rede Social', 'Função', 'Quem Fala / Papel', 'Tipo de Conteúdo', 'Resultado Esperado']
    },
    'RDC': {
        title: 'Validação RDC',
        description: 'Análise de performance e priorização de backlog de ideias. Cada conteúdo foi pontuado nos critérios de Resolução (R), Demanda (D) e Competição (C) para definir estrategicamente o que deve ser implementado, ajustado ou descartado.',
        grid: 'grid-cols-[2.5fr_1.5fr_1.5fr_1fr_1fr_1.5fr]',
        headers: ['Ideia de Conteúdo', 'Canal', 'Formato', 'Métricas (R/D/C)', 'Score', 'Decisão']
    },
    'COBO': {
        title: 'Estratégia COBO',
        description: 'Mapeamento persuasivo focado na jornada do consumidor. Abordamos o Contexto atual (dor do cliente), as Objeções comuns à conversão, os Benefícios diretos da nossa solução e a Oferta final (Call to Action).',
        grid: 'grid-cols-[1.5fr_2.5fr_2.5fr_2.5fr_1.5fr]',
        headers: ['Público / Persona', 'Contexto (Dor)', 'Objeção', 'Benefícios', 'Oferta (CTA)']
    },
    'PLANEJAMENTO': {
        title: 'Planejamento de Conteúdo',
        description: 'Cronograma tático detalhado com previsões de publicação. Apresenta as datas agendadas, os canais de distribuição, os temas a serem abordados e o status atual de produção de cada peça.',
        grid: 'grid-cols-[1fr_1.5fr_3fr_1.5fr_1.5fr]',
        headers: ['Data', 'Canal', 'Tema / Título', 'Formato', 'Status']
    },
    'FLUXO': {
        title: 'Fluxo de Tarefas',
        description: 'Acompanhamento do pipeline operacional da equipe. Visão clara dos responsáveis, prazos de entrega acordados e o estágio atual de cada atividade no fluxo de trabalho do estúdio.',
        grid: 'grid-cols-[3fr_1.5fr_1fr_1.5fr_1.5fr]',
        headers: ['Atividade / Tarefa', 'Responsável', 'Prazo', 'Prioridade', 'Status da Tarefa']
    }
};

export interface MasterExportSlideProps {
    tab?: 'MATRIZ' | 'RDC' | 'COBO' | 'PLANEJAMENTO' | 'FLUXO';
    clientName?: string;
    date?: string;
    data: any[];
}

// ==========================================
// COMPONENTE PURO DE EXPORTAÇÃO MASTER
// ==========================================
export default function MasterExportSlide({
    tab = 'MATRIZ', // 'MATRIZ' | 'RDC' | 'COBO' | 'PLANEJAMENTO' | 'FLUXO'
    clientName = "Geral",
    date,
    data = []
}: MasterExportSlideProps) {
    const config = TAB_CONFIGS[tab] || TAB_CONFIGS['MATRIZ'];
    const formattedDate = date || new Date().toLocaleDateString('pt-BR');

    // Estilos auxiliares
    const getNetworkColor = (rede: string) => {
        const redes: any = { 'Instagram': 'text-pink-500 bg-pink-500/10', 'LinkedIn': 'text-blue-500 bg-blue-500/10', 'TikTok': 'text-white bg-zinc-800' };
        return redes[rede] || 'text-indigo-500 bg-indigo-500/10';
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'Implementar Já': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Aprovado': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Ajustar/Testar': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'Em Produção': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'Descartar': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            'Pendente': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
            'Em Revisão': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Alta': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            'Média': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'Baixa': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
        return <span className={`px-2.5 py-1 text-[11px] rounded-md font-medium border uppercase tracking-wider ${styles[status] || styles['Pendente']}`}>{status}</span>;
    };

    // Renderizadores de Linhas da Tabela específicos por Aba
    const renderRow = (item: any, index: number) => {
        if (tab === 'MATRIZ') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3 items-center bg-[#111114]`}>
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-white/5 ${getNetworkColor(item.rede)}`}><Share2 size={16} /></div>
                    <span className="text-sm font-bold text-white">{item.rede}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium"><Target className="text-zinc-600 shrink-0" size={14} />{item.funcao}</div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2"><Users className="text-indigo-500 shrink-0" size={14} /><span className="text-sm font-bold text-white">{item.quemFala}</span></div>
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider pl-5">{item.papel}</span>
                </div>
                <div className="flex items-start gap-2 pr-2 text-sm text-zinc-300 leading-snug"><FileText className="text-zinc-600 mt-0.5 shrink-0" size={14} />{item.tipoConteudo}</div>
                <div className="flex items-start gap-2 pr-2 text-sm text-emerald-100/90 leading-snug font-medium"><BarChart3 className="text-emerald-500 mt-0.5 shrink-0" size={14} />{item.resultado}</div>
            </div>
        );

        if (tab === 'RDC') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3.5 items-center bg-[#111114]`}>
                <div className="text-sm font-bold text-white leading-snug">{item.ideia}</div>
                <div className="flex items-center gap-2 text-sm text-zinc-300"><div className={`w-2 h-2 rounded-full ${item.canal === 'Instagram' ? 'bg-pink-500' : 'bg-blue-500'}`} />{item.canal}</div>
                <div className="text-sm text-zinc-400">{item.formato}</div>
                <div className="text-sm font-mono tracking-widest text-zinc-500">{item.rdc}</div>
                <div className={`text-base font-mono font-bold ${Number(item.score) > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>{item.score}</div>
                <div>{getStatusBadge(item.decisao)}</div>
            </div>
        );

        if (tab === 'COBO') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3.5 items-start bg-[#111114]`}>
                <div className="text-sm font-bold text-white flex items-center gap-2"><Users size={14} className="text-indigo-500" />{item.persona}</div>
                <div className="text-sm text-zinc-400 leading-snug border-l border-zinc-800 pl-3">{item.contexto}</div>
                <div className="text-sm text-rose-200/80 leading-snug border-l border-zinc-800 pl-3">{item.objecao}</div>
                <div className="text-sm text-emerald-200/80 leading-snug border-l border-zinc-800 pl-3">{item.beneficio}</div>
                <div className="text-sm text-amber-200/80 leading-snug font-medium border-l border-zinc-800 pl-3 flex items-start gap-1.5"><Zap size={14} className="shrink-0 text-amber-500 mt-0.5" />{item.oferta}</div>
            </div>
        );

        if (tab === 'PLANEJAMENTO') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3 items-center bg-[#111114]`}>
                <div className="text-sm font-mono text-zinc-400 flex items-center gap-2"><Calendar size={14} className="text-zinc-600" />{item.data}</div>
                <div className="flex items-center gap-2 text-sm font-bold text-white"><div className={`w-6 h-6 rounded-md flex items-center justify-center border border-white/5 ${getNetworkColor(item.canal)}`}><Share2 size={12} /></div>{item.canal}</div>
                <div className="text-sm font-medium text-zinc-200">{item.tema}</div>
                <div className="text-sm text-zinc-500">{item.formato}</div>
                <div>{getStatusBadge(item.status)}</div>
            </div>
        );

        if (tab === 'FLUXO') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3.5 items-center bg-[#111114]`}>
                <div className="text-sm font-bold text-white leading-snug flex items-start gap-2"><AlignLeft size={14} className="text-zinc-600 mt-0.5" />{item.tarefa}</div>
                <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-bold text-white uppercase">{item.resp.substring(0, 2)}</div><span className="text-sm text-zinc-300">{item.resp}</span></div>
                <div className="text-sm font-mono text-zinc-400 flex items-center gap-1.5"><Clock size={12} />{item.prazo}</div>
                <div>{getStatusBadge(item.prioridade)}</div>
                <div>{getStatusBadge(item.status)}</div>
            </div>
        );
    };

    return (
        <div
            className="bg-[#0a0a0c] text-zinc-300 font-sans flex flex-col justify-between relative"
            style={{ width: '1920px', height: '1080px', overflow: 'hidden' }}
        >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

            {/* HEADER DO SLIDE */}
            <header className="px-16 pt-10 pb-4 flex justify-between items-start relative z-10">
                <div className="max-w-[1000px]">
                    <div className="mb-5"><img src="/ekko-logo-ai.svg" alt="Ekko Studios" className="h-20 object-contain" /></div>
                    <h1 className="text-5xl font-extrabold text-white tracking-tight uppercase mb-3" style={{ fontFamily: 'system-ui, sans-serif' }}>
                        {config.title}
                    </h1>
                    <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                        {config.description}
                    </p>
                </div>

                <div className="text-right pt-2 shrink-0">
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest mb-1.5 font-mono">Data de Emissão</p>
                    <p className="text-2xl font-bold text-white mb-4">{formattedDate}</p>
                    <div className="flex justify-end gap-3">
                        <span className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider">
                            Cliente: <span className="text-white ml-1 font-bold">{clientName}</span>
                        </span>
                    </div>
                </div>
            </header>

            {/* ÁREA DE CONTEÚDO */}
            <main className="px-16 py-2 relative z-10 w-full flex-1 flex flex-col">
                <div className="w-full bg-[#111114] border border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">

                    <div className={`grid ${config.grid} gap-4 px-10 py-3.5 bg-zinc-900/50 border-b border-zinc-800`}>
                        {config.headers.map((h: string, i: number) => (
                            <div key={i} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{h}</div>
                        ))}
                    </div>

                    <div className="divide-y divide-zinc-800/60">
                        {data.map((item, index) => renderRow(item, index))}
                    </div>

                </div>
            </main>

            {/* RODAPÉ DO SLIDE */}
            <footer className="px-16 pb-8 pt-4 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-6 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                    <span className="font-bold text-zinc-500">EKKO SMART ENGINE</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div><span>Geração Automatizada</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">Página</span>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-zinc-800 text-zinc-400 font-bold text-[10px]">1</div>
                </div>
            </footer>
        </div>
    );
}
