
import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    BrainCircuit, CheckCircle2, Mic, FileText, History as HistoryIcon,
    Trash2, Sparkles, Loader2, Copy, FileImage, MessageSquare,
    ExternalLink, ShieldAlert, Eye, FolderOpen, Box, User,
    Radio, Target, Lightbulb, Calendar as LucideCalendar,
    ChevronDown, Zap, X, Plus
} from 'lucide-react';
import { Card, Button, SimpleMarkdown, DeletionBar, InputSelect } from '../Components';
import { playUISound } from '../utils/uiSounds';
import { generateId } from '../utils/id';
import {
    transcribeAndExtractInsights,
    extractStructuredDataFromPDF
} from '../geminiService';
import { Cliente } from '../types';

interface OrganickIAViewProps {
    clients: Cliente[];
    cobo: any[];
    matriz: any[];
    rdc: any[];
    planning: any[];
    selectedClientId: string;
    setSelectedClientId: (id: string) => void;
    audioInsight: string;
    setAudioInsight: (insight: string) => void;
    pdfInsight: string;
    setPdfInsight: (insight: string) => void;
    history: any[];
    setHistory: any;
    onArchive: (ids: string[], table: any, archived: boolean) => void;
    onDelete: (ids: string[], table: any) => void;
    showArchived: boolean;
    onGenerateSlide: (briefing: string) => void;
    onAddItem: (table: any, data: any) => Promise<string | undefined>;
    addNotification: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export function OrganickIAView({
    clients, cobo, matriz, rdc, planning,
    selectedClientId, setSelectedClientId,
    audioInsight, setAudioInsight,
    pdfInsight, setPdfInsight,
    history, setHistory,
    onArchive, onDelete,
    showArchived, onGenerateSlide,
    onAddItem, addNotification
}: OrganickIAViewProps) {
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
    }, [selectedClient, selectedClientId, cobo, matriz, rdc, planning, audioInsight, pdfInsight, setHistory]);

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
                            onChange={(e) => { playUISound('tap'); setSelectedClientId(e.target.value); }}
                            className="ios-btn w-full h-14 !bg-app-bg border-app-border text-sm font-bold uppercase text-app-text-strong rounded-[16px] px-5 outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none transition-all cursor-pointer"
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
                                        className="ios-btn flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-[24px] py-10 px-6 text-center transition-all hover:border-blue-500 cursor-pointer bg-app-surface/50 hover:bg-blue-500/5 active:scale-[0.98] group"
                                        onClick={() => { playUISound('tap'); audioInputRef.current?.click(); }}
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
                                        className="ios-btn flex flex-col items-center justify-center border-2 border-dashed border-app-border rounded-[24px] py-10 px-6 text-center transition-all hover:border-rose-500 cursor-pointer bg-app-surface/50 hover:bg-rose-500/5 active:scale-[0.98] group"
                                        onClick={() => { playUISound('tap'); pdfInputRef.current?.click(); }}
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

                                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                                    <BrainCircuit size={120} />
                                </div>
                            </div>

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
                                <div className="">
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
                    <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'IA_HISTORY')} onArchive={() => onArchive(selection, 'IA_HISTORY', true)} onClear={() => setSelection([])} />
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
                                    <Button variant="secondary" className="!h-10 !w-10 !p-0 !rounded-xl border-app-border" onClick={() => { playUISound('tap'); onArchive([item.id], 'IA_HISTORY', !item.__archived); }}>
                                        {item.__archived ? <FolderOpen size={16} /> : <Box size={16} />}
                                    </Button>
                                </div>

                                <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-app-text-strong/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Import Preview Modal */}
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
                            <button onClick={() => { playUISound('tap'); setIsImportModalOpen(false); }} className="ios-btn w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 rounded-full transition-all"><X size={24} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
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
                                            onClick={() => { playUISound('tap'); setImportSelection((prev: any) => ({ ...prev, [tab.id]: !prev[tab.id] })); }}
                                            className={`ios-btn p-6 rounded-[24px] border-2 cursor-pointer transition-all duration-300 flex flex-col items-center text-center
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
                                <InputSelect
                                    value={selectedClientId}
                                    onChange={(val) => setSelectedClientId(val)}
                                    options={clients.map((c: any) => ({ value: c.id, label: c.Nome }))}
                                    className="!bg-zinc-900 !border-white/10 !text-white !text-[11px] !font-black !uppercase !rounded-xl !px-5 !h-12 !min-w-[260px]"
                                    placeholder="Vincular a um Cliente"
                                />
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
