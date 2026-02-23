import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MousePointer2, Hand, StickyNote, Type, Square, Circle,
    Image as ImageIcon, Trash2, Plus, ZoomIn, ZoomOut, Maximize, Palette,
    Pencil, Eraser, Undo2, Redo2, FileText, X, ChevronDown,
    Bold, Italic, Strikethrough, List, ListOrdered, Indent, Outdent, Link2, MessageSquare, MoreHorizontal, AlignLeft,
    Highlighter, ArrowUpRight, FolderOpen, ArrowLeft,
    Columns, ListTodo, CheckSquare
} from 'lucide-react';

// ==========================================
// FUNÇÕES AUXILIARES GERAIS
// ==========================================
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
        { id: '1', parentId: 'root', type: 'sticky', x: 50, y: 100, w: 220, h: 220, content: 'Bem-vindo ao Ekko Board Avançado!\n\nArraste elementos da lateral para começar. Experimente arrastar pelos cantos para redimensionar!', color: COLORS[0] },
        { id: '2', parentId: 'root', type: 'column', x: 350, y: 50, w: 320, h: 600, title: 'Tarefas da Semana', color: 'bg-gray-100/50 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800' },
        { id: '3', parentId: 'root', type: 'todo', x: 370, y: 120, w: 280, h: 200, title: 'Checklist de Lançamento', tasks: [{ id: 1, text: 'Revisar Copy', done: true }, { id: 2, text: 'Aprovar Imagens', done: false }], color: COLORS[5] },
        { id: '4', parentId: 'root', type: 'board', x: 700, y: 100, w: 160, h: 120, title: 'Projeto Alpha', color: 'bg-indigo-50 border-indigo-200 text-indigo-900' }
    ]);

    const [links, setLinks] = useState<any[]>([{ id: 'l1', boardId: 'root', from: '1', to: '4' }]);
    const [paths, setPaths] = useState<any[]>([]);

    // Interações e Drag
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDraggingElement, setIsDraggingElement] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    // Redimensionamento (Resize)
    const [isResizing, setIsResizing] = useState(false);
    const [resizeStart, setResizeStart] = useState<any>({ initialW: 0, initialH: 0, startX: 0, startY: 0 });

    // Guias Magnéticas
    const [guides, setGuides] = useState<any[]>([]);

    // Conexões (Setas)
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
        if (activeDocumentId) return;
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
    }, [activeDocumentId]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            return () => canvas.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

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

    const createElementAt = (type: string, x: number, y: number, imageSrc: string | null = null) => {
        tryPlaySound('success');
        let newEl: any = { id: Date.now().toString(), parentId: currentBoardId, type, x, y, content: '' };

        if (type === 'sticky') newEl = { ...newEl, w: 220, h: 220, color: COLORS[0] };
        else if (type === 'text') newEl = { ...newEl, w: 300, h: 'auto', color: 'text-gray-900 dark:text-white text-xl font-bold', content: 'Novo Texto' };
        else if (type === 'square' || type === 'circle') newEl = { ...newEl, w: 150, h: 150, color: COLORS[5] };
        else if (type === 'document') newEl = { ...newEl, w: 140, h: 160, title: 'Documento Sem Nome', color: 'bg-white border-gray-200' };
        else if (type === 'board') newEl = { ...newEl, w: 160, h: 120, title: 'Novo Board', color: 'bg-gray-100 border-gray-300 text-gray-800' };
        else if (type === 'image') newEl = { ...newEl, w: 300, h: 200, imageSrc, color: 'bg-transparent border-transparent' };
        else if (type === 'column') newEl = { ...newEl, w: 320, h: 600, title: 'Nova Coluna', color: 'bg-gray-100/50 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800' };
        else if (type === 'todo') newEl = { ...newEl, w: 280, h: 200, title: 'Tarefas', tasks: [{ id: 1, text: 'Nova tarefa', done: false }], color: COLORS[5] };

        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
        setActiveTool('cursor');
    };

    // ==========================================
    // ALINHAMENTO MAGNÉTICO (SMART GUIDES)
    // ==========================================
    const calculateSnaps = (targetX: number, targetY: number, targetW: number, skipId: string) => {
        let newX = targetX;
        let newY = targetY;
        let newGuides: any[] = [];
        const threshold = 10 / camera.z;
        const getNum = (val: any, fallback: number) => typeof val === 'number' ? val : fallback;

        currentElements.forEach(el => {
            if (el.id === skipId) return;
            const elW = getNum(el.w, 300);
            const tW = getNum(targetW, 300);

            // Vertical (Eixo X)
            if (Math.abs(targetX - el.x) < threshold) {
                newX = el.x; newGuides.push({ type: 'v', pos: el.x });
            } else if (Math.abs((targetX + tW) - (el.x + elW)) < threshold) {
                newX = el.x + elW - tW; newGuides.push({ type: 'v', pos: el.x + elW });
            }

            // Horizontal (Eixo Y)
            if (Math.abs(targetY - el.y) < threshold) {
                newY = el.y; newGuides.push({ type: 'h', pos: el.y });
            }
        });
        return { x: newX, y: newY, activeGuides: newGuides };
    };

    // ==========================================
    // PONTEIROS, ARRASTAR E REDIMENSIONAR
    // ==========================================
    const handlePointerDown = (e: React.PointerEvent, elementId: string | null = null) => {
        if (activeDocumentId) return;
        if ((e.target as HTMLElement).closest('.no-drag')) return; // Ignora cliques dentro de inputs ou listas

        if (activeTool === 'hand' || e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            return;
        }

        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

        if (activeTool === 'connect') {
            if (elementId) {
                e.stopPropagation();
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                setConnectingFrom(elementId);
                setTempArrowEnd({ x, y });
                tryPlaySound('tap');
            }
            return;
        }

        if (activeTool === 'draw' || activeTool === 'highlight') {
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setCurrentPath({ id: Date.now().toString(), boardId: currentBoardId, type: activeTool, color: drawColor, width: activeTool === 'highlight' ? 24 : drawWidth, points: [{ x, y }] });
            return;
        }

        if (activeTool === 'eraser') {
            e.stopPropagation();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setUndoStack(prev => [...prev, paths]);
            setRedoStack([]);
            setIsErasing(true);
            erasePathsAt(x, y);
            return;
        }

        if (elementId) {
            e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
            setSelectedId(elementId);
            setIsDraggingElement(true);
            const el = elements.find(el => el.id === elementId);
            setDragOffset({ x: x - el.x, y: y - el.y });
            tryPlaySound('tap');
        } else {
            setSelectedId(null);
        }
    };

    const handleResizeStart = (e: React.PointerEvent, id: string) => {
        e.stopPropagation(); (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setIsResizing(true); setSelectedId(id);
        const el = elements.find(e => e.id === id);
        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);
        setResizeStart({ initialW: el.w, initialH: el.h, startX: x, startY: y });
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (activeDocumentId) return;
        if (isPanning) { setCamera(c => ({ ...c, x: c.x + e.movementX, y: c.y + e.movementY })); return; }

        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

        if (connectingFrom) {
            setTempArrowEnd({ x, y });
        } else if (currentPath) {
            setCurrentPath((prev: any) => ({ ...prev, points: [...prev.points, { x, y }] }));
        } else if (activeTool === 'eraser' && isErasing) {
            erasePathsAt(x, y);
        } else if (isResizing && selectedId) {
            const deltaX = x - resizeStart.startX;
            const deltaY = y - resizeStart.startY;
            setElements(els => els.map(el => {
                if (el.id === selectedId) {
                    return { ...el, w: Math.max(100, resizeStart.initialW + deltaX), h: Math.max(50, resizeStart.initialH + deltaY) };
                }
                return el;
            }));
        } else if (isDraggingElement && selectedId) {
            const rawX = x - dragOffset.x;
            const rawY = y - dragOffset.y;
            const el = elements.find(e => e.id === selectedId);
            const snap = calculateSnaps(rawX, rawY, el.w, selectedId);
            setGuides(snap.activeGuides);
            setElements(els => els.map(e => e.id === selectedId ? { ...e, x: snap.x, y: snap.y } : e));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        setIsDraggingElement(false); setIsPanning(false); setIsErasing(false); setIsResizing(false); setGuides([]);

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
    // FUNÇÕES DE TO-DO E DESENHO
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
    // RENDERIZAÇÃO DE SETAS E GUIAS
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

            {/* Breadcrumb de Sub-boards */}
            {currentBoardId !== 'root' && (
                <div className="absolute top-6 left-24 z-40 flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-md border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg animate-in slide-in-from-top-4">
                    <button onClick={() => { tryPlaySound('tap'); setCurrentBoardId('root'); resetCamera(); }} className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                        <ArrowLeft size={14} /> Início
                    </button>
                    <span className="text-gray-300 dark:text-zinc-700">/</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white truncate max-w-[200px]">{parentBoard?.title}</span>
                </div>
            )}

            {/* TOOLBAR DE DESENHO (TOPO) */}
            {['draw', 'highlight', 'eraser'].includes(activeTool) && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <button onClick={() => { tryPlaySound('tap'); setActiveTool('draw'); }} className={`p-2 rounded-xl transition-colors ${activeTool === 'draw' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}><Pencil size={20} /></button>
                    <button onClick={() => { tryPlaySound('tap'); setActiveTool('highlight'); }} className={`p-2 rounded-xl transition-colors ${activeTool === 'highlight' ? 'bg-amber-100 text-amber-600' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}><Highlighter size={20} /></button>
                    <button onClick={() => { tryPlaySound('tap'); setActiveTool('eraser'); }} className={`p-2 rounded-xl transition-colors ${activeTool === 'eraser' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}><Eraser size={20} /></button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2"></div>
                    <div className="flex items-center gap-2 px-1">
                        <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-black/10 dark:border-white/10 p-0" />
                        <select value={drawWidth} onChange={(e) => setDrawWidth(Number(e.target.value))} disabled={activeTool === 'highlight'} className="bg-gray-50 dark:bg-zinc-900 text-sm font-bold text-gray-700 dark:text-zinc-300 rounded-lg px-2 py-1.5 outline-none cursor-pointer disabled:opacity-50">
                            <option value={2}>Fino</option><option value={4}>Normal</option><option value={8}>Grosso</option><option value={16}>Marcador</option>
                        </select>
                    </div>
                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2"></div>
                    <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50 disabled:opacity-30"><Undo2 size={20} /></button>
                    <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800/50 disabled:opacity-30"><Redo2 size={20} /></button>
                    <div className="w-px h-6 bg-transparent mx-2"></div>
                    <button onClick={() => { tryPlaySound('close'); setPaths([]); setUndoStack([]); setRedoStack([]); setActiveTool('cursor'); }} className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-xl">Descartar</button>
                    <button onClick={() => { tryPlaySound('success'); setActiveTool('cursor'); }} className="ml-2 px-6 py-2 text-sm font-bold bg-[#F05522] hover:bg-[#d94a1d] text-white rounded-xl shadow-md">Salvar</button>
                </div>
            )}

            {/* BARRA DE FERRAMENTAS ESQUERDA */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-2 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => { tryPlaySound('tap'); setActiveTool('cursor'); setSelectedId(null); }} title="Selecionar" className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'cursor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><MousePointer2 size={20} /></button>
                <button onClick={() => { tryPlaySound('tap'); setActiveTool('hand'); setSelectedId(null); }} title="Mover Canvas" className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'hand' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><Hand size={20} /></button>
                <button onClick={() => { tryPlaySound('tap'); setActiveTool('connect'); setSelectedId(null); }} title="Ligar Cartões" className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'connect' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><ArrowUpRight size={20} /></button>
                <button onClick={() => { tryPlaySound('tap'); setActiveTool('draw'); setSelectedId(null); }} title="Lápis & Marca Texto" className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${['draw', 'highlight', 'eraser'].includes(activeTool) ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><Pencil size={20} /></button>
                <div className="w-full h-px bg-gray-200 dark:bg-zinc-800 my-1 shrink-0"></div>
                {[
                    { id: 'board', icon: FolderOpen, label: 'Novo Sub-Board (Arraste)' },
                    { id: 'column', icon: Columns, label: 'Coluna Kanban (Arraste)' },
                    { id: 'todo', icon: ListTodo, label: 'Lista de Tarefas (Arraste)' },
                    { id: 'document', icon: FileText, label: 'Documento (Arraste)' },
                    { id: 'sticky', icon: StickyNote, label: 'Nota (Arraste)' },
                    { id: 'text', icon: Type, label: 'Texto (Arraste)' },
                    { id: 'square', icon: Square, label: 'Quadrado (Arraste)' },
                    { id: 'image', icon: ImageIcon, label: 'Upload Imagem (Arraste)' },
                ].map((tool) => (
                    <div key={tool.id} draggable onDragStart={(e) => handleDragStartTool(e, tool.id)} title={tool.label} className="p-3 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-all ios-btn text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-indigo-600 shrink-0">
                        <tool.icon size={20} strokeWidth={2} />
                    </div>
                ))}
            </div>

            {/* CONTROLES DE CÂMERA */}
            <div className="absolute right-6 bottom-6 z-40 flex items-center gap-1 p-1 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl">
                <button onClick={zoomOut} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"><ZoomOut size={16} /></button>
                <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 w-12 text-center font-mono">{Math.round(camera.z * 100)}%</span>
                <button onClick={zoomIn} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"><ZoomIn size={16} /></button>
                <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
                <button onClick={resetCamera} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"><Maximize size={16} /></button>
            </div>

            {/* ÁREA DO CANVAS INFINITA */}
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

                    {/* Smart Guides */}
                    {guides.map((g, i) => g.type === 'v'
                        ? <div key={i} className="absolute top-[-5000px] w-px h-[10000px] bg-indigo-500/50 z-50 pointer-events-none" style={{ left: g.pos }} />
                        : <div key={i} className="absolute left-[-5000px] h-px w-[10000px] bg-indigo-500/50 z-50 pointer-events-none" style={{ top: g.pos }} />
                    )}

                    {/* Desenhos e Setas (Fundo: z-0) */}
                    <svg className="absolute pointer-events-none z-0" style={{ top: 0, left: 0, width: 1, height: 1, overflow: 'visible' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" /></marker>
                        </defs>
                        {renderArrows()}
                        {currentPaths.map(p => (<path key={p.id} d={createPathData(p.points)} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={p.type === 'highlight' ? 0.3 : 1} />))}
                        {currentPath && (<path d={createPathData(currentPath.points)} stroke={currentPath.color} strokeWidth={currentPath.width} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeOpacity={currentPath.type === 'highlight' ? 0.3 : 1} />)}
                    </svg>

                    {/* Elementos/Cartões (z-10, ou z-40 se selecionado) */}
                    {currentElements.map((el) => {
                        const isSelected = selectedId === el.id;
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
                                    if (el.type === 'document') { tryPlaySound('open'); setActiveDocumentId(el.id); }
                                    else if (el.type === 'board') { tryPlaySound('open'); setCurrentBoardId(el.id); resetCamera(); }
                                }}
                                className={`absolute group touch-none origin-top-left ${el.type === 'text' || el.type === 'image' ? '' : 'shadow-sm'} ${isSelected || (isHovered && activeTool === 'connect') ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent shadow-xl' : ''} ${zIndex}`}
                                style={{
                                    left: el.x, top: el.y, width: el.type === 'text' ? 'auto' : el.w, height: el.type === 'text' ? 'auto' : el.h, minWidth: el.type === 'text' ? 100 : undefined, borderRadius: el.type === 'circle' ? '50%' : '12px',
                                }}
                            >
                                {/* Menu Contextual Flutuante */}
                                {isSelected && activeTool === 'cursor' && (
                                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white dark:bg-[#111114] p-1.5 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex items-center gap-1 animate-in zoom-in-95 duration-100 z-50">
                                        {el.type !== 'text' && el.type !== 'document' && el.type !== 'board' && el.type !== 'image' && el.type !== 'column' && (
                                            <div className="flex gap-1 pr-2 border-r border-gray-100 dark:border-zinc-800 mr-1">
                                                {COLORS.map((c, i) => (
                                                    <button key={i} onClick={(e) => { e.stopPropagation(); setElements(els => els.map(old => old.id === el.id ? { ...old, color: c } : old)); tryPlaySound('tap'); }} className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 ${c.split(' ')[0]} hover:scale-110 transition-transform`} />
                                                ))}
                                            </div>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setElements(els => els.filter(old => old.id !== el.id)); setSelectedId(null); tryPlaySound('close'); }} className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                )}

                                {/* Resize Handle */}
                                {isSelected && activeTool === 'cursor' && el.type !== 'text' && (
                                    <div
                                        onPointerDown={(e) => handleResizeStart(e, el.id)}
                                        className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 shadow-sm hover:scale-125 transition-transform"
                                    />
                                )}

                                {/* CONTEÚDO DOS CARTÕES */}
                                <div className={`w-full h-full flex flex-col overflow-hidden border ${el.type === 'document' || el.type === 'image' || el.type === 'text' ? 'border-transparent' : el.color} ${el.type === 'circle' ? 'rounded-full' : 'rounded-xl'}`}>

                                    {el.type === 'column' && (
                                        <div className="w-full h-full flex flex-col p-4 pointer-events-none">
                                            <input value={el.title} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, title: e.target.value } : old))} className="no-drag w-full bg-transparent font-black text-sm outline-none uppercase tracking-widest text-gray-500 mb-4 pointer-events-auto" placeholder="Nome da Coluna" />
                                        </div>
                                    )}

                                    {el.type === 'todo' && (
                                        <div className="w-full h-full flex flex-col p-4 cursor-default no-drag">
                                            <input value={el.title} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, title: e.target.value } : old))} className="w-full bg-transparent font-black text-sm outline-none mb-3" placeholder="Título da Lista" />
                                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                                {el.tasks && el.tasks.map((task: any) => (
                                                    <div key={task.id} className="flex items-start gap-2 group">
                                                        <button onClick={(e) => { e.stopPropagation(); toggleTask(el.id, task.id); }} className={`mt-0.5 shrink-0 transition-colors ${task.done ? 'text-emerald-500' : 'text-gray-400 hover:text-indigo-500'}`}>
                                                            {task.done ? <CheckSquare size={16} /> : <Square size={16} />}
                                                        </button>
                                                        <input value={task.text} onChange={(e) => updateTaskText(el.id, task.id, e.target.value)} className={`flex-1 bg-transparent text-sm outline-none ${task.done ? 'line-through text-gray-400 opacity-60' : 'text-gray-800 dark:text-zinc-200'}`} placeholder="Nova tarefa..." />
                                                        <button onClick={(e) => { e.stopPropagation(); deleteTask(el.id, task.id); }} className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); addTask(el.id); }} className="mt-3 flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"><Plus size={14} /> Adicionar Item</button>
                                        </div>
                                    )}

                                    {el.type === 'board' && (
                                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors">
                                            <FolderOpen size={42} className="text-indigo-500 mb-3" strokeWidth={1.5} />
                                            <input value={el.title} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, title: e.target.value } : old))} className="no-drag w-full bg-transparent text-center font-black text-sm outline-none" placeholder="Nome do Board" />
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
                                            <textarea value={el.content} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, content: e.target.value } : old))} placeholder="Escreva..." className="no-drag w-full h-full bg-transparent resize-none outline-none text-sm font-medium leading-relaxed custom-scrollbar placeholder-current/50" style={{ color: 'inherit' }} />
                                        </div>
                                    )}

                                    {el.type === 'text' && (
                                        <textarea value={el.content} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, content: e.target.value } : old))} placeholder="Texto..." rows={1} className={`no-drag bg-transparent border-none resize-none outline-none whitespace-pre-wrap overflow-hidden p-2 hover:bg-black/5 dark:hover:bg-white/5 focus:bg-transparent ${el.color}`} style={{ height: 'auto' }} onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                                    )}

                                    {(el.type === 'square' || el.type === 'circle') && (
                                        <div className="w-full h-full flex items-center justify-center p-4">
                                            <textarea value={el.content} onChange={(e) => setElements(els => els.map(old => old.id === el.id ? { ...old, content: e.target.value } : old))} placeholder="Texto..." className="no-drag w-full bg-transparent resize-none outline-none text-center font-bold text-sm" style={{ color: 'inherit' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* =========================================
          MODAL: EDITOR DE DOCUMENTOS (RICH TEXT)
          ========================================= */}
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
