
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportConfig } from '../types';

export const generatePdfReport = async (config: ExportConfig): Promise<void> => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    // --- Header ---
    // Logo (Placeholder - ideal would be base64 or image url)
    doc.setFillColor(10, 10, 10); // Dark background for header
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(config.title.toUpperCase(), margin, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitle = `${config.subtitle} • ${config.client}`;
    doc.text(subtitle.toUpperCase(), margin, 32);

    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, pageWidth - margin, 20, { align: 'right' });
    doc.text('Relatório Executivo Organick', pageWidth - margin, 32, { align: 'right' });

    let currentY = 50;

    // --- Metrics (Executive Summary) ---
    if (config.metrics && config.metrics.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'bold');
        doc.text("RESUMO EXECUTIVO", margin, currentY);
        currentY += 8;

        const metricsPerRow = 3;
        const metricsGap = 10;
        const metricWidth = (pageWidth - (margin * 2) - (metricsGap * (metricsPerRow - 1))) / metricsPerRow;

        config.metrics.forEach((metric, index) => {
            const rowIndex = Math.floor(index / metricsPerRow);
            const colIndex = index % metricsPerRow;

            const x = margin + (colIndex * (metricWidth + metricsGap));
            const y = currentY + (rowIndex * 25);

            // Metric Box
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(250, 250, 250);
            doc.roundedRect(x, y, metricWidth, 20, 2, 2, 'FD');

            // Label
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(metric.label.toUpperCase(), x + 4, y + 8);

            // Value
            doc.setFontSize(12);
            doc.setTextColor(31, 41, 55); // Gray-800
            doc.setFont('helvetica', 'bold');
            doc.text(String(metric.value), x + 4, y + 16);

            // Indicator Stripe
            if (metric.color) {
                doc.setFillColor(metric.color);
                doc.rect(x, y, 1, 20, 'F');
            }
        });

        currentY += (Math.ceil(config.metrics.length / metricsPerRow) * 25) + 10;
    }

    // --- Main Table ---
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.setFont('helvetica', 'bold');
    doc.text("DETALHAMENTO", margin, currentY);
    currentY += 5;

    // Columns
    const tableColumns = config.columns.map(col => ({ header: col.label, dataKey: col.key }));

    // Data Rows
    const tableData = config.data.map(row => {
        const rowData: any = {};
        config.columns.forEach(col => {
            let val = row[col.key];
            // Simple formatting
            if (col.format === 'date' && val) val = new Date(val).toLocaleDateString();
            // if (col.format === 'currency') ...
            rowData[col.key] = val !== undefined && val !== null ? String(val) : '-';
        });
        return rowData;
    });

    autoTable(doc, {
        startY: currentY,
        head: [tableColumns.map(c => c.header)],
        body: tableData.map(row => tableColumns.map(c => row[c.dataKey])),
        theme: 'grid',
        styles: {
            fontSize: 8,
            cellPadding: 3,
            textColor: [50, 50, 50],
            lineColor: [230, 230, 230],
            lineWidth: 0.1,
            overflow: 'linebreak' // 'ellipsize'
        },
        headStyles: {
            fillColor: [31, 41, 55], // Gray-800
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251] // Gray-50
        },
        margin: { top: 45, bottom: 20 },
        didDrawPage: (data) => {
            // Footer (Page Number)
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });

            // Re-draw Header on new pages if needed (except first which is manual)
            if (data.pageNumber > 1) {
                // Simplified header for subsequent pages could go here
            }
        }
    });

    // Save
    const filename = `Relatorio_${config.tab}_${config.client.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};
