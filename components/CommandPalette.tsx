import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, CheckSquare, Users, CalendarDays, Handshake, Plus,
    LayoutDashboard, ArrowRight, Wallet, Bot, Zap, Castle, Antenna,
    ClipboardCheck, Hourglass, FileBarChart, Presentation, CornerDownLeft
} from 'lucide-react';
import { playUISound } from '../utils/uiSounds';

interface PaletteItem {
    id: string;
    section: string;
    label: string;
    sublabel?: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color?: string;      // client hex color dot
    keywords?: string;   // extra search terms
    perform: () => void;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    clients: any[];
    tasks: any[];
    planejamento: any[];
    reunioes: any[];
    setActiveTab: (tab: any) => void;
    onSelectTask: (id: string) => void;
    onCreate: (tab: string) => void;
}

const TAB_ENTRIES: { tab: string; label: string; icon: any }[] = [
    { tab: 'DASHBOARD',    label: 'Dashboard',          icon: LayoutDashboard },
    { tab: 'CLIENTES',     label: 'Clientes',           icon: Users },
    { tab: 'REUNIOES',     label: 'Reuniões',           icon: Handshake },
    { tab: 'ORGANICKIA',   label: 'EKKO IA',            icon: Bot },
    { tab: 'RDC',          label: 'Validação RDC',      icon: Zap },
    { tab: 'MATRIZ',       label: 'Matriz Estratégica', icon: Castle },
    { tab: 'COBO',         label: 'Canais (COBO)',      icon: Antenna },
    { tab: 'PLANEJAMENTO', label: 'Planejamento',       icon: CalendarDays },
    { tab: 'TAREFAS',      label: 'Fluxo de Tarefas',   icon: CheckSquare },
    { tab: 'CHECKLISTS',   label: 'Checklists',         icon: ClipboardCheck },
    { tab: 'FINANCAS',     label: 'Finanças',           icon: Wallet },
    { tab: 'VH',           label: 'Gestão de VH',       icon: Hourglass },
    { tab: 'RELATORIOS',   label: 'Relatórios',         icon: FileBarChart },
    { tab: 'WHITEBOARD',   label: 'Quadro Branco',      icon: Presentation },
];

const normalize = (s: string) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function CommandPalette({
    isOpen, onClose, clients, tasks, planejamento, reunioes,
    setActiveTab, onSelectTask, onCreate
}: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIdx(0);
            // Focus after the portal paints
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isOpen]);

    const clientName = useCallback(
        (id: string) => clients.find((c: any) => c.id === id)?.Nome || '',
        [clients]
    );

    const items = useMemo<PaletteItem[]>(() => {
        const q = normalize(query.trim());
        const out: PaletteItem[] = [];

        const go = (tab: string) => { setActiveTab(tab); onClose(); };

        // ── Quick create actions ──
        const creates: PaletteItem[] = [
            { id: 'new-task',    section: 'Criar', label: 'Nova Tarefa',    icon: Plus, keywords: 'criar adicionar task', perform: () => { setActiveTab('TAREFAS'); onCreate('TAREFAS'); onClose(); } },
            { id: 'new-post',    section: 'Criar', label: 'Novo Conteúdo',  icon: Plus, keywords: 'criar adicionar post planejamento', perform: () => { setActiveTab('PLANEJAMENTO'); onCreate('PLANEJAMENTO'); onClose(); } },
            { id: 'new-client',  section: 'Criar', label: 'Novo Cliente',   icon: Plus, keywords: 'criar adicionar cliente', perform: () => { setActiveTab('CLIENTES'); onCreate('CLIENTES'); onClose(); } },
            { id: 'new-meeting', section: 'Criar', label: 'Nova Reunião',   icon: Plus, keywords: 'criar adicionar reuniao meeting', perform: () => { setActiveTab('REUNIOES'); onCreate('REUNIOES'); onClose(); } },
            { id: 'new-fin',     section: 'Criar', label: 'Novo Lançamento', icon: Plus, keywords: 'criar adicionar financeiro receita despesa', perform: () => { setActiveTab('FINANCAS'); onCreate('FINANCAS'); onClose(); } },
        ];

        // ── Tab navigation ──
        const navs: PaletteItem[] = TAB_ENTRIES.map(t => ({
            id: `nav-${t.tab}`,
            section: 'Ir para',
            label: t.label,
            icon: t.icon,
            keywords: 'ir abrir aba tab ' + t.tab,
            perform: () => go(t.tab),
        }));

        if (!q) {
            // Empty query: show create actions + navigation
            return [...creates, ...navs];
        }

        const match = (...fields: (string | undefined)[]) =>
            fields.some(f => f && normalize(f).includes(q));

        out.push(...creates.filter(i => match(i.label, i.keywords)));
        out.push(...navs.filter(i => match(i.label, i.keywords)));

        // ── Tasks ──
        tasks
            .filter((t: any) => !t.__archived && match(t.Título, t.Descrição, clientName(t.Cliente_ID)))
            .slice(0, 6)
            .forEach((t: any) => out.push({
                id: `task-${t.id}`,
                section: 'Tarefas',
                label: t.Título || 'Sem título',
                sublabel: [clientName(t.Cliente_ID), t.Status].filter(Boolean).join(' · '),
                icon: CheckSquare,
                color: clients.find((c: any) => c.id === t.Cliente_ID)?.['Cor (HEX)'],
                perform: () => { setActiveTab('TAREFAS'); onSelectTask(t.id); onClose(); },
            }));

        // ── Clients ──
        clients
            .filter((c: any) => !c.__arquivado && match(c.Nome, c.Nicho))
            .slice(0, 5)
            .forEach((c: any) => out.push({
                id: `client-${c.id}`,
                section: 'Clientes',
                label: c.Nome || 'Sem nome',
                sublabel: c.Nicho,
                icon: Users,
                color: c['Cor (HEX)'],
                perform: () => go('CLIENTES'),
            }));

        // ── Posts (planejamento) ──
        planejamento
            .filter((p: any) => !p.__archived && match(p.Conteúdo, clientName(p.Cliente_ID)))
            .slice(0, 6)
            .forEach((p: any) => out.push({
                id: `post-${p.id}`,
                section: 'Planejamento',
                label: p.Conteúdo || 'Sem conteúdo',
                sublabel: [p.Data, clientName(p.Cliente_ID)].filter(Boolean).join(' · '),
                icon: CalendarDays,
                color: clients.find((c: any) => c.id === p.Cliente_ID)?.['Cor (HEX)'],
                perform: () => go('PLANEJAMENTO'),
            }));

        // ── Meetings ──
        reunioes
            .filter((r: any) => match(r.titulo, clientName(r.cliente_id)))
            .slice(0, 4)
            .forEach((r: any) => out.push({
                id: `meet-${r.id}`,
                section: 'Reuniões',
                label: r.titulo || 'Reunião',
                sublabel: [r.data, clientName(r.cliente_id)].filter(Boolean).join(' · '),
                icon: Handshake,
                perform: () => go('REUNIOES'),
            }));

        return out;
    }, [query, tasks, clients, planejamento, reunioes, clientName, setActiveTab, onSelectTask, onCreate, onClose]);

    // Clamp/reset selection when list changes
    useEffect(() => { setActiveIdx(0); }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, items.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (items[activeIdx]) { playUISound('tap'); items[activeIdx].perform(); }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    // Keep the active item scrolled into view
    useEffect(() => {
        listRef.current
            ?.querySelector(`[data-idx="${activeIdx}"]`)
            ?.scrollIntoView({ block: 'nearest' });
    }, [activeIdx]);

    if (!isOpen) return null;

    // Group consecutive items by section for headers
    let lastSection = '';

    return createPortal(
        <div
            className="fixed inset-0 z-[3000] flex items-start justify-center pt-[12vh] px-4"
            role="dialog" aria-modal="true" aria-label="Paleta de comandos"
        >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-pop">
                {/* Input */}
                <div className="flex items-center gap-3 px-4 border-b border-zinc-100 dark:border-zinc-800">
                    <Search size={16} className="text-zinc-400 shrink-0" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Buscar tarefas, clientes, posts… ou digite uma ação"
                        className="flex-1 h-12 bg-transparent outline-none text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-normal"
                        aria-label="Buscar"
                    />
                    <kbd className="hidden sm:block text-[9px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5">ESC</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-[46vh] overflow-y-auto custom-scrollbar py-2">
                    {items.length === 0 && (
                        <p className="px-4 py-8 text-center text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                            Nada encontrado para “{query}”
                        </p>
                    )}
                    {items.map((item, idx) => {
                        const showHeader = item.section !== lastSection;
                        lastSection = item.section;
                        const active = idx === activeIdx;
                        const Icon = item.icon;
                        return (
                            <React.Fragment key={item.id}>
                                {showHeader && (
                                    <p className="px-4 pt-3 pb-1 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">{item.section}</p>
                                )}
                                <button
                                    data-idx={idx}
                                    onClick={() => { playUISound('tap'); item.perform(); }}
                                    onMouseMove={() => setActiveIdx(idx)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-75 cursor-pointer ${
                                        active ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                                    }`}
                                >
                                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                        active ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                    }`}>
                                        <Icon size={13} />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className={`block text-[13px] font-bold truncate ${active ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                                            {item.label}
                                        </span>
                                        {item.sublabel && (
                                            <span className="block text-[10px] font-semibold text-zinc-400 truncate">{item.sublabel}</span>
                                        )}
                                    </span>
                                    {item.color && (
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                    )}
                                    {active && <CornerDownLeft size={12} className="text-blue-400 shrink-0" />}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Footer hints */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
                    {[['↑↓', 'navegar'], ['↵', 'abrir'], ['esc', 'fechar']].map(([k, l]) => (
                        <span key={l} className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                            <kbd className="text-[9px] font-black bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5">{k}</kbd>
                            {l}
                        </span>
                    ))}
                    <span className="ml-auto flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                        <ArrowRight size={10} /> Ctrl+K
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
}
