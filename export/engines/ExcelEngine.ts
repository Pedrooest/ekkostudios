import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ExportConfig, ExportContext } from '../types';

export const generateExcelReport = async (config: ExportConfig, context: ExportContext = {}) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = context.user || 'Organick App';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(config.title.substring(0, 31)); // Max 31 chars

    // 1. CORPORATE HEADER
    // ---------------------------------------------------------
    // Merged Header Block
    sheet.mergeCells('A1:H4');
    const headerCell = sheet.getCell('A1');
    headerCell.value = {
        richText: [
            { font: { size: 18, bold: true, name: 'Segoe UI' }, text: `EKKO STUDIOS — ${config.title}\n` },
            { font: { size: 12, name: 'Segoe UI', color: { argb: 'FF666666' } }, text: `CLIENTE: ${config.client.toUpperCase()}  |  DATA: ${new Date().toLocaleDateString('pt-BR')}` }
        ]
    };
    headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' } // Light Gray similar to App
    };
    headerCell.border = { bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } };

    // 2. EXECUTIVE SUMMARY
    // ---------------------------------------------------------
    sheet.mergeCells('A6:H6');
    sheet.getCell('A6').value = 'RESUMO EXECUTIVO';
    sheet.getCell('A6').font = { bold: true, size: 12, color: { argb: 'FF3B82F6' } };

    let currentRow = 7;
    config.metrics.forEach((metric) => {
        sheet.getCell(`A${currentRow}`).value = metric.label;
        sheet.getCell(`A${currentRow}`).font = { bold: true };
        sheet.getCell(`B${currentRow}`).value = metric.value;
        sheet.getCell(`B${currentRow}`).alignment = { horizontal: 'left' };
        currentRow++;
    });

    currentRow += 2; // Spacer

    // 3. DATA TABLE
    // ---------------------------------------------------------

    // Define columns structure
    sheet.columns = config.columns.map((col, index) => ({
        header: col.label.toUpperCase(),
        key: col.key,
        width: col.width || 20,
        style: { alignment: { horizontal: col.alignment || 'left' } }
    }));

    // Add Headers Row with Styling
    const headerRow = sheet.getRow(currentRow);
    headerRow.values = config.columns.map(c => c.label.toUpperCase());
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }; // Dark header
    headerRow.alignment = { horizontal: 'center' };

    // Add Data Rows
    config.data.forEach((item, index) => {
        const row = sheet.addRow(config.columns.map(col => {
            let val = item[col.key];
            // Input sanitization: placeholders become "Pendente"
            if (typeof val === 'string' && (val.includes('Preencha') || val === '')) {
                return 'Pendente';
            }
            return val;
        }));

        // Zebra Striping
        if (index % 2 !== 0) {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
        }
        row.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
    });

    // 4. LEGENDS / GLOSSARY
    // ---------------------------------------------------------
    if (config.legends) {
        const startLegend = sheet.rowCount + 3;
        sheet.getCell(`A${startLegend}`).value = 'COMO LER ESTE RELATÓRIO:';
        sheet.getCell(`A${startLegend}`).font = { bold: true, size: 10, color: { argb: 'FF6B7280' } };

        let legRow = startLegend + 1;
        Object.entries(config.legends).forEach(([key, desc]) => {
            sheet.getCell(`A${legRow}`).value = `${key}: ${desc}`;
            sheet.getCell(`A${legRow}`).font = { italic: true, size: 9, color: { argb: 'FF9CA3AF' } };
            legRow++;
        });
    }

    // Generate Buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Relatorio_Organick_${config.tab}_${config.client}.xlsx`);
};
