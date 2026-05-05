import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DatabaseService } from '../DatabaseService';
import { WhiteboardElement, WhiteboardConnection } from '../types';
import {
    MousePointer2, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, Maximize,
    Type, StickyNote, Link2, Plus, ArrowUpRight,
    Hand, PenTool, Eraser, CheckSquare, Folder, Square, FileText, ChevronRight,
    Copy, Layers, ArrowUp, ArrowDown, Grid, Undo2, Redo2, Lock, Unlock,
    Play, ChevronLeft, Download, Magnet, Smile, X as XIcon, Map
} from 'lucide-react';

const COLORS = [
    'bg-amber-200 text-amber-900',
    'bg-rose-200 text-rose-900',
    'bg-blue-200 text-blue-900',
    'bg-emerald-200 text-emerald-900',
    'bg-purple-200 text-purple-900',
    'bg-orange-200 text-orange-900',
    'bg-zinc-100 text-zinc-900',
    'bg-cyan-200 text-cyan-900',
];

const COLOR_HEX: Record<string, string> = {
    'bg-amber-200 text-amber-900': '#fde68a',
    'bg-rose-200 text-rose-900': '#fecdd3',
    'bg-blue-200 text-blue-900': '#bfdbfe',
    'bg-emerald-200 text-emerald-900': '#a7f3d0',
    'bg-purple-200 text-purple-900': '#e9d5ff',
    'bg-orange-200 text-orange-900': '#fed7aa',
    'bg-zinc-100 text-zinc-900': '#f4f4f5',
    'bg-cyan-200 text-cyan-900': '#a5f3fc',
};

// Top strip color for each post-it color
const POSTIT_TOP_COLOR: Record<string, string> = {
    'bg-amber-200 text-amber-900': '#f59e0b',
    'bg-rose-200 text-rose-900': '#f43f5e',
    'bg-blue-200 text-blue-900': '#3b82f6',
    'bg-emerald-200 text-emerald-900': '#10b981',
    'bg-purple-200 text-purple-900': '#8b5cf6',
    'bg-orange-200 text-orange-900': '#f97316',
    'bg-zinc-100 text-zinc-900': '#71717a',
    'bg-cyan-200 text-cyan-900': '#06b6d4',
};

// Frame background color swatches
const FRAME_COLORS = [
    { label: 'Transparente', bg: 'transparent', border: '#9ca3af' },
    { label: 'Âmbar', bg: '#fef3c720', border: '#f59e0b' },
    { label: 'Azul', bg: '#dbeafe20', border: '#3b82f6' },
    { label: 'Verde', bg: '#d1fae520', border: '#10b981' },
    { label: 'Rosa', bg: '#ffe4e620', border: '#f43f5e' },
    { label: 'Roxo', bg: '#ede9fe20', border: '#8b5cf6' },
];

const EMOJI_LIST = ['💡', '❤️', '⚡', '🎯', '✅', '⚠️'];

type HistoryEntry = { elements: WhiteboardElement[]; connections: WhiteboardConnection[] };

interface WhiteboardProps {
    workspaceId?: string;
}

type GridMode = 'dots' | 'grid' | 'none';
type ToolType = 'cursor' | 'pan' | 'connect' | 'pen' | 'eraser';

interface ContextMenu {
    x: number;
    y: number;
    canvasX: number;
    canvasY: number;
    elementId?: string;
}

// ─── Templates ───────────────────────────────────────────────────────────────

interface TemplateCard {
    id: string;
    name: string;
    icon: string;
    description: string;
    build: (genId: () => string, boardId: string) => { elements: WhiteboardElement[]; connections: WhiteboardConnection[] };
}

const TEMPLATES: TemplateCard[] = [
    {
        id: 'brainstorm',
        name: 'Brainstorming',
        icon: '💡',
        description: '6 post-its coloridos em torno de um tema central',
        build: (genId, boardId) => {
            const centerX = 300, centerY = 250;
            const positions = [
                { x: centerX - 260, y: centerY - 130 },
                { x: centerX + 60, y: centerY - 200 },
                { x: centerX + 280, y: centerY - 60 },
                { x: centerX + 200, y: centerY + 140 },
                { x: centerX - 60, y: centerY + 200 },
                { x: centerX - 300, y: centerY + 80 },
            ];
            const notes = ['Ideia 1', 'Ideia 2', 'Ideia 3', 'Ideia 4', 'Ideia 5', 'Ideia 6'];
            const colors = COLORS.slice(0, 6);
            const central: WhiteboardElement = {
                id: genId(), parentId: boardId, type: 'text',
                x: centerX - 80, y: centerY - 20, w: 200, h: 40, content: '✨ Tema Central',
            };
            const els: WhiteboardElement[] = [central, ...positions.map((pos, i) => ({
                id: genId(), parentId: boardId, type: 'postit' as const,
                x: pos.x, y: pos.y, w: 160, h: 140, content: notes[i], color: colors[i],
            }))];
            return { elements: els, connections: [] };
        },
    },
    {
        id: 'kanban',
        name: 'Kanban',
        icon: '📋',
        description: '3 frames: A Fazer, Em Progresso, Concluído',
        build: (genId, boardId) => {
            const cols = ['A Fazer', 'Em Progresso', 'Concluído'];
            const frameColors = ['#3b82f6', '#f59e0b', '#10b981'];
            const els: WhiteboardElement[] = [];
            const conns: WhiteboardConnection[] = [];
            cols.forEach((col, ci) => {
                const fx = 50 + ci * 340;
                const frameId = genId();
                els.push({ id: frameId, parentId: boardId, type: 'frame', x: fx, y: 50, w: 300, h: 420, content: '', title: col, color: frameColors[ci] });
                ['Tarefa 1', 'Tarefa 2'].forEach((t, ti) => {
                    els.push({
                        id: genId(), parentId: boardId, type: 'task', x: fx + 20, y: 110 + ti * 160, w: 260, h: 130,
                        content: '', title: t, tasks: [{ id: genId(), text: 'Subtarefa A', done: false }, { id: genId(), text: 'Subtarefa B', done: false }],
                    });
                });
            });
            return { elements: els, connections: conns };
        },
    },
    {
        id: 'mindmap',
        name: 'Mapa Mental',
        icon: '🧠',
        description: 'Cartão central com 4 ramos conectados',
        build: (genId, boardId) => {
            const center: WhiteboardElement = { id: genId(), parentId: boardId, type: 'card', x: 300, y: 200, w: 200, h: 80, content: 'Ideia central', title: 'Centro' };
            const branches = [
                { x: 50, y: 80, title: 'Ramo 1', content: 'Detalhe A' },
                { x: 560, y: 80, title: 'Ramo 2', content: 'Detalhe B' },
                { x: 50, y: 340, title: 'Ramo 3', content: 'Detalhe C' },
                { x: 560, y: 340, title: 'Ramo 4', content: 'Detalhe D' },
            ];
            const els: WhiteboardElement[] = [center];
            const conns: WhiteboardConnection[] = [];
            branches.forEach(b => {
                const id = genId();
                els.push({ id, parentId: boardId, type: 'card', x: b.x, y: b.y, w: 180, h: 70, content: b.content, title: b.title });
                conns.push({ id: genId(), from: center.id, to: id, parentId: boardId });
            });
            return { elements: els, connections: conns };
        },
    },
    {
        id: 'briefing',
        name: 'Briefing de Cliente',
        icon: '📝',
        description: 'Cartões pré-preenchidos: Objetivo, Público, Tom, Referências',
        build: (genId, boardId) => {
            const items = [
                { title: 'Objetivo', content: 'Descreva o objetivo principal do projeto...' },
                { title: 'Público-alvo', content: 'Quem é o público? Idade, interesses, comportamento...' },
                { title: 'Tom de Voz', content: 'Formal? Descontraído? Inspirador? Técnico?' },
                { title: 'Referências', content: 'Marcas, estilos e conteúdos que inspiram...' },
            ];
            const els: WhiteboardElement[] = items.map((item, i) => ({
                id: genId(), parentId: boardId, type: 'card' as const,
                x: (i % 2) * 340 + 50, y: Math.floor(i / 2) * 200 + 50, w: 300, h: 160,
                content: item.content, title: item.title,
            }));
            return { elements: els, connections: [] };
        },
    },
    {
        id: 'content-calendar',
        name: 'Calendário de Conteúdo',
        icon: '📅',
        description: '4 frames de semana, cada um com 2 post-its',
        build: (genId, boardId) => {
            const els: WhiteboardElement[] = [];
            const frameColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
            for (let w = 0; w < 4; w++) {
                const fx = 50 + w * 320;
                const frameId = genId();
                els.push({ id: frameId, parentId: boardId, type: 'frame', x: fx, y: 50, w: 280, h: 360, content: '', title: `Semana ${w + 1}`, color: frameColors[w] });
                ['Post 1', 'Post 2'].forEach((p, pi) => {
                    els.push({
                        id: genId(), parentId: boardId, type: 'postit' as const,
                        x: fx + 20, y: 110 + pi * 150, w: 240, h: 120,
                        content: p, color: COLORS[w % COLORS.length],
                    });
                });
            }
            return { elements: els, connections: [] };
        },
    },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function Whiteboard({ workspaceId }: WhiteboardProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persist Engine
    const [elements, setElements] = useState<WhiteboardElement[]>([]);
    const [connections, setConnections] = useState<WhiteboardConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // History (undo/redo)
    const historyRef = useRef<HistoryEntry[]>([]);
    const historyIndexRef = useRef(-1);
    const isMutatingRef = useRef(false);

    const pushHistory = useCallback((els: WhiteboardElement[], conns: WhiteboardConnection[]) => {
        const entry: HistoryEntry = {
            elements: JSON.parse(JSON.stringify(els)),
            connections: JSON.parse(JSON.stringify(conns)),
        };
        historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current.push(entry);
        if (historyRef.current.length > 50) historyRef.current.shift();
        historyIndexRef.current = historyRef.current.length - 1;
    }, []);

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0) return;
        historyIndexRef.current--;
        const entry = historyRef.current[historyIndexRef.current];
        isMutatingRef.current = true;
        setElements(entry.elements);
        setConnections(entry.connections);
        setTimeout(() => { isMutatingRef.current = false; }, 50);
        tryPlaySound('tap');
    }, []);

    const redo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return;
        historyIndexRef.current++;
        const entry = historyRef.current[historyIndexRef.current];
        isMutatingRef.current = true;
        setElements(entry.elements);
        setConnections(entry.connections);
        setTimeout(() => { isMutatingRef.current = false; }, 50);
        tryPlaySound('tap');
    }, []);

    const canUndo = historyIndexRef.current > 0;
    const canRedo = historyIndexRef.current < historyRef.current.length - 1;

    // Breadcrumbs (Nested Boards)
    const [activeBoard, setActiveBoard] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Board principal' }]);
    const currentBoardId = activeBoard[activeBoard.length - 1].id;

    // View Filters
    const visibleElements = elements.filter(e => (e.parentId || 'root') === currentBoardId);
    const visibleConnections = connections.filter(c => (c.parentId || 'root') === currentBoardId);

    // Canvas State
    const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [gridMode, setGridMode] = useState<GridMode>('dots');

    // Snap to grid
    const [snapToGrid, setSnapToGrid] = useState(false);

    // Templates panel
    const [showTemplates, setShowTemplates] = useState(false);

    // Presentation mode
    const [presentationMode, setPresentationMode] = useState(false);
    const [presentationIndex, setPresentationIndex] = useState(0);
    const [presentTransition, setPresentTransition] = useState(false);

    // Minimap
    const [showMinimap, setShowMinimap] = useState(false);

    // Export dropdown
    const [showExport, setShowExport] = useState(false);

    // Toast
    const [toast, setToast] = useState<string | null>(null);

    // Tools
    const [activeTool, setActiveTool] = useState<ToolType>('cursor');
    const [penSettings, setPenSettings] = useState({ color: '#6366f1', thickness: 3 });

    // Interaction State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPanning, setIsPanning] = useState(false);

    // Drag/Resize State
    const [isDragging, setIsDragging] = useState(false);
    const [dragInfo, setDragInfo] = useState<{ startX: number, startY: number, initialElements: any[] } | null>(null);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const [resizeInfo, setResizeInfo] = useState<{ startX: number, startY: number, initialW: number, initialH: number } | null>(null);

    // Connection & Pen State
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [tempArrowEnd, setTempArrowEnd] = useState<{ x: number, y: number } | null>(null);
    const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
    const [pendingImagePos, setPendingImagePos] = useState<{ x: number, y: number } | null>(null);
    const [currentDrawPath, setCurrentDrawPath] = useState<string | null>(null);

    // Emoji picker per postit
    const [emojiPickerFor, setEmojiPickerFor] = useState<string | null>(null);

    // Context Menu
    const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

    // Play UI Sound
    const tryPlaySound = useCallback((type: 'tap' | 'close' | 'success') => {
        try {
            if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
        } catch (e) { /* silent */ }
    }, []);

    // Show toast helper
    const showToast = useCallback((msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    }, []);

    // 1. Initial Load
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);

        const loadBoard = async () => {
            if (!workspaceId) return;
            setIsLoading(true);
            try {
                const board = await DatabaseService.getWhiteboard(workspaceId);
                if (board) {
                    const els = board.elements || [];
                    const conns = board.connections || [];
                    setElements(els);
                    setConnections(conns);
                    pushHistory(els, conns);
                }
            } catch (error) {
                console.error('Failed to load whiteboard', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadBoard();
        return () => window.removeEventListener('resize', handleResize);
    }, [workspaceId, pushHistory]);

    // 2. Auto-save Engine
    useEffect(() => {
        if (isLoading || !workspaceId || isMutatingRef.current) return;
        setSaveStatus('saving');
        const timeoutId = setTimeout(async () => {
            try {
                await DatabaseService.saveWhiteboard(workspaceId, elements, connections);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('Failed to auto-save whiteboard', error);
                setSaveStatus('idle');
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [elements, connections, isLoading, workspaceId]);

    // =====================================
    // CAMERA & MATH
    // =====================================
    const getLocalCoordinates = useCallback((clientX: number, clientY: number) => {
        const bounds = canvasRef.current?.getBoundingClientRect();
        if (!bounds) return { x: 0, y: 0 };
        return {
            x: (clientX - bounds.left - camera.x) / camera.z,
            y: (clientY - bounds.top - camera.y) / camera.z
        };
    }, [camera]);

    const snapVal = useCallback((v: number) => snapToGrid ? Math.round(v / 25) * 25 : v, [snapToGrid]);

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            setCamera(c => {
                const newZ = Math.min(Math.max(0.1, c.z + delta * c.z), 3);
                const bounds = canvasRef.current?.getBoundingClientRect();
                if (!bounds) return { ...c, z: newZ };
                const mx = e.clientX - bounds.left;
                const my = e.clientY - bounds.top;
                return {
                    x: mx - (mx - c.x) * (newZ / c.z),
                    y: my - (my - c.y) * (newZ / c.z),
                    z: newZ,
                };
            });
        } else {
            setCamera(c => ({ x: c.x - e.deltaX, y: c.y - e.deltaY, z: c.z }));
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            return () => canvas.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    const resetCamera = () => { tryPlaySound('tap'); setCamera({ x: 0, y: 0, z: 1 }); };
    const zoomIn = () => { tryPlaySound('tap'); setCamera(c => ({ ...c, z: Math.min(c.z * 1.2, 3) })); };
    const zoomOut = () => { tryPlaySound('tap'); setCamera(c => ({ ...c, z: Math.max(c.z / 1.2, 0.1) })); };

    // =====================================
    // PRESENTATION MODE
    // =====================================
    const frames = visibleElements.filter(e => e.type === 'frame');

    const navigateToFrame = useCallback((idx: number) => {
        const frame = frames[idx];
        if (!frame) return;
        const bounds = canvasRef.current?.getBoundingClientRect();
        if (!bounds) return;
        const padding = 80;
        const scaleX = (bounds.width - padding * 2) / frame.w;
        const scaleY = (bounds.height - padding * 2) / frame.h;
        const newZ = Math.min(scaleX, scaleY, 2);
        const newX = bounds.width / 2 - (frame.x + frame.w / 2) * newZ;
        const newY = bounds.height / 2 - (frame.y + frame.h / 2) * newZ;
        setPresentTransition(true);
        setCamera({ x: newX, y: newY, z: newZ });
        setTimeout(() => setPresentTransition(false), 700);
    }, [frames]);

    const enterPresentation = useCallback(() => {
        if (frames.length === 0) {
            showToast('Adicione frames ao board para usar o modo apresentação');
            return;
        }
        setPresentationMode(true);
        setPresentationIndex(0);
        navigateToFrame(0);
    }, [frames, navigateToFrame, showToast]);

    const exitPresentation = useCallback(() => {
        setPresentationMode(false);
    }, []);

    const prevSlide = useCallback(() => {
        const newIdx = Math.max(0, presentationIndex - 1);
        setPresentationIndex(newIdx);
        navigateToFrame(newIdx);
    }, [presentationIndex, navigateToFrame]);

    const nextSlide = useCallback(() => {
        const newIdx = Math.min(frames.length - 1, presentationIndex + 1);
        setPresentationIndex(newIdx);
        navigateToFrame(newIdx);
    }, [presentationIndex, frames.length, navigateToFrame]);

    // =====================================
    // KEYBOARD SHORTCUTS
    // =====================================
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (presentationMode) {
                if (e.key === 'Escape') { exitPresentation(); return; }
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { nextSlide(); return; }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { prevSlide(); return; }
                return;
            }

            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                if (e.key === 'Escape') { target.blur(); setSelectedIds([]); }
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                setSelectedIds(visibleElements.filter(el => el.type !== 'frame').map(el => el.id));
                return;
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                if (selectedIds.length > 0) duplicateSelection();
                return;
            }

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
                e.preventDefault();
                deleteSelectionFn();
                return;
            }

            if (e.key === 'Escape') { setSelectedIds([]); setConnectingFrom(null); setContextMenu(null); setShowTemplates(false); setShowExport(false); return; }

            if (e.key === 'v' || e.key === 'V') setActiveTool('cursor');
            if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
            if (e.key === 'c' || e.key === 'C') setActiveTool('connect');
            if (e.key === 'p' || e.key === 'P') setActiveTool('pen');
            if (e.key === 'e' || e.key === 'E') setActiveTool('eraser');

            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-') zoomOut();
            if (e.key === '0') resetCamera();

            if (selectedIds.length > 0 && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
                e.preventDefault();
                const delta = e.shiftKey ? 10 : 1;
                const dx = e.key === 'ArrowLeft' ? -delta : e.key === 'ArrowRight' ? delta : 0;
                const dy = e.key === 'ArrowUp' ? -delta : e.key === 'ArrowDown' ? delta : 0;
                setElements(prev => {
                    const next = prev.map(el => selectedIds.includes(el.id) ? { ...el, x: el.x + dx, y: el.y + dy } : el);
                    pushHistory(next, connections);
                    return next;
                });
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [selectedIds, visibleElements, connections, undo, redo, pushHistory, presentationMode, exitPresentation, nextSlide, prevSlide]);

    // Space to toggle pan temporarily
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            if (e.code === 'Space') { e.preventDefault(); setActiveTool('pan'); }
        };
        const up = (e: KeyboardEvent) => {
            if (e.code === 'Space') setActiveTool('cursor');
        };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    // =====================================
    // CREATION
    // =====================================
    const generateId = () => Math.random().toString(36).substring(2, 9);

    const createElement = useCallback((type: WhiteboardElement['type'], forceX?: number, forceY?: number, extraMeta?: any) => {
        tryPlaySound('success');
        const bounds = canvasRef.current?.getBoundingClientRect();
        let cx = forceX ?? (bounds ? (bounds.width / 2 - camera.x) / camera.z + (Math.random() * 40 - 20) : 100);
        let cy = forceY ?? (bounds ? (bounds.height / 2 - camera.y) / camera.z + (Math.random() * 40 - 20) : 100);
        cx = snapVal(cx);
        cy = snapVal(cy);

        let newEl: WhiteboardElement = {
            id: generateId(),
            parentId: currentBoardId,
            type,
            x: cx,
            y: cy,
            w: 220,
            h: 220,
            content: '',
            ...extraMeta,
        };

        if (type === 'postit') {
            newEl.color = COLORS[Math.floor(Math.random() * 3)];
            newEl.content = 'Nova nota';
        } else if (type === 'card' || type === 'image') {
            newEl.type = 'card';
            newEl.w = 300;
            newEl.h = 'auto' as any;
            newEl.title = 'Novo Cartão';
            newEl.content = 'Escreva aqui...';
        } else if (type === 'text') {
            newEl.w = 300;
            newEl.h = 'auto' as any;
            newEl.content = 'Texto livre';
        } else if (type === 'task') {
            newEl.w = 300;
            newEl.h = 'auto' as any;
            newEl.title = 'Tarefas';
            newEl.tasks = [{ id: generateId(), text: 'Atividade 1', done: false }];
        } else if (type === 'folder') {
            newEl.w = 200;
            newEl.h = 100;
            newEl.title = 'Nova Pasta';
        } else if (type === 'frame') {
            newEl.w = 600;
            newEl.h = 400;
            newEl.title = 'Nova Seção';
        } else if (type === 'document') {
            newEl.w = 400;
            newEl.h = 300;
            newEl.htmlContent = 'Comece a digitar aqui...';
        }

        setElements(prev => {
            const next = [...prev, newEl];
            pushHistory(next, connections);
            return next;
        });

        if (type !== 'drawing') {
            setSelectedIds([newEl.id]);
            if (activeTool !== 'pen') setActiveTool('cursor');
        }
    }, [currentBoardId, camera, activeTool, connections, pushHistory, tryPlaySound, snapVal]);

    // Apply template
    const applyTemplate = useCallback((template: TemplateCard) => {
        const { elements: tEls, connections: tConns } = template.build(generateId, currentBoardId);
        setElements(prev => {
            const next = [...prev, ...tEls];
            setConnections(prevConns => {
                const nextConns = [...prevConns, ...tConns];
                pushHistory(next, nextConns);
                return nextConns;
            });
            return next;
        });
        setShowTemplates(false);
        tryPlaySound('success');
    }, [currentBoardId, pushHistory, tryPlaySound]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                createElement('image', pendingImagePos?.x, pendingImagePos?.y, { imageSrc: ev.target?.result as string });
                setPendingImagePos(null);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addLink = () => {
        const url = prompt('Cole aqui o Link (URL):');
        if (url) createElement('link', undefined, undefined, { url, title: 'Web Link', content: url });
    };

    // =====================================
    // POINTER EVENTS
    // =====================================
    const handlePointerDown = (e: React.PointerEvent, elementId: string | null = null) => {
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        if (contextMenu) { setContextMenu(null); return; }
        if (emojiPickerFor) { setEmojiPickerFor(null); return; }

        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

        if (activeTool === 'pan' || (!elementId && e.button === 0 && activeTool === 'cursor') || e.button === 1 || (e.button === 0 && e.altKey)) {
            setSelectedIds([]);
            setIsPanning(true);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            return;
        }

        if (activeTool === 'connect' && elementId) {
            e.preventDefault(); e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setConnectingFrom(elementId);
            setTempArrowEnd({ x, y });
            tryPlaySound('tap');
            return;
        }

        if (activeTool === 'pen' && !elementId) {
            setCurrentDrawPath(`M ${x} ${y}`);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            return;
        }

        if (activeTool === 'eraser' && elementId) {
            const el = elements.find(el => el.id === elementId);
            if (el?.type === 'drawing') { deleteElementFn(elementId); }
            return;
        }

        if (elementId && activeTool === 'cursor') {
            // Block drag/resize for locked elements
            const el = elements.find(el => el.id === elementId);
            if (el?.locked) {
                if (!selectedIds.includes(elementId)) {
                    setSelectedIds(e.shiftKey ? [...selectedIds, elementId] : [elementId]);
                }
                return;
            }

            e.preventDefault(); e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);

            if (!selectedIds.includes(elementId)) {
                const newSelection = e.shiftKey ? [...selectedIds, elementId] : [elementId];
                setSelectedIds(newSelection);
                tryPlaySound('tap');
            }

            setIsDragging(true);
            const selectedEls = visibleElements.filter(el => selectedIds.includes(el.id) || el.id === elementId);
            setDragInfo({
                startX: x,
                startY: y,
                initialElements: selectedEls.map(el => ({ id: el.id, initialX: el.x, initialY: el.y })),
            });
        }
    };

    const handleResizeStart = (e: React.PointerEvent, element: WhiteboardElement) => {
        if (element.locked) return;
        e.preventDefault(); e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setIsResizing(element.id);
        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
        setResizeInfo({ startX: x, startY: y, initialW: element.w, initialH: element.h });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

        if (isPanning) { setCamera(c => ({ ...c, x: c.x + e.movementX, y: c.y + e.movementY })); return; }

        if (activeTool === 'pen' && currentDrawPath) {
            setCurrentDrawPath(prev => prev + ` L ${x} ${y}`);
            return;
        }

        if (connectingFrom) { setTempArrowEnd({ x, y }); return; }

        if (isResizing && resizeInfo) {
            const dx = x - resizeInfo.startX;
            const dy = y - resizeInfo.startY;
            const newW = snapVal(Math.max(100, resizeInfo.initialW + dx));
            const newH = snapVal(Math.max(50, resizeInfo.initialH + dy));
            setElements(els => els.map(el => el.id === isResizing
                ? { ...el, w: newW, h: newH }
                : el
            ));
            return;
        }

        if (isDragging && dragInfo) {
            const dx = x - dragInfo.startX;
            const dy = y - dragInfo.startY;
            setElements(els => els.map(el => {
                const initial = dragInfo.initialElements.find(i => i.id === el.id);
                if (!initial) return el;
                return { ...el, x: snapVal(initial.initialX + dx), y: snapVal(initial.initialY + dy) };
            }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        if (activeTool === 'pen' && currentDrawPath) {
            setElements(prev => {
                const newEl: WhiteboardElement = {
                    id: generateId(), parentId: currentBoardId, type: 'drawing',
                    x: 0, y: 0, w: 0, h: 0, content: '',
                    path: currentDrawPath!, color: penSettings.color, thickness: penSettings.thickness,
                };
                const next = [...prev, newEl];
                pushHistory(next, connections);
                return next;
            });
            setCurrentDrawPath(null);
        }

        if (connectingFrom) {
            if (hoveredElementId && hoveredElementId !== connectingFrom) {
                tryPlaySound('success');
                setConnections(prev => {
                    const next = [...prev, { id: generateId(), from: connectingFrom, to: hoveredElementId, parentId: currentBoardId }];
                    pushHistory(elements, next);
                    return next;
                });
            }
            setConnectingFrom(null);
            setTempArrowEnd(null);
        }

        if (isDragging) {
            setElements(prev => { pushHistory(prev, connections); return prev; });
        }
        if (isResizing) {
            setElements(prev => { pushHistory(prev, connections); return prev; });
        }

        setIsPanning(false);
        setIsDragging(false);
        setIsResizing(null);
        setDragInfo(null);
        setResizeInfo(null);
    };

    // Right-click context menu
    const handleContextMenu = (e: React.MouseEvent, elementId?: string) => {
        e.preventDefault();
        e.stopPropagation();
        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
        setContextMenu({ x: e.clientX, y: e.clientY, canvasX: x, canvasY: y, elementId });
        if (elementId && !selectedIds.includes(elementId)) setSelectedIds([elementId]);
    };

    // =====================================
    // OPERATIONS
    // =====================================
    const updateElement = (id: string, updates: Partial<WhiteboardElement>) => {
        setElements(els => els.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const deleteElementFn = (id: string) => {
        setElements(prev => {
            const next = prev.filter(el => el.id !== id);
            setConnections(conns => {
                const nextConns = conns.filter(c => c.from !== id && c.to !== id);
                pushHistory(next, nextConns);
                return nextConns;
            });
            return next;
        });
        tryPlaySound('close');
    };

    const deleteSelectionFn = () => {
        if (selectedIds.length === 0) return;
        tryPlaySound('close');
        setElements(prev => {
            const next = prev.filter(el => !selectedIds.includes(el.id));
            setConnections(conns => {
                const nextConns = conns.filter(c => !selectedIds.includes(c.from) && !selectedIds.includes(c.to));
                pushHistory(next, nextConns);
                return nextConns;
            });
            return next;
        });
        setSelectedIds([]);
    };

    const duplicateSelection = () => {
        if (selectedIds.length === 0) return;
        tryPlaySound('success');
        const newIds: string[] = [];
        setElements(prev => {
            const dupes: WhiteboardElement[] = prev
                .filter(el => selectedIds.includes(el.id))
                .map(el => {
                    const nid = generateId();
                    newIds.push(nid);
                    return { ...JSON.parse(JSON.stringify(el)), id: nid, x: el.x + 30, y: el.y + 30 };
                });
            const next = [...prev, ...dupes];
            pushHistory(next, connections);
            return next;
        });
        setTimeout(() => setSelectedIds(newIds), 10);
    };

    const bringToFront = () => {
        setElements(prev => {
            const selected = prev.filter(el => selectedIds.includes(el.id));
            const rest = prev.filter(el => !selectedIds.includes(el.id));
            const next = [...rest, ...selected];
            pushHistory(next, connections);
            return next;
        });
        tryPlaySound('tap');
    };

    const sendToBack = () => {
        setElements(prev => {
            const selected = prev.filter(el => selectedIds.includes(el.id));
            const rest = prev.filter(el => !selectedIds.includes(el.id));
            const next = [...selected, ...rest];
            pushHistory(next, connections);
            return next;
        });
        tryPlaySound('tap');
    };

    const toggleLock = (id: string) => {
        const el = elements.find(e => e.id === id);
        if (!el) return;
        updateElement(id, { locked: !el.locked });
        tryPlaySound('tap');
    };

    const execCommand = (e: React.MouseEvent, cmd: string, val?: string) => {
        e.preventDefault();
        document.execCommand(cmd, false, val);
    };

    // =====================================
    // RENDERERS
    // =====================================
    const renderConnections = () => {
        const isDark = document.documentElement.classList.contains('dark');
        const activeConns = [...visibleConnections];
        if (connectingFrom && tempArrowEnd) activeConns.push({ id: 'temp', from: connectingFrom, to: 'temp' });

        return activeConns.map(conn => {
            const fromEl = visibleElements.find(e => e.id === conn.from);
            const toEl = conn.to === 'temp'
                ? { x: tempArrowEnd!.x, y: tempArrowEnd!.y, w: 0, h: 0 } as any
                : visibleElements.find(e => e.id === conn.to);
            if (!fromEl || !toEl) return null;

            const w1 = typeof fromEl.w === 'number' ? fromEl.w : 150;
            const h1 = typeof fromEl.h === 'number' ? fromEl.h : 50;
            const w2 = typeof toEl.w === 'number' ? toEl.w : 150;
            const h2 = typeof toEl.h === 'number' ? toEl.h : 50;
            const x1 = fromEl.x + w1 / 2, y1 = fromEl.y + h1 / 2;
            const x2 = toEl.x + w2 / 2, y2 = toEl.y + h2 / 2;
            const d = `M ${x1} ${y1} C ${x1 + (x2 - x1) / 2} ${y1}, ${x1 + (x2 - x1) / 2} ${y2}, ${x2} ${y2}`;

            return (
                <g key={conn.id}>
                    <path d={d} fill="none" stroke={isDark ? '#6b7280' : '#9ca3af'} strokeWidth="2.5" strokeDasharray={conn.id === 'temp' ? '6,4' : 'none'} markerEnd="url(#arrowhead)" />
                    {conn.id !== 'temp' && activeTool === 'cursor' && (
                        <path d={d} fill="none" stroke="transparent" strokeWidth="20" className="cursor-pointer hover:stroke-rose-500/30" onClick={(e) => { e.stopPropagation(); setConnections(cs => { const next = cs.filter(c => c.id !== conn.id); pushHistory(elements, next); return next; }); tryPlaySound('close'); }} />
                    )}
                </g>
            );
        });
    };

    // Background grid style
    const getBackgroundStyle = () => {
        const isDark = document.documentElement.classList.contains('dark');
        const dotColor = isDark ? '#ffffff18' : '#00000018';
        const lineColor = isDark ? '#ffffff0e' : '#0000000e';
        if (gridMode === 'dots') return {
            backgroundImage: `radial-gradient(circle, ${dotColor} ${1.5 * camera.z}px, transparent ${1.5 * camera.z}px)`,
            backgroundSize: `${25 * camera.z}px ${25 * camera.z}px`,
            backgroundPosition: `${camera.x}px ${camera.y}px`,
        };
        if (gridMode === 'grid') return {
            backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
            backgroundSize: `${40 * camera.z}px ${40 * camera.z}px`,
            backgroundPosition: `${camera.x}px ${camera.y}px`,
        };
        return {};
    };

    const selectedEl = elements.find(e => e.id === selectedIds[0]);
    const isDark = document.documentElement.classList.contains('dark');

    // =====================================
    // MINIMAP
    // =====================================
    const minimapWidth = 180;
    const minimapHeight = 120;

    const renderMinimap = () => {
        if (!showMinimap || visibleElements.filter(e => e.type !== 'drawing').length === 0) return null;
        const nonDrawing = visibleElements.filter(e => e.type !== 'drawing');
        const minX = Math.min(...nonDrawing.map(e => e.x));
        const minY = Math.min(...nonDrawing.map(e => e.y));
        const maxX = Math.max(...nonDrawing.map(e => e.x + (typeof e.w === 'number' ? e.w : 200)));
        const maxY = Math.max(...nonDrawing.map(e => e.y + (typeof e.h === 'number' ? e.h : 100)));
        const worldW = Math.max(maxX - minX, 200);
        const worldH = Math.max(maxY - minY, 200);
        const scaleX = minimapWidth / worldW;
        const scaleY = minimapHeight / worldH;
        const scale = Math.min(scaleX, scaleY) * 0.85;

        const bounds = canvasRef.current?.getBoundingClientRect();
        const vpW = bounds ? bounds.width / camera.z : 800;
        const vpH = bounds ? bounds.height / camera.z : 600;
        const vpX = -camera.x / camera.z;
        const vpY = -camera.y / camera.z;

        const toMX = (x: number) => (x - minX) * scale + 8;
        const toMY = (y: number) => (y - minY) * scale + 8;

        const typeColor: Record<string, string> = {
            postit: '#fde68a', card: '#bfdbfe', task: '#a7f3d0', frame: '#e9d5ff',
            folder: '#c7d2fe', document: '#f4f4f5', text: '#d1fae5', link: '#fed7aa', image: '#fecdd3',
        };

        const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const worldX = (mx - 8) / scale + minX;
            const worldY = (my - 8) / scale + minY;
            const canvasBounds = canvasRef.current?.getBoundingClientRect();
            if (!canvasBounds) return;
            setCamera(c => ({
                ...c,
                x: canvasBounds.width / 2 - worldX * c.z,
                y: canvasBounds.height / 2 - worldY * c.z,
            }));
        };

        return (
            <div className="absolute bottom-20 right-5 z-40 bg-white/95 dark:bg-zinc-900/95 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md" style={{ width: minimapWidth + 16, height: minimapHeight + 16 }}>
                <svg width={minimapWidth + 16} height={minimapHeight + 16} className="cursor-pointer" onClick={handleMinimapClick}>
                    {nonDrawing.map(el => (
                        <rect
                            key={el.id}
                            x={toMX(el.x)}
                            y={toMY(el.y)}
                            width={Math.max(4, (typeof el.w === 'number' ? el.w : 200) * scale)}
                            height={Math.max(3, (typeof el.h === 'number' ? el.h : 100) * scale)}
                            rx={2}
                            fill={typeColor[el.type] || '#e5e7eb'}
                            opacity={0.8}
                        />
                    ))}
                    {/* Viewport rectangle */}
                    <rect
                        x={toMX(vpX)}
                        y={toMY(vpY)}
                        width={Math.max(10, vpW * scale)}
                        height={Math.max(8, vpH * scale)}
                        rx={2}
                        fill="transparent"
                        stroke="#6366f1"
                        strokeWidth={1.5}
                        strokeDasharray="3,2"
                    />
                </svg>
            </div>
        );
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-[#0a0a0c] font-sans flex flex-col" onClick={() => { if (contextMenu) setContextMenu(null); if (emojiPickerFor) setEmojiPickerFor(null); if (showExport) setShowExport(false); }}>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            {/* TOAST */}
            {toast && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[300] bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200">
                    {toast}
                </div>
            )}

            {/* TOP LEFT: status + breadcrumbs */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                    {isLoading ? <span className="text-gray-500 animate-pulse">Carregando...</span>
                        : saveStatus === 'saving' ? <span className="text-amber-500 animate-pulse">Salvando...</span>
                        : saveStatus === 'saved' ? <span className="text-emerald-500">✓ Salvo</span>
                        : <span className="text-gray-400">{visibleElements.filter(e => e.type !== 'drawing').length} elementos</span>}
                </div>

                <div className="flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md px-3 py-2 rounded-xl text-xs font-bold shadow-sm">
                    {activeBoard.map((board, ii) => (
                        <React.Fragment key={board.id}>
                            <button onClick={() => { setActiveBoard(prev => prev.slice(0, ii + 1)); resetCamera(); }} className={`hover:text-indigo-500 transition-colors ${ii === activeBoard.length - 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-zinc-500'}`}>
                                {board.name}
                            </button>
                            {ii < activeBoard.length - 1 && <ChevronRight size={12} className="text-gray-300 dark:text-zinc-700" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* TOP RIGHT: controls */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                {/* Undo/Redo */}
                <div className="flex items-center gap-0.5 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md p-1 rounded-xl shadow-sm">
                    <button onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)" className="p-2 rounded-lg transition-all ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Undo2 size={15} />
                    </button>
                    <button onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Y)" className="p-2 rounded-lg transition-all ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Redo2 size={15} />
                    </button>
                </div>

                {/* Grid toggle */}
                <button
                    onClick={() => setGridMode(m => m === 'dots' ? 'grid' : m === 'grid' ? 'none' : 'dots')}
                    title={`Grid: ${gridMode} (clique para alternar)`}
                    className={`p-2.5 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md rounded-xl shadow-sm ios-btn transition-all ${gridMode !== 'none' ? 'text-indigo-500' : 'text-gray-400'}`}
                >
                    <Grid size={15} />
                </button>

                {/* Snap to grid */}
                <button
                    onClick={() => { setSnapToGrid(s => !s); tryPlaySound('tap'); }}
                    title={`Snap ao grid: ${snapToGrid ? 'ativo' : 'inativo'}`}
                    className={`p-2.5 bg-white/90 dark:bg-zinc-900/90 border backdrop-blur-md rounded-xl shadow-sm ios-btn transition-all ${snapToGrid ? 'text-emerald-500 border-emerald-400 ring-2 ring-emerald-300/40' : 'border-gray-200 dark:border-zinc-800 text-gray-400'}`}
                >
                    <Magnet size={15} />
                </button>

                {/* Presentation mode */}
                <button
                    onClick={enterPresentation}
                    title="Modo Apresentação"
                    className="p-2.5 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md rounded-xl shadow-sm ios-btn transition-all text-gray-500 hover:text-indigo-600 hover:border-indigo-400"
                >
                    <Play size={15} />
                </button>

                {/* Export */}
                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowExport(s => !s); }}
                        title="Exportar"
                        className="p-2.5 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md rounded-xl shadow-sm ios-btn transition-all text-gray-500 hover:text-indigo-600 hover:border-indigo-400"
                    >
                        <Download size={15} />
                    </button>
                    {showExport && (
                        <div className="absolute right-0 top-full mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-1.5 min-w-[200px] z-[200] animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                            <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                                onClick={() => { window.print(); setShowExport(false); showToast('Abrindo diálogo de impressão (Ctrl+P)'); }}>
                                <Download size={12} /> Exportar como PDF
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                                onClick={() => { showToast('Use Ctrl+P e escolha "Salvar como PDF"'); setShowExport(false); }}>
                                <Download size={12} /> Dica de exportação
                            </button>
                        </div>
                    )}
                </div>

                {/* Minimap toggle */}
                <button
                    onClick={() => { setShowMinimap(s => !s); tryPlaySound('tap'); }}
                    title="Minimapa"
                    className={`p-2.5 bg-white/90 dark:bg-zinc-900/90 border backdrop-blur-md rounded-xl shadow-sm ios-btn transition-all ${showMinimap ? 'text-indigo-500 border-indigo-400' : 'border-gray-200 dark:border-zinc-800 text-gray-400'}`}
                >
                    <Map size={15} />
                </button>
            </div>

            {/* PEN HUD */}
            {activeTool === 'pen' && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-in slide-in-from-top-2">
                    {['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#000000', '#ffffff'].map((c, i) => (
                        <button key={i} onClick={() => setPenSettings(p => ({ ...p, color: c }))}
                            className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 ios-btn transition-transform ${penSettings.color === c ? 'scale-125 ring-2 ring-offset-1 ring-indigo-500' : 'hover:scale-110'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-1" />
                    <span className="text-[10px] font-bold text-gray-400 w-5 text-center">{penSettings.thickness}</span>
                    <input type="range" min="1" max="20" value={penSettings.thickness} onChange={(e) => setPenSettings(p => ({ ...p, thickness: parseInt(e.target.value) }))} className="w-20" />
                </div>
            )}

            {/* SELECTION HUD */}
            {selectedIds.length > 0 && activeTool === 'cursor' && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-in slide-in-from-top-2 flex-wrap max-w-[90vw]">
                    {/* Post-it colors */}
                    {selectedEl?.type === 'postit' && (
                        <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-800">
                            {COLORS.map((c, i) => (
                                <button key={i} onClick={() => updateElement(selectedIds[0], { color: c })}
                                    className={`w-5 h-5 rounded-full border-2 ios-btn transition-transform hover:scale-110 ${selectedEl.color === c ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: COLOR_HEX[c] || '#fff' }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Frame colors */}
                    {selectedEl?.type === 'frame' && (
                        <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-800" title="Cor do frame">
                            {FRAME_COLORS.map((fc, i) => (
                                <button key={i} onClick={() => updateElement(selectedIds[0], { color: fc.border === '#9ca3af' ? undefined : fc.border })}
                                    className="w-5 h-5 rounded-full border-2 ios-btn transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: fc.bg === 'transparent' ? '#f9fafb' : fc.bg,
                                        borderColor: fc.border,
                                        outline: selectedEl.color === fc.border || (!selectedEl.color && fc.border === '#9ca3af') ? '2px solid #6366f1' : 'none',
                                        outlineOffset: '1px',
                                    }}
                                    title={fc.label}
                                />
                            ))}
                        </div>
                    )}

                    {/* Count badge */}
                    {selectedIds.length > 1 && (
                        <span className="text-[10px] font-black text-gray-400 px-2">{selectedIds.length} selecionados</span>
                    )}

                    {/* Lock/Unlock */}
                    {selectedIds.length === 1 && (
                        <button
                            onClick={() => toggleLock(selectedIds[0])}
                            title={selectedEl?.locked ? 'Desbloquear' : 'Bloquear'}
                            className={`p-2 rounded-xl ios-btn ${selectedEl?.locked ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`}
                        >
                            {selectedEl?.locked ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                    )}

                    {/* Duplicate */}
                    <button onClick={duplicateSelection} title="Duplicar (Ctrl+D)" className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl ios-btn">
                        <Copy size={15} />
                    </button>

                    {/* Bring to front */}
                    <button onClick={bringToFront} title="Trazer à frente" className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl ios-btn">
                        <ArrowUp size={15} />
                    </button>

                    {/* Send to back */}
                    <button onClick={sendToBack} title="Enviar atrás" className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl ios-btn">
                        <ArrowDown size={15} />
                    </button>

                    {/* Enter folder */}
                    {selectedEl?.type === 'folder' && (
                        <button onClick={() => { if (selectedEl) { setActiveBoard(prev => [...prev, { id: selectedEl.id, name: selectedEl.title || 'Pasta' }]); resetCamera(); setSelectedIds([]); } }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl font-bold flex gap-1.5 items-center text-xs border-l border-gray-200 dark:border-zinc-800 pl-3 ml-1 ios-btn">
                            Abrir <ChevronRight size={12} />
                        </button>
                    )}

                    <div className="w-px h-5 bg-gray-200 dark:bg-zinc-800 mx-1" />

                    {/* Delete */}
                    <button onClick={deleteSelectionFn} title="Excluir (Delete)" className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl ios-btn">
                        <Trash2 size={15} />
                    </button>
                </div>
            )}

            {/* MAIN TOOLBAR */}
            <div className={`absolute z-40 bg-white/95 dark:bg-[#111114]/95 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 shadow-2xl transition-all
                ${isMobile
                    ? 'bottom-6 left-4 right-4 rounded-2xl p-2'
                    : 'left-5 top-1/2 -translate-y-1/2 p-2 rounded-2xl'}`}
            >
                <div className={`flex ${isMobile ? 'flex-row gap-0.5 overflow-x-auto no-scrollbar' : 'flex-col gap-0.5'}`}>
                    {/* Section: Navigation */}
                    {!isMobile && <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 dark:text-zinc-600 px-2 py-1">Nav</p>}
                    <ToolBtn active={activeTool === 'cursor'} onClick={() => { setActiveTool('cursor'); tryPlaySound('tap'); }} title="Cursor (V)" color="purple"><MousePointer2 size={16} /></ToolBtn>
                    <ToolBtn active={activeTool === 'pan'} onClick={() => { setActiveTool('pan'); setSelectedIds([]); tryPlaySound('tap'); }} title="Pan (H / Espaço)" color="purple"><Hand size={16} /></ToolBtn>

                    <Divider isMobile={isMobile} />

                    {/* Section: Draw */}
                    {!isMobile && <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 dark:text-zinc-600 px-2 py-1">Desenho</p>}
                    <ToolBtn active={activeTool === 'connect'} onClick={() => { setActiveTool('connect'); setSelectedIds([]); tryPlaySound('tap'); }} title="Conectar (C)" color="emerald"><ArrowUpRight size={16} /></ToolBtn>
                    <ToolBtn active={activeTool === 'pen'} onClick={() => { setActiveTool('pen'); setSelectedIds([]); tryPlaySound('tap'); }} title="Caneta (P)" color="purple"><PenTool size={16} /></ToolBtn>
                    <ToolBtn active={activeTool === 'eraser'} onClick={() => { setActiveTool('eraser'); setSelectedIds([]); tryPlaySound('tap'); }} title="Borracha (E)" color="rose"><Eraser size={16} /></ToolBtn>

                    <Divider isMobile={isMobile} />

                    {/* Section: Add */}
                    {!isMobile && <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 dark:text-zinc-600 px-2 py-1">Adicionar</p>}
                    <ToolBtn onClick={() => createElement('postit')} title="Post-it"><StickyNote size={16} /></ToolBtn>
                    <ToolBtn onClick={() => createElement('task')} title="Checklist"><CheckSquare size={16} /></ToolBtn>
                    <ToolBtn onClick={() => createElement('text')} title="Texto"><Type size={16} /></ToolBtn>
                    <ToolBtn onClick={() => createElement('card')} title="Cartão"><Layers size={16} /></ToolBtn>
                    <ToolBtn onClick={() => fileInputRef.current?.click()} title="Imagem"><ImageIcon size={16} /></ToolBtn>
                    <ToolBtn onClick={addLink} title="Link"><Link2 size={16} /></ToolBtn>
                    <ToolBtn onClick={() => createElement('document')} title="Documento"><FileText size={16} /></ToolBtn>

                    <Divider isMobile={isMobile} />

                    {/* Section: Structure */}
                    {!isMobile && <p className="text-[8px] font-black uppercase tracking-widest text-gray-300 dark:text-zinc-600 px-2 py-1">Estrutura</p>}
                    <ToolBtn onClick={() => createElement('folder')} title="Pasta (sub-board)"><Folder size={16} /></ToolBtn>
                    <ToolBtn onClick={() => createElement('frame')} title="Frame / Zona"><Square size={16} /></ToolBtn>

                    <Divider isMobile={isMobile} />

                    {/* Templates */}
                    <ToolBtn onClick={() => { setShowTemplates(true); tryPlaySound('tap'); }} title="Templates" active={showTemplates}>
                        <span className="text-base leading-none">✨</span>
                    </ToolBtn>
                </div>
            </div>

            {/* ZOOM CONTROLS */}
            <div className={`absolute ${isMobile ? 'right-4 top-16' : 'right-5 bottom-5'} z-40 flex ${isMobile ? 'flex-col' : 'flex-row'} items-center gap-0.5 p-1 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg`}>
                <button onClick={zoomOut} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg ios-btn" title="Zoom - (-)"><ZoomOut size={14} /></button>
                {!isMobile && <span className="text-[10px] font-black text-gray-600 dark:text-zinc-400 w-10 text-center font-mono">{Math.round(camera.z * 100)}%</span>}
                <button onClick={zoomIn} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg ios-btn" title="Zoom + (+)"><ZoomIn size={14} /></button>
                <div className={`${isMobile ? 'h-px w-4' : 'w-px h-4'} bg-gray-200 dark:bg-zinc-700`} />
                <button onClick={resetCamera} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg ios-btn" title="Centralizar (0)"><Maximize size={14} /></button>
            </div>

            {/* CONTEXT MENU */}
            {contextMenu && (
                <div
                    className="fixed z-[200] bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl py-1.5 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
                    style={{ left: Math.min(contextMenu.x, window.innerWidth - 200), top: Math.min(contextMenu.y, window.innerHeight - 300) }}
                    onClick={e => e.stopPropagation()}
                >
                    {contextMenu.elementId ? (
                        <>
                            <CtxItem icon={<Copy size={13} />} label="Duplicar" shortcut="Ctrl+D" onClick={() => { duplicateSelection(); setContextMenu(null); }} />
                            <CtxItem icon={<ArrowUp size={13} />} label="Trazer à frente" onClick={() => { bringToFront(); setContextMenu(null); }} />
                            <CtxItem icon={<ArrowDown size={13} />} label="Enviar atrás" onClick={() => { sendToBack(); setContextMenu(null); }} />
                            {(() => {
                                const cEl = elements.find(e => e.id === contextMenu.elementId);
                                return <CtxItem icon={cEl?.locked ? <Unlock size={13} /> : <Lock size={13} />} label={cEl?.locked ? 'Desbloquear' : 'Bloquear'} onClick={() => { if (contextMenu.elementId) toggleLock(contextMenu.elementId); setContextMenu(null); }} />;
                            })()}
                            <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1" />
                            <CtxItem icon={<Trash2 size={13} />} label="Excluir" shortcut="Del" onClick={() => { deleteSelectionFn(); setContextMenu(null); }} danger />
                        </>
                    ) : (
                        <>
                            <p className="px-4 py-1 text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-zinc-600">Adicionar elemento</p>
                            <CtxItem icon={<StickyNote size={13} />} label="Post-it" onClick={() => { createElement('postit', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }} />
                            <CtxItem icon={<Type size={13} />} label="Texto" onClick={() => { createElement('text', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }} />
                            <CtxItem icon={<CheckSquare size={13} />} label="Checklist" onClick={() => { createElement('task', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }} />
                            <CtxItem icon={<Layers size={13} />} label="Cartão" onClick={() => { createElement('card', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }} />
                            <CtxItem icon={<Square size={13} />} label="Frame" onClick={() => { createElement('frame', contextMenu.canvasX, contextMenu.canvasY); setContextMenu(null); }} />
                            <div className="h-px bg-gray-100 dark:bg-zinc-800 my-1" />
                            <CtxItem icon={<Undo2 size={13} />} label="Desfazer" shortcut="Ctrl+Z" onClick={() => { undo(); setContextMenu(null); }} />
                            <CtxItem icon={<Redo2 size={13} />} label="Refazer" shortcut="Ctrl+Y" onClick={() => { redo(); setContextMenu(null); }} />
                        </>
                    )}
                </div>
            )}

            {/* MINIMAP */}
            {renderMinimap()}

            {/* MAIN CANVAS */}
            <div
                ref={canvasRef}
                className={`w-full flex-1 overflow-hidden touch-none select-none ${
                    activeTool === 'pan' || isPanning ? 'cursor-grabbing'
                    : activeTool === 'connect' ? 'cursor-crosshair'
                    : activeTool === 'pen' ? 'cursor-crosshair'
                    : activeTool === 'eraser' ? 'cursor-cell'
                    : 'cursor-default'
                }`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                onContextMenu={(e) => handleContextMenu(e)}
                style={getBackgroundStyle()}
            >
                <div
                    className="absolute inset-0 origin-top-left"
                    style={{
                        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
                        transition: presentTransition ? 'transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)' : 'none',
                    }}
                >
                    {/* SVG LAYER: connections + drawings */}
                    <svg className="absolute pointer-events-none z-0" style={{ top: 0, left: 0, width: 1, height: 1, overflow: 'visible' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                                <polygon points="0 0, 8 3, 0 6" fill={isDark ? '#6b7280' : '#9ca3af'} />
                            </marker>
                        </defs>
                        {renderConnections()}

                        {currentDrawPath && (
                            <path d={currentDrawPath} fill="none" stroke={penSettings.color} strokeWidth={penSettings.thickness} strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {visibleElements.filter(e => e.type === 'drawing').map(el => (
                            <path
                                key={el.id}
                                d={el.path!}
                                fill="none"
                                stroke={el.color || '#000'}
                                strokeWidth={el.thickness || 3}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                onClick={(e) => { if (activeTool === 'eraser') { e.stopPropagation(); deleteElementFn(el.id); } }}
                                style={{ pointerEvents: activeTool === 'eraser' ? 'stroke' : 'none', cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}
                                className={activeTool === 'eraser' ? 'hover:opacity-40 transition-opacity' : ''}
                            />
                        ))}
                    </svg>

                    {/* ELEMENT NODES */}
                    {[...visibleElements].sort((a, b) => a.type === 'frame' ? -1 : 1).map((el) => {
                        if (el.type === 'drawing') return null;

                        const isSelected = selectedIds.includes(el.id);
                        const baseClasses = `absolute origin-top-left group ${
                            isSelected && activeTool === 'cursor'
                                ? 'ring-2 ring-indigo-500 shadow-2xl z-20'
                                : el.type === 'frame' ? 'z-0' : 'shadow-xl z-10'
                        }`;

                        const ResizeHandle = () => isSelected && activeTool === 'cursor' && !el.locked ? (
                            <div
                                onPointerDown={(e) => handleResizeStart(e, el)}
                                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 pointer-events-auto shadow-sm"
                            />
                        ) : null;

                        // Lock badge
                        const LockBadge = () => el.locked ? (
                            <div className="absolute top-1 right-1 z-30 bg-amber-400 text-white rounded-full w-5 h-5 flex items-center justify-center shadow pointer-events-none">
                                <Lock size={10} />
                            </div>
                        ) : null;

                        // POST-IT (redesigned)
                        if (el.type === 'postit') {
                            const topColor = POSTIT_TOP_COLOR[el.color || COLORS[0]] || '#f59e0b';
                            return (
                                <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto`}
                                    style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
                                    onPointerDown={(e) => handlePointerDown(e, el.id)}
                                    onContextMenu={(e) => handleContextMenu(e, el.id)}
                                >
                                    <ResizeHandle />
                                    <LockBadge />
                                    <div className={`w-full h-full flex flex-col shadow-md relative overflow-hidden transition-colors rounded-2xl ${el.color || COLORS[0]}`}>
                                        {/* Colored top strip */}
                                        <div className="h-2 w-full shrink-0 rounded-t-2xl" style={{ backgroundColor: topColor }} />
                                        {/* Emoji button top-right */}
                                        <div className="absolute top-3 right-2 z-10 no-drag">
                                            <button
                                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/10 transition-opacity opacity-0 group-hover:opacity-100 text-sm"
                                                onClick={(e) => { e.stopPropagation(); setEmojiPickerFor(emojiPickerFor === el.id ? null : el.id); }}
                                            >
                                                <Smile size={13} />
                                            </button>
                                            {emojiPickerFor === el.id && (
                                                <div className="absolute right-0 top-7 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-xl p-2 flex gap-1 z-50 animate-in fade-in zoom-in-95 duration-100" onClick={e => e.stopPropagation()}>
                                                    {EMOJI_LIST.map(em => (
                                                        <button key={em} className="text-base hover:scale-125 transition-transform ios-btn"
                                                            onClick={() => { updateElement(el.id, { content: el.content + em }); setEmojiPickerFor(null); }}>
                                                            {em}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <textarea
                                            value={el.content}
                                            onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                            onBlur={() => pushHistory(elements, connections)}
                                            className="no-drag flex-1 p-4 pt-2 bg-transparent resize-none outline-none text-sm font-medium leading-relaxed custom-scrollbar"
                                            style={{ color: 'inherit' }}
                                        />
                                    </div>
                                </div>
                            );
                        }

                        // TEXT
                        if (el.type === 'text') return (
                            <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto`}
                                style={{ left: el.x, top: el.y, minWidth: 150 }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onContextMenu={(e) => handleContextMenu(e, el.id)}
                            >
                                <LockBadge />
                                <textarea
                                    value={el.content}
                                    onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                    onBlur={() => pushHistory(elements, connections)}
                                    rows={1}
                                    className="no-drag w-full bg-transparent border-none resize-none outline-none whitespace-pre-wrap overflow-hidden p-3 font-black text-2xl text-gray-900 dark:text-white"
                                    onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                                />
                            </div>
                        );

                        // FOLDER
                        if (el.type === 'folder') return (
                            <div key={el.id}
                                className={`${baseClasses} touch-none pointer-events-auto rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center gap-3 cursor-pointer`}
                                style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
                                onDoubleClick={() => { setActiveBoard(prev => [...prev, { id: el.id, name: el.title || 'Pasta' }]); resetCamera(); }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onContextMenu={(e) => handleContextMenu(e, el.id)}
                            >
                                <Folder className="text-indigo-500 w-8 h-8 pointer-events-none" />
                                <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })} onBlur={() => pushHistory(elements, connections)}
                                    className="no-drag font-semibold text-gray-900 dark:text-white bg-transparent outline-none w-2/3 truncate"
                                    onClick={e => e.stopPropagation()} placeholder="Pasta"
                                />
                                <LockBadge />
                                <ResizeHandle />
                            </div>
                        );

                        // FRAME (with color support)
                        if (el.type === 'frame') {
                            const frameBg = el.color ? el.color + '18' : 'transparent';
                            const frameBorder = el.color || undefined;
                            return (
                                <div key={el.id}
                                    className={`${baseClasses} pointer-events-none border-2 border-dashed rounded-3xl`}
                                    style={{
                                        left: el.x, top: el.y, width: el.w, height: el.h,
                                        backgroundColor: frameBg,
                                        borderColor: frameBorder || (isDark ? 'rgba(113,113,122,0.6)' : 'rgba(156,163,175,0.4)'),
                                    }}
                                >
                                    <div
                                        className="absolute top-0 left-0 backdrop-blur-sm px-4 py-2 rounded-br-2xl rounded-tl-2xl pointer-events-auto cursor-grab active:cursor-grabbing border-b border-r"
                                        style={{
                                            backgroundColor: el.color ? el.color + '30' : (isDark ? 'rgba(39,39,42,0.8)' : 'rgba(243,244,246,0.8)'),
                                            borderColor: el.color ? el.color + '40' : (isDark ? 'rgba(63,63,70,0.5)' : 'rgba(229,231,235,0.5)'),
                                        }}
                                        onPointerDown={(e) => handlePointerDown(e, el.id)}
                                        onContextMenu={(e) => handleContextMenu(e, el.id)}
                                    >
                                        <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })} onBlur={() => pushHistory(elements, connections)}
                                            className="bg-transparent outline-none w-32 text-xs font-black text-gray-600 dark:text-gray-300 no-drag uppercase tracking-widest"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                    <LockBadge />
                                    <ResizeHandle />
                                </div>
                            );
                        }

                        // DOCUMENT
                        if (el.type === 'document') return (
                            <div key={el.id}
                                className={`${baseClasses} touch-none pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col shadow-xl overflow-hidden`}
                                style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onContextMenu={(e) => handleContextMenu(e, el.id)}
                            >
                                {isSelected && activeTool === 'cursor' && (
                                    <div className="absolute -top-12 left-0 right-0 flex justify-center no-drag z-50">
                                        <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl rounded-xl flex items-center p-1 gap-0.5 text-gray-700 dark:text-gray-200 text-xs">
                                            {[['bold','B','font-bold'],['italic','I','italic'],['underline','U','underline']].map(([cmd,label,cls]) => (
                                                <button key={cmd} onClick={(e) => execCommand(e, cmd)} className={`px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded ${cls}`}>{label}</button>
                                            ))}
                                            <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-1" />
                                            <button onClick={(e) => execCommand(e, 'formatBlock', 'H1')} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded font-bold text-[11px]">H1</button>
                                            <button onClick={(e) => execCommand(e, 'formatBlock', 'H2')} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded font-bold text-[11px]">H2</button>
                                            <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-1" />
                                            <button onClick={(e) => execCommand(e, 'insertUnorderedList')} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">•</button>
                                            <button onClick={(e) => execCommand(e, 'insertOrderedList')} className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">1.</button>
                                        </div>
                                    </div>
                                )}
                                <div className="w-full h-8 bg-gray-50 dark:bg-black/30 border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 shrink-0 cursor-grab">
                                    <FileText size={12} className="text-gray-400 mr-2" />
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documento</span>
                                </div>
                                <div className="flex-1 p-5 overflow-y-auto custom-scrollbar no-drag bg-white dark:bg-zinc-900">
                                    <div contentEditable suppressContentEditableWarning
                                        onBlur={(e) => { updateElement(el.id, { htmlContent: e.currentTarget.innerHTML }); pushHistory(elements, connections); }}
                                        className="w-full h-full outline-none prose dark:prose-invert max-w-none text-sm"
                                        dangerouslySetInnerHTML={{ __html: el.htmlContent || '' }}
                                    />
                                </div>
                                <LockBadge />
                                <ResizeHandle />
                            </div>
                        );

                        // TASK (Checklist)
                        if (el.type === 'task') return (
                            <div key={el.id}
                                className={`${baseClasses} touch-none pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col shadow-xl overflow-hidden p-4`}
                                style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onContextMenu={(e) => handleContextMenu(e, el.id)}
                            >
                                <LockBadge />
                                <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })}
                                    className="no-drag font-black text-gray-900 dark:text-white bg-transparent outline-none mb-3 text-sm uppercase tracking-wide" placeholder="Checklist"
                                />
                                <div className="flex-1 overflow-y-auto no-drag custom-scrollbar pr-1 flex flex-col gap-1.5">
                                    {el.tasks?.map((tsk, i) => (
                                        <div key={tsk.id} className="flex items-center gap-2 group/task">
                                            <input type="checkbox" checked={tsk.done} onChange={(e) => {
                                                const nt = [...(el.tasks || [])];
                                                nt[i] = { ...nt[i], done: e.target.checked };
                                                updateElement(el.id, { tasks: nt });
                                                tryPlaySound('tap');
                                            }} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0" />
                                            <input value={tsk.text} onChange={(e) => {
                                                const nt = [...(el.tasks || [])];
                                                nt[i] = { ...nt[i], text: e.target.value };
                                                updateElement(el.id, { tasks: nt });
                                            }} className={`bg-transparent outline-none flex-1 text-sm no-drag ${tsk.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`} />
                                            <button onClick={() => { updateElement(el.id, { tasks: (el.tasks || []).filter((_, j) => j !== i) }); tryPlaySound('close'); }} className="opacity-0 group-hover/task:opacity-100 text-gray-300 hover:text-rose-500 ios-btn transition-all no-drag">
                                                <Trash2 size={11} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={() => { updateElement(el.id, { tasks: [...(el.tasks || []), { id: generateId(), text: 'Nova tarefa', done: false }] }); tryPlaySound('success'); }}
                                    className="no-drag mt-3 text-xs text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-1 justify-center py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl ios-btn"
                                >
                                    <Plus size={12} /> Adicionar
                                </button>
                                <ResizeHandle />
                            </div>
                        );

                        // CARD & IMAGE
                        if (el.type === 'card' || el.type === 'image') return (
                            <div key={el.id}
                                className={`${baseClasses} touch-none pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col shadow-xl overflow-hidden`}
                                style={{ left: el.x, top: el.y, width: el.w, minHeight: 120 }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onContextMenu={(e) => handleContextMenu(e, el.id)}
                            >
                                <LockBadge />
                                {el.imageSrc && <img src={el.imageSrc} alt="Preview" className="w-full h-36 object-cover pointer-events-none" />}
                                <div className="p-4 flex flex-col gap-2 flex-1">
                                    <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })}
                                        placeholder="Título" className="no-drag w-full font-bold text-sm text-gray-900 dark:text-white bg-transparent outline-none"
                                    />
                                    <textarea value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                        placeholder="Detalhes..." className="no-drag w-full flex-1 min-h-[40px] text-xs text-gray-500 dark:text-zinc-400 bg-transparent resize-none outline-none custom-scrollbar"
                                    />
                                </div>
                                <ResizeHandle />
                            </div>
                        );

                        // LINK
                        if (el.type === 'link') return (
                            <div key={el.id}
                                className={`${baseClasses} touch-none pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 flex gap-3 min-w-[260px] items-center`}
                                style={{ left: el.x, top: el.y }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onContextMenu={(e) => handleContextMenu(e, el.id)}
                            >
                                <LockBadge />
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                                    <Link2 size={16} className="text-indigo-500" />
                                </div>
                                <div className="flex flex-col flex-1 overflow-hidden gap-0.5">
                                    <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })}
                                        className="no-drag font-bold text-sm text-gray-900 dark:text-white bg-transparent outline-none w-full" placeholder="Título"
                                    />
                                    <a href={el.content || el.url} target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] text-indigo-500 hover:underline truncate no-drag"
                                        onPointerDown={e => e.stopPropagation()}
                                    >
                                        {el.content || el.url}
                                    </a>
                                </div>
                            </div>
                        );

                        return null;
                    })}
                </div>
            </div>

            {/* ─── TEMPLATES MODAL ─────────────────────────────────────── */}
            {showTemplates && createPortal(
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4" onClick={() => setShowTemplates(false)}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div
                        className="relative z-10 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-800">
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">Templates</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Escolha um ponto de partida para o seu board</p>
                            </div>
                            <button onClick={() => setShowTemplates(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl ios-btn">
                                <XIcon size={16} />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 custom-scrollbar">
                            {TEMPLATES.map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={() => applyTemplate(tpl)}
                                    className="text-left p-5 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all group ios-btn"
                                >
                                    <div className="text-3xl mb-3">{tpl.icon}</div>
                                    <div className="font-black text-sm text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{tpl.name}</div>
                                    <div className="text-xs text-gray-400 mt-1 leading-relaxed">{tpl.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ─── PRESENTATION MODE OVERLAY ───────────────────────────── */}
            {presentationMode && createPortal(
                <div className="fixed inset-0 z-[600] pointer-events-none">
                    {/* Dark vignette border */}
                    <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.4)' }} />

                    {/* Top bar */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4 pointer-events-auto bg-gradient-to-b from-black/40 to-transparent">
                        <div className="text-white font-black text-sm opacity-80">
                            {frames[presentationIndex]?.title || `Slide ${presentationIndex + 1}`}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-white/60 text-xs font-bold">{presentationIndex + 1} / {frames.length}</span>
                            <button
                                onClick={exitPresentation}
                                className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all ios-btn"
                                title="Sair (Esc)"
                            >
                                <XIcon size={16} />
                            </button>
                        </div>
                    </div>

                    {/* No frames message */}
                    {frames.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                            <div className="text-center text-white">
                                <p className="text-2xl font-black mb-2">Nenhum frame encontrado</p>
                                <p className="text-white/60 text-sm">Adicione frames ao board para usar o modo apresentação</p>
                                <button onClick={exitPresentation} className="mt-6 px-6 py-3 bg-white/20 hover:bg-white/30 rounded-2xl font-bold text-sm transition-all ios-btn">
                                    Fechar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    {frames.length > 0 && (
                        <>
                            <button
                                onClick={prevSlide}
                                disabled={presentationIndex === 0}
                                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto p-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl backdrop-blur-sm transition-all ios-btn disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                onClick={nextSlide}
                                disabled={presentationIndex === frames.length - 1}
                                className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto p-3 bg-white/20 hover:bg-white/30 text-white rounded-2xl backdrop-blur-sm transition-all ios-btn disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={20} />
                            </button>

                            {/* Slide dots */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-2">
                                {frames.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setPresentationIndex(i); navigateToFrame(i); }}
                                        className={`w-2 h-2 rounded-full transition-all ios-btn ${i === presentationIndex ? 'bg-white w-6' : 'bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ToolBtn({ children, active, onClick, title, color }: {
    children: React.ReactNode;
    active?: boolean;
    onClick: () => void;
    title?: string;
    color?: 'purple' | 'emerald' | 'rose';
}) {
    const activeColor = color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : 'bg-indigo-600';
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-2.5 rounded-xl transition-all ios-btn shrink-0 ${
                active
                    ? `${activeColor} text-white shadow-lg`
                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

function Divider({ isMobile }: { isMobile: boolean }) {
    return <div className={`${isMobile ? 'w-px h-6 mx-1' : 'h-px w-full my-1'} bg-gray-100 dark:bg-zinc-800 shrink-0`} />;
}

function CtxItem({ icon, label, shortcut, onClick, danger }: {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    onClick: () => void;
    danger?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold transition-colors text-left ${
                danger
                    ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'
            }`}
        >
            <span className="w-4 flex items-center justify-center">{icon}</span>
            <span className="flex-1">{label}</span>
            {shortcut && <span className="text-[9px] font-black text-gray-300 dark:text-zinc-600 uppercase tracking-wider">{shortcut}</span>}
        </button>
    );
}
