
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './types';
import { sendCopilotMessage } from './geminiService';

interface CopilotChatProps {
  appData: any;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ appData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseText = await sendCopilotMessage(inputValue, messages, appData);
      const modelMsg: ChatMessage = {
        role: 'model',
        text: responseText,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="z-[1000] pointer-events-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed inset-0 z-[2000] md:inset-auto md:bottom-6 md:right-6 flex flex-col items-end animate-fade">
          <div className="w-full h-full md:w-[400px] md:h-[550px] bg-[#111827] md:border border-[#1F2937] md:rounded-[24px] shadow-2xl flex flex-col overflow-hidden pointer-events-auto">
            {/* Header */}
            <div className="p-5 border-b border-[#1F2937] bg-[#0F172A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
                  <i className="fa-solid fa-robot text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-white tracking-widest leading-none">Copiloto Operacional</h3>
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">AI Ativa • Gemini 3 Pro</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-[#9CA3AF] hover:text-white transition-all w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5">
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-[#0B0F19]/50">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-40 space-y-4">
                  <i className="fa-solid fa-comments text-4xl text-[#3B82F6]"></i>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Olá! Sou seu copiloto EKKO. Como posso ajudar na operação hoje?</p>
                  <div className="grid grid-cols-1 gap-2 w-full">
                    <button onClick={() => setInputValue('Analise as tarefas pendentes de hoje.')} className="text-[9px] border border-[#1F2937] rounded-lg p-2 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/30 transition-all text-left pointer-events-auto">"Analise as tarefas pendentes de hoje"</button>
                    <button onClick={() => setInputValue('Sugira ideias para o Instagram do cliente X.')} className="text-[9px] border border-[#1F2937] rounded-lg p-2 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/30 transition-all text-left pointer-events-auto">"Sugira ideias para o Instagram do cliente..."</button>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[11px] leading-relaxed font-medium ${msg.role === 'user'
                      ? 'bg-[#3B82F6] text-white rounded-tr-none'
                      : 'bg-[#1F2937] text-gray-200 rounded-tl-none border border-[#334155]/30'
                    }`}>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>
                  <span className="text-[8px] font-black text-[#334155] uppercase mt-1 tracking-widest">{msg.timestamp}</span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-[#3B82F6] animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#0F172A] border-t border-[#1F2937] flex gap-3 items-center shrink-0 mb-safe-area">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte sobre pautas, VH, finanças..."
                className="flex-1 !bg-[#0B0F19] text-xs h-10 px-4 border border-[#1F2937] rounded-xl focus:border-[#3B82F6] outline-none"
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-xl bg-[#3B82F6] text-white hover:bg-[#60A5FA] flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed pointer-events-auto"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
        <button
          onClick={() => { setIsOpen(!isOpen); logAction('Copilot Toggle'); }}
          className="w-14 h-14 rounded-2xl bg-[#3B82F6] text-white shadow-[0_8px_30px_rgb(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center text-2xl z-50 pointer-events-auto border-4 border-[#0B0F19]"
        >
          <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-robot'}`}></i>
        </button>
      </div>
    </div>
  );
};

// Helper for the App.tsx internal log
function logAction(msg: string) {
  try {
    const event = new CustomEvent('logAction', { detail: msg });
    window.dispatchEvent(event);
  } catch (e) { }
}
