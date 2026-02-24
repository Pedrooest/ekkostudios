import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Badge } from './Components';
import { TipoTabela } from './types';
import { AssistantResponse, AssistantAction } from './ai/types';
import { buildContext } from './ai/contextBuilder';
import { renderPrompt } from './ai/promptTemplates';
import { callGemini, parseAssistantResponse } from './ai/geminiGateway';


interface AssistantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    activeTab: TipoTabela;
    appState: any;
    onApplyAction: (action: AssistantAction) => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
    isOpen, onClose, activeTab, appState, onApplyAction
}) => {
    const [mode, setMode] = useState<'chat' | 'action'>('chat');
    const [objective, setObjective] = useState<string>('Analise o contexto atual');
    const [userNotes, setUserNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [lastResponse, setLastResponse] = useState<AssistantResponse | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, lastResponse]);

    const handleGenerate = async () => {
        setLoading(true);
        const context = buildContext(activeTab, appState);
        const prompt = renderPrompt(activeTab, objective, mode, context, userNotes);

        // Optimistic UI update
        const userMsg = { role: 'user', text: `${objective} ${userNotes ? `(${userNotes})` : ''}` };
        setHistory(prev => [...prev, userMsg]);

        const responseText = await callGemini(prompt, history);

        if (mode === 'action') {
            const parsed = parseAssistantResponse(responseText);
            setLastResponse(parsed);
            setHistory(prev => [...prev, { role: 'model', text: 'Análise concluída. Veja o resultado abaixo.' }]);
        } else {
            setHistory(prev => [...prev, { role: 'model', text: responseText }]);
        }
        setLoading(false);
    };



    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-app-surface border-l border-app-border shadow-2xl z-50 flex flex-col transition-transform duration-300">
            {/* Header */}
            <div className="p-4 border-b border-app-border flex justify-between items-center bg-app-surface-2">
                <div>
                    <h2 className="text-app-text-strong font-bold text-sm tracking-widest uppercase">Assistente Organick</h2>
                    <span className="text-[10px] text-app-text-muted">Contexto: {activeTab}</span>
                </div>
                <button onClick={onClose} className="text-app-text-muted hover:text-app-text-strong transition-colors">
                    <i className="fa-solid fa-times"></i>
                </button>
            </div>

            {/* Controls */}
            <div className="p-4 space-y-3 bg-app-bg/50">
                <div className="flex gap-2">
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as any)}
                        className="flex-1 bg-app-input border border-app-border text-app-text-strong text-xs rounded-md p-2 outline-none focus:border-app-accent shadow-sm"
                    >
                        <option value="chat">Modo Conversa</option>
                        <option value="action">Modo Ação</option>
                    </select>
                    <select
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        className="flex-1 bg-app-input border border-app-border text-app-text-strong text-xs rounded-md p-2 outline-none focus:border-app-accent shadow-sm"
                    >
                        <option value="Analise o contexto atual">Analisar Contexto</option>
                        <option value="Otimizar esta aba">Otimizar Aba</option>
                        <option value="Gerar ideias">Gerar Ideias</option>
                        <option value="Criar checklist">Criar Checklist</option>
                        <option value="Revisar e apontar ajustes">Revisar Pontos</option>
                    </select>
                </div>
                <textarea
                    className="w-full bg-app-input border border-app-border text-app-text-strong text-xs rounded-md p-2 outline-none focus:border-app-accent resize-none h-20 shadow-sm placeholder:text-app-text-muted/50"
                    placeholder="Instruções extras (opcional)..."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                />
                <Button onClick={handleGenerate} disabled={loading} className="w-full" variant="primary">
                    {loading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <><i className="fa-solid fa-sparkles"></i> Gerar Sugestões</>}
                </Button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {history.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white shadow-md' : 'bg-app-surface-2 text-app-text-muted border border-app-border'}`}>
                            <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                        </div>
                    </div>
                ))}

                {/* Helper for Action Mode Result */}
                {mode === 'action' && lastResponse && (
                    <div className="bg-app-surface border border-app-border rounded-xl p-4 mt-4 animate-fade-in shadow-sm">
                        <h4 className="text-app-accent font-bold text-xs uppercase mb-2">Resumo da Análise</h4>
                        <p className="text-app-text text-xs mb-4">{lastResponse.summary}</p>

                        {lastResponse.issues.length > 0 && (
                            <div className="mb-4">
                                <span className="text-rose-500 font-bold text-[10px] uppercase block mb-1">Pontos de Atenção</span>
                                {lastResponse.issues.map((issue, i) => (
                                    <div key={i} className="flex gap-2 items-start mb-2 last:mb-0">
                                        <i className="fa-solid fa-exclamation-triangle text-rose-500 text-[10px] mt-0.5"></i>
                                        <div>
                                            <span className="text-app-text-strong text-xs font-bold block">{issue.title}</span>
                                            <span className="text-app-text-muted text-[10px]">{issue.why}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {lastResponse.actions.length > 0 && (
                            <div>
                                <span className="text-emerald-500 font-bold text-[10px] uppercase block mb-2">Ações Sugeridas</span>
                                {lastResponse.actions.map((action, i) => (
                                    <div key={i} className="bg-app-bg p-2 rounded border border-app-border mb-2 flex justify-between items-center group hover:border-app-accent/50 transition-colors">
                                        <span className="text-app-text-strong text-xs truncate max-w-[200px]">{action.type.replace(/_/g, ' ')}</span>
                                        <button
                                            onClick={() => onApplyAction(action)}
                                            className="text-app-accent hover:bg-app-accent hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-all"
                                        >
                                            APLICAR
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}


                    </div>
                )}
            </div>


        </div>
    );
};
