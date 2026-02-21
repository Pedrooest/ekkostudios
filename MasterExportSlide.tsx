import React from 'react';
import {
    Share2, Target, Users, BarChart3, FileText, Calendar,
    CheckCircle2, Clock, AlignLeft, Zap, ClipboardList, Flag, AlertCircle
} from 'lucide-react';

// ==========================================
// CONFIGURAÇÕES DE CADA ABA
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
    'TAREFAS': {
        title: 'Fluxo de Tarefas',
        description: 'Acompanhamento do pipeline operacional da equipe. Visão clara dos responsáveis, prazos de entrega acordados e o estágio atual de cada atividade no fluxo de trabalho do estúdio.',
        grid: 'grid-cols-[3fr_1.5fr_1fr_1.5fr_1.5fr]',
        headers: ['Atividade / Tarefa', 'Responsável', 'Prazo', 'Prioridade', 'Status da Tarefa']
    }
};

// ==========================================
// COMPONENTE PURO DE EXPORTAÇÃO MASTER (CRISP RESOLUTION)
// ==========================================
export function MasterExportSlide({
    tab = 'MATRIZ',
    clientName = "Geral",
    date = new Date().toLocaleDateString('pt-BR'),
    data = []
}: any) {
    const config = TAB_CONFIGS[tab] || TAB_CONFIGS['MATRIZ'];

    const getNetworkColor = (rede: string) => {
        const redes: any = {
            'Instagram': 'text-pink-500 bg-pink-500/10',
            'LinkedIn': 'text-blue-500 bg-blue-500/10',
            'TikTok': 'text-white bg-zinc-800',
            'YouTube': 'text-rose-500 bg-rose-500/10'
        };
        return redes[rede] || 'text-indigo-500 bg-indigo-500/10';
    };

    const getStatusBadge = (status: string) => {
        const styles: any = {
            'Implementar Já': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Aprovado': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Concluído': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'done': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Ajustar/Testar': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'Em produção': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'Em Produção': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'todo': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
            'doing': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Descartar': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            'Pendente': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
            'Em aprovação': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Em Revisão': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Alta': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            'Urgente': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'Média': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            'Baixa': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };
        return <span className={`px-2.5 py-1 text-[11px] rounded-md font-bold border uppercase tracking-wider ${styles[status] || styles['Pendente']}`}>{status}</span>;
    };

    const renderRow = (item: any, index: number) => {
        if (tab === 'MATRIZ') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3 items-center bg-[#111114]`}>
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-white/5 ${getNetworkColor(item.Rede_Social)}`}>
                        <Share2 size={16} />
                    </div>
                    <span className="text-sm font-bold text-white uppercase tracking-tight">{item.Rede_Social}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                    <Target className="text-zinc-600 shrink-0" size={14} />
                    {item.Função}
                </div>
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <Users className="text-indigo-500 shrink-0" size={14} />
                        <span className="text-sm font-bold text-white">{item["Quem fala"]}</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider pl-5">{item["Papel estratégico"]}</span>
                </div>
                <div className="flex items-start gap-2 pr-2 text-sm text-zinc-300 leading-snug">
                    <FileText className="text-zinc-600 mt-0.5 shrink-0" size={14} />
                    {item["Tipo de conteúdo"]}
                </div>
                <div className="flex items-start gap-2 pr-2 text-sm text-emerald-100/90 leading-snug font-medium">
                    <BarChart3 className="text-emerald-500 mt-0.5 shrink-0" size={14} />
                    {item["Resultado esperado"]}
                </div>
            </div>
        );

        if (tab === 'RDC') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3 items-center bg-[#111114]`}>
                <div className="text-sm font-bold text-white truncate pr-4">{item["Ideia de Conteúdo"]}</div>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 ${getNetworkColor(item.Rede_Social)} text-[10px]`}>
                        <Share2 size={12} />
                    </div>
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-tight">{item.Rede_Social}</span>
                </div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-widest">{item["Tipo de conteúdo"]}</div>
                <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-500">
                    <span className="text-zinc-300">{item["Resolução (1–5)"]}</span>/
                    <span className="text-zinc-300">{item["Demanda (1–5)"]}</span>/
                    <span className="text-zinc-300">{item["Competição (1–5)"]}</span>
                </div>
                <div className="text-lg font-black text-indigo-400">{item["Score (R×D×C)"]}</div>
                <div>{getStatusBadge(item.Decisão)}</div>
            </div>
        );

        if (tab === 'COBO') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3 items-center bg-[#111114]`}>
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <Users className="text-zinc-600" size={14} />
                    {item.Público}
                </div>
                <div className="text-xs text-zinc-350 leading-relaxed pr-4">{item.Contexto}</div>
                <div className="text-xs text-zinc-350 leading-relaxed pr-4 italic">"{item.Objeção}"</div>
                <div className="text-xs text-emerald-100/80 font-medium leading-relaxed pr-4">{item.Benefícios}</div>
                <div className="text-xs font-black text-white uppercase tracking-wider">{item.Oferta}</div>
            </div>
        );

        if (tab === 'PLANEJAMENTO') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3 items-center bg-[#111114]`}>
                <div className="flex flex-col">
                    <span className="text-sm font-black text-white">{item.Data}</span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase">{item.Hora}</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 ${getNetworkColor(item.Rede_Social)}`}>
                        <Share2 size={14} />
                    </div>
                    <span className="text-xs font-bold text-zinc-300 uppercase">{item.Rede_Social}</span>
                </div>
                <div className="text-sm font-bold text-white truncate pr-4">{item.Conteúdo}</div>
                <div className="text-xs text-zinc-400 font-medium uppercase tracking-widest">{item["Tipo de conteúdo"]}</div>
                <div>{getStatusBadge(item["Status do conteúdo"])}</div>
            </div>
        );

        if (tab === 'TAREFAS') return (
            <div key={index} className={`grid ${config.grid} gap-4 px-10 py-3 items-center bg-[#111114]`}>
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 rounded-full bg-indigo-500/40"></div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white truncate max-w-[400px]">{item.Título}</span>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">{item.Área}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">
                        {item.Responsável?.charAt(0) || '?'}
                    </div>
                    {item.Responsável || 'Sem Resp.'}
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
                    <Clock size={12} className="text-zinc-600" />
                    {item.Data_Entrega || 'S/ Data'}
                </div>
                <div>{getStatusBadge(item.Prioridade)}</div>
                <div>{getStatusBadge(item.Status)}</div>
            </div>
        );

        return <div key={index} className="px-10 py-3 text-white">Linha renderizada: {item.id || index}</div>;
    };

    return (
        <>
            {/* A MÁGICA DA NITIDEZ (CRISP TYPOGRAPHY) */}
            <style dangerouslySetInnerHTML={{
                __html: `
        .crisp-export-container {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
          shape-rendering: geometricPrecision;
          image-rendering: -webkit-optimize-contrast;
        }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}} />

            <div
                className="crisp-export-container bg-[#0a0a0c] text-zinc-300 flex flex-col justify-between relative"
                style={{ width: '1920px', height: '1080px', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

                {/* HEADER */}
                <header className="px-16 pt-16 pb-8 flex justify-between items-start relative z-10">
                    <div className="max-w-[1100px]">
                        <div className="mb-8 flex items-center gap-4">
                            <div className="bg-white p-3 rounded-2xl">
                                <img src="/ekko-logo-ai.svg" alt="Ekko Studios" className="h-12 object-contain invert" />
                            </div>
                            <div className="h-10 w-px bg-zinc-800"></div>
                            <span className="text-zinc-500 font-mono text-xs tracking-[0.3em] uppercase">Intelligence Engine</span>
                        </div>
                        <h1 className="text-7xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
                            {config.title}
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed font-medium max-w-3xl">
                            {config.description}
                        </p>
                    </div>

                    <div className="text-right pt-4 shrink-0">
                        <p className="text-xs text-zinc-600 uppercase tracking-[0.3em] mb-2 font-black">Data de Emissão</p>
                        <p className="text-3xl font-black text-white mb-8 pr-1 tracking-tighter">{date}</p>
                        <div className="flex justify-end">
                            <span className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/5">
                                Cliente: <span className="text-white ml-2">{clientName}</span>
                            </span>
                        </div>
                    </div>
                </header>

                {/* CONTEÚDO */}
                <main className="px-16 pb-12 relative z-10 w-full flex-1 flex flex-col">
                    <div className="w-full bg-[#111114] border border-zinc-800 rounded-[40px] overflow-hidden shadow-2xl flex flex-col flex-1">

                        <div className={`grid ${config.grid} gap-4 px-10 py-6 bg-zinc-900/50 border-b border-zinc-800 items-center`}>
                            {config.headers.map((h: any, i: number) => (
                                <div key={i} className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em]">{h}</div>
                            ))}
                        </div>

                        <div className="divide-y divide-zinc-800/40 flex-1 overflow-hidden">
                            {data.slice(0, 9).map((item: any, index: number) => renderRow(item, index))}
                            {data.length > 9 && (
                                <div className="px-10 py-6 bg-zinc-900/20 text-xs font-bold text-zinc-600 uppercase tracking-widest italic text-center">
                                    + {data.length - 9} itens omitidos nesta prévia de slide
                                </div>
                            )}
                        </div>

                    </div>
                </main>

                {/* RODAPÉ */}
                <footer className="px-16 pb-12 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 text-[11px] text-zinc-700 font-mono uppercase tracking-[0.4em] font-black">
                            <span>ESTRATÉGIA ORGANICK v2.0</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                            <span className="text-zinc-500">RELATÓRIO DE ALTA FIDELIDADE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-xl">
                            <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">PÁGINA</span>
                            <span className="text-white font-black text-xs">01/01</span>
                        </div>
                        <div className="text-zinc-800 font-black text-4xl opacity-20">EKKO</div>
                    </div>
                </footer>
            </div>
        </>
    );
}
