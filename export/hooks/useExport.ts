
import { useState, useCallback } from 'react';
import { ExportConfig } from '../types';
import { generateExcelReport } from '../engines/ExcelEngine';
import { generatePdfReport } from '../engines/PdfEngine';
import { captureSlide } from '../engines/PngEngine';

export const useExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    const exportExcel = useCallback(async (config: ExportConfig) => {
        setIsExporting(true);
        try {
            await generateExcelReport(config);
            return true;
        } catch (error) {
            console.error('Excel Export Error:', error);
            // alert('Erro ao gerar Excel. Verifique o console.'); // UI will handle notification
            return false;
        } finally {
            setIsExporting(false);
        }
    }, []);

    const exportPng = useCallback(async (config: ExportConfig, slideElementId: string) => {
        setIsExporting(true);
        // Needed to wait for render of hidden slide
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
            await captureSlide(slideElementId, `Slide_Organick_${config.tab}_${config.client}`);
            return true;
        } catch (error) {
            console.error('PNG Export Error:', error);
            // alert('Erro ao gerar PNG. Verifique o console.'); // UI will handle notification
            return false;
        } finally {
            setIsExporting(false);
        }
    }, []);

    const exportPdf = useCallback(async (config: ExportConfig) => {
        setIsExporting(true);
        try {
            await generatePdfReport(config);
            return true;
        } catch (error) {
            console.error('PDF Export Error:', error);
            return false;
        } finally {
            setIsExporting(false);
        }
    }, []);

    return {
        isExporting,
        exportExcel,
        exportPng,
        exportPdf
    };
};
