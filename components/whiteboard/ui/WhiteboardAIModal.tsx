import React, { useState } from 'react';

interface WhiteboardAIModalProps {
    isOpen: boolean;
    isLoading: boolean;
    onClose: () => void;
    onGenerate: (prompt: string) => void;
}

export function WhiteboardAIModal({ isOpen, isLoading, onClose, onGenerate }: WhiteboardAIModalProps) {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(prompt);
        setPrompt(''); // Clear after submit
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade">
            <div className="bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    disabled={isLoading}
                >
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                        <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Ekko AI Brainstorming</h2>
                        <p className="text-xs text-slate-400">Gere ideias criativas instantaneamente.</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                            Sobre o que você quer pensar?
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Escreva algo aqui (Ex: Ideias para Marketing)..."
                            className="w-full h-32 rounded-xl p-4 transition-all resize-none text-sm leading-relaxed !text-white !bg-slate-900 !border !border-slate-700 placeholder:!text-slate-500"
                            style={{
                                opacity: 1
                            }}
                            autoFocus
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wide"
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!prompt.trim() || isLoading}
                            className={`
                                px-6 py-2 rounded-lg flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white transition-all
                                ${isLoading ? 'bg-purple-600/50 cursor-wait' : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20 active:scale-95'}
                            `}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-bolt"></i>
                                    Gerar Ideias
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
