// apps/web/src/lib/exports/pdf-exporter.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { Analytics, ExportMeta } from './types';

interface GeneratePdfOpts {
  data: Analytics;
  meta: ExportMeta;
  chartSelectors: {
    revenue: string;   // CSS selector or id (e.g. '#revenue-line-chart-export')
    stacked: string;   // e.g. '#stacked-services-chart-export'
  };
}

const GROUP_LABELS: Record<ExportMeta['groupBy'], string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
};

// Page geometry (mm, A4 portrait)
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_HEIGHT = 10;

// Colors (RGB tuples for jsPDF)
const ACCENT: [number, number, number] = [5, 150, 105];       // #059669
const FOREGROUND: [number, number, number] = [15, 23, 42];    // #0F172A
const MUTED: [number, number, number] = [100, 116, 139];      // #64748B

/**
 * Generates a multi-page A4 PDF report.
 * Captures the two big charts from the DOM via html2canvas and embeds them as images.
 * Returns a Blob ready to download.
 */
export async function generatePdf({
  data,
  meta,
  chartSelectors,
}: GeneratePdfOpts): Promise<Blob> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  let cursorY = MARGIN;

  // ─── Header ───
  doc.setTextColor(ACCENT[0], ACCENT[1], ACCENT[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(meta.carWashName, MARGIN, cursorY + 6);
  cursorY += 10;

  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Reporte de análisis', MARGIN, cursorY + 4);
  cursorY += 6;

  doc.setFontSize(10);
  doc.text(
    `${meta.fromDate} a ${meta.toDate} · ${GROUP_LABELS[meta.groupBy]}`,
    MARGIN,
    cursorY + 4
  );
  cursorY += 7;

  // Horizontal separator
  doc.setDrawColor(226, 232, 240); // border color
  doc.line(MARGIN, cursorY, PAGE_WIDTH - MARGIN, cursorY);
  cursorY += 6;

  // ─── KPIs section ───
  cursorY = drawSectionHeading(doc, 'KPIs', cursorY);
  cursorY = drawKpiGrid(doc, data, cursorY);
  cursorY += 6;

  // ─── Revenue chart ───
  cursorY = ensureSpace(doc, 80, cursorY);
  cursorY = drawSectionHeading(doc, 'Ingresos en el tiempo', cursorY);
  cursorY = await drawChartImage(doc, chartSelectors.revenue, cursorY);
  cursorY += 4;

  // ─── Stacked chart ───
  cursorY = ensureSpace(doc, 80, cursorY);
  cursorY = drawSectionHeading(doc, 'Unidades lavadas por servicio', cursorY);
  cursorY = await drawChartImage(doc, chartSelectors.stacked, cursorY);
  cursorY += 6;

  // ─── Services table ───
  cursorY = ensureSpace(doc, 40, cursorY);
  cursorY = drawSectionHeading(doc, 'Desglose por servicio', cursorY);
  autoTable(doc, {
    startY: cursorY,
    head: [['#', 'Servicio', 'Unidades', 'Ingresos', 'Ticket prom.', '% del total']],
    body: data.topServices.map((s, i) => [
      i + 1,
      s.serviceName,
      s.units,
      formatMxn(s.revenue),
      formatMxn(s.avgTicket),
      `${s.pctOfUnits}%`,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: ACCENT,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: MARGIN, right: MARGIN },
  });
  cursorY = getAutoTableEndY(doc) + 6;

  // ─── Hours table ───
  const sortedHours = Object.entries(data.byHour)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  cursorY = ensureSpace(doc, 40, cursorY);
  cursorY = drawSectionHeading(doc, 'Horarios más populares', cursorY);
  autoTable(doc, {
    startY: cursorY,
    head: [['Hora', 'Citas']],
    body: sortedHours.map(([hour, count]) => [hour, count]),
    theme: 'striped',
    headStyles: {
      fillColor: ACCENT,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: { fontSize: 9, cellPadding: 2.5 },
    margin: { left: MARGIN, right: MARGIN },
  });

  // ─── Footers on every page ───
  drawFootersOnAllPages(doc, meta.generatedAt);

  // Output as Blob
  return doc.output('blob');
}

function drawSectionHeading(doc: jsPDF, text: string, y: number): number {
  doc.setTextColor(FOREGROUND[0], FOREGROUND[1], FOREGROUND[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(text, MARGIN, y + 5);
  return y + 9;
}

function drawKpiGrid(doc: jsPDF, data: Analytics, y: number): number {
  doc.setTextColor(FOREGROUND[0], FOREGROUND[1], FOREGROUND[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const col1X = MARGIN;
  const col2X = MARGIN + CONTENT_WIDTH / 2;
  const lineHeight = 6;

  doc.text(`Citas totales: ${data.totalAppointments}`, col1X, y + 4);
  doc.text(`Ingresos: ${formatMxn(data.totalRevenue)}`, col2X, y + 4);
  doc.text(`Cancelación: ${data.cancelRate}%`, col1X, y + 4 + lineHeight);
  doc.text(`Clientes únicos: ${data.uniqueClients}`, col2X, y + 4 + lineHeight);

  return y + 4 + lineHeight * 2 + 2;
}

/**
 * Ensures enough vertical space for the next element; adds a new page if needed.
 * Returns the adjusted cursor Y position.
 */
function ensureSpace(doc: jsPDF, neededHeight: number, currentY: number): number {
  const maxY = PAGE_HEIGHT - MARGIN - FOOTER_HEIGHT;
  if (currentY + neededHeight > maxY) {
    doc.addPage();
    return MARGIN;
  }
  return currentY;
}

/**
 * Captures a DOM element via html2canvas and inserts it into the PDF at the
 * current cursor. Handles pagination if the image doesn't fit on the current page.
 */
async function drawChartImage(doc: jsPDF, selector: string, y: number): Promise<number> {
  const el = document.querySelector<HTMLElement>(selector);
  if (!el) {
    // Graceful fallback: draw placeholder text
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.setFontSize(10);
    doc.text('(gráfica no disponible)', MARGIN, y + 5);
    return y + 8;
  }

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#FFFFFF',
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = CONTENT_WIDTH;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const adjustedY = ensureSpace(doc, imgHeight, y);
  doc.addImage(imgData, 'PNG', MARGIN, adjustedY, imgWidth, imgHeight);
  return adjustedY + imgHeight;
}

function drawFootersOnAllPages(doc: jsPDF, generatedAt: Date): void {
  const totalPages = doc.getNumberOfPages();
  const timestamp = formatDateTime(generatedAt);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    const footerY = PAGE_HEIGHT - MARGIN + 2;
    doc.text(`Generado por Splash · ${timestamp}`, MARGIN, footerY);
    const pageText = `Página ${i} de ${totalPages}`;
    const pageTextWidth = doc.getTextWidth(pageText);
    doc.text(pageText, PAGE_WIDTH - MARGIN - pageTextWidth, footerY);
  }
}

function formatMxn(n: number): string {
  return `$${Math.round(n).toLocaleString('es-MX')}`;
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Reads the Y position after the last autoTable drawn. jspdf-autotable exposes
 * this via `doc.lastAutoTable.finalY` but TypeScript doesn't know about it.
 */
function getAutoTableEndY(doc: jsPDF): number {
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  return lastTable?.finalY ?? MARGIN;
}
