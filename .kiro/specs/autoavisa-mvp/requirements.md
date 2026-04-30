# Documento de Requisitos - AutoAvisa MVP

## Introducción

AutoAvisa es un SaaS sencillo y económico para talleres de reparación de automóviles. Su propuesta de valor es clara: el taller registra el coche y el teléfono del cliente, programa fechas de mantenimiento (ITV, aceite, filtros, revisión...) y el sistema envía automáticamente un WhatsApp al cliente cuando toca. El taller queda como "el que avisa", fideliza clientes sin esfuerzo y genera visitas recurrentes.

**Modelo de acceso:** No existe registro público. El administrador de AutoAvisa crea las cuentas manualmente tras el pago del taller. Cada taller puede tener máximo 3 usuarios: el dueño + hasta 2 trabajadores. Los clientes finales nunca interactúan con la aplicación — solo reciben el WhatsApp en su móvil.

Diseñado para talleres pequeños con una interfaz mínima, rápida y mobile-first.

## Glosario

- **Sistema**: La aplicación AutoAvisa (frontend Next.js + backend Supabase)
- **Admin**: El administrador de AutoAvisa (tú), responsable de crear cuentas de taller tras el pago
- **Taller**: Un taller de reparación registrado en la plataforma. Cada taller es un tenant aislado con máximo 3 usuarios
- **Perfil**: Usuario asociado a un taller. Puede ser el dueño o un trabajador (máximo 2 trabajadores por taller)
- **Vehículo**: Registro de un coche de cliente con matrícula, teléfono del dueño y avisos programados. El cliente nunca interactúa con la app
- **Aviso**: Recordatorio programado para una fecha futura asociado a un vehículo (ej: ITV, cambio de aceite, filtros)
- **RLS**: Row Level Security, políticas de seguridad en PostgreSQL que aíslan los datos entre talleres
- **API_WhatsApp**: Endpoint que simula el envío de mensajes WhatsApp mediante logs en consola (modo dummy para MVP, preparado para Twilio)
- **Función_Cron**: Función Edge de Supabase que se ejecuta diariamente para disparar avisos pendientes
- **Dashboard**: Pantalla principal donde el taller ve sus vehículos y avisos próximos

## Requisitos

### Requisito 1: Acceso al Sistema (Solo Login)

**Historia de Usuario:** Como propietario de un taller con cuenta creada por el administrador de AutoAvisa, quiero iniciar sesión con mis credenciales, para acceder al dashboard de mi taller.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar únicamente una pantalla de login con campos de email y contraseña, sin opción de registro público
2. WHEN un usuario introduce credenciales válidas en el formulario de login, THE Sistema SHALL autenticar al usuario mediante supabase-ssr y redirigirlo al Dashboard de su taller
3. IF un usuario introduce credenciales inválidas, THEN THE Sistema SHALL mostrar un mensaje de error en español sin revelar si el email existe
4. IF un usuario no autenticado intenta acceder a una ruta protegida, THEN THE Sistema SHALL redirigir a la pantalla de login
5. THE Sistema SHALL proveer un script SQL documentado en español para que el Admin pueda crear cuentas de taller manualmente en Supabase, incluyendo: crear usuario en Auth, crear registro en talleres y crear perfil asociado
6. THE Sistema SHALL limitar a un máximo de 3 perfiles por taller (1 dueño + hasta 2 trabajadores)
7. THE Sistema SHALL proveer un script SQL documentado para que el Admin pueda añadir trabajadores a un taller existente

### Requisito 2: Aislamiento de Datos entre Talleres (RLS)

**Historia de Usuario:** Como propietario de un taller, quiero que mis datos de clientes estén completamente aislados de otros talleres, para garantizar la privacidad.

#### Criterios de Aceptación

1. THE Sistema SHALL aplicar políticas RLS en las tablas vehiculos y avisos que restrinjan lectura y escritura exclusivamente a registros cuyo taller_id coincida con el taller_id del perfil del usuario autenticado
2. WHEN un usuario autenticado realiza una consulta, THE Sistema SHALL retornar únicamente registros pertenecientes a su taller
3. IF un usuario intenta acceder a datos de otro taller mediante manipulación de consultas, THEN THE Sistema SHALL denegar la operación y retornar un conjunto vacío

### Requisito 3: Registro de Vehículos

**Historia de Usuario:** Como dueño o trabajador de un taller, quiero registrar un coche con el teléfono del cliente de forma rápida, para poder programarle avisos de mantenimiento.

#### Criterios de Aceptación

1. WHEN un usuario hace clic en "Añadir Vehículo", THE Sistema SHALL mostrar un formulario con los campos: matrícula, teléfono del cliente, nombre del cliente (opcional) y notas (opcional)
2. WHEN un usuario completa el formulario con matrícula y teléfono válidos, THE Sistema SHALL guardar el vehículo en la base de datos asociado al taller del usuario y mostrar un toast de confirmación en español
3. IF un usuario intenta registrar una matrícula que ya existe en su taller, THEN THE Sistema SHALL mostrar un mensaje indicando que el vehículo ya está registrado y ofrecer acceder a su ficha
4. THE Sistema SHALL validar que el campo teléfono contenga un número válido con prefijo internacional antes de guardar

### Requisito 4: Programación de Avisos de Mantenimiento

**Historia de Usuario:** Como dueño o trabajador de un taller, quiero programar avisos de mantenimiento para un vehículo (ITV, aceite, filtros...), para que el sistema avise automáticamente al cliente cuando toque.

#### Criterios de Aceptación

1. WHEN un usuario accede a la ficha de un vehículo, THE Sistema SHALL mostrar los avisos programados existentes y un botón para añadir un nuevo aviso
2. WHEN un usuario crea un aviso, THE Sistema SHALL solicitar: tipo de mantenimiento (selección entre ITV, cambio de aceite, filtros, revisión general, neumáticos, otro), fecha programada y mensaje personalizado opcional
3. WHEN un usuario guarda un aviso con datos válidos, THE Sistema SHALL almacenar el aviso en la base de datos con estado "pendiente" y mostrar un toast de confirmación
4. WHEN un usuario accede a la ficha de un vehículo, THE Sistema SHALL mostrar los avisos ordenados por fecha, destacando visualmente los próximos a vencer en los siguientes 7 días
5. WHEN un usuario desea eliminar un aviso, THE Sistema SHALL solicitar confirmación antes de eliminarlo

### Requisito 5: Dashboard Principal del Taller

**Historia de Usuario:** Como propietario de un taller, quiero ver de un vistazo los avisos próximos y buscar vehículos rápidamente, para gestionar mi taller sin complicaciones.

#### Criterios de Aceptación

1. WHEN un usuario accede al Dashboard, THE Sistema SHALL mostrar dos secciones: "Avisos Próximos" (avisos de los próximos 7 días) y "Todos los Vehículos" (lista completa)
2. WHEN un usuario introduce texto en el campo de búsqueda, THE Sistema SHALL filtrar vehículos en tiempo real por matrícula
3. THE Sistema SHALL posicionar el campo de búsqueda por matrícula en la parte superior del Dashboard para acceso inmediato
4. THE Sistema SHALL mostrar cada vehículo como una tarjeta con: matrícula (destacada), nombre del cliente, teléfono, número de avisos pendientes y fecha del próximo aviso
5. WHEN un usuario hace clic en una tarjeta de vehículo, THE Sistema SHALL navegar a la ficha detallada del vehículo con sus avisos

### Requisito 6: Envío Automático de Avisos (Cron Diario)

**Historia de Usuario:** Como propietario de un taller, quiero que el sistema envíe automáticamente los avisos de mantenimiento en la fecha programada, para fidelizar clientes sin esfuerzo manual.

#### Criterios de Aceptación

1. THE Función_Cron SHALL ejecutarse diariamente mediante un cron programado en Supabase utilizando la zona horaria Europa/Madrid
2. WHEN la Función_Cron se ejecuta, THE Sistema SHALL consultar todos los avisos cuya fecha programada sea menor o igual a la fecha actual y cuyo estado sea "pendiente"
3. WHEN la Función_Cron encuentra avisos pendientes, THE Sistema SHALL invocar la API_WhatsApp para cada aviso utilizando los datos del vehículo y del taller correspondiente
4. WHEN la Función_Cron procesa un aviso exitosamente, THE Sistema SHALL cambiar el estado del aviso a "enviado" y registrar la fecha de envío
5. IF la Función_Cron falla al procesar un aviso individual, THEN THE Sistema SHALL mantener el estado "pendiente" del aviso y registrar el error en los logs del servidor

### Requisito 7: Notificaciones WhatsApp (Modo Dummy para MVP)

**Historia de Usuario:** Como propietario de un taller, quiero que el sistema envíe WhatsApp a mis clientes cuando toque su mantenimiento, para que el taller quede como "el que avisa".

#### Criterios de Aceptación

1. WHEN el Sistema necesita enviar un aviso WhatsApp, THE API_WhatsApp SHALL registrar en la consola del servidor un log con el formato: [WHATSAPP LOG] 🚗 Taller: {nombre_taller} | Para: {nombre_cliente} ({telefono}) | Aviso: {tipo_mantenimiento} | Mensaje: {contenido}
2. THE API_WhatsApp SHALL generar mensajes en español con emojis relevantes (🚗, 🛠️, ✅, 🔔) según el tipo de mantenimiento
3. THE API_WhatsApp SHALL exponer la ruta /api/send-whatsapp que acepte los datos del aviso y retorne un código HTTP 200 con estado "enviado" al procesarse exitosamente
4. THE API_WhatsApp SHALL estructurar el código de forma que la integración con Twilio en el futuro requiera modificar únicamente la función de envío, sin alterar la lógica de negocio

### Requisito 8: Envío Manual de Aviso

**Historia de Usuario:** Como dueño o trabajador de un taller, quiero poder enviar un aviso manualmente a un cliente en cualquier momento, para comunicarme cuando sea necesario fuera de las fechas programadas.

#### Criterios de Aceptación

1. WHEN un usuario hace clic en el botón "Enviar Aviso 🔔" en la ficha de un vehículo, THE Sistema SHALL mostrar un selector de tipo de aviso y un campo de mensaje opcional
2. WHEN un usuario confirma el envío manual, THE Sistema SHALL invocar la API_WhatsApp con los datos del vehículo y mostrar un toast de confirmación
3. WHEN un aviso manual se envía exitosamente, THE Sistema SHALL registrar el envío en el historial de avisos del vehículo con la nota "Envío manual"

### Requisito 9: Historial de Avisos por Vehículo

**Historia de Usuario:** Como dueño de un taller, quiero ver qué avisos se han enviado a un cliente, para saber qué mantenimientos se le han recordado y cuándo.

#### Criterios de Aceptación

1. WHEN un usuario accede a la ficha de un vehículo, THE Sistema SHALL mostrar una sección "Historial de Avisos" con todos los avisos enviados ordenados por fecha descendente
2. THE Sistema SHALL mostrar para cada aviso del historial: tipo de mantenimiento, fecha programada, fecha de envío, estado (pendiente, enviado, fallido) y si fue automático o manual

### Requisito 10: Interfaz 100% en Español y Mobile-First

**Historia de Usuario:** Como usuario de un taller, quiero una interfaz sencilla con botones grandes y todo en español, para poder usarla rápidamente desde el móvil.

#### Criterios de Aceptación

1. THE Sistema SHALL renderizar toda la interfaz en español, incluyendo etiquetas, mensajes de error, toasts, textos de ayuda y logs de consola
2. THE Sistema SHALL utilizar Tailwind CSS con enfoque mobile-first y botones de tamaño mínimo adecuado para interacción táctil
3. THE Sistema SHALL utilizar iconos de Lucide React para las acciones principales
4. WHEN una operación se completa exitosamente, THE Sistema SHALL mostrar un toast de confirmación visible durante 3 segundos
5. WHEN una operación falla, THE Sistema SHALL mostrar un toast de error con descripción del problema en español

### Requisito 11: Configuración del Proyecto

**Historia de Usuario:** Como desarrollador, quiero una configuración clara y documentada, para poder desplegar la aplicación fácilmente.

#### Criterios de Aceptación

1. THE Sistema SHALL incluir un archivo .env.local.example con las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY documentadas con comentarios en español
2. THE Sistema SHALL utilizar Next.js con App Router como framework principal
3. THE Sistema SHALL incluir comentarios en español en el código explicando la lógica de negocio principal
