# Tareas de Implementación - AutoAvisa MVP

## Tarea 1: Configuración del Proyecto y Estructura Base

- [x] 1.1 Inicializar proyecto Next.js 14+ con App Router, TypeScript y Tailwind CSS
- [x] 1.2 Crear archivo `.env.local.example` con variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` documentadas con comentarios en español
- [x] 1.3 Crear clientes Supabase: `lib/supabase/client.ts` (Client Components), `lib/supabase/server.ts` (Server Components/Actions), `lib/supabase/middleware.ts` (lógica de sesión)
- [x] 1.4 Crear `middleware.ts` basado en el patrón oficial de supabase-ssr: interceptar rutas, refrescar tokens con `getUser()`, pasar cookies actualizadas
- [x] 1.5 Crear estructura de carpetas según el diseño: `app/`, `components/`, `lib/`, `types/`, `supabase/`, `docs/`
- [x] 1.6 Crear archivo `types/database.ts` con los tipos TypeScript correspondientes al esquema de base de datos (talleres, perfiles, vehiculos, avisos)

## Tarea 2: Esquema de Base de Datos y Migración SQL

- [x] 2.1 Crear migración `supabase/migrations/001_schema_inicial.sql` con las tablas: `talleres`, `perfiles`, `vehiculos`, `avisos` incluyendo constraints, checks e índices según el diseño
- [x] 2.2 Implementar función `public.get_mi_taller_id()` (SECURITY DEFINER, STABLE) para obtener el taller_id del usuario autenticado
- [x] 2.3 Implementar políticas RLS para las 4 tablas: `talleres` (SELECT), `perfiles` (SELECT), `vehiculos` (SELECT, INSERT, UPDATE, DELETE), `avisos` (SELECT, INSERT, UPDATE, DELETE)
- [x] 2.4 Implementar trigger `verificar_limite_perfiles` que rechace inserciones cuando un taller ya tiene 3 perfiles
- [x] 2.5 Implementar trigger `actualizar_updated_at` genérico y aplicarlo a tablas `vehiculos` y `avisos`
- [x] 2.6 Implementar trigger `asignar_taller_aviso` (BEFORE INSERT, SECURITY DEFINER) que copia `taller_id` del vehículo al aviso. Documentar en comentario SQL el orden de ejecución: BEFORE INSERT trigger → RLS WITH CHECK
- [x] 2.7 Configurar extensiones `pg_cron` y `pg_net`, almacenar secretos en Vault (`project_url` y `service_role_key`), y programar cron `0 6 * * *` UTC con autenticación `service_role_key` vía pg_net

## Tarea 3: Scripts de Administración

- [x] 3.1 Crear `supabase/scripts/crear-taller.sql` con script documentado en español para crear taller + usuario dueño (3 pasos: crear usuario en Auth, crear taller, crear perfil)
- [x] 3.2 Crear `supabase/scripts/añadir-trabajador.sql` con script documentado en español para añadir trabajador a taller existente
- [x] 3.3 Crear `docs/admin-scripts.md` con documentación en español explicando el uso de los scripts de administración

## Tarea 4: Componentes UI Reutilizables

- [x] 4.1 Crear componente `components/ui/toast.tsx` — toast reutilizable con variantes éxito/error, visible 3 segundos, textos en español
- [x] 4.2 Crear componente `components/ui/boton.tsx` — botón con estilos táctiles mobile-first, tamaño mínimo adecuado para interacción táctil
- [x] 4.3 Crear componente `components/ui/campo-texto.tsx` — input con label, validación y mensajes de error en español
- [x] 4.4 Crear componente `components/ui/tarjeta.tsx` — tarjeta reutilizable con estilos consistentes

## Tarea 5: Autenticación (Solo Login)

- [x] 5.1 Crear `app/login/page.tsx` — Server Component con formulario de email y contraseña, sin opción de registro, mensajes de error genéricos en español
- [x] 5.2 Crear `app/login/actions.ts` — Server Action con `signInWithPassword()` vía supabase-ssr, redirección a `/dashboard` en éxito
- [x] 5.3 Crear `app/(protected)/layout.tsx` — layout protegido que verifica sesión con `getUser()`, redirige a `/login` si no autenticado, carga perfil del usuario (taller_id, rol)

## Tarea 6: Dashboard Principal

- [x] 6.1 Crear `app/(protected)/dashboard/page.tsx` — Server Component con secciones "Avisos Próximos" (7 días) y "Todos los Vehículos"
- [x] 6.2 Crear `components/buscador-matricula.tsx` — campo de búsqueda por matrícula en la parte superior del dashboard, filtrado client-side en tiempo real (case-insensitive)
- [x] 6.3 Crear `components/vehiculo-card.tsx` — tarjeta de vehículo mostrando: matrícula (destacada), nombre del cliente, teléfono, número de avisos pendientes, fecha del próximo aviso. Clic navega a ficha del vehículo
- [x] 6.4 Crear `components/aviso-card.tsx` — tarjeta de aviso individual con tipo (emoji según mapa), fecha programada, estado, y destacado visual si está dentro de los próximos 7 días

## Tarea 7: Gestión de Vehículos

- [x] 7.1 Crear `app/(protected)/vehiculos/nuevo/page.tsx` — formulario con campos: matrícula (obligatorio), teléfono del cliente (obligatorio, validación prefijo internacional), nombre del cliente (opcional), notas (opcional). Toast de confirmación en español al guardar
- [x] 7.2 Implementar Server Action para crear vehículo: validar datos, insertar en BD con `taller_id` del usuario, manejar error de matrícula duplicada con toast informativo y enlace a ficha existente
- [x] 7.3 Crear `app/(protected)/vehiculos/[id]/page.tsx` — ficha detallada del vehículo con datos, lista de avisos programados ordenados por fecha ASC, avisos próximos (7 días) destacados, botón "Enviar Aviso 🔔", sección historial, botón añadir nuevo aviso

## Tarea 8: Gestión de Avisos

- [x] 8.1 Crear `components/selector-tipo-aviso.tsx` — selector de tipo de mantenimiento (ITV, Cambio de aceite, Filtros, Revisión general, Neumáticos, Otro) con emojis correspondientes
- [x] 8.2 Crear `app/(protected)/vehiculos/[id]/avisos/nuevo/page.tsx` — formulario nuevo aviso con selector de tipo, fecha programada (validar que sea futura), mensaje personalizado opcional. Toast de confirmación al guardar
- [x] 8.3 Implementar Server Action para crear aviso: insertar con `vehiculo_id`, `estado='pendiente'`, `es_manual=false`. El trigger `asignar_taller_aviso` asigna `taller_id` automáticamente
- [x] 8.4 Implementar eliminación de aviso con confirmación previa (diálogo de confirmación en español)
- [x] 8.5 Crear `components/historial-avisos.tsx` — lista de historial de avisos enviados ordenados por fecha de envío DESC, mostrando: tipo, fecha programada, fecha de envío, estado, indicador manual/automático

## Tarea 9: Envío Manual de Avisos

- [x] 9.1 Crear `app/(protected)/vehiculos/[id]/enviar-aviso/page.tsx` — formulario de envío manual con selector de tipo de aviso y campo de mensaje opcional
- [x] 9.2 Implementar Server Action para envío manual: invocar API `/api/send-whatsapp`, registrar aviso en BD con `es_manual=true` y `estado='enviado'`, mostrar toast de confirmación

## Tarea 10: API WhatsApp Dummy

- [x] 10.1 Crear `app/api/send-whatsapp/route.ts` — API Route que acepta POST con datos del aviso (`telefono`, `nombre_cliente`, `nombre_taller`, `tipo_mantenimiento`, `mensaje`, `matricula`)
- [x] 10.2 Implementar generación de mensaje en español con emojis según mapa de tipos (ITV→🚗, Aceite→🛢️, Filtros→🔧, Revisión→🛠️, Neumáticos→🔘, Otro→🔔)
- [x] 10.3 Implementar log en consola con formato: `[WHATSAPP LOG] 🚗 Taller: {nombre} | Para: {cliente} ({tel}) | Aviso: {tipo} | Mensaje: {contenido}`. Retornar `{ estado: 'enviado', timestamp }` con HTTP 200
- [x] 10.4 Implementar validación de request: retornar 400 si faltan campos obligatorios o teléfono inválido, 500 en error interno. Estructura modular para futura integración con Twilio

## Tarea 11: Edge Function — Cron Diario

- [x] 11.1 Crear `supabase/functions/procesar-avisos-diarios/index.ts` — Edge Function Deno que crea cliente Supabase con `service_role` key (bypass RLS) para acceder a avisos de todos los talleres
- [x] 11.2 Implementar consulta de avisos pendientes: `estado='pendiente' AND fecha_programada <= hoy` (usando timezone Europe/Madrid para la fecha actual)
- [x] 11.3 Implementar bucle de procesamiento: para cada aviso, obtener datos de vehículo y taller, POST a `/api/send-whatsapp`, actualizar estado a 'enviado' con `fecha_envio=now()` si éxito, mantener 'pendiente' si fallo con log de error
- [x] 11.4 Implementar respuesta con resumen de procesamiento (total procesados, exitosos, fallidos) y manejo de errores robusto (continuar con siguiente aviso si uno falla)

## Tarea 12: Layout Raíz y Estilos Globales

- [x] 12.1 Crear `app/layout.tsx` — layout raíz con metadata en español, fuente del sistema, providers necesarios
- [x] 12.2 Crear `app/globals.css` — estilos globales Tailwind con configuración mobile-first
- [x] 12.3 Configurar `tailwind.config.ts` con tema personalizado si es necesario, asegurar soporte mobile-first

## Tarea 13: Tests Basados en Propiedades (PBT)

- [x] 13.1 Configurar fast-check como dependencia de desarrollo y crear estructura de tests
- [x] 13.2 ~PBT~ Implementar test de Propiedad 1: Límite de 3 perfiles por taller — generar talleres con 0-4 perfiles, verificar que inserción es rechazada al llegar a 3
- [x] 13.3 ~PBT~ Implementar test de Propiedad 3: Unicidad de matrícula por taller — generar matrículas aleatorias, verificar duplicado rechazado en mismo taller y aceptado en otro
- [x] 13.4 ~PBT~ Implementar test de Propiedad 4: Validación de teléfono — generar cadenas aleatorias válidas e inválidas, verificar función acepta/rechaza correctamente
- [x] 13.5 ~PBT~ Implementar test de Propiedad 5: Estado inicial de avisos — generar avisos con datos aleatorios, verificar estado='pendiente' y es_manual correcto
- [x] 13.6 ~PBT~ Implementar test de Propiedad 6: Avisos ordenados por fecha ASC — generar avisos con fechas aleatorias, verificar orden ascendente
- [x] 13.7 ~PBT~ Implementar test de Propiedad 7: Filtrado de vehículos por matrícula — generar vehículos y queries aleatorios, verificar solo coincidencias case-insensitive
- [x] 13.8 ~PBT~ Implementar test de Propiedad 8: Completitud de datos en tarjeta — generar vehículos con avisos aleatorios, verificar todos los campos requeridos presentes
- [x] 13.9 ~PBT~ Implementar test de Propiedad 9: Query cron retorna avisos pendientes correctos — generar avisos con fechas/estados variados, verificar solo pendientes con fecha <= hoy
- [x] 13.10 ~PBT~ Implementar test de Propiedad 10: Transiciones de estado — generar avisos procesados con éxito/fallo, verificar estado correcto según resultado
- [x] 13.11 ~PBT~ Implementar test de Propiedad 11: Formato de mensajes WhatsApp — generar datos de aviso aleatorios, verificar formato de log correcto y emoji correcto según tipo
- [x] 13.12 ~PBT~ Implementar test de Propiedad 12: Historial ordenado DESC — generar avisos enviados con fechas aleatorias, verificar orden descendente por fecha_envio

## Tarea 14: Tests Unitarios y de Integración

- [x] 14.1 Tests unitarios de login: renderiza campos email/password, no muestra registro, error genérico en credenciales inválidas
- [x] 14.2 Tests unitarios de middleware: redirige a /login sin auth, permite acceso con auth válida
- [x] 14.3 Tests unitarios de dashboard: renderiza secciones "Avisos Próximos" y "Todos los Vehículos"
- [x] 14.4 Tests unitarios de formularios: formulario vehículo renderiza campos requeridos/opcionales, formulario aviso renderiza selector de tipo y campo fecha
- [x] 14.5 Tests unitarios de API WhatsApp: responde 200 con datos válidos, 400 con datos incompletos, toast aparece en éxito/error
- [x] 14.6 Tests de integración: auth flow completo con mock, CRUD vehículos con RLS activo, CRUD avisos con RLS activo, procesamiento Edge Function con mock de API, flujo envío manual completo
- [x] 14.7 Tests smoke: scripts SQL admin existen con estructura correcta, `.env.local.example` existe con variables documentadas, job pg_cron programado con schedule correcto
