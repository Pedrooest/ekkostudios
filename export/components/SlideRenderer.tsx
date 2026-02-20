import React from 'react';
import { ExportConfig } from '../types';
import MasterExportSlide from './MasterExportSlide';

interface SlideRendererProps {
    config: ExportConfig;
    elementId: string;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({ config, elementId }) => {
    // Determine Density Mode
    const itemCount = config.data.length;
    let mode: 'low' | 'medium' | 'high' = 'medium';

    if (config.density) {
        mode = config.density;
    } else if (itemCount <= 3) {
        mode = 'low';
    } else if (itemCount > 12) {
        mode = 'high';
    }

    // Filter columns for Low Density if priority is defined
    let activeColumns = config.columns;
    if (mode === 'low' && config.priorityColumns && config.priorityColumns.length > 0) {
        activeColumns = config.columns.filter(c => config.priorityColumns!.includes(c.label));
    }

    const alignmentClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    // MASTER EXPORT SLIDE (MATRIZ, RDC, COBO, PLANEJAMENTO, FLUXO)
    const masterTabs = ['MATRIZ', 'RDC', 'COBO', 'PLANEJAMENTO', 'TAREFAS', 'FLUXO'];
    const isMasterTab = masterTabs.includes(config.tab) || config.title?.toLowerCase().includes('matriz');

    if (isMasterTab) {
        let masterTab: 'MATRIZ' | 'RDC' | 'COBO' | 'PLANEJAMENTO' | 'FLUXO' = 'MATRIZ';
        let mappedData: any[] = [];

        if (config.tab === 'MATRIZ' || config.title?.toLowerCase().includes('matriz')) {
            masterTab = 'MATRIZ';
            mappedData = config.data.map((row: any) => ({
                rede: row['Rede_Social'] || row['Rede Social'] || '-',
                funcao: row['Função'] || row['Funcao'] || '-',
                quemFala: row['Quem fala'] || row['Quem Fala'] || '-',
                papel: row['Papel estratégico'] || row['Papel Estrategico'] || '-',
                tipoConteudo: row['Tipo de conteúdo'] || row['Tipo de Conteudo'] || '-',
                resultado: row['Resultado esperado'] || row['Resultado Esperado'] || '-'
            }));
        } else if (config.tab === 'RDC') {
            masterTab = 'RDC';
            mappedData = config.data.map((row: any) => ({
                ideia: row['Ideia de Conteúdo'] || '-',
                canal: row['Rede_Social'] || '-',
                formato: row['Tipo de conteúdo'] || '-',
                rdc: `${row['Resolução (1–5)'] || 0} / ${row['Demanda (1–5)'] || 0} / ${row['Competição (1–5)'] || 0}`,
                score: row['Score (R×D×C)'] || 0,
                decisao: row['Decisão'] || '-'
            }));
        } else if (config.tab === 'COBO') {
            masterTab = 'COBO';
            mappedData = config.data.map((row: any) => ({
                persona: row['Público'] || '-',
                contexto: row['Voz'] || '-',
                objecao: row['Zona'] || '-',
                beneficio: row['Intenção'] || '-',
                oferta: row['Formato'] || '-'
            }));
        } else if (config.tab === 'PLANEJAMENTO') {
            masterTab = 'PLANEJAMENTO';
            mappedData = config.data.map((row: any) => ({
                data: row['Data'] || '-',
                canal: row['Rede_Social'] || row['Canal'] || '-',
                tema: row['Conteúdo'] || '-',
                formato: row['Tipo de conteúdo'] || row['Formato'] || '-',
                status: row['Status do conteúdo'] || '-'
            }));
        } else if (config.tab === 'TAREFAS') {
            masterTab = 'FLUXO';
            mappedData = config.data.map((row: any) => ({
                tarefa: row['Título'] || '-',
                resp: row['Responsável'] || '-',
                prazo: row['Data_Entrega'] || '-',
                prioridade: row['Prioridade'] || '-',
                status: row['Status'] || '-'
            }));
        }

        return (
            <div id={elementId}>
                <MasterExportSlide
                    tab={masterTab}
                    clientName={config.client}
                    date={new Date().toLocaleDateString('pt-BR')}
                    data={mappedData}
                />
            </div>
        );
    }

    return (
        <div
            id={elementId}
            className="fixed top-0 left-0 -z-50 w-[1920px] h-[1080px] bg-[#0B0B0E] p-16 flex flex-col text-white font-sans overflow-hidden"
        >
            {/* BACKGROUND ACCENTS */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#C8A24A] opacity-[0.03] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4" />

            {/* HEADER */}
            <div className="flex justify-between items-start mb-12 relative z-10">
                <div>
                    <div className="flex items-center gap-6 mb-4">
                        <div className="w-14 h-14 bg-[#C8A24A] rounded-xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <i className="fa-solid fa-cube text-black text-2xl" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[#C8A24A] text-2xl font-black tracking-[0.3em] uppercase leading-none flex items-center gap-[2px]">
                                E K <span className="transform -scale-x-100 inline-block">K</span> O &nbsp; S T U D I O S
                            </span>
                            <div className="h-0.5 w-12 bg-[#C8A24A] mt-2 opacity-50"></div>
                        </div>
                    </div>
                    <h1 className="text-6xl font-black uppercase tracking-tighter leading-none text-white">
                        {config.title}
                    </h1>
                </div>
                <div className="text-right">
                    <p className="text-[#B7B7C2] text-xl font-medium uppercase tracking-widest">{config.client}</p>
                    <p className="text-[#52525b] text-lg mt-1">{new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* BODY CONTENT - ADAPTIVE */}
            <div className="flex-1 relative z-10 flex gap-12">
                {/* LEFT: METRICS & CONTEXT (Always present but scales) */}
                <div className={`flex flex-col gap-6 ${mode === 'high' ? 'w-1/4' : 'w-1/3'}`}>
                    {config.metrics.map((m, i) => (
                        <div key={i} className="bg-[#151521] border border-[#24243A] p-6 rounded-2xl">
                            <h3 className="text-[#B7B7C2] text-sm uppercase tracking-widest mb-2">{m.label}</h3>
                            <p className="text-4xl font-bold text-white">{m.value}</p>
                        </div>
                    ))}

                    <div className="mt-auto bg-[#151521]/50 p-6 rounded-2xl border border-[#24243A]/50">
                        <h4 className="text-[#C8A24A] font-bold text-sm uppercase mb-2">Resumo Executivo</h4>
                        <p className="text-[#B7B7C2] text-sm leading-relaxed">
                            Este relatório apresenta a visão estratégica consolidada para o ciclo atual.
                            Os dados a seguir refletem as decisões tomadas em conjunto com a metodologia Organick.
                        </p>
                    </div>
                </div>

                {/* RIGHT: DATA VISUALIZATION */}
                <div className="flex-1 bg-[#151521] border border-[#24243A] rounded-3xl p-8 overflow-hidden relative">
                    {/* Table Header */}
                    <div className="grid gap-4 border-b border-[#24243A] pb-4 mb-4"
                        style={{ gridTemplateColumns: `repeat(${activeColumns.length}, 1fr)` }}>
                        {activeColumns.map((col, i) => (
                            <div key={i} className={`text-xs font-black uppercase tracking-widest text-[#52525b] ${alignmentClasses[col.alignment || 'left']}`}>
                                {col.label}
                            </div>
                        ))}
                    </div>

                    {/* Table Rows */}
                    <div className="space-y-4">
                        {config.data.slice(0, mode === 'low' ? 3 : mode === 'medium' ? 10 : 18).map((row, i) => (
                            <div key={i} className="grid gap-4 items-center p-3 rounded-lg hover:bg-[#24243A]/20 transition-colors border-b border-[#24243A]/20 last:border-0"
                                style={{ gridTemplateColumns: `repeat(${activeColumns.length}, 1fr)` }}>
                                {activeColumns.map((col, ci) => {
                                    let val = row[col.key];
                                    if (!val || (typeof val === 'string' && val.includes('Preencha'))) {
                                        return <span key={ci} className="text-[#52525b] text-sm italic">Pendente</span>;
                                    }
                                    return <span key={ci} className={`text-sm font-medium text-white ${alignmentClasses[col.alignment || 'left']} truncate`}>{val}</span>;
                                })}
                            </div>
                        ))}
                    </div>

                    {config.data.length > (mode === 'low' ? 3 : mode === 'medium' ? 10 : 18) && (
                        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#151521] to-transparent flex items-end justify-center pb-4">
                            <span className="text-[#52525b] text-xs uppercase tracking-widest">+ {config.data.length - (mode === 'low' ? 3 : mode === 'medium' ? 10 : 18)} itens restantes no Excel</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 border-t border-[#FFFFFF]/10 pt-6 flex justify-between items-center relative z-10">
                <span className="text-[#52525b] text-sm font-mono">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <span className="text-[#C8A24A] text-sm font-bold uppercase tracking-widest">Confidencial</span>
            </div>
        </div>
    );
};
