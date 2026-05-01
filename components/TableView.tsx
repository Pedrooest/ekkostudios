
import React, { useState, useMemo } from 'react';
import { List, LayoutGrid, Calendar as LucideCalendar, Search, Plus, X, User, Users, Check, AlertCircle, ChevronDown, Zap, MoreVertical, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
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
    savingStatus?: Record<string, 'saving' | 'success' | 'error'>;
}

const SavingIndicator = ({ status }: { status?: 'saving' | 'success' | 'error' }) => {
    if (!status) return null;
    return (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none z-10 animate-fade">
            {status === 'saving' && (
                <div className="w-3 h-3 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            )}
            {status === 'success' && (
                <Check size={10} className="text-emerald-500" />
            )}
            {status === 'error' && (
                <AlertCircle size={10} className="text-rose-500" />
            )}
        </div>
    );
};

export function TableView({
    tab, data, onUpdate, onDelete, onArchive, onAdd,
    clients = [], library = {}, selection, onSelect, onClearSelection,
    onOpenColorPicker, activeCategory, activeClient, onSelectClient, hideHeader,
    savingStatus = {}
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

        if (['MATRIZ', 'RDC', 'COBO'].includes(tab)) {
            c = c.filter(col => col !== 'Cliente' && col !== 'Cliente_ID');
        }
        return c;
    }, [tab, activeCategory, activeClient]);

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

    if (['RDC', 'MATRIZ', 'COBO'].includes(tab) && !activeClient) {
        return (
            <Card title={ROTULOS_TABELAS[tab]}>
                <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.18)] animate-ios-spring">
                        <Users size={36} />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                        <h3 className="text-xl font-bold text-app-text-strong tracking-tight">Selecione um cliente</h3>
                        <p className="text-sm font-medium text-app-text-muted leading-relaxed">
                            Para acessar a {ROTULOS_TABELAS[tab]}, escolha um cliente para focar a estratégia.
                        </p>
                    </div>
                    <div className="w-full max-w-sm">
                        <InputSelect
                            value=""
                            onChange={(val) => onSelectClient && onSelectClient(val)}
                            options={(clients || []).map((c) => ({ value: c.id, label: c.Nome }))}
                            placeholder="Selecionar cliente"
                            className="bg-app-surface border border-app-border text-app-text-strong text-sm font-medium h-12 px-4 rounded-xl shadow-xl hover:border-blue-500 transition-colors w-full"
                        />
                    </div>
                </div>
            </Card>
        );
    }

    const isRDC = tab === 'RDC';
    const rdcHeader = (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 shrink-0">
                    <Zap size={18} />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">VALIDAÇÃO RDC</h2>
                        <span className="text-[10px] font-black text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">{filteredData.length} registros</span>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                        Análise de Resolução, Demanda e Competição
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <DeletionBar count={selection.length} onDelete={() => onDelete(selection, tab)} onArchive={() => onArchive(selection, tab, true)} onClear={onClearSelection} />
                {onAdd && (
                    <button
                        onClick={() => onAdd(tab)}
                        className="flex items-center gap-2 h-10 px-5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]"
                    >
                        <Plus size={16} /> Novo Registro
                    </button>
                )}
            </div>
        </div>
    );


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
            <div className="hidden md:block w-full overflow-x-auto custom-scrollbar border border-zinc-200 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="sticky top-0 z-20 bg-white dark:bg-zinc-800 shadow-sm">
                        <tr>
                            <th className={`px-3 py-2.5 text-center border-b border-zinc-200 dark:border-zinc-700 ${tab === 'RDC' ? 'w-[50px]' : 'w-10'}`}>
                                <input type="checkbox" onChange={e => { if (e.target.checked) filteredData.forEach((r: any) => !selection.includes(r.id) && onSelect(r.id)); else onClearSelection(); }} checked={filteredData.length > 0 && filteredData.every((r: any) => selection.includes(r.id))} className="rounded bg-white border-zinc-300 text-blue-600 focus:ring-blue-500" />
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
                                    <th key={c} style={widthStyle} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap text-left">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="truncate">
                                                {c === 'Rede_Social' ? 'Rede Social'
                                                    : c === 'Tipo de conteudo' ? 'Tipo de Conteúdo'
                                                    : c === 'Tipo de conteúdo' ? 'Tipo de Conteúdo'
                                                    : c}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                            <th className={`px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500 border-b border-zinc-200 dark:border-zinc-700 ${tab === 'RDC' ? 'w-[80px]' : ''}`}>Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
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
                                savingStatus={savingStatus}
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
                                        <button onClick={() => setMobileActionRow(row)} className="w-[44px] h-[44px] rounded-xl bg-app-surface-2 border border-app-border text-app-text-muted hover:text-app-text-strong flex items-center justify-center transition-all active:scale-95 shadow-sm"><MoreVertical size={18} /></button>
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
                                                                    <Cell tab={tab} row={row} col={col} update={onUpdate} clients={clients} library={library} onOpenColorPicker={onOpenColorPicker} savingStatus={savingStatus} />
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
                                                        <Cell tab={tab} row={row} col={col} update={onUpdate} clients={clients} library={library} onOpenColorPicker={onOpenColorPicker} savingStatus={savingStatus} />
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
                        {mobileActionRow?.__archived ? <ArchiveRestore size={16} className="mr-3 shrink-0" /> : <Archive size={16} className="mr-3 shrink-0" />}
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
                        <Trash2 size={16} className="mr-3 shrink-0" /> Excluir Permanentemente
                    </Button>
                </div>
            </BottomSheet>
        </Card>
    );
};

function TableRow({ row, tab, cols, onUpdate, clients, library, onOpenColorPicker, onArchive, onDelete, selection, onSelect, savingStatus }: any) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const isRDC = tab === 'RDC';

    return (
        <tr key={row.id} className={`even:bg-zinc-50 dark:even:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 group transition-colors ${selection.includes(row.id) ? 'bg-blue-500/5 dark:bg-blue-500/10' : ''} ${row.__archived ? 'opacity-50' : ''}`}>
            <td className={`px-3 py-2.5 text-center ${isRDC ? 'w-[50px]' : 'w-10'}`}>
                <input type="checkbox" checked={selection.includes(row.id)} onChange={() => onSelect(row.id)} className="rounded bg-white border-zinc-300 text-blue-600 focus:ring-blue-500" />
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
                    <td key={col} className="px-3 py-2.5 text-sm align-middle min-w-0" style={widthStyle}>
                        <Cell
                            tab={tab}
                            row={row}
                            col={col}
                            update={onUpdate}
                            clients={clients}
                            library={library}
                            onOpenColorPicker={onOpenColorPicker}
                            savingStatus={savingStatus}
                        />
                    </td>
                );
            })}
            <td className={`px-3 py-2.5 text-right align-middle ${isRDC ? 'w-[80px]' : ''}`}>
                <div className="relative inline-block text-left">
                    <button
                        onClick={() => { if (!isMenuOpen) playUISound('open'); setIsMenuOpen(!isMenuOpen); }}
                        className="ios-btn w-8 h-8 rounded-lg bg-app-surface text-app-text-muted hover:text-app-text-strong transition-all flex items-center justify-center border border-app-border shadow-sm hover:shadow-md"
                    >
                        <MoreVertical size={16} />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
                            <div className="absolute right-0 bottom-full mb-2 w-40 bg-app-surface rounded-xl shadow-2xl border border-app-border z-20 overflow-hidden text-left animate-ios-spring">
                                <button onClick={() => { playUISound('tap'); onArchive([row.id], tab, !row.__archived); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-[#3B82F6] transition-all flex items-center gap-3 font-bold uppercase text-[9px] tracking-widest text-app-text-strong">
                                    {row.__archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                                    {row.__archived ? 'Restaurar' : 'Arquivar'}
                                </button>
                                <button onClick={() => { playUISound('tap'); onDelete([row.id], tab); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-rose-600 transition-all flex items-center gap-3 font-bold uppercase text-[9px] tracking-widest text-rose-400 hover:text-app-text-strong">
                                    <Trash2 size={14} />
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

interface CellProps {
    tab: TipoTabela;
    row: any;
    col: string;
    update: Function;
    clients?: Cliente[];
    library?: BibliotecaConteudo;
    onOpenColorPicker?: Function;
    savingStatus?: Record<string, any>;
}

function Cell({ tab, row, col, update, clients = [], library = {}, onOpenColorPicker, savingStatus = {} }: CellProps) {
    const key = `${tab}:${row.id}:${col}`;
    const status = savingStatus[key];
    
    // Local state for text components to enable responsive typing with onBlur sync
    const [localValue, setLocalValue] = React.useState<string>(row[col] || '');
    
    // Synchronize local value when row data changes (e.g. from server)
    React.useEffect(() => {
        setLocalValue(row[col] || '');
    }, [row[col]]);

    const common = `w-full bg-transparent border-none text-sm text-zinc-900 dark:text-zinc-100 pointer-events-auto outline-none transition-all focus:text-blue-600 dark:focus:text-blue-400 truncate max-w-[200px] placeholder:text-zinc-400 ${status === 'saving' ? 'opacity-50' : ''}`;

    if (tab === 'RDC') {
        if (col === 'Rede_Social') return (
            <div className="relative">
                <InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={REDES_SOCIAIS_RDC} className={common} placeholder="Selecione..." label={col} />
                <SavingIndicator status={status} />
            </div>
        );
        if (col === 'Tipo de conteúdo') {
            const social = row['Rede_Social'] || 'Instagram';
            const formats = FORMATOS_RDC[social] || [];
            return (
                <div className="relative">
                    <InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={formats} className={common} placeholder="-- Selecione --" label={col} />
                    <SavingIndicator status={status} />
                </div>
            );
        }
        if (["Resolução (1–5)", "Demanda (1–5)", "Competição (1–5)"].includes(col)) {
            return (
                <div className="flex justify-center relative">
                    <Stepper
                        value={parseInt(row[col]) || 0}
                        onChange={(val) => update(row.id, tab, col, val)}
                        min={1}
                        max={5}
                        className="border-none bg-[#0B0B0E]/30"
                    />
                    <SavingIndicator status={status} />
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
                    <input 
                        type="text" 
                        value={localValue} 
                        onChange={e => setLocalValue(e.target.value)}
                        onBlur={() => localValue !== row[col] && update(row.id, tab, col, localValue)}
                        onKeyDown={e => e.key === 'Enter' && (e.target as any).blur()}
                        className={`${common} w-full truncate focus:text-app-text-strong transition-all`} 
                        placeholder="Descreva a ideia..." 
                    />
                    <SavingIndicator status={status} />
                </div>
            );
        }
    }

    if (tab === 'COBO') {
        const optionsMap: any = {
            'Canal': OPCOES_CANAL_COBO,
            'Frequência': OPCOES_FREQUENCIA_COBO,
            'Público': OPCOES_PUBLICO_COBO,
            'Voz': OPCOES_VOZ_COBO,
            'Zona': OPCOES_ZONA_COBO,
            'Intenção': OPCOES_INTENCAO_COBO,
            'Formato': OPCOES_FORMATO_COBO
        };
        if (optionsMap[col]) return (
            <div className="relative">
                <InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={optionsMap[col]} className={common} placeholder="-- Selecione --" label={col} editable={true} />
                <SavingIndicator status={status} />
            </div>
        );
    }

    if (tab === 'MATRIZ') {
        const optionsMap: any = {
            'Função': OPCOES_FUNCAO_MATRIZ,
            'Quem fala': OPCOES_QUEM_FALA_MATRIZ,
            'Papel estratégico': OPCOES_PAPEL_ESTRATEGICO_MATRIZ,
            'Tipo de conteúdo': OPCOES_TIPO_CONTEUDO_MATRIZ,
            'Resultado esperado': OPCOES_RESULTADO_ESPERADO_MATRIZ
        };
        if (optionsMap[col]) return (
            <div className="relative">
                <InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={optionsMap[col]} className={common} placeholder="-- Selecione --" label={col} editable={true} />
                <SavingIndicator status={status} />
            </div>
        );
    }

    if (col === 'Cliente_ID' && tab !== 'FINANCAS') return (
        <div className="relative">
            <InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={[{ value: "GERAL", label: "AGÊNCIA" }, ...clients.map(c => ({ value: c.id, label: c.Nome }))]} className={common} placeholder="AGÊNCIA" label={col} />
            <SavingIndicator status={status} />
        </div>
    );
    
    if (col === 'Tipo' && tab === 'FINANCAS') return (
        <div className="relative">
            <InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_TIPO_FINANCAS} className={common} placeholder="Selecione..." label={col} />
            <SavingIndicator status={status} />
        </div>
    );

    if (tab === 'FINANCAS') {
        const isSub = row.Tipo === 'Assinatura';
        if (col === 'Recorrência') return isSub ? (
            <div className="relative">
                <InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={["Mensal", "Única"]} className={common} placeholder="Selecione..." label={col} />
                <SavingIndicator status={status} />
            </div>
        ) : null;
        if (col === 'Dia_Pagamento') return isSub ? (
            <div className="relative">
                <input type="number" min="1" max="31" value={localValue} onChange={e => setLocalValue(e.target.value)} onBlur={() => update(row.id, tab, col, localValue)} className={common} />
                <SavingIndicator status={status} />
            </div>
        ) : null;
        if (col === 'Data_Início' || col === 'Data_Fim') return isSub ? (
            <div className="relative">
                <input type="date" value={row[col]} onChange={e => update(row.id, tab, col, e.target.value)} className={common} />
                <SavingIndicator status={status} />
            </div>
        ) : null;
        if (col === 'Observações' && row.Tipo === 'Entrada') return (
            <div className="relative">
                <InputSelect value={row[col]} onChange={val => update(row.id, tab, col, val)} options={OPCOES_SERVICOS_FINANCAS} className={common} placeholder="-- Serviço --" label={col} />
                <SavingIndicator status={status} />
            </div>
        );
    }

    if (col === 'Cor (HEX)') {
        return (
            <div onClick={() => onOpenColorPicker && onOpenColorPicker(row.id, row[col])} className="flex items-center gap-2 cursor-pointer group pointer-events-auto select-none relative">
                <div className={`w-6 h-6 rounded-full border border-white/20 shadow-sm transition-transform group-hover:scale-110 ${status === 'saving' ? 'animate-pulse' : ''}`} style={{ backgroundColor: row[col] }}></div>
                <span className="text-[10px] uppercase font-bold text-app-text-muted group-hover:text-app-text-strong transition-colors">{row[col]}</span>
                <div className="absolute -right-4">
                    <SavingIndicator status={status} />
                </div>
            </div>
        );
    }

    if (tab === 'FINANCAS' && col === 'Valor') {
        return (
            <div className="relative">
                <input 
                    type="number" 
                    step="0.01" 
                    value={localValue} 
                    onChange={e => setLocalValue(e.target.value)} 
                    onBlur={() => update(row.id, tab, col, localValue)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as any).blur()}
                    className={common} 
                    placeholder="0.00" 
                />
                <SavingIndicator status={status} />
            </div>
        );
    }

    if (col === 'Conteúdo') {
        return (
            <div className="relative">
                <textarea
                    value={localValue}
                    onChange={e => setLocalValue(e.target.value)}
                    onBlur={() => update(row.id, tab, col, localValue)}
                    className={`${common} min-w-[300px] h-auto min-h-[40px] resize-y overflow-hidden leading-relaxed whitespace-pre-wrap`}
                    placeholder="Escreva o conteúdo..."
                    style={{ height: 'auto' }}
                    rows={1}
                    onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                />
                <SavingIndicator status={status} />
            </div>
        );
    }

    const inputType = (col === 'Data' || col === 'Data_Entrega') ? 'date' : col === 'Hora' ? 'time' : 'text';
    return (
        <div className="relative">
            <input 
                type={inputType} 
                value={inputType === 'text' ? localValue : row[col]} 
                onChange={e => inputType === 'text' ? setLocalValue(e.target.value) : update(row.id, tab, col, e.target.value)} 
                onBlur={() => inputType === 'text' && localValue !== row[col] && update(row.id, tab, col, localValue)}
                onKeyDown={e => e.key === 'Enter' && (e.target as any).blur()}
                className={common} 
                placeholder="..." 
            />
            <SavingIndicator status={status} />
        </div>
    );
}
