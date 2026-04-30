# Documento de Requisitos — AutoAvisa Pro

## Introducción

AutoAvisa Pro es un conjunto de 5 mejoras prioritarias sobre el MVP existente de AutoAvisa, diseñadas para convertir la aplicación en un producto por el que los talleres de reparación quieran pagar. Las mejoras abordan las carencias más críticas del MVP: (1) integración real con WhatsApp mediante la WhatsApp Cloud API de Meta (1000 conversaciones/mes gratis), (2) avisos recurrentes para automatizar la reprogramación de mantenimientos periódicos, (3) una vista diaria accionable ("Vista del Día") que reemplace el dashboard genérico, (4) edición completa de vehículos y avisos (CRUD completo), y (5) avisos de "trabajo listo" para notificar al cliente por WhatsApp en el instante en que su coche está reparado.

Estas mejoras se construyen **sobre** la base existente del MVP (multi-tenant con RLS, login, dashboard, CRUD parcial de vehículos/avisos, cron diario, API WhatsApp dummy). No se rediseñan las funcionalidades existentes; solo se añaden o modifican las necesarias.

## Glosario

- **Sistema**: La aplicación AutoAvisa (frontend Next.js + backend Supabase), incluyendo las mejoras Pro
- **Taller**: Un taller de reparación registrado en la plataforma. Cada taller es un tenant aislado
- **Perfil**: Usuario asociado a un taller (dueño o trabajador)
- **Vehículo**: Registro de un coche de cliente con matrícula, teléfono del dueño y avisos programados
- **Aviso**: Recordatorio de mantenimiento programado para una fecha futura, asociado a un vehículo
- **Aviso_Recurrente**: Aviso con un patrón de repetición configurado que genera automáticamente el siguiente aviso tras ser enviado
- **WhatsApp_Cloud_API**: API oficial de Meta para envío de mensajes de WhatsApp Business, utilizada como proveedor principal de mensajería
- **Plantilla_WhatsApp**: Mensaje pre-aprobado por Meta/WhatsApp requerido para mensajes iniciados por el negocio (business-initiated)
- **Modo_Dummy**: Modo de operación donde los mensajes WhatsApp se registran en consola en lugar de enviarse realmente, utilizado para desarrollo y testing
- **Función_Cron**: Función Edge de Supabase que se ejecuta diariamente para procesar avisos pendientes y generar las siguientes ocurrencias de avisos recurrentes
- **Vista_del_Día**: Pantalla principal post-login que muestra un resumen accionable del día: avisos de hoy, atrasados y próximos 7 días
- **API_WhatsApp**: Módulo del sistema que gestiona el envío de mensajes, con soporte para modo dummy y modo real (WhatsApp Cloud API)
- **Intervalo_Recurrencia**: Período de repetición de un aviso recurrente (3, 6 o 12 meses, o intervalo personalizado en meses)
- **Trabajo**: Reparación o servicio activo que el taller está realizando sobre un vehículo. Tiene un estado de progreso y al completarse puede notificar al cliente por WhatsApp

## Requisitos

### Requisito 1: Integración Real con WhatsApp Cloud API

**Historia de Usuario:** Como propietario de un taller, quiero que los avisos de mantenimiento se envíen como mensajes reales de WhatsApp a mis clientes, para que reciban el recordatorio en su móvil y el taller quede como "el que avisa".

#### Criterios de Aceptación

1. THE Sistema SHALL soportar dos modos de envío de WhatsApp configurables mediante variable de entorno `WHATSAPP_MODE`: "dummy" (log en consola, comportamiento actual) y "real" (WhatsApp Cloud API de Meta)
2. WHEN el modo de envío es "real", THE API_WhatsApp SHALL enviar mensajes utilizando la WhatsApp Cloud API de Meta, autenticándose con las credenciales configuradas en las variables de entorno `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID`
3. WHEN el modo de envío es "dummy" o cuando las variables de entorno de WhatsApp Cloud API no están configuradas, THE API_WhatsApp SHALL registrar el mensaje en la consola del servidor con el formato existente del MVP
4. WHEN la API_WhatsApp envía un mensaje en modo "real", THE Sistema SHALL utilizar una Plantilla_WhatsApp pre-aprobada por Meta, rellenando los parámetros dinámicos con: nombre del taller, matrícula del vehículo y tipo de mantenimiento
5. THE Sistema SHALL utilizar un número de WhatsApp Business compartido gestionado por el administrador de AutoAvisa para el envío de mensajes de todos los talleres
6. WHEN la API_WhatsApp envía un mensaje en modo "real", THE Sistema SHALL incluir el nombre del taller en el cuerpo del mensaje para que el cliente identifique quién le contacta
7. IF la WhatsApp Cloud API retorna un error al enviar un mensaje, THEN THE Sistema SHALL registrar el error en los logs del servidor, mantener el estado del aviso como "pendiente" y retornar un código HTTP 502 con el detalle del error
8. IF la WhatsApp Cloud API retorna un error de tipo "rate limit" (código 429), THEN THE Sistema SHALL registrar el error y mantener el aviso como "pendiente" para reintento en la siguiente ejecución del cron
9. THE Sistema SHALL incluir en el archivo `.env.local.example` las variables de entorno necesarias para la integración: `WHATSAPP_MODE`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_TEMPLATE_NAME`, documentadas con comentarios en español
10. THE API_WhatsApp SHALL mantener la misma interfaz de función `enviarWhatsApp()` existente en `lib/whatsapp.ts`, seleccionando internamente el proveedor según la configuración del modo

### Requisito 2: Avisos Recurrentes

**Historia de Usuario:** Como dueño o trabajador de un taller, quiero configurar avisos que se repitan automáticamente cada cierto tiempo (por ejemplo, cambio de aceite cada 6 meses), para no tener que reprogramar manualmente cada recordatorio.

#### Criterios de Aceptación

1. WHEN un usuario crea o edita un aviso, THE Sistema SHALL mostrar un selector de recurrencia con las opciones: "Una vez" (sin recurrencia), "Cada 3 meses", "Cada 6 meses", "Cada 12 meses" y "Personalizado"
2. WHEN un usuario selecciona la opción "Personalizado", THE Sistema SHALL mostrar un campo numérico para introducir el intervalo en meses, aceptando valores entre 1 y 36
3. THE Sistema SHALL almacenar la configuración de recurrencia en la tabla `avisos` mediante dos nuevas columnas: `recurrencia_meses` (entero, nullable — null indica aviso de una sola vez) y `aviso_origen_id` (UUID, nullable — referencia al aviso original que generó la cadena de recurrencia)
4. WHEN la Función_Cron procesa un Aviso_Recurrente cuyo estado cambia a "enviado", THE Función_Cron SHALL crear automáticamente un nuevo aviso con estado "pendiente", la misma configuración de recurrencia, el mismo tipo y vehículo, y una `fecha_programada` calculada sumando el valor de `recurrencia_meses` a la **fecha de envío real** (no a la fecha_programada original). Esto garantiza que si un aviso lleva meses atrasado, el siguiente se programa desde hoy + intervalo, respetando el intervalo real de mantenimiento
5. WHEN la Función_Cron crea el siguiente aviso de una cadena recurrente, THE Sistema SHALL asignar el campo `aviso_origen_id` del nuevo aviso con el ID del aviso original (el primer aviso de la cadena)
6. WHEN un usuario visualiza avisos en la ficha de un vehículo o en la Vista_del_Día, THE Sistema SHALL mostrar un icono de repetición (🔁) junto a los avisos que tengan recurrencia configurada
7. WHEN un usuario edita la recurrencia de un aviso, THE Sistema SHALL aplicar el cambio únicamente al aviso editado y a los futuros avisos generados a partir de ese punto, sin modificar avisos anteriores de la cadena
8. IF un usuario elimina un Aviso_Recurrente con estado "pendiente", THEN THE Sistema SHALL eliminar únicamente ese aviso sin afectar a los avisos anteriores ya enviados de la misma cadena
9. THE Sistema SHALL validar que el valor de `recurrencia_meses` sea un entero positivo entre 1 y 36 cuando se configura un intervalo personalizado

### Requisito 3: Vista del Día (Resumen Diario Accionable)

**Historia de Usuario:** Como mecánico o dueño de un taller, quiero ver al abrir la app un resumen claro de lo que tengo que hacer hoy — avisos por enviar, atrasados y próximos — con botones de acción directa, para gestionar mi día sin perder tiempo.

#### Criterios de Aceptación

1. WHEN un usuario autenticado accede al Dashboard, THE Sistema SHALL mostrar la Vista_del_Día como contenido principal, organizada en tres secciones: "Avisos de Hoy", "Avisos Atrasados" y "Próximos 7 Días"
2. THE Sistema SHALL mostrar en la sección "Avisos de Hoy" todos los avisos con `fecha_programada` igual a la fecha actual y estado "pendiente", ordenados por tipo de mantenimiento
3. THE Sistema SHALL mostrar en la sección "Avisos Atrasados" todos los avisos con `fecha_programada` anterior a la fecha actual y estado "pendiente", ordenados por fecha ascendente (los más antiguos primero)
4. THE Sistema SHALL mostrar en la sección "Próximos 7 Días" todos los avisos con `fecha_programada` entre mañana y 7 días en el futuro y estado "pendiente", ordenados por fecha ascendente
5. WHEN un usuario visualiza la Vista_del_Día, THE Sistema SHALL mostrar contadores numéricos en la cabecera con el número de avisos en cada sección: hoy, atrasados y próximos 7 días
6. WHEN un usuario hace clic en el botón "Enviar ahora" de un aviso en la Vista_del_Día, THE Sistema SHALL enviar el aviso por WhatsApp utilizando la API_WhatsApp, cambiar su estado a "enviado" y actualizar la vista sin recargar la página completa
7. WHEN un usuario hace clic en el botón "Posponer 1 día" de un aviso en la Vista_del_Día, THE Sistema SHALL actualizar la `fecha_programada` del aviso sumando 1 día a la fecha actual y actualizar la vista
8. WHEN un usuario hace clic en el botón "Marcar como hecho" de un aviso en la Vista_del_Día, THE Sistema SHALL cambiar el estado del aviso a "enviado" sin enviar mensaje por WhatsApp, registrando en `fecha_envio` la fecha actual
9. THE Sistema SHALL mostrar cada tarjeta de aviso en la Vista_del_Día con: icono de tipo de mantenimiento, matrícula del vehículo, nombre del cliente, fecha programada, indicador de recurrencia (si aplica) y los tres botones de acción rápida
10. THE Sistema SHALL mantener la sección "Todos los Vehículos" con buscador por matrícula debajo de la Vista_del_Día, preservando la funcionalidad existente del dashboard
11. IF la sección "Avisos Atrasados" contiene avisos, THEN THE Sistema SHALL destacar visualmente la sección con un borde o fondo de color de advertencia para llamar la atención del usuario
12. WHEN la Vista_del_Día no tiene avisos en ninguna de las tres secciones, THE Sistema SHALL mostrar un mensaje indicando que no hay avisos pendientes con un emoji de celebración

### Requisito 4: Edición de Vehículos

**Historia de Usuario:** Como dueño o trabajador de un taller, quiero poder editar los datos de un vehículo ya registrado (teléfono, nombre del cliente, notas, matrícula), para corregir errores o actualizar información sin tener que eliminar y recrear el registro.

#### Criterios de Aceptación

1. WHEN un usuario accede a la ficha de un vehículo, THE Sistema SHALL mostrar un botón "Editar" que permita modificar los campos: matrícula, teléfono del cliente, nombre del cliente y notas
2. WHEN un usuario hace clic en "Editar", THE Sistema SHALL mostrar un formulario pre-rellenado con los datos actuales del vehículo
3. WHEN un usuario guarda los cambios de un vehículo con datos válidos, THE Sistema SHALL actualizar el registro en la base de datos y mostrar un toast de confirmación en español
4. IF un usuario modifica la matrícula a una que ya existe en su taller, THEN THE Sistema SHALL mostrar un mensaje de error indicando que la matrícula ya está registrada
5. THE Sistema SHALL validar que el campo teléfono contenga un número válido con prefijo internacional antes de guardar los cambios, aplicando las mismas reglas de validación que en la creación
6. WHEN un usuario cancela la edición, THE Sistema SHALL descartar los cambios y volver a mostrar la ficha del vehículo con los datos originales

### Requisito 5: Edición de Avisos

**Historia de Usuario:** Como dueño o trabajador de un taller, quiero poder editar un aviso programado (cambiar fecha, tipo, mensaje, recurrencia), para ajustar los recordatorios sin tener que eliminarlos y crearlos de nuevo.

#### Criterios de Aceptación

1. WHEN un usuario accede a la ficha de un vehículo, THE Sistema SHALL mostrar un botón "Editar" en cada aviso con estado "pendiente" que permita modificar los campos: fecha programada, tipo de mantenimiento, mensaje personalizado y configuración de recurrencia
2. WHEN un usuario hace clic en "Editar" de un aviso, THE Sistema SHALL mostrar un formulario pre-rellenado con los datos actuales del aviso
3. WHEN un usuario guarda los cambios de un aviso con datos válidos, THE Sistema SHALL actualizar el registro en la base de datos y mostrar un toast de confirmación en español
4. THE Sistema SHALL validar que la fecha programada editada sea igual o posterior a la fecha actual antes de guardar los cambios
5. THE Sistema SHALL permitir editar únicamente avisos con estado "pendiente", ocultando el botón de edición en avisos con estado "enviado" o "fallido"
6. WHEN un usuario cancela la edición de un aviso, THE Sistema SHALL descartar los cambios y volver a mostrar el aviso con los datos originales

### Requisito 8: Avisos de Trabajo Listo

**Historia de Usuario:** Como mecánico o dueño de un taller, quiero registrar los coches que estoy reparando y cuando termino pulsar "Listo" para que el cliente reciba un WhatsApp al instante diciendo que su coche está listo para recoger, para que el cliente venga rápido y no tenga que llamarle por teléfono.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir una nueva tabla `trabajos` con los campos: id (UUID), vehiculo_id (FK vehiculos), taller_id (FK talleres), descripcion (TEXT), estado (TEXT: 'en_curso' | 'listo' | 'entregado'), created_at (TIMESTAMPTZ), updated_at (TIMESTAMPTZ), fecha_listo (TIMESTAMPTZ, nullable), fecha_entregado (TIMESTAMPTZ, nullable)
2. WHEN un usuario accede a la ficha de un vehículo, THE Sistema SHALL mostrar una sección "Trabajos" con un botón "Registrar Trabajo" para crear un nuevo trabajo en curso
3. WHEN un usuario crea un trabajo, THE Sistema SHALL solicitar una descripción del trabajo (obligatoria, ej: "Cambio de pastillas de freno", "Revisión ITV") y guardarlo con estado "en_curso"
4. WHEN un usuario accede a la ficha de un vehículo con trabajos en curso, THE Sistema SHALL mostrar cada trabajo con su descripción, fecha de inicio y un botón grande "Listo ✅"
5. WHEN un usuario pulsa el botón "Listo ✅" de un trabajo, THE Sistema SHALL cambiar el estado del trabajo a "listo", registrar la fecha_listo, y enviar inmediatamente un mensaje WhatsApp al cliente del vehículo utilizando la API_WhatsApp con un mensaje que incluya: nombre del taller, matrícula, descripción del trabajo y que el coche está listo para recoger
6. WHEN el mensaje WhatsApp de trabajo listo se envía correctamente, THE Sistema SHALL mostrar un toast de confirmación en español
7. IF el envío del mensaje WhatsApp falla, THEN THE Sistema SHALL cambiar igualmente el estado del trabajo a "listo" pero mostrar un toast de advertencia indicando que el mensaje no se pudo enviar
8. WHEN un usuario accede al Dashboard (Vista del Día), THE Sistema SHALL mostrar una sección "Trabajos en Curso" encima de las secciones de avisos, mostrando los trabajos con estado "en_curso" con el botón "Listo ✅" para acción rápida
9. WHEN un usuario pulsa "Entregado" en un trabajo con estado "listo", THE Sistema SHALL cambiar el estado a "entregado" y registrar la fecha_entregado, moviendo el trabajo al historial
10. THE Sistema SHALL aplicar políticas RLS en la tabla `trabajos` con las mismas reglas que las demás tablas: un usuario solo puede ver/crear/modificar trabajos de su propio taller
11. THE Sistema SHALL incluir un trigger BEFORE INSERT en la tabla `trabajos` que copie el taller_id del vehículo, siguiendo el mismo patrón que el trigger `asignar_taller_aviso`
12. THE Sistema SHALL mostrar en la ficha del vehículo un historial de trabajos completados (estado "listo" o "entregado") ordenados por fecha descendente

### Requisito 6: Migración de Base de Datos

**Historia de Usuario:** Como desarrollador, quiero que los cambios en el esquema de base de datos se apliquen mediante una migración incremental, para no perder datos existentes ni recrear tablas.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir un archivo de migración SQL en `supabase/migrations/` que añada las columnas `recurrencia_meses` (INTEGER, nullable) y `aviso_origen_id` (UUID, nullable, FK a avisos.id) a la tabla `avisos` existente
2. THE Sistema SHALL definir un constraint CHECK en la columna `recurrencia_meses` que permita únicamente valores entre 1 y 36 o NULL
3. THE Sistema SHALL crear un índice en la columna `aviso_origen_id` para consultas eficientes de cadenas de recurrencia
4. THE Sistema SHALL garantizar que la migración sea compatible con los datos existentes, utilizando `ALTER TABLE ... ADD COLUMN` sin valores por defecto obligatorios
5. THE Sistema SHALL actualizar los tipos TypeScript en `types/database.ts` para reflejar las nuevas columnas: `recurrencia_meses` (number | null) y `aviso_origen_id` (string | null) en la interfaz `Aviso`
6. THE Sistema SHALL crear la tabla `trabajos` con RLS habilitado, políticas de aislamiento por taller_id, trigger de asignación automática de taller_id, trigger de updated_at, e índices para vehiculo_id y taller_id
7. THE Sistema SHALL actualizar los tipos TypeScript en `types/database.ts` para incluir la nueva interfaz `Trabajo` con todos los campos de la tabla

### Requisito 7: Configuración de Variables de Entorno

**Historia de Usuario:** Como desarrollador, quiero que todas las variables de entorno necesarias para las nuevas funcionalidades estén documentadas, para poder configurar el entorno correctamente.

#### Criterios de Aceptación

1. THE Sistema SHALL actualizar el archivo `.env.local.example` con las siguientes variables documentadas con comentarios en español: `WHATSAPP_MODE` (dummy|real), `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`
2. THE Sistema SHALL utilizar el valor "dummy" como valor por defecto para `WHATSAPP_MODE` cuando la variable no esté configurada, garantizando que la aplicación funcione sin configuración de WhatsApp real
3. THE Sistema SHALL validar al iniciar el modo "real" que las variables `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_PHONE_NUMBER_ID` estén configuradas, registrando un error descriptivo en los logs si faltan
