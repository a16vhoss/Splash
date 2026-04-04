# Sistema de Reservas — Spec de Diseno

**Fecha:** 2026-04-03
**Estado:** Aprobado

## Resumen

Redisenar el sistema de reservas de Splash para usar slots de tiempo fijos con capacidad configurable por hora y dia. El admin define la duracion del slot y cuantos carros puede atender en cada franja horaria. Los clientes reservan a traves de un wizard de 4 pasos. Sin integracion de Stripe por ahora.

## Contexto

### Lo que existe:
- API de citas (`/api/appointments`) con asignacion de estaciones y validacion
- API de disponibilidad (`/api/availability`) basada en duracion del servicio y num_estaciones
- Pagina de agendar (`/agendar`) que requiere `car_wash_id` + `service_id` obligatorios
- Panel admin de citas con filtros, marcar pagado, completar
- Pagina de mis citas del cliente (`/mis-citas`)

### Problemas:
- Sin `service_id`, la pagina de agendar no muestra nada
- El modelo de estaciones no refleja como operan los autolavados realmente
- No hay forma de configurar capacidad por hora/dia
- El admin no puede crear citas manualmente

## Base de datos

### Cambios en `car_washes`:
```sql
ALTER TABLE car_washes ADD COLUMN slot_duration_min INTEGER DEFAULT 60;
```

### Nueva tabla `slot_capacities`:
```sql
CREATE TABLE slot_capacities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_wash_id UUID REFERENCES car_washes(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL,        -- 0=Domingo, 6=Sabado
  hora TIME NOT NULL,                 -- ej: '08:00', '09:00'
  capacidad INTEGER NOT NULL DEFAULT 1,
  UNIQUE(car_wash_id, dia_semana, hora)
);
```

RLS: wash_admin puede CRUD sus propios registros (via car_wash owner_id). Lectura publica para que clientes vean disponibilidad.

### Cambios en `appointments`:
- `estacion` se deja como nullable pero ya no se asigna automaticamente
- `hora_fin` se calcula como `hora_inicio + slot_duration_min` del car wash

## Panel Admin — Configuracion de slots

### Ubicacion: `/admin/configuracion`

Nueva seccion **"Configuracion de horarios"** con:

1. **Duracion del slot**: Selector con opciones 30, 45, 60, 90, 120 minutos. Se guarda en `car_washes.slot_duration_min`.

2. **Capacidad por dia/hora**: Tabla interactiva. El admin selecciona un dia de la semana. El sistema genera las filas de slots automaticamente basandose en horario de apertura/cierre de ese dia y la duracion del slot. El admin llena la capacidad de cada fila.

Ejemplo (Lunes, 8:00-14:00, slots de 1 hora):

| Hora | Capacidad |
|------|-----------|
| 08:00 | 2 |
| 09:00 | 4 |
| 10:00 | 4 |
| 11:00 | 4 |
| 12:00 | 3 |
| 13:00 | 2 |

3. **Boton "Copiar a todos los dias"**: Copia la capacidad del dia actual a todos los demas dias abiertos, ajustando segun sus horarios.

## Panel Admin — Crear cita manual

### Ubicacion: `/admin/citas`

Boton **"Nueva cita"** que abre un modal/drawer con:
- Selector de servicio
- Selector de fecha
- Selector de hora (solo muestra slots con disponibilidad)
- Nombre del cliente (texto libre, opcional — para walk-ins)
- Metodo de pago
- Boton confirmar

Endpoint: `POST /api/admin/appointments` — solo accesible por wash_admin. Misma logica de validacion pero sin requerir client_id autenticado.

## Flujo de reserva del cliente — Wizard

### Pagina: `/agendar`

Ya no requiere `service_id` obligatorio. Solo necesita `car_wash_id`.

**Paso 1 — Servicio:** Lista de servicios activos (no complementarios). El cliente selecciona uno. Debajo puede agregar extras (complementarios) con checkboxes. Se muestra precio total.

**Paso 2 — Fecha:** Calendario con los proximos 14 dias. Dias cerrados deshabilitados.

**Paso 3 — Hora:** Slots del dia seleccionado con disponibilidad:
- "10:00 — 3 lugares disponibles" (verde, clickeable)
- "11:00 — 1 lugar disponible" (amarillo, clickeable)
- "12:00 — Lleno" (gris, deshabilitado)

Disponibilidad = `capacidad_configurada - citas_existentes_en_ese_slot`

**Paso 4 — Confirmar:** Resumen: servicio, extras, fecha, hora, precio total, metodo de pago (efectivo, tarjeta en sitio, transferencia). Boton "Confirmar reserva".

**Navegacion:** Barra de progreso (Servicio > Fecha > Hora > Confirmar). Puede retroceder en cualquier momento.

### Acceso:
- Desde `/autolavados/[slug]`: boton "Reservar" lleva a `/agendar?car_wash_id=X`
- Si viene con `service_id`, salta al paso 2
- Cada ServiceCard sigue teniendo su boton "Agendar" que lleva con ambos parametros

## API — Cambios

### `GET /api/availability` (modificar):
- Parametros: `car_wash_id`, `fecha` (ya no requiere `service_id`)
- Respuesta:
```json
{
  "slots": [
    { "time": "08:00", "capacidad": 2, "ocupados": 1, "disponibles": 1 },
    { "time": "09:00", "capacidad": 4, "ocupados": 4, "disponibles": 0 },
    { "time": "10:00", "capacidad": 4, "ocupados": 2, "disponibles": 2 }
  ],
  "closed": false,
  "slot_duration_min": 60
}
```
- Logica: busca `slot_capacities` para el dia de la semana, cuenta citas existentes (no canceladas) por slot, calcula disponibles.

### `POST /api/appointments` (modificar):
- `hora_fin` = `hora_inicio + slot_duration_min` del car wash
- Ya no asigna `estacion`
- Validacion: verifica capacidad en slot (capacidad - citas existentes > 0)
- Sin validacion de Stripe/pago en linea

### `POST /api/admin/appointments` (nuevo):
- Solo wash_admin autenticado
- Verifica que el car wash pertenece al admin
- Permite crear cita sin client_id (walk-in)
- Misma logica de validacion de capacidad

## Archivos

### Nuevos:
- `supabase/migrations/007_slot_system.sql`
- `apps/web/src/app/api/admin/appointments/route.ts`
- `apps/web/src/components/slot-config.tsx`
- `apps/web/src/components/booking-wizard.tsx`

### Modificar:
- `apps/web/src/app/api/availability/route.ts`
- `apps/web/src/app/api/appointments/route.ts`
- `apps/web/src/app/(client)/agendar/page.tsx`
- `apps/web/src/app/admin/configuracion/config-form.tsx`
- `apps/web/src/app/admin/configuracion/actions.ts`
- `apps/web/src/app/admin/citas/page.tsx`
- `apps/web/src/app/autolavados/[slug]/page.tsx`
- `apps/web/src/components/time-slot-picker.tsx`

## Fuera de alcance
- Stripe Connect y pagos en linea
- Notificaciones push
- App movil
