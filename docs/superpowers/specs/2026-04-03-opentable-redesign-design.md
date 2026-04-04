# Splash OpenTable-Style Redesign — Design Spec

**Fecha:** 2026-04-03
**Objetivo:** Rediseñar Splash inspirado en OpenTable, dividido en 5 fases por flujo de usuario.

---

## Fase 1 — Descubrimiento (Páginas públicas)

### 1.1 Homepage Rediseño (`/page.tsx`)
- **Hero section**: Gradiente primary→accent con headline "Encuentra tu autolavado ideal" y subtítulo
- **Search bar multi-campo**: Fecha (date picker), Hora (time picker), Vehículo (dropdown: Sedán, SUV, Camioneta, Moto), Zona (text input con autocomplete). Botón CTA verde "Buscar"
- **Sección "Mejor calificados"**: Carrusel horizontal de wash-cards con foto, rating, review count, social proof ("X citas hoy"), y slots disponibles como pills azules (#0284C7)
- **Sección "Cerca de ti"**: Mapa interactivo con pins de autolavados cercanos (requiere geolocation)
- **Sección "Buscar por servicio"**: Grid de categorías (Lavado exterior, Lavado completo, Detailing, Encerado) con iconos

### 1.2 Listing Mejorado (`/autolavados/page.tsx`)
- **Search refinement bar**: Persistente arriba mostrando búsqueda activa (fecha, hora, vehículo, zona) con botón "Editar"
- **Filtros horizontales como pills**: Calificación (★4+), Precio ($/$$/$$$/$$$$), Distancia (<5km, <10km), Servicios, Ordenar (mejor match, rating, distancia, precio)
- **Layout 2 columnas**: Cards a la izquierda (~65%), mapa sticky a la derecha (~35%)
- **Wash card horizontal**: Foto izquierda, contenido derecho con nombre, rating, reviews, ubicación, distancia, social proof, slots disponibles como pills azules clickeables
- **Botón "Notificarme"**: Aparece en cards sin disponibilidad para la hora buscada (pill azul opaco con icono campana)
- **Corazón de favoritos**: En cada card (toggle, requiere auth)

### 1.3 Migración DB — Fase 1
```sql
-- Categoría de servicio
ALTER TABLE services ADD COLUMN categoria TEXT DEFAULT 'general';
-- CHECK: exterior, completo, detailing, encerado, motor, general

-- Fotos del autolavado (JSONB array de URLs)
ALTER TABLE car_washes ADD COLUMN fotos JSONB DEFAULT '[]'::jsonb;
```

### 1.4 Supabase Storage
- Bucket `car-wash-photos`: public read, write solo para wash_admin owner
- Policy: `auth.uid() = (SELECT owner_id FROM car_washes WHERE id = car_wash_id)`
- Max 10 fotos por autolavado, max 5MB por imagen

### 1.5 API Changes
- `GET /api/car-washes` — nuevos query params: `rating_min`, `categoria`, `sort` (rating, distance, price), `lat`, `lng`, `radius_km`
- `GET /api/availability` — ya existe, se usa desde homepage/listing para mostrar slots en cards

### 1.6 Componentes Nuevos
- `search-bar.tsx` — Barra de búsqueda multi-campo reutilizable (homepage + listing)
- `filter-pills.tsx` — Filtros horizontales removibles
- `wash-card-horizontal.tsx` — Card con foto + slots para listing
- `category-grid.tsx` — Grid de categorías de servicio

---

## Fase 2 — Detalle & Conversión (Página de autolavado)

### 2.1 Página de Detalle Rediseñada (`/autolavados/[slug]/page.tsx`)
- **Galería de fotos**: Layout 1 grande + 2 chicas (grid). Botón "Ver X fotos" abre lightbox modal. Fallback a gradiente si no hay fotos
- **Header**: Nombre, categoría, precio ($$), zona, badge rating (★ 4.8), review count, social proof. Iconos: favorito (corazón), compartir
- **Tabs con scroll a sección**: Servicios | Fotos | Reseñas | Horarios | Ubicación
- **Service cards**: Nombre, descripción, precio, duración, badges "Popular" (más reservado) y "Premium" (precio alto). Botón "Reservar" que selecciona en widget
- **Extras toggle**: Sección colapsable de servicios complementarios
- **Rating desglosado**: Score general grande + barras de progreso para Servicio, Limpieza, Tiempo, Valor
- **Reviews**: Cards con avatar, nombre, fecha, estrellas, comentario

### 2.2 Widget de Reserva Sticky (sidebar derecho)
- Servicio seleccionado con precio
- Date picker
- Slots disponibles como pills (azul sólido = seleccionado, azul outline = disponible)
- Extras con checkboxes
- Total calculado
- CTA "Confirmar reserva" (verde accent)
- Texto "Cancelación gratis hasta 2 horas antes"

### 2.3 Mobile: Bottom Bar Sticky
- Precio "Desde $X MXN" + botón "Reservar ahora"
- Tap abre bottom sheet con el widget completo

### 2.4 Admin: Gestión de Fotos (`/admin/configuracion`)
- Nueva sección "Fotos del negocio"
- Upload drag & drop (max 10 fotos, 5MB cada una)
- Preview grid con botón eliminar
- Reordenar con drag (primera foto = hero)

### 2.5 Migración DB — Fase 2
```sql
-- Tabla de favoritos
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, car_wash_id)
);
-- RLS: users can manage their own favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);
```

### 2.6 API Nuevos
- `POST /api/favorites` — body: `{ car_wash_id }` — toggle favorito (insert or delete)
- `GET /api/favorites` — listar favoritos del usuario
- `POST /api/admin/photos` — upload foto (multipart, guarda en Storage, actualiza car_washes.fotos)
- `DELETE /api/admin/photos` — eliminar foto

### 2.7 Componentes Nuevos
- `photo-gallery.tsx` — Galería con grid + lightbox modal
- `photo-upload.tsx` — Upload drag & drop para admin
- `booking-widget.tsx` — Widget sticky de reserva (sidebar)
- `booking-bottom-bar.tsx` — Barra sticky mobile
- `rating-breakdown.tsx` — Rating desglosado con barras de progreso
- `favorite-button.tsx` — Toggle corazón con optimistic update
- `tab-navigation.tsx` — Tabs con scroll-to-section
- `service-badge.tsx` — Badge "Popular" / "Premium"

---

## Fase 3 — Booking & Post-booking

### 3.1 Confirmación Mejorada (último paso del wizard)
- Resumen visual: logo del autolavado, nombre, dirección
- Grid 2x2: Servicio, Fecha/hora, Duración, Extras
- Campo "Notas adicionales" (textarea opcional)
- Selector visual de método de pago (efectivo/tarjeta/transferencia como cards seleccionables)
- Total prominente con desglose
- CTA con sombra "Confirmar reserva"
- Texto cancelación policy

### 3.2 Pantalla de Éxito Post-booking
- Checkmark animado + "¡Cita confirmada!"
- Resumen compacto de la cita
- 3 botones de acción: Calendario (.ics), Cómo llegar (Google Maps), WhatsApp
- CTA "Ver mis citas"

### 3.3 Sistema "Notificarme"
- **Modal**: Se abre cuando no hay disponibilidad. Muestra fecha/hora deseada. Selección de canal (email/push). CTA "Activar notificación"
- **Cron job** (`/api/cron/check-availability-alerts`): Cada 5 min verifica si hay slots abiertos que coincidan con alertas activas. Envía email + in-app notification. Marca alerta como notificada
- **Email template**: "¡Se abrió un horario en [Autolavado]!" con detalles y botón "Reservar ahora"
- **In-app notification**: Card en notification bell con link directo a reservar

### 3.4 Recordatorios Mejorados
- Confirmación inmediata (email — ya existe, mejorar template)
- Recordatorio 24h antes (email — ya existe en cron)
- Recordatorio 2h antes (push/in-app — nuevo)
- Post-visita 2h después (email "¿Cómo estuvo?" — ya existe, mejorar)
- Re-engagement 7 días después (email "¿Tu auto necesita otro lavado?" — nuevo)

### 3.5 Migración DB — Fase 3
```sql
-- Alertas de disponibilidad
CREATE TABLE availability_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  canal TEXT[] DEFAULT '{email}', -- email, push
  estado TEXT DEFAULT 'activo', -- activo, notificado, expirado
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE availability_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own alerts" ON availability_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Notas del cliente en citas
ALTER TABLE appointments ADD COLUMN notas_cliente TEXT;
```

### 3.6 API Nuevos
- `POST /api/availability-alerts` — Crear alerta
- `DELETE /api/availability-alerts/[id]` — Cancelar alerta
- `GET /api/availability-alerts` — Mis alertas activas

### 3.7 Cron Jobs
- `POST /api/cron/check-availability-alerts` — cada 5 min (nuevo)
- Mejorar `/api/cron/reminders` — agregar recordatorio 2h antes
- Nuevo `/api/cron/re-engagement` — email 7 días post-visita

### 3.8 Componentes Nuevos
- `confirmation-card.tsx` — Resumen visual con grid
- `success-screen.tsx` — Pantalla post-booking con animación y acciones
- `notify-me-modal.tsx` — Modal de alerta de disponibilidad
- `payment-method-selector.tsx` — Selector visual de método de pago
- `notes-field.tsx` — Textarea de notas adicionales

---

## Fase 4 — Cliente Fiel

### 4.1 Dashboard Rediseñado (`/mis-citas/page.tsx`)
- **Header**: Saludo personalizado "Hola, [nombre]" + conteo de citas próximas + mini badge de lealtad
- **Tabs**: Próximas | Historial | Favoritos | Mi tarjeta
- **Próxima cita**: Card destacada con borde verde, foto del autolavado, detalles completos, countdown ("2h 30m FALTAN"), 4 botones (Calendario, Llegar, WhatsApp, Cancelar)
- **Historial**: Cards compactas con foto, nombre, servicio, fecha, precio. Botón "Calificar" (si pendiente) + "Reservar de nuevo"
- **Favoritos**: Grid 2 columnas de autolavados favoritos con foto, rating, botón "Reservar"
- **Mi tarjeta**: Tarjeta de sellos digital (ver 4.3)

### 4.2 "Reservar de nuevo"
- Botón en historial que navega a `/agendar?car_wash_id=X&service_id=Y` pre-llenando wizard en paso 2 (fecha)

### 4.3 Tarjeta de Sellos Digital
- Card visual oscura premium con grid 5x2 de sellos (checkmark = completado, número = pendiente, regalo = recompensa)
- Barra de progreso con porcentaje
- Reglas: 1 cita completada = 1 sello. 10 sellos = 1 lavado gratis. Por autolavado.
- Admin puede configurar `stamps_required` (default 10)
- Reward: se redime al hacer una nueva cita, descuento del 100% en servicio base

### 4.4 Calificación Desglosada (`/calificar/[id]/page.tsx`)
- 4 categorías: Servicio, Limpieza, Tiempo, Valor (cada una 1-5 estrellas)
- Subtexto explicativo por categoría
- Comentario opcional (textarea)
- Rating general = promedio de las 4 categorías
- Al enviar: actualiza `reviews` + recalcula promedios en `car_washes`

### 4.5 Migración DB — Fase 4
```sql
-- Ratings desglosados en reviews
ALTER TABLE reviews ADD COLUMN rating_servicio SMALLINT;
ALTER TABLE reviews ADD COLUMN rating_limpieza SMALLINT;
ALTER TABLE reviews ADD COLUMN rating_tiempo SMALLINT;
ALTER TABLE reviews ADD COLUMN rating_valor SMALLINT;

-- Promedios cacheados en car_washes
ALTER TABLE car_washes ADD COLUMN avg_rating_servicio NUMERIC(2,1);
ALTER TABLE car_washes ADD COLUMN avg_rating_limpieza NUMERIC(2,1);
ALTER TABLE car_washes ADD COLUMN avg_rating_tiempo NUMERIC(2,1);
ALTER TABLE car_washes ADD COLUMN avg_rating_valor NUMERIC(2,1);

-- Tarjetas de lealtad
CREATE TABLE loyalty_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE NOT NULL,
  stamps INT DEFAULT 0,
  stamps_required INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, car_wash_id)
);
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own cards" ON loyalty_cards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System manages cards" ON loyalty_cards
  FOR ALL USING (true); -- managed via service role

-- Rewards de lealtad
CREATE TABLE loyalty_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  loyalty_card_id UUID REFERENCES loyalty_cards(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  estado TEXT DEFAULT 'disponible', -- disponible, redimido, expirado
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '90 days')
);
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own rewards" ON loyalty_rewards
  FOR SELECT USING (
    loyalty_card_id IN (SELECT id FROM loyalty_cards WHERE user_id = auth.uid())
  );
```

### 4.6 API Nuevos
- `GET /api/loyalty?car_wash_id=X` — Tarjeta del usuario para ese autolavado
- `GET /api/loyalty/all` — Todas las tarjetas del usuario
- `POST /api/loyalty/redeem` — Redimir reward al crear cita

### 4.7 Componentes Nuevos
- `loyalty-card.tsx` — Tarjeta visual de sellos (dark premium card)
- `loyalty-mini.tsx` — Mini badge "7/10 sellos" para header
- `appointment-card-v2.tsx` — Card con countdown + acciones expandidas
- `favorites-grid.tsx` — Grid de favoritos
- `rating-form-detailed.tsx` — Formulario de calificación 4 categorías
- `rebook-button.tsx` — "Reservar de nuevo" con pre-llenado

---

## Fase 5 — Admin Pro

### 5.1 Responder Reseñas (Admin)
- En `/admin/citas` o nueva sección `/admin/resenas`
- Lista de reseñas recientes con rating, comentario, fecha
- Botón "Responder" abre textarea inline
- Respuesta visible públicamente en la página de detalle bajo la reseña original

### 5.2 Analytics Dashboard (`/admin/reportes/page.tsx` — rediseño)
- **KPI cards**: Citas totales (semana/mes), Ingresos, Rating promedio, Tasa de cancelación, Clientes nuevos vs recurrentes
- **Gráfico de citas por día** (últimos 30 días) — ya existe revenue-chart, extender
- **Gráfico de ingresos por servicio** (pie/donut)
- **Horarios más populares** (heatmap día x hora)
- **Top clientes** (tabla con nombre, citas, gasto total)
- **Tasa de ocupación por estación**
- Filtro de rango de fechas

### 5.3 Messaging — Chat con clientes
- Nueva sección `/admin/mensajes`
- Lista de conversaciones con clientes (último mensaje, timestamp)
- Chat simple: admin envía mensaje, cliente lo ve en su dashboard (in-app notification)
- Casos de uso: confirmar detalles de cita, informar retrasos, responder preguntas
- Tabla DB: `messages` (sender_id, receiver_id, car_wash_id, appointment_id nullable, contenido, leido, created_at)

### 5.4 Gestión de Programa de Lealtad (Admin)
- En `/admin/configuracion`
- Toggle activar/desactivar programa
- Configurar stamps_required (default 10)
- Ver tarjetas activas de clientes
- Ver rewards pendientes/redimidos

### 5.5 Widget Embebible
- Endpoint `/api/widget/[slug]` que sirve un iframe-ready booking widget
- El admin obtiene un snippet `<script>` o `<iframe>` desde configuración
- Widget muestra: servicios, date picker, time slots, CTA que redirige a Splash para completar

### 5.6 Migración DB — Fase 5
```sql
-- Respuestas a reseñas
ALTER TABLE reviews ADD COLUMN respuesta_admin TEXT;
ALTER TABLE reviews ADD COLUMN respuesta_fecha TIMESTAMPTZ;

-- Mensajes
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  contenido TEXT NOT NULL,
  leido BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users mark read" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Configuración de lealtad por autolavado
ALTER TABLE car_washes ADD COLUMN loyalty_enabled BOOLEAN DEFAULT false;
ALTER TABLE car_washes ADD COLUMN loyalty_stamps_required INT DEFAULT 10;
```

### 5.7 API Nuevos
- `POST /api/admin/reviews/[id]/reply` — Responder reseña
- `GET /api/admin/analytics` — Datos agregados para dashboard (con rango de fechas)
- `GET /api/messages?car_wash_id=X` — Listar conversaciones
- `POST /api/messages` — Enviar mensaje
- `PATCH /api/messages/[id]` — Marcar como leído
- `GET /api/widget/[slug]` — Widget embebible

### 5.8 Componentes Nuevos
- `review-reply.tsx` — Textarea de respuesta a reseña
- `analytics-dashboard.tsx` — Dashboard con gráficos (recharts)
- `heatmap-chart.tsx` — Heatmap de horarios populares
- `top-clients-table.tsx` — Tabla de mejores clientes
- `message-list.tsx` — Lista de conversaciones
- `message-thread.tsx` — Hilo de chat
- `loyalty-admin.tsx` — Configuración de lealtad
- `widget-config.tsx` — Generador de snippet para widget embebible
- `embeddable-widget.tsx` — Widget de booking embebible

---

## Resumen de migraciones por fase

| Fase | Tablas nuevas | Columnas nuevas | Storage |
|------|--------------|-----------------|---------|
| 1 | — | services.categoria, car_washes.fotos | car-wash-photos bucket |
| 2 | favorites | — | — |
| 3 | availability_alerts | appointments.notas_cliente | — |
| 4 | loyalty_cards, loyalty_rewards | reviews.rating_*, car_washes.avg_rating_* | — |
| 5 | messages | reviews.respuesta_*, car_washes.loyalty_* | — |

## Resumen de componentes nuevos por fase

| Fase | Componentes |
|------|-------------|
| 1 | search-bar, filter-pills, wash-card-horizontal, category-grid |
| 2 | photo-gallery, photo-upload, booking-widget, booking-bottom-bar, rating-breakdown, favorite-button, tab-navigation, service-badge |
| 3 | confirmation-card, success-screen, notify-me-modal, payment-method-selector, notes-field |
| 4 | loyalty-card, loyalty-mini, appointment-card-v2, favorites-grid, rating-form-detailed, rebook-button |
| 5 | review-reply, analytics-dashboard, heatmap-chart, top-clients-table, message-list, message-thread, loyalty-admin, widget-config, embeddable-widget |
