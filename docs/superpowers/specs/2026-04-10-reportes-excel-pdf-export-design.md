# Descarga de reportes en Excel y PDF

**Fecha:** 2026-04-10
**Estado:** Diseño aprobado

## Objetivo

Agregar dos botones en `/admin/reportes` — **Excel** y **PDF** — que permiten al wash_admin descargar el reporte actualmente visible (respetando rango de fechas y agrupación seleccionada). La generación es 100% client-side, lazy-loaded, sin nuevos endpoints del servidor ni impacto en Vercel Functions.

## Principios de diseño

- **Mirror de la página**: el reporte exporta exactamente lo que el usuario ve en pantalla (mismo rango, mismo `group_by`, mismos datos).
- **Zero server load**: toda la generación ocurre en el browser usando la data ya fetcheada por `AnalyticsDashboard`.
- **Zero first-load impact**: las librerías (`xlsx`, `jspdf`, `jspdf-autotable`, `html2canvas`) se cargan **solo cuando el usuario hace click en un botón de descarga**, mediante `import()` dinámico.
- **Un click, una descarga**: sin modales ni pasos intermedios.

## Fuera de alcance

- Envío por email o schedule automático (cron) de reportes
- Exportar datos crudos de appointments individuales
- Branding personalizable por negocio (logos custom, colores)
- Exportar múltiples car washes en un solo archivo
- Generación server-side

---

## Contenido del reporte

Ambos formatos (Excel y PDF) incluyen las mismas 5 secciones:

| Sección | Fuente de datos | Notas |
|---|---|---|
| **Metadata** | `carWashName`, `fromDate`, `toDate`, `groupBy`, `generatedAt` | Nombre del negocio + rango + agrupación + timestamp de generación |
| **KPIs** | `data.totalAppointments`, `data.completedCount`, `data.totalRevenue`, `data.cancelRate`, `data.cancelledCount`, `data.uniqueClients` | 4 métricas principales |
| **Serie temporal** | `data.series` | Array de `{ period, periodLabel, units, revenue }` agrupado según el toggle |
| **Desglose por servicio** | `data.topServices` | Array de `{ serviceName, units, revenue, avgTicket, pctOfUnits }` ordenado desc por unidades |
| **Horarios populares** | `data.byHour` | Top 8 por conteo |

**Secciones explícitamente excluidas del PDF** (para evitar redundancia visual):
- Gráfica legacy "Ingresos por servicio" (barras horizontales — redundante con la tabla de servicios)
- Gráfica legacy "Horarios más populares" (barras — redundante con la tabla de horarios)

El PDF incluye solo las **2 gráficas grandes nuevas** (RevenueLineChart + StackedServicesChart) capturadas del DOM + las tablas de datos.

---

## UI en `/admin/reportes`

### Layout

Se agrega un bloque nuevo al row de controles existente:

```
Agrupar: [Día][Semana][Mes]   Rango: [7][14][30][60][90][Pers.]
                                              [📊 Excel] [📄 PDF]
```

### Posición y styling

- **Posición**: flex end (derecha) del row de controles
- **Responsive**: en mobile (< md), los botones pasan debajo de los controles existentes en una fila propia
- **Estilos**: rounded-pill con border, hover state consistente con los otros botones del row
- **Labels**: `📊 Excel` y `📄 PDF` (emojis en lugar de librería de iconos nueva)

### Estados

| Estado | Comportamiento |
|---|---|
| **Default** | Botones habilitados, clickables |
| **Loading** | Botón clickeado muestra `Generando...`, ambos botones deshabilitados hasta que termine |
| **Disabled (sin datos)** | Si `data.series.length === 0` → ambos botones visibles pero deshabilitados, con tooltip "Sin datos para exportar" |
| **Error** | Toast de error usando el `useToast` existente + reset del loading state |

### Duración típica

- **Excel**: 50-500ms (el cuello de botella es crear el Blob)
- **PDF**: 2-5 segundos (html2canvas al capturar las 2 gráficas @scale 2 es el cuello de botella)

---

## Estructura del Excel (`.xlsx`)

**Filename**: `splash-{slug}-{from}-{to}.xlsx`

Ejemplo: `splash-splash-verify-station-2026-03-11-2026-04-09.xlsx`

### Hojas (tabs)

El workbook tiene **4 hojas**:

#### Hoja 1: `Resumen`

```
Row 1: [Nombre del negocio]               (bold, 14pt, merged A1:D1)
Row 2: Reporte de análisis                (bold, 12pt, merged A2:D2)
Row 3: (empty)
Row 4: Rango:        | {fromDate} a {toDate}
Row 5: Agrupación:   | {Día | Semana | Mes}
Row 6: Generado:     | {generatedAt YYYY-MM-DD HH:mm:ss}
Row 7: (empty)
Row 8: KPIs                               (bold, 11pt)
Row 9: Métrica              | Valor
Row 10: Citas totales       | {totalAppointments}
Row 11: Completadas         | {completedCount}
Row 12: Ingresos (MXN)      | {totalRevenue}
Row 13: Tasa de cancelación | {cancelRate}%
Row 14: Canceladas          | {cancelledCount}
Row 15: Clientes únicos     | {uniqueClients}
Row 16: (empty)
Row 17: Generado por Splash (italic, muted)
```

- **Ancho de columnas**: auto (SheetJS default)
- Ingresos formateados como número crudo (el usuario puede aplicar formato de moneda si quiere; no forzamos formato para no complicar la importación a otras herramientas)

#### Hoja 2: `Serie temporal`

| Período | Etiqueta | Unidades | Ingresos (MXN) |
|---|---|---|---|
| `2026-04-01` | `1 abr` | 5 | 750 |
| `2026-04-02` | `2 abr` | 8 | 1200 |
| ... | ... | ... | ... |

- Header row con styling bold (y background accent `#059669` si el soporte de xlsx lo permite sin complicar)
- Una fila por cada `SeriesPoint` en `data.series`
- `period`: string raw de la agrupación (ej: `2026-04-01`, `2026-W15`, `2026-04`)
- `periodLabel`: string formateado en español (ej: `1 abr`, `Sem 15`, `abr 2026`)

#### Hoja 3: `Servicios`

| # | Servicio | Unidades | Ingresos | Ticket prom. | % del total |
|---|---|---|---|---|---|
| 1 | Lavado básico | 142 | 21300 | 150 | 42 |
| 2 | Encerado | 78 | 11700 | 150 | 23 |
| ... | ... | ... | ... | ... | ... |

- Ordenado por `units` desc (mismo orden que `data.topServices`)
- `%` como número crudo (sin símbolo `%`)

#### Hoja 4: `Horarios`

| Hora | Citas |
|---|---|
| 10:00 | 12 |
| 11:00 | 8 |
| ... | ... |

- Top 8 entradas de `data.byHour` ordenadas por conteo desc
- Mismo criterio que la página actual

### Metadata del workbook

```ts
{
  Creator: 'Splash',
  Title: `Reporte - ${carWashName}`,
  Subject: `Análisis ${fromDate} - ${toDate}`,
}
```

### Librería

- **`xlsx`** (SheetJS) `^0.20.3`
- API flow: `utils.book_new()` → `utils.aoa_to_sheet(rows)` o `utils.json_to_sheet(objs)` → `utils.book_append_sheet(wb, sheet, name)` → `write(wb, { bookType: 'xlsx', type: 'array' })` → `Blob`

---

## Estructura del PDF (`.pdf`)

**Filename**: `splash-{slug}-{from}-{to}.pdf`

**Formato**: A4 vertical, márgenes 15mm en los 4 lados

### Layout (multi-página con auto-flow)

```
┌─────────────────────────────────────────┐
│  {Nombre del negocio}                   │  ← Header 18pt accent
│  Reporte de análisis                    │  ← Subtitle 12pt muted
│  {from} a {to} · {Día|Semana|Mes}       │  ← Meta 10pt muted
│  ──────────────────────────────────     │
│                                         │
│  KPIs                                   │  ← Section 14pt bold
│  Citas totales: 0    Ingresos: $0       │
│  Cancelación: 0%     Clientes únicos:0  │
│                                         │
│  Ingresos en el tiempo                  │
│  [chart image — RevenueLineChart @2x]   │
│                                         │
│  ── page break if needed ──             │
│                                         │
│  Unidades lavadas por servicio          │
│  [chart image — StackedServicesChart]   │
│                                         │
│  Desglose por servicio                  │
│  [table via jspdf-autotable]            │
│                                         │
│  Horarios más populares                 │
│  [table via jspdf-autotable]            │
│                                         │
│  ─────────────────────────────────      │
│  Generado por Splash · {generatedAt}    │  ← Footer en cada página
└─────────────────────────────────────────┘
```

### Captura de gráficas

Las 2 gráficas grandes se capturan del DOM real (no se re-renderizan):

1. Se agrega un `id` único a cada chart container en `analytics-client.tsx`:
   - `revenue-line-chart-export`
   - `stacked-services-chart-export`
2. `html2canvas(element, { scale: 2, backgroundColor: '#FFFFFF', logging: false })` devuelve un `HTMLCanvasElement`
3. `canvas.toDataURL('image/png')` → data URL
4. `doc.addImage(dataUrl, 'PNG', x, y, width, height)` donde `width = 180` (ancho útil) y `height` preserva aspect ratio

### Paginación

`jsPDF` no tiene auto-flow nativo. Estrategia:
- Tracking manual de `currentY` (cursor vertical)
- Helper `ensureSpace(doc, neededHeight, currentY)`:
  - Si `currentY + neededHeight > pageHeight - bottomMargin - footerHeight`:
    - Llamar `doc.addPage()`
    - Reiniciar `currentY = topMargin`
  - Retornar `currentY`

Se llama antes de cada sección y antes de insertar cada imagen.

### Colores y fuentes

- **Primary (accent)**: `#059669` — headers de sección, highlights
- **Text**: `#0F172A` — texto principal
- **Muted**: `#64748B` — metadata, footer
- **Fuente**: `helvetica` (built-in de jsPDF, no requiere cargar custom font)

### KPI cards en el PDF

En lugar de capturar las 4 cards del dashboard (que tienen diferentes dimensiones y estilos), se renderizan como texto simple en un layout 2x2:

```
Citas totales: {n}       Ingresos: ${n}
Cancelación: {n}%        Clientes únicos: {n}
```

Es más rápido, más limpio, y no depende de `html2canvas` para esa sección.

### Tablas (jspdf-autotable)

Ambas tablas de datos usan `jspdf-autotable`:

```ts
autoTable(doc, {
  head: [['#', 'Servicio', 'Unidades', 'Ingresos', 'Ticket prom.', '% del total']],
  body: topServices.map((s, i) => [i + 1, s.serviceName, s.units, formatMxn(s.revenue), formatMxn(s.avgTicket), `${s.pctOfUnits}%`]),
  startY: currentY,
  theme: 'striped',
  headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
  styles: { fontSize: 9, cellPadding: 3 },
});
```

`jspdf-autotable` auto-pagina tablas largas (>10 filas) de forma nativa.

### Footer

En cada página, usando el hook `didDrawPage` de jsPDF (o manual después de `addPage`):

```
Generado por Splash · 2026-04-10 03:24:15         Página 1 de 3
```

### Librerías

| Librería | Versión | Propósito |
|---|---|---|
| `jspdf` | `^2.5.2` | Core PDF |
| `jspdf-autotable` | `^3.8.4` | Plugin para tablas formateadas con auto-paginación |
| `html2canvas` | `^1.4.1` | DOM → canvas → imagen para capturar gráficas |

Bundle total lazy-loaded: ~600KB gzipped. **Zero impacto en el first load** porque se carga solo al hacer click.

---

## Arquitectura y archivos

### Archivos nuevos

| Path | Responsabilidad |
|---|---|
| `apps/web/src/lib/exports/filename.ts` | Helper `buildExportFilename()` y `slugify()` — pure, testeable |
| `apps/web/src/lib/exports/types.ts` | Interface `ExportMeta` compartida |
| `apps/web/src/lib/exports/excel-exporter.ts` | Función `generateExcel(opts) → Promise<Blob>`. **Importa `xlsx` normalmente**; el archivo mismo se importa vía `import()` dinámico desde `export-buttons.tsx`, así que `xlsx` termina en un chunk separado. |
| `apps/web/src/lib/exports/pdf-exporter.ts` | Función `generatePdf(opts) → Promise<Blob>`. Importa `jspdf`, `jspdf-autotable`, `html2canvas`. Mismo patrón de lazy-load. |
| `apps/web/src/lib/exports/trigger-download.ts` | Helper browser-native para descargar un Blob |
| `apps/web/src/components/export-buttons.tsx` | Client component con los 2 botones, estados loading, toast on error |
| `apps/web/src/lib/exports/filename.test.ts` | Unit tests (`node:test`) para `buildExportFilename` y `slugify` |

### Archivos modificados

| Path | Cambios |
|---|---|
| `apps/web/package.json` | Agregar `xlsx`, `jspdf`, `jspdf-autotable`, `html2canvas` |
| `apps/web/src/app/admin/reportes/analytics-client.tsx` | 1. Renderizar `<ExportButtons>` en el row de controles. 2. Aceptar `carWashName` como prop nueva. 3. Agregar `id="revenue-line-chart-export"` y `id="stacked-services-chart-export"` a los 2 chart containers. |
| `apps/web/src/app/admin/reportes/page.tsx` | Fetchear `nombre` del car wash (ya fetcheaba `id`) y pasarlo como prop a `AnalyticsDashboard`. |

### Estructura de datos compartida

```ts
// lib/exports/types.ts
export interface ExportMeta {
  carWashName: string;
  fromDate: string;  // YYYY-MM-DD
  toDate: string;    // YYYY-MM-DD
  groupBy: 'day' | 'week' | 'month';
  generatedAt: Date;
}

// Analytics shape (already exists in analytics-client.tsx — se extrae a types.ts si conviene)
export interface Analytics {
  totalAppointments: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenue: number;
  cancelRate: number;
  uniqueClients: number;
  byHour: Record<string, number>;
  series: Array<{
    period: string;
    periodLabel: string;
    revenue: number;
    units: number;
    byService: Record<string, { units: number; revenue: number }>;
  }>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    units: number;
    revenue: number;
    avgTicket: number;
    pctOfUnits: number;
  }>;
  // ... otros campos existentes
}
```

### Flujo de descarga

```
User clicks [📊 Excel]
     ↓
setLoadingFormat('xlsx')
     ↓
const { generateExcel } = await import('@/lib/exports/excel-exporter')
     ↓  (Next.js sirve el chunk con xlsx bundled)
const blob = await generateExcel({ data, meta })
     ↓
const filename = buildExportFilename(meta.carWashName, meta.fromDate, meta.toDate, 'xlsx')
     ↓
triggerDownload(blob, filename)
     ↓
setLoadingFormat(null)
```

Para PDF el flujo es análogo, solo que `generatePdf` internamente busca los elementos del DOM por ID, los captura con `html2canvas`, y compone el PDF.

### Download trigger (browser-native, sin librerías)

```ts
// lib/exports/trigger-download.ts
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

### Slugify

```ts
// lib/exports/filename.ts
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')                     // "Ñ" → "N" + combining tilde
    .replace(/[\u0300-\u036f]/g, '')      // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')          // non-alphanum → dash
    .replace(/^-+|-+$/g, '')              // trim dashes
    .slice(0, 60);                        // reasonable max length
}
```

Ejemplo: `"Splash Verify Station"` → `"splash-verify-station"`

### Manejo de errores

- Try/catch en cada handler (`handleExcel`, `handlePdf`)
- Si falla la lazy-load de la librería (ej: sin conexión): toast `"Error cargando el exportador — revisa tu conexión"`
- Si falla la generación: toast `"No se pudo generar el {Excel|PDF}"`
- Siempre `finally { setLoadingFormat(null) }`

---

## Testing

### Unit tests (node:test)

**Solo para `filename.ts`**:
- `slugify` con varios inputs (acentos, emojis, espacios, caracteres especiales)
- `buildExportFilename` con combinaciones de extensión y fechas

Los exporters (`excel-exporter.ts`, `pdf-exporter.ts`) **no se testean unitariamente** porque:
- Requieren `xlsx`/`jspdf` que son pesados de importar en un runner de tests sin DOM
- El costo de escribir/mantener esos tests excede el beneficio
- E2E cubre la funcionalidad end-to-end

### E2E (Playwright)

Test mínimo en `apps/web/e2e/admin/analytics-breakdowns.spec.ts` (archivo ya existe):

```ts
test('reportes: download Excel triggers file download', async ({ page }) => {
  await page.goto('/admin/reportes');
  await page.waitForResponse((r) => r.url().includes('/api/admin/analytics') && r.status() === 200);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Excel/ }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^splash-.*\.xlsx$/);
});

test('reportes: download PDF triggers file download', async ({ page }) => {
  await page.goto('/admin/reportes');
  await page.waitForResponse((r) => r.url().includes('/api/admin/analytics') && r.status() === 200);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /PDF/ }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^splash-.*\.pdf$/);
});
```

No validamos el contenido del archivo — solo que se dispare la descarga con el nombre correcto.

### Visual verification

Verificación manual con Playwright MCP después de la implementación:
1. Login como `claude-verify-admin@splash.test`
2. Navegar a `/admin/reportes`
3. Click Excel → confirmar que se descarga un `.xlsx` con contenido razonable (abrir en Excel/Numbers)
4. Click PDF → confirmar que se descarga un `.pdf` con gráficas renderizadas y tablas

---

## Performance

- **Excel**: 50-500ms end-to-end. `xlsx` es síncrono y rápido para estos volúmenes.
- **PDF**: 2-5 segundos end-to-end. Cuello de botella: `html2canvas` capturando las 2 gráficas a scale 2. El loading state del botón cubre la percepción.
- **First load**: **cero impacto**. Las librerías (`xlsx`, `jspdf`, `jspdf-autotable`, `html2canvas` ≈ 1.1MB total uncompressed, ~600KB gzipped) se cargan solo al hacer click. Next.js crea chunks separados automáticamente con `import()` dinámico.

## Compatibilidad

- **Browsers**: Chrome, Safari, Firefox modernos (los 3 soportan `Blob`, `URL.createObjectURL`, `<a download>`, y las 4 librerías de export).
- **Mobile**: funciona en mobile Safari y Chrome. Los wash_admins mobile pueden descargar los reportes (el resultado se guarda en "Downloads" o "Archivos").
- **Vercel**: zero impacto (todo client-side).
