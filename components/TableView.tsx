
import React, { useState, useMemo } from 'react';
import { List, LayoutGrid, Calendar as LucideCalendar, Search, Plus, X, User } from 'lucide-react';
import { Card, Button, InputSelect, Badge, Stepper, DeletionBar } from '../Components';
import { BottomSheet } from './BottomSheet';
import { playUISound } from '../utils/uiSounds';
import {
    COLUNAS_CLIENTES, COLUNAS_MATRIZ_ESTRATEGICA, COLUNAS_COBO, COLUNAS_RDC, COLUNAS_FINANCAS,
    ROTULOS_TABELAS, REDES_SOCIAIS_RDC, FORMATOS_RDC, OPCOES_CANAL_COBO, OPCOES_FREQUENCIA_COBO,
    OPCOES_PUBLICO_COBO, OPCOES_VOZ_COBO, OPCOES_ZONA_COBO, OPCOES_INTENCAO_COBO,
    OPCOES_FORMATO_COBO, OPCOES_FUNCAO_MATRIZ, OPCOES_QUEM_FALA_MATRIZ,
    OPCOES_PAPEL_ESTRATEGICO_MATRIZ, OPCOES_TIPO_CONTEUDO_MATRIZ,
    OPCOES_RESULTADO_ESPERADO_MATRIZ, OPCOES_TIPO_FINANCAS, OPCOES_SERVICOS_FINANCAS
} from '../constants';
import { Cliente, BibliotecaConteudo, TipoTabela } from '../types';

interface TableViewProps {
    tab: TipoTabela;
    data: any[];
    onUpdate: (id: string, tab: TipoTabela, field: string, value: any) => void;
    onDelete: (ids: string[], tab: TipoTabela) => void;
    onArchive: (ids: string[], tab: TipoTabela, archive: boolean) => void;
    onAdd?: (tab: TipoTabela) => void;
    clients?: Cliente[];
    library?: BibliotecaConteudo;
    selection: string[];
    onSelect: (id: string) => void;
    onClearSelection: () => void;
    onOpenColorPicker?: (id: string, val: string) => void;
    activeCategory?: string | null;
    activeClient?: Cliente | null;
    onSelectClient?: (id: string) => void;
    hideHeader?: boolean;
}

export function TableView({
    tab, data, onUpdate, onDelete, onArchive, onAdd,
    clients = [], library = {}, selection, onSelect, onClearSelection,
    onOpenColorPicker, activeCategory, activeClient, onSelectClient, hideHeader
}: TableViewProps) {
    const [mobileActionRow, setMobileActionRow] = useState<any>(null);

    const cols = useMemo(() => {
        let c = tab === 'CLIENTES' ? COLUNAS_CLIENTES :
            tab === 'MATRIZ' ? COLUNAS_MATRIZ_ESTRATEGICA :
                tab === 'COBO' ? COLUNAS_COBO :
                    tab === 'RDC' ? COLUNAS_RDC :
                        tab === 'FINANCAS' ? (
                            activeCategory === 'assinatura' ? COLUNAS_FINANCAS :
                                COLUNAS_FINANCAS.filter(col => !['Recorrência', 'Dia_Pagamento', 'Data_Início', 'Data_Fim'].includes(col))
                        ) : [];

        if (tab === 'MATRIZ' || (activeClient && (tab === 'RDC' || tab === 'COBO'))) {
            c = c.filter(col => col !== 'Cliente_ID');
        }
        return c;
    }, [tab, activeCategory, activeClient]);

    if (tab === 'RDC' && !activeClient) {
        return (
            <Card title={ROTULOS_TABELAS['RDC']}>
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
                            {clients?.map((c) => (
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

    const isRDC = tab === 'RDC';
    const rdcHeader = (
        <div className="p-4 md:p-6 border-b border-app-border flex flex-col gap-4 md:grid md:grid-cols-3 items-center bg-app-surface-2">
            <div className="text-center md:text-left w-full">
                <h3 className="font-bold text-app-text-strong text-xs uppercase tracking-widest">{ROTULOS_TABELAS['RDC']} (R×D×C)</h3>
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
                            options={clients?.map((c) => ({ value: c.id, label: c.Nome })) || []}
                            placeholder="Selecionar Cliente"
                            className="w-full bg-app-bg text-app-text-strong text-xs font-bold uppercase py-3 pl-10 pr-10 rounded-xl border border-app-border outline-none transition-all shadow-lg text-center tracking-widest hover:border-blue-500"
                        />
                    </div>
                )}
            </div>
            <div className="flex justify-center md:justify-end gap-4 items-center w-full">
                <DeletionBar count={selection.length} onDelete={() => onDelete(selection, tab)} onArchive={() => onArchive(selection, tab, true)} onClear={onClearSelection} />
                {onAdd && <Button onClick={() => onAdd(tab)} className="hidden md:flex w-full md:w-auto !bg-blue-600 !text-white hover:!bg-blue-700 !border-none shadow-lg">+ Novo Registro</Button>}
            </div>
        </div>
    );

    const filteredData = useMemo(() => {
        if (tab !== 'FINANCAS' || !activeCategory) return data;
        const tipoMap: Record<string, string> = {
            'entrada': 'Entrada',
            'saida': 'Saída',
            'despesa': 'Despesa',
            'assinatura': 'Assinatura'
        };
        const targetTipo = tipoMap[activeCategory];
        return data.filter((item: any) => item.Tipo === targetTipo);
    }, [data, tab, activeCategory]);

    return (
        <Card
            title={hideHeader ? undefined : (isRDC ? undefined : ROTULOS_TABELAS[tab])}
            extra={hideHeader ? undefined : (isRDC ? undefined : (
                <div className="flex gap-4 items-center">
                    {tab !== 'CLIENTES' && onSelectClient && (
                        <div className="relative w-48">
                            <InputSelect
                                value={activeClient ? activeClient.id : ""}
                                onChange={(val) => onSelectClient && onSelectClient(val)}
                                options={clients?.map((c) => ({ value: c.id, label: c.Nome })) || []}
                                placeholder="Selecionar Cliente"
                                className="bg-blue-600 text-app-text-strong text-[10px] font-bold uppercase py-1.5 pl-4 pr-8 rounded-lg outline-none transition-colors shadow-lg shadow-blue-900/20 w-full hover:bg-blue-700"
                            />
                        </div>
                    )}
                    <DeletionBar count={selection.length} onDelete={() => onDelete(selection, tab)} onArchive={() => onArchive(selection, tab, true)} onClear={onClearSelection} />
                    {tab !== 'FINANCAS' && onAdd && <Button onClick={() => onAdd(tab)} variant="secondary" className="hidden md:flex w-full md:w-auto !bg-blue-600 !text-white hover:!bg-blue-700 !border-none shadow-lg">+ Novo Registro</Button>}
                </div>
            ))}
        >
            {!hideHeader && isRDC && rdcHeader}
            <div className={`hidden md:block custom-scrollbar bg-app-bg/50 w-full ${(tab === 'MATRIZ' || tab === 'RDC' || tab === 'FINANCAS') ? 'overflow-auto max-h-[60vh]' : ''}`}>
                <table className={`w-full text-left text-[11px] border-separate border-spacing-0 ${(tab === 'MATRIZ' || tab === 'RDC' || tab === 'FINANCAS') ? 'whitespace-nowrap min-w-max' : ''}`}>
                    <thead className="sticky top-0 z-20">
                        <tr className="border-b border-app-border bg-app-surface-2 shadow-md">
                            <th className={`px-4 py-5 text-center bg-app-surface-2 border-b border-app-border ${tab === 'RDC' ? 'w-[50px]' : 'w-10'}`}>
                                <input type="checkbox" onChange={e => { if (e.target.checked) filteredData.forEach((r: any) => !selection.includes(r.id) && onSelect(r.id)); else onClearSelection(); }} checked={filteredData.length > 0 && filteredData.every((r: any) => selection.includes(r.id))} className="rounded bg-app-bg border-app-border text-blue-500 focus:ring-0 focus:ring-offset-0" />
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
                                if (tab === 'MATRIZ') {
                                    if (c === 'Rede_Social') widthStyle = { width: '160px' };
                                    else if (c === 'Função') widthStyle = { width: '160px' };
                                    else if (c === 'Quem fala') widthStyle = { width: '160px' };
                                    else if (c === 'Papel estratégico') widthStyle = { minWidth: '240px' };
                                    else if (c === 'Tipo de conteúdo') widthStyle = { minWidth: '200px' };
                                    else if (c === 'Resultado esperado') widthStyle = { minWidth: '200px' };
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
                        {filteredData.map((row: any) => (
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
                {filteredData.map((row: any) => {
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
                                                                <div className="text-sm">
                                                                    {renderCell(tab, row, col, onUpdate, clients, library, onOpenColorPicker)}
                                                                </div>
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
                                                    <div className="text-sm">
                                                        {renderCell(tab, row, col, onUpdate, clients, library, onOpenColorPicker)}
                                                    </div>
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

            <BottomSheet isOpen={!!mobileActionRow} onClose={() => setMobileActionRow(null)} title="Ações do Registro">
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
};

function TableRow({ row, tab, cols, onUpdate, clients, library, onOpenColorPicker, onArchive, onDelete, selection, onSelect }: any) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isRDC = tab === 'RDC';

    return (
        <tr key={row.id} className={`hover:bg-app-surface group transition-colors ${selection.includes(row.id) ? 'bg-[#3B82F6]/5' : ''} ${row.__archived ? 'opacity-50' : ''} ${isRDC ? 'min-h-[64px]' : 'min-h-[56px]'}`}>
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
                        onClick={() => { if (!isMenuOpen) playUISound('open'); setIsMenuOpen(!isMenuOpen); }}
                        className="ios-btn w-8 h-8 rounded-lg bg-app-surface text-app-text-muted hover:text-app-text-strong transition-all flex items-center justify-center border border-app-border shadow-sm hover:shadow-md"
                    >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                            <div className="absolute right-0 bottom-full mb-2 w-40 bg-app-surface rounded-xl shadow-2xl border border-app-border z-20 overflow-hidden text-left animate-ios-spring">
                                <button onClick={() => { playUISound('tap'); onArchive([row.id], tab, !row.__archived); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#3B82F6] transition-all flex items-center gap-3 font-bold uppercase text-[9px] tracking-widest text-app-text-strong">
                                    <i className={`fa-solid ${row.__archived ? 'fa-box-open' : 'fa-box-archive'}`}></i>
                                    {row.__archived ? 'Restaurar' : 'Arquivar'}
                                </button>
                                <button onClick={() => { playUISound('tap'); onDelete([row.id], tab); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-rose-600 transition-all flex items-center gap-3 font-bold uppercase text-[9px] tracking-widest text-rose-400 hover:text-app-text-strong">
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
};

function renderCell(tab: TipoTabela, row: any, col: string, update: Function, clients: Cliente[] = [], library: BibliotecaConteudo = {}, onOpenColorPicker?: Function) {
    const common = "w-full text-[11px] font-bold bg-transparent border-none text-app-text-strong pointer-events-auto outline-none transition-all focus:text-[#3B82F6]";

    if (tab === 'RDC') {
        if (col === 'Rede_Social') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={REDES_SOCIAIS_RDC} className={common} placeholder="Selecione..." label={col} />);
        if (col === 'Tipo de conteúdo') {
            const social = row['Rede_Social'] || 'Instagram';
            const formats = FORMATOS_RDC[social] || [];
            return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={formats} className={common} placeholder="-- Selecione --" label={col} />);
        }
        if (["Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)"].includes(col)) {
            return (
                <div className="flex justify-center">
                    <Stepper value={parseInt(row[col]) || 0} onChange={(val) => update(row.id, tab, col, val)} min={1} max={5} className="border-none bg-[#0B0B0E]/30" />
                </div>
            );
        }
        if (col === 'Score (R×D×C)') return (<div className="text-center"><span className="text-[12px] font-black text-blue-500 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">{row[col] || 0}</span></div>);
        if (col === 'Decisão') {
            const val = row[col] || "Preencha R/D/C";
            const badgeColor = val === 'Implementar já' ? 'green' : val === 'Ajustar e testar' ? 'orange' : 'slate';
            return (
                <div className="flex justify-center">
                    <Badge color={badgeColor} className="!text-[9px] whitespace-nowrap px-4 py-2 rounded-xl shadow-lg truncate max-w-full">{val}</Badge>
                </div>
            );
        }
        if (col === 'Ideia de Conteúdo') {
            return (
                <div className="relative group/cell">
                    <input type="text" value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={`${common} w-full truncate focus:text-app-text-strong transition-all`} placeholder="Descreva a ideia..." />
                </div>
            );
        }
    }

    if (tab === 'COBO') {
        if (col === 'Canal') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_CANAL_COBO} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Frequência') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_FREQUENCIA_COBO} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Público') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_PUBLICO_COBO} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Voz') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_VOZ_COBO} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Zona') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_ZONA_COBO} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Intenção') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_INTENCAO_COBO} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Formato') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_FORMATO_COBO} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    }

    if (tab === 'MATRIZ') {
        if (col === 'Função') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_FUNCAO_MATRIZ} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Quem fala') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_QUEM_FALA_MATRIZ} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Papel estratégico') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_PAPEL_ESTRATEGICO_MATRIZ} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Tipo de conteúdo') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_TIPO_CONTEUDO_MATRIZ} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
        if (col === 'Resultado esperado') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_RESULTADO_ESPERADO_MATRIZ} className={common} placeholder="-- Selecione --" label={col} editable={true} />);
    }

    if (col === 'Cliente_ID' && tab !== 'FINANCAS') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={[{ value: "GERAL", label: "AGÊNCIA" }, ...clients.map(c => ({ value: c.id, label: c.Nome }))]} className={common} placeholder="AGÊNCIA" label={col} />);
    if (col === 'Tipo' && tab === 'FINANCAS') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_TIPO_FINANCAS} className={common} placeholder="Selecione..." label={col} />);

    if (tab === 'FINANCAS') {
        const isSub = row.Tipo === 'Assinatura';
        if (col === 'Recorrência') return isSub ? (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={["Mensal", "Única"]} className={common} placeholder="Selecione..." label={col} />) : null;
        if (col === 'Dia_Pagamento') return isSub ? (<input type="number" min="1" max="31" value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={common} />) : null;
        if (col === 'Data_Início' || col === 'Data_Fim') return isSub ? (<input type="date" value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={common} />) : null;
        if (col === 'Observações' && row.Tipo === 'Entrada') return (<InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_SERVICOS_FINANCAS} className={common} placeholder="-- Serviço --" label={col} />);
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
        return (<input type="number" step="0.01" value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={common} placeholder="0.00" />);
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

    const inputType = (col === 'Data' || col === 'Data_Entrega') ? 'date' : col === 'Hora' ? 'time' : 'text';
    return (<input type={inputType} value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={common} placeholder="..." />);
}
