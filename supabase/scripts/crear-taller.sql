-- ============================================================================
-- AutoAvisa MVP — Script: Crear Taller con Usuario Dueño
-- ============================================================================
--
-- DESCRIPCIÓN:
--   Este script crea un nuevo taller en AutoAvisa junto con su usuario dueño.
--   Debe ejecutarse en el SQL Editor del Dashboard de Supabase.
--
-- REQUISITOS PREVIOS:
--   1. Acceso al Dashboard de Supabase del proyecto
--   2. Permisos de administrador en el proyecto
--
-- PASOS:
--   1. Crear el usuario en Supabase Auth (desde el Dashboard)
--   2. Crear el registro del taller en la tabla `talleres`
--   3. Crear el perfil del dueño en la tabla `perfiles`
--
-- NOTAS IMPORTANTES:
--   - Cada taller puede tener un máximo de 3 usuarios (1 dueño + 2 trabajadores)
--   - El dueño es el primer usuario que se crea con el taller
--   - La matrícula de los vehículos es única por taller
--   - Todos los datos del taller quedan aislados por RLS (Row Level Security)
--
-- ============================================================================


-- ============================================================================
-- PASO 1: Crear el usuario en Supabase Auth
-- ============================================================================
-- Este paso se realiza MANUALMENTE desde el Dashboard de Supabase:
--
--   1. Ir a Authentication > Users en el Dashboard de Supabase
--   2. Hacer clic en "Add User" > "Create New User"
--   3. Introducir el email y contraseña del dueño del taller
--   4. Marcar "Auto Confirm User" para que el usuario pueda iniciar sesión inmediatamente
--   5. Hacer clic en "Create User"
--   6. Copiar el UUID del usuario creado (columna "User UID")
--
-- ⚠️  IMPORTANTE: Anotar el UUID del usuario. Se necesita en el Paso 3.
--


-- ============================================================================
-- PASO 2: Crear el registro del taller
-- ============================================================================
-- Reemplazar los valores de ejemplo con los datos reales del taller.
-- El campo `telefono_taller` es opcional pero recomendado.

INSERT INTO public.talleres (nombre, telefono_taller)
VALUES (
  'Taller Ejemplo S.L.',       -- ← Cambiar por el nombre real del taller
  '+34600000000'                -- ← Cambiar por el teléfono real del taller (o NULL si no tiene)
)
RETURNING id;

-- ⚠️  IMPORTANTE: Anotar el UUID retornado. Este es el TALLER_ID que se necesita en el Paso 3.
-- Ejemplo de resultado: id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'


-- ============================================================================
-- PASO 3: Crear el perfil del dueño
-- ============================================================================
-- Reemplazar '<USER_ID>' con el UUID del usuario creado en el Paso 1.
-- Reemplazar '<TALLER_ID>' con el UUID del taller creado en el Paso 2.
-- Reemplazar 'Nombre del Dueño' con el nombre real del dueño.

INSERT INTO public.perfiles (id, taller_id, nombre, rol)
VALUES (
  '<USER_ID>',                  -- ← UUID del usuario creado en Auth (Paso 1)
  '<TALLER_ID>',                -- ← UUID del taller creado arriba (Paso 2)
  'Nombre del Dueño',           -- ← Cambiar por el nombre real del dueño
  'dueño'                       -- ← No cambiar: el primer usuario siempre es 'dueño'
);

-- ✅ ¡Listo! El taller y su dueño han sido creados.
-- El dueño ya puede iniciar sesión con el email y contraseña del Paso 1.


-- ============================================================================
-- VERIFICACIÓN (opcional)
-- ============================================================================
-- Ejecutar estas consultas para verificar que todo se creó correctamente:

-- Ver el taller creado:
-- SELECT * FROM public.talleres WHERE nombre = 'Taller Ejemplo S.L.';

-- Ver el perfil del dueño:
-- SELECT * FROM public.perfiles WHERE taller_id = '<TALLER_ID>';
