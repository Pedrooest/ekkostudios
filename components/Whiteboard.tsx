import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DatabaseService } from '../DatabaseService';
import { WhiteboardElement, WhiteboardConnection } from '../types';
import {
    MousePointer2, Image as ImageIcon, Trash2, ZoomIn, ZoomOut, Maximize,
    Type, StickyNote, Link2, Plus, GripHorizontal, ArrowUpRight
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

    // Canvas State
    const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [activeTool, setActiveTool] = useState<'cursor' | 'connect'>('cursor');

    // Interaction State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPanning, setIsPanning] = useState(false);
    
    // Drag/Resize State
    const [isDragging, setIsDragging] = useState(false);
    const [dragInfo, setDragInfo] = useState<{ startX: number, startY: number, initialElements: any[] } | null>(null);
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const [resizeInfo, setResizeInfo] = useState<{ startX: number, startY: number, initialW: number, initialH: number } | null>(null);

    // Connection State
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
    const [tempArrowEnd, setTempArrowEnd] = useState<{ x: number, y: number } | null>(null);
    const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
    const [pendingImagePos, setPendingImagePos] = useState<{ x: number, y: number } | null>(null);

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
                } else {
                    setElements([]);
                    setConnections([]);
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

    // 2. Auto-save Engine (Debounce)
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
            // Zoom
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
            // Pan
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

    const resetCamera = () => {
        tryPlaySound('tap');
        setCamera({ x: 0, y: 0, z: 1 });
    };

    const zoomIn = () => {
        tryPlaySound('tap');
        setCamera(c => ({ ...c, z: Math.min(c.z + 0.2, 3) }));
    };

    const zoomOut = () => {
        tryPlaySound('tap');
        setCamera(c => ({ ...c, z: Math.max(c.z - 0.2, 0.1) }));
    };

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
        } else if (type === 'card') {
            newEl.w = 300;
            newEl.h = 'auto' as any; // CSS hack
            newEl.title = 'Novo Cartão';
            newEl.content = 'Escreva aqui...';
            newEl.color = 'bg-white text-gray-900 border-gray-200';
        } else if (type === 'text') {
            newEl.w = 'auto' as any;
            newEl.h = 'auto' as any;
            newEl.content = 'Texto livre';
        }

        setElements(prev => [...prev, newEl]);
        setSelectedIds([newEl.id]);
        setActiveTool('cursor');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const x = pendingImagePos?.x || 100;
                const y = pendingImagePos?.y || 100;
                createElement('card', x, y, { imageSrc: ev.target?.result as string });
                setPendingImagePos(null);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const addLink = () => {
        const url = prompt('Cole aqui o Link (URL):');
        if (url) {
            createElement('link', undefined, undefined, { url, title: 'Web Link', content: url });
        }
    };

    // =====================================
    // POINTER EVENTS (Canvas & Nodes)
    // =====================================
    const handlePointerDown = (e: React.PointerEvent, elementId: string | null = null) => {
        // Prevent pan if interacting with UI overlay
        if ((e.target as HTMLElement).closest('.no-drag')) return;

        const { x, y } = getLocalCoordinates(e.clientX, e.clientY);

        // Connection Mode Click
        if (activeTool === 'connect') {
            if (elementId) {
                e.preventDefault(); e.stopPropagation();
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                setConnectingFrom(elementId);
                setTempArrowEnd({ x, y });
                tryPlaySound('tap');
            }
            return;
        }

        // Panning Background
        if (!elementId || e.button === 1 || (e.button === 0 && e.altKey)) {
            setSelectedIds([]);
            setIsPanning(true);
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            return;
        }

        // Dragging Element
        e.preventDefault(); e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        
        if (!selectedIds.includes(elementId)) {
            const newSelection = e.shiftKey ? [...selectedIds, elementId] : [elementId];
            setSelectedIds(newSelection);
            tryPlaySound('tap');
        }

        setIsDragging(true);
        const selectedEls = elements.filter(el => selectedIds.includes(el.id) || el.id === elementId);
        setDragInfo({
            startX: x,
            startY: y,
            initialElements: selectedEls.map(el => ({ id: el.id, initialX: el.x, initialY: el.y }))
        });
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

        if (connectingFrom) {
            setTempArrowEnd({ x, y });
            return;
        }

        if (isResizing && resizeInfo) {
            const deltaX = x - resizeInfo.startX;
            const deltaY = y - resizeInfo.startY;
            setElements(els => els.map(el => {
                if (el.id === isResizing) {
                    return { 
                        ...el, 
                        w: Math.max(100, resizeInfo.initialW + deltaX),
                        h: Math.max(50, resizeInfo.initialH + deltaY) 
                    };
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

        if (connectingFrom) {
            if (hoveredElementId && hoveredElementId !== connectingFrom) {
                tryPlaySound('success');
                setConnections(prev => [...prev, { id: generateId(), from: connectingFrom, to: hoveredElementId }]);
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

    const deleteSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        tryPlaySound('close');
        setElements(els => els.filter(el => !selectedIds.includes(el.id)));
        setConnections(cons => cons.filter(c => !selectedIds.includes(c.from) && !selectedIds.includes(c.to)));
        setSelectedIds([]);
    };

    const deleteConnection = (id: string) => {
        setConnections(cons => cons.filter(c => c.id !== id));
        tryPlaySound('close');
    };

    // =====================================
    // RENDERERS
    // =====================================
    const renderConnections = () => {
        const activeConnections = [...connections];
        if (connectingFrom && tempArrowEnd) {
            activeConnections.push({ id: 'temp', from: connectingFrom, to: 'temp' });
        }

        return activeConnections.map(conn => {
            const fromEl = elements.find(e => e.id === conn.from);
            const toEl = conn.to === 'temp' ? { x: tempArrowEnd!.x, y: tempArrowEnd!.y, w: 0, h: 0 } as any : elements.find(e => e.id === conn.to);
            if (!fromEl || !toEl) return null;

            // Calc centers approximately
            const w1 = typeof fromEl.w === 'number' ? fromEl.w : 150;
            const h1 = typeof fromEl.h === 'number' ? fromEl.h : 50;
            const w2 = typeof toEl.w === 'number' ? toEl.w : 150;
            const h2 = typeof toEl.h === 'number' ? toEl.h : 50;

            const x1 = fromEl.x + w1 / 2;
            const y1 = fromEl.y + h1 / 2;
            const x2 = toEl.x + w2 / 2;
            const y2 = toEl.y + h2 / 2;

            // Smooth cubic bezier
            const d = `M ${x1} ${y1} C ${x1 + (x2 - x1) / 2} ${y1}, ${x1 + (x2 - x1) / 2} ${y2}, ${x2} ${y2}`;

            return (
                <g key={conn.id}>
                    <path 
                        d={d} 
                        fill="none" 
                        stroke={document.documentElement.classList.contains('dark') ? "#6b7280" : "#9ca3af"} 
                        strokeWidth="3" 
                        strokeDasharray={conn.id === 'temp' ? "5,5" : "none"} 
                        markerEnd="url(#arrowhead)" 
                    />
                    {conn.id !== 'temp' && activeTool === 'cursor' && (
                        <path 
                            d={d} 
                            fill="none" 
                            stroke="transparent" 
                            strokeWidth="20" 
                            className="cursor-pointer hover:stroke-rose-500/30 transition-colors" 
                            onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id); }} 
                        />
                    )}
                </g>
            );
        });
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-50 dark:bg-[#0a0a0c] font-sans">
            
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

            {/* AUTO SAVE INDICATOR */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:left-[90px] z-50 flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 border border-gray-200 dark:border-zinc-800 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold shadow-sm pointer-events-none">
                {isLoading ? (
                    <span className="text-gray-500 animate-pulse">Carregando...</span>
                ) : saveStatus === 'saving' ? (
                    <span className="text-amber-500 animate-pulse">Salvando Workspace...</span>
                ) : saveStatus === 'saved' ? (
                    <span className="text-emerald-500">Salvo!</span>
                ) : (
                    <span className="text-gray-400">Mapa Mental Ativo</span>
                )}
            </div>

            {/* SELECTION MENU (Floating) */}
            {selectedIds.length > 0 && activeTool === 'cursor' && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl animate-in slide-in-from-top-2">
                    {elements.find(e => e.id === selectedIds[0])?.type === 'postit' && (
                        <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-800">
                            {COLORS.map((c, i) => (
                                <button key={i} onClick={() => updateElement(selectedIds[0], { color: c })} className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 ${c.split(' ')[0]} transition-transform hover:scale-110 ios-btn`} />
                            ))}
                        </div>
                    )}
                    <button onClick={deleteSelection} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors ios-btn">
                        <Trash2 size={18} />
                    </button>
                </div>
            )}

            {/* TOOLBAR (Floating Bottom/Left) */}
            <div className={`absolute z-40 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl transition-all
                ${isMobile 
                    ? 'bottom-6 left-4 right-4 flex-row justify-between p-2' 
                    : 'left-6 top-1/2 -translate-y-1/2 flex-col gap-2 p-2'}
            `}>
                <div className={`flex ${isMobile ? 'flex-row gap-1 overflow-x-auto no-scrollbar' : 'flex-col gap-2'}`}>
                    {/* Operation Modes */}
                    <button onClick={() => { setActiveTool('cursor'); tryPlaySound('tap'); }} className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'cursor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}><MousePointer2 size={18} /></button>
                    <button onClick={() => { setActiveTool('connect'); setSelectedIds([]); tryPlaySound('tap'); }} className={`p-3 rounded-xl transition-all ios-btn shrink-0 ${activeTool === 'connect' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800'}`} title="Conectar Nós (Ative e clique em dois painéis)"><ArrowUpRight size={18} /></button>
                    
                    <div className={`${isMobile ? 'w-px h-full mx-1' : 'h-px w-full my-1'} bg-gray-200 dark:bg-zinc-800 shrink-0`}></div>

                    {/* Content Adders */}
                    <button onClick={() => createElement('postit')} title="Post-it (Sticky Note)" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><StickyNote size={18} /></button>
                    <button onClick={() => createElement('card')} title="Cartão Complexo" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><GripHorizontal size={18} /></button>
                    <button onClick={() => createElement('text')} title="Texto Simples" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><Type size={18} /></button>
                    <button onClick={() => fileInputRef.current?.click()} title="Imagem" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><ImageIcon size={18} /></button>
                    <button onClick={addLink} title="Link com Preview" className="p-3 rounded-xl ios-btn text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 shrink-0"><Link2 size={18} /></button>
                </div>
            </div>

            {/* CAMERA CONTROLS (Floating Right Bottom) */}
            <div className={`absolute ${isMobile ? 'right-4 top-4' : 'right-6 bottom-6'} z-40 flex items-center gap-1 p-1 bg-white/90 dark:bg-[#111114]/90 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl pointer-events-auto`}>
                <button onClick={zoomOut} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg ios-btn"><ZoomOut size={16} /></button>
                {!isMobile && <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 w-12 text-center font-mono">{Math.round(camera.z * 100)}%</span>}
                <button onClick={zoomIn} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg ios-btn"><ZoomIn size={16} /></button>
                <div className="w-px h-4 bg-gray-200 dark:bg-zinc-700 mx-1"></div>
                <button onClick={resetCamera} title="Centralizar" className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg ios-btn"><Maximize size={16} /></button>
            </div>

            {/* MAIN CANVAS */}
            <div
                ref={canvasRef}
                className={`w-full h-full cursor-${isPanning ? 'grabbing' : (activeTool === 'connect' ? 'crosshair' : 'grab')} touch-none`}
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
                    
                    {/* SVGS Connections */}
                    <svg className="absolute pointer-events-none z-0" style={{ top: 0, left: 0, width: 1, height: 1, overflow: 'visible' }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill={document.documentElement.classList.contains('dark') ? "#6b7280" : "#9ca3af"} />
                            </marker>
                        </defs>
                        {renderConnections()}
                    </svg>

                    {/* Nodes Loop */}
                    {elements.map((el) => {
                        const isSelected = selectedIds.includes(el.id);
                        const isHovered = hoveredElementId === el.id;

                        // Shared CSS bases
                        const baseClasses = `absolute touch-none origin-top-left group ${isSelected || (isHovered && activeTool === 'connect') ? 'ring-2 ring-indigo-500 shadow-2xl z-20' : 'shadow-xl z-10'} transition-shadow`;

                        // Type Overrides
                        if (el.type === 'postit') {
                            return (
                                <div key={el.id} className={baseClasses} style={{ left: el.x, top: el.y, width: el.w, height: el.h }} onPointerEnter={() => setHoveredElementId(el.id)} onPointerLeave={() => setHoveredElementId(null)} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    {isSelected && activeTool === 'cursor' && <div onPointerDown={(e) => handleResizeStart(e, el)} className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-30" />}
                                    <div className={`w-full h-full p-6 shadow-[4px_4px_15px_rgba(0,0,0,0.1)] relative overflow-hidden transition-colors ${el.color}`}>
                                        <div className="absolute top-0 left-0 w-full h-2 bg-black/10 dark:bg-white/10" />
                                        <textarea value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} placeholder="Sua nota..." className="no-drag w-full h-full bg-transparent resize-none outline-none text-base font-medium leading-relaxed custom-scrollbar" style={{ color: 'inherit' }} />
                                    </div>
                                </div>
                            );
                        }

                        if (el.type === 'card') {
                            return (
                                <div key={el.id} className={`${baseClasses} rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col`} style={{ left: el.x, top: el.y, width: el.w, minHeight: 150 }} onPointerEnter={() => setHoveredElementId(el.id)} onPointerLeave={() => setHoveredElementId(null)} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    {isSelected && activeTool === 'cursor' && <div onPointerDown={(e) => handleResizeStart(e, el)} className="absolute -bottom-1 -right-1 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-30" />}
                                    
                                    {el.imageSrc && <img src={el.imageSrc} alt="Preview" className="w-full h-40 object-cover pointer-events-none" />}
                                    
                                    <div className="p-4 flex flex-col gap-2 flex-1">
                                        <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })} placeholder="Título do Cartão" className="no-drag w-full font-black text-gray-900 dark:text-white bg-transparent outline-none text-sm" />
                                        <textarea value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} placeholder="Escreva os detalhes aqui..." className="no-drag w-full flex-1 min-h-[80px] text-sm text-gray-600 dark:text-zinc-400 bg-transparent resize-none outline-none custom-scrollbar" />
                                    </div>
                                </div>
                            );
                        }

                        if (el.type === 'link') {
                            return (
                                <div key={el.id} className={`${baseClasses} rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 p-4 flex gap-4 min-w-[300px]`} style={{ left: el.x, top: el.y }} onPointerEnter={() => setHoveredElementId(el.id)} onPointerLeave={() => setHoveredElementId(null)} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Link2 className="text-indigo-500" />
                                    </div>
                                    <div className="flex flex-col flex-1 overflow-hidden justify-center">
                                        <input value={el.title || ''} onChange={(e) => updateElement(el.id, { title: e.target.value })} className="no-drag font-black text-sm text-gray-900 dark:text-white bg-transparent outline-none truncate w-full" placeholder="Título do Link" />
                                        <a href={el.content || el.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline truncate no-drag" onPointerDown={e => e.stopPropagation()}>{el.content || el.url}</a>
                                    </div>
                                </div>
                            );
                        }

                        if (el.type === 'text') {
                            return (
                                <div key={el.id} className={`absolute touch-none origin-top-left group ${isSelected || isHovered ? 'ring-2 ring-indigo-500/50 bg-indigo-500/5 rounded-lg' : ''}`} style={{ left: el.x, top: el.y, minWidth: 150 }} onPointerEnter={() => setHoveredElementId(el.id)} onPointerLeave={() => setHoveredElementId(null)} onPointerDown={(e) => handlePointerDown(e, el.id)}>
                                    <textarea value={el.content} onChange={(e) => updateElement(el.id, { content: e.target.value })} placeholder="Digite algo..." rows={1} className="no-drag w-full bg-transparent border-none resize-none outline-none whitespace-pre-wrap overflow-hidden p-3 font-black text-2xl text-gray-900 dark:text-white" onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
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
