# E2E Testing con Playwright — Spec de Diseño

## Objetivo

Implementar testing E2E completo de la aplicación web Splash usando Playwright contra Supabase real. Los tests crean todos los datos necesarios a través de la UI (sin hardcoding, sin seeding directo).

## Decisiones de diseño

- **Supabase real**: No se usa Supabase local ni mocks. Los tests corren contra la instancia real.
- **Sin super_admin**: No se testean las rutas `/super/*` porque no hay forma de crear ese rol vía UI.
- **Secuencial**: Un solo worker, tests ordenados por dependencia de datos. No se paralelizan.
- **Storage state**: Login una vez por rol, reutilizar sesión en tests posteriores.
- **Datos reales**: Emails con timestamp (`test-admin-{ts}@splash.test`) para evitar colisiones entre corridas.
- **Feature nueva requerida**: Botón en admin/citas para cambiar estado de cita a `completed`.

## Estructura de archivos

```
apps/web/
├── playwright.config.ts
├── e2e/
│   ├── global-setup.ts              # Registra wash_admin + client, guarda storage states
│   ├── fixtures/
│   │   └── test-data.ts             # Genera credenciales únicas por corrida (timestamp)
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── register-admin.spec.ts
│   │   └── register-client.spec.ts
│   ├── public/
│   │   ├── landing.spec.ts
│   │   └── autolavados.spec.ts
│   ├── admin/
│   │   ├── dashboard.spec.ts
│   │   ├── servicios.spec.ts
│   │   └── citas.spec.ts
│   ├── client/
│   │   ├── booking.spec.ts
│   │   ├── mis-citas.spec.ts
│   │   ├── calificar.spec.ts
│   │   └── perfil.spec.ts
│   └── .auth/                        # Generado: storage states (gitignored)
│       ├── wash-admin.json
│       └── client.json
```

## Configuración de Playwright

5 projects ejecutados en orden:

| # | Project | Auth | Depende de |
|---|---------|------|------------|
| 1 | `setup` | Ninguna | — |
| 2 | `public` | Ninguna | `setup` |
| 3 | `admin` | wash_admin storage state | `setup` |
| 4 | `client` | client storage state | `admin` (necesita servicios creados) |
| 5 | `admin-round2` | wash_admin storage state | `client` (necesita cita creada) |
| 6 | `client-round2` | client storage state | `admin-round2` (necesita cita completada) |

- `baseURL`: `http://localhost:3000`
- `workers`: 1
- `retries`: 0 (fallo inmediato para debugging)
- `reporter`: html + list
- `timeout`: 30s por test

## Features nuevas requeridas

### Feature 1: Configurar horarios en admin/servicios

**Ubicación:** `apps/web/src/app/admin/servicios/page.tsx` + nueva server action

**Problema:** La tabla de horarios es solo lectura. No hay UI para crear/editar `business_hours`. Sin horarios, el API de availability no devuelve slots y el booking no funciona.

**Comportamiento:**
- Convertir la tabla de horarios en un formulario editable
- Cada día tiene inputs para hora apertura, hora cierre, y toggle abierto/cerrado
- Botón "Guardar horarios" que hace upsert de los 7 días via Server Action
- Usar `revalidatePath` para refrescar

**Alcance mínimo:** Form con 7 filas (Lunes-Domingo), inputs de tipo `time` para apertura/cierre, checkbox para abierto/cerrado, un solo botón submit.

### Feature 2: Cambiar estado de cita en admin/citas

**Ubicación:** `apps/web/src/app/admin/citas/page.tsx` + nueva server action

**Comportamiento:**
- Agregar botón "Marcar completada" en cada fila de cita con estado `confirmed` o `in_progress`
- Usar Server Action para actualizar el estado en Supabase
- Refrescar la página después del cambio (revalidatePath)

**Alcance mínimo:** Solo un botón "Completar" por fila. No es necesario un dropdown completo.

## Detalle de tests por spec

### global-setup.ts (setup project)
No es un spec — es un script que:
1. Abre `/login` en modo "Registrar Negocio"
2. Llena formulario wash_admin (nombre, email, password, nombre_negocio, dirección)
3. Espera redirección a `/admin/dashboard`
4. Guarda storage state → `e2e/.auth/wash-admin.json`
5. Abre nuevo contexto, va a `/login` en modo "Cliente"
6. Llena formulario client (nombre, email, password)
7. Espera redirección a `/`
8. Guarda storage state → `e2e/.auth/client.json`

### auth/login.spec.ts (project: public)
1. **Login con credenciales inválidas muestra error** — email/password incorrectos → mensaje de error visible
2. **Login wash_admin redirige a /admin/dashboard** — usa credenciales del setup → verifica URL
3. **Login client redirige a /** — usa credenciales del setup → verifica URL

### auth/register-admin.spec.ts (project: public)
4. **Registro con campos vacíos muestra validación** — submit sin datos → errores visibles

### auth/register-client.spec.ts (project: public)
5. **Registro con email duplicado muestra error** — usa email del setup → error visible

### public/landing.spec.ts (project: public)
6. **Landing carga y muestra autolavados** — visitar `/` → cards de autolavados visibles
7. **Búsqueda filtra resultados** — escribir nombre del negocio del setup → resultado visible

### public/autolavados.spec.ts (project: public)
8. **Listado muestra car washes** — visitar `/autolavados` → al menos 1 resultado
9. **Detalle muestra info del negocio** — click en car wash → nombre, dirección, servicios visibles
10. **Ruta protegida redirige a login** — visitar `/agendar` sin auth → redirige a `/login`

### admin/dashboard.spec.ts (project: admin)
11. **Dashboard carga con métricas** — verificar que la página muestra cards de métricas

### admin/servicios.spec.ts (project: admin)
12. **Configurar horarios** — llenar apertura/cierre para al menos un día → guardar → horarios visibles
13. **Crear servicio** — llenar form (nombre, precio, duración) → servicio aparece en lista
14. **Toggle desactivar servicio** — click toggle → servicio marcado como inactivo
15. **Eliminar servicio** — click eliminar → servicio desaparece
16. **Crear servicio permanente** — crear "Lavado Básico" $50, 30min (para que el client lo reserve)
17. **Validación de campos vacíos** — submit sin datos → errores visibles

### admin/citas.spec.ts (project: admin)
18. **Estado vacío muestra mensaje** — "No hay citas" visible

### client/booking.spec.ts (project: client)
19. **Booking muestra car wash y servicios** — visitar `/agendar` → car wash del admin visible con "Lavado Básico"
20. **Seleccionar servicio y fecha muestra slots** — elegir servicio + fecha → time slots disponibles
21. **Completar reserva** — seleccionar slot → confirmar → mensaje de éxito o redirección a mis-citas

### client/mis-citas.spec.ts (project: client)
22. **Cita aparece en lista** — visitar `/mis-citas` → cita recién creada visible
23. **Cancelar cita** — click cancelar → ingresar motivo → cita marcada como cancelada
24. **Crear segunda cita** — repetir booking para tener una cita que completar y calificar

### admin/citas.spec.ts (project: admin-round2)
25. **Marcar cita como completada** — ver cita del client → click "Completar" → estado cambia

### client/calificar.spec.ts (project: client-round2)
26. **Calificar cita completada** — ir a calificar → seleccionar 5 estrellas + comentario → enviar
27. **Rating visible en detalle del autolavado** — visitar `/autolavados/[slug]` → rating visible

### client/perfil.spec.ts (project: client-round2)
28. **Perfil muestra datos** — nombre y email del usuario visibles
29. **Logout funciona** — click cerrar sesión → redirige a `/login`

## Total: 29 tests + 2 features nuevas

## Dependencias a instalar

```bash
cd apps/web
npm install -D @playwright/test
npx playwright install chromium
```

## Ejecución

```bash
# Dev server debe estar corriendo
npm run dev:web

# En otra terminal
cd apps/web
npx playwright test

# Con UI mode
npx playwright test --ui

# Un spec específico
npx playwright test e2e/client/booking.spec.ts
```

## Notas

- Los tests no limpian datos después de correr (las cuentas y citas quedan en Supabase real)
- Si hay colisión de datos, cambiar el timestamp o correr en otro momento
- El dev server debe estar corriendo antes de ejecutar los tests
- No se testean: `/admin/reportes` (404), rutas de `/super/*` (no se puede crear super_admin vía UI)
