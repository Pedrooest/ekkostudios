import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DatabaseService } from '../DatabaseService';
import { WhiteboardElement, WhiteboardConnection } from '../types';
import {
    MousePointer2, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, Maximize,
    Type, StickyNote, Link2, Plus, GripHorizontal, ArrowUpRight,
    Hand, PenTool, Eraser, CheckSquare, Folder, Square, FileText, ChevronRight
} from 'lucide-react';

const COLORS = [
    'bg-amber-200 text-amber-900', // Yellow
    'bg-rose-200 text-rose-900',   // Pink
    'bg-blue-200 text-blue-900',   // Blue
    'bg-emerald-200 text-emerald-900', // Green
    'bg-purple-200 text-purple-900',   // Purple
    'bg-orange-200 text-orange-900',   // Orange
];

interface WhiteboardProps {
    workspaceId?: string;
}

export function Whiteboard({ workspaceId }: WhiteboardProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persist Engine
    const [elements, setElements] = useState<WhiteboardElement[]>([]);
    const [connections, setConnections] = useState<WhiteboardConnection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Breadcrumbs (Nested Boards)
    const [activeBoard, setActiveBoard] = useState<{ id: string, name: string }[]>([{ id: 'root', name: 'Board principal' }]);
    const currentBoardId = activeBoard[activeBoard.length - 1].id;

    // View Filters
    const visibleElements = elements.filter(e => (e.parentId || 'root') === currentBoardId);
    const visibleConnections = connections.filter(c => (c.parentId || 'root') === currentBoardId);

    // Canvas State
    const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    
    // Tools
    type ToolType = 'cursor' | 'pan' | 'connect' | 'pen' | 'eraser';
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

    // Play UI Sound
    const tryPlaySound = useCallback((type: 'tap' | 'close' | 'success') => {
        try {
            if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
        } catch (e) {
            console.warn("Sound engine error:", e);
        }
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
                    setElements(board.elements || []);
                    setConnections(board.connections || []);
                }
            } catch (error) {
                console.error("Failed to load whiteboard", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadBoard();
        return () => window.removeEventListener('resize', handleResize);
    }, [workspaceId]);

    // 2. Auto-save Engine
    useEffect(() => {
        if (isLoading || !workspaceId) return;
        
        setSaveStatus('saving');
        const timeoutId = setTimeout(async () => {
            try {
                await DatabaseService.saveWhiteboard(workspaceId, elements, connections);
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error("Failed to auto-save whiteboard", error);
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
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('wheel', handleWheel, { passive: false });
            return () => canvas.removeEventListener('wheel', handleWheel);
        }
    }, [handleWheel]);

    const resetCamera = () => { tryPlaySound('tap'); setCamera({ x: 0, y: 0, z: 1 }); };
    const zoomIn = () => { tryPlaySound('tap'); setCamera(c => ({ ...c, z: Math.min(c.z + 0.2, 3) })); };
    const zoomOut = () => { tryPlaySound('tap'); setCamera(c => ({ ...c, z: Math.max(c.z - 0.2, 0.1) })); };

    // =====================================
    // CREATION
    // =====================================
    const generateId = () => Math.random().toString(36).substring(2, 9);

    const createElement = (type: WhiteboardElement['type'], forceX?: number, forceY?: number, extraMeta?: any) => {
        tryPlaySound('success');
        const bounds = canvasRef.current?.getBoundingClientRect();
        
        let cx = forceX;
        let cy = forceY;
        if (cx === undefined || cy === undefined) {
             cx = bounds ? (bounds.width / 2 - camera.x) / camera.z : 100;
             cy = bounds ? (bounds.height / 2 - camera.y) / camera.z : 100;
        }

        let newEl: WhiteboardElement = {
            id: generateId(),
            parentId: currentBoardId,
            type,
            x: cx,
            y: cy,
            w: 220,
            h: 220,
            content: '',
            ...extraMeta
        };

        if (type === 'postit') {
            newEl.color = COLORS[0];
            newEl.content = 'Nova nota';
        } else if (type === 'card' || type === 'image') {
            newEl.type = 'card';
            newEl.w = 300;
            newEl.h = 'auto' as any;
            newEl.title = 'Novo Cartão';
            newEl.content = 'Escreva aqui...';
            newEl.color = 'bg-white text-gray-900 border border-gray-200';
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

        setElements(prev => [...prev, newEl]);
        
        if (type !== 'drawing') {
            setSelectedIds([newEl.id]);
            if (activeTool !== 'pen') setActiveTool('cursor');
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const x = pendingImagePos?.x || undefined;
                const y = pendingImagePos?.y || undefined;
                createElement('image', x, y, { imageSrc: ev.target?.result as string });
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

        // Eraser Mode
        if (activeTool === 'eraser' && elementId) {
            const el = elements.find(el => el.id === elementId);
            if (el?.type === 'drawing') {
                deleteElement(elementId);
                tryPlaySound('close');
            }
            return;
        }

        // Element Drag
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
                initialElements: selectedEls.map(el => ({ id: el.id, initialX: el.x, initialY: el.y }))
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

        if (isPanning) {
            setCamera(c => ({ ...c, x: c.x + e.movementX, y: c.y + e.movementY }));
            return;
        }

        if (activeTool === 'pen' && currentDrawPath) {
            setCurrentDrawPath(prev => prev + ` L ${x} ${y}`);
            return;
        }

        if (connectingFrom) {
            setTempArrowEnd({ x, y });
            return;
        }

        if (isResizing && resizeInfo) {
            const deltaX = x - resizeInfo.startX;
            const deltaY = y - resizeInfo.startY;
            setElements(els => els.map(el => {
                if (el.id === isResizing) {
                    return { ...el, w: Math.max(100, resizeInfo.initialW + deltaX), h: Math.max(50, resizeInfo.initialH + deltaY) };
                }
                return el;
            }));
            return;
        }

        if (isDragging && dragInfo) {
            const deltaX = x - dragInfo.startX;
            const deltaY = y - dragInfo.startY;
            setElements(els => els.map(el => {
                const initial = dragInfo.initialElements.find(i => i.id === el.id);
                if (initial) {
                    return { ...el, x: initial.initialX + deltaX, y: initial.initialY + deltaY };
                }
                return el;
            }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);

        if (activeTool === 'pen' && currentDrawPath) {
            createElement('drawing', 0, 0, { path: currentDrawPath, color: penSettings.color, thickness: penSettings.thickness, w: 0, h: 0 });
            setCurrentDrawPath(null);
        }

        if (connectingFrom) {
            if (hoveredElementId && hoveredElementId !== connectingFrom) {
                tryPlaySound('success');
                setConnections(prev => [...prev, { id: generateId(), from: connectingFrom, to: hoveredElementId, parentId: currentBoardId }]);
            }
            setConnectingFrom(null);
            setTempArrowEnd(null);
        }

        setIsPanning(false);
        setIsDragging(false);
        setIsResizing(null);
        setDragInfo(null);
        setResizeInfo(null);
    };

    // =====================================
    // OPERATIONS
    // =====================================
    const updateElement = (id: string, updates: Partial<WhiteboardElement>) => {
        setElements(els => els.map(el => el.id === id ? { ...el, ...updates } : el));
    };

    const deleteElement = (id: string) => {
        setElements(els => els.filter(el => el.id !== id));
        setConnections(cons => cons.filter(c => c.from !== id && c.to !== id));
    };

    const deleteSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        tryPlaySound('close');
        setElements(els => els.filter(el => !selectedIds.includes(el.id)));
        setConnections(cons => cons.filter(c => !selectedIds.includes(c.from) && !selectedIds.includes(c.to)));
        setSelectedIds([]);
    };

    const execCommand = (e: React.MouseEvent, cmd: string, val: string | undefined = undefined) => {
        e.preventDefault();
        document.execCommand(cmd, false, val);
    };

    // =====================================
    // RENDERERS
    // =====================================
    const renderConnections = () => {
        const activeConnections = [...visibleConnections];
        if (connectingFrom && tempArrowEnd) {
            activeConnections.push({ id: 'temp', from: connectingFrom, to: 'temp' });
        }

        return activeConnections.map(conn => {
            const fromEl = visibleElements.find(e => e.id === conn.from);
            const toEl = conn.to === 'temp' ? { x: tempArrowEnd!.x, y: tempArrowEnd!.y, w: 0, h: 0 } as any : visibleElements.find(e => e.id === conn.to);
            if (!fromEl || !toEl) return null;

            const w1 = typeof fromEl.w === 'number' ? fromEl.w : 150;
            const h1 = typeof fromEl.h === 'number' ? fromEl.h : 50;
            const w2 = typeof toEl.w === 'number' ? toEl.w : 150;
            const h2 = typeof toEl.h === 'number' ? toEl.h : 50;

            const x1 = fromEl.x + w1 / 2;
            const y1 = fromEl.y + h1 / 2;
            const x2 = toEl.x + w2 / 2;
            const y2 = toEl.y + h2 / 2;

            const d = `M ${x1} ${y1} C ${x1 + (x2 - x1) / 2} ${y1}, ${x1 + (x2 - x1) / 2} ${y2}, ${x2} ${y2}`;

            return (
                <g key={conn.id}>
                    <path d={d} fill="none" stroke={document.documentElement.classList.contains('dark') ? "#6b7280" : "#9ca3af"} strokeWidth="3" strokeDasharray={conn.id === 'temp' ? "5,5" : "none"} markerEnd="url(#arrowhead)" />
                    {conn.id !== 'temp' && activeTool === 'cursor' && (
                        <path d={d} fill="none" stroke="transparent" strokeWidth="20" className="cursor-pointer hover:stroke-rose-500/30 transition-colors" onClick={(e) => { e.stopPropagation(); setConnections(cs => cs.filter(c => c.id !== conn.id)); tryPlaySound('close'); }} />
                    )}
                </g>
            );
        });
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-[#0a0a0c] font-sans flex flex-col">
            
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            {/* BREADCRUMBS & AUTO SAVE */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
                {/* Autosave HUD */}
                <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold shadow-sm">
                    {isLoading ? <span className="text-gray-500 animate-pulse">Carregando...</span> : saveStatus === 'saving' ? <span className="text-amber-500 animate-pulse">Salvando Workspace...</span> : saveStatus === 'saved' ? <span className="text-emerald-500">Salvo!</span> : <span className="text-gray-400">Mapa Mental Ativo</span>}
                </div>
                
                {/* Breadcrumbs HUD */}
                <div className="flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                    {activeBoard.map((board, ii) => (
                        <React.Fragment key={board.id}>
                            <button onClick={() => { setActiveBoard(prev => prev.slice(0, ii + 1)); resetCamera(); }} className={`hover:text-indigo-500 transition-colors ${ii === activeBoard.length - 1 ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-zinc-400'}`}>
                                {board.name}
                            </button>
                            {ii < activeBoard.length - 1 && <ChevronRight size={14} className="text-gray-300 dark:text-zinc-700" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* PEN COLOR SELECTION HUD */}
            {activeTool === 'pen' && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-in slide-in-from-top-2">
                    {['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#000000', '#ffffff'].map((c, i) => (
                        <button key={i} onClick={() => setPenSettings(p => ({ ...p, color: c }))} className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 transition-transform ${penSettings.color === c ? 'scale-125 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-black ring-indigo-500' : 'hover:scale-110'} ios-btn`} style={{ backgroundColor: c }} />
                    ))}
                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1"></div>
                    <input type="range" min="1" max="20" value={penSettings.thickness} onChange={(e) => setPenSettings(p => ({ ...p, thickness: parseInt(e.target.value) }))} className="w-24" />
                </div>
            )}

            {/* SELECTION MENU */}
            {selectedIds.length > 0 && activeTool === 'cursor' && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-in slide-in-from-top-2">
                    {elements.find(e => e.id === selectedIds[0])?.type === 'postit' && (
                        <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-800">
                            {COLORS.map((c, i) => (
                                <button key={i} onClick={() => updateElement(selectedIds[0], { color: c })} className={`w-6 h-6 rounded-full border border-black/10 transition-transform hover:scale-110 ios-btn ${c.split(' ')[0]}`} />
                            ))}
                        </div>
                    )}
                    <button onClick={deleteSelection} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors ios-btn">
                        <Trash2 size={18} />
                    </button>
                    {elements.find(e => e.id === selectedIds[0])?.type === 'folder' && (
                        <button onClick={() => { 
                            const fw = elements.find(e => e.id === selectedIds[0]); 
                            if(fw) setActiveBoard(prev => [...prev, { id: fw.id, name: fw.title || 'Pasta' }]); 
                            resetCamera(); 
                            setSelectedIds([]); 
                        }} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl font-bold flex gap-2 items-center text-xs ml-2 border-l border-gray-200 dark:border-zinc-800 pl-4">
                            Entrar na Pasta <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* FULL MILANOTE TOOLBAR (Floating Bottom/Left) */}
            <div className={`absolute z-40 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 shadow-2xl transition-all
                ${isMobile 
                    ? 'bottom-6 left-4 right-4 flex-row overflow-x-auto no-scrollbar rounded-2xl p-2' 
                    : 'left-6 top-1/2 -translate-y-1/2 flex-col gap-2 p-2 rounded-2xl h-auto max-h-[80vh] overflow-y-auto custom-scrollbar'}
            `}>
                <div className={`flex ${isMobile ? 'flex-row gap-1' : 'flex-col gap-1'}`}>
                    
                    {/* Selectors & Nav */}
                    <button onClick={() => { setActiveTool('cursor'); tryPlaySound('tap'); }} className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'cursor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Cursor"><MousePointer2 size={18} /></button>
                    <button onClick={() => { setActiveTool('pan'); setSelectedIds([]); tryPlaySound('tap'); }} className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'pan' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Pan (Mover View)"><Hand size={18} /></button>
                    
                    <div className={`${isMobile ? 'w-px h-full mx-1' : 'h-px w-full my-1'} bg-gray-200 dark:bg-zinc-800 shrink-0`}></div>
                    
                    {/* Line based tools */}
                    <button onClick={() => { setActiveTool('connect'); setSelectedIds([]); tryPlaySound('tap'); }} className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'connect' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Conectar"><ArrowUpRight size={18} /></button>
                    <button onClick={() => { setActiveTool('pen'); setSelectedIds([]); tryPlaySound('tap'); }} className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'pen' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Caneta Livre"><PenTool size={18} /></button>
                    <button onClick={() => { setActiveTool('eraser'); setSelectedIds([]); tryPlaySound('tap'); }} className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'eraser' ? 'bg-rose-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Borracha"><Eraser size={18} /></button>

                    <div className={`${isMobile ? 'w-px h-full mx-1' : 'h-px w-full my-1'} bg-gray-200 dark:bg-zinc-800 shrink-0`}></div>

                    {/* Content Adders */}
                    <button onClick={() => createElement('postit')} title="Nota (Post-it)" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><StickyNote size={18} /></button>
                    <button onClick={() => createElement('task')} title="Tarefas" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><CheckSquare size={18} /></button>
                    <button onClick={() => createElement('text')} title="Texto" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><Type size={18} /></button>
                    <button onClick={() => fileInputRef.current?.click()} title="Imagem" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><ImageIcon size={18} /></button>
                    <button onClick={() => addLink()} title="Link" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><Link2 size={18} /></button>

                    <div className={`${isMobile ? 'w-px h-full mx-1' : 'h-px w-full my-1'} bg-gray-200 dark:bg-zinc-800 shrink-0`}></div>

                    {/* Structures */}
                    <button onClick={() => createElement('folder')} title="Pasta (Sub-board)" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><Folder size={18} /></button>
                    <button onClick={() => createElement('frame')} title="Frame / Zona" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><Square size={18} /></button>
                    <button onClick={() => createElement('document')} title="Documento" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><FileText size={18} /></button>
                </div>
            </div>

            {/* CAMERA CONTROLS */}
            <div className={`absolute ${isMobile ? 'right-4 top-4 mt-12' : 'right-6 bottom-6'} z-40 flex items-center gap-1 p-1 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl pointer-events-auto`}>
                <button onClick={zoomOut} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg ios-btn"><ZoomOut size={16} /></button>
                {!isMobile && <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 w-12 text-center font-mono">{Math.round(camera.z * 100)}%</span>}
                <button onClick={zoomIn} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg ios-btn"><ZoomIn size={16} /></button>
                <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
                <button onClick={resetCamera} title="Centralizar" className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg ios-btn"><Maximize size={16} /></button>
            </div>

            {/* MAIN CANVAS */}
            <div
                ref={canvasRef}
                className={`w-full flex-1 overflow-hidden touch-none ${activeTool === 'pan' || isPanning ? 'cursor-grabbing' : activeTool === 'connect' ? 'cursor-crosshair' : activeTool === 'pen' ? 'cursor-edit' : activeTool === 'eraser' ? 'cursor-not-allowed' : 'cursor-default'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{
                    backgroundImage: `radial-gradient(circle, ${document.documentElement.classList.contains('dark') ? '#ffffff1a' : '#0000001a'} ${1.5 * camera.z}px, transparent ${1.5 * camera.z}px)`,
                    backgroundSize: `${25 * camera.z}px ${25 * camera.z}px`,
                    backgroundPosition: `${camera.x}px ${camera.y}px`,
                }}
            >
                <div className="absolute inset-0 origin-top-left" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})` }}>
                    
                    {/* DRAWING / CONNECTIONS LAYER */}
                    <svg className="absolute pointer-events-none z-0" style={{ top: 0, left: 0, width: 1, height: 1, overflow: 'visible' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={document.documentElement.classList.contains('dark') ? "#6b7280" : "#9ca3af"} />
                            </marker>
                        </defs>
                        {renderConnections()}
                        
                        {/* Live drawing path */}
                        {currentDrawPath && (
                            <path d={currentDrawPath} fill="none" stroke={penSettings.color} strokeWidth={penSettings.thickness} strokeLinecap="round" strokeLinejoin="round" />
                        )}

                        {/* Saved drawing paths */}
                        {visibleElements.filter(e => e.type === 'drawing').map(el => (
                            <path 
                                key={el.id} 
                                d={el.path!} 
                                fill="none" 
                                stroke={el.color || '#000'} 
                                strokeWidth={el.thickness || 3} 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                onClick={(e) => {
                                    if(activeTool === 'eraser') {
                                        e.stopPropagation();
                                        deleteElement(el.id);
                                        tryPlaySound('close');
                                    }
                                }}
                                style={{ pointerEvents: activeTool === 'eraser' ? 'stroke' : 'none', cursor: activeTool === 'eraser' ? 'crosshair' : 'default' }}
                                className={activeTool === 'eraser' ? 'hover:opacity-50 transition-opacity' : ''}
                            />
                        ))}
                    </svg>

                    {/* Nodes Loop (We render frames first so they act as backgrounds) */}
                    {[...visibleElements].sort((a, b) => (a.type === 'frame' ? -1 : 1)).map((el) => {
                        if (el.type === 'drawing') return null; // handled in SVG
                        
                        const isSelected = selectedIds.includes(el.id);
                        const isFrame = el.type === 'frame';

                        // Shared CSS bases. Frames have pointer-events-none in their center.
                        const baseClasses = `absolute origin-top-left group ${isSelected && activeTool === 'cursor' ? 'ring-2 ring-indigo-500 shadow-2xl z-20' : (isFrame ? 'z-0' : 'shadow-xl z-10')} transition-shadow`;

                        const ResizeHandle = () => isSelected && activeTool === 'cursor' ? (
                            <div onPointerDown={(e) => handleResizeStart(e, el)} className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-50 pointer-events-auto" />
                        ) : null;

                        // RENDER: POST-IT
                        if (el.type === 'postit') {
                            return (
                                <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto`} style={{ left: el.x, top: el.y, width: el.w, height: el.h }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    <ResizeHandle />
                                    <div className={`w-full h-full p-6 shadow-md relative overflow-hidden transition-colors ${el.color || COLORS[0]}`}>
                                        <div className="absolute top-0 left-0 w-full h-2 bg-black/10 dark:bg-white/10" />
                                        <textarea value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} className="no-drag w-full h-full bg-transparent resize-none outline-none text-base font-medium leading-relaxed custom-scrollbar" style={{ color: 'inherit' }} />
                                    </div>
                                </div>
                            );
                        }

                        // RENDER: TEXT
                        if (el.type === 'text') {
                            return (
                                <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto`} style={{ left: el.x, top: el.y, minWidth: 150 }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    <textarea value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} rows={1} className="no-drag w-full bg-transparent border-none resize-none outline-none whitespace-pre-wrap overflow-hidden p-3 font-black text-2xl text-gray-900 dark:text-white" onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                                </div>
                            );
                        }

                        // RENDER: FOLDER
                        if (el.type === 'folder') {
                            return (
                                <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center gap-3 cursor-pointer`} style={{ left: el.x, top: el.y, width: el.w, height: el.h }} onDoubleClick={() => { setActiveBoard(prev => [...prev, { id: el.id, name: el.title || 'Pasta' }]); resetCamera(); }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    <Folder className="text-indigo-500 w-8 h-8 pointer-events-none" />
                                    <input value={el.title} onChange={(e) => updateElement(el.id, { title: e.target.value })} className="no-drag font-black text-gray-900 dark:text-white bg-transparent outline-none w-2/3 truncate" onClick={e => e.stopPropagation()} />
                                </div>
                            );
                        }

                        // RENDER: FRAME
                        if (el.type === 'frame') {
                            return (
                                <div key={el.id} className={`${baseClasses} bg-transparent pointer-events-none border-2 border-dashed border-gray-400/50 dark:border-zinc-700 rounded-3xl`} style={{ left: el.x, top: el.y, width: el.w, height: el.h }}>
                                    <div className="absolute top-0 left-0 bg-gray-400/20 dark:bg-zinc-800 backdrop-blur-md px-4 py-2 rounded-br-2xl rounded-tl-xl pointer-events-auto cursor-grab active:cursor-grabbing border-b border-r border-gray-300/30 font-bold" onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                        <input value={el.title} onChange={(e) => updateElement(el.id, { title: e.target.value })} className="bg-transparent outline-none w-32 border-none text-gray-600 dark:text-gray-300 no-drag" onClick={e => e.stopPropagation()}/>
                                    </div>
                                    <ResizeHandle />
                                </div>
                            );
                        }

                        // RENDER: DOCUMENT (Rich Text Box)
                        if (el.type === 'document') {
                            return (
                                <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col shadow-xl overflow-hidden group`} style={{ left: el.x, top: el.y, width: el.w, height: el.h }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    {/* Floating Rich Text Toolbar (appears on hover near top) */}
                                    {isSelected && activeTool === 'cursor' && (
                                        <div className="absolute -top-12 left-0 right-0 flex justify-center no-drag">
                                            <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl rounded-xl flex items-center p-1 gap-1 text-gray-700 dark:text-gray-200">
                                                <button onClick={(e) => execCommand(e, 'bold')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded font-bold">B</button>
                                                <button onClick={(e) => execCommand(e, 'italic')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded italic">I</button>
                                                <button onClick={(e) => execCommand(e, 'underline')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded underline">U</button>
                                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                                <button onClick={(e) => execCommand(e, 'formatBlock', 'H1')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded font-bold">H1</button>
                                                <button onClick={(e) => execCommand(e, 'formatBlock', 'H2')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded font-bold">H2</button>
                                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                                <button onClick={(e) => execCommand(e, 'insertUnorderedList')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">•</button>
                                                <button onClick={(e) => execCommand(e, 'insertOrderedList')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded">1.</button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-full h-8 bg-gray-100 dark:bg-black/40 border-b border-gray-200 dark:border-zinc-800 drag-handle cursor-grab flex items-center px-4 shrink-0">
                                        <FileText size={14} className="text-gray-400 mr-2" />
                                        <span className="text-xs font-bold text-gray-500">Documento</span>
                                    </div>
                                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar no-drag bg-white dark:bg-zinc-900">
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => updateElement(el.id, { htmlContent: e.currentTarget.innerHTML })}
                                            className="w-full h-full outline-none prose dark:prose-invert max-w-none text-sm"
                                            dangerouslySetInnerHTML={{ __html: el.htmlContent || '' }}
                                        />
                                    </div>
                                    <ResizeHandle />
                                </div>
                            );
                        }

                        // RENDER: TASK (Checklist)
                        if (el.type === 'task') {
                            return (
                                <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col shadow-xl overflow-hidden group p-4`} style={{ left: el.x, top: el.y, width: el.w, height: el.h }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    <input value={el.title} onChange={(e) => updateElement(el.id, { title: e.target.value })} className="no-drag font-black text-gray-900 dark:text-white bg-transparent outline-none mb-3 text-lg" placeholder="Tarefas" />
                                    <div className="flex-1 overflow-y-auto no-drag custom-scrollbar pr-2 flex flex-col gap-2">
                                        {el.tasks?.map((tsk, i) => (
                                            <div key={tsk.id} className="flex items-center gap-2 group/task">
                                                <input type="checkbox" checked={tsk.done} onChange={(e) => {
                                                    const newTasks = [...(el.tasks || [])];
                                                    newTasks[i].done = e.target.checked;
                                                    updateElement(el.id, { tasks: newTasks });
                                                }} className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-600" />
                                                <input value={tsk.text} onChange={(e) => {
                                                    const newTasks = [...(el.tasks || [])];
                                                    newTasks[i].text = e.target.value;
                                                    updateElement(el.id, { tasks: newTasks });
                                                }} className={`bg-transparent outline-none flex-1 text-sm ${tsk.done ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`} />
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => updateElement(el.id, { tasks: [...(el.tasks || []), { id: generateId(), text: 'Nova tarefa', done: false }] })} className="no-drag mt-3 text-sm text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-1 justify-center py-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                                        <Plus size={14} /> Adicionar Item
                                    </button>
                                    <ResizeHandle />
                                </div>
                            );
                        }

                        // RENDER: CARD & IMAGE
                        if (el.type === 'card' || el.type === 'image') {
                            return (
                                <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col shadow-xl overflow-hidden group`} style={{ left: el.x, top: el.y, width: el.w, minHeight: 150 }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    {el.imageSrc && <img src={el.imageSrc} alt="Preview" className="w-full h-40 object-cover pointer-events-none" />}
                                    <div className="p-4 flex flex-col gap-2 flex-1">
                                        <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })} placeholder="Título" className="no-drag w-full font-black text-gray-900 dark:text-white bg-transparent outline-none" />
                                        <textarea value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} placeholder="Escreva os detalhes aqui..." className="no-drag w-full flex-1 min-h-[40px] text-sm text-gray-600 dark:text-zinc-400 bg-transparent resize-none outline-none custom-scrollbar" />
                                    </div>
                                    <ResizeHandle />
                                </div>
                            );
                        }

                        // RENDER: LINK
                        if (el.type === 'link') {
                            return (
                                <div key={el.id} className={`${baseClasses} touch-none pointer-events-auto rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 flex gap-4 min-w-[300px] items-center`} style={{ left: el.x, top: el.y }} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Link2 className="text-indigo-500" />
                                    </div>
                                    <div className="flex flex-col flex-1 overflow-hidden">
                                        <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })} className="no-drag font-black text-sm text-gray-900 dark:text-white bg-transparent outline-none w-full" placeholder="Título" />
                                        <a href={el.content || el.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline truncate no-drag" onPointerDown={e => e.stopPropagation()}>{el.content || el.url}</a>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}
                </div>
            </div>
        </div>
    );
}
