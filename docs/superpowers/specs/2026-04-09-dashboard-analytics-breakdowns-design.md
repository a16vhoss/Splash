# Desgloses temporales de ingresos, unidades y servicios

**Fecha:** 2026-04-09
**Estado:** Diseño aprobado

## Objetivo

Agregar desgloses temporales de **ingresos**, **unidades lavadas** y **tipo de servicio** al panel de admin, distribuidos entre dos vistas complementarias:

- **`/admin/dashboard`** — resumen ejecutivo rápido con 3 tarjetas de período (hoy / esta semana / este mes) y comparación vs período anterior, más una tarjeta de "top servicios del mes".
- **`/admin/reportes`** — análisis profundo con gráficas temporales, gráfica apilada por servicio y tabla detallada ordenable.

## Definición canónica de métricas

Se fija una definición consistente en todo el sistema (corrige el bug actual del dashboard, que sumaba todas las citas pagadas de la historia):

- **Unidad lavada** = cita con `estado IN ('completed', 'rated')`.
- **Ingreso** = `SUM(precio_cobrado)` de las mismas citas.
- **Canceladas y no-shows**: no cuentan.
- **Citas futuras agendadas**: no cuentan como lavado realizado (siguen apareciendo en la lista "Próximas citas" del dashboard, pero no en las métricas).

## Fuera de alcance

- Exportación a CSV/PDF (posible segunda iteración).
- Filtros por estación o empleado.
- Comparación entre múltiples car washes.
- Pronósticos / forecasting / ML.

---

## Cambios en `/admin/dashboard`

### Layout

```
Dashboard
─────────────────────────────────────────────────
[Calificación]  [Estatus]                          ← existente
─────────────────────────────────────────────────
┌─────────┐  ┌─────────┐  ┌─────────┐
│  HOY    │  │ SEMANA  │  │  MES    │              ← NUEVO
│ 12 lav. │  │ 68 lav. │  │285 lav. │
│ $1,840  │  │ $9,420  │  │$38,150  │
│ ↑ 20%   │  │ ↓ 5%    │  │ ↑ 12%   │
│  ~~~~~  │  │  ~~~~~  │  │  ~~~~~  │  ← sparkline
└─────────┘  └─────────┘  └─────────┘
─────────────────────────────────────────────────
Top servicios del mes                               ← NUEVO
1. Lavado completo    142  (50%)  $21,300
2. Encerado            78  (27%)  $11,700
3. Detallado           45  (16%)   $8,100
Ver detalle completo →
─────────────────────────────────────────────────
Próximas citas  [tabla existente]
```

### Tarjetas de período (3)

Cada tarjeta muestra unidades, ingresos, delta % vs período anterior y una sparkline.

Todas las comparaciones son **justas**: el período anterior se recorta al mismo "corte" que el período actual. Esto evita que las tarjetas muestren deltas negativos artificiales en la mañana, lunes, o día 1 del mes.

| Tarjeta | Rango actual | Comparación |
|---------|--------------|-------------|
| Hoy | Hoy, citas con `hora_inicio ≤ ahora` | Ayer, mismas horas (citas con `hora_inicio ≤ ahora`) |
| Esta semana | Semana en curso (lunes a hoy) | Semana pasada, del lunes al mismo día de la semana (ej: si hoy es jueves, lun-jue de la semana pasada) |
| Este mes | Mes en curso (día 1 a hoy) | Mes pasado, del día 1 al mismo día del mes |

**Sparklines**:
- Hoy → últimos 7 días completos (1 punto por día, ingresos).
- Semana → últimas 8 semanas completas (1 punto por semana).
- Mes → últimos 6 meses completos (1 punto por mes).

**Semana empieza en lunes** (estándar MX/ISO 8601).

**Caso borde**: si al aplicar el corte el período de comparación queda vacío (ej: las primeras dos horas de un negocio que abre a las 10am), se muestra `Nuevo` en lugar de un delta numérico.

### Tarjeta "Top servicios del mes"

- Top 3 servicios del mes en curso, ordenados por **unidades** (no ingresos — responde mejor a "qué estoy dando").
- Cada fila: nombre, conteo, % del total de unidades del mes, ingresos.
- Si hay menos de 3 servicios distintos, muestra los que haya.
- Link al final: `Ver detalle completo →` → `/admin/reportes`.

### Elementos eliminados

- Tarjeta **"Ingresos totales"** (tenía el bug de sumar toda la historia). Su rol queda cubierto por las 3 tarjetas nuevas.
- Tarjeta **"Citas hoy"** (queda reemplazada por la tarjeta "Hoy", que muestra lo mismo + ingresos + sparkline).

### Elementos que se mantienen

- Tarjeta "Calificación"
- Tarjeta "Estatus"
- Lista "Próximas citas"

---

## Cambios en `/admin/reportes`

### Layout

```
Reportes y Analíticas
─────────────────────────────────────────────────
Agrupación: [Día] [Semana] [Mes]                    ← NUEVO toggle
Rango: [Últimos 30 días ▾] [Personalizado...]
─────────────────────────────────────────────────
[KPIs existentes: citas, ingresos, cancel, únicos]
─────────────────────────────────────────────────
Ingresos en el tiempo                               ← NUEVO
┌───────────────────────────────────────────────┐
│ Gráfica de línea (recharts)                   │
│ eje X = agrupación (día/sem/mes)              │
│ eje Y = MXN $                                 │
└───────────────────────────────────────────────┘
─────────────────────────────────────────────────
Unidades lavadas por servicio                       ← NUEVO
┌───────────────────────────────────────────────┐
│ Gráfica de barras apiladas (recharts)         │
│ eje X = agrupación                            │
│ eje Y = # lavados                             │
│ cada color = un tipo de servicio              │
│ leyenda abajo, tooltip al hover               │
└───────────────────────────────────────────────┘
─────────────────────────────────────────────────
Desglose por servicio  [⇅ Ordenar]                  ← NUEVO tabla
┌─────────────┬───────┬──────────┬─────────┬─────┐
│ Servicio    │ Unid. │ Ingresos │ Ticket  │  %  │
├─────────────┼───────┼──────────┼─────────┼─────┤
│ L. completo │  142  │ $21,300  │  $150   │ 42% │
│ Encerado    │   78  │ $11,700  │  $150   │ 23% │
│ ...         │       │          │         │     │
└─────────────┴───────┴──────────┴─────────┴─────┘
─────────────────────────────────────────────────
Ingresos por servicio    [barras existente]
Horarios más populares   [barras existente]
```

### Controles superiores

- **Toggle de agrupación**: `Día | Semana | Mes`. Al cambiar, las dos gráficas nuevas se reagrupan. Default auto-sensible:
  - Rango ≤ 30 días → `Día`
  - Rango ≤ 90 días → `Semana`
  - Rango > 90 días → `Mes`
  - El usuario siempre puede override manualmente.
- **Rango**: se mantiene el selector existente (7/14/30/60/90 días) y se agrega opción "Personalizado" con dos date pickers (desde/hasta). Default: últimos 30 días.

### Gráficas nuevas

**"Ingresos en el tiempo"** — `LineChart` de recharts, una sola línea con área sombreada (accent color).
- Tooltip: fecha/período + ingresos formateados `$X,XXX MXN`.
- Ejes con labels en español.

**"Unidades lavadas por servicio"** — `BarChart` apilada.
- Cada `Bar` es un servicio distinto con color de paleta estable (ver sección técnica).
- Tooltip: período + breakdown por servicio + total.
- Leyenda clickable para togglear servicios.

### Tabla "Desglose por servicio"

- Columnas: Servicio, Unidades, Ingresos, Ticket promedio, % del total.
- Ordenable por cualquier columna (default: unidades desc).
- Ticket promedio = `ingresos / unidades` del servicio.
- `%` = % de unidades del total del período.
- Si hay >10 servicios: top 10 + fila "Otros".

### Elementos que se mantienen

- KPI cards existentes.
- Gráfica "Ingresos por servicio" (barras totales).
- Gráfica "Horarios más populares".

---

## API y capa de datos

### Endpoint extendido — `GET /api/admin/analytics`

Se extiende el endpoint existente (no se crea uno nuevo). Acepta nuevos query params:

```
GET /api/admin/analytics
  ?car_wash_id=<uuid>
  &from=YYYY-MM-DD         (nuevo)
  &to=YYYY-MM-DD           (nuevo)
  &group_by=day|week|month (nuevo, default: day)
```

Se mantiene retrocompatibilidad con `?days=30`: si `from/to` no están presentes, se calcula `from = today - N días`, `to = today`.

### Respuesta extendida

```ts
{
  // Campos existentes (se mantienen tal cual)
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

  // NUEVOS
  series: Array<{
    period: string;          // "2026-04-09" | "2026-W15" | "2026-04"
    periodLabel: string;     // "9 abr" | "Sem 15" | "Abr 2026"
    revenue: number;
    units: number;
    byService: Record<string, { units: number; revenue: number }>;
  }>;

  topServices: Array<{       // top 10 + "Otros" si aplica
    serviceId: string;
    serviceName: string;
    units: number;
    revenue: number;
    avgTicket: number;
    pctOfUnits: number;
  }>;
}
```

### Nuevo endpoint — `GET /api/admin/analytics/summary`

Dedicado al dashboard. Liviano y precalculado para los 3 períodos.

```
GET /api/admin/analytics/summary?car_wash_id=<uuid>
```

Respuesta:

```ts
{
  today: {
    units: number;
    revenue: number;
    prevUnits: number;       // ayer
    prevRevenue: number;
    sparkline: number[];     // últimos 7 días, ingresos
  };
  week: {
    units: number;
    revenue: number;
    prevUnits: number;       // semana pasada completa
    prevRevenue: number;
    sparkline: number[];     // últimas 8 semanas
  };
  month: {
    units: number;
    revenue: number;
    prevUnits: number;       // mes pasado hasta el mismo día del mes
    prevRevenue: number;
    sparkline: number[];     // últimos 6 meses
  };
  topServicesMonth: Array<{
    serviceName: string;
    units: number;
    revenue: number;
    pctOfUnits: number;
  }>;  // top 3 del mes en curso
}
```

### Filtro de datos (consistente en ambos endpoints)

```ts
.eq('car_wash_id', carWashId)
.in('estado', ['completed', 'rated'])
.gte('fecha', from)
.lte('fecha', to)
```

### Agrupación: backend vs frontend

El agrupamiento se hace en **backend** (JavaScript en la route handler). Supabase JS SDK no soporta `GROUP BY` directamente, pero las consultas están acotadas por `car_wash_id + fecha range`, y traer las filas agrupándolas en Node es barato (1 año × 50 citas/día ≈ 18K filas, perfectamente manejable).

Si en el futuro esto crece, se puede optimizar con una vista materializada o una función RPC SQL — no hace falta ahora.

### Timezone

Todas las fechas del negocio se manejan en **`America/Mexico_City`**. La columna `fecha` en DB ya es tipo `date` (sin hora), así que "hoy" se calcula usando `new Date()` convertido al timezone MX. Hardcoded por ahora (el negocio opera 100% en MX). Si se necesitan otras zonas horarias, se agrega columna `timezone` a `car_washes` en una iteración futura.

### Semana

Empieza en **lunes** (ISO 8601 / estándar MX). Se calcula con `date-fns`/`date-fns-tz`.

---

## Implementación y detalles técnicos

### Dependencias

- `recharts` ^3.8.1 — **ya instalada** en `apps/web`. Se usa para las gráficas.
- `date-fns` y `date-fns-tz` — **nuevas**. Se agregan a `apps/web` para manejo de fechas con timezone `America/Mexico_City`.
- `node:test` (built-in) — runner de tests unitarios para `date-ranges.ts`. No requiere dependencia nueva.

Ninguna otra dependencia. Nada de Chart.js, D3, moment, Vitest, Jest.

### Componentes nuevos

Ubicación: `apps/web/src/components/`.

| Componente | Tipo | Propósito |
|---|---|---|
| `period-card.tsx` | Server | Tarjeta compacta con etiqueta, unidades, ingresos, delta %, sparkline. Reutilizable para las 3 tarjetas del dashboard. |
| `sparkline.tsx` | Client | Wrapper mínimo sobre `<ResponsiveContainer><LineChart>` de recharts, sin ejes ni tooltip. Props: `data: number[]`, `color?: string`. |
| `top-services-card.tsx` | Server | Tarjeta del dashboard con top 3 servicios del mes. |
| `revenue-line-chart.tsx` | Client | `LineChart` de recharts para /reportes, con tooltip en español y formato MXN. |
| `stacked-services-chart.tsx` | Client | `BarChart` apilada por servicio, leyenda clickable. |
| `service-breakdown-table.tsx` | Client | Tabla ordenable con estado local para columna de orden. |

### Lógica de fechas

Nuevo archivo: `apps/web/src/lib/date-ranges.ts`. Funciones puras y testeables:

```ts
// Rangos del período actual (bounds para consulta Supabase)
getTodayRange(): { from: string; to: string }              // hoy / hoy
getThisWeekRange(): { from: string; to: string }           // lunes / hoy
getThisMonthRange(): { from: string; to: string }          // día 1 / hoy

// Rangos del período anterior "recortado" (comparación justa)
getYesterdayRange(): { from: string; to: string }          // ayer / ayer
getLastWeekToTodayRange(): { from: string; to: string }    // lun pasado / mismo día de la semana pasada
getLastMonthToTodayRange(): { from: string; to: string }   // día 1 mes pasado / mismo día del mes pasado

// Corte horario para "hoy" (se aplica como filtro adicional: hora_inicio ≤ cutoff)
getCurrentHourCutoff(): string                             // "HH:MM:SS" actual en TZ MX

// Rangos para sparklines
getLastNDaysRanges(n: number): Array<{ from: string; to: string }>
getLastNWeeksRanges(n: number): Array<{ from: string; to: string }>
getLastNMonthsRanges(n: number): Array<{ from: string; to: string }>

// Agrupamiento
groupByPeriod<T>(rows: T[], groupBy: 'day' | 'week' | 'month'): SeriesPoint[]
formatPeriodLabel(period: string, groupBy: 'day' | 'week' | 'month'): string
```

Todas usan `date-fns-tz` con `America/Mexico_City`. Los rangos se devuelven como `YYYY-MM-DD` para pasar directamente a Supabase. El cutoff horario se aplica como filtro adicional en la query de "hoy" (`.lte('hora_inicio', cutoff)`) tanto para el período actual como para el anterior.

### Paleta de colores por servicio

Paleta fija de ~8 colores (accent, primary + 6 complementarios tomados de los design tokens existentes). Asignación por índice del servicio ordenado alfabéticamente por nombre. Si hay >8 servicios, los colores se reciclan (muy raro — negocios típicos tienen 3-6 servicios).

### Cálculo de delta % — edge cases

```ts
function formatDelta(current: number, previous: number): { value: string; positive: boolean } {
  if (previous === 0 && current === 0) return { value: '—', positive: true };
  if (previous === 0) return { value: 'Nuevo', positive: true };
  const pct = ((current - previous) / previous) * 100;
  return { value: `${Math.abs(pct).toFixed(0)}%`, positive: pct >= 0 };
}
```

### Performance y cache

- Ambos endpoints son `dynamic` (auth + datos frescos) — no se cachean a nivel Next.
- `summary` hace 3 queries en paralelo (hoy, semana, mes) con `Promise.all`. La consulta más grande es ~1500 filas.
- `/reportes` hace 1 query grande por render. Agrupamiento en backend es O(n).
- **No se requieren índices nuevos** — los existentes en `appointments (car_wash_id, fecha)` cubren el caso.

### Archivos modificados

- `apps/web/src/app/admin/dashboard/page.tsx` — reescribe: llama a `/api/admin/analytics/summary` (o función helper compartida), renderiza `PeriodCard × 3` + `TopServicesCard`. Elimina el bug de "Ingresos totales".
- `apps/web/src/app/admin/reportes/analytics-client.tsx` — agrega toggle de agrupación, date picker de rango personalizado, y los 3 componentes nuevos.
- `apps/web/src/app/api/admin/analytics/route.ts` — extiende payload con `series` y `topServices`, acepta `from/to/group_by`.
- `apps/web/src/app/api/admin/analytics/summary/route.ts` — **nuevo** endpoint dedicado al dashboard.

### Testing

- **Tests unitarios** para `date-ranges.ts` usando `node:test` (built-in de Node, sin dependencias nuevas) — las funciones de rangos y comparación son críticas y fáciles de romper con edge cases de timezone, fin de mes, lunes, cambio de año.
- **E2E mínimo** en `apps/web/e2e/admin-round*`: navegar a dashboard, verificar que las 3 tarjetas existen y no crashean; navegar a reportes, cambiar toggle de agrupación, verificar que la gráfica se re-renderiza sin errores.
