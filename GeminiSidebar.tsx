
import React, { useState } from 'react';
import { TipoTabela } from './types';
import { analyzeContextualData } from './geminiService';
import { Button, Badge } from './Components';

interface GeminiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TipoTabela;
  tabData: any;
}

export const GeminiSidebar: React.FC<GeminiSidebarProps> = ({ isOpen, onClose, activeTab, tabData }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setAnalysis('');
    try {
      const result = await analyzeContextualData(activeTab, tabData);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setAnalysis("Falha na comunicação estratégica.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-app-surface border-l border-app-border shadow-2xl z-[150] flex flex-col animate-fade pointer-events-auto">
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-8 bg-app-surface-2 border-b border-app-border">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase text-app-text-strong tracking-widest">Gemini Assistente</h3>
            <p className="text-[9px] font-bold text-app-text-muted uppercase">Contexto: {activeTab}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-app-text-muted hover:text-app-text-strong transition-all">
          <i className="fa-solid fa-xmark text-2xl"></i>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-app-bg">
        <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 space-y-4">
          <h4 className="text-xs font-black uppercase text-blue-500 tracking-widest">Análise de Dados</h4>
          <p className="text-[11px] text-app-text-muted font-medium leading-relaxed">
            Clique no botão abaixo para que a IA analise todos os registros da aba <span className="text-app-text-strong font-bold">{activeTab}</span> e sugira melhorias estratégicas baseadas no Método Organick.
          </p>
          <Button onClick={handleGenerate} disabled={isLoading} className="w-full h-12 !bg-blue-600 !text-white shadow-xl shadow-blue-600/20 hover:!bg-blue-700">
            {isLoading ? <><i className="fa-solid fa-circle-notch fa-spin mr-2"></i>Processando Dados...</> : <><i className="fa-solid fa-bolt mr-2"></i>Gerar Sugestões</>}
          </Button>
        </div>

        {analysis && (
          <div className="space-y-6 animate-fade">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
              <h4 className="text-[10px] font-black uppercase text-app-text-muted tracking-[0.2em]">Insights Estratégicos</h4>
            </div>
            <div className="bg-app-surface border border-app-border rounded-2xl p-8 text-[11px] leading-relaxed text-app-text font-medium whitespace-pre-wrap uppercase">
              {analysis}
            </div>
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-center gap-3">
              <i className="fa-solid fa-circle-info text-emerald-500 text-xs"></i>
              <p className="text-[9px] font-bold text-emerald-500/70 uppercase">As sugestões acima são consultivas e não alteram seus dados reais.</p>
            </div>
          </div>
        )}

        {!analysis && !isLoading && (
          <div className="h-64 flex flex-col items-center justify-center opacity-20 space-y-4 text-center px-10">
            <i className="fa-solid fa-microchip text-5xl"></i>
            <p className="text-[10px] font-black uppercase tracking-widest leading-loose">Aguardando comando para análise estratégica...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-app-border bg-app-surface-2">
        <div className="flex justify-between items-center opacity-40 text-app-text-muted">
          <span className="text-[8px] font-black uppercase tracking-widest">Powered by Google Gemini</span>
          <i className="fa-solid fa-sparkles text-xs"></i>
        </div>
      </div>
    </div>
  );
};
