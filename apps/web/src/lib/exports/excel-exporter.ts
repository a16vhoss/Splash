// apps/web/src/lib/exports/excel-exporter.ts
import * as XLSX from 'xlsx';
import type { Analytics, ExportMeta } from './types';

interface GenerateExcelOpts {
  data: Analytics;
  meta: ExportMeta;
}

const GROUP_LABELS: Record<ExportMeta['groupBy'], string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
};

/**
 * Generates a 4-sheet XLSX workbook for the analytics report.
 * Returns a Blob ready to download.
 */
export async function generateExcel({ data, meta }: GenerateExcelOpts): Promise<Blob> {
  const wb = XLSX.utils.book_new();

  // Metadata
  wb.Props = {
    Title: `Reporte - ${meta.carWashName}`,
    Subject: `Análisis ${meta.fromDate} - ${meta.toDate}`,
    Author: 'Splash',
    CreatedDate: meta.generatedAt,
  };

  // ─── Sheet 1: Resumen ───
  const resumenRows: (string | number)[][] = [
    [meta.carWashName],
    ['Reporte de análisis'],
    [],
    ['Rango:', `${meta.fromDate} a ${meta.toDate}`],
    ['Agrupación:', GROUP_LABELS[meta.groupBy]],
    ['Generado:', formatDateTime(meta.generatedAt)],
    [],
    ['KPIs'],
    ['Métrica', 'Valor'],
    ['Citas totales', data.totalAppointments],
    ['Completadas', data.completedCount],
    ['Ingresos (MXN)', data.totalRevenue],
    ['Tasa de cancelación (%)', data.cancelRate],
    ['Canceladas', data.cancelledCount],
    ['Clientes únicos', data.uniqueClients],
    [],
    ['Generado por Splash'],
  ];
  const resumenSheet = XLSX.utils.aoa_to_sheet(resumenRows);
  resumenSheet['!cols'] = [{ wch: 24 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen');

  // ─── Sheet 2: Serie temporal ───
  const serieRows: (string | number)[][] = [
    ['Período', 'Etiqueta', 'Unidades', 'Ingresos (MXN)'],
    ...data.series.map((s) => [s.period, s.periodLabel, s.units, s.revenue]),
  ];
  const serieSheet = XLSX.utils.aoa_to_sheet(serieRows);
  serieSheet['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, serieSheet, 'Serie temporal');

  // ─── Sheet 3: Servicios ───
  const serviciosRows: (string | number)[][] = [
    ['#', 'Servicio', 'Unidades', 'Ingresos (MXN)', 'Ticket prom. (MXN)', '% del total'],
    ...data.topServices.map((s, i) => [
      i + 1,
      s.serviceName,
      s.units,
      Math.round(s.revenue),
      Math.round(s.avgTicket),
      s.pctOfUnits,
    ]),
  ];
  const serviciosSheet = XLSX.utils.aoa_to_sheet(serviciosRows);
  serviciosSheet['!cols'] = [
    { wch: 4 },
    { wch: 28 },
    { wch: 12 },
    { wch: 16 },
    { wch: 18 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, serviciosSheet, 'Servicios');

  // ─── Sheet 4: Horarios ───
  const sortedHours = Object.entries(data.byHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const horariosRows: (string | number)[][] = [
    ['Hora', 'Citas'],
    ...sortedHours.map(([hour, count]) => [hour, count]),
  ];
  const horariosSheet = XLSX.utils.aoa_to_sheet(horariosRows);
  horariosSheet['!cols'] = [{ wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, horariosSheet, 'Horarios');

  // Write to Blob
  const arrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  return new Blob([arrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
