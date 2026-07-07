
import { useState, useCallback } from 'react';
import { ExportConfig } from '../types';

// Engines are dynamically imported so exceljs (~940kB) and jspdf (~350kB)
// stay OUT of the initial bundle — they load on first actual export.

export const useExport = () => {
    const [isExporting, setIsExporting] = useState(false);

    const exportExcel = useCallback(async (config: ExportConfig) => {
        setIsExporting(true);
        try {
            const { generateExcelReport } = await import('../engines/ExcelEngine');
            await generateExcelReport(config);
            return true;
        } catch (error) {
            console.error('Excel Export Error:', error);
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
            const { captureSlide } = await import('../engines/PngEngine');
            await captureSlide(slideElementId, `Slide_Organick_${config.tab}_${config.Cliente}`);
            return true;
        } catch (error) {
            console.error('PNG Export Error:', error);
            return false;
        } finally {
            setIsExporting(false);
        }
    }, []);

    const exportPdf = useCallback(async (config: ExportConfig) => {
        setIsExporting(true);
        try {
            const { generatePdfReport } = await import('../engines/PdfEngine');
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
