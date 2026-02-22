import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MousePointer2, Hand, StickyNote, Type, Square, Circle,
    Image as ImageIcon, Trash2, Plus, ZoomIn, ZoomOut, Maximize, Palette,
    Pencil, Eraser, Undo2, Redo2, FileText, X, ChevronDown,
    // Ícones do Editor de Texto
    Bold, Italic, Strikethrough, List, ListOrdered, Indent, Outdent, Link2, MessageSquare, MoreHorizontal, AlignLeft
} from 'lucide-react';

// Função auxiliar para tocar som
const tryPlaySound = (type: 'tap' | 'open' | 'close' | 'success') => {
    if (typeof window !== 'undefined' && (window as any).playUISound) {
        (window as any).playUISound(type);
    }
};

// ==========================================
// CONFIGURAÇÕES GERAIS
// ==========================================
const COLORS = [
    'bg-amber-200 text-amber-900',
    'bg-blue-200 text-blue-900',
    'bg-emerald-200 text-emerald-900',
    'bg-rose-200 text-rose-900',
    'bg-purple-200 text-purple-900',
    'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700'
];

export function Whiteboard() {
    // ==========================================
    // ESTADOS DO CANVAS E CÂMERA
    // ==========================================
    const canvasRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null); // Ref para o editor de texto rico

    const [camera, setCamera] = useState({ x: 0, y: 0, z: 1 });
    const [activeTool, setActiveTool] = useState('cursor');
    const [elements, setElements] = useState<any[]>([
        { id: '1', type: 'sticky', x: 100, y: 100, w: 200, h: 200, content: 'Bem-vindo ao Ekko Board!\n\nUse a barra lateral para adicionar notas e formas.', color: COLORS[0] },
        { id: '2', type: 'text', x: 400, y: 150, w: 300, h: 'auto', content: 'Matriz de Lançamento Q3', color: 'text-gray-900 dark:text-white text-3xl font-black' },
        { id: '3', type: 'document', x: 100, y: 350, w: 140, h: 160, title: 'Planejamento Q4', content: '<b>Objetivos principais:</b><ul><li>Aumentar vendas em 20%</li><li>Lançar novo produto</li></ul>', color: 'bg-white' }
    ]);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    // Estados de Desenho Livre
    const [paths, setPaths] = useState<any[]>([]);
    const [currentPath, setCurrentPath] = useState<any>(null);
    const [drawColor, setDrawColor] = useState('#F05522');
    const [drawWidth, setDrawWidth] = useState(4);
    const [undoStack, setUndoStack] = useState<any[]>([]);
    const [redoStack, setRedoStack] = useState<any[]>([]);
    const [isErasing, setIsErasing] = useState(false);

    // Estado do Editor de Documentos
    const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
    const activeDocument = elements.find(el => el.id === activeDocumentId);

    // ==========================================
    // LÓGICA DE PAN & ZOOM
    // ==========================================
    const handleWheel = useCallback((e: WheelEvent) => {
        // Bloqueia o zoom/pan do canvas se o modal do editor estiver aberto
        if (activeDocumentId) return;

        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
            const zoomSensitivity = 0.001;
            const delta = -e.deltaY * zoomSensitivity;
            setCamera(c => {
                const newZ = Math.min(Math.max(0.1, c.z + delta), 3);
                return { ...c, z: newZ };
            });
        } else {
            setCamera(c => ({
                ...c,
                x: c.x - e.deltaX,
                y: c.y - e.deltaY
            }));
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
    // LÓGICA DE DRAG, DESENHO E BORRACHA
    // ==========================================
    const erasePathsAt = (x: number, y: number) => {
        const eraseRadius = 25 / camera.z;
        setPaths(prevPaths => prevPaths.filter(path => {
            const hit = path.points.some((pt: any) => Math.hypot(pt.x - x, pt.y - y) < eraseRadius);
            return !hit;
        }));
    };

    const handlePointerDown = (e: React.PointerEvent, elementId: string | null = null) => {
        if (activeDocumentId) return;

        if (activeTool === 'hand' || (e.button === 1) || (e.button === 0 && e.altKey)) {
            setIsPanning(true);
            return;
        }

        const mouseX = (e.clientX - camera.x) / camera.z;
        const mouseY = (e.clientY - camera.y) / camera.z;

        if (activeTool === 'draw') {
            e.stopPropagation();
            setCurrentPath({ id: Date.now().toString(), color: drawColor, width: drawWidth, points: [{ x: mouseX, y: mouseY }] });
            return;
        }

        if (activeTool === 'eraser') {
            e.stopPropagation();
            setUndoStack(prev => [...prev, paths]);
            setRedoStack([]);
            setIsErasing(true);
            erasePathsAt(mouseX, mouseY);
            return;
        }

        if (elementId) {
            e.stopPropagation();
            setSelectedId(elementId);
            setIsDragging(true);
            const el = elements.find(el => el.id === elementId);
            setDragOffset({ x: mouseX - el.x, y: mouseY - el.y });
            tryPlaySound('tap');
        } else {
            setSelectedId(null);
            if (['sticky', 'text', 'square', 'circle', 'document'].includes(activeTool)) {
                createNewElement(e);
                setActiveTool('cursor');
            }
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (activeDocumentId) return;

        if (isPanning) {
            setCamera(c => ({ ...c, x: c.x + e.movementX, y: c.y + e.movementY }));
            return;
        }

        const mouseX = (e.clientX - camera.x) / camera.z;
        const mouseY = (e.clientY - camera.y) / camera.z;

        if (activeTool === 'draw' && currentPath) {
            setCurrentPath((prev: any) => ({ ...prev, points: [...prev.points, { x: mouseX, y: mouseY }] }));
        } else if (activeTool === 'eraser' && isErasing) {
            erasePathsAt(mouseX, mouseY);
        } else if (isDragging && selectedId) {
            setElements(els => els.map(el =>
                el.id === selectedId
                    ? { ...el, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }
                    : el
            ));
        }
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        setIsPanning(false);

        if (currentPath) {
            setUndoStack(prev => [...prev, paths]);
            setRedoStack([]);
            setPaths(prev => [...prev, currentPath]);
            setCurrentPath(null);
        }
        if (isErasing) setIsErasing(false);
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        tryPlaySound('tap');
        const prevPaths = undoStack[undoStack.length - 1];
        setRedoStack(prev => [...prev, paths]);
        setPaths(prevPaths);
        setUndoStack(prev => prev.slice(0, -1));
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        tryPlaySound('tap');
        const nextPaths = redoStack[redoStack.length - 1];
        setUndoStack(prev => [...prev, paths]);
        setPaths(nextPaths);
        setRedoStack(prev => prev.slice(0, -1));
    };

    const createPathData = (points: any[]) => {
        if (!points || points.length === 0) return '';
        const start = points[0];
        let d = `M ${start.x} ${start.y}`;
        for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
        return d;
    };

    // ==========================================
    // FUNÇÕES DE CRIAÇÃO E EDIÇÃO
    // ==========================================
    const createNewElement = (e: React.PointerEvent) => {
        tryPlaySound('success');
        const mouseX = (e.clientX - camera.x) / camera.z;
        const mouseY = (e.clientY - camera.y) / camera.z;
        let newEl: any = { id: Date.now().toString(), type: activeTool, x: mouseX, y: mouseY, content: '' };

        if (activeTool === 'sticky') newEl = { ...newEl, w: 200, h: 200, color: COLORS[0] };
        else if (activeTool === 'text') newEl = { ...newEl, w: 300, h: 'auto', color: 'text-gray-900 dark:text-white text-xl font-bold', content: 'Novo Texto' };
        else if (activeTool === 'square' || activeTool === 'circle') newEl = { ...newEl, w: 150, h: 150, color: COLORS[5] };
        else if (activeTool === 'document') newEl = { ...newEl, w: 140, h: 160, title: 'New Document', color: 'bg-white', content: '' };

        setElements([...elements, newEl]);
        setSelectedId(newEl.id);
    };

    const updateElementContent = (id: string, newContent: string) => setElements(els => els.map(el => el.id === id ? { ...el, content: newContent } : el));
    const updateElementTitle = (id: string, newTitle: string) => setElements(els => els.map(el => el.id === id ? { ...el, title: newTitle } : el));
    const updateElementColor = (colorClass: string) => { if (selectedId) { tryPlaySound('tap'); setElements(els => els.map(el => el.id === selectedId ? { ...el, color: colorClass } : el)); } };
    const deleteElement = () => { if (selectedId) { tryPlaySound('close'); setElements(els => els.filter(el => el.id !== selectedId)); setSelectedId(null); } };

    const getWordCount = (htmlContent: string) => {
        if (!htmlContent) return 0;
        // Remove as tags HTML para contar apenas as palavras reais
        const text = htmlContent.replace(/<[^>]+>/g, '');
        return text.trim() ? text.trim().split(/\s+/).length : 0;
    };

    // Funções do Editor Rich Text (WYSIWYG)
    const formatText = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value || undefined);
        if (editorRef.current) editorRef.current.focus();
        tryPlaySound('tap');
    };

    const closeEditor = () => {
        if (editorRef.current && activeDocumentId) {
            updateElementContent(activeDocumentId, editorRef.current.innerHTML);
        }
        tryPlaySound('close');
        setActiveDocumentId(null);
    };

    // ==========================================
    // FUNÇÕES DA CÂMARA 
    // ==========================================
    const resetCamera = () => { tryPlaySound('tap'); setCamera({ x: 0, y: 0, z: 1 }); };
    const zoomIn = () => { tryPlaySound('tap'); setCamera(c => ({ ...c, z: Math.min(c.z + 0.2, 3) })); };
    const zoomOut = () => { tryPlaySound('tap'); setCamera(c => ({ ...c, z: Math.max(c.z - 0.2, 0.1) })); };

    return (
        <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden bg-gray-50 dark:bg-[#0a0a0c] font-sans flex animate-in fade-in duration-500 rounded-[2.5rem] border border-app-border mx-4 my-4">

            {/* =========================================
          TOOLBAR DE DESENHO (FLUTUANTE)
          ========================================= */}
            {['draw', 'eraser'].includes(activeTool) && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1.5 bg-white dark:bg-[#111114] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    <button onClick={() => { tryPlaySound('tap'); setActiveTool('draw'); }} className={`p-2 rounded-xl transition-colors ${activeTool === 'draw' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Pencil size={20} /></button>
                    <button onClick={() => { tryPlaySound('tap'); setActiveTool('cursor'); }} className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"><MousePointer2 size={20} /></button>
                    <button onClick={() => { tryPlaySound('tap'); setActiveTool('eraser'); }} className={`p-2 rounded-xl transition-colors ${activeTool === 'eraser' ? 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:bg-gray-50'}`}><Eraser size={20} /></button>
                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2"></div>
                    <div className="flex items-center gap-2 px-1">
                        <input type="color" value={drawColor} onChange={(e) => setDrawColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer border border-black/10 p-0" />
                        <select value={drawWidth} onChange={(e) => setDrawWidth(Number(e.target.value))} className="bg-gray-50 text-sm font-bold text-gray-700 rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                            <option value={2}>Fino</option><option value={4}>Normal</option><option value={8}>Grosso</option><option value={16}>Marcador</option>
                        </select>
                    </div>
                    <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700 mx-2"></div>
                    <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-30"><Undo2 size={20} /></button>
                    <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-2 rounded-xl text-gray-500 hover:bg-gray-50 disabled:opacity-30"><Redo2 size={20} /></button>
                    <div className="w-px h-6 bg-transparent mx-2"></div>
                    <button onClick={() => { tryPlaySound('close'); setPaths([]); setUndoStack([]); setRedoStack([]); setActiveTool('cursor'); }} className="px-4 py-2 text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl">Descartar</button>
                    <button onClick={() => { tryPlaySound('success'); setActiveTool('cursor'); }} className="ml-2 px-6 py-2 text-sm font-bold bg-[#F05522] hover:bg-[#d94a1d] text-white rounded-xl shadow-md">Salvar</button>
                </div>
            )}

            {/* =========================================
          BARRA DE FERRAMENTAS ESQUERDA
          ========================================= */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 p-2 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
                {[
                    { id: 'cursor', icon: MousePointer2, label: 'Selecionar' },
                    { id: 'hand', icon: Hand, label: 'Mover Canvas' },
                    { id: 'draw', icon: Pencil, label: 'Desenho Livre' },
                    { divider: true },
                    { id: 'sticky', icon: StickyNote, label: 'Nota (Sticky)' },
                    { id: 'document', icon: FileText, label: 'Documento Word' },
                    { id: 'text', icon: Type, label: 'Texto Livre' },
                    { id: 'square', icon: Square, label: 'Retângulo' },
                    { id: 'circle', icon: Circle, label: 'Círculo' },
                    { divider: true },
                    { id: 'image', icon: ImageIcon, label: 'Imagem' },
                ].map((tool, idx) =>
                    tool.divider ? (
                        <div key={`div-${idx}`} className="w-full h-px bg-gray-200 dark:bg-zinc-800 my-1"></div>
                    ) : (
                        <button
                            key={tool.id} title={tool.label}
                            onClick={() => { tryPlaySound('tap'); setActiveTool(tool.id); setSelectedId(null); }}
                            className={`p-3 rounded-xl flex items-center justify-center transition-all ios-btn ${activeTool === tool.id
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <tool.icon size={20} strokeWidth={activeTool === tool.id ? 2.5 : 2} />
                        </button>
                    )
                )}
            </div>

            {/* =========================================
          CONTROLES DE CÂMERA
          ========================================= */}
            <div className="absolute right-6 bottom-6 z-40 flex items-center gap-1 p-1 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-xl border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl">
                <button onClick={zoomOut} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><ZoomOut size={16} /></button>
                <span className="text-xs font-bold text-gray-700 w-12 text-center font-mono">{Math.round(camera.z * 100)}%</span>
                <button onClick={zoomIn} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><ZoomIn size={16} /></button>
                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                <button onClick={resetCamera} className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg"><Maximize size={16} /></button>
            </div>

            {/* =========================================
          ÁREA DO CANVAS (INFINITA)
          ========================================= */}
            <div
                ref={canvasRef}
                className={`w-full h-full cursor-${activeTool === 'hand' || isPanning ? 'grab' : (['draw', 'eraser'].includes(activeTool) ? 'crosshair' : (activeTool === 'cursor' ? 'default' : 'crosshair'))} ${isPanning ? 'cursor-grabbing' : ''}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                <div
                    className="absolute inset-0 origin-top-left transition-transform duration-75"
                    style={{
                        transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
                        backgroundImage: `radial-gradient(circle, #88888844 1.5px, transparent 1.5px)`,
                        backgroundSize: '30px 30px', backgroundPosition: `0 0`,
                        width: '100000px', height: '100000px', left: '-50000px', top: '-50000px',
                    }}
                >
                    <div className="absolute" style={{ left: '50000px', top: '50000px' }}>

                        {/* RENDERIZAÇÃO DOS ELEMENTOS DOM */}
                        {elements.map((el) => {
                            const isSelected = selectedId === el.id;
                            return (
                                <div
                                    key={el.id}
                                    onPointerDown={(e) => handlePointerDown(e, el.id)}
                                    onDoubleClick={(e) => {
                                        if (el.type === 'document') {
                                            e.stopPropagation();
                                            tryPlaySound('open');
                                            setActiveDocumentId(el.id);
                                            setIsDragging(false);
                                        }
                                    }}
                                    className={`absolute group touch-none origin-top-left ${el.type === 'text' ? '' : 'shadow-sm'} ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-transparent z-20 shadow-xl' : 'z-10'} transition-shadow`}
                                    style={{
                                        left: el.x, top: el.y, width: el.type === 'text' ? 'auto' : el.w, height: el.type === 'text' ? 'auto' : el.h, minWidth: el.type === 'text' ? 100 : undefined, borderRadius: el.type === 'circle' ? '50%' : '12px',
                                    }}
                                >
                                    {/* Menu Contextual de Cores e Lixeira */}
                                    {isSelected && activeTool === 'cursor' && (
                                        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white dark:bg-[#111114] p-1.5 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex items-center gap-1 animate-in zoom-in-95 duration-100 z-50">
                                            {el.type !== 'text' && el.type !== 'document' && (
                                                <div className="flex gap-1 pr-2 border-r border-gray-100 dark:border-zinc-800 mr-1">
                                                    {COLORS.map((c, i) => (
                                                        <button key={i} onClick={(e) => { e.stopPropagation(); updateElementColor(c); }} className={`w-6 h-6 rounded-full border border-black/10 dark:border-white/10 ${c.split(' ')[0]} hover:scale-110 transition-transform`} />
                                                    ))}
                                                </div>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); deleteElement(); }} className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Conteúdo Renderizado baseado no Tipo */}
                                    <div className={`w-full h-full flex flex-col overflow-hidden ${el.type === 'document' ? 'bg-white border border-gray-200' : el.color} ${el.type === 'circle' ? 'rounded-full' : 'rounded-xl'}`}>

                                        {el.type === 'document' && (
                                            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white text-center cursor-pointer hover:bg-gray-50 transition-colors">
                                                <FileText size={42} className="text-gray-400 mb-3" strokeWidth={1.5} />
                                                <span className="font-bold text-gray-800 text-[13px] leading-tight px-2 w-full truncate">
                                                    {el.title || 'New Document'}
                                                </span>
                                                <span className="text-[11px] font-medium text-gray-400 mt-1.5">
                                                    {getWordCount(el.content)} words
                                                </span>
                                            </div>
                                        )}

                                        {el.type === 'sticky' && (
                                            <div className="w-full h-full p-4 relative">
                                                <div className="absolute top-0 left-0 w-full h-2 bg-black/5 dark:bg-white/5"></div>
                                                <textarea value={el.content} onChange={(e) => updateElementContent(el.id, e.target.value)} placeholder="Digite algo..." className="w-full h-full bg-transparent resize-none outline-none text-sm font-medium leading-relaxed custom-scrollbar placeholder-current/50" style={{ color: 'inherit' }} />
                                            </div>
                                        )}
                                        {el.type === 'text' && (
                                            <textarea value={el.content} onChange={(e) => updateElementContent(el.id, e.target.value)} placeholder="Texto..." rows={1} className={`bg-transparent resize-none outline-none whitespace-pre-wrap overflow-hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 focus:bg-transparent ${el.color}`} style={{ height: 'auto' }} onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} />
                                        )}
                                        {(el.type === 'square' || el.type === 'circle') && (
                                            <div className="w-full h-full flex items-center justify-center p-4">
                                                <textarea value={el.content} onChange={(e) => updateElementContent(el.id, e.target.value)} placeholder="Texto..." className="w-full bg-transparent resize-none outline-none text-center font-bold text-sm" style={{ color: 'inherit' }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* RENDERIZAÇÃO DOS TRAÇOS SVG */}
                        <svg className="absolute pointer-events-none z-30" style={{ left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                            {paths.map(p => (
                                <path key={p.id} d={createPathData(p.points)} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            ))}
                            {currentPath && (
                                <path d={createPathData(currentPath.points)} stroke={currentPath.color} strokeWidth={currentPath.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            )}
                        </svg>

                    </div>
                </div>
            </div>

            {/* =========================================
          MODAL: EDITOR DE DOCUMENTOS (TIPO WORD/MILANOTE)
          ========================================= */}
            {activeDocumentId && activeDocument && (
                <div className="fixed inset-0 z-[99999] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-10 animate-in fade-in duration-200">
                    <div className="w-full max-w-[1200px] h-full max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-ios-spring">

                        {/* Header do Editor */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white z-10">
                            <div className="w-32 flex items-center gap-2 text-gray-500">
                                <FileText size={18} />
                                <span className="text-xs font-medium">{getWordCount(activeDocument.content)} words</span>
                            </div>

                            <input
                                value={activeDocument.title}
                                onChange={(e) => updateElementTitle(activeDocument.id, e.target.value)}
                                className="text-center font-bold text-gray-900 text-lg outline-none hover:bg-gray-50 px-4 py-1 rounded-lg transition-colors border border-transparent focus:border-gray-200 w-full max-w-sm"
                                placeholder="Nome do Documento"
                            />

                            <div className="w-32 flex items-center justify-end gap-3">
                                <button className="text-sm font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1">
                                    Export <ChevronDown size={14} />
                                </button>
                                <div className="w-px h-4 bg-gray-200"></div>
                                <button onClick={closeEditor} className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Corpo do Editor */}
                        <div className="flex flex-1 overflow-hidden bg-white">

                            {/* Barra Lateral de Formatação (Funcional) */}
                            <div className="w-16 flex-shrink-0 border-r border-gray-100 flex flex-col items-center py-6 gap-6 bg-gray-50/50 overflow-y-auto custom-scrollbar">

                                <div className="flex flex-col items-center gap-1">
                                    <button className="p-2 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors">
                                        <Type size={18} strokeWidth={2.5} />
                                    </button>
                                    <span className="text-[9px] text-gray-400 font-medium">Text style</span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button onClick={() => formatText('bold')} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"><Bold size={18} strokeWidth={2.5} /></button>
                                    <button onClick={() => formatText('italic')} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"><Italic size={18} /></button>
                                    <button onClick={() => formatText('strikeThrough')} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"><Strikethrough size={18} /></button>
                                </div>

                                <div className="w-8 h-px bg-gray-200"></div>

                                <div className="flex flex-col gap-3">
                                    <button onClick={() => formatText('insertUnorderedList')} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"><List size={18} /></button>
                                    <button onClick={() => formatText('insertOrderedList')} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"><ListOrdered size={18} /></button>
                                    <button onClick={() => formatText('indent')} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"><Indent size={18} /></button>
                                    <button onClick={() => formatText('outdent')} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"><Outdent size={18} /></button>
                                    <button onClick={() => formatText('justifyLeft')} className="p-2 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"><AlignLeft size={18} /></button>
                                </div>

                                <div className="w-8 h-px bg-gray-200"></div>

                                <div className="flex flex-col gap-3 mt-auto">
                                    <button onClick={() => {
                                        const url = prompt("Insira o link:");
                                        if (url) formatText('createLink', url);
                                    }} className="p-2 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors"><Link2 size={18} /></button>
                                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors"><MessageSquare size={18} /></button>
                                    <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-900 transition-colors"><MoreHorizontal size={18} /></button>
                                </div>

                            </div>

                            {/* Área Editável (WYSIWYG Nativo) */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                                <div
                                    ref={editorRef}
                                    className="w-full max-w-3xl mx-auto p-12 min-h-full outline-none text-gray-700 leading-relaxed document-editor-content"
                                    contentEditable={true}
                                    suppressContentEditableWarning={true}
                                    onBlur={(e) => updateElementContent(activeDocumentId, e.target.innerHTML)}
                                    dangerouslySetInnerHTML={{ __html: activeDocument.content || '<p><br></p>' }}
                                    style={{ fontSize: '15px' }}
                                />

                                {/* CSS Injetado para estilizar o conteúdo gerado pelo contentEditable */}
                                <style dangerouslySetInnerHTML={{
                                    __html: `
                  .document-editor-content:empty:before {
                    content: 'Start typing...';
                    color: #9ca3af;
                    pointer-events: none;
                  }
                  .document-editor-content b, .document-editor-content strong { font-weight: 800; color: #111827; }
                  .document-editor-content i, .document-editor-content em { font-style: italic; }
                  .document-editor-content ul { list-style-type: disc; padding-left: 2rem; margin-bottom: 1rem; }
                  .document-editor-content ol { list-style-type: decimal; padding-left: 2rem; margin-bottom: 1rem; }
                  .document-editor-content li { margin-bottom: 0.5rem; }
                  .document-editor-content a { color: #4f46e5; text-decoration: underline; }
                `}} />
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
