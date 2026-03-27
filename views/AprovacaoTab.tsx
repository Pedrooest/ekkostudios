import React, { useState, useRef } from 'react';
import {
    CheckCircle2, XCircle, MessageSquare, Smartphone,
    LayoutGrid, Clock, Check, X, Image as ImageIcon,
    Send, Filter, Copy, MoreHorizontal, Pencil, UploadCloud,
    Globe, Instagram, Linkedin, Video
} from 'lucide-react';
import { Badge, Button, Card } from '../Components';

// ==========================================
// FUNÇÕES AUXILIARES DE SOM
// ==========================================
const tryPlaySound = (type: any) => {
    if (typeof window !== 'undefined' && (window as any).playUISound) (window as any).playUISound(type);
};

// SIMULAÇÃO DOS CLIENTES GLOBAIS DO APLICATIVO
const CLIENTES_CADASTRADOS = [
    'Forno a Lenha Bakery',
    'Tech Solutions Hub',
    'Agência Ekko',
    'Boutique XYZ',
    'Nike (Exemplo)',
    'Apple (Exemplo)'
];

export default function AprovacaoTab() {
    // ==========================================
    // ESTADOS E DADOS MOCK
    // ==========================================
    const [activeFilter, setActiveFilter] = useState('pendente'); // 'pendente', 'aprovado', 'alteracao'
    const [selectedPostId, setSelectedPostId] = useState<number | null>(1);
    const [feedbackText, setFeedbackText] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    // Estados de Edição
    const [isEditing, setIsEditing] = useState(false);
    const [editingData, setEditingData] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [posts, setPosts] = useState([
        {
            id: 1,
            client: 'Forno a Lenha Bakery',
            title: 'Post: Promoção de Fim de Semana',
            date: '15 Mar 2026',
            time: '18:00',
            network: 'Instagram',
            format: 'Carrossel',
            status: 'pendente',
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop',
            copy: 'O fim de semana chegou e com ele a nossa fornada especial de pães de fermentação natural! 🥖✨\n\nGaranta o seu pão quentinho para o café da manhã. Passando aqui na padaria ou pedindo pelo delivery, a qualidade é a mesma.\n\n👇 Deixe nos comentários: qual o seu pão favorito?\n\n#PadariaArtesanal #FermentacaoNatural #FimDeSemana',
            feedback: [] as any[]
        },
        {
            id: 2,
            client: 'Tech Solutions Hub',
            title: 'Artigo: IA no mercado de trabalho',
            date: '16 Mar 2026',
            time: '12:00',
            network: 'LinkedIn',
            format: 'Post Único',
            status: 'alteracao',
            image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=800&auto=format&fit=crop',
            copy: 'A Inteligência Artificial não vai roubar o seu emprego, mas alguém usando IA pode roubar. 🤖💼\n\nNeste novo cenário corporativo, a adaptabilidade é a principal soft skill. Como a sua empresa está se preparando para integrar ferramentas de IA no dia a dia?\n\nLeia nosso artigo completo no link da bio.',
            feedback: [{ text: 'Podemos trocar "roubar" por "substituir"? Fica menos agressivo para o nosso público.', author: 'Cliente (João)', time: 'Há 2 horas' }]
        },
        {
            id: 3,
            client: 'Agência Ekko',
            title: 'Reels: Bastidores de Reunião',
            date: '17 Mar 2026',
            time: '19:00',
            network: 'Instagram',
            format: 'Reels',
            status: 'aprovado',
            image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop',
            copy: 'Um pouco do que rola por trás das câmeras aqui na agência! 🎬🔥\n\nNosso processo criativo envolve muita troca de ideias, café e mão na massa.\n\nQuer levar sua marca para o próximo nível? Vem tomar um café com a gente! ☕',
            feedback: [{ text: 'Perfeito! Amei o vídeo. Pode programar.', author: 'Cliente (Maria)', time: 'Ontem' }]
        }
    ]);

    const selectedPost = posts.find(p => p.id === selectedPostId);
    const filteredPosts = posts.filter(p => p.status === activeFilter);

    // ==========================================
    // FUNÇÕES DE AÇÃO GERAIS
    // ==========================================
    const selectPost = (id: number) => {
        tryPlaySound('tap');
        setSelectedPostId(id);
        setIsRejecting(false);
        setIsEditing(false); // Sai do modo de edição ao trocar de post
    };

    const handleApprove = () => {
        tryPlaySound('success');
        setPosts(posts.map(p => p.id === selectedPostId ? { ...p, status: 'aprovado' } : p));
        setIsRejecting(false);
    };

    const handleSendFeedback = () => {
        if (!feedbackText.trim()) return;
        tryPlaySound('tap');

        const newFeedback = {
            text: feedbackText,
            author: 'Equipe Interna',
            time: 'Agora'
        };

        setPosts(posts.map(p => p.id === selectedPostId ? {
            ...p,
            status: 'alteracao',
            feedback: [...p.feedback, newFeedback]
        } : p));

        setFeedbackText('');
        setIsRejecting(false);
        tryPlaySound('success');
    };

    // ==========================================
    // FUNÇÕES DE EDIÇÃO DO POST
    // ==========================================
    const startEditing = () => {
        tryPlaySound('open');
        setEditingData({ ...selectedPost });
        setIsEditing(true);
        setIsRejecting(false);
    };

    const cancelEditing = () => {
        tryPlaySound('close');
        setEditingData(null);
        setIsEditing(false);
    };

    const saveEditing = () => {
        tryPlaySound('success');
        setPosts(posts.map(p => p.id === selectedPostId ? editingData : p));
        setIsEditing(false);
    };

    const handleImageUpload = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            tryPlaySound('tap');
            const reader = new FileReader();
            reader.onload = (event: any) => {
                setEditingData({ ...editingData, image: event.target.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCopyClientLink = () => {
        tryPlaySound('tap');
        const el = document.createElement('textarea');
        el.value = `https://ekko.app/aprovacao/${selectedPostId}?token=xpto123`;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert('Link do cliente copiado para a área de transferência!');
    };

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-zinc-50 dark:bg-[#09090b] font-sans transition-colors">

            {/* Input de Ficheiro Escondido para Upload de Imagem */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            {/* =========================================
          COLUNA ESQUERDA: LISTA DE CONTEÚDOS
          ========================================= */}
            <div className="w-full md:w-[360px] flex-shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-10 transition-colors">

                {/* Header da Lista */}
                <div className="p-6 pb-4 shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight flex items-center gap-2">
                             Aprovação
                        </h2>
                        <button className="p-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                            <Filter size={16} />
                        </button>
                    </div>

                    {/* Filtros de Status (Tabs) */}
                    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-2">
                        {[
                            { id: 'pendente', label: 'Pendentes' },
                            { id: 'alteracao', label: 'Ajustes' },
                            { id: 'aprovado', label: 'Aprovados' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { tryPlaySound('tap'); setActiveFilter(tab.id); }}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeFilter === tab.id
                                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                                        : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de Posts */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 mx-auto mb-4">
                                <Check size={24} />
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tudo limpo por aqui!</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => selectPost(post.id)}
                                className={`p-3 rounded-xl cursor-pointer transition-all border group flex gap-3 ${selectedPostId === post.id && !isEditing
                                        ? 'bg-zinc-900 dark:bg-zinc-100 !border-zinc-900 dark:!border-zinc-100'
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm'
                                    }`}
                            >
                                {/* Miniatura da Imagem */}
                                <div className="w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                                    <img src={post.image} alt="Thumb" className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 overflow-hidden flex flex-col justify-center">
                                    <div className="flex justify-between items-start mb-0.5">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest truncate ${selectedPostId === post.id && !isEditing ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-500'}`}>
                                            {post.client}
                                        </span>
                                    </div>
                                    <h4 className={`text-[11px] font-bold truncate mb-1 uppercase tracking-tight ${selectedPostId === post.id && !isEditing ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                        {post.title}
                                    </h4>
                                    <div className={`flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest ${selectedPostId === post.id && !isEditing ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-400'}`}>
                                        <span className="flex items-center gap-1"><Clock size={10} /> {post.date}</span>
                                        <span className="w-1 h-1 rounded-full bg-current opacity-30"></span>
                                        <span>{post.network}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* =========================================
          COLUNA DIREITA: VISUALIZADOR E EDITOR DE POST
          ========================================= */}
            {/* =========================================
          COLUNA DIREITA: VISUALIZADOR E EDITOR DE POST
          ========================================= */}
            <div className="flex-1 flex flex-col relative bg-zinc-50 dark:bg-[#09090b]">
                {selectedPost ? (
                    <>
                        {/* Header de Ação Superior */}
                        <div className="px-6 sm:px-10 py-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center z-10 shrink-0">
                            <div className="flex items-center gap-3">
                                <Badge color={selectedPost.status === 'aprovado' ? 'emerald' : selectedPost.status === 'alteracao' ? 'amber' : 'slate'} className="uppercase text-[9px] tracking-widest px-3">
                                    {selectedPost.status}
                                </Badge>
                                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                    Visualização de Conteúdo
                                </h3>
                            </div>

                            <div className="flex gap-2">
                                {!isEditing && (
                                    <Button
                                        variant="secondary"
                                        onClick={handleCopyClientLink}
                                        className="text-[10px] uppercase tracking-widest font-bold px-4"
                                    >
                                        <Copy size={13} strokeWidth={2.5} /> Link do Cliente
                                    </Button>
                                )}
                                {!isEditing && (
                                    <Button
                                        variant="primary"
                                        onClick={startEditing}
                                        className="text-[10px] uppercase tracking-widest font-bold px-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none hover:bg-zinc-800 dark:hover:bg-zinc-200"
                                    >
                                        <Pencil size={13} strokeWidth={2.5} /> Editar Post
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Container Principal de Visualização */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 flex justify-center">

                            <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-start">

                                {/* 1. MOCKUP DO POST (Lado Esquerdo) */}
                                <div className={`w-full lg:w-[400px] shrink-0 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border overflow-hidden flex flex-col transition-all ${isEditing ? 'border-zinc-900 dark:border-zinc-100 ring-4 ring-zinc-900/10 dark:ring-zinc-100/10' : 'border-zinc-200 dark:border-zinc-800'}`}>

                                    {/* Header do Mockup (Fake Instagram) */}
                                    <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-800 dark:text-zinc-200 shrink-0">
                                            {(isEditing ? editingData.client : selectedPost.client).substring(0, 2).toUpperCase()}
                                        </div>

                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            {isEditing ? (
                                                <select
                                                    value={editingData.client}
                                                    onChange={(e) => setEditingData({ ...editingData, client: e.target.value })}
                                                    className="w-full bg-transparent text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none cursor-pointer border-b border-zinc-200 dark:border-zinc-700 pb-0.5"
                                                >
                                                    {CLIENTES_CADASTRADOS.map(c => (
                                                        <option key={c} value={c} className="text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900">{c}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{selectedPost.client}</span>
                                            )}
                                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold opacity-60">Sponsored</span>
                                        </div>
                                        <MoreHorizontal size={16} className="text-zinc-400 shrink-0 ml-auto" />
                                    </div>

                                    {/* Imagem/Vídeo Editável */}
                                    <div
                                        className="w-full aspect-square bg-zinc-100 dark:bg-zinc-950 relative group border-b border-zinc-100 dark:border-zinc-800"
                                        onClick={() => isEditing ? fileInputRef.current?.click() : null}
                                    >
                                        <img
                                            src={isEditing ? editingData.image : selectedPost.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />

                                        {isEditing && (
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                                <div className="bg-white/20 p-3 rounded-full mb-2">
                                                    <UploadCloud size={24} className="text-white" />
                                                </div>
                                                <span className="text-white text-[10px] font-bold uppercase tracking-widest">Alterar Mídia</span>
                                            </div>
                                        )}

                                        {(!isEditing && selectedPost.format === 'Reels') && (
                                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1 uppercase tracking-widest">
                                                <Video size={10} /> Reels
                                            </div>
                                        )}
                                    </div>

                                    {/* Legenda (Copy) Editável */}
                                    <div className="p-5 flex-1 bg-white dark:bg-zinc-900 flex flex-col">
                                        <div className="flex items-center gap-4 mb-4 text-zinc-900 dark:text-zinc-100">
                                            <Instagram size={20} className="opacity-50" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{selectedPost.network} Preview</span>
                                        </div>

                                        {isEditing ? (
                                            <textarea
                                                value={editingData.copy}
                                                onChange={(e) => setEditingData({ ...editingData, copy: e.target.value })}
                                                className="w-full flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm text-zinc-800 dark:text-zinc-200 resize-none outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 custom-scrollbar min-h-[150px]"
                                                placeholder="Escreva a legenda aqui..."
                                            />
                                        ) : (
                                            <div className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                                <span className="font-bold mr-2">{selectedPost.client}</span>
                                                {selectedPost.copy}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. PAINEL DE CONTROLE (Lado Direito) */}
                                <div className="flex-1 w-full max-w-[400px] flex flex-col gap-6">

                                    {/* Painel de Edição vs Aprovação */}
                                    <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-visible">
                                        {isEditing ? (
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100 animate-pulse"></div>
                                                    <h4 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">Modo Edição</h4>
                                                </div>
                                                <Button
                                                    onClick={saveEditing}
                                                    className="w-full py-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10"
                                                >
                                                    <Check size={16} strokeWidth={3} /> Salvar Alterações
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={cancelEditing}
                                                    className="w-full text-xs font-bold uppercase tracking-widest"
                                                >
                                                    Cancelar
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-4">
                                                <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2">Ações do Review</h4>

                                                {selectedPost.status === 'aprovado' ? (
                                                    <div className="flex flex-col items-center justify-center py-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                                                            <Check size={24} />
                                                        </div>
                                                        <h3 className="text-xs font-bold uppercase tracking-widest">Conteúdo Aprovado</h3>
                                                        <p className="text-[9px] font-bold uppercase tracking-tight mt-2 opacity-60 text-zinc-500">Pronto para a rede social</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        <Button
                                                            onClick={handleApprove}
                                                            variant="primary"
                                                            className="w-full py-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-none text-xs font-bold uppercase tracking-widest shadow-xl shadow-zinc-900/10"
                                                        >
                                                            <Check size={16} strokeWidth={3} /> Aprovar Agora
                                                        </Button>

                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => { tryPlaySound('tap'); setIsRejecting(!isRejecting); }}
                                                            className={`w-full py-4 text-xs font-bold uppercase tracking-widest transition-all ${isRejecting ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-900 dark:border-zinc-100' : ''}`}
                                                        >
                                                            <XCircle size={14} /> Solicitar Ajuste
                                                        </Button>

                                                        {/* Caixa de Feedback */}
                                                        {isRejecting && (
                                                            <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                                <textarea
                                                                    autoFocus
                                                                    value={feedbackText}
                                                                    onChange={(e) => setFeedbackText(e.target.value)}
                                                                    placeholder="Quais ajustes são necessários?"
                                                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 text-sm font-medium text-zinc-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-white/10 min-h-[100px] resize-none"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button variant="ghost" onClick={() => setIsRejecting(false)} className="text-[10px] uppercase font-bold tracking-widest">Cancelar</Button>
                                                                    <Button
                                                                        variant="primary"
                                                                        onClick={handleSendFeedback}
                                                                        disabled={!feedbackText.trim()}
                                                                        className="flex-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] uppercase font-bold tracking-widest"
                                                                    >
                                                                        Enviar Feedback
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>

                                    {/* Histórico de Alterações / Comentários */}
                                    {!isEditing && (
                                        <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-1">
                                            <h4 className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                <MessageSquare size={14} className="opacity-50" /> Histórico de Ajustes
                                            </h4>

                                            {selectedPost.feedback.length > 0 ? (
                                                <div className="space-y-4">
                                                    {selectedPost.feedback.map((fb, idx) => (
                                                        <div key={idx} className="p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{fb.author}</span>
                                                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{fb.time}</span>
                                                            </div>
                                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{fb.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 opacity-30">
                                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sem ajustes registrados</p>
                                                </div>
                                            )}
                                        </Card>
                                    )}

                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-700">
                            <LayoutGrid size={32} className="opacity-20" />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Nenhum post selecionado</h2>
                        <p className="text-xs font-medium mt-2 opacity-50 uppercase tracking-tighter">Escolha um item na lista ao lado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
