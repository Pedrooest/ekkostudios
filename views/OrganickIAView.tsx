
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
    onAddItem: (table: any, data: any) => Promise<string>;
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
        <div className="p-4 sm:p-6 space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shadow-lg shadow-zinc-500/10">
                        <BrainCircuit className="text-white dark:text-zinc-900" size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">OrganickIA 2.0</h1>
                        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">Inteligência Operacional</p>
                    </div>
                </div>
            </div>

            {/* 1. SELETOR DE CONTEXTO */}
            <Card>
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                            <User className="text-zinc-500" size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Contexto do Cliente</p>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase">Selecione para processar</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-72">
                        <InputSelect 
                            value={selectedClientId}
                            onChange={(val) => { playUISound('tap'); setSelectedClientId(val); }}
                            options={[{value: '', label: '-- ESCOLHA UM CLIENTE --'}, ...clients.map((c: any) => ({value: c.id, label: c.Nome.toUpperCase()}))]}
                            className="!h-10 !text-[11px] !font-bold !rounded-lg"
                        />
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
                                        className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl py-12 px-6 text-center transition-all hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/30 group"
                                        onClick={() => { playUISound('tap'); audioInputRef.current?.click(); }}
                                    >
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-600 dark:text-zinc-400 group-hover:scale-105 transition-transform">
                                            <Mic size={28} />
                                        </div>
                                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight mb-1">Pautas / Áudios</h3>
                                        <p className="text-[10px] text-zinc-500 font-medium uppercase mb-6">Mapeamento por Voz</p>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); audioInputRef.current?.click(); }}
                                            disabled={loading}
                                            variant="secondary"
                                            className="!h-9 !px-6 !text-[10px] !font-bold !uppercase"
                                        >
                                            {loading ? 'Processando...' : 'Carregar Áudio'}
                                        </Button>
                                    </div>
                                </div>

                                {/* PDF Upload */}
                                <div className="group relative">
                                    <input type="file" accept="application/pdf" multiple ref={pdfInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'pdf')} />
                                    <div
                                        className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl py-12 px-6 text-center transition-all hover:border-zinc-400 dark:hover:border-zinc-600 cursor-pointer bg-zinc-50/50 dark:bg-zinc-900/30 group"
                                        onClick={() => { playUISound('tap'); pdfInputRef.current?.click(); }}
                                    >
                                        <div className="w-16 h-16 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mb-4 text-zinc-600 dark:text-zinc-400 group-hover:scale-105 transition-transform">
                                            <FileText size={28} />
                                        </div>
                                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight mb-1">Documentos PDF</h3>
                                        <p className="text-[10px] text-zinc-500 font-medium uppercase mb-6">Briefings e Relatórios</p>
                                        <Button
                                            onClick={(e) => { e.stopPropagation(); pdfInputRef.current?.click(); }}
                                            disabled={loading}
                                            variant="secondary"
                                            className="!h-9 !px-6 !text-[10px] !font-bold !uppercase"
                                        >
                                            {loading ? 'Analisando...' : 'Carregar PDF'}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Undo Import Block */}
                            {lastImportedIds.length > 0 && (
                                <div className="p-4 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-white dark:text-zinc-900">
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <HistoryIcon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Importação Recente</p>
                                            <p className="text-[9px] font-medium opacity-70 uppercase">{lastImportedIds.length} itens extraídos</p>
                                        </div>
                                    </div>
                                    <Button onClick={handleUndoImport} variant="secondary" className="!h-8 !px-4 !text-[9px] !font-bold !bg-white/10 !text-white hover:!bg-white/20 !border-none !uppercase">
                                        DESFAZER
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* 3. CÉREBRO OPERACIONAL */}
                    <Card>
                        <div className="p-6 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-amber-500 border border-amber-100 dark:border-amber-900/20">
                                        <Sparkles size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">Cérebro Operacional</h4>
                                        <p className="text-[10px] text-zinc-500 font-medium uppercase">Compilação estratégica IA</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={generateBriefing}
                                    disabled={loading}
                                    className="!h-10 !px-6 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-lg !text-[11px] !font-bold !tracking-widest !uppercase"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} className="mr-2" />}
                                    Compilar Briefing
                                </Button>
                            </div>

                            <div className={`w-full rounded-xl p-6 font-mono text-[11px] leading-relaxed min-h-[160px] border transition-all duration-500 overflow-hidden relative
                                ${!briefing && !loading ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-400 flex items-center justify-center text-center italic' : ''}
                                ${loading ? 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-500 flex items-center justify-center' : ''}
                                ${briefing && !loading ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : ''}
                            `}>
                                {!briefing && !loading && (
                                    <div className="space-y-2 opacity-60">
                                        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-2 font-black">?</div>
                                        <p className="uppercase tracking-widest font-bold text-[9px]">Aguardando comando operacional...</p>
                                    </div>
                                )}

                                {loading && (
                                    <div className="flex flex-col items-center gap-3 font-bold uppercase tracking-widest text-[10px]">
                                        <Loader2 size={18} className="animate-spin text-zinc-500" />
                                        <span>Processando dados estratégicos...</span>
                                    </div>
                                )}

                                {briefing && !loading && (
                                    <div className="animate-in fade-in duration-300 space-y-4">
                                        <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-4">
                                            <div className="flex items-center gap-2 font-bold text-emerald-400 uppercase tracking-widest text-[10px]">
                                                <CheckCircle2 size={12} /> Briefing Organick
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={copyBriefing} className="p-1.5 text-zinc-500 hover:text-white transition-colors"><Copy size={14} /></button>
                                                <button onClick={() => onGenerateSlide(briefing)} className="p-1.5 text-zinc-500 hover:text-white transition-colors"><FileImage size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar font-sans pr-2 text-zinc-300">
                                            <SimpleMarkdown content={briefing} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {(audioInsight || pdfInsight) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {audioInsight && (
                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                                            <div className="flex items-center gap-2 uppercase tracking-widest font-bold text-zinc-400 text-[9px]">
                                                <Mic size={12} /> Insight Áudio
                                            </div>
                                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed line-clamp-2">{audioInsight}</p>
                                        </div>
                                    )}
                                    {pdfInsight && (
                                        <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                                            <div className="flex items-center gap-2 uppercase tracking-widest font-bold text-zinc-400 text-[9px]">
                                                <FileText size={12} /> Insight PDF
                                            </div>
                                            <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed line-clamp-2">{pdfInsight}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* 4. CHAT GATEWAY */}
                    <Card>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
                                    <MessageSquare size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100 tracking-tight">Chat OrganickIA</h3>
                                    <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">Acesso à Central de Inteligência</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button onClick={() => window.open(CHATGPT_LINK, '_blank')} variant="secondary" className="!h-12 !rounded-xl !text-[10px] !font-bold !uppercase">
                                    ABRIR CHATGPT
                                </Button>
                                <Button onClick={handleCopyAndOpenChat} className="!h-12 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-xl !text-[10px] !font-bold !uppercase shadow-lg shadow-zinc-500/10 hover:scale-[1.01]">
                                    COPIAR E ABRIR CHAT
                                </Button>
                            </div>
                        </div>
                    </Card>
                </>
            )}

            {/* 5. HISTÓRICO */}
            <div className="space-y-8 pt-8">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-6">
                    <div className="flex items-center gap-3">
                        <HistoryIcon className="text-zinc-400" size={18} />
                        <h3 className="text-xs font-bold uppercase text-zinc-900 dark:text-zinc-100 tracking-tight">Histórico de Inteligência</h3>
                    </div>
                    <DeletionBar count={selection.length} onDelete={() => onDelete(selection, 'IA_HISTORY')} onArchive={() => onArchive(selection, 'IA_HISTORY', true)} onClear={() => setSelection([])} />
                </div>

                {filteredHistory.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[32px] opacity-40">
                        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nenhum registro processado recentemente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredHistory.map((item: any) => (
                            <div key={item.id} className={`p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group relative overflow-hidden ${selection.includes(item.id) ? 'border-zinc-900 ring-2 ring-zinc-500/10' : ''}`}>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <input type="checkbox" checked={selection.includes(item.id)} onChange={() => setSelection(prev => prev.includes(item.id) ? prev.filter(i => i !== item.id) : [...prev, item.id])} className="w-5 h-5 rounded-lg cursor-pointer border-zinc-300" />
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                        {item.type === 'SLIDE' ? <FileImage size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-[11px] font-bold uppercase text-zinc-900 dark:text-zinc-100 tracking-tight truncate">{item.clientName}</h4>
                                        <span className="text-[9px] font-medium text-zinc-500 uppercase tracking-widest">
                                            {new Date(item.timestamp).toLocaleDateString('pt-BR')} • {item.type}
                                        </span>
                                    </div>
                                </div>

                                {item.type === 'SLIDE' ? (
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight line-clamp-1">{item.content.title}</p>
                                        <p className="text-[9px] text-zinc-500 font-medium leading-relaxed line-clamp-2 uppercase">{item.content.subtitle}</p>
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-zinc-500 font-medium leading-relaxed line-clamp-3 italic uppercase">
                                        {item.content.slice(0, 200)}...
                                    </p>
                                )}

                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                                    <Button variant="secondary" className="flex-1 !h-8 !text-[9px] !font-bold !rounded-lg !uppercase" onClick={() => { if (item.type === 'SLIDE') { /* logic */ } else { setBriefing(item.content); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>
                                        <Eye size={12} className="mr-1.5" /> Visualizar
                                    </Button>
                                    <Button variant="secondary" className="!h-8 !w-8 !p-0 !rounded-lg" onClick={() => { playUISound('tap'); onArchive([item.id], 'IA_HISTORY', !item.__archived); }}>
                                        {item.__archived ? <FolderOpen size={14} /> : <Box size={14} />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Import Preview Modal */}
            {isImportModalOpen && importPreview && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsImportModalOpen(false)}></div>
                    <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* MODAL HEADER */}
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-900 dark:text-zinc-100">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold uppercase text-zinc-900 dark:text-zinc-100 tracking-tight">Importação Estratégica</h3>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Extração OrganickIA</p>
                                </div>
                            </div>
                            <button onClick={() => { playUISound('tap'); setIsImportModalOpen(false); }} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-all"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            <div className="bg-zinc-50 dark:bg-zinc-950/20 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                <h4 className="text-[10px] font-bold uppercase text-zinc-400 mb-4 tracking-widest flex items-center gap-2">
                                    <User size={12} /> Cliente Detectado
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block">Nome</span>
                                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase">{importPreview.cliente?.nome || "NÃO DETECTADO"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block">Nicho</span>
                                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase">{importPreview.cliente?.nicho || "GERAL"}</span>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-zinc-400 uppercase font-black tracking-widest block">Objetivo</span>
                                        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 leading-snug uppercase">{importPreview.cliente?.objetivo || "NÃO ESPECIFICADO"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2 px-1">
                                    <CheckCircle2 size={12} /> Selecionar Módulos
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[
                                        { id: 'cobo', label: 'Canais', count: importPreview.cobo?.length, icon: Radio },
                                        { id: 'estrategia', label: 'Estratégias', count: importPreview.estrategia?.length, icon: Target },
                                        { id: 'rdc', label: 'Ideias', count: importPreview.rdc?.length, icon: Lightbulb },
                                        { id: 'planejamento', label: 'Calendário', count: importPreview.planejamento?.length, icon: LucideCalendar }
                                    ].map((tab) => (
                                        <div
                                            key={tab.id}
                                            onClick={() => { playUISound('tap'); setImportSelection((prev: any) => ({ ...prev, [tab.id]: !prev[tab.id] })); }}
                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center gap-2
                                                ${(importSelection as any)[tab.id]
                                                    ? 'bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-zinc-500/10'
                                                    : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-400'}`}
                                        >
                                            <tab.icon size={20} className={(importSelection as any)[tab.id] ? 'opacity-100' : 'opacity-40'} />
                                            <div className="text-lg font-bold leading-none">{tab.count || 0}</div>
                                            <div className="text-[9px] font-bold uppercase tracking-widest">{tab.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {importPreview.pendencias && importPreview.pendencias.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 p-5 rounded-xl">
                                    <h4 className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 tracking-widest flex items-center gap-2 mb-3">
                                        <ShieldAlert size={14} /> Observações Importantes
                                    </h4>
                                    <ul className="space-y-2">
                                        {importPreview.pendencias.map((p: string, idx: number) => (
                                            <li key={idx} className="text-[10px] font-semibold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-tight flex items-center gap-2">
                                                <div className="w-1 h-1 rounded-full bg-current shrink-0" />
                                                {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                                <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Vincular Cliente</span>
                                <InputSelect
                                    value={selectedClientId}
                                    onChange={(val) => setSelectedClientId(val)}
                                    options={clients.map((c: any) => ({ value: c.id, label: c.Nome.toUpperCase() }))}
                                    className="!h-10 !text-[10px] !font-bold !min-w-[240px]"
                                />
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <Button variant="secondary" onClick={() => setIsImportModalOpen(false)} className="flex-1 sm:flex-none !h-10 !px-6 !text-[10px] !font-bold !uppercase">Cancelar</Button>
                                <Button
                                    onClick={() => handleConfirmImport(selectedClientId)}
                                    disabled={!selectedClientId}
                                    className="flex-1 sm:flex-none !h-10 !px-8 !bg-zinc-900 dark:!bg-zinc-100 !text-white dark:!text-zinc-900 !rounded-lg !text-[10px] !font-bold !uppercase shadow-lg shadow-zinc-500/10 enabled:hover:scale-[1.02]"
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
