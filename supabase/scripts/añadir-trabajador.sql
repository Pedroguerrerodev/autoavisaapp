-- ============================================================================
-- AutoAvisa MVP — Script: Añadir Trabajador a Taller Existente
-- ============================================================================
--
-- DESCRIPCIÓN:
--   Este script añade un nuevo trabajador a un taller que ya existe en AutoAvisa.
--   Debe ejecutarse en el SQL Editor del Dashboard de Supabase.
--
-- REQUISITOS PREVIOS:
--   1. Acceso al Dashboard de Supabase del proyecto
--   2. Permisos de administrador en el proyecto
--   3. El taller ya debe existir (creado con el script crear-taller.sql)
--   4. El taller debe tener menos de 3 usuarios (máximo: 1 dueño + 2 trabajadores)
--
-- PASOS:
--   1. Crear el usuario en Supabase Auth (desde el Dashboard)
--   2. Crear el perfil del trabajador en la tabla `perfiles`
--
-- NOTAS IMPORTANTES:
--   - Cada taller tiene un límite máximo de 3 usuarios
--   - Si el taller ya tiene 3 usuarios, el trigger `verificar_limite_perfiles`
--     rechazará la inserción con el error:
--     "El taller ya tiene el máximo de 3 usuarios permitidos"
--   - Para verificar cuántos usuarios tiene un taller, usar la consulta
--     de verificación al final de este script
--
-- ============================================================================


-- ============================================================================
-- CONSULTA PREVIA: Verificar usuarios actuales del taller
-- ============================================================================
-- Antes de añadir un trabajador, verificar cuántos usuarios tiene el taller.
-- Reemplazar '<TALLER_ID>' con el UUID del taller.

-- SELECT COUNT(*) AS total_usuarios, 3 - COUNT(*) AS plazas_disponibles
-- FROM public.perfiles
-- WHERE taller_id = '<TALLER_ID>';

-- Si plazas_disponibles = 0, NO se puede añadir más usuarios.


-- ============================================================================
-- PASO 1: Crear el usuario en Supabase Auth
-- ============================================================================
-- Este paso se realiza MANUALMENTE desde el Dashboard de Supabase:
--
--   1. Ir a Authentication > Users en el Dashboard de Supabase
--   2. Hacer clic en "Add User" > "Create New User"
--   3. Introducir el email y contraseña del trabajador
--   4. Marcar "Auto Confirm User" para que el usuario pueda iniciar sesión inmediatamente
--   5. Hacer clic en "Create User"
--   6. Copiar el UUID del usuario creado (columna "User UID")
--
-- ⚠️  IMPORTANTE: Anotar el UUID del usuario. Se necesita en el Paso 2.
--


-- ============================================================================
-- PASO 2: Crear el perfil del trabajador
-- ============================================================================
-- Reemplazar '<USER_ID>' con el UUID del usuario creado en el Paso 1.
-- Reemplazar '<TALLER_ID>' con el UUID del taller existente.
-- Reemplazar 'Nombre del Trabajador' con el nombre real del trabajador.

INSERT INTO public.perfiles (id, taller_id, nombre, rol)
VALUES (
  '<USER_ID>',                  -- ← UUID del usuario creado en Auth (Paso 1)
  '<TALLER_ID>',                -- ← UUID del taller existente
  'Nombre del Trabajador',      -- ← Cambiar por el nombre real del trabajador
  'trabajador'                  -- ← No cambiar: los usuarios adicionales son 'trabajador'
);

-- ✅ ¡Listo! El trabajador ha sido añadido al taller.
-- Ya puede iniciar sesión con el email y contraseña del Paso 1.

-- ⚠️  Si recibes el error "El taller ya tiene el máximo de 3 usuarios permitidos",
--     significa que el taller ya tiene 3 usuarios y no se pueden añadir más.


-- ============================================================================
-- VERIFICACIÓN (opcional)
-- ============================================================================
-- Ejecutar estas consultas para verificar que todo se creó correctamente:

-- Ver todos los usuarios del taller:
-- SELECT id, nombre, rol, created_at
-- FROM public.perfiles
-- WHERE taller_id = '<TALLER_ID>'
-- ORDER BY created_at;

-- Contar usuarios del taller:
-- SELECT COUNT(*) AS total_usuarios
-- FROM public.perfiles
-- WHERE taller_id = '<TALLER_ID>';
