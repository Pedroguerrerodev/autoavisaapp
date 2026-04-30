# Guía de Administración — Scripts SQL de AutoAvisa

## Introducción

AutoAvisa no tiene registro público. El administrador de AutoAvisa es quien crea las cuentas de los talleres manualmente tras confirmar el pago. Esta guía explica cómo usar los scripts SQL para gestionar talleres y usuarios.

## Requisitos Previos

- Acceso al **Dashboard de Supabase** del proyecto AutoAvisa
- Permisos de administrador en el proyecto
- Acceso a la sección **Authentication > Users** para crear usuarios
- Acceso al **SQL Editor** para ejecutar los scripts

## Estructura de Usuarios

Cada taller en AutoAvisa tiene la siguiente estructura:

| Rol | Cantidad máxima | Descripción |
|---|---|---|
| Dueño | 1 | Propietario del taller. Se crea junto con el taller |
| Trabajador | 2 | Empleados del taller. Se añaden después |

**Límite total: 3 usuarios por taller** (enforced automáticamente por la base de datos).

## Crear un Taller Nuevo

Para dar de alta un nuevo taller con su usuario dueño, sigue estos pasos:

### Paso 1: Crear el usuario en Supabase Auth

1. Abrir el Dashboard de Supabase
2. Ir a **Authentication > Users**
3. Hacer clic en **"Add User" > "Create New User"**
4. Rellenar los campos:
   - **Email**: el email del dueño del taller
   - **Password**: una contraseña segura
5. Marcar la casilla **"Auto Confirm User"**
6. Hacer clic en **"Create User"**
7. **Copiar el UUID** del usuario creado (columna "User UID")

> ⚠️ Anotar el UUID del usuario. Se necesita en el Paso 3.

### Paso 2: Crear el taller

1. Ir al **SQL Editor** en el Dashboard de Supabase
2. Abrir el archivo `supabase/scripts/crear-taller.sql`
3. Copiar y ejecutar **solo el bloque del Paso 2** del script
4. Reemplazar los valores de ejemplo:
   - `'Taller Ejemplo S.L.'` → nombre real del taller
   - `'+34600000000'` → teléfono real del taller (o `NULL`)
5. Ejecutar la consulta
6. **Anotar el UUID** retornado (este es el `TALLER_ID`)

Ejemplo:

```sql
INSERT INTO public.talleres (nombre, telefono_taller)
VALUES (
  'Talleres García e Hijos',
  '+34912345678'
)
RETURNING id;
```

### Paso 3: Crear el perfil del dueño

1. Copiar y ejecutar **solo el bloque del Paso 3** del script `crear-taller.sql`
2. Reemplazar los valores:
   - `'<USER_ID>'` → UUID del usuario del Paso 1
   - `'<TALLER_ID>'` → UUID del taller del Paso 2
   - `'Nombre del Dueño'` → nombre real del dueño
3. Ejecutar la consulta

Ejemplo:

```sql
INSERT INTO public.perfiles (id, taller_id, nombre, rol)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'f9e8d7c6-b5a4-3210-fedc-ba0987654321',
  'Antonio García López',
  'dueño'
);
```

> ✅ El taller y su dueño están creados. El dueño ya puede iniciar sesión.

## Añadir un Trabajador a un Taller Existente

Para añadir un trabajador a un taller que ya existe, sigue estos pasos:

### Verificación previa

Antes de añadir un trabajador, verificar que el taller tiene plazas disponibles:

```sql
SELECT COUNT(*) AS total_usuarios, 3 - COUNT(*) AS plazas_disponibles
FROM public.perfiles
WHERE taller_id = '<TALLER_ID>';
```

Si `plazas_disponibles` es `0`, no se pueden añadir más usuarios.

### Paso 1: Crear el usuario en Supabase Auth

Seguir el mismo proceso que en la creación de taller:

1. Ir a **Authentication > Users**
2. Hacer clic en **"Add User" > "Create New User"**
3. Introducir email y contraseña del trabajador
4. Marcar **"Auto Confirm User"**
5. Hacer clic en **"Create User"**
6. **Copiar el UUID** del usuario creado

### Paso 2: Crear el perfil del trabajador

1. Ir al **SQL Editor**
2. Abrir el archivo `supabase/scripts/añadir-trabajador.sql`
3. Copiar y ejecutar **solo el bloque del Paso 2** del script
4. Reemplazar los valores:
   - `'<USER_ID>'` → UUID del usuario creado
   - `'<TALLER_ID>'` → UUID del taller existente
   - `'Nombre del Trabajador'` → nombre real del trabajador
5. Ejecutar la consulta

Ejemplo:

```sql
INSERT INTO public.perfiles (id, taller_id, nombre, rol)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'f9e8d7c6-b5a4-3210-fedc-ba0987654321',
  'María López Ruiz',
  'trabajador'
);
```

> ✅ El trabajador ha sido añadido. Ya puede iniciar sesión.

## Consultas Útiles

### Ver todos los talleres

```sql
SELECT id, nombre, telefono_taller, created_at
FROM public.talleres
ORDER BY created_at DESC;
```

### Ver usuarios de un taller

```sql
SELECT p.id, p.nombre, p.rol, p.created_at
FROM public.perfiles p
WHERE p.taller_id = '<TALLER_ID>'
ORDER BY p.created_at;
```

### Contar usuarios por taller

```sql
SELECT t.nombre AS taller, COUNT(p.id) AS total_usuarios
FROM public.talleres t
LEFT JOIN public.perfiles p ON p.taller_id = t.id
GROUP BY t.id, t.nombre
ORDER BY t.nombre;
```

### Buscar un taller por nombre

```sql
SELECT id, nombre, telefono_taller
FROM public.talleres
WHERE nombre ILIKE '%nombre_parcial%';
```

## Resolución de Errores Comunes

### "El taller ya tiene el máximo de 3 usuarios permitidos"

**Causa:** El taller ya tiene 3 perfiles registrados (1 dueño + 2 trabajadores).

**Solución:** No se pueden añadir más usuarios. Si se necesita reemplazar un trabajador:

1. Identificar el perfil del trabajador a eliminar:
   ```sql
   SELECT id, nombre, rol
   FROM public.perfiles
   WHERE taller_id = '<TALLER_ID>' AND rol = 'trabajador';
   ```

2. Eliminar el perfil del trabajador:
   ```sql
   DELETE FROM public.perfiles WHERE id = '<USER_ID_TRABAJADOR>';
   ```

3. Opcionalmente, eliminar el usuario de Auth desde el Dashboard (Authentication > Users)

4. Crear el nuevo trabajador siguiendo los pasos de la sección anterior

### "violates foreign key constraint" en perfiles

**Causa:** El `USER_ID` proporcionado no existe en Supabase Auth, o el `TALLER_ID` no existe en la tabla `talleres`.

**Solución:**
- Verificar que el usuario fue creado correctamente en Authentication > Users
- Verificar que el UUID copiado es correcto (sin espacios extra)
- Verificar que el taller existe: `SELECT id FROM public.talleres WHERE id = '<TALLER_ID>';`

### "violates check constraint" en perfiles

**Causa:** El valor del campo `rol` no es válido. Solo se aceptan `'dueño'` o `'trabajador'`.

**Solución:** Asegurarse de escribir exactamente `'dueño'` (con tilde) o `'trabajador'`.

### El usuario no puede iniciar sesión

**Posibles causas y soluciones:**

1. **El usuario no fue confirmado:** Verificar en Authentication > Users que el usuario tiene estado "Confirmed". Si no, se puede confirmar manualmente.
2. **El perfil no fue creado:** Verificar que existe un registro en `perfiles` para ese usuario:
   ```sql
   SELECT * FROM public.perfiles WHERE id = '<USER_ID>';
   ```
3. **Email o contraseña incorrectos:** Verificar las credenciales. Se puede resetear la contraseña desde Authentication > Users.

### Los datos del taller no aparecen tras iniciar sesión

**Causa:** El perfil del usuario no está correctamente vinculado al taller, o las políticas RLS no encuentran el `taller_id`.

**Solución:**
1. Verificar que el perfil existe y tiene el `taller_id` correcto:
   ```sql
   SELECT id, taller_id, nombre, rol
   FROM public.perfiles
   WHERE id = '<USER_ID>';
   ```
2. Verificar que la función `get_mi_taller_id()` retorna el valor esperado (requiere estar autenticado como ese usuario).
