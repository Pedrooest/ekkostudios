
import React, { useMemo } from 'react';
import { Card, InputSelect } from '../Components';
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
        <div className="bg-app-surface/40 border border-white/5 rounded-2xl md:rounded-[40px] p-4 md:p-10 backdrop-blur-xl animate-fade overflow-x-auto shadow-2xl relative">
            <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-app-text-strong">Modelagem Sistemática</h2>
                        <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-widest leading-none">Matriz Estratégica</p>
                    </div>
                    <div className="w-full sm:w-64">
                        <InputSelect
                            value={activeClient ? activeClient.id : ""}
                            onChange={(val) => onSelectClient && onSelectClient(val)}
                            options={clients?.map((c: any) => ({ value: c.id, label: c.Nome })) || []}
                            placeholder="Selecione um Cliente"
                            className="w-full text-[10px] font-bold uppercase bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="px-3 md:px-4 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold uppercase text-rose-500/70">Equilíbrio:</span>
                        <span className="text-xs font-black text-rose-500">HERO: {counts.hero}</span>
                    </div>
                    <div className="px-3 md:px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold uppercase text-blue-500/70">Equilíbrio:</span>
                        <span className="text-xs font-black text-blue-500">HUB: {counts.hub}</span>
                    </div>
                    <div className="px-3 md:px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                        <span className="text-[9px] md:text-[10px] font-bold uppercase text-emerald-500/70">Equilíbrio:</span>
                        <span className="text-xs font-black text-emerald-500">HELP: {counts.help}</span>
                    </div>
                </div>
            </div>

            <div className="hidden md:block">
                <table className="w-full min-w-[1000px] border-separate border-spacing-x-4 border-spacing-y-2">
                    <thead>
                        <tr>
                            <th className="text-left text-[11px] font-black uppercase tracking-[0.2em] text-app-text-muted pb-8 pl-4 w-[150px]">Atributo</th>
                            {days.map(day => (
                                <th key={day} className="text-center pb-8">
                                    <div className="px-6 py-3 rounded-2xl bg-app-surface border border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-app-text-strong shadow-lg">
                                        {day}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => (
                            <tr key={row.id}>
                                <td className="text-[11px] font-black uppercase tracking-[0.2em] text-rose-500 py-4 pl-4">
                                    {row.label}
                                </td>
                                {days.map(day => {
                                    const value = (activeClient && data && data[activeClient.id]) ? (data[activeClient.id][`${day}-${row.id}`] || '') : '';
                                    return (
                                        <td key={`${day}-${row.id}`} className="py-2">
                                            <div className="relative group">
                                                {row.id === 'conteudo' ? (
                                                    <select
                                                        value={value}
                                                        onChange={(e) => updateCell(day, row.id, e.target.value)}
                                                        disabled={!activeClient}
                                                        className="w-full bg-app-bg/80 border border-white/5 rounded-[20px] px-5 py-3 text-[10px] font-bold text-gray-300 focus:text-app-text-strong focus:border-rose-500/30 outline-none appearance-none transition-all hover:bg-app-bg uppercase tracking-tight shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {contentOptions.map(opt => <option key={opt} value={opt} className="bg-app-surface">{opt}</option>)}
                                                    </select>
                                                ) : (
                                                    <div className="relative">
                                                        <select
                                                            value={value}
                                                            onChange={(e) => updateCell(day, row.id, e.target.value)}
                                                            disabled={!activeClient}
                                                            className="w-full bg-app-surface/40 border border-transparent rounded-xl px-4 py-3 text-[10px] font-bold text-app-text-muted focus:text-app-text-strong focus:bg-app-bg/60 outline-none appearance-none cursor-pointer text-center uppercase transition-all hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <option value="" className="bg-app-surface">-</option>
                                                            {(() => {
                                                                if (row.id === 'formato') {
                                                                    const selectedContent = activeClient && data && data[activeClient.id] ? data[activeClient.id][`${day}-conteudo`] : null;
                                                                    if (selectedContent) {
                                                                        const rdcItem = rdc.find((r: any) => r['Ideia de Conteúdo'] === selectedContent && r.Cliente_ID === activeClient.id);
                                                                        const planItem = planning.find((p: any) => p.Conteúdo === selectedContent && p.Cliente_ID === activeClient.id);
                                                                        const network = rdcItem?.Rede_Social || planItem?.Rede_Social;
                                                                        if (network && library[network]) return library[network].map((opt: any) => <option key={opt} value={opt} className="bg-app-surface">{opt}</option>);
                                                                    }
                                                                    return Object.values(library).flat().map((opt: any) => <option key={opt} value={opt} className="bg-app-surface">{opt}</option>);
                                                                }
                                                                return row.options?.map((opt: any) => <option key={opt} value={opt} className="bg-app-surface">{opt}</option>);
                                                            })()}
                                                        </select>
                                                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <i className="fa-solid fa-chevron-down text-[7px] text-gray-600"></i>
                                                        </div>
                                                    </div>
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
                    <div key={day} className="bg-app-bg/50 border border-white/5 rounded-[32px] p-5 md:p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 blur-[40px] rounded-full"></div>
                        <h3 className="text-xl font-black uppercase tracking-tighter text-app-text-strong mb-6 pl-2 border-l-4 border-blue-500">{day}</h3>
                        <div className="space-y-5">
                            {rows.map(row => {
                                const value = (activeClient && data && data[activeClient.id]) ? (data[activeClient.id][`${day}-${row.id}`] || '') : '';
                                return (
                                    <div key={row.id}>
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-app-text-muted block mb-2 ml-1">{row.label}</label>
                                        {row.id === 'conteudo' ? (
                                            <InputSelect
                                                value={value}
                                                onChange={(val) => updateCell(day, row.id, val)}
                                                options={contentOptions.map(opt => ({ value: opt, label: opt }))}
                                                className="w-full bg-app-surface border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-bold text-app-text-strong outline-none focus:border-blue-500/50 uppercase tracking-wide appearance-none"
                                                placeholder="Selecione..."
                                                label={row.label}
                                            />
                                        ) : (
                                            <InputSelect
                                                value={value}
                                                onChange={(val) => updateCell(day, row.id, val)}
                                                options={(() => {
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
                                                className="w-full bg-app-surface border border-white/10 rounded-2xl px-5 py-4 text-[11px] font-bold text-app-text-strong outline-none focus:border-blue-500/50 uppercase tracking-wide appearance-none"
                                                placeholder="-"
                                                label={row.label}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
