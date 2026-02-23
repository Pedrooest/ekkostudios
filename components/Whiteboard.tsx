import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MousePointer2, Hand, StickyNote, Type, Square, Circle,
    Image as ImageIcon, Trash2, Plus, ZoomIn, ZoomOut, Maximize, Palette,
    Pencil, Eraser, Undo2, Redo2, FileText, X, ChevronDown,
    Bold, Italic, Strikethrough, List, ListOrdered, Indent, Outdent, Link2, MessageSquare, MoreHorizontal, AlignLeft,
    Highlighter, ArrowUpRight, FolderOpen, ArrowLeft,
    Columns, ListTodo, CheckSquare, Globe, Lock, Unlock, LayoutTemplate, Map, LayoutGrid
} from 'lucide-react';

const tryPlaySound = (type: 'tap' | 'open' | 'close' | 'success') => {
    if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
};

const COLORS = [
    'bg-amber-200 text-amber-900 border-amber-300',
    'bg-blue-200 text-blue-900 border-blue-300',
    'bg-emerald-200 text-emerald-900 border-emerald-300',
    'bg-rose-200 text-rose-900 border-rose-300',
    'bg-purple-200 text-purple-900 border-purple-300',
    'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border-gray-200 dark:border-zinc-700'
];

export function Whiteboard() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ==========================================
    // ESTADOS PRINCIPAIS E NAVEGAÇÃO
    // ==========================================
    const [currentBoardId, setCurrentBoardId] = useState('root');
    const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });
    const [activeTool, setActiveTool] = useState('cursor');

    const [elements, setElements] = useState<any[]>([
        { id: '1', parentId: 'root', type: 'sticky', x: -100, y: 100, w: 220, h: 220, content: 'Bem-vindo ao Ekko Board Enterprise!\n\nAgora com Seleção Múltipla, Minimapa, Links e Bloqueio de Cartões!', color: COLORS[0], locked: false },
        { id: '2', parentId: 'root', type: 'column', x: 200, y: 50, w: 320, h: 600, title: 'Tarefas da Semana', color: 'bg-gray-100/50 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800', locked: false },
        { id: '3', parentId: 'root', type: 'todo', x: 220, y: 120, w: 280, h: 200, title: 'Checklist de Lançamento', tasks: [{ id: 1, text: 'Revisar Copy', done: true }], color: COLORS[5], locked: false },
    ]);

    const [links, setLinks] = useState<any[]>([]);
    const [paths, setPaths] = useState<any[]>([]);

    // Interações e Seleção (Atualizado para Múltiplos)
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [lassoBox, setLassoBox] = useState<any>(null); // {startX, startY, currentX, currentY}

    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [dragStartInfo, setDragStartInfo] = useState<any>(null); // Para mover múltiplos
    const [isPanning, setIsPanning] = useState(false);

    // Redimensionamento (Resize)
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState<any>({ w: 0, h: 0, startX: 0, startY: 0, id: null });

    // Guias Magnéticas e Conexões
    const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [tempArrowEnd, setTempArrowEnd] = useState<any>(null);

    // Desenho Livre
    const [currentPath, setCurrentPath] = useState<any>(null);
    const [drawColor, setDrawColor] = useState('#F05522');
    const [drawWidth, setDrawWidth] = useState(4);
    const [undoStack, setUndoStack] = useState<any[]>([]);
    const [redoStack, setRedoStack] = useState<any[]>([]);
    const [isErasing, setIsErasing] = useState(false);

    // Funcionalidades Enterprise
    const [showMinimap, setShowMinimap] = useState(false);
    const [showTemplatesModal, setShowTemplatesModal] = useState(false);

    // Editor e Upload
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
    const [pendingImagePos, setPendingImagePos] = useState<any>(null);
    const activeDocument = elements.find(el => el.id === activeDocumentId);

    // Filtros do Board Atual
    const currentElements = elements.filter(el => el.parentId === currentBoardId);
    const currentPaths = paths.filter(p => p.boardId === currentBoardId);
    const currentLinks = links.filter(l => l.boardId === currentBoardId);
    const parentBoard = elements.find(el => el.id === currentBoardId);

    // ==========================================
    // LÓGICA DE CÂMERA E COORDENADAS
    // ==========================================
    const getLocalCoordinates = (clientX: number, clientY: number) => ({
        x: (clientX - camera.x) / camera.z,
        y: (clientY - camera.y) / camera.z
    });

    const handleWheel = useCallback((e: WheelEvent) => {
        if (activeDocumentId || showTemplatesModal) return;
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            setCamera(c => {
                const newZ = Math.min(Math.max(0.1, c.z + delta), 3);
                const scaleChange = newZ - c.z;
                const newX = c.x - (mouseX - c.x) * (scaleChange / c.z);
                const newY = c.y - (mouseY - c.y) * (scaleChange / c.z);
                return { x: newX, y: newY, z: newZ };
            });
        } else {
            setCamera(c => ({ x: c.x - e.deltaX, y: c.y - e.deltaY, z: c.z }));
        }
    }, [activeDocumentId, showTemplatesModal]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            return () => canvas.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    // ==========================================
    // TEMPLATES ENTERPRISE
    // ==========================================
    const insertTemplate = (type: string) => {
        tryPlaySound('success');
        const baseX = (-camera.x / camera.z) + 100;
        const baseY = (-camera.y / camera.z) + 100;
        const newItems: any[] = [];
        const tId = Date.now();

        if (type === 'swot') {
            newItems.push({ id: `${tId}-1`, parentId: currentBoardId, type: 'column', x: baseX, y: baseY, w: 320, h: 500, title: 'Strengths (Forças)', color: 'bg-emerald-50/50 border-emerald-200' });
            newItems.push({ id: `${tId}-2`, parentId: currentBoardId, type: 'column', x: baseX + 340, y: baseY, w: 320, h: 500, title: 'Weaknesses (Fraquezas)', color: 'bg-rose-50/50 border-rose-200' });
            newItems.push({ id: `${tId}-3`, parentId: currentBoardId, type: 'column', x: baseX, y: baseY + 520, w: 320, h: 500, title: 'Opportunities (Oportunidades)', color: 'bg-blue-50/50 border-blue-200' });
            newItems.push({ id: `${tId}-4`, parentId: currentBoardId, type: 'column', x: baseX + 340, y: baseY + 520, w: 320, h: 500, title: 'Threats (Ameaças)', color: 'bg-amber-50/50 border-amber-200' });
        } else if (type === 'funnel') {
            newItems.push({ id: `${tId}-1`, parentId: currentBoardId, type: 'column', x: baseX, y: baseY, w: 250, h: 600, title: '1. Descoberta', color: 'bg-gray-100/50' });
            newItems.push({ id: `${tId}-2`, parentId: currentBoardId, type: 'column', x: baseX + 270, y: baseY, w: 250, h: 600, title: '2. Interesse', color: 'bg-gray-100/50' });
            newItems.push({ id: `${tId}-3`, parentId: currentBoardId, type: 'column', x: baseX + 540, y: baseY, w: 250, h: 600, title: '3. Decisão', color: 'bg-gray-100/50' });
            newItems.push({ id: `${tId}-4`, parentId: currentBoardId, type: 'column', x: baseX + 810, y: baseY, w: 250, h: 600, title: '4. Ação', color: 'bg-gray-100/50' });
        }

        setElements([...elements, ...newItems]);
        setShowTemplatesModal(false);
    };

    // ==========================================
    // DRAG & DROP E UPLOAD
    // ==========================================
    const handleDragStartTool = (e: React.DragEvent, type: string) => {
        e.dataTransfer.setData('ekko-tool', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDropOnCanvas = (e: React.DragEvent) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('ekko-tool');
        if (type) {
            const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
            if (type === 'image') {
                setPendingImagePos({ x, y });
                fileInputRef.current?.click();
            } else if (type === 'bookmark') {
                const url = prompt("Insira o Link da Web (URL):");
                if (url) createElementAt(type, x, y, null, url);
            } else {
                createElementAt(type, x, y);
            }
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && pendingImagePos) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                createElementAt('image', pendingImagePos.x, pendingImagePos.y, ev.target?.result as string);
                setPendingImagePos(null);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const createElementAt = (type: string, x: number, y: number, imageSrc: string | null = null, url: string | null = null) => {
        tryPlaySound('success');
        let newEl: any = { id: Date.now().toString(), parentId: currentBoardId, type, x, y, content: '', locked: false };

        if (type === 'sticky') newEl = { ...newEl, w: 220, h: 220, color: COLORS[0] };
        else if (type === 'text') newEl = { ...newEl, w: 300, h: 100, color: 'text-gray-900 dark:text-white text-xl font-bold', content: 'Novo Texto' };
        else if (type === 'square' || type === 'circle') newEl = { ...newEl, w: 150, h: 150, color: COLORS[5] };
        else if (type === 'document') newEl = { ...newEl, w: 140, h: 160, title: 'Documento Sem Nome', color: 'bg-white border-gray-200' };
        else if (type === 'board') newEl = { ...newEl, w: 160, h: 120, title: 'Novo Board', color: 'bg-gray-100 border-gray-300 text-gray-800' };
        else if (type === 'image') newEl = { ...newEl, w: 300, h: 200, imageSrc, color: 'bg-transparent border-transparent' };
        else if (type === 'column') newEl = { ...newEl, w: 320, h: 600, title: 'Nova Coluna', color: 'bg-gray-100/50 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800' };
        else if (type === 'todo') newEl = { ...newEl, w: 280, h: 200, title: 'Tarefas', tasks: [{ id: 1, text: 'Nova tarefa', done: false }], color: COLORS[5] };
        else if (type === 'bookmark') newEl = { ...newEl, w: 300, h: 120, url, title: 'Web Link', content: url, color: 'bg-white border-gray-200' };

        setElements([...elements, newEl]);
        setSelectedIds([newEl.id]);
        setActiveTool('cursor');
    };

    // ==========================================
    // PONTEIROS, SELEÇÃO (LASSO) E ARRASTAR
    // ==========================================
    const handlePointerDown = (e: React.PointerEvent, elementId: string | null = null) => {
        if (activeDocumentId || showTemplatesModal) return;
        if ((e.target as HTMLElement).closest('.no-drag')) return;

        if (activeTool === 'hand' || e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            return;
        }

        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

        // Sistema de Conexões
        if (activeTool === 'connect') {
            if (elementId) {
                e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
                setConnectingFrom(elementId); setTempArrowEnd({ x, y }); tryPlaySound('tap');
            }
            return;
        }

        // Desenho Livre
        if (activeTool === 'draw' || activeTool === 'highlight') {
            e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setCurrentPath({ id: Date.now().toString(), boardId: currentBoardId, type: activeTool, color: drawColor, width: activeTool === 'highlight' ? 24 : drawWidth, points: [{ x, y }] });
            return;
        }

        // Borracha
        if (activeTool === 'eraser') {
            e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setUndoStack(prev => [...prev, paths]); setRedoStack([]); setIsErasing(true);
            erasePathsAt(x, y);
            return;
        }

        // Clique Num Elemento (Para Selecionar ou Arrastar)
        if (elementId) {
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);

            const el = elements.find(el => el.id === elementId);
            if (el.locked && activeTool !== 'cursor') return; // Se bloqueado, ignora interações que não sejam selecionar para desbloquear

            // Se não estava na seleção atual (e não segurou Shift), seleciona apenas ele
            let newSelection = selectedIds;
            if (!selectedIds.includes(elementId)) {
                newSelection = e.shiftKey ? [...selectedIds, elementId] : [elementId];
                setSelectedIds(newSelection);
                tryPlaySound('tap');
            }

            // Prepara o Dragging (para mover 1 ou múltiplos)
            if (!el.locked) {
                setIsDraggingElement(true);
                // Guarda as posições originais de todos os selecionados para calcular o offset coletivo
                const initialStates = elements.filter(e => newSelection.includes(e.id)).map(e => ({ id: e.id, initialX: e.x, initialY: e.y }));
                setDragStartInfo({ cursorStartX: x, cursorStartY: y, initialStates });
            }

        } else {
            // Clique no Fundo (Inicia Lasso Tool)
            if (activeTool === 'cursor') {
                setSelectedIds([]);
                setLassoBox({ startX: x, startY: y, currentX: x, currentY: y });
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }
        }
    };

    const handleResizeStart = (e: React.PointerEvent, id: string) => {
        e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setIsResizing(true); setSelectedIds([id]);
        const el = elements.find(e => e.id === id);
        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
        setResizeStart({ initialW: el.w, initialH: el.h, startX: x, startY: y, id });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (activeDocumentId || showTemplatesModal) return;
        if (isPanning) { setCamera(c => ({ ...c, x: c.x + e.movementX, y: c.y + e.movementY })); return; }

        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

        if (lassoBox) {
            setLassoBox({ ...lassoBox, currentX: x, currentY: y });
        } else if (connectingFrom) {
            setTempArrowEnd({ x, y });
        } else if (currentPath) {
            setCurrentPath((prev: any) => ({ ...prev, points: [...prev.points, { x, y }] }));
        } else if (activeTool === 'eraser' && isErasing) {
            erasePathsAt(x, y);
        } else if (isResizing && resizeStart.id) {
            const deltaX = x - resizeStart.startX;
            const deltaY = y - resizeStart.startY;
            setElements(els => els.map(el => {
                if (el.id === resizeStart.id) return { ...el, w: Math.max(100, resizeStart.initialW + deltaX), h: Math.max(50, resizeStart.initialH + deltaY) };
                return el;
            }));
        } else if (isDraggingElement && dragStartInfo) {
            const deltaX = x - dragStartInfo.cursorStartX;
            const deltaY = y - dragStartInfo.cursorStartY;

            setElements(els => els.map(e => {
                const initialState = dragStartInfo.initialStates.find((s: any) => s.id === e.id);
                if (initialState && !e.locked) {
                    return { ...e, x: initialState.initialX + deltaX, y: initialState.initialY + deltaY };
                }
                return e;
            }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        // Processa o Fim do Lasso Tool
        if (lassoBox) {
            const minX = Math.min(lassoBox.startX, lassoBox.currentX);
            const maxX = Math.max(lassoBox.startX, lassoBox.currentX);
            const minY = Math.min(lassoBox.startY, lassoBox.currentY);
            const maxY = Math.max(lassoBox.startY, lassoBox.currentY);

            const intersected = currentElements.filter(el => {
                if (el.locked) return false;
                const elRight = el.x + (el.w || 200);
                const elBottom = el.y + (el.h || 100);
                return !(el.x > maxX || elRight < minX || el.y > maxY || elBottom < minY);
            }).map(el => el.id);

            if (intersected.length > 0) { tryPlaySound('tap'); setSelectedIds(intersected); }
            setLassoBox(null);
        }

        setIsDraggingElement(false); setIsPanning(false); setIsErasing(false); setIsResizing(false); setDragStartInfo(null);

        if (connectingFrom) {
            if (hoveredElementId && hoveredElementId !== connectingFrom) {
                tryPlaySound('success');
                setLinks([...links, { id: Date.now().toString(), boardId: currentBoardId, from: connectingFrom, to: hoveredElementId }]);
            }
            setConnectingFrom(null); setTempArrowEnd(null);
        }

        if (currentPath) {
            setUndoStack(prev => [...prev, paths]); setRedoStack([]); setPaths(prev => [...prev, currentPath]); setCurrentPath(null);
        }
    };

    // ==========================================
    // FUNÇÕES SECUNDÁRIAS (Lock, Cor, Delete)
    // ==========================================
    const toggleLockSelected = (e: React.MouseEvent) => {
        e.stopPropagation(); tryPlaySound('tap');
        setElements(els => els.map(el => selectedIds.includes(el.id) ? { ...el, locked: !el.locked } : el));
    };

    const deleteSelected = (e: React.MouseEvent) => {
        e.stopPropagation(); tryPlaySound('close');
        setElements(els => els.filter(el => !selectedIds.includes(el.id)));
        setSelectedIds([]);
    };

    const updateColorSelected = (colorClass: string, e: React.MouseEvent) => {
        e.stopPropagation(); tryPlaySound('tap');
        setElements(els => els.map(el => selectedIds.includes(el.id) ? { ...el, color: colorClass } : el));
    };

    const erasePathsAt = (x: number, y: number) => {
        const eraseRadius = 25 / camera.z;
        setPaths(prev => prev.filter(path => {
            if (path.boardId !== currentBoardId) return true;
            return !path.points.some((pt: any) => Math.hypot(pt.x - x, pt.y - y) < eraseRadius);
        }));
    };

    const handleUndo = () => { if (undoStack.length > 0) { tryPlaySound('tap'); setRedoStack(prev => [...prev, paths]); setPaths(undoStack[undoStack.length - 1]); setUndoStack(prev => prev.slice(0, -1)); } };
    const handleRedo = () => { if (redoStack.length > 0) { tryPlaySound('tap'); setUndoStack(prev => [...prev, paths]); setPaths(redoStack[redoStack.length - 1]); setRedoStack(prev => prev.slice(0, -1)); } };
    const createPathData = (points: any[]) => points.length ? `M ${points[0].x} ${points[0].y}` + points.slice(1).map(p => ` L ${p.x} ${p.y}`).join('') : '';

    const resetCamera = () => { tryPlaySound('tap'); setCamera({ x: 0, y: 0, z: 1 }); };
    const zoomIn = () => { tryPlaySound('tap'); setCamera(c => ({ ...c, z: Math.min(c.z + 0.2, 3) })); };
    const zoomOut = () => { tryPlaySound('tap'); setCamera(c => ({ ...c, z: Math.max(c.z - 0.2, 0.1) })); };

    // ==========================================
    // FUNÇÕES DE TO-DO LISTS
    // ==========================================
    const toggleTask = (elId: string, taskId: number) => {
        tryPlaySound('tap');
        setElements(els => els.map(el => {
            if (el.id === elId && el.type === 'todo') {
                return { ...el, tasks: el.tasks.map((t: any) => t.id === taskId ? { ...t, done: !t.done } : t) };
            }
            return el;
        }));
    };

    const updateTaskText = (elId: string, taskId: number, text: string) => {
        setElements(els => els.map(el => {
            if (el.id === elId && el.type === 'todo') {
                return { ...el, tasks: el.tasks.map((t: any) => t.id === taskId ? { ...t, text } : t) };
            }
            return el;
        }));
    };

    const addTask = (elId: string) => {
        tryPlaySound('tap');
        setElements(els => els.map(el => {
            if (el.id === elId && el.type === 'todo') {
                return { ...el, tasks: [...el.tasks, { id: Date.now(), text: '', done: false }] };
            }
            return el;
        }));
    };

    const deleteTask = (elId: string, taskId: number) => {
        setElements(els => els.map(el => {
            if (el.id === elId && el.type === 'todo') {
                return { ...el, tasks: el.tasks.filter((t: any) => t.id !== taskId) };
            }
            return el;
        }));
    };

    // ==========================================
    // RENDERIZAÇÃO
    // ==========================================
    const renderArrows = () => {
        const allLinks = [...currentLinks];
        if (connectingFrom && tempArrowEnd) allLinks.push({ id: 'temp', from: connectingFrom, to: 'temp' });

        return allLinks.map(link => {
            const fromEl = elements.find(e => e.id === link.from);
            const toEl = link.to === 'temp' ? { x: tempArrowEnd.x, y: tempArrowEnd.y, w: 0, h: 0 } : elements.find(e => e.id === link.to);
            if (!fromEl || !toEl) return null;

            const x1 = fromEl.x + (typeof fromEl.w === 'number' ? fromEl.w / 2 : 100);
            const y1 = fromEl.y + (typeof fromEl.h === 'number' ? fromEl.h / 2 : 50);
            const x2 = toEl.x + (typeof toEl.w === 'number' ? toEl.w / 2 : 0);
            const y2 = toEl.y + (typeof toEl.h === 'number' ? toEl.h / 2 : 0);
            const d = `M ${x1} ${y1} C ${x1 + (x2 - x1) / 2} ${y1}, ${x1 + (x2 - x1) / 2} ${y2}, ${x2} ${y2}`;

            return (
                <g key={link.id}>
                    <path d={d} fill="none" stroke="#9ca3af" strokeWidth="3" strokeDasharray={link.id === 'temp' ? "5,5" : "none"} markerEnd="url(#arrowhead)" />
                    {link.id !== 'temp' && activeTool === 'cursor' && (
                        <path d={d} fill="none" stroke="transparent" strokeWidth="20" className="cursor-pointer hover:stroke-rose-500/30" onClick={() => { tryPlaySound('close'); setLinks(ls => ls.filter(l => l.id !== link.id)); }} />
                    )}
                </g>
            );
        });
    };

    return (
        <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden font-sans flex animate-in fade-in duration-500 bg-gray-50 dark:bg-[#0a0a0c] rounded-[2.5rem] border border-app-border mx-4 my-4">

            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            {/* Breadcrumb de Navegação (Sub-Boards) */}
            {currentBoardId !== 'root' && (
                <div className="absolute top-6 left-24 z-40 flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-md border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg animate-in slide-in-from-top-4">
                    <button onClick={() => { tryPlaySound('tap'); setCurrentBoardId('root'); resetCamera(); }} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                        <ArrowLeft size={14} /> Início
                    </button>
                    <span className="text-gray-300 dark:text-zinc-700">/</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white truncate max-w-[200px]">{parentBoard?.title}</span>
                </div>
            )}

            {/* BARRA DE FERRAMENTAS ESQUERDA (Com NOVAS FERRAMENTAS) */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-2 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => { tryPlaySound('tap'); setActiveTool('cursor'); setSelectedIds([]); }} title="Selecionar (V)" className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'cursor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><MousePointer2 size={20} /></button>
                <button onClick={() => { tryPlaySound('tap'); setActiveTool('hand'); setSelectedIds([]); }} title="Mover Canvas (H)" className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'hand' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><Hand size={20} /></button>
                <button onClick={() => { tryPlaySound('tap'); setActiveTool('connect'); setSelectedIds([]); }} title="Ligar Cartões" className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'connect' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><ArrowUpRight size={20} /></button>
                <button onClick={() => { tryPlaySound('tap'); setActiveTool('draw'); setSelectedIds([]); }} title="Desenho Livre" className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${['draw', 'highlight', 'eraser'].includes(activeTool) ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><Pencil size={20} /></button>

                <div className="w-full h-px bg-gray-200 dark:bg-zinc-800 my-1 shrink-0"></div>

                {/* Ferramentas Arrastáveis (Drag & Drop) */}
                {[
                    { id: 'board', icon: FolderOpen, label: 'Sub-Board' },
                    { id: 'column', icon: Columns, label: 'Coluna Kanban' },
                    { id: 'todo', icon: ListTodo, label: 'Lista de Tarefas' },
                    { id: 'document', icon: FileText, label: 'Documento' },
                    { id: 'sticky', icon: StickyNote, label: 'Nota' },
                    { id: 'text', icon: Type, label: 'Texto' },
                    { id: 'square', icon: Square, label: 'Forma' },
                    { id: 'image', icon: ImageIcon, label: 'Imagem' },
                    { id: 'bookmark', icon: Globe, label: 'Link Web' },
                ].map((tool) => (
                    <div key={tool.id} draggable onDragStart={(e) => handleDragStartTool(e, tool.id)} title={tool.label} className="p-3 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ios-btn text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-indigo-600 shrink-0">
                        <tool.icon size={20} strokeWidth={2} />
                    </div>
                ))}

                <div className="w-full h-px bg-gray-200 dark:bg-zinc-800 my-1 shrink-0"></div>
                <button onClick={() => { tryPlaySound('open'); setShowTemplatesModal(true); }} title="Templates Prontos" className="p-3 rounded-xl flex items-center justify-center transition-all ios-btn text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 shrink-0"><LayoutTemplate size={20} /></button>
            </div>

            {/* CONTROLES DA CÂMERA E MINIMAPA */}
            <div className="absolute right-6 bottom-6 z-40 flex flex-col gap-2 items-end">
                <button onClick={() => setShowMinimap(!showMinimap)} className={`p-3 rounded-xl shadow-xl transition-colors ios-btn ${showMinimap ? 'bg-indigo-600 text-white' : 'bg-white/80 dark:bg-[#111114]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 text-gray-500'}`}>
                    <Map size={20} />
                </button>
                <div className="flex items-center gap-1 p-1 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl">
                    <button onClick={zoomOut} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"><ZoomOut size={16} /></button>
                    <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 w-12 text-center font-mono">{Math.round(camera.z * 100)}%</span>
                    <button onClick={zoomIn} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"><ZoomIn size={16} /></button>
                    <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
                    <button onClick={resetCamera} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"><Maximize size={16} /></button>
                </div>
            </div>

            {/* RENDERIZAÇÃO DO MINIMAPA */}
            {showMinimap && (
                <div className="absolute right-6 bottom-24 w-48 h-32 bg-white/95 dark:bg-[#111114]/95 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-40 overflow-hidden p-2 animate-in slide-in-from-bottom-4 pointer-events-none">
                    <div className="relative w-full h-full bg-gray-50 dark:bg-zinc-900 rounded-lg overflow-hidden">
                        {currentElements.map(el => (
                            <div key={el.id} className="absolute bg-indigo-500/30 rounded-sm" style={{ left: (el.x / 20) + 96, top: (el.y / 20) + 64, width: (el.w || 100) / 20, height: (el.h || 100) / 20 }} />
                        ))}
                        <div className="absolute border-2 border-indigo-600 bg-indigo-600/10 rounded" style={{ left: (-camera.x / camera.z / 20) + 96, top: (-camera.y / camera.z / 20) + 64, width: (window.innerWidth / camera.z / 20), height: (window.innerHeight / camera.z / 20) }} />
                    </div>
                </div>
            )}

            {/* MENU CONTEXTUAL MULTI-SELEÇÃO FLUTUANTE (Fixado no topo centro) */}
            {selectedIds.length > 0 && activeTool === 'cursor' && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-200">
                    <div className="px-3 py-1 bg-gray-100 dark:bg-zinc-800 rounded-xl text-xs font-bold text-gray-600 dark:text-zinc-300">
                        {selectedIds.length} {selectedIds.length === 1 ? 'Elemento' : 'Elementos'}
                    </div>
                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-2"></div>
                    <div className="flex gap-1 pr-2 border-r border-gray-100 dark:border-zinc-800 mr-1">
                        {COLORS.map((c, i) => (
                            <button key={i} onClick={(e) => updateColorSelected(c, e)} className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 ${c.split(' ')[0]} hover:scale-110 transition-transform ios-btn`} />
                        ))}
                    </div>
                    <button onClick={toggleLockSelected as any} title="Trancar/Destrancar" className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors ios-btn">
                        {elements.find(e => e.id === selectedIds[0])?.locked ? <Lock size={18} className="text-amber-500" /> : <Unlock size={18} />}
                    </button>
                    <button onClick={deleteSelected as any} title="Excluir" className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors ios-btn"><Trash2 size={18} /></button>
                </div>
            )}

            {/* ÁREA DO CANVAS (INFINITA & DROPPABLE) */}
            <div
                ref={canvasRef}
                className={`w-full h-full cursor-${activeTool === 'hand' || isPanning ? 'grab' : (['draw', 'eraser', 'highlight', 'connect'].includes(activeTool) ? 'crosshair' : 'default')} ${isPanning ? 'cursor-grabbing' : ''}`}
                onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }} onDrop={handleDropOnCanvas}
                style={{
                    backgroundImage: `radial-gradient(circle, #88888833 ${1.5 * camera.z}px, transparent ${1.5 * camera.z}px)`,
                    backgroundSize: `${30 * camera.z}px ${30 * camera.z}px`,
                    backgroundPosition: `${camera.x}px ${camera.y}px`,
                }}
            >
                <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})` }}>

                    {/* Lasso Box Rendering */}
                    {lassoBox && activeTool === 'cursor' && (
                        <div className="absolute border border-indigo-500 bg-indigo-500/20 z-50 pointer-events-none" style={{ left: Math.min(lassoBox.startX, lassoBox.currentX), top: Math.min(lassoBox.startY, lassoBox.currentY), width: Math.abs(lassoBox.currentX - lassoBox.startX), height: Math.abs(lassoBox.currentY - lassoBox.startY) }} />
                    )}

                    <svg className="absolute pointer-events-none z-0" style={{ top: 0, left: 0, width: 1, height: 1, overflow: 'visible' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" /></marker>
                        </defs>
                        {renderArrows()}
                        {currentPaths.map(p => (<path key={p.id} d={createPathData(p.points)} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={p.type === 'highlight' ? 0.3 : 1} />))}
                        {currentPath && (<path d={createPathData(currentPath.points)} stroke={currentPath.color} strokeWidth={currentPath.width} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={currentPath.type === 'highlight' ? 0.3 : 1} />)}
                    </svg>

                    {/* RENDERIZAÇÃO DOS CARTÕES */}
                    {currentElements.map((el) => {
                        const isSelected = selectedIds.includes(el.id);
                        const isHovered = hoveredElementId === el.id;
                        const zIndex = isSelected ? 'z-40' : (el.type === 'column' ? 'z-0' : 'z-10');

                        return (
                            <div
                                key={el.id}
                                onPointerEnter={() => setHoveredElementId(el.id)}
                                onPointerLeave={() => setHoveredElementId(null)}
                                onPointerDown={(e) => handlePointerDown(e, el.id)}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    if (el.locked) return;
                                    if (el.type === 'document') { tryPlaySound('open'); setActiveDocumentId(el.id); }
                                    else if (el.type === 'board') { tryPlaySound('open'); setCurrentBoardId(el.id); resetCamera(); }
                                }}
                                className={`absolute group touch-none origin-top-left ${el.type === 'text' || el.type === 'image' ? '' : 'shadow-sm'} ${isSelected || (isHovered && activeTool === 'connect') ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent shadow-xl' : ''} ${zIndex} transition-shadow`}
                                style={{
                                    left: el.x, top: el.y, width: el.type === 'text' ? 'auto' : el.w, height: el.type === 'text' ? 'auto' : el.h, minWidth: el.type === 'text' ? 100 : undefined, borderRadius: el.type === 'circle' ? '50%' : '12px',
                                    opacity: el.locked ? 0.9 : 1
                                }}
                            >
                                {el.locked && !isSelected && (
                                    <div className="absolute -top-3 -right-3 w-6 h-6 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full flex items-center justify-center shadow-sm z-50">
                                        <Lock size={12} className="text-gray-400" />
                                    </div>
                                )}

                                {isSelected && activeTool === 'cursor' && selectedIds.length === 1 && el.type !== 'text' && !el.locked && (
                                    <div onPointerDown={(e) => handleResizeStart(e, el.id)} className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 shadow-sm hover:scale-125 transition-transform" />
                                )}

                                <div className={`w-full h-full flex flex-col overflow-hidden border ${el.type === 'document' || el.type === 'image' || el.type === 'text' || el.type === 'bookmark' ? 'border-transparent' : el.color} ${el.type === 'circle' ? 'rounded-full' : 'rounded-xl'}`}>

                                    {el.type === 'bookmark' && (
                                        <div className="w-full h-full flex items-center p-4 bg-white border border-gray-200 text-left hover:bg-gray-50 transition-colors gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                                <Globe size={24} className="text-indigo-500" />
                                            </div>
                                            <div className="flex flex-col flex-1 overflow-hidden">
                                                <input
                                                    value={el.title}
                                                    disabled={el.locked}
                                                    onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, title: e.target.value } : old))}
                                                    className="no-drag font-bold text-gray-800 text-sm bg-transparent outline-none truncate w-full"
                                                    placeholder="Título do Site"
                                                />
                                                <a href={el.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline truncate no-drag" onPointerDown={e => e.stopPropagation()}>{el.url}</a>
                                            </div>
                                        </div>
                                    )}

                                    {el.type === 'column' && (
                                        <div className="w-full h-full flex flex-col p-4 pointer-events-none">
                                            <input value={el.title} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, title: e.target.value } : old))} disabled={el.locked} className="no-drag w-full bg-transparent font-black text-sm outline-none uppercase tracking-widest text-gray-500 mb-4 pointer-events-auto" placeholder="Nome da Coluna" />
                                        </div>
                                    )}

                                    {el.type === 'todo' && (
                                        <div className="w-full h-full flex flex-col p-4 cursor-default no-drag">
                                            <input value={el.title} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, title: e.target.value } : old))} disabled={el.locked} className="w-full bg-transparent font-black text-sm outline-none mb-3" placeholder="Título da Lista" />
                                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                                {el.tasks && el.tasks.map((task: any) => (
                                                    <div key={task.id} className="flex items-start gap-2 group">
                                                        <button disabled={el.locked} onClick={(e) => { e.stopPropagation(); toggleTask(el.id, task.id); }} className={`mt-0.5 shrink-0 transition-colors ${task.done ? 'text-emerald-500' : 'text-gray-400 hover:text-indigo-500'}`}>
                                                            {task.done ? <CheckSquare size={16} /> : <Square size={16} />}
                                                        </button>
                                                        <input disabled={el.locked} value={task.text} onChange={(e) => updateTaskText(el.id, task.id, e.target.value)} className={`flex-1 bg-transparent text-sm outline-none ${task.done ? 'line-through text-gray-400 opacity-60' : 'text-gray-800 dark:text-zinc-200'}`} placeholder="Nova tarefa..." />
                                                        {!el.locked && <button onClick={(e) => { e.stopPropagation(); deleteTask(el.id, task.id); }} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>}
                                                    </div>
                                                ))}
                                            </div>
                                            {!el.locked && <button onClick={(e) => { e.stopPropagation(); addTask(el.id); }} className="mt-3 flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"><Plus size={14} /> Adicionar Item</button>}
                                        </div>
                                    )}

                                    {el.type === 'board' && (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors">
                                            <FolderOpen size={42} className="text-indigo-500 mb-3" strokeWidth={1.5} />
                                            <input value={el.title} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, title: e.target.value } : old))} disabled={el.locked} className="no-drag w-full bg-transparent text-center font-black text-sm outline-none" placeholder="Nome do Board" />
                                        </div>
                                    )}

                                    {el.type === 'image' && (
                                        <img src={el.imageSrc} alt="Board Element" className="w-full h-full object-cover rounded-xl pointer-events-none" />
                                    )}

                                    {el.type === 'document' && (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl text-center cursor-pointer hover:bg-gray-50 transition-colors">
                                            <FileText size={42} className="text-gray-400 mb-3" strokeWidth={1.5} />
                                            <span className="font-bold text-gray-800 text-[13px] leading-tight px-2 w-full truncate">{el.title || 'New Document'}</span>
                                            <span className="text-[11px] font-medium text-gray-400 mt-1.5">{(el.content || '').replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length} words</span>
                                        </div>
                                    )}

                                    {el.type === 'sticky' && (
                                        <div className="w-full h-full p-4 relative">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-black/5 dark:bg-white/5"></div>
                                            <textarea value={el.content} disabled={el.locked} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, content: e.target.value } : old))} placeholder="Escreva..." className="no-drag w-full h-full bg-transparent resize-none outline-none text-sm font-medium leading-relaxed custom-scrollbar placeholder-current/50" style={{ color: 'inherit' }} />
                                        </div>
                                    )}

                                    {el.type === 'text' && (
                                        <textarea value={el.content} disabled={el.locked} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, content: e.target.value } : old))} placeholder="Texto..." rows={1} className={`no-drag bg-transparent border-none resize-none outline-none whitespace-pre-wrap overflow-hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 focus:bg-transparent ${el.color}`} style={{ height: 'auto' }} onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                                    )}

                                    {(el.type === 'square' || el.type === 'circle') && (
                                        <div className="w-full h-full flex items-center justify-center p-4">
                                            <textarea value={el.content} disabled={el.locked} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, content: e.target.value } : old))} placeholder="Texto..." className="no-drag w-full bg-transparent resize-none outline-none text-center font-bold text-sm" style={{ color: 'inherit' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showTemplatesModal && (
                <div className="fixed inset-0 z-[100000] bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onPointerDown={() => setShowTemplatesModal(false)}>
                    <div className="w-full max-w-3xl bg-white dark:bg-[#111114] rounded-3xl shadow-2xl p-8 animate-ios-spring" onPointerDown={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Galeria de Templates</h2>
                                <p className="text-gray-500 dark:text-zinc-400 mt-1 font-medium">Inicie o seu projeto rapidamente com frameworks estruturados.</p>
                            </div>
                            <button onClick={() => setShowTemplatesModal(false)} className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <button onClick={() => insertTemplate('swot')} className="flex flex-col items-start p-6 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all text-left group">
                                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><LayoutGrid size={24} /></div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Matriz SWOT</h3>
                                <p className="text-sm text-gray-500 mt-2">Quatro colunas essenciais para análise de Forças, Fraquezas, Oportunidades e Ameaças.</p>
                            </button>
                            <button onClick={() => insertTemplate('funnel')} className="flex flex-col items-start p-6 border-2 border-gray-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all text-left group">
                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Columns size={24} /></div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Funil de Vendas</h3>
                                <p className="text-sm text-gray-500 mt-2">Quatro fases (Descoberta a Ação) para mapear a jornada completa do cliente.</p>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeDocumentId && activeDocument && (
                <div className="fixed inset-0 z-[99999] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-200">
                    <div className="w-full max-w-[1200px] h-full max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-ios-spring">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white z-10">
                            <div className="w-32 flex items-center gap-2 text-gray-500">
                                <FileText size={18} />
                                <span className="text-xs font-medium">{(activeDocument.content || '').replace(/<[^>]+>/g, '').trim().split(/\s+/).filter(Boolean).length} words</span>
                            </div>
                            <input value={activeDocument.title} onChange={(e) => setElements(els => els.map(old => old.id === activeDocumentId ? { ...old, title: e.target.value } : old))} className="text-center font-bold text-gray-900 text-lg outline-none hover:bg-gray-50 px-4 py-1 rounded-lg transition-colors border border-transparent focus:border-gray-200 w-full max-w-sm" placeholder="Nome do Documento" />
                            <div className="w-32 flex items-center justify-end gap-3">
                                <button onClick={() => {
                                    if (editorRef.current && activeDocumentId) setElements(els => els.map(old => old.id === activeDocumentId ? { ...old, content: editorRef.current.innerHTML } : old));
                                    tryPlaySound('close'); setActiveDocumentId(null);
                                }} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors bg-gray-100"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="flex flex-1 overflow-hidden bg-white">
                            <div className="w-16 flex-shrink-0 border-r border-gray-100 flex flex-col items-center py-6 gap-6 bg-gray-50/50">
                                <div className="flex flex-col gap-3">
                                    <button onClick={() => { document.execCommand('bold', false, undefined); editorRef.current?.focus(); }} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200"><Bold size={18} /></button>
                                    <button onClick={() => { document.execCommand('italic', false, undefined); editorRef.current?.focus(); }} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200"><Italic size={18} /></button>
                                    <button onClick={() => { document.execCommand('insertUnorderedList', false, undefined); editorRef.current?.focus(); }} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200"><List size={18} /></button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                                <div ref={editorRef} className="w-full max-w-3xl mx-auto p-12 min-h-full outline-none text-gray-700 leading-relaxed document-editor-content" contentEditable={true} suppressContentEditableWarning={true} onBlur={(e) => setElements(els => els.map(old => old.id === activeDocumentId ? { ...old, content: e.target.innerHTML } : old))} dangerouslySetInnerHTML={{ __html: activeDocument.content || '<p><br></p>' }} style={{ fontSize: '15px' }} />
                                <style dangerouslySetInnerHTML={{ __html: `.document-editor-content:empty:before { content: 'Comece a escrever...'; color: #9ca3af; pointer-events: none; } .document-editor-content b, .document-editor-content strong { font-weight: 800; color: #111827; } .document-editor-content i, .document-editor-content em { font-style: italic; } .document-editor-content ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1rem; } .document-editor-content li { margin-bottom: 0.5rem; }` }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
