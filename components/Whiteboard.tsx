import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DatabaseService } from '../DatabaseService';
import { WhiteboardElement, WhiteboardConnection } from '../types';
import {
    MousePointer2, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, Maximize,
    Type, StickyNote, Link2, Plus, ArrowUpRight,
    Hand, PenTool, Eraser, CheckSquare, Folder, Square, FileText, ChevronRight,
    Copy, Layers, ArrowUp, ArrowDown, Grid, Undo2, Redo2, Lock, Unlock
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
        // Discard any forward history
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

    // Context Menu
    const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

    // Play UI Sound
    const tryPlaySound = useCallback((type: 'tap' | 'close' | 'success') => {
        try {
            if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
        } catch (e) { /* silent */ }
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
    // KEYBOARD SHORTCUTS
    // =====================================
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Don't intercept when editing text
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                if (e.key === 'Escape') { target.blur(); setSelectedIds([]); }
                return;
            }

            // Undo / Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

            // Select all
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                setSelectedIds(visibleElements.filter(el => el.type !== 'frame').map(el => el.id));
                return;
            }

            // Duplicate
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                if (selectedIds.length > 0) duplicateSelection();
                return;
            }

            // Delete selection
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
                e.preventDefault();
                deleteSelectionFn();
                return;
            }

            // Escape
            if (e.key === 'Escape') { setSelectedIds([]); setConnectingFrom(null); setContextMenu(null); return; }

            // Tool shortcuts (when nothing is focused)
            if (e.key === 'v' || e.key === 'V') setActiveTool('cursor');
            if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
            if (e.key === 'c' || e.key === 'C') setActiveTool('connect');
            if (e.key === 'p' || e.key === 'P') setActiveTool('pen');
            if (e.key === 'e' || e.key === 'E') setActiveTool('eraser');

            // Zoom
            if (e.key === '+' || e.key === '=') zoomIn();
            if (e.key === '-') zoomOut();
            if (e.key === '0') resetCamera();

            // Arrow nudge selected elements
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
    }, [selectedIds, visibleElements, connections, undo, redo, pushHistory]);

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
            newEl.color = COLORS[Math.floor(Math.random() * 3)]; // amber/rose/blue randomly
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
    }, [currentBoardId, camera, activeTool, connections, pushHistory, tryPlaySound]);

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
            setElements(els => els.map(el => el.id === isResizing
                ? { ...el, w: Math.max(100, resizeInfo.initialW + dx), h: Math.max(50, resizeInfo.initialH + dy) }
                : el
            ));
            return;
        }

        if (isDragging && dragInfo) {
            const dx = x - dragInfo.startX;
            const dy = y - dragInfo.startY;
            setElements(els => els.map(el => {
                const initial = dragInfo.initialElements.find(i => i.id === el.id);
                return initial ? { ...el, x: initial.initialX + dx, y: initial.initialY + dy } : el;
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
            // Push history after drag ends
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

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-[#0a0a0c] font-sans flex flex-col" onClick={() => { if (contextMenu) setContextMenu(null); }}>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

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

            {/* TOP RIGHT: undo/redo + grid toggle */}
            <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                <div className="flex items-center gap-0.5 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md p-1 rounded-xl shadow-sm">
                    <button onClick={undo} disabled={!canUndo} title="Desfazer (Ctrl+Z)" className="p-2 rounded-lg transition-all ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Undo2 size={15} />
                    </button>
                    <button onClick={redo} disabled={!canRedo} title="Refazer (Ctrl+Y)" className="p-2 rounded-lg transition-all ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-30 disabled:cursor-not-allowed">
                        <Redo2 size={15} />
                    </button>
                </div>
                <button
                    onClick={() => setGridMode(m => m === 'dots' ? 'grid' : m === 'grid' ? 'none' : 'dots')}
                    title={`Grid: ${gridMode} (clique para alternar)`}
                    className={`p-2.5 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md rounded-xl shadow-sm ios-btn transition-all ${gridMode !== 'none' ? 'text-indigo-500' : 'text-gray-400'}`}
                >
                    <Grid size={15} />
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
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-in slide-in-from-top-2">
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

                    {/* Count badge */}
                    {selectedIds.length > 1 && (
                        <span className="text-[10px] font-black text-gray-400 px-2">{selectedIds.length} selecionados</span>
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
                <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})` }}>

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

                        const ResizeHandle = () => isSelected && activeTool === 'cursor' ? (
                            <div
                                onPointerDown={(e) => handleResizeStart(e, el)}
                                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 pointer-events-auto shadow-sm"
                            />
                        ) : null;

                        // POST-IT
                        if (el.type === 'postit') return (
                            <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto`}
                                style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onContextMenu={(e) => handleContextMenu(e, el.id)}
                            >
                                <ResizeHandle />
                                <div className={`w-full h-full p-5 shadow-md relative overflow-hidden transition-colors rounded-sm ${el.color || COLORS[0]}`}>
                                    <div className="absolute top-0 left-0 w-full h-2 bg-black/10" />
                                    <textarea
                                        value={el.content}
                                        onChange={(e) => updateElement(el.id, { content: e.target.value })}
                                        onBlur={() => pushHistory(elements, connections)}
                                        className="no-drag w-full h-full bg-transparent resize-none outline-none text-sm font-medium leading-relaxed custom-scrollbar"
                                        style={{ color: 'inherit' }}
                                    />
                                </div>
                            </div>
                        );

                        // TEXT
                        if (el.type === 'text') return (
                            <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto`}
                                style={{ left: el.x, top: el.y, minWidth: 150 }}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onContextMenu={(e) => handleContextMenu(e, el.id)}
                            >
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
                                <ResizeHandle />
                            </div>
                        );

                        // FRAME
                        if (el.type === 'frame') return (
                            <div key={el.id}
                                className={`${baseClasses} bg-transparent pointer-events-none border-2 border-dashed border-gray-400/40 dark:border-zinc-600/60 rounded-3xl`}
                                style={{ left: el.x, top: el.y, width: el.w, height: el.h }}
                            >
                                <div
                                    className="absolute top-0 left-0 bg-gray-100/80 dark:bg-zinc-800/80 backdrop-blur-sm px-4 py-2 rounded-br-2xl rounded-tl-2xl pointer-events-auto cursor-grab active:cursor-grabbing border-b border-r border-gray-200/50 dark:border-zinc-700/50"
                                    onPointerDown={(e) => handlePointerDown(e, el.id)}
                                    onContextMenu={(e) => handleContextMenu(e, el.id)}
                                >
                                    <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })} onBlur={() => pushHistory(elements, connections)}
                                        className="bg-transparent outline-none w-32 text-xs font-black text-gray-600 dark:text-gray-300 no-drag uppercase tracking-widest"
                                        onClick={e => e.stopPropagation()}
                                    />
                                </div>
                                <ResizeHandle />
                            </div>
                        );

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
