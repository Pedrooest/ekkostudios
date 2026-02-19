import React, { useState } from 'react';

interface WhiteboardAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => Promise<void>;
}

export function WhiteboardAIModal({ isOpen, onClose, onGenerate }: WhiteboardAIModalProps) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        try {
            await onGenerate(prompt);
            onClose();
            setPrompt('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#1E293B] border border-white/10 rounded-2xl p-6 shadow-2xl animate-fade-up">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center">
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Ekko AI</h3>
                            <p className="text-xs text-slate-400">Gerador de Ideias</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Sobre o que você quer pensar hoje?</label>
                    <textarea
                        className="w-full h-32 bg-[#0F172A] border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-purple-500/50 transition-colors resize-none placeholder-slate-600"
                        placeholder="Ex: Crie 5 ideias de posts para o Instagram sobre Marketing Digital..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        autoFocus
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-white font-bold shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                            Gerando Ideias...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            Gerar Ideias
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
