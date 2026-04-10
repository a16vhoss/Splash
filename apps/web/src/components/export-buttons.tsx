// apps/web/src/components/export-buttons.tsx
'use client';

import { useState } from 'react';
import { useToast } from '@/components/toast';
import { buildExportFilename } from '@/lib/exports/filename';
import { triggerDownload } from '@/lib/exports/trigger-download';
import type { Analytics, ExportMeta } from '@/lib/exports/types';

interface ExportButtonsProps {
  data: Analytics;
  meta: ExportMeta;
}

const CHART_SELECTORS = {
  revenue: '#revenue-line-chart-export',
  stacked: '#stacked-services-chart-export',
};

export function ExportButtons({ data, meta }: ExportButtonsProps) {
  const toast = useToast();
  const [loadingFormat, setLoadingFormat] = useState<'xlsx' | 'pdf' | null>(null);

  const hasData = data.series.length > 0 || data.topServices.length > 0;
  const disabled = !hasData || loadingFormat !== null;

  async function handleExcel() {
    if (disabled) return;
    setLoadingFormat('xlsx');
    try {
      const { generateExcel } = await import('@/lib/exports/excel-exporter');
      const blob = await generateExcel({ data, meta });
      const filename = buildExportFilename(meta.carWashName, meta.fromDate, meta.toDate, 'xlsx');
      triggerDownload(blob, filename);
    } catch (err) {
      console.error('Excel export failed:', err);
      toast('No se pudo generar el Excel', 'error');
    } finally {
      setLoadingFormat(null);
    }
  }

  async function handlePdf() {
    if (disabled) return;
    setLoadingFormat('pdf');
    try {
      const { generatePdf } = await import('@/lib/exports/pdf-exporter');
      const blob = await generatePdf({ data, meta, chartSelectors: CHART_SELECTORS });
      const filename = buildExportFilename(meta.carWashName, meta.fromDate, meta.toDate, 'pdf');
      triggerDownload(blob, filename);
    } catch (err) {
      console.error('PDF export failed:', err);
      toast('No se pudo generar el PDF', 'error');
    } finally {
      setLoadingFormat(null);
    }
  }

  const baseClass =
    'px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors border border-border bg-white text-foreground hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center gap-2" title={!hasData ? 'Sin datos para exportar' : undefined}>
      <button
        type="button"
        onClick={handleExcel}
        disabled={disabled}
        className={baseClass}
      >
        {loadingFormat === 'xlsx' ? 'Generando...' : '📊 Excel'}
      </button>
      <button
        type="button"
        onClick={handlePdf}
        disabled={disabled}
        className={baseClass}
      >
        {loadingFormat === 'pdf' ? 'Generando...' : '📄 PDF'}
      </button>
    </div>
  );
}
