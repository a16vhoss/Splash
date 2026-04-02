# Splash v1.0 — Especificacion Tecnica Completa

> SaaS Marketplace de Autolavados — App Web + Mobile
> Stack: Next.js 14 (App Router) + TypeScript + React Native (Expo) + Supabase + Vercel
> Arquitectura: Monorepo (Turborepo) - Web (admin) + Mobile (cliente) + API compartida

---

## 1. Vision General

Splash es una plataforma que conecta clientes con autolavados de manera simple e intuitiva. La experiencia del cliente esta disenada para ser tan simple como Uber: abrir la app, ver autolavados cercanos en un mapa, elegir uno, seleccionar servicio y horario, confirmar en 3 taps.

| Modulo | Usuarios | Proposito | Plataforma |
|--------|----------|-----------|------------|
| App Cliente | Clientes finales | Buscar autolavados, agendar citas, calificar | Mobile (iOS/Android) |
| Panel Admin | Duenos de autolavados | Gestionar citas, servicios, horarios, reportes | Web (responsive) |
| Super Admin | Equipo Splash | Gestionar suscripciones, onboarding, metricas globales | Web |

**Reglas clave:**
- El pago del servicio se hace directo en el autolavado (efectivo/terminal). La app NO procesa pagos de servicios.
- Stripe solo se usa para cobrar suscripciones a los negocios.
- La app del cliente debe ser tan intuitiva como Uber o Duolingo. Experiencia de 3 taps para agendar.
- Mobile-first para el cliente. Desktop-first para el panel admin con version mobile responsive.

---

## 2. Arquitectura y Stack

| Capa | Tecnologia | Notas |
|------|-----------|-------|
| Framework Web | Next.js 14+ (App Router) + TypeScript | Panel admin + landing page + super admin |
| App Mobile | React Native (Expo) | iOS + Android desde un solo codigo |
| Backend | Next.js API Routes + Supabase Edge Functions | Logica de negocio compartida |
| Base de Datos | Supabase (PostgreSQL) | Auth, Storage, Realtime, RLS |
| Auth | Supabase Auth | Email/password (admin) + OAuth Google/Apple (cliente) |
| Mapas | Google Maps SDK / API | Geocoding, mapa interactivo, calculos de distancia |
| Pagos (suscripciones) | Stripe | Planes mensuales para autolavados |
| Notificaciones Push | Expo Notifications + Supabase Realtime | Recordatorios de citas |
| UI Web | Tailwind CSS + shadcn/ui | Panel admin |
| UI Mobile | React Native + Expo | Plus Jakarta Sans, paleta Splash |
| Deploy Web | Vercel | Auto-deploy desde GitHub |
| Deploy Mobile | EAS (Expo Application Services) | Build + submit a stores |

### 2.1 Design System — AI-HOSS Calibrado (Intensidad 6/10 BOLD)

**Tipografia:** Plus Jakarta Sans (Google Fonts)
- Display/Hero: ExtraBold 800, 48-96px, line-height 1.1-1.2
- Section heads: Bold 700, 24-32px, line-height 1.2-1.3
- Card titles/buttons: SemiBold 600, 16-18px
- Body: Regular 400, 14-16px, line-height 1.4-1.5
- Caption: Regular 400, 12px
- Button text: SemiBold 600, uppercase, letterSpacing 0.5
- Font fallback: -apple-system, BlinkMacSystemFont, sans-serif

**Paleta de Colores — Booking Blue + Slate Ice:**

| Token | Hex | Uso |
|-------|-----|-----|
| Primary | #0284C7 | CTAs principales, links, seleccion activa |
| Primary Light | #0EA5E9 | Hover states, acciones secundarias |
| Accent (Success) | #059669 | Disponible, confirmado, estados exitosos |
| Background | #F8FAFC | Fondo general de la app |
| Foreground | #0F172A | Textos principales, fondos oscuros |
| Card | #FFFFFF | Fondos de tarjetas, inputs |
| Muted | #F1F5F9 | Fondos secundarios, inputs deshabilitados |
| Muted Foreground | #64748B | Textos secundarios, placeholders |
| Border | #E2E8F0 | Bordes, separadores |
| Warning | #F59E0B | Alertas, estrellas de calificacion, citas proximas |
| Destructive | #DC2626 | Errores, cancelaciones, eliminaciones |
| Sidebar Dark | #0F172A | Sidebar del panel admin |
| Ring | #0284C7 | Focus rings accesibilidad |

**Radius scale:** 4px inputs, 8px cards, 12px modals, 999px pills
**Shadow scale:** sm (cards estaticas), md (cards interactivas hover), lg (modals/dropdowns)
**Motion:** ease-out para entradas (200ms), ease-in para salidas (150ms). `prefers-reduced-motion` respetado. Max 2 scroll animations por pagina.

---

## 3. Estructura del Proyecto

```
splash/
  apps/
    web/                          # Next.js — Panel admin + landing + super admin
      src/
        app/
          (auth)/login/           # Login admin/autolavado
          (admin)/dashboard/      # Dashboard principal
          (admin)/citas/          # Gestion de citas
          (admin)/servicios/      # Config de servicios
          (admin)/reportes/       # Reportes e ingresos
          (admin)/config/         # Horarios, estaciones, perfil
          (super)/negocios/       # Gestion de autolavados suscritos
          (super)/planes/         # Planes y suscripciones
          (super)/metricas/       # Metricas globales de la plataforma
          api/                    # API Routes (Controllers)
        components/               # Componentes React web
        lib/supabase/             # Cliente Supabase (client.ts, server.ts)

    mobile/                       # React Native (Expo) — App del cliente
      src/
        screens/
          HomeScreen.tsx          # Mapa + lista de autolavados
          WashProfileScreen.tsx   # Perfil del autolavado + servicios
          ScheduleScreen.tsx      # Seleccion de fecha y hora
          ConfirmationScreen.tsx  # Confirmacion de cita
          AppointmentsScreen.tsx  # Mis citas
          RatingScreen.tsx        # Calificar servicio
          ProfileScreen.tsx       # Perfil del usuario
          LoginScreen.tsx         # Login/Registro
        components/               # Componentes compartidos mobile
        navigation/               # React Navigation config
        hooks/                    # Custom hooks
        services/                 # API calls

  packages/
    shared/                       # Codigo compartido
      types/                      # TypeScript interfaces
      validations/                # Zod schemas
      constants/                  # Enums, config
```

---

## 4. Routing y Navegacion

### 4.1 App Mobile (Cliente)

React Navigation con stack navigator + bottom tab navigator.

| Condicion | Accion |
|-----------|--------|
| No hay sesion activa | Muestra Auth Stack (Login/Register) |
| Sesion activa | Muestra Main Tab Navigator (Home, Citas, Perfil) |
| Tap en autolavado | Push a WashProfileScreen |
| Selecciona servicio | Push a ScheduleScreen |
| Confirma cita | Push a ConfirmationScreen |
| Tap en "Calificar" | Push a RatingScreen |

### 4.2 Panel Admin (Web)

Next.js App Router con middleware de proteccion por rol.

| Condicion | Accion |
|-----------|--------|
| No hay sesion activa | Redirige a /login |
| Sesion activa + rol = wash_admin | Acceso a /admin/*. Redirige / a /admin/dashboard |
| Sesion activa + rol = super_admin | Acceso total a /admin/* y /super/* |
| Sesion activa + rol = client | Bloquea /admin/*. Redirige a app mobile o landing |
| Suscripcion expirada | Redirige a /admin/suscripcion con mensaje de renovacion |

---

## 5. Modelo de Datos Completo

> Todas las tablas usan UUID como PK, created_at y updated_at con TIMESTAMPTZ DEFAULT now(). RLS habilitado en todas las tablas.

### 5.1 users

Todos los usuarios de la plataforma: clientes, admins de autolavado, y super admins.

| Campo | Tipo | Constraints | Descripcion |
|-------|------|-------------|-------------|
| id | UUID | PK | Vinculado a auth.users |
| email | VARCHAR(255) | UNIQUE NOT NULL | Email de registro |
| nombre | VARCHAR(150) | NOT NULL | Nombre completo |
| telefono | VARCHAR(20) | NULLABLE | Para contacto/notificaciones |
| avatar_url | TEXT | NULLABLE | URL de foto de perfil |
| role | user_role | NOT NULL | client, wash_admin, super_admin |
| auth_provider | VARCHAR(20) | DEFAULT email | email, google, apple |
| activo | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

### 5.2 car_washes

Cada autolavado se registra como negocio. Puede tener multiples estaciones de lavado operando en paralelo.

| Campo | Tipo | Constraints | Descripcion |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| owner_id | UUID | FK > users NOT NULL | Dueno/admin del negocio |
| nombre | VARCHAR(200) | NOT NULL | Nombre del autolavado |
| slug | VARCHAR(100) | UNIQUE NOT NULL | URL-friendly. Ej: autospa-premium |
| descripcion | TEXT | NULLABLE | Descripcion del negocio |
| direccion | TEXT | NOT NULL | Direccion completa |
| latitud | DECIMAL(10,7) | NOT NULL | Para geolocalizacion |
| longitud | DECIMAL(10,7) | NOT NULL | Para geolocalizacion |
| telefono | VARCHAR(20) | NULLABLE | |
| logo_url | TEXT | NULLABLE | Logo del negocio |
| cover_url | TEXT | NULLABLE | Imagen de portada |
| rating_promedio | DECIMAL(2,1) | DEFAULT 0.0 | Calculado. 0.0 a 5.0 |
| total_reviews | INT | DEFAULT 0 | Contador de resenas |
| num_estaciones | INT | DEFAULT 1 CHECK>0 | Estaciones de lavado disponibles |
| activo | BOOLEAN | DEFAULT true | |
| verificado | BOOLEAN | DEFAULT false | Verificado por super admin |
| stripe_customer_id | VARCHAR(100) | NULLABLE | ID de cliente en Stripe |
| subscription_status | sub_status | DEFAULT trial | trial, active, past_due, cancelled |
| subscription_plan | VARCHAR(50) | NULLABLE | Plan actual |
| trial_ends_at | TIMESTAMPTZ | NULLABLE | Fin del periodo de prueba |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

### 5.3 services

Cada autolavado configura sus propios servicios con nombre, precio y duracion.

| Campo | Tipo | Constraints | Descripcion |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| car_wash_id | UUID | FK > car_washes NOT NULL | |
| nombre | VARCHAR(150) | NOT NULL | Ej: Lavado express, Detailing premium |
| descripcion | TEXT | NULLABLE | Descripcion del servicio |
| precio | DECIMAL(10,2) | NOT NULL CHECK>0 | En MXN |
| duracion_min | INT | NOT NULL CHECK>0 | Duracion en minutos |
| orden | INT | DEFAULT 0 | Orden de display en la app |
| activo | BOOLEAN | DEFAULT true | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 5.4 business_hours

| Campo | Tipo | Constraints | Descripcion |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| car_wash_id | UUID | FK > car_washes NOT NULL | |
| dia_semana | INT | NOT NULL (0-6) | 0=Domingo, 1=Lunes ... 6=Sabado |
| hora_apertura | TIME | NOT NULL | Ej: 08:00 |
| hora_cierre | TIME | NOT NULL | Ej: 18:00 |
| cerrado | BOOLEAN | DEFAULT false | true = dia no laborable |

### 5.5 appointments

Tabla central del sistema. Una cita por registro. Cada cita ocupa una estacion por la duracion del servicio.

| Campo | Tipo | Constraints | Descripcion |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| client_id | UUID | FK > users NOT NULL | Cliente que agenda |
| car_wash_id | UUID | FK > car_washes NOT NULL | |
| service_id | UUID | FK > services NOT NULL | |
| estacion | INT | NOT NULL CHECK>0 | Estacion asignada (1, 2, 3...) |
| fecha | DATE | NOT NULL | Fecha de la cita |
| hora_inicio | TIME | NOT NULL | Hora de inicio |
| hora_fin | TIME | NOT NULL | Calculada: hora_inicio + duracion_min |
| estado | appointment_status | DEFAULT confirmed | confirmed, in_progress, completed, cancelled, no_show |
| precio_cobrado | DECIMAL(10,2) | NOT NULL | Precio al momento de agendar |
| notas_cliente | TEXT | NULLABLE | Notas opcionales del cliente |
| notas_admin | TEXT | NULLABLE | Notas del autolavado |
| cancelado_por | UUID | FK > users NULLABLE | Quien cancelo (si aplica) |
| motivo_cancelacion | TEXT | NULLABLE | |
| recordatorio_enviado | BOOLEAN | DEFAULT false | true cuando se envia push |
| created_at | TIMESTAMPTZ | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

### 5.6 reviews

Los clientes pueden calificar despues de completar un servicio. Una resena por cita.

| Campo | Tipo | Constraints | Descripcion |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| appointment_id | UUID | FK > appointments UNIQUE NOT NULL | Una por cita |
| client_id | UUID | FK > users NOT NULL | |
| car_wash_id | UUID | FK > car_washes NOT NULL | |
| rating | INT | NOT NULL CHECK 1-5 | Estrellas (1 a 5) |
| comentario | TEXT | NULLABLE | Texto opcional |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 5.7 notifications

| Campo | Tipo | Constraints | Descripcion |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| user_id | UUID | FK > users NOT NULL | Destinatario |
| appointment_id | UUID | FK > appointments NULLABLE | |
| tipo | notif_type | NOT NULL | reminder, confirmation, cancellation, review_request |
| titulo | VARCHAR(200) | NOT NULL | |
| mensaje | TEXT | NOT NULL | |
| leida | BOOLEAN | DEFAULT false | |
| push_enviado | BOOLEAN | DEFAULT false | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 5.8 subscriptions

| Campo | Tipo | Constraints | Descripcion |
|-------|------|-------------|-------------|
| id | UUID | PK | |
| car_wash_id | UUID | FK > car_washes NOT NULL | |
| stripe_subscription_id | VARCHAR(100) | UNIQUE NOT NULL | ID en Stripe |
| plan | VARCHAR(50) | NOT NULL | Nombre del plan |
| status | sub_status | NOT NULL | trial, active, past_due, cancelled |
| current_period_start | TIMESTAMPTZ | NOT NULL | |
| current_period_end | TIMESTAMPTZ | NOT NULL | |
| cancel_at | TIMESTAMPTZ | NULLABLE | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

### 5.9 Enums

| Enum | Valores |
|------|---------|
| user_role | client, wash_admin, super_admin |
| appointment_status | confirmed, in_progress, completed, cancelled, no_show |
| notif_type | reminder, confirmation, cancellation, review_request |
| sub_status | trial, active, past_due, cancelled |

---

## 6. Roles y Permisos

### 6.1 Cliente (client)
- Acceso a la app mobile unicamente
- Buscar autolavados por ubicacion, distancia, calificacion
- Ver perfil de autolavado con servicios, precios, horarios
- Agendar citas seleccionando servicio, fecha y hora
- Ver historial de sus citas (confirmadas, completadas, canceladas)
- Cancelar citas (con restriccion de tiempo: >= 2 horas antes)
- Calificar y dejar resena despues de un servicio completado
- Editar su perfil y preferencias de notificacion

### 6.2 Admin de Autolavado (wash_admin)
- Acceso al panel admin web
- Dashboard con metricas del dia: citas, ingresos, calificacion
- Ver y gestionar todas las citas de su autolavado
- Editar, reprogramar o cancelar citas
- Configurar servicios: nombre, descripcion, precio, duracion, activo/inactivo
- Configurar horarios de operacion por dia de la semana
- Gestionar estaciones de lavado (agregar/desactivar)
- Ver reportes de ingresos, citas y calificaciones
- Ver resenas de clientes
- Gestionar su suscripcion (ver plan, renovar, cancelar)

### 6.3 Super Admin (super_admin)
- Acceso total al panel admin y seccion super
- Ver y gestionar todos los autolavados de la plataforma
- Verificar/desverificar autolavados
- Gestionar planes de suscripcion y precios
- Ver metricas globales: total negocios, GMV, churn, etc.
- Suspender/reactivar cuentas de autolavados

---

## 7. Autenticacion

### 7.1 Clientes
- Registro con nombre, email, password
- Login con email/password o Google/Apple OAuth
- Supabase Auth maneja tokens y sesiones
- Al registrarse se crea registro en tabla users con role=client
- Password reset via email

### 7.2 Admins de Autolavado
- Registro con email/password + datos del negocio desde landing page de Splash
- Login en /login del panel admin
- Al registrarse se crea user (role=wash_admin) + car_wash + subscription (status=trial, trial_ends_at = now() + 14 dias)
- Middleware verifica que la suscripcion este activa antes de dar acceso

### 7.3 Super Admin
- Cuentas creadas manualmente en Supabase. No hay registro publico para super admins.

---

## 8. Modulo Cliente (App Mobile)

UI: Fondo Background (#F8FAFC), cards blancas, acento Primary (#0284C7). Tipografia Plus Jakarta Sans. Bottom tab navigation con 3 tabs: Inicio, Citas, Perfil.

### 8.1 Login/Registro
- Toggle entre 'Iniciar sesion' y 'Registrarse'
- Campos registro: nombre completo, email, password
- Campos login: email, password
- Botones OAuth: Google, Apple
- Link 'Olvidaste tu password?'
- CTA principal: boton Primary full-width

### 8.2 Home / Mapa (Tab: Inicio)
- Header: ubicacion del usuario + boton notificaciones (con badge)
- Search bar con icono de filtro
- Mapa interactivo (Google Maps) con pins de autolavados
- Lista 'Cerca de ti': cards con logo, nombre, rating (estrellas), distancia, direccion
- Tap en card o pin abre WashProfileScreen
- Filtros: distancia, calificacion, precio (rango)
- Solo aparecen autolavados con: activo=true, verificado=true, subscription_status IN (trial, active), >= 1 servicio activo, horarios configurados

### 8.3 Perfil del Autolavado
- Banner con logo/imagen del autolavado
- Nombre, rating con estrellas, direccion
- Stats: resenas, distancia, numero de servicios
- Lista de servicios disponibles: nombre, descripcion, duracion, precio
- Tap en servicio lleva a ScheduleScreen

### 8.4 Seleccion de Horario
- Resumen del servicio seleccionado (nombre, precio, duracion, autolavado)
- Date picker horizontal: dias de la semana con fecha, scroll horizontal
- Grid de horarios disponibles en bloques de 30 min
- Horarios no disponibles: tachados y deshabilitados
- CTA fijo en bottom: 'Confirmar [hora]' — deshabilitado hasta seleccionar hora

### 8.5 Confirmacion de Cita
- Animacion de check verde
- Titulo: 'Cita confirmada!'
- Subtitulo: 'Recibiras un recordatorio antes de tu cita'
- Card con resumen: autolavado, servicio, fecha, hora, duracion, direccion, total (pago en sitio)
- CTA: 'Ir a mis citas'

### 8.6 Mis Citas (Tab: Citas)
- Lista de citas ordenadas por fecha
- Cada card: nombre autolavado, servicio, fecha, hora, precio, estado
- Estados con badge de color: Confirmada (Primary), Proxima (Warning), Completada (Accent/Success)
- Citas completadas muestran boton 'Calificar servicio'
- Tap en cita futura permite cancelar (si >= 2h antes)

### 8.7 Calificacion
- Icono del autolavado + nombre + servicio + fecha
- Estrellas interactivas (1-5) con label (Muy malo, Malo, Regular, Bueno, Excelente)
- Textarea opcional para comentario
- CTA: 'Enviar calificacion' — deshabilitado hasta seleccionar estrellas

### 8.8 Perfil (Tab: Perfil)
- Avatar + nombre + email
- Opciones: Editar perfil, Mis vehiculos (futuro), Notificaciones, Seguridad
- Boton 'Cerrar sesion' rojo

---

## 9. Modulo Admin (Panel Web)

UI: Sidebar oscuro (Foreground #0F172A) con navegacion. Area principal fondo Background (#F8FAFC) con cards blancas. Top bar con titulo de seccion + notificaciones. Tipografia Plus Jakarta Sans.

### 9.1 Sidebar
- Logo Splash + 'Panel admin'
- Items: Dashboard, Citas, Servicios, Reportes
- Item activo: fondo con tint de Primary, texto blanco
- Footer: avatar + nombre del autolavado + plan + boton logout

### 9.2 Dashboard (/admin/dashboard)
- 4 metric cards: Citas hoy (con comparativa vs ayer), Ingresos hoy (+%), Calificacion (promedio + total resenas), Clientes nuevos (esta semana)
- Grafico de barras: Ingresos de la semana (L-D) con total
- Lista: Proximas citas con avatar, nombre, servicio, hora, estado
- Tabla: Citas de hoy completas — Hora, Cliente, Servicio, Vehiculo, Estacion, Precio, Estado

### 9.3 Citas (/admin/citas)
- Toggle Vista Lista / Vista Calendario
- Vista Lista: tabla filtrable por estado (Todas, Confirmadas, Pendientes, Completadas)
- Cada fila: hora, cliente (avatar + nombre), servicio, vehiculo, estacion, precio, estado, acciones (editar/cancelar)
- Vista Calendario: grid semanal tipo Google Calendar con bloques de color por tipo de servicio

### 9.4 Servicios (/admin/servicios)
- Lista de servicios configurados con nombre, descripcion, precio, duracion, estado (activo/inactivo)
- Botones por servicio: editar, eliminar
- Boton 'Nuevo servicio' abre formulario/modal
- Seccion: Horario de operacion — tabla Lun-Dom con hora apertura/cierre
- Seccion: Estaciones de lavado — grid con estado de cada estacion + boton agregar

### 9.5 Reportes (/admin/reportes)
- Selector de periodo: Hoy, Semana, Mes, 6 Meses, Ano
- 3 metrics: Ingresos totales, Total de citas, Ticket promedio
- Grafico de barras: Ingresos mensuales
- Ranking: Servicios mas solicitados con barras de progreso
- Resumen de calificaciones: promedio grande + distribucion de estrellas (5 a 1) con barras

---

## 10. Sistema de Citas y Disponibilidad

### Algoritmo de disponibilidad

1. Cliente selecciona servicio (tiene `duracion_min`) y fecha
2. Query: `business_hours` del car_wash para ese `dia_semana` -> obtener `hora_apertura` y `hora_cierre`
3. Si `cerrado = true` -> dia no disponible
4. Generar slots de 30 min desde `hora_apertura` hasta `hora_cierre - duracion_min`
5. Para cada slot: contar appointments existentes en ese car_wash/fecha donde el rango [hora_inicio, hora_fin] se traslapa con el slot
6. `estaciones_libres = car_wash.num_estaciones - citas_traslapadas`
7. Si `estaciones_libres > 0` -> slot disponible; sino -> tachado/deshabilitado

### Regla de traslape

Una cita ocupa una estacion desde `hora_inicio` hasta `hora_inicio + duracion_min`. Dos citas se traslapan si sus rangos de tiempo se intersectan:

```
cita_existente.hora_inicio < nuevo_slot.hora_fin AND cita_existente.hora_fin > nuevo_slot.hora_inicio
```

### Asignacion de estacion

Al confirmar, se asigna la estacion con menor numero disponible (round-robin simple):

```sql
SELECT generate_series(1, cw.num_estaciones) AS estacion
FROM car_washes cw WHERE cw.id = $car_wash_id
EXCEPT
SELECT a.estacion FROM appointments a
WHERE a.car_wash_id = $car_wash_id
  AND a.fecha = $fecha
  AND a.estado NOT IN ('cancelled', 'no_show')
  AND a.hora_inicio < $hora_fin
  AND a.hora_fin > $hora_inicio
ORDER BY estacion
LIMIT 1;
```

### Concurrencia

Usar `SELECT ... FOR UPDATE` en la transaccion de creacion de cita para evitar double-booking. Si al confirmar ya no hay estaciones libres, retornar error HTTP 409 y pedir al cliente seleccionar otro horario.

---

## 11. Sistema de Notificaciones

### Tipos

| Tipo | Disparador | Destinatario | Titulo ejemplo |
|------|-----------|-------------|----------------|
| confirmation | Cita creada | client + wash_admin | "Cita confirmada para [fecha] a las [hora]" |
| reminder | 2h antes de la cita (cron) | client | "Tu cita en [nombre] es en 2 horas" |
| cancellation | Cita cancelada | client o wash_admin (el otro) | "[nombre] cancelo tu cita de [fecha]" |
| review_request | 1h despues de hora_fin (cron) | client | "Como estuvo tu lavado en [nombre]?" |

### Implementacion

- Tabla `notifications` almacena todas (leida/no leida)
- Supabase Realtime en canal `notifications:{user_id}` para updates en tiempo real
- Push via Expo Notifications: al insertar en `notifications`, un Edge Function envia push si el user tiene `push_token`
- Cron jobs via Supabase `pg_cron`:
  - Cada 15 min: buscar citas con `hora_inicio - now() <= 2h` y `recordatorio_enviado = false` -> enviar reminder
  - Cada 30 min: buscar citas con estado `completed` y `hora_fin + 1h <= now()` sin review -> enviar review_request

---

## 12. Sistema de Suscripciones

### Planes

| Plan | Precio MXN/mes | Limites |
|------|---------------|---------|
| Basico | $499 | Hasta 1 estacion, servicios ilimitados |
| Pro | $999 | Hasta 5 estaciones, reportes avanzados |
| Premium | $1,999 | Estaciones ilimitadas, soporte prioritario |

### Flujo Stripe

1. Admin se registra -> se crea `car_wash` + `subscription` con `status=trial`, `trial_ends_at = now() + 14 dias`
2. Antes de que termine trial, mostrar banner "Tu trial termina en X dias"
3. Admin selecciona plan -> Stripe Checkout Session -> redirige a Stripe
4. Webhook `checkout.session.completed` -> actualizar `subscription.status = active`, `car_wash.subscription_status = active`
5. Webhook `invoice.payment_failed` -> `status = past_due`, enviar email, mostrar banner
6. Webhook `customer.subscription.deleted` -> `status = cancelled`, bloquear acceso al panel

### Middleware de suscripcion

En cada request a `/admin/*`, verificar que `car_wash.subscription_status` sea `trial` (y no expirado) o `active`. Si no -> redirigir a `/admin/suscripcion`.

---

## 13. Sistema de Calificaciones

### Flujo

1. Cita pasa a `completed` (admin marca en panel o automaticamente al pasar hora_fin + 30min)
2. 1h despues -> notificacion `review_request` al cliente
3. Cliente entra a RatingScreen: estrellas 1-5 + comentario opcional
4. Al enviar: INSERT en `reviews` + UPDATE `car_wash.rating_promedio` y `car_wash.total_reviews`

### Calculo rating_promedio

```sql
-- Trigger AFTER INSERT ON reviews
UPDATE car_washes SET
  rating_promedio = (SELECT AVG(rating)::DECIMAL(2,1) FROM reviews WHERE car_wash_id = NEW.car_wash_id),
  total_reviews = (SELECT COUNT(*) FROM reviews WHERE car_wash_id = NEW.car_wash_id)
WHERE id = NEW.car_wash_id;
```

### Restricciones

- Una review por appointment (UNIQUE constraint en `reviews.appointment_id`)
- Solo si `appointment.estado = completed`
- Solo el cliente de la cita puede calificar (`auth.uid() = client_id`)

---

## 14. Validaciones (Zod schemas en packages/shared)

### User
- email: `z.string().email()`
- nombre: `z.string().min(2).max(150)`
- password: `z.string().min(8)` (al registrar)
- telefono: `z.string().regex(/^\+?[0-9]{10,15}$/).optional()`

### Appointment
- fecha: `z.string().date()` (formato YYYY-MM-DD, no en el pasado)
- hora_inicio: `z.string().time()` (formato HH:mm, dentro de business_hours)
- service_id: `z.string().uuid()`
- car_wash_id: `z.string().uuid()`
- notas_cliente: `z.string().max(500).optional()`

### Service
- nombre: `z.string().min(2).max(150)`
- precio: `z.number().positive().max(99999)`
- duracion_min: `z.number().int().min(15).max(480)`

### Review
- rating: `z.number().int().min(1).max(5)`
- comentario: `z.string().max(1000).optional()`

### Business Hours
- dia_semana: `z.number().int().min(0).max(6)`
- hora_apertura/cierre: `z.string().time()`
- Validacion custom: `hora_cierre > hora_apertura`

---

## 15. Reportes y Metricas

### Panel Admin (/admin/reportes)
- Periodos: Hoy, Semana, Mes, 6 Meses, Ano
- Metricas: Ingresos totales (`SUM precio_cobrado WHERE estado=completed`), Total citas, Ticket promedio
- Grafico barras: Ingresos agrupados por dia/semana/mes segun periodo
- Ranking servicios: `GROUP BY service_id, ORDER BY count DESC`, mostrar barras de progreso
- Resumen calificaciones: promedio grande + distribucion estrellas (5 a 1) con barras

### Super Admin (/super/metricas)
- Total negocios activos, GMV global, Churn rate, MRR (Monthly Recurring Revenue)
- Nuevos negocios por mes (grafico linea)
- Top 10 autolavados por ingresos

### Implementacion
Queries SQL con filtros de fecha. No precalcular — el volumen de datos en v1 no justifica materialized views. Usar server components de Next.js para ejecutar queries directamente.

---

## 16. Flujo Operativo End-to-End

```
CLIENTE                          SISTEMA                         ADMIN
  |                                |                               |
  |-- Abre app ------------------>|                               |
  |<-- Mapa + autolavados --------|                               |
  |-- Tap autolavado ------------>|                               |
  |<-- Perfil + servicios --------|                               |
  |-- Selecciona servicio ------->|                               |
  |<-- Slots disponibles ---------|                               |
  |-- Selecciona hora ----------->|                               |
  |-- Confirma cita ------------->|-- Verifica disponibilidad --->|
  |                               |-- Crea appointment ---------->|
  |                               |-- Asigna estacion ----------->|
  |<-- Confirmacion --------------|-- Notifica admin ------------>|
  |                               |                               |<-- Ve cita en dashboard
  |                               |--[2h antes: reminder push]--->|
  |-- Llega al autolavado ------->|                               |
  |                               |                               |-- Marca "en progreso"
  |                               |                               |-- Marca "completada"
  |                               |--[1h despues: review_request]->|
  |-- Califica servicio --------->|-- Actualiza rating ---------->|
  |                               |                               |<-- Ve resena en panel
```

---

## 17. Edge Cases

| Caso | Manejo |
|------|--------|
| Cliente agenda y no llega | Admin marca `no_show` despues de 30min de la hora. No afecta al cliente en v1 |
| Doble booking (concurrencia) | `SELECT FOR UPDATE` en transaccion. Si falla -> error "Horario ya no disponible" (HTTP 409) |
| Admin cancela cita | Notificacion push al cliente. Cita pasa a `cancelled` con `motivo_cancelacion` obligatorio |
| Cliente cancela < 2h antes | Bloquear cancelacion. Mostrar "Solo puedes cancelar con 2+ horas de anticipacion" |
| Cliente cancela >= 2h antes | Permitir. Estacion se libera. Notificar admin |
| Suscripcion expira | Middleware bloquea panel. Citas existentes se mantienen pero no se pueden crear nuevas |
| Trial termina sin pago | Igual que suscripcion expirada. Banner en dashboard 3 dias antes |
| Autolavado sin servicios | No aparece en busqueda del cliente. Mostrar mensaje en panel admin "Configura tus servicios" |
| Autolavado sin horarios | No aparece en busqueda. Mensaje "Configura tus horarios" en panel |
| Review duplicada | UNIQUE en appointment_id. DB rechaza. UI muestra "Ya calificaste este servicio" |
| Push token invalido | Expo devuelve error. Marcar token como invalido. No reintentar |
| Autolavado no verificado | No aparece en busqueda. Banner en panel "Tu negocio esta en revision" |
| Internet perdido durante booking | Optimistic UI: mostrar confirmacion pendiente, reintentar al reconectar |

---

## 18. Reglas de Negocio Criticas

1. **El pago es en sitio** — la app NO procesa pagos de servicios. `precio_cobrado` es informativo
2. **Stripe solo para suscripciones** de negocios, nunca para clientes
3. **3 taps para agendar** — mapa -> perfil -> confirmar. No mas friction
4. **Cancelacion cliente:** solo >= 2 horas antes de la cita
5. **Cancelacion admin:** en cualquier momento con motivo obligatorio
6. **Una review por cita** — no editable despues de enviada
7. **Autolavado debe tener suscripcion activa** (trial o active) para aparecer en busqueda del cliente
8. **Autolavado debe estar verificado** (`verificado = true`) para aparecer en busqueda
9. **Autolavado debe tener >= 1 servicio activo** y horarios configurados para aparecer
10. **Estaciones >= 1** — no puede tener 0 estaciones (CHECK constraint)
11. **Trial de 14 dias** para nuevos negocios
12. **Slots de 30 minutos** como unidad minima de tiempo
13. **Hora de Mexico (America/Mexico_City)** como timezone de referencia para todas las operaciones

---

## 19. Configuracion Supabase

### RLS Policies

```sql
-- users: cada user solo ve su propio registro
CREATE POLICY users_self ON users FOR ALL USING (auth.uid() = id);

-- car_washes: lectura publica (para clientes buscando), escritura solo owner
CREATE POLICY car_washes_read ON car_washes FOR SELECT USING (true);
CREATE POLICY car_washes_write ON car_washes FOR ALL USING (auth.uid() = owner_id);

-- services: lectura publica, escritura solo owner del car_wash
CREATE POLICY services_read ON services FOR SELECT USING (true);
CREATE POLICY services_write ON services FOR ALL
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));

-- business_hours: lectura publica, escritura solo owner del car_wash
CREATE POLICY hours_read ON business_hours FOR SELECT USING (true);
CREATE POLICY hours_write ON business_hours FOR ALL
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));

-- appointments: cliente ve las suyas, admin ve las de su car_wash
CREATE POLICY appointments_client ON appointments FOR SELECT
  USING (auth.uid() = client_id);
CREATE POLICY appointments_admin ON appointments FOR ALL
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));
CREATE POLICY appointments_insert ON appointments FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- reviews: lectura publica, escritura solo el cliente de la cita
CREATE POLICY reviews_read ON reviews FOR SELECT USING (true);
CREATE POLICY reviews_write ON reviews FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- notifications: solo el destinatario
CREATE POLICY notifications_self ON notifications FOR ALL USING (auth.uid() = user_id);

-- subscriptions: solo el owner del car_wash
CREATE POLICY subscriptions_owner ON subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM car_washes WHERE id = car_wash_id AND owner_id = auth.uid()));
```

### Edge Functions

| Funcion | Proposito |
|---------|-----------|
| `create-appointment` | Validacion completa + verificar disponibilidad + insert transaccional con FOR UPDATE |
| `cancel-appointment` | Validacion de tiempo (>= 2h) + update estado + crear notificacion |
| `stripe-webhook` | Manejar eventos de Stripe (checkout.completed, payment_failed, subscription.deleted) |
| `send-push` | Enviar notificacion via Expo Push API |

### Storage Buckets

| Bucket | Acceso | Uso |
|--------|--------|-----|
| `avatars` | Public read | Fotos de perfil de usuarios |
| `car-wash-images` | Public read | Logos y covers de autolavados |

### Cron Jobs (pg_cron)

| Intervalo | Tarea |
|-----------|-------|
| `*/15 * * * *` | Enviar reminders (citas en proximas 2h con recordatorio_enviado=false) |
| `*/30 * * * *` | Enviar review_requests (1h despues de cita completada sin review) |
| `0 1 * * *` | Marcar citas pasadas sin completar como `no_show` |
| `0 2 * * *` | Verificar trials expirados y actualizar subscription_status |

### Triggers

| Trigger | Tabla | Accion |
|---------|-------|--------|
| `update_rating` | reviews (AFTER INSERT) | Recalcular rating_promedio y total_reviews en car_washes |
| `update_timestamps` | Todas (BEFORE UPDATE) | Set updated_at = now() |
| `auto_complete` | appointments | Cron: si hora_fin + 30min < now() y estado=confirmed -> estado=completed |

---

## 20. Deployment

### Web (Vercel)

- Repo conectado a Vercel via GitHub
- Branch `main` -> produccion
- Branch `develop` -> preview deployments
- Variables de entorno:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

### Mobile (EAS)

- `eas build --platform all` para builds de produccion
- `eas submit` para App Store / Google Play
- Variables via EAS secrets
- OTA updates via `eas update` para fixes rapidos sin rebuild

### Monorepo CI (GitHub Actions)

```yaml
# En cada PR:
- turbo run lint
- turbo run type-check
- turbo run build

# En merge a main:
- Vercel auto-deploy (web)
- Trigger EAS build (mobile, solo si cambios en apps/mobile)
```

### Branching Strategy

- `main` — produccion estable
- `develop` — integracion
- `feature/*` — features individuales
- `fix/*` — bug fixes
