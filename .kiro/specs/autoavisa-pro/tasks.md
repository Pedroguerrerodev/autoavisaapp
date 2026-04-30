# Plan de Implementación: AutoAvisa Pro

## Visión General

Implementación incremental de las 5 mejoras Pro sobre el MVP existente de AutoAvisa. Cada tarea construye sobre la anterior, empezando por la base de datos y tipos, siguiendo con la lógica de negocio, y terminando con la integración de componentes y tests. Se usa TypeScript/Next.js 16 con App Router, Supabase y Vitest + fast-check.

## Tareas

- [x] 1. Migración de base de datos y actualización de tipos TypeScript
  - [x] 1.1 Crear archivo de migración `supabase/migrations/002_pro.sql`
    - Añadir columnas `recurrencia_meses` (INTEGER, nullable) y `aviso_origen_id` (UUID, nullable, FK a avisos.id) a la tabla `avisos` con ALTER TABLE
    - Añadir constraint CHECK `chk_recurrencia_meses` que permita NULL o valores entre 1 y 36
    - Crear índice parcial `idx_avisos_origen` en `aviso_origen_id` WHERE NOT NULL
    - Crear tabla `trabajos` con campos: id (UUID PK), vehiculo_id (FK), taller_id (FK), descripcion (TEXT NOT NULL), estado (TEXT con CHECK 'en_curso'|'listo'|'entregado'), created_at, updated_at, fecha_listo (nullable), fecha_entregado (nullable)
    - Habilitar RLS en `trabajos` y crear las 4 políticas (SELECT, INSERT, UPDATE, DELETE) usando `public.get_mi_taller_id()`
    - Crear índices `idx_trabajos_vehiculo_id`, `idx_trabajos_taller_id`, `idx_trabajos_estado`
    - Crear trigger `trigger_trabajos_updated_at` reutilizando `public.actualizar_updated_at()`
    - Crear función `public.asignar_taller_trabajo()` y trigger `trigger_asignar_taller_trabajo` (mismo patrón que `asignar_taller_aviso`)
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.6, 8.1, 8.10, 8.11_

  - [x] 1.2 Actualizar tipos TypeScript en `types/database.ts`
    - Añadir tipo `EstadoTrabajo = 'en_curso' | 'listo' | 'entregado'`
    - Añadir campos `recurrencia_meses: number | null` y `aviso_origen_id: string | null` a la interfaz `Aviso`
    - Crear interfaz `Trabajo` con todos los campos de la tabla
    - Actualizar `SendWhatsAppResponse` para incluir `whatsapp_message_id?: string` opcional
    - _Requisitos: 6.5, 6.7_

- [x] 2. Integración con WhatsApp Cloud API
  - [x] 2.1 Modificar `lib/whatsapp.ts` para modo dual dummy/real
    - Crear clase `WhatsAppApiError` con propiedades `httpStatus`, `whatsappCode` y getter `esRateLimit`
    - Crear función privada `enviarWhatsAppDummy()` con la lógica actual de console.log
    - Crear función privada `enviarWhatsAppReal()` que llame a `graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages` con Bearer token, payload de plantilla con 3 parámetros (nombre_taller, matrícula, etiqueta tipo), idioma "es"
    - Modificar `enviarWhatsApp()` para seleccionar modo según `process.env.WHATSAPP_MODE`: solo `"real"` activa Cloud API, cualquier otro valor usa dummy
    - Validar que `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` existan cuando modo es "real", lanzar error descriptivo si faltan
    - Actualizar tipo de retorno para incluir `whatsapp_message_id?: string`
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.10, 7.2, 7.3_

  - [x] 2.2 Modificar `app/api/send-whatsapp/route.ts` para manejar errores de Cloud API
    - Importar `WhatsAppApiError` desde `lib/whatsapp`
    - En el catch, detectar `WhatsAppApiError` y retornar HTTP 502 con `{ error: "Error de WhatsApp", detalle, codigo }`
    - Registrar errores en console.error con formato `[ERROR WHATSAPP] HTTP {status}: {message}`
    - Mantener el catch genérico existente para errores 500
    - _Requisitos: 1.7, 1.8_

  - [x]* 2.3 Escribir tests de propiedad para modo WhatsApp (`__tests__/pbt/modo-whatsapp.test.ts`)
    - **Propiedad 1: Selección de modo WhatsApp** — Generar valores aleatorios de WHATSAPP_MODE y verificar que solo "real" activa Cloud API
    - **Propiedad 2: Construcción del payload de plantilla** — Generar datos aleatorios de aviso y verificar estructura del payload con 3 parámetros
    - **Propiedad 3: Manejo de errores de Cloud API** — Generar respuestas de error aleatorias y verificar que retorna 502
    - **Propiedad 13: Validación de variables de entorno en modo real** — Generar combinaciones aleatorias de env vars y verificar error descriptivo
    - **Valida: Requisitos 1.1, 1.3, 1.4, 1.6, 1.7, 1.8, 7.2, 7.3**

- [x] 3. Checkpoint — Verificar base de datos y WhatsApp
  - Asegurar que todos los tests pasan (`npm test`), preguntar al usuario si surgen dudas.

- [x] 4. Avisos recurrentes
  - [x] 4.1 Crear componente `components/selector-recurrencia.tsx`
    - Client Component con opciones: "Una vez" (null), "Cada 3 meses" (3), "Cada 6 meses" (6), "Cada 12 meses" (12), "Personalizado"
    - Cuando se selecciona "Personalizado", mostrar campo numérico con rango 1-36
    - Props: `valor: number | null`, `onChange: (meses: number | null) => void`, `error?: string`
    - Usar `<select>` + `<input type="number">` condicional, estilizado con Tailwind CSS v4
    - _Requisitos: 2.1, 2.2, 2.9_

  - [x] 4.2 Modificar formulario de creación de avisos `app/(protected)/vehiculos/[id]/avisos/nuevo/page.tsx`
    - Importar y añadir `SelectorRecurrencia` al formulario existente
    - Añadir campo hidden `recurrencia_meses` al FormData
    - _Requisitos: 2.1, 2.2_

  - [x] 4.3 Modificar `app/(protected)/vehiculos/[id]/avisos/actions.ts` — función `crearAviso()`
    - Extraer `recurrencia_meses` del FormData
    - Validar que sea null, o entero entre 1 y 36
    - Incluir `recurrencia_meses` en el INSERT de Supabase
    - _Requisitos: 2.3, 2.9_

  - [x] 4.4 Modificar Edge Function `supabase/functions/procesar-avisos-diarios/index.ts`
    - Añadir `recurrencia_meses` y `aviso_origen_id` al SELECT de avisos pendientes
    - Tras marcar un aviso como "enviado", si `recurrencia_meses` no es null: crear nuevo aviso con `fecha_programada = fecha_envio + recurrencia_meses meses`, `aviso_origen_id = aviso.aviso_origen_id ?? aviso.id`, mismo tipo, mismo vehiculo_id, misma recurrencia, estado "pendiente"
    - Registrar log de éxito/error de la creación del siguiente aviso
    - _Requisitos: 2.4, 2.5_

  - [x] 4.5 Modificar `components/aviso-card.tsx` para mostrar indicador de recurrencia
    - Añadir prop opcional `recurrencia_meses?: number | null`
    - Mostrar icono 🔁 junto al tipo cuando `recurrencia_meses` no es null
    - Actualizar todas las invocaciones de `AvisoCard` para pasar la nueva prop
    - _Requisitos: 2.6_

  - [x]* 4.6 Escribir tests de propiedad para recurrencia (`__tests__/pbt/recurrencia-avisos.test.ts`)
    - **Propiedad 4: Generación de siguiente aviso en cadena recurrente** — Generar avisos con recurrencia_meses (1-36) y fechas aleatorias, verificar fecha del siguiente aviso y aviso_origen_id
    - **Valida: Requisitos 2.4, 2.5**

  - [x]* 4.7 Escribir tests de propiedad para validación de recurrencia (`__tests__/pbt/validacion-recurrencia.test.ts`)
    - **Propiedad 5: Validación de intervalo de recurrencia** — Generar enteros aleatorios (negativos, 0, 1-36, >36, decimales) y verificar que solo 1-36 son aceptados
    - **Valida: Requisito 2.9**

- [x] 5. Edición de vehículos
  - [x] 5.1 Crear componente reutilizable `components/formulario-vehiculo.tsx`
    - Client Component con campos: matrícula, teléfono (con validación internacional), nombre_cliente, notas
    - Props: `vehiculoId?: string`, `datosIniciales?`, `action: (formData: FormData) => Promise<ResultadoAccion>`
    - Si `datosIniciales` existe, pre-rellenar campos (modo edición)
    - Botones "Guardar" y "Cancelar" (cancelar navega atrás)
    - Mostrar toast de confirmación/error usando el componente existente
    - _Requisitos: 4.1, 4.2, 4.5, 4.6_

  - [x] 5.2 Añadir Server Action `editarVehiculo()` en `app/(protected)/vehiculos/actions.ts`
    - Extraer y validar campos (mismas reglas que `crearVehiculo`)
    - Verificar matrícula no duplicada en el taller excluyendo el vehículo actual
    - UPDATE en Supabase + `revalidatePath`
    - _Requisitos: 4.3, 4.4, 4.5_

  - [x] 5.3 Crear página `app/(protected)/vehiculos/[id]/editar/page.tsx`
    - Server Component que carga datos actuales del vehículo desde Supabase
    - Renderiza `FormularioVehiculo` en modo edición con `datosIniciales` y `editarVehiculo` como action
    - Redirigir a `/vehiculos/{id}` tras guardar exitosamente
    - Usar `await params` para obtener el id (Next.js 16)
    - _Requisitos: 4.1, 4.2, 4.3_

  - [x] 5.4 Añadir botón "Editar" en la ficha del vehículo `app/(protected)/vehiculos/[id]/page.tsx`
    - Enlace a `/vehiculos/{id}/editar` en la sección de datos del vehículo
    - _Requisitos: 4.1_

  - [x]* 5.5 Escribir tests unitarios para edición de vehículos (`__tests__/unit/edicion-vehiculo.test.ts`)
    - Test de pre-relleno de campos en modo edición
    - Test de validación de matrícula duplicada
    - Test de cancelación (descarta cambios)
    - _Requisitos: 4.2, 4.4, 4.6_

- [x] 6. Edición de avisos
  - [x] 6.1 Crear componente reutilizable `components/formulario-aviso.tsx`
    - Client Component con campos: tipo (selector existente), fecha_programada, mensaje_personalizado, recurrencia (usando SelectorRecurrencia)
    - Props: `vehiculoId: string`, `avisoId?: string`, `datosIniciales?`, `action`
    - Si `datosIniciales` existe, pre-rellenar campos (modo edición)
    - Botones "Guardar" y "Cancelar"
    - _Requisitos: 5.1, 5.2, 5.6_

  - [x] 6.2 Añadir Server Action `editarAviso()` en `app/(protected)/vehiculos/[id]/avisos/actions.ts`
    - Extraer y validar campos: tipo, fecha_programada (>= hoy), mensaje_personalizado, recurrencia_meses (null o 1-36)
    - Verificar que el aviso esté en estado "pendiente" antes de actualizar
    - UPDATE en Supabase + `revalidatePath`
    - _Requisitos: 5.3, 5.4, 5.5, 2.7_

  - [x] 6.3 Crear página `app/(protected)/vehiculos/[id]/avisos/[avisoId]/editar/page.tsx`
    - Server Component que carga datos actuales del aviso (incluyendo recurrencia)
    - Solo accesible si el aviso está en estado "pendiente" (redirigir si no)
    - Renderiza `FormularioAviso` en modo edición
    - Usar `await params` para obtener id y avisoId (Next.js 16)
    - _Requisitos: 5.1, 5.2, 5.5_

  - [x] 6.4 Añadir botón "Editar" en cada aviso pendiente en `app/(protected)/vehiculos/[id]/page.tsx`
    - Mostrar botón "Editar" solo en avisos con estado "pendiente"
    - Enlace a `/vehiculos/{id}/avisos/{avisoId}/editar`
    - _Requisitos: 5.1, 5.5_

  - [x]* 6.5 Escribir tests de propiedad para edición de avisos (`__tests__/pbt/edicion-avisos.test.ts`)
    - **Propiedad 9: Restricción de edición a avisos pendientes** — Generar avisos con estados aleatorios y verificar que solo "pendiente" permite edición
    - **Valida: Requisito 5.5**

- [x] 7. Checkpoint — Verificar CRUD completo y recurrencia
  - Asegurar que todos los tests pasan (`npm test`), preguntar al usuario si surgen dudas.

- [x] 8. Trabajos listo
  - [x] 8.1 Crear Server Actions en `app/(protected)/vehiculos/[id]/trabajos/actions.ts`
    - `crearTrabajo(formData)`: validar descripción obligatoria, INSERT con estado "en_curso", revalidatePath
    - `marcarTrabajoListo(trabajoId, vehiculoId)`: UPDATE estado a "listo" + fecha_listo, obtener datos de vehículo y taller, POST a `/api/send-whatsapp` con mensaje de "trabajo listo" (incluir nombre_taller, matrícula, descripción), si WhatsApp falla el trabajo sigue como "listo" pero retornar advertencia, revalidatePath
    - `marcarTrabajoEntregado(trabajoId, vehiculoId)`: UPDATE estado a "entregado" + fecha_entregado, revalidatePath
    - _Requisitos: 8.2, 8.3, 8.5, 8.6, 8.7, 8.9_

  - [x] 8.2 Crear componente `components/trabajo-card.tsx`
    - Client Component con props: id, descripcion, estado, matricula, nombre_cliente, created_at, fecha_listo, vehiculoId
    - Estado `en_curso`: mostrar botón grande "Listo ✅" que llama a `marcarTrabajoListo`
    - Estado `listo`: mostrar botón "Entregado 🤝" que llama a `marcarTrabajoEntregado`
    - Estado `entregado`: solo información (historial)
    - Mostrar toast de confirmación/advertencia según resultado
    - _Requisitos: 8.4, 8.5, 8.6, 8.7, 8.9_

  - [x] 8.3 Añadir sección "Trabajos" en la ficha del vehículo `app/(protected)/vehiculos/[id]/page.tsx`
    - Consultar trabajos del vehículo desde Supabase
    - Sección "Trabajos en Curso" con trabajos en estado `en_curso` y botón "Registrar Trabajo"
    - Formulario inline para crear trabajo (campo descripción + botón)
    - Sección "Historial de Trabajos" con trabajos `listo`/`entregado` ordenados por fecha_listo DESC
    - Usar `TrabajoCard` para renderizar cada trabajo
    - _Requisitos: 8.2, 8.3, 8.4, 8.9, 8.12_

  - [x]* 8.4 Escribir tests de propiedad para trabajos (`__tests__/pbt/transiciones-trabajo.test.ts`)
    - **Propiedad 10: Máquina de estados de trabajos** — Generar trabajos con estados y transiciones aleatorias, verificar que solo en_curso→listo→entregado son válidas
    - **Propiedad 11: Trabajo listo independiente de WhatsApp** — Generar trabajos en_curso con mock de WhatsApp (éxito/fallo aleatorio), verificar que estado siempre cambia a "listo"
    - **Propiedad 12: Orden descendente del historial** — Generar trabajos completados con fechas aleatorias, verificar orden por fecha_listo DESC
    - **Valida: Requisitos 8.3, 8.5, 8.7, 8.9, 8.12**

- [x] 9. Vista del Día (Dashboard mejorado)
  - [x] 9.1 Crear Server Actions para acciones rápidas en `app/(protected)/dashboard/actions.ts`
    - `enviarAvisoAhora(avisoId)`: obtener aviso con datos de vehículo y taller, POST a `/api/send-whatsapp`, UPDATE estado a "enviado" + fecha_envio, si recurrencia_meses != null crear siguiente aviso, revalidatePath('/dashboard')
    - `posponerAviso(avisoId)`: UPDATE fecha_programada = hoy + 1 día, revalidatePath('/dashboard')
    - `marcarAvisoHecho(avisoId)`: UPDATE estado a "enviado" + fecha_envio = now(), si recurrencia_meses != null crear siguiente aviso, revalidatePath('/dashboard')
    - _Requisitos: 3.6, 3.7, 3.8_

  - [x] 9.2 Crear componente `components/vista-del-dia.tsx`
    - Client Component que recibe: avisosHoy, avisosAtrasados, avisosProximos, trabajosEnCurso
    - Contadores numéricos en cabecera (hoy, atrasados, próximos 7 días)
    - Sección "Trabajos en Curso" con botón "Listo ✅" para acción rápida
    - Sección "Avisos Atrasados" con borde/fondo de advertencia si hay avisos
    - Sección "Avisos de Hoy" con tarjetas de aviso
    - Sección "Próximos 7 Días" con tarjetas de aviso
    - Cada tarjeta muestra: icono tipo, matrícula, nombre_cliente, fecha, indicador recurrencia 🔁, y 3 botones: "Enviar ahora", "Posponer 1 día", "Marcar como hecho"
    - Mensaje de celebración 🎉 cuando no hay avisos en ninguna sección
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.9, 3.11, 3.12, 8.8_

  - [x] 9.3 Modificar `app/(protected)/dashboard/page.tsx` para integrar Vista del Día
    - Consultar avisos pendientes clasificados en 3 secciones: hoy (fecha = hoy), atrasados (fecha < hoy), próximos 7 días (mañana a hoy+7)
    - Consultar trabajos en curso del taller
    - Renderizar `VistaDeDia` con los datos clasificados
    - Mantener sección "Todos los Vehículos" con buscador debajo de la Vista del Día
    - Pasar `recurrencia_meses` en los datos de avisos para el indicador 🔁
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.10, 8.8_

  - [x]* 9.4 Escribir tests de propiedad para Vista del Día (`__tests__/pbt/vista-del-dia-secciones.test.ts`)
    - **Propiedad 6: Clasificación de avisos en secciones** — Generar conjuntos de avisos con fechas y estados aleatorios, verificar asignación correcta a secciones
    - **Propiedad 7: Posponer 1 día** — Generar avisos con fechas aleatorias, verificar que fecha_programada = hoy + 1
    - **Propiedad 8: Acciones rápidas de estado** — Generar avisos pendientes con/sin recurrencia, verificar cambio de estado y generación de siguiente aviso
    - **Valida: Requisitos 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8**

- [x] 10. Checkpoint — Verificar funcionalidad completa
  - Asegurar que todos los tests pasan (`npm test`), preguntar al usuario si surgen dudas.

- [x] 11. Actualización de variables de entorno y configuración final
  - [x] 11.1 Actualizar `.env.local.example` con variables de WhatsApp Cloud API
    - Añadir `WHATSAPP_MODE=dummy` con comentario en español explicando opciones (dummy|real)
    - Añadir `WHATSAPP_ACCESS_TOKEN` con comentario sobre dónde obtenerlo (developers.facebook.com)
    - Añadir `WHATSAPP_PHONE_NUMBER_ID` con comentario sobre dónde obtenerlo
    - Añadir `WHATSAPP_TEMPLATE_NAME=aviso_mantenimiento` con comentario sobre los 3 parámetros de la plantilla
    - _Requisitos: 1.9, 7.1_

- [x] 12. Tests unitarios e integración
  - [x]* 12.1 Escribir tests unitarios para selector de recurrencia en `__tests__/unit/formularios.test.ts`
    - Test de opciones correctas del selector
    - Test de campo personalizado con rango 1-36
    - _Requisitos: 2.1, 2.2, 2.9_

  - [x]* 12.2 Escribir tests unitarios para dashboard en `__tests__/unit/dashboard.test.ts`
    - Test de mensaje de celebración cuando no hay avisos
    - Test de sección atrasados con estilo de advertencia
    - _Requisitos: 3.11, 3.12_

  - [x]* 12.3 Escribir tests unitarios para trabajos en `__tests__/unit/trabajos.test.ts`
    - Test de botón correcto según estado (Listo/Entregado/historial)
    - Test de formulario de creación de trabajo
    - _Requisitos: 8.4, 8.5, 8.9_

  - [x]* 12.4 Escribir tests de integración en `__tests__/integration/flujos.test.ts`
    - Flujo: crear aviso recurrente → simular cron → verificar siguiente aviso creado
    - Flujo: editar vehículo → verificar datos actualizados
    - Flujo: crear trabajo → marcar listo → marcar entregado
    - _Requisitos: 2.4, 4.3, 8.5, 8.9_

  - [x]* 12.5 Actualizar tests smoke en `__tests__/smoke/archivos.test.ts`
    - Verificar que `002_pro.sql` existe y contiene ALTER TABLE + CREATE TABLE
    - Verificar que `.env.local.example` contiene variables de WhatsApp
    - Verificar que `types/database.ts` contiene `Trabajo` y campos nuevos de `Aviso`
    - _Requisitos: 6.1, 6.7, 7.1_

- [x] 13. Checkpoint final — Verificar todos los tests
  - Asegurar que todos los tests pasan (`npm test`), preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan las 13 propiedades de corrección del documento de diseño
- Los tests unitarios validan ejemplos específicos y edge cases
- Se reutilizan componentes existentes (toast, campo-texto, tarjeta, selector-tipo-aviso) siempre que sea posible
- Todos los formularios nuevos son Client Components; las páginas son Server Components
- Se usa `await params` en todas las páginas con parámetros dinámicos (Next.js 16)
