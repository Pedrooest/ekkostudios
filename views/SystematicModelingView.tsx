
import React, { useMemo } from 'react';
import { Card, InputSelect, Badge } from '../Components';
import { LINHAS_MODELAGEM_SISTEMATICA as rows } from '../constants';
import { Cliente, BibliotecaConteudo } from '../types';
import { playUISound } from '../utils/uiSounds';

interface SystematicModelingViewProps {
    activeClient: Cliente | null;
    clients: Cliente[];
    onSelectClient: (id: string) => void;
    rdc: any[];
    planning: any[];
    library: BibliotecaConteudo;
    data: any;
    onUpdate: (data: any) => void;
}

export function SystematicModelingView({
    activeClient, clients, onSelectClient,
    rdc, planning, library, data, onUpdate
}: SystematicModelingViewProps) {
    const days = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

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
        const clientData = { ...(data && data[activeClient.id] ? data[activeClient.id] : {}) };
        clientData[`${day}-${rowId}`] = value;
        onUpdate({ ...(data || {}), [activeClient.id]: clientData });
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
        <div className="view-root flex flex-col h-full w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors animate-fade">
            {/* HEADER */}
            <div className="flex items-center justify-between flex-wrap gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white truncate">Modelagem Sistemática</h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Matriz Estratégica</p>
                    </div>
                    <div className="w-64">
                        <InputSelect
                            value={activeClient ? activeClient.id : ""}
                            onChange={(val) => onSelectClient && onSelectClient(val)}
                            options={clients?.map((c: any) => ({ value: c.id, label: c.Nome })) || []}
                            placeholder="Selecione um Cliente"
                            className="!h-9 !text-[11px] font-semibold uppercase"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge color="rose" className="h-8 px-3 gap-2">
                        <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Hero:</span>
                        <span className="font-bold">{counts.hero}</span>
                    </Badge>
                    <Badge color="blue" className="h-8 px-3 gap-2">
                        <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Hub:</span>
                        <span className="font-bold">{counts.hub}</span>
                    </Badge>
                    <Badge color="emerald" className="h-8 px-3 gap-2">
                        <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Help:</span>
                        <span className="font-bold">{counts.help}</span>
                    </Badge>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                <div className="hidden md:block table-responsive overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0 table-fixed min-w-[1000px]">
                        <thead>
                            <tr>
                                <th className="text-left text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 w-[180px]">Atributo</th>
                                {days.map(day => (
                                    <th key={day} className="text-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={row.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-50 dark:bg-zinc-800/30'} hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors`}>
                                    <td className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800/50">
                                        {row.label}
                                    </td>
                                    {days.map(day => {
                                        const value = (activeClient && data && data[activeClient.id]) ? (data[activeClient.id][`${day}-${row.id}`] || '') : '';
                                        return (
                                            <td key={`${day}-${row.id}`} className="px-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800/50">
                                                <div className="relative group">
                                                    {row.id === 'conteudo' ? (
                                                        <select
                                                            value={value}
                                                            onChange={(e) => updateCell(day, row.id, e.target.value)}
                                                            disabled={!activeClient}
                                                            className="w-full h-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 focus:border-zinc-500 outline-none appearance-none transition-all uppercase tracking-tight shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            {contentOptions.map(opt => <option key={opt} value={opt} className="bg-white dark:bg-zinc-900">{opt}</option>)}
                                                        </select>
                                                    ) : (
                                                        <select
                                                            value={value}
                                                            onChange={(e) => updateCell(day, row.id, e.target.value)}
                                                            disabled={!activeClient}
                                                            className="w-full h-8 bg-transparent border-none text-[10px] font-bold text-zinc-500 dark:text-zinc-400 focus:text-zinc-900 dark:focus:text-white outline-none appearance-none cursor-pointer text-center uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="" className="bg-white dark:bg-zinc-900">-</option>
                                                            {(() => {
                                                                if (row.id === 'formato') {
                                                                    const selectedContent = activeClient && data && data[activeClient.id] ? data[activeClient.id][`${day}-conteudo`] : null;
                                                                    if (selectedContent) {
                                                                        const rdcItem = rdc.find((r: any) => r['Ideia de Conteúdo'] === selectedContent && r.Cliente_ID === activeClient.id);
                                                                        const planItem = planning.find((p: any) => p.Conteúdo === selectedContent && p.Cliente_ID === activeClient.id);
                                                                        const network = rdcItem?.Rede_Social || planItem?.Rede_Social;
                                                                        if (network && library[network]) return library[network].map((opt: any) => <option key={opt} value={opt} className="bg-white dark:bg-zinc-900">{opt}</option>);
                                                                    }
                                                                    return Object.values(library).flat().map((opt: any) => <option key={opt} value={opt} className="bg-white dark:bg-zinc-900">{opt}</option>);
                                                                }
                                                                return row.options?.map((opt: any) => <option key={opt} value={opt} className="bg-white dark:bg-zinc-900">{opt}</option>);
                                                            })()}
                                                        </select>
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
                        <Card key={day} className="overflow-hidden">
                            <h3 className="text-sm font-bold uppercase tracking-tight text-zinc-900 dark:text-white mb-4 pl-3 border-l-2 border-zinc-900 dark:border-zinc-100">{day}</h3>
                            <div className="space-y-4">
                                {rows.map(row => {
                                    const value = (activeClient && data && data[activeClient.id]) ? (data[activeClient.id][`${day}-${row.id}`] || '') : '';
                                    return (
                                        <div key={row.id}>
                                            <InputSelect
                                                label={row.label}
                                                value={value}
                                                onChange={(val) => updateCell(day, row.id, val)}
                                                disabled={!activeClient}
                                                options={(() => {
                                                    if (row.id === 'conteudo') return contentOptions.map(opt => ({ value: opt, label: opt }));
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
                                                className="!h-9 !text-[11px] font-semibold uppercase"
                                                placeholder={row.id === 'conteudo' ? "Selecione..." : "-"}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
