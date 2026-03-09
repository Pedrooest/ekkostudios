import React, { useState, useRef } from 'react';
import {
    CheckCircle2, XCircle, MessageSquare, Smartphone,
    LayoutGrid, Clock, Check, X, Image as ImageIcon,
    Send, Filter, Copy, MoreHorizontal, Pencil, UploadCloud
} from 'lucide-react';

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
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-[#F8FAFC] dark:bg-[#0a0a0c] font-sans transition-colors">

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
            <div className="w-full md:w-[380px] flex-shrink-0 bg-white dark:bg-[#111114] border-r border-gray-200 dark:border-zinc-800 flex flex-col z-10 transition-colors">

                {/* Header da Lista */}
                <div className="p-6 pb-4 border-b border-gray-100 dark:border-zinc-800/80 shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                            <CheckCircle2 className="text-indigo-500" /> Aprovação
                        </h2>
                        <button className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ios-btn">
                            <Filter size={16} />
                        </button>
                    </div>

                    {/* Filtros de Status (Tabs) */}
                    <div className="flex bg-gray-100 dark:bg-zinc-900/80 p-1 rounded-xl mb-2">
                        {[
                            { id: 'pendente', label: 'Pendentes' },
                            { id: 'alteracao', label: 'Ajustes' },
                            { id: 'aprovado', label: 'Aprovados' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { tryPlaySound('tap'); setActiveFilter(tab.id); }}
                                className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ios-btn ${activeFilter === tab.id
                                        ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de Posts */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <CheckCircle2 size={40} className="mx-auto mb-3 text-gray-400" />
                            <p className="text-sm font-bold text-gray-500">Tudo limpo por aqui!</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div
                                key={post.id}
                                onClick={() => selectPost(post.id)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all border ios-btn flex gap-4 ${selectedPostId === post.id && !isEditing
                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30'
                                        : 'bg-white dark:bg-[#151518] border-gray-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-700'
                                    }`}
                            >
                                {/* Miniatura da Imagem */}
                                <div className="w-16 h-16 rounded-xl bg-gray-200 dark:bg-zinc-800 shrink-0 overflow-hidden relative">
                                    <img src={post.image} alt="Thumb" className="w-full h-full object-cover" />
                                    {post.format === 'Reels' && (
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                            <div className="w-6 h-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center"><div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-0.5"></div></div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-500 truncate">
                                            {post.client}
                                        </span>
                                        {post.status === 'alteracao' && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-0.5"></span>}
                                        {post.status === 'aprovado' && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-0.5"></span>}
                                    </div>
                                    <h4 className={`text-sm font-bold truncate mb-1.5 ${selectedPostId === post.id && !isEditing ? 'text-indigo-900 dark:text-indigo-400' : 'text-gray-900 dark:text-zinc-200'}`}>
                                        {post.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 dark:text-zinc-400">
                                        <span className="flex items-center gap-1"><Clock size={10} /> {post.date}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-700"></span>
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
            <div className="flex-1 flex flex-col relative bg-[#F8FAFC] dark:bg-[#0a0a0c]">
                {selectedPost ? (
                    <>
                        {/* Header de Ação Superior */}
                        <div className="px-6 sm:px-10 py-4 bg-white/80 dark:bg-[#111114]/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 flex justify-between items-center z-10 shrink-0">
                            <div>
                                <h3 className="text-sm font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    <LayoutGrid size={16} className="text-indigo-500" /> Detalhes do Post
                                </h3>
                            </div>

                            <div className="flex gap-2">
                                {!isEditing && (
                                    <button
                                        onClick={handleCopyClientLink}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-colors ios-btn"
                                        title="Copiar link para enviar ao cliente"
                                    >
                                        <Copy size={14} /> Link do Cliente
                                    </button>
                                )}
                                {/* Botão Alterado de Link para Editar */}
                                {!isEditing && (
                                    <button
                                        onClick={startEditing}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl transition-colors ios-btn"
                                    >
                                        <Pencil size={14} /> Editar Post
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Container Principal de Visualização */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 flex justify-center">

                            <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-8 items-start">

                                {/* 1. MOCKUP DO POST (Lado Esquerdo) */}
                                <div className={`w-full lg:w-[400px] shrink-0 bg-white dark:bg-[#151518] rounded-[2rem] shadow-xl border overflow-hidden flex flex-col transition-all ${isEditing ? 'border-indigo-400 dark:border-indigo-500 ring-4 ring-indigo-500/10' : 'border-gray-200 dark:border-zinc-800'}`}>

                                    {/* Header do Mockup (Fake Instagram) */}
                                    <div className="p-4 border-b border-gray-100 dark:border-zinc-800/80 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[2px] shrink-0">
                                            <div className="w-full h-full bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center text-[10px] font-black text-gray-800 dark:text-zinc-200">
                                                {(isEditing ? editingData.client : selectedPost.client).substring(0, 2).toUpperCase()}
                                            </div>
                                        </div>

                                        {/* Seleção de Cliente no Modo Edição */}
                                        <div className="flex flex-col flex-1 overflow-hidden">
                                            {isEditing ? (
                                                <select
                                                    value={editingData.client}
                                                    onChange={(e) => setEditingData({ ...editingData, client: e.target.value })}
                                                    className="w-full bg-transparent text-xs font-bold text-gray-900 dark:text-white outline-none cursor-pointer border-b border-gray-200 dark:border-zinc-700 pb-0.5"
                                                >
                                                    {CLIENTES_CADASTRADOS.map(c => (
                                                        <option key={c} value={c} className="text-gray-900 dark:text-white bg-white dark:bg-zinc-900">{c}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{selectedPost.client}</span>
                                            )}
                                            <span className="text-[10px] text-gray-500">Patrocinado</span>
                                        </div>
                                        <MoreHorizontal size={16} className="text-gray-400 shrink-0 ml-auto" />
                                    </div>

                                    {/* Imagem/Vídeo Editável */}
                                    <div
                                        className="w-full aspect-square bg-gray-100 dark:bg-zinc-900 relative group"
                                        onClick={() => isEditing ? fileInputRef.current?.click() : null}
                                    >
                                        <img
                                            src={isEditing ? editingData.image : selectedPost.image}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Overlay de Edição da Imagem */}
                                        {isEditing && (
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                                <div className="bg-white/20 p-3 rounded-full mb-2">
                                                    <UploadCloud size={24} className="text-white" />
                                                </div>
                                                <span className="text-white text-xs font-bold uppercase tracking-widest">Alterar Imagem</span>
                                            </div>
                                        )}

                                        {(!isEditing && selectedPost.format === 'Reels') && (
                                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                                                <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent"></div> Reels
                                            </div>
                                        )}
                                    </div>

                                    {/* Legenda (Copy) Editável */}
                                    <div className="p-5 flex-1 bg-white dark:bg-[#151518] flex flex-col">
                                        <div className="flex items-center gap-4 mb-3 text-gray-700 dark:text-zinc-300">
                                            <svg aria-label="Gostar" className="x1lliihq x1n2onr6 xyb1xck" color="currentColor" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24"><path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.514 1.118 1.514s.278-.339 1.118-1.514a4.21 4.21 0 0 1 3.675-1.941z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path></svg>
                                            <MessageSquare size={24} />
                                            <Send size={24} />
                                        </div>

                                        {isEditing ? (
                                            <textarea
                                                value={editingData.copy}
                                                onChange={(e) => setEditingData({ ...editingData, copy: e.target.value })}
                                                className="w-full flex-1 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg p-3 text-sm text-gray-800 dark:text-zinc-200 resize-none outline-none focus:ring-2 focus:ring-indigo-500/50 custom-scrollbar min-h-[150px]"
                                                placeholder="Escreva a legenda aqui..."
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                                                <span className="font-bold mr-2">{selectedPost.client}</span>
                                                {selectedPost.copy}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* 2. PAINEL DE CONTROLE (Lado Direito) */}
                                <div className="flex-1 w-full max-w-[400px] flex flex-col gap-6">

                                    {/* Painel de Edição vs Aprovação */}
                                    <div className="bg-white dark:bg-[#111114] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                                        {isEditing ? (
                                            <>
                                                <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-4">Modo de Edição Ativo</h4>
                                                <div className="flex flex-col gap-3">
                                                    <button
                                                        onClick={saveEditing}
                                                        className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all ios-btn"
                                                    >
                                                        <Check size={18} strokeWidth={3} /> Guardar Alterações
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 rounded-xl text-sm font-bold transition-all ios-btn"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h4 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4">Ação de Equipe / Cliente</h4>

                                                {selectedPost.status === 'aprovado' ? (
                                                    <div className="flex flex-col items-center justify-center py-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 size={48} className="mb-3" />
                                                        <h3 className="text-lg font-black uppercase tracking-wider">Conteúdo Aprovado</h3>
                                                        <p className="text-xs font-medium mt-1 opacity-80">Pronto para agendamento.</p>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        <button
                                                            onClick={handleApprove}
                                                            className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all ios-btn"
                                                        >
                                                            <Check size={18} strokeWidth={3} /> Aprovar Conteúdo
                                                        </button>

                                                        <button
                                                            onClick={() => { tryPlaySound('tap'); setIsRejecting(!isRejecting); }}
                                                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-black uppercase tracking-wider transition-all ios-btn border-2 ${isRejecting ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-500' : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                                                        >
                                                            <X size={18} strokeWidth={3} /> Solicitar Alteração
                                                        </button>

                                                        {/* Caixa de Feedback (Aparece se clicar em Solicitar Alteração) */}
                                                        {isRejecting && (
                                                            <div className="mt-2 animate-in slide-in-from-top-2">
                                                                <textarea
                                                                    autoFocus
                                                                    value={feedbackText}
                                                                    onChange={(e) => setFeedbackText(e.target.value)}
                                                                    placeholder="O que precisa ser alterado? (ex: Mudar a cor do fundo, ajustar a frase...)"
                                                                    className="w-full bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 text-sm font-medium text-gray-800 dark:text-zinc-200 outline-none focus:ring-2 focus:ring-amber-500/50 min-h-[100px] resize-none mb-3 placeholder:text-amber-700/40 dark:placeholder:text-amber-500/40"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => setIsRejecting(false)} className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors ios-btn">Cancelar</button>
                                                                    <button onClick={handleSendFeedback} disabled={!feedbackText.trim()} className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md shadow-amber-500/20 transition-all ios-btn">Enviar Feedback</button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Histórico de Alterações / Comentários */}
                                    {!isEditing && (
                                        <div className="bg-white dark:bg-[#111114] p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex-1">
                                            <h4 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <MessageSquare size={14} /> Histórico de Ajustes
                                            </h4>

                                            {selectedPost.feedback.length > 0 ? (
                                                <div className="space-y-4">
                                                    {selectedPost.feedback.map((fb, idx) => (
                                                        <div key={idx} className="p-4 bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-xl">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-xs font-bold text-gray-900 dark:text-zinc-200">{fb.author}</span>
                                                                <span className="text-[10px] font-medium text-gray-400">{fb.time}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-zinc-400 leading-relaxed">{fb.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 opacity-50">
                                                    <p className="text-sm font-medium text-gray-500">Nenhuma solicitação registrada.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600">
                        <LayoutGrid size={64} className="mb-4 opacity-50" />
                        <h2 className="text-xl font-black">Nenhum post selecionado</h2>
                        <p className="text-sm font-medium mt-1">Selecione um conteúdo na lista lateral para visualizar ou aprovar.</p>
                    </div>
                )}
            </div>

        </div>
    );
}
