# Splash v2 — Mejoras de funcionalidad y UX

**Fecha:** 2026-04-03
**Origen:** Observaciones de socio + referencias visuales (Uber, Amazon)
**Alcance:** 14 mejoras organizadas en 3 fases

---

## Fase 1 — Quick wins (UX & bugs)

### 1.1 Bottom Tab Bar — Cliente

Navegacion fija inferior en movil (< 768px) que reemplaza el navbar hamburguesa actual.

**Tabs:**
| Tab | Icono | Ruta | Descripcion |
|-----|-------|------|-------------|
| Inicio | Home | `/autolavados` | Explorar autolavados |
| Agendar | Calendar+ | `/agendar` | Flujo de reserva |
| Mis Citas | ClipboardList | `/mis-citas` | Historial y citas activas |
| Cuenta | User | `/perfil` | Perfil, configuracion, logout |

**Comportamiento:**
- Visible solo en movil (`md:hidden`), en desktop se mantiene el navbar superior actual
- Tab activo resaltado con color primary (`#0284C7`)
- Badge numerico en "Mis Citas" si hay citas proximas (opcional, fase 2 con notificaciones)
- El tab bar se oculta al hacer scroll down y reaparece al scroll up (patron comun en apps nativas)
- `position: fixed; bottom: 0` con `z-50` y padding inferior en el body para evitar overlap con contenido

**Archivos afectados:**
- Nuevo: `components/bottom-tab-bar.tsx` (client component)
- Modificar: `app/(client)/layout.tsx` — incluir BottomTabBar
- Modificar: `components/navbar.tsx` — ocultar menu movil en rutas de cliente (evitar doble nav)

### 1.2 Bottom Tab Bar — Admin

Reemplaza el sidebar en movil. Resuelve observaciones #7 (responsivo) y #8 (logout inaccesible).

**Tabs:**
| Tab | Icono | Ruta | Descripcion |
|-----|-------|------|-------------|
| Dashboard | LayoutDashboard | `/admin/dashboard` | Metricas y resumen |
| Citas | CalendarDays | `/admin/citas` | Gestionar citas |
| Servicios | Wrench | `/admin/servicios` | Gestionar servicios y horarios |
| Mas | Menu | — | Sheet/modal con: Reportes, Suscripcion, Cerrar sesion |

**Comportamiento:**
- Visible solo en movil (`md:hidden`), en desktop se mantiene el sidebar actual
- El sidebar se oculta en movil (`hidden md:flex`)
- El tab "Mas" abre un bottom sheet con las opciones secundarias + boton "Cerrar sesion"
- Topbar se mantiene en ambos breakpoints

**Archivos afectados:**
- Nuevo: `components/admin-tab-bar.tsx`
- Modificar: `app/admin/layout.tsx` — incluir AdminTabBar, hacer sidebar `hidden md:flex`
- Modificar: `components/sidebar.tsx` — agregar clase `hidden md:flex`

### 1.3 Sistema de Toasts

Feedback visual para acciones del usuario. Resuelve observacion #9.

**Implementacion:**
- Componente toast ligero con estado global (React context o estado en layout)
- Variantes: `success`, `error`, `info`
- Auto-dismiss a los 3 segundos
- Posicion: top-right en desktop, top-center en movil

**Donde se usa:**
- Guardar horarios en servicios → "Horarios guardados correctamente"
- Crear servicio → "Servicio creado"
- Eliminar servicio → "Servicio eliminado"
- Toggle servicio activo/inactivo → "Servicio activado/desactivado"
- Cancelar cita → "Cita cancelada"
- Enviar evaluacion → "Evaluacion enviada, gracias"

**Archivos afectados:**
- Nuevo: `components/toast.tsx` (provider + componente)
- Modificar: `app/admin/servicios/page.tsx`, `app/admin/servicios/hours-form.tsx`, `app/(client)/mis-citas/page.tsx`, `app/(client)/calificar/[id]/page.tsx`

### 1.4 Servicios — Campos adicionales

Mas detalle en la gestion de servicios. Resuelve observacion #10.

**Nuevos campos en tabla `services`:**
- `descripcion` (text, nullable) — descripcion del servicio para el cliente
- `categoria` (enum: `lavado`, `detailing`, `otro`) — clasificar servicios
- `imagen_url` (text, nullable) — imagen representativa

**Migracion:** `003_service_details.sql`
```sql
ALTER TABLE services
  ADD COLUMN descripcion TEXT,
  ADD COLUMN categoria TEXT DEFAULT 'lavado' CHECK (categoria IN ('lavado', 'detailing', 'otro')),
  ADD COLUMN imagen_url TEXT;
```

**UI Admin (`admin/servicios`):**
- Agregar textarea para `descripcion` en el form de creacion
- Select para `categoria`
- Input para `imagen_url` (URL directa por ahora, upload en futuro)

**UI Cliente (`autolavados/[slug]`):**
- Mostrar descripcion y categoria en las cards de servicio

---

## Fase 2 — Features medianas

### 2.1 Mapa de autolavados cercanos

Ubicacion en tiempo real para encontrar autolavados. Resuelve observacion #1.

**Nuevos campos en tabla `car_washes`:**
- `latitud` (double precision, nullable)
- `longitud` (double precision, nullable)

**Migracion:** `004_car_wash_location.sql`

**UI en `/autolavados`:**
- Componente Google Maps embed (`@react-google-maps/api`) en la parte superior de la pagina
- Markers para cada autolavado con coordenadas
- Al hacer click en marker → scroll al card del autolavado en la lista inferior
- Boton "Usar mi ubicacion" que pide `navigator.geolocation` y ordena resultados por distancia
- Calculo de distancia con formula Haversine en el cliente (no necesita API de distancia)

**UI en `/autolavados/[slug]`:**
- Mini mapa con la ubicacion del autolavado
- Boton "Como llegar" → abre `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` (funciona en movil con Google Maps/Waze)

**UI Admin (configuracion del autolavado):**
- Campos lat/lng en la configuracion del negocio
- Idealmente: click en mapa para seleccionar ubicacion

**Archivos nuevos:**
- `components/car-wash-map.tsx` — mapa de listado
- `components/location-map.tsx` — mini mapa de detalle

**Dependencia:** `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (ya en .env.example)

### 2.2 Centro de notificaciones in-app

UI para las notificaciones que ya se guardan en BD. Resuelve observacion #3.

**Componente:** Icono campana en navbar/tab bar con badge de conteo no leidas.

**UI:**
- Click en campana → dropdown (desktop) o pagina `/notificaciones` (movil)
- Lista de notificaciones con icono por tipo, mensaje, tiempo relativo ("hace 2h")
- Swipe o click para marcar como leida
- Boton "Marcar todas como leidas"

**Backend:**
- `GET /api/notifications` — listar notificaciones del usuario autenticado, ordenadas por fecha desc
- `PATCH /api/notifications/[id]` — marcar como leida (`leida = true`)
- `PATCH /api/notifications/read-all` — marcar todas como leidas

**Archivos nuevos:**
- `components/notification-bell.tsx`
- `app/(client)/notificaciones/page.tsx` (vista movil completa)
- `app/api/notifications/route.ts`
- `app/api/notifications/[id]/route.ts`
- `app/api/notifications/read-all/route.ts`

### 2.3 Servicios complementarios

Sistema de add-ons para servicios. Resuelve observacion #11.

**Cambio en tabla `services`:**
- `es_complementario` (boolean, default false)

**Cambio en tabla `appointments`:**
- `servicios_complementarios` (jsonb, nullable) — array de `{service_id, nombre, precio, duracion_min}`
- `precio_total` (integer, nullable) — precio base + complementarios

**Migracion:** `005_complementary_services.sql`

**Logica de negocio:**
- Solo servicios con `es_complementario = false` aparecen como seleccion principal en agendar
- Despues de elegir servicio base, se muestran los add-ons disponibles del mismo autolavado
- La duracion total = servicio base + sum(complementarios seleccionados)
- Esta duracion total se usa para buscar disponibilidad (ya existe el parametro `duracion` en `/api/availability`)
- El precio se calcula en el frontend y se valida en el backend al crear la cita

**UI Admin:**
- Toggle "Es servicio complementario" en el form de creacion
- Seccion separada en la lista: "Servicios base" y "Complementarios"

**UI Cliente (agendar):**
- Paso intermedio despues de elegir servicio base: "Agrega extras" con checkboxes
- Resumen de precio total antes de confirmar

### 2.4 WhatsApp

Comunicacion directa con el autolavado. Resuelve observacion #12.

**Nuevo campo en `car_washes`:**
- `whatsapp` (text, nullable) — numero con codigo de pais (ej: "5213312345678")

**Migracion:** incluido en `004_car_wash_location.sql` (junto con lat/lng)

**UI:**
- Boton verde "WhatsApp" en `/autolavados/[slug]` → `https://wa.me/{numero}?text=Hola, vi su autolavado en Splash`
- En confirmacion de cita: link "Dudas? Escribenos por WhatsApp" (si el autolavado tiene numero)

**UI Admin:**
- Campo "WhatsApp" en configuracion del negocio

### 2.5 Agregar al calendario

Integracion post-booking. Resuelve observacion #15.

**Implementacion:**
- Generar archivo `.ics` (iCalendar) con los datos de la cita
- Libreria: generacion manual del formato ICS (es texto plano, no requiere dependencia)
- Datos incluidos: titulo ("Lavado en {nombre}"), fecha/hora, duracion, ubicacion (direccion), descripcion (servicio + precio)

**UI:**
- Boton "Agregar al calendario" en la pagina de confirmacion (`/mis-citas?success=1`)
- Tambien disponible en el detalle de cada cita en `/mis-citas`
- Al hacer click: descarga archivo `.ics` que abre la app de calendario nativa

**Archivos nuevos:**
- `lib/calendar.ts` — funcion `generateICS(appointment)` que retorna string ICS
- Boton en `app/(client)/mis-citas/page.tsx`

---

## Fase 3 — Infraestructura

### 3.1 Email transaccional con Resend

Sistema de envio de emails. Resuelve observacion #2.

**Setup:**
- SDK: `resend` (npm package)
- API key: `RESEND_API_KEY` en env vars
- Dominio verificado o usar dominio de Resend para desarrollo

**Templates (HTML inline o React Email):**

| Evento | Destinatario | Asunto |
|--------|-------------|--------|
| Cita confirmada | Cliente | "Tu cita en {autolavado} esta confirmada" |
| Cita confirmada | Admin | "Nueva cita agendada: {cliente} - {servicio}" |
| Cita cancelada | Cliente | "Tu cita ha sido cancelada" |
| Cita cancelada | Admin | "Cita cancelada: {cliente}" |
| Recordatorio 2h | Cliente | "Recordatorio: tu cita es en 2 horas" |
| Solicitud evaluacion | Cliente | "Como fue tu experiencia en {autolavado}?" |

**Cron job (Vercel Cron):**
- `POST /api/cron/reminders` — cada 30 min, busca citas en las proximas 2h sin recordatorio enviado
- `POST /api/cron/review-requests` — cada hora, busca citas completadas hace 1h sin solicitud enviada

**Cambio en `notifications`:**
- `email_enviado` (boolean, default false)

**Archivos nuevos:**
- `lib/email.ts` — cliente Resend + funciones de envio por tipo
- `lib/email-templates/` — templates de cada email
- `app/api/cron/reminders/route.ts`
- `app/api/cron/review-requests/route.ts`

**Configuracion Vercel (vercel.json o vercel.ts):**
```json
{
  "crons": [
    { "path": "/api/cron/reminders", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/review-requests", "schedule": "0 * * * *" }
  ]
}
```

### 3.2 Metodos de pago

Sistema flexible de pagos. Resuelve observaciones #4 y #13.

**Nuevos campos en `car_washes`:**
- `metodos_pago` (text[], default `{'efectivo'}`) — opciones: `efectivo`, `tarjeta_sitio`, `transferencia`, `pago_en_linea`
- `stripe_account_id` (text, nullable) — para Stripe Connect (pago en linea)
- `datos_transferencia` (text, nullable) — CLABE/banco para transferencias

**Nuevos campos en `appointments`:**
- `metodo_pago` (text, nullable) — metodo elegido por el cliente
- `estado_pago` (text, default 'pendiente') — `pendiente`, `pagado`, `reembolsado`
- `stripe_payment_id` (text, nullable) — referencia de pago Stripe

**Migracion:** `006_payment_methods.sql`

**Flujo — Pago en sitio (efectivo/tarjeta_sitio/transferencia):**
1. Cliente elige servicio y horario
2. Ve metodos disponibles del autolavado y selecciona uno
3. Se crea la cita con `metodo_pago` y `estado_pago = 'pendiente'`
4. Admin marca como pagado manualmente desde el panel de citas

**Flujo — Pago en linea:**
1. Admin conecta su cuenta Stripe via Stripe Connect (onboarding)
2. Cliente elige "Pago en linea" al agendar
3. Se crea Stripe Checkout Session con el `stripe_account_id` del autolavado (destination charge)
4. Cliente paga → webhook confirma → `estado_pago = 'pagado'`
5. Si cancela → reembolso automatico si pago < 2h antes

**Comision de plataforma:** configurable, se aplica como `application_fee_amount` en Stripe Connect.

**UI Admin:**
- Configuracion: checkboxes de metodos aceptados
- Onboarding Stripe Connect: boton "Conectar cuenta Stripe" → redirect a Stripe
- En lista de citas: columna de estado de pago + boton "Marcar como pagado"

**UI Cliente (agendar):**
- Paso final: seleccion de metodo de pago entre los disponibles
- Si elige pago en linea → redirect a Stripe Checkout
- Si elige otro → confirmacion directa

**Archivos nuevos:**
- `app/api/stripe/connect/route.ts` — onboarding Stripe Connect
- `app/api/stripe/checkout/route.ts` — crear checkout session
- Modificar: `app/api/webhooks/stripe/route.ts` — manejar payment_intent events
- `app/admin/configuracion/page.tsx` — nueva pagina de config del negocio

### 3.3 Flujo completo integrado

No es un feature aislado. Es la verificacion de que todas las fases funcionan juntas:

1. Cliente abre la app → ve mapa con autolavados cercanos
2. Selecciona autolavado → ve detalle con servicios, WhatsApp, "Como llegar"
3. Elige servicio base + complementarios
4. Selecciona fecha/hora disponible
5. Elige metodo de pago
6. Confirma → recibe email + notificacion in-app → opcion de agregar al calendario
7. 2h antes: recordatorio por email
8. Llega, paga (o ya pago en linea)
9. Admin marca como completado
10. 1h despues: email pidiendo evaluacion
11. Cliente califica con estrellas + comentario

---

## Resumen de migraciones

| Migracion | Tabla | Cambios |
|-----------|-------|---------|
| `003_service_details.sql` | `services` | + `descripcion`, `categoria`, `imagen_url` |
| `004_car_wash_location.sql` | `car_washes` | + `latitud`, `longitud`, `whatsapp` |
| `005_complementary_services.sql` | `services`, `appointments` | + `es_complementario`, `servicios_complementarios`, `precio_total` |
| `006_payment_methods.sql` | `car_washes`, `appointments`, `notifications` | + `metodos_pago`, `stripe_account_id`, `datos_transferencia`, `metodo_pago`, `estado_pago`, `stripe_payment_id`, `email_enviado` |

## Nuevas dependencias

| Paquete | Fase | Uso |
|---------|------|-----|
| `@react-google-maps/api` | 2 | Mapa de autolavados |
| `resend` | 3 | Emails transaccionales |
| (Stripe ya instalado) | 3 | Stripe Connect para pagos en linea |

## Nuevas env vars

| Variable | Fase | Descripcion |
|----------|------|-------------|
| `RESEND_API_KEY` | 3 | API key de Resend |
| `STRIPE_CONNECT_CLIENT_ID` | 3 | Client ID para Stripe Connect onboarding |
