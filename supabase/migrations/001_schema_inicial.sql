-- ============================================================================
-- AutoAvisa MVP — Migración Inicial del Esquema de Base de Datos
-- ============================================================================
-- Este archivo contiene la estructura completa de la base de datos:
--   1. Extensiones (pg_cron, pg_net)
--   2. Tablas principales (talleres, perfiles, vehiculos, avisos)
--   3. Índices para búsquedas eficientes
--   4. Función auxiliar get_mi_taller_id()
--   5. Políticas RLS para aislamiento multi-tenant
--   6. Triggers (límite perfiles, updated_at, asignar taller aviso)
--   7. Configuración de cron (Vault + programación)
-- ============================================================================


-- ============================================================================
-- SECCIÓN 1: EXTENSIONES
-- ============================================================================

-- pg_cron: permite programar tareas periódicas dentro de PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net: permite realizar peticiones HTTP desde PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


-- ============================================================================
-- SECCIÓN 2: TABLAS PRINCIPALES
-- ============================================================================

-- Tabla principal de talleres (tenants)
-- Cada taller es un tenant aislado en el sistema multi-tenant
CREATE TABLE public.talleres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  telefono_taller TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS para aislamiento de datos entre talleres
ALTER TABLE public.talleres ENABLE ROW LEVEL SECURITY;


-- Perfiles de usuarios asociados a un taller
-- Máximo 3 por taller (enforced por trigger verificar_limite_perfiles)
CREATE TABLE public.perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('dueño', 'trabajador')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS para aislamiento de datos entre talleres
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;


-- Vehículos registrados por cada taller
CREATE TABLE public.vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  matricula TEXT NOT NULL,
  telefono_cliente TEXT NOT NULL,
  nombre_cliente TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Matrícula única por taller (un mismo taller no puede tener dos vehículos con la misma matrícula)
  CONSTRAINT uq_vehiculo_matricula_taller UNIQUE (taller_id, matricula)
);

-- Habilitar RLS para aislamiento de datos entre talleres
ALTER TABLE public.vehiculos ENABLE ROW LEVEL SECURITY;


-- Avisos de mantenimiento programados
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro')),
  fecha_programada DATE NOT NULL,
  mensaje_personalizado TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'fallido')),
  fecha_envio TIMESTAMPTZ,
  es_manual BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS para aislamiento de datos entre talleres
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- SECCIÓN 3: ÍNDICES
-- ============================================================================

-- Índice para búsquedas de perfiles por taller
CREATE INDEX idx_perfiles_taller_id ON public.perfiles(taller_id);

-- Índices para búsquedas eficientes de vehículos
CREATE INDEX idx_vehiculos_taller_id ON public.vehiculos(taller_id);
CREATE INDEX idx_vehiculos_matricula ON public.vehiculos(taller_id, matricula);

-- Índices para búsquedas eficientes de avisos
CREATE INDEX idx_avisos_taller_id ON public.avisos(taller_id);
CREATE INDEX idx_avisos_vehiculo_id ON public.avisos(vehiculo_id);
-- Índice parcial para el cron: buscar avisos pendientes por fecha de forma eficiente
CREATE INDEX idx_avisos_pendientes ON public.avisos(fecha_programada, estado)
  WHERE estado = 'pendiente';
-- Índice para ordenar avisos por fecha en la ficha del vehículo
CREATE INDEX idx_avisos_vehiculo_fecha ON public.avisos(vehiculo_id, fecha_programada);


-- ============================================================================
-- SECCIÓN 4: FUNCIÓN AUXILIAR get_mi_taller_id()
-- ============================================================================

-- Función helper para obtener el taller_id del usuario autenticado
-- Usada en todas las políticas RLS para filtrar datos por tenant
-- SECURITY DEFINER: se ejecuta con permisos del creador (puede leer perfiles)
-- STABLE: no modifica datos, resultado consistente dentro de la misma transacción
-- SET search_path = '': previene ataques de search_path hijacking
CREATE OR REPLACE FUNCTION public.get_mi_taller_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT taller_id
  FROM public.perfiles
  WHERE id = (SELECT auth.uid())
$$;


-- ============================================================================
-- SECCIÓN 5: POLÍTICAS RLS
-- ============================================================================

-- --- Tabla talleres ---
-- Los usuarios solo pueden ver su propio taller
CREATE POLICY "Usuarios ven su propio taller"
  ON public.talleres FOR SELECT
  USING (id = public.get_mi_taller_id());


-- --- Tabla perfiles ---
-- Los usuarios solo pueden ver perfiles de su taller
CREATE POLICY "Usuarios ven perfiles de su taller"
  ON public.perfiles FOR SELECT
  USING (taller_id = public.get_mi_taller_id());


-- --- Tabla vehiculos ---
-- SELECT: solo vehículos de su taller
CREATE POLICY "Usuarios ven vehículos de su taller"
  ON public.vehiculos FOR SELECT
  USING (taller_id = public.get_mi_taller_id());

-- INSERT: solo pueden insertar en su taller
CREATE POLICY "Usuarios crean vehículos en su taller"
  ON public.vehiculos FOR INSERT
  WITH CHECK (taller_id = public.get_mi_taller_id());

-- UPDATE: solo pueden actualizar vehículos de su taller
CREATE POLICY "Usuarios actualizan vehículos de su taller"
  ON public.vehiculos FOR UPDATE
  USING (taller_id = public.get_mi_taller_id())
  WITH CHECK (taller_id = public.get_mi_taller_id());

-- DELETE: solo pueden eliminar vehículos de su taller
CREATE POLICY "Usuarios eliminan vehículos de su taller"
  ON public.vehiculos FOR DELETE
  USING (taller_id = public.get_mi_taller_id());


-- --- Tabla avisos ---
-- SELECT: solo avisos de su taller
CREATE POLICY "Usuarios ven avisos de su taller"
  ON public.avisos FOR SELECT
  USING (taller_id = public.get_mi_taller_id());

-- INSERT: solo pueden insertar avisos en su taller
-- Nota: el trigger asignar_taller_aviso rellena taller_id antes de que RLS lo evalúe
CREATE POLICY "Usuarios crean avisos en su taller"
  ON public.avisos FOR INSERT
  WITH CHECK (taller_id = public.get_mi_taller_id());

-- UPDATE: solo pueden actualizar avisos de su taller
CREATE POLICY "Usuarios actualizan avisos de su taller"
  ON public.avisos FOR UPDATE
  USING (taller_id = public.get_mi_taller_id())
  WITH CHECK (taller_id = public.get_mi_taller_id());

-- DELETE: solo pueden eliminar avisos de su taller
CREATE POLICY "Usuarios eliminan avisos de su taller"
  ON public.avisos FOR DELETE
  USING (taller_id = public.get_mi_taller_id());


-- ============================================================================
-- SECCIÓN 6: TRIGGERS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 6a. Trigger: Límite de 3 perfiles por taller
-- ---------------------------------------------------------------------------

-- Función que verifica el límite de 3 perfiles por taller
-- Rechaza la inserción si el taller ya tiene 3 usuarios (1 dueño + 2 trabajadores)
-- SECURITY DEFINER: se ejecuta con permisos del creador (puede contar perfiles sin RLS)
CREATE OR REPLACE FUNCTION public.verificar_limite_perfiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  conteo INTEGER;
BEGIN
  SELECT COUNT(*) INTO conteo
  FROM public.perfiles
  WHERE taller_id = NEW.taller_id;

  IF conteo >= 3 THEN
    RAISE EXCEPTION 'El taller ya tiene el máximo de 3 usuarios permitidos';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_limite_perfiles
  BEFORE INSERT ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.verificar_limite_perfiles();


-- ---------------------------------------------------------------------------
-- 6b. Trigger: Actualizar updated_at automáticamente
-- ---------------------------------------------------------------------------

-- Función genérica para actualizar el campo updated_at en cualquier tabla
-- Se aplica a vehiculos y avisos para mantener registro de última modificación
CREATE OR REPLACE FUNCTION public.actualizar_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para vehiculos: actualiza updated_at en cada UPDATE
CREATE TRIGGER trigger_vehiculos_updated_at
  BEFORE UPDATE ON public.vehiculos
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();

-- Trigger para avisos: actualiza updated_at en cada UPDATE
CREATE TRIGGER trigger_avisos_updated_at
  BEFORE UPDATE ON public.avisos
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();


-- ---------------------------------------------------------------------------
-- 6c. Trigger: Asignar taller_id automáticamente en avisos
-- ---------------------------------------------------------------------------

-- Al insertar un aviso, copiar el taller_id del vehículo asociado
-- SECURITY DEFINER: se ejecuta con permisos del creador (puede leer vehiculos sin RLS)
-- SET search_path = '': previene ataques de search_path hijacking
--
-- ORDEN DE EJECUCIÓN EN POSTGRESQL:
--   1. El trigger BEFORE INSERT (trigger_asignar_taller_aviso) se dispara primero
--      y asigna taller_id copiándolo del vehículo asociado.
--   2. Luego PostgreSQL evalúa la política RLS WITH CHECK
--      (taller_id = public.get_mi_taller_id()) sobre la fila ya modificada.
--   Esto es seguro porque cuando RLS verifica la fila, taller_id ya tiene
--   el valor correcto asignado por el trigger. El usuario no necesita enviar
--   taller_id en el INSERT — el trigger lo rellena automáticamente y RLS
--   lo valida después.
CREATE OR REPLACE FUNCTION public.asignar_taller_aviso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  SELECT taller_id INTO NEW.taller_id
  FROM public.vehiculos
  WHERE id = NEW.vehiculo_id;

  IF NEW.taller_id IS NULL THEN
    RAISE EXCEPTION 'Vehículo no encontrado';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_asignar_taller_aviso
  BEFORE INSERT ON public.avisos
  FOR EACH ROW
  EXECUTE FUNCTION public.asignar_taller_aviso();


-- ============================================================================
-- SECCIÓN 7: CONFIGURACIÓN DE CRON (VAULT + PROGRAMACIÓN)
-- ============================================================================

-- Almacenar secretos en Vault de Supabase
-- Estos valores deben ser reemplazados con los datos reales del proyecto
-- project_url: URL base del proyecto Supabase
-- service_role_key: clave con permisos completos para bypass de RLS
SELECT vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
SELECT vault.create_secret('<SUPABASE_SERVICE_ROLE_KEY>', 'service_role_key');

-- Programar el cron diario a las 06:00 UTC
-- 06:00 UTC = 08:00 CEST (horario de verano) / 07:00 CET (horario de invierno)
-- Se acepta la variación de 1 hora como compromiso razonable para el MVP
-- El cron invoca la Edge Function procesar-avisos-diarios vía pg_net
-- usando la service_role_key almacenada en Vault para autenticación
SELECT cron.schedule(
  'procesar-avisos-diarios',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
           || '/functions/v1/procesar-avisos-diarios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := jsonb_build_object('triggered_at', now()::text)
  ) AS request_id;
  $$
);
