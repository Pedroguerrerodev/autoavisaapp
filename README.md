# AutoAvisa

Sistema de gestión de avisos de mantenimiento para talleres de automóviles. Programa recordatorios y envíalos por WhatsApp a tus clientes de forma automática.

## Qué hace

- **Avisos automáticos por WhatsApp** — programa la fecha de mantenimiento (aceite, ITV, filtros...) y el sistema envía el mensaje solo cuando toca.
- **Avisos recurrentes** — configura "aceite cada 6 meses" una vez y se reprograma automáticamente después de cada envío.
- **Trabajo listo → WhatsApp** — cuando terminas una reparación, pulsas "Listo" y el cliente recibe un WhatsApp diciendo que su coche está listo para recoger.
- **Vista del día** — al abrir la app ves qué avisos toca enviar hoy, cuáles van atrasados y qué coches están en reparación.
- **Multi-taller** — cada taller tiene sus datos aislados. Un taller no puede ver los datos de otro.
- **Panel de administración** — crea talleres, gestiona usuarios, cambia contraseñas, ve historial de WhatsApp enviados.
- **PWA** — se puede instalar en el móvil como una app nativa.

## Stack técnico

- **Frontend**: Next.js 16 (App Router), Tailwind CSS v4, Lucide React
- **Backend**: Supabase (Auth, PostgreSQL con RLS, Edge Functions)
- **WhatsApp**: WhatsApp Cloud API de Meta (modo dual: dummy para desarrollo, real para producción)
- **Cron**: pg_cron + pg_net → Edge Function diaria a las 08:00 hora española
- **Testing**: Vitest + fast-check (271 tests, incluyendo property-based testing)

## Estructura del proyecto

```
app/
├── login/              # Pantalla de login
├── landing/            # Landing page de venta
├── guia/               # Guía de uso
├── admin/              # Panel de administración
├── (protected)/
│   ├── dashboard/      # Vista del día + lista de vehículos
│   └── vehiculos/      # CRUD de vehículos, avisos y trabajos
└── api/
    ├── send-whatsapp/  # API de envío de WhatsApp (dummy/real)
    └── admin/          # APIs de administración

components/             # Componentes reutilizables
lib/                    # Supabase clients, WhatsApp helpers
supabase/
├── migrations/         # 3 migraciones SQL
├── functions/          # Edge Function del cron diario
└── scripts/            # Scripts SQL para crear talleres
```

## Configuración

1. Clona el repositorio
2. `npm install`
3. Copia `.env.local.example` a `.env.local` y rellena con tus datos de Supabase
4. Ejecuta las migraciones SQL en el editor de Supabase (archivos en `supabase/migrations/`)
5. `npm run dev`

### Variables de entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin
ADMIN_SECRET=

# WhatsApp (opcional — sin esto funciona en modo dummy)
WHATSAPP_MODE=dummy
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TEMPLATE_NAME=aviso_mantenimiento
```

## Base de datos

5 tablas con Row Level Security:

- `talleres` — tenants (talleres registrados)
- `perfiles` — usuarios (máx. 3 por taller: 1 dueño + 2 trabajadores)
- `vehiculos` — coches con matrícula, marca, modelo, teléfono del cliente
- `avisos` — recordatorios de mantenimiento (con recurrencia opcional)
- `trabajos` — reparaciones en curso con notificación al completar

## Tests

```bash
npm test
```

271 tests: property-based testing con fast-check, tests unitarios, de integración y smoke tests.

## Desarrollado por

[pedroguerrerodev.es](https://pedroguerrerodev.es)
