# AI-HOSS: Skill de Diseño Frontend Unificada

**Fecha:** 2026-04-02
**Estado:** Spec aprobado por usuario, pendiente implementación

---

## 1. Resumen Ejecutivo

AI-HOSS es una skill unificada que fusiona `frontend-design` (filosofía creativa anti-IA) con `ui-ux-pro-max` (motor de datos y recomendación) en una sola herramienta para generar diseños frontend impresionantes que nunca parecen generados por IA.

**Origen:** Fusión de dos skills complementarias:
- `frontend-design` — Filosofía estética, dirección artística audaz, anti-"AI slop"
- `ui-ux-pro-max` — Base de datos curada (84 estilos, 161 paletas, 1923 fuentes), motor BM25, generador de design systems

**Principio central:** Diseño contextualmente inteligente — sabe cuándo ser salvaje y cuándo ser contenido, pero NUNCA es genérico.

---

## 2. Arquitectura

### 2.1 Ubicación

```
/Users/andreehossfeldt/.claude/skills/ai-hoss/
```

Skill nueva independiente. Las dos originales se mantienen intactas como fallback.

### 2.2 Estructura de archivos

```
ai-hoss/
├── SKILL.md                          # Cerebro principal (~500 líneas)
│                                     # - Filosofía anti-IA
│                                     # - Dial de intensidad creativa
│                                     # - Flujo de trabajo completo
│                                     # - Reglas de prioridad (accesibilidad, UX, etc.)
│                                     # - Pre-delivery checklist
│                                     # - Guía de uso de scripts y datos
│
├── scripts/
│   ├── core.py                       # Motor BM25 mejorado
│   │                                 # - Tokenización con stemming básico
│   │                                 # - Diccionario de sinónimos de diseño
│   │                                 # - Cache en memoria
│   │                                 # - Dominio dinámico para stacks
│   │
│   ├── search.py                     # CLI de búsqueda mejorado
│   │                                 # - Flag --intensity (wild/bold/refined)
│   │                                 # - Flag --stack para directrices específicas
│   │                                 # - Flag --anti-check para validación
│   │
│   └── design_system.py              # Generador de design systems mejorado
│                                     # - Dial de intensidad automático por producto
│                                     # - Override manual de intensidad
│                                     # - Sección "Creative Direction" en output
│                                     # - Anti-pattern validation pre-output
│                                     # - Persistencia Master + Overrides
│
└── data/
    ├── styles.csv                    # ~100 estilos (84 curados + nuevos anti-IA)
    ├── colors.csv                    # ~180 paletas (161 curadas + audaces nuevas)
    ├── typography.csv                # ~90 pairings (73 curados + distintivos nuevos)
    ├── products.csv                  # ~180 tipos de producto (161 + nuevos)
    ├── ux-guidelines.csv             # ~120 directrices (98 + multi-plataforma)
    ├── ui-reasoning.csv              # ~180 reglas (161 + dial de intensidad)
    ├── landing.csv                   # ~40 patrones (34 + creativos nuevos)
    ├── charts.csv                    # 25 tipos (sin cambios)
    ├── google-fonts.csv              # 1,923 fuentes (sin cambios)
    ├── icons.csv                     # Familias de iconos (sin cambios)
    ├── anti-patterns.csv             # NUEVO — catálogo de "AI slop" a evitar
    └── stacks/
        ├── react.csv                 # NUEVO
        ├── nextjs.csv                # NUEVO
        ├── vue.csv                   # NUEVO
        ├── svelte.csv                # NUEVO
        ├── react-native.csv          # Mejorado desde original
        ├── swiftui.csv               # NUEVO
        ├── flutter.csv               # NUEVO
        ├── html-css.csv              # NUEVO
        ├── angular.csv               # NUEVO
        └── electron.csv              # NUEVO
```

---

## 3. El Dial de Intensidad Creativa

Sistema contextual que calibra automáticamente el nivel de audacia creativa según el tipo de producto, con override manual siempre disponible.

### 3.1 Niveles

| Nivel | Rango | Nombre | Cuándo |
|-------|-------|--------|--------|
| WILD | 8-10 | Salvaje | Landing pages creativas, portfolios, agencias, gaming, arte, música, moda, startups disruptivas |
| BOLD | 5-7 | Audaz | SaaS, e-commerce, apps consumer, redes sociales, productividad, fintech moderna |
| REFINED | 1-4 | Refinado | Healthcare, gobierno, banca tradicional, legal, seguros, enterprise B2B, dashboards de datos críticos |

### 3.2 Comportamiento por nivel

**WILD (8-10):**
- Rompe convenciones de layout
- Tipografía experimental y display fonts extremas
- Layouts asimétricos, overlap, diagonal flow
- Animaciones dramáticas y scroll-triggered
- Paletas inesperadas y contrastantes

**BOLD (5-7):**
- Diseño distintivo pero funcional
- Tipografía con carácter, pairings interesantes
- Micro-interacciones pulidas
- Paletas con personalidad clara
- Layouts creativos pero navegables

**REFINED (1-4):**
- Único en detalles sutiles — spacing perfecto, tipografía elegante
- Transiciones suaves y contenidas (150-250ms)
- Paleta sofisticada con acentos calculados
- Nunca genérico, pero nunca distrae de la función
- Accesibilidad como prioridad máxima

### 3.3 Implementación en datos

Columnas nuevas en `ui-reasoning.csv`:
- `intensity_default` — Valor por defecto (1-10) para el tipo de producto
- `intensity_range` — Rango aceptable (ej: "7-10" para agencias, "1-4" para healthcare)

Override via CLI: `--intensity wild|bold|refined` o `--intensity 8`

---

## 4. SKILL.md — Estructura del Cerebro Principal

### 4.1 Secciones

```
1. FRONTMATTER
   - name: ai-hoss
   - description: Trigger y contexto
   
2. IDENTIDAD
   - Qué es AI-HOSS
   - Principio anti-IA: nunca genérico, siempre con intención
   - Dial de intensidad contextual
   
3. FLUJO DE TRABAJO
   Paso 1: ANALIZAR — tipo de producto, audiencia, stack
   Paso 2: CALIBRAR — auto-asignar intensidad
   Paso 3: BUSCAR — ejecutar scripts para design system
   Paso 4: DISEÑAR — commit a dirección estética única
   Paso 5: IMPLEMENTAR — código production-ready
   Paso 6: VERIFICAR — pre-delivery checklist
   
4. DIRECTRICES DE DISEÑO (5 dimensiones fusionadas)
   - Tipografía: filosofía anti-genérica + datos de pairings
   - Color: paletas con personalidad + tokens semánticos
   - Motion: animaciones con propósito + reglas de performance
   - Composición: layouts únicos + patrones por producto
   - Atmósfera: texturas, profundidad + efectos por estilo
   
5. REGLAS DE PRIORIDAD (10 categorías, heredadas de ui-ux-pro-max)
   P1: Accesibilidad (CRÍTICA)
   P2: Toque e Interacción (CRÍTICA)
   P3: Rendimiento (ALTA)
   P4: Selección de Estilo (ALTA)
   P5: Layout y Responsive (ALTA)
   P6: Tipografía y Color (MEDIA)
   P7: Animación (MEDIA)
   P8: Formularios y Retroalimentación (MEDIA)
   P9: Patrones de Navegación (ALTA)
   P10: Gráficos y Datos (BAJA)
   
6. ANTI-PATRONES
   - Lista de "AI slop" a evitar siempre
   - Referencia a anti-patterns.csv para validación
   
7. GUÍA DE USO DE SCRIPTS
   - Comandos de búsqueda
   - Generación de design systems
   - Persistencia Master + Overrides
   
8. PRE-DELIVERY CHECKLIST
   Tier 1: Anti-IA (obligatorio)
   Tier 2: Accesibilidad (ajustado por intensidad)
   Tier 3: Performance
   Tier 4: Stack-specific
```

---

## 5. Scripts Mejorados

### 5.1 `core.py` — Motor BM25 Mejorado

**Mejoras sobre el original:**

1. **Stemming básico** — "gaming" matchea "game", "designing" matchea "design"
2. **Sinónimos de diseño** — Diccionario interno:
   ```
   "clean" → ["minimal", "simple", "pure"]
   "bold" → ["striking", "dramatic", "intense"]
   "elegant" → ["refined", "sophisticated", "luxurious"]
   "fun" → ["playful", "whimsical", "cheerful"]
   "dark" → ["moody", "noir", "shadow"]
   ```
3. **Cache en memoria** — Dict simple para queries repetidas en sesión
4. **Dominio `anti-patterns`** — Busca en anti-patterns.csv
5. **Dominio `stacks` dinámico** — Carga `stacks/{stack}.csv` según parámetro

**Dominios disponibles:**
```python
CSV_CONFIG = {
    "style": "styles.csv",
    "color": "colors.csv",
    "typography": "typography.csv",
    "product": "products.csv",
    "ux": "ux-guidelines.csv",
    "chart": "charts.csv",
    "landing": "landing.csv",
    "icons": "icons.csv",
    "google-fonts": "google-fonts.csv",
    "anti-patterns": "anti-patterns.csv",
    "stacks": "stacks/{stack}.csv",
}
```

### 5.2 `search.py` — CLI Mejorado

**Interfaz:**
```bash
# Búsqueda por dominio
python3 search.py "<query>" --domain <domain>

# Design system completo
python3 search.py "<query>" --design-system

# Con intensidad explícita
python3 search.py "<query>" --design-system --intensity wild

# Con stack
python3 search.py "<query>" --design-system --stack nextjs

# Anti-pattern check
python3 search.py "<query>" --domain anti-patterns

# Persistencia
python3 search.py "<query>" --design-system --persist -p "ProjectName" --page "pagename"

# Combinado
python3 search.py "meditation app" --design-system --stack flutter --intensity refined -p "ZenApp"
```

**Auto-detección de dominio mejorada:**
```python
DOMAIN_KEYWORDS = {
    "color|palette|theme|scheme": "color",
    "chart|graph|visualization|data viz": "chart",
    "landing|hero|page|section": "landing",
    "font|typeface|heading|body text": "typography",
    "animation|transition|hover|motion|scroll": "ux",
    "saas|fintech|ecommerce|dashboard|app": "product",
    "style|aesthetic|look|feel|vibe": "style",
    "slop|generic|basic|default|boring": "anti-patterns",
}
```

### 5.3 `design_system.py` — Generador Mejorado

**Cambios principales:**

1. **Dial de intensidad integrado:**
   - Lee `intensity_default` de `ui-reasoning.csv` para el producto detectado
   - Aplica override si el usuario especificó `--intensity`
   - Ajusta selección de estilo, colores y efectos según intensidad

2. **Anti-pattern validation:**
   - Antes de generar output, cruza selecciones contra `anti-patterns.csv`
   - Si detecta match, busca alternativa automáticamente
   - Reporta en output: "AI-SLOP CHECK: PASSED/FAILED"

3. **Creative Direction:**
   - Genera una frase de dirección creativa única para cada design system
   - Ej: "Editorial luxury — Vogue meets Swiss precision. Dramatic whitespace, serif headlines that command."

4. **Stack-aware output:**
   - Si se especifica stack, incluye imports, patterns y directrices del CSV correspondiente
   - Adapta recomendaciones de animación al framework (CSS vs Reanimated vs SwiftUI animations)

**Formato de output:**
```
╔══════════════════════════════════════════╗
║          AI-HOSS DESIGN SYSTEM           ║
║          Project: {name}                 ║
╠══════════════════════════════════════════╣
║ INTENSITY: {emoji} {LEVEL} ({n}/10)     ║
║ PRODUCT:   {type}                        ║
╠══════════════════════════════════════════╣
║ CREATIVE DIRECTION:                      ║
║ "{dirección creativa única}"             ║
╠══════════════════════════════════════════╣
║ PATTERN:   {landing pattern}             ║
║ STYLE:     {style recommendation}        ║
║ COLORS:    {16 tokens con hex values}    ║
║ TYPOGRAPHY: {heading} + {body}           ║
║ EFFECTS:   {animations y transiciones}   ║
║ STACK:     {framework + directrices}     ║
╠══════════════════════════════════════════╣
║ ANTI-PATTERNS TO AVOID:                  ║
║ - {lista contextual}                     ║
╠══════════════════════════════════════════╣
║ AI-SLOP CHECK: PASSED                    ║
╚══════════════════════════════════════════╝
```

**Persistencia (Master + Overrides):**
```
design-system/
├── {project}/
│   ├── MASTER.md              # Source of truth + Creative Direction + Intensidad
│   └── pages/
│       └── {page}.md          # Overrides por página (puede cambiar intensidad)
```

---

## 6. Datos Curados y Nuevos

### 6.1 CSVs mejorados

| CSV | Original | Objetivo | Cambios |
|-----|----------|----------|---------|
| `styles.csv` | 84 estilos | ~100 | +estilos anti-IA: Editorial Print, Analog/Handmade, Cinematic UI, Data Brutalism, Neo-Memphis, Retro Terminal, etc. |
| `colors.csv` | 161 paletas | ~180 | +paletas audaces: monocromáticas extremas, paletas de cine, naturales, neon sobre oscuro |
| `typography.csv` | 73 pairings | ~90 | +pairings audaces: Clash Display, Cabinet Grotesk, Satoshi; Serif+Mono combos; variable fonts. Campo `intensity_min` nuevo |
| `products.csv` | 161 tipos | ~180 | +productos modernos: AI agents, spatial computing, wearables, etc. |
| `ux-guidelines.csv` | 98 reglas | ~120 | +directrices multi-plataforma: safe areas, haptics, dark/light mode, responsive por plataforma |
| `ui-reasoning.csv` | 161 reglas | ~180 | +columnas `intensity_default` e `intensity_range` en todas las entradas |
| `landing.csv` | 34 patrones | ~40 | +patrones creativos: editorial scroll, cinematic hero, anti-grid |

### 6.2 CSV nuevo: `anti-patterns.csv`

**Columnas:**
- `Pattern Name` — Nombre del anti-patrón
- `Category` — typography, color, layout, animation, component, content
- `Description` — Qué es exactamente
- `Why AI Slop` — Por qué se ve genérico
- `Detection Keywords` — Para búsqueda BM25
- `Alternative` — Qué hacer en su lugar
- `Severity` — critical, high, medium

**Entradas iniciales (~50):**

Ejemplos representativos:
| Pattern | Category | Severity |
|---------|----------|----------|
| Inter/Roboto/Arial como default | typography | critical |
| Purple gradient on white | color | critical |
| Uniform card grid | layout | high |
| Generic hero illustration | content | high |
| 8px rounded corners on everything | component | medium |
| Fade-in-up on scroll for everything | animation | high |
| Blue CTA button sin contexto | component | medium |
| System font stack sin override | typography | critical |
| Gray-on-white low contrast text | color | high |
| Centered everything layout | layout | medium |
| Stock photo hero | content | high |
| Sans-serif only everywhere | typography | medium |
| Shadow-sm on every card | component | medium |
| Linear ease transitions | animation | medium |
| White background default | color | medium |

### 6.3 Nuevos stacks CSVs

Cada stack: ~40-60 directrices organizadas en categorías.

**Categorías estándar por stack:**
- Components / Architecture
- Styling approach
- Navigation patterns
- State management
- Performance
- Animation library / approach
- Accessibility
- Testing
- Platform-specific gotchas

| Stack CSV | Enfoque |
|-----------|---------|
| `react.csv` | Hooks, component patterns, CSS-in-JS vs Tailwind, React 19, concurrent features |
| `nextjs.csv` | App Router, Server Components, Image optimization, Metadata API, ISR/SSG/SSR |
| `vue.csv` | Composition API, Nuxt patterns, Vue transitions, Pinia |
| `svelte.csv` | SvelteKit, runes, native transitions, minimal bundle, form actions |
| `react-native.csv` | Mejorado: Expo Router, New Architecture, Reanimated 3, expo-image |
| `swiftui.csv` | Declarative UI, SF Symbols, NavigationStack, animations, platform idioms |
| `flutter.csv` | Material 3/Cupertino, slivers, Riverpod, go_router, platform channels |
| `html-css.csv` | Vanilla JS, Web Components, CSS moderno (container queries, :has, nesting) |
| `angular.csv` | Signals, standalone components, Angular Material, defer blocks |
| `electron.csv` | IPC patterns, native menus, auto-updater, platform integration, security |

---

## 7. Pre-Delivery Checklist

### Tier 1 — Anti-IA (obligatorio siempre)
- [ ] Blind test: nadie diría "esto lo hizo una IA"
- [ ] Fuentes distintivas y con intención (no defaults)
- [ ] Paleta con personalidad (no genérica)
- [ ] Layout con jerarquía visual, no grid uniforme
- [ ] Animaciones con propósito, no decorativas repetitivas
- [ ] Cruce contra anti-patterns.csv limpio

### Tier 2 — Accesibilidad (ajustado por intensidad)
- [ ] Contraste >= 4.5:1 texto, >= 3:1 componentes UI (WCAG AA)
- [ ] Touch targets >= 44x44pt (iOS) / 48x48dp (Android)
- [ ] prefers-reduced-motion respetado
- [ ] Navegación por teclado funcional
- [ ] aria-labels en elementos interactivos
- [ ] Heading hierarchy correcta (h1 > h2 > h3)
- [ ] Alt text en imágenes
- [ ] Sin color como único indicador de estado

### Tier 3 — Performance
- [ ] Imágenes: WebP/AVIF, lazy loading, dimensiones explícitas
- [ ] Fonts: preload, font-display: swap, subset si posible
- [ ] CLS < 0.1
- [ ] Animaciones en compositor (transform, opacity)
- [ ] Sin dependencias innecesarias

### Tier 4 — Stack-specific
- [ ] Directrices del stack target cumplidas
- [ ] Imports y dependencias correctas
- [ ] Patterns idiomáticos del framework
- [ ] Responsive/adaptive según plataforma

---

## 8. Persistencia de Design Systems

### Estructura
```
design-system/
├── {project}/
│   ├── MASTER.md              # Source of truth global
│   │                          # Incluye: Creative Direction, intensidad,
│   │                          # paleta, tipografía, estilo, efectos
│   └── pages/
│       └── {page}.md          # Overrides por página
```

### Workflow
1. Primera invocación → genera `MASTER.md` completo con dirección creativa
2. Páginas nuevas → hereda MASTER, overrides solo donde difiere
3. Cambio de dirección → actualiza MASTER, pages heredan automáticamente
4. Override por página → puede cambiar intensidad, paleta, etc. sin afectar MASTER

---

## 9. Invocación

### Trigger automático
AI-HOSS se activa cuando el usuario pide crear interfaces, componentes, páginas o aplicaciones frontend.

### Flujo interno
```
1. Detectar tipo de producto y stack
2. Ejecutar: python3 search.py "<query>" --design-system --stack <stack>
3. Usar output como base para dirección creativa
4. Implementar código con filosofía anti-IA aplicada
5. Correr pre-delivery checklist antes de entregar
```

### Override de intensidad
El usuario siempre puede forzar un nivel:
- "hazlo salvaje" / "wild" → intensidad 8-10
- "más contenido" / "refined" → intensidad 1-4
- Número explícito → "intensidad 7"

---

## 10. Resumen de entregables

| Entregable | Tipo | Estimado |
|------------|------|----------|
| `SKILL.md` | Nuevo | ~500 líneas |
| `scripts/core.py` | Reescritura mejorada | ~300 líneas |
| `scripts/search.py` | Reescritura mejorada | ~150 líneas |
| `scripts/design_system.py` | Reescritura mejorada | ~700 líneas |
| `data/anti-patterns.csv` | Nuevo | ~50 entradas |
| `data/styles.csv` | Curado + expandido | ~100 entradas |
| `data/colors.csv` | Curado + expandido | ~180 entradas |
| `data/typography.csv` | Curado + expandido | ~90 entradas |
| `data/products.csv` | Expandido | ~180 entradas |
| `data/ux-guidelines.csv` | Expandido | ~120 entradas |
| `data/ui-reasoning.csv` | Expandido + nuevas columnas | ~180 entradas |
| `data/landing.csv` | Expandido | ~40 entradas |
| `data/stacks/*.csv` (x10) | Nuevos (9) + 1 mejorado | ~40-60 entradas c/u |
| `data/charts.csv` | Sin cambios | 25 entradas |
| `data/google-fonts.csv` | Sin cambios | 1,923 entradas |
| `data/icons.csv` | Sin cambios | existente |
