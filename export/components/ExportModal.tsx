import React from 'react';
import { Button } from '../../Components';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExportExcel: () => void;
    onExportPNG: () => void;
    onExportPDF?: () => void;
    isProcessing: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
    isOpen, onClose, onExportExcel, onExportPNG, onExportPDF, isProcessing
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#111118] border border-[#24243A] rounded-2xl w-[95vw] md:w-[500px] overflow-hidden shadow-2xl transform transition-all scale-100">

                {/* Header */}
                <div className="p-6 border-b border-[#24243A] flex justify-between items-center bg-[#0B0B0E]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#C8A24A]/10 flex items-center justify-center text-[#C8A24A] border border-[#C8A24A]/20">
                            <i className="fa-solid fa-file-export"></i>
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm uppercase tracking-widest">Exportar Relatório</h3>
                            <p className="text-[#B7B7C2] text-xs">Selecione o formato desejado</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-[#B7B7C2] hover:text-white transition-colors">
                        <i className="fa-solid fa-times text-lg"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 grid gap-4">

                    {/* Excel Option */}
                    <button
                        onClick={onExportExcel}
                        disabled={isProcessing}
                        className="group flex items-center p-4 rounded-xl border border-[#24243A] bg-[#151521] hover:bg-[#1A1A24] hover:border-[#10b981]/50 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-lg bg-[#10b981]/10 flex items-center justify-center text-[#10b981] text-2xl group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-file-excel"></i>
                        </div>
                        <div className="ml-4 flex-1">
                            <h4 className="text-white font-bold text-sm group-hover:text-[#10b981] transition-colors">Relatório Executivo (Excel)</h4>
                            <p className="text-[#B7B7C2] text-xs mt-1">Planilha formatada com dados completos, métricas e links.</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[#24243A] group-hover:text-[#10b981] transition-colors"></i>
                    </button>

                    {/* PNG Option */}
                    <button
                        onClick={onExportPNG}
                        disabled={isProcessing}
                        className="group flex items-center p-4 rounded-xl border border-[#24243A] bg-[#151521] hover:bg-[#1A1A24] hover:border-[#C8A24A]/50 transition-all text-left"
                    >
                        <div className="w-12 h-12 rounded-lg bg-[#C8A24A]/10 flex items-center justify-center text-[#C8A24A] text-2xl group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-image"></i>
                        </div>
                        <div className="ml-4 flex-1">
                            <h4 className="text-white font-bold text-sm group-hover:text-[#C8A24A] transition-colors">Slide Profissional (PNG)</h4>
                            <p className="text-[#B7B7C2] text-xs mt-1">Imagem 1920x1080 com layout visual e KPIs.</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[#24243A] group-hover:text-[#C8A24A] transition-colors"></i>
                    </button>

                    {/* PDF Option */}
                    <button
                        onClick={onExportPDF}
                        disabled={isProcessing || !onExportPDF}
                        className={`group flex items-center p-4 rounded-xl border border-[#24243A] bg-[#151521] transition-all text-left ${onExportPDF ? 'hover:bg-[#1A1A24] hover:border-rose-500/50' : 'opacity-50 cursor-not-allowed'}`}
                    >
                        <div className="w-12 h-12 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 text-2xl group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-file-pdf"></i>
                        </div>
                        <div className="ml-4 flex-1">
                            <h4 className="text-white font-bold text-sm group-hover:text-rose-500 transition-colors">Relatório (PDF)</h4>
                            <p className="text-[#B7B7C2] text-xs mt-1">Relatório executivo paginado com dados completos.</p>
                        </div>
                        <i className="fa-solid fa-chevron-right text-[#24243A] group-hover:text-rose-500 transition-colors"></i>
                    </button>

                </div>

                {/* Footer */}
                {isProcessing && (
                    <div className="px-6 py-3 bg-[#C8A24A]/10 text-[#C8A24A] text-xs font-bold text-center border-t border-[#C8A24A]/20">
                        <i className="fa-solid fa-circle-notch fa-spin mr-2"></i> PROCESSANDO EXPORTAÇÃO...
                    </div>
                )}
            </div>
        </div>
    );
};
