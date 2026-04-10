# Reportes Excel/PDF Export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two buttons to `/admin/reportes` — Excel and PDF — that download the current report (respecting the selected range and grouping) using 100% client-side generation with lazy-loaded libraries.

**Architecture:** All generation happens in the browser. Four libraries (`xlsx`, `jspdf`, `jspdf-autotable`, `html2canvas`) are loaded via dynamic `import()` only when the user clicks a button, keeping them out of the first-load bundle. The reportes page passes its already-fetched analytics data directly to the exporters. PDF captures the existing chart DOM nodes with `html2canvas` and embeds them as images; Excel writes a 4-sheet workbook.

**Tech Stack:**
- Next.js 14 App Router (existing)
- `xlsx` ^0.20.3 (SheetJS, **new**)
- `jspdf` ^2.5.2 (**new**)
- `jspdf-autotable` ^3.8.4 (**new**)
- `html2canvas` ^1.4.1 (**new**)
- `node:test` (existing, for unit tests)
- Playwright (existing, for E2E)

**Spec reference:** `docs/superpowers/specs/2026-04-10-reportes-excel-pdf-export-design.md`

---

## File Structure

### New files

| Path | Responsibility |
|------|---------------|
| `apps/web/src/lib/exports/types.ts` | Shared TypeScript interfaces: `ExportMeta`, `Analytics` (extracted from `analytics-client.tsx` for reuse). |
| `apps/web/src/lib/exports/filename.ts` | Pure helpers: `slugify()` and `buildExportFilename()`. |
| `apps/web/src/lib/exports/filename.test.ts` | Unit tests (`node:test`) for `slugify` and `buildExportFilename`. |
| `apps/web/src/lib/exports/trigger-download.ts` | Browser-native download helper using `URL.createObjectURL` + `<a download>`. |
| `apps/web/src/lib/exports/excel-exporter.ts` | Exports `generateExcel({ data, meta }) → Promise<Blob>`. Imports `xlsx`. This file is only loaded via `import()` from the button component, so `xlsx` ends up in a separate chunk. |
| `apps/web/src/lib/exports/pdf-exporter.ts` | Exports `generatePdf({ data, meta, chartSelectors }) → Promise<Blob>`. Imports `jspdf`, `jspdf-autotable`, `html2canvas`. Same lazy-load pattern. |
| `apps/web/src/components/export-buttons.tsx` | Client component with the two buttons (Excel/PDF), loading state, toast on error. Triggers the dynamic imports. |

### Modified files

| Path | Changes |
|------|---------|
| `apps/web/package.json` | Add `xlsx`, `jspdf`, `jspdf-autotable`, `html2canvas` to dependencies. |
| `apps/web/src/app/admin/reportes/page.tsx` | Fetch `nombre` of the car wash (in addition to `id`) and pass it as a prop to `AnalyticsDashboard`. |
| `apps/web/src/app/admin/reportes/analytics-client.tsx` | 1. Accept new `carWashName` prop. 2. Render `<ExportButtons>` in the controls row. 3. Add `id="revenue-line-chart-export"` and `id="stacked-services-chart-export"` wrappers around the two big charts so the PDF exporter can capture them. |
| `apps/web/e2e/admin/analytics-breakdowns.spec.ts` | Add two smoke tests that verify clicking each export button triggers a download with the correct filename pattern. |

---

## Tasks

### Task 1: Install export dependencies

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Install the four libraries**

Run from the repo root:
```bash
cd "apps/web" && npm install xlsx@^0.20.3 jspdf@^2.5.2 jspdf-autotable@^3.8.4 html2canvas@^1.4.1
```

Expected: all four packages appear in `apps/web/package.json` under `dependencies`. No install errors.

- [ ] **Step 2: Verify installs work**

```bash
cd "apps/web" && node -e "console.log(Object.keys(require('xlsx').utils).length > 0 ? 'xlsx OK' : 'fail')"
```

Expected: `xlsx OK`.

```bash
cd "apps/web" && node -e "console.log(typeof require('jspdf').jsPDF === 'function' ? 'jspdf OK' : 'fail')"
```

Expected: `jspdf OK`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json package-lock.json
git commit -m "chore: add xlsx, jspdf, jspdf-autotable, html2canvas for report exports

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Create shared export types

**Files:**
- Create: `apps/web/src/lib/exports/types.ts`

- [ ] **Step 1: Create the file**

```ts
// apps/web/src/lib/exports/types.ts

/**
 * Metadata about a report export (car wash, date range, grouping, generation time).
 * Used by both the Excel and PDF exporters for headers and filenames.
 */
export interface ExportMeta {
  carWashName: string;
  fromDate: string;  // YYYY-MM-DD
  toDate: string;    // YYYY-MM-DD
  groupBy: 'day' | 'week' | 'month';
  generatedAt: Date;
}

/**
 * Analytics response shape returned by GET /api/admin/analytics.
 * Mirrors the existing interface in analytics-client.tsx.
 */
export interface SeriesPoint {
  period: string;
  periodLabel: string;
  revenue: number;
  units: number;
  byService: Record<string, { units: number; revenue: number }>;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  units: number;
  revenue: number;
  avgTicket: number;
  pctOfUnits: number;
}

export interface Analytics {
  totalAppointments: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  cancelRate: number;
  uniqueClients: number;
  byDay: Record<string, number>;
  revenueByDay: Record<string, number>;
  byService: Record<string, { count: number; revenue: number }>;
  byHour: Record<string, number>;
  series: SeriesPoint[];
  topServices: TopService[];
}
```

- [ ] **Step 2: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/exports/types.ts
git commit -m "feat(exports): add shared ExportMeta and Analytics types

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Write failing tests for filename helpers

**Files:**
- Create: `apps/web/src/lib/exports/filename.test.ts`

- [ ] **Step 1: Write the tests**

```ts
// apps/web/src/lib/exports/filename.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify, buildExportFilename } from './filename';

test('slugify lowercases and replaces spaces with dashes', () => {
  assert.equal(slugify('Splash Verify Station'), 'splash-verify-station');
});

test('slugify strips Spanish diacritics', () => {
  assert.equal(slugify('Autolavado Él Niño'), 'autolavado-el-nino');
});

test('slugify removes special characters', () => {
  assert.equal(slugify('Car Wash #1 (Premium)!'), 'car-wash-1-premium');
});

test('slugify trims leading and trailing dashes', () => {
  assert.equal(slugify('  Hello World  '), 'hello-world');
});

test('slugify collapses multiple dashes', () => {
  assert.equal(slugify('a---b___c'), 'a-b-c');
});

test('slugify truncates at 60 chars', () => {
  const longName = 'a'.repeat(100);
  assert.equal(slugify(longName).length, 60);
});

test('slugify returns empty string for empty input', () => {
  assert.equal(slugify(''), '');
});

test('slugify returns empty string for only special chars', () => {
  assert.equal(slugify('!!!'), '');
});

test('buildExportFilename combines slug, dates, and extension (xlsx)', () => {
  const result = buildExportFilename('Splash Verify Station', '2026-03-11', '2026-04-09', 'xlsx');
  assert.equal(result, 'splash-splash-verify-station-2026-03-11-2026-04-09.xlsx');
});

test('buildExportFilename combines slug, dates, and extension (pdf)', () => {
  const result = buildExportFilename('Splash Verify Station', '2026-03-11', '2026-04-09', 'pdf');
  assert.equal(result, 'splash-splash-verify-station-2026-03-11-2026-04-09.pdf');
});

test('buildExportFilename handles empty car wash name gracefully', () => {
  const result = buildExportFilename('', '2026-03-11', '2026-04-09', 'xlsx');
  // Empty slug collapses to just "splash-...-..." with no double dash
  assert.equal(result, 'splash-2026-03-11-2026-04-09.xlsx');
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd "apps/web" && npm run test:unit
```

Expected: FAIL — module `./filename` not found. This is the expected TDD failure.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/exports/filename.test.ts
git commit -m "test(exports): add failing tests for filename helpers

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Implement filename helpers

**Files:**
- Create: `apps/web/src/lib/exports/filename.ts`

- [ ] **Step 1: Create the file**

```ts
// apps/web/src/lib/exports/filename.ts

/**
 * Converts a string to a URL-safe slug.
 * - Lowercases
 * - Strips diacritics (á → a, ñ → n)
 * - Replaces non-alphanumeric characters with dashes
 * - Collapses consecutive dashes
 * - Trims leading/trailing dashes
 * - Truncates at 60 characters
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')                     // decompose combined characters
    .replace(/[\u0300-\u036f]/g, '')      // remove diacritic marks
    .replace(/[^a-z0-9]+/g, '-')          // non-alphanum to single dash
    .replace(/^-+|-+$/g, '')              // trim leading/trailing dashes
    .slice(0, 60);
}

/**
 * Builds the filename for an exported report.
 *
 * Format: splash-{slug}-{from}-{to}.{ext}
 * Example: splash-splash-verify-station-2026-03-11-2026-04-09.xlsx
 *
 * If `carWashName` is empty or becomes empty after slugifying, the slug segment
 * is omitted and the result is splash-{from}-{to}.{ext}.
 */
export function buildExportFilename(
  carWashName: string,
  fromDate: string,
  toDate: string,
  ext: 'xlsx' | 'pdf'
): string {
  const slug = slugify(carWashName);
  const parts = ['splash'];
  if (slug) parts.push(slug);
  parts.push(fromDate);
  parts.push(toDate);
  return `${parts.join('-')}.${ext}`;
}
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd "apps/web" && npm run test:unit
```

Expected: all tests pass (previous date-ranges tests + the 11 new filename tests).

- [ ] **Step 3: If any test fails**

Read the failure, fix the implementation (NOT the test), re-run. Do not modify `filename.test.ts`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/exports/filename.ts
git commit -m "feat(exports): implement slugify and buildExportFilename

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Create trigger-download helper

**Files:**
- Create: `apps/web/src/lib/exports/trigger-download.ts`

- [ ] **Step 1: Create the file**

```ts
// apps/web/src/lib/exports/trigger-download.ts

/**
 * Triggers a browser download for the given Blob with the given filename.
 * Uses the standard `<a download>` trick with `URL.createObjectURL`.
 *
 * Must be called in response to a user gesture (click handler) to avoid
 * browser pop-up blocking.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 2: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/exports/trigger-download.ts
git commit -m "feat(exports): add browser-native triggerDownload helper

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Implement Excel exporter

**Files:**
- Create: `apps/web/src/lib/exports/excel-exporter.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/exports/excel-exporter.ts
git commit -m "feat(exports): implement Excel exporter with 4 sheets

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Implement PDF exporter

**Files:**
- Create: `apps/web/src/lib/exports/pdf-exporter.ts`

- [ ] **Step 1: Create the file**

```ts
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
  doc.setTextColor(...ACCENT);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(meta.carWashName, MARGIN, cursorY + 6);
  cursorY += 10;

  doc.setTextColor(...MUTED);
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
  doc.setTextColor(...FOREGROUND);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(text, MARGIN, y + 5);
  return y + 9;
}

function drawKpiGrid(doc: jsPDF, data: Analytics, y: number): number {
  doc.setTextColor(...FOREGROUND);
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
    doc.setTextColor(...MUTED);
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
    doc.setTextColor(...MUTED);
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
```

- [ ] **Step 2: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: no errors. If there are type errors from `jspdf-autotable`, the plugin may need a side-effect import. If that happens, change `import autoTable from 'jspdf-autotable';` to ensure it attaches the `autoTable` function as a default export (the form above is correct per the library's v3.8+ API).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/lib/exports/pdf-exporter.ts
git commit -m "feat(exports): implement PDF exporter with chart capture

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Create ExportButtons component

**Files:**
- Create: `apps/web/src/components/export-buttons.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/export-buttons.tsx
git commit -m "feat(components): add ExportButtons with lazy-loaded exporters

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Pass carWashName from reportes page to client

**Files:**
- Modify: `apps/web/src/app/admin/reportes/page.tsx`

- [ ] **Step 1: Read current file content**

Use the Read tool on `apps/web/src/app/admin/reportes/page.tsx` to confirm current state.

- [ ] **Step 2: Replace the file**

```tsx
// apps/web/src/app/admin/reportes/page.tsx
export const dynamic = 'force-dynamic';

import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from './analytics-client';

export default async function ReportesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: carWash } = await supabase
    .from('car_washes')
    .select('id, nombre')
    .eq('owner_id', user.id)
    .single();

  if (!carWash) redirect('/admin/dashboard');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold text-foreground">Reportes y Analiticas</h1>
      <AnalyticsDashboard carWashId={carWash.id} carWashName={carWash.nombre} />
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: **TWO errors expected**:
1. `Property 'carWashName' does not exist on type ...` — because `AnalyticsDashboard` doesn't accept that prop yet (Task 10 fixes this).

This is OK — the next task fixes it. Do NOT commit this task in isolation. Continue to Task 10.

---

### Task 10: Wire ExportButtons into analytics-client

**Files:**
- Modify: `apps/web/src/app/admin/reportes/analytics-client.tsx`

- [ ] **Step 1: Read current file content**

Use the Read tool on the full `apps/web/src/app/admin/reportes/analytics-client.tsx` file so you understand what already exists.

- [ ] **Step 2: Edit imports block**

Change the top imports (lines 1-40 approximately) to add:

Use Edit to add a new import after the existing imports block:

```ts
import { ExportButtons } from '@/components/export-buttons';
import type { Analytics as AnalyticsType, ExportMeta } from '@/lib/exports/types';
```

(Note: the local `Analytics` interface inside the file is kept as-is to avoid ripple effects; `AnalyticsType` is a separate alias just for the prop typing to ExportButtons. Alternatively, if you're willing to also delete the local interface and use the imported one, that's cleaner — the local interface has the same shape by design. For this task, keep the local interface for safety.)

- [ ] **Step 3: Add `carWashName` prop to the component signature**

Change this line:
```tsx
export function AnalyticsDashboard({ carWashId }: { carWashId: string }) {
```

To:
```tsx
export function AnalyticsDashboard({ carWashId, carWashName }: { carWashId: string; carWashName: string }) {
```

- [ ] **Step 4: Render ExportButtons in the controls row**

Find the controls row JSX (the `<div>` with `className="mb-6 flex flex-wrap items-center gap-4"`) and add a new wrapper at the end of it for `ExportButtons`. Edit the controls div to look like this:

```tsx
      {/* Controls row */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Agrupar:</span>
          <PeriodToggle value={groupBy} onChange={handleGroupByChange} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Rango:</span>
          <div className="flex flex-wrap gap-2">
            {[7, 14, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                  days === d
                    ? 'bg-primary text-white'
                    : 'bg-white border border-border text-foreground hover:border-primary/50'
                }`}
              >
                {d} dias
              </button>
            ))}
            <button
              onClick={() => setDays('custom')}
              className={`px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors ${
                days === 'custom'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-border text-foreground hover:border-primary/50'
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>
        {days === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-input border border-border px-2 py-1"
            />
            <span>a</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-input border border-border px-2 py-1"
            />
          </div>
        )}
        {/* Export buttons — pushed to the right via ml-auto */}
        {data && (
          <div className="ml-auto">
            <ExportButtons
              data={data as unknown as AnalyticsType}
              meta={{
                carWashName,
                fromDate,
                toDate,
                groupBy,
                generatedAt: new Date(),
              }}
            />
          </div>
        )}
      </div>
```

The `ml-auto` on the wrapper pushes the buttons to the far right of the flex container. The `data &&` guard ensures we only render the buttons once the first fetch completes.

The `as unknown as AnalyticsType` cast is necessary because the local `Analytics` interface in this file and the imported `AnalyticsType` are structurally identical but nominally distinct. TypeScript won't auto-cast between them.

- [ ] **Step 5: Add IDs to the chart containers**

Find the revenue line chart container div:
```tsx
      {/* Revenue over time */}
      <div className="bg-white rounded-modal border border-border p-5 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Ingresos en el tiempo</h3>
        <RevenueLineChart series={data.series} />
      </div>
```

Add `id="revenue-line-chart-export"` to the outer div:
```tsx
      {/* Revenue over time */}
      <div id="revenue-line-chart-export" className="bg-white rounded-modal border border-border p-5 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Ingresos en el tiempo</h3>
        <RevenueLineChart series={data.series} />
      </div>
```

Find the stacked services chart container div:
```tsx
      {/* Stacked services */}
      <div className="bg-white rounded-modal border border-border p-5 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Unidades lavadas por servicio</h3>
        <StackedServicesChart series={data.series} />
      </div>
```

Add `id="stacked-services-chart-export"`:
```tsx
      {/* Stacked services */}
      <div id="stacked-services-chart-export" className="bg-white rounded-modal border border-border p-5 mb-6">
        <h3 className="text-sm font-bold text-foreground mb-4">Unidades lavadas por servicio</h3>
        <StackedServicesChart series={data.series} />
      </div>
```

- [ ] **Step 6: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: no errors. Both Task 9 and Task 10 changes are now in place.

- [ ] **Step 7: Build check**

```bash
cd "apps/web" && npm run build 2>&1 | tail -20
```

Expected: build succeeds. Look at the route summary — the First Load JS for `/admin/reportes` should only grow by ~2-3KB (the ExportButtons component itself), because the heavy libraries are lazy-chunked.

- [ ] **Step 8: Commit both Task 9 and Task 10 together**

```bash
git add apps/web/src/app/admin/reportes/page.tsx apps/web/src/app/admin/reportes/analytics-client.tsx
git commit -m "feat(reportes): wire ExportButtons and add chart capture ids

Passes carWashName from the server page component to the client,
renders ExportButtons in the controls row, and adds unique ids to the
two main chart containers so html2canvas can find them during PDF
export.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Add E2E smoke tests for downloads

**Files:**
- Modify: `apps/web/e2e/admin/analytics-breakdowns.spec.ts`

- [ ] **Step 1: Read current file**

Use the Read tool on `apps/web/e2e/admin/analytics-breakdowns.spec.ts`.

- [ ] **Step 2: Add two new tests to the existing describe block**

Use the Edit tool to add these two tests inside the `test.describe('Admin analytics breakdowns', () => { ... })` block, after the existing tests. Add them before the closing `});` of the describe.

```ts
  test('reportes: Excel download triggers download with correct filename pattern', async ({ page }) => {
    await page.goto('/admin/reportes');
    await page.waitForResponse(
      (r) => r.url().includes('/api/admin/analytics') && r.status() === 200,
      { timeout: 10000 }
    );

    // Wait for the button to become enabled (data loaded)
    const excelButton = page.getByRole('button', { name: /Excel/ });
    await expect(excelButton).toBeVisible();

    // Click may or may not produce a download depending on whether there is data.
    // We expect the button to be visible; if there's no data it's disabled and
    // downloading is skipped. This test tolerates both.
    const isDisabled = await excelButton.isDisabled();
    if (isDisabled) {
      test.info().annotations.push({ type: 'skip', description: 'No data available; button disabled' });
      return;
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await excelButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^splash-.*\.xlsx$/);
  });

  test('reportes: PDF download triggers download with correct filename pattern', async ({ page }) => {
    await page.goto('/admin/reportes');
    await page.waitForResponse(
      (r) => r.url().includes('/api/admin/analytics') && r.status() === 200,
      { timeout: 10000 }
    );

    const pdfButton = page.getByRole('button', { name: /PDF/ });
    await expect(pdfButton).toBeVisible();

    const isDisabled = await pdfButton.isDisabled();
    if (isDisabled) {
      test.info().annotations.push({ type: 'skip', description: 'No data available; button disabled' });
      return;
    }

    // PDF generation captures charts via html2canvas which takes ~3-5 seconds
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await pdfButton.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^splash-.*\.pdf$/);
  });
```

- [ ] **Step 3: Type-check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/web/e2e/admin/analytics-breakdowns.spec.ts
git commit -m "test(e2e): add Excel and PDF export download tests

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Final verification sweep

**Files:** None (validation only)

- [ ] **Step 1: Type check**

```bash
cd "apps/web" && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 2: Unit tests**

```bash
cd "apps/web" && npm run test:unit
```

Expected: all passing (existing `date-ranges` tests + new `filename` tests).

- [ ] **Step 3: Lint**

```bash
cd "apps/web" && npm run lint 2>&1 | tail -30
```

Expected: no new warnings from files modified in this plan. Pre-existing warnings in other files are acceptable.

- [ ] **Step 4: Production build**

```bash
cd "apps/web" && npm run build 2>&1 | tail -30
```

Expected:
- Build succeeds
- `/admin/reportes` route shows First Load JS that did NOT grow significantly (should only add ~2-3 KB for the ExportButtons component)
- The large libraries (`xlsx`, `jspdf`, `html2canvas`) show up as separate chunks in the build output, NOT in the main reportes bundle

- [ ] **Step 5: Visual verification with Playwright MCP (if available)**

If running interactively with Playwright MCP access:

1. Start dev server: `cd apps/web && npm run dev`
2. Log in as the admin account from `.test-credentials.json`:
   - Email: `claude-verify-admin@splash.test`
   - Password: `ClaudeVerify2026!`
3. Navigate to `http://localhost:3000/admin/reportes`
4. Verify the two buttons appear at the right end of the controls row
5. Click "Excel" → confirm download starts, filename matches pattern `splash-*.xlsx`
6. Click "PDF" → confirm download starts (takes 3-5s), filename matches pattern `splash-*.pdf`
7. Open the downloaded files to eyeball the contents look reasonable

If Playwright MCP is not available, skip this step and rely on the E2E tests from Task 11.

- [ ] **Step 6: Only if any issue was found, fix it and commit**

If type check, unit tests, lint, or build fail: read the error, fix it, and create a follow-up commit. Do NOT modify the plan structure.

```bash
git add -A
git commit -m "fix: address issues from final verification sweep

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Checklist (completed by plan author)

**Spec coverage:**
- ✅ Two buttons (Excel/PDF) in controls row → Tasks 8, 10
- ✅ Respects selected range and grouping → Task 10 (meta is built from current state)
- ✅ Client-side generation with lazy-loaded libraries → Task 8 (dynamic `import()`)
- ✅ 4-sheet Excel workbook (Resumen/Serie temporal/Servicios/Horarios) → Task 6
- ✅ Excel auto-width columns and footer "Generado por Splash" → Task 6
- ✅ PDF A4 vertical with captured chart images + tables → Task 7
- ✅ PDF header with car wash name and meta → Task 7
- ✅ PDF footer on every page → Task 7 (`drawFootersOnAllPages`)
- ✅ Filename pattern `splash-{slug}-{from}-{to}.{ext}` → Tasks 3, 4 (filename + tests)
- ✅ Loading state on buttons while generating → Task 8
- ✅ Disabled state when no data → Task 8
- ✅ Error toast on failure → Task 8 (try/catch + useToast)
- ✅ Unit tests for filename.ts → Tasks 3, 4
- ✅ E2E tests for both downloads → Task 11
- ✅ Chart containers have stable ids for capture → Task 10
- ✅ `carWashName` passed from server page to client → Task 9

**Placeholder scan:** No "TBD", "TODO", "implement later", or vague steps. All code blocks contain complete implementations.

**Type consistency:**
- `ExportMeta` defined in Task 2 is used identically in Tasks 6, 7, 8
- `Analytics` interface (from Task 2) is structurally identical to the local one in `analytics-client.tsx` — the cast in Task 10 is explicit and commented
- `CHART_SELECTORS` in Task 8 matches the ids added in Task 10 (`#revenue-line-chart-export`, `#stacked-services-chart-export`)
- `buildExportFilename` signature in Task 4 matches how it's called in Task 8
- `generateExcel({ data, meta })` and `generatePdf({ data, meta, chartSelectors })` signatures in Tasks 6 and 7 match how they're called in Task 8

**Scope check:** Single feature, focused on one area (reportes exports). Each task produces a self-contained commit except Tasks 9 and 10 which are intentionally committed together because they are mutually dependent (page.tsx passes a prop that the client component must accept in the same commit to keep the build green).
