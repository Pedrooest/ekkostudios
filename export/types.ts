import { TableType } from '../types';

export interface ExportColumn {
    key: string;
    label: string;
    width?: number;
    format?: 'text' | 'date' | 'currency' | 'number' | 'status' | 'percentage';
    alignment?: 'left' | 'center' | 'right';
}

export interface ExportMetric {
    label: string;
    value: string | number;
    color?: string; // Hex code for KPI cards
}

export interface ExportConfig {
    tab: TableType;
    title: string;
    subtitle: string;
    client: string; // Client Name
    data: any[];
    columns: ExportColumn[];
    metrics: ExportMetric[];
    legends?: Record<string, string>; // e.g., "Score > 80: Implementar Já"
    priorityColumns?: string[]; // Columns to show in Low Density mode (Compact)
    density?: 'low' | 'medium' | 'high'; // For PNG adaptive layout
}

export interface ExportContext {
    logoPath?: string;
    workspaceName?: string;
    user?: string;
}
