-- ============================================================================
-- AutoAvisa Pro — Migración Incremental
-- ============================================================================
-- Este archivo contiene los cambios incrementales sobre el esquema del MVP:
--   1. Nuevas columnas en tabla avisos (recurrencia)
--   2. Nueva tabla trabajos
--   3. Índices para búsquedas eficientes
--   4. Políticas RLS para trabajos
--   5. Triggers para trabajos (updated_at, asignar taller)
-- ============================================================================


-- ============================================================================
-- SECCIÓN 1: NUEVAS COLUMNAS EN TABLA AVISOS (RECURRENCIA)
-- ============================================================================

-- Columna para intervalo de recurrencia en meses (null = aviso de una sola vez)
ALTER TABLE public.avisos
  ADD COLUMN recurrencia_meses INTEGER;

-- Columna para rastrear la cadena de recurrencia (referencia al aviso original)
ALTER TABLE public.avisos
  ADD COLUMN aviso_origen_id UUID REFERENCES public.avisos(id) ON DELETE SET NULL;

-- Constraint: recurrencia entre 1 y 36 meses (o null)
ALTER TABLE public.avisos
  ADD CONSTRAINT chk_recurrencia_meses
  CHECK (recurrencia_meses IS NULL OR (recurrencia_meses >= 1 AND recurrencia_meses <= 36));

-- Índice parcial para consultas de cadenas de recurrencia
CREATE INDEX idx_avisos_origen ON public.avisos(aviso_origen_id)
  WHERE aviso_origen_id IS NOT NULL;


-- ============================================================================
-- SECCIÓN 2: NUEVA TABLA TRABAJOS
-- ============================================================================

-- Tabla de trabajos/reparaciones en curso
-- Cada trabajo está asociado a un vehículo y un taller (multi-tenant)
CREATE TABLE public.trabajos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  taller_id UUID NOT NULL REFERENCES public.talleres(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'en_curso'
    CHECK (estado IN ('en_curso', 'listo', 'entregado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_listo TIMESTAMPTZ,
  fecha_entregado TIMESTAMPTZ
);

-- Habilitar RLS para aislamiento de datos entre talleres
ALTER TABLE public.trabajos ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- SECCIÓN 3: ÍNDICES
-- ============================================================================

-- Índice para búsquedas de trabajos por vehículo
CREATE INDEX idx_trabajos_vehiculo_id ON public.trabajos(vehiculo_id);

-- Índice para búsquedas de trabajos por taller
CREATE INDEX idx_trabajos_taller_id ON public.trabajos(taller_id);

-- Índice parcial para trabajos en curso (usado en Vista del Día)
CREATE INDEX idx_trabajos_estado ON public.trabajos(taller_id, estado)
  WHERE estado = 'en_curso';


-- ============================================================================
-- SECCIÓN 4: POLÍTICAS RLS PARA TRABAJOS
-- ============================================================================

-- SELECT: solo trabajos de su taller
CREATE POLICY "Usuarios ven trabajos de su taller"
  ON public.trabajos FOR SELECT
  USING (taller_id = public.get_mi_taller_id());

-- INSERT: solo pueden insertar trabajos en su taller
CREATE POLICY "Usuarios crean trabajos en su taller"
  ON public.trabajos FOR INSERT
  WITH CHECK (taller_id = public.get_mi_taller_id());

-- UPDATE: solo pueden actualizar trabajos de su taller
CREATE POLICY "Usuarios actualizan trabajos de su taller"
  ON public.trabajos FOR UPDATE
  USING (taller_id = public.get_mi_taller_id())
  WITH CHECK (taller_id = public.get_mi_taller_id());

-- DELETE: solo pueden eliminar trabajos de su taller
CREATE POLICY "Usuarios eliminan trabajos de su taller"
  ON public.trabajos FOR DELETE
  USING (taller_id = public.get_mi_taller_id());


-- ============================================================================
-- SECCIÓN 5: TRIGGERS PARA TRABAJOS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5a. Trigger: Actualizar updated_at automáticamente
-- ---------------------------------------------------------------------------

-- Reutiliza la función genérica public.actualizar_updated_at() creada en 001
CREATE TRIGGER trigger_trabajos_updated_at
  BEFORE UPDATE ON public.trabajos
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_updated_at();


-- ---------------------------------------------------------------------------
-- 5b. Trigger: Asignar taller_id automáticamente en trabajos
-- ---------------------------------------------------------------------------

-- Al insertar un trabajo, copiar el taller_id del vehículo asociado
-- Mismo patrón que asignar_taller_aviso en 001
-- SECURITY DEFINER: se ejecuta con permisos del creador (puede leer vehiculos sin RLS)
-- SET search_path = '': previene ataques de search_path hijacking
CREATE OR REPLACE FUNCTION public.asignar_taller_trabajo()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $
BEGIN
  SELECT taller_id INTO NEW.taller_id
  FROM public.vehiculos
  WHERE id = NEW.vehiculo_id;

  IF NEW.taller_id IS NULL THEN
    RAISE EXCEPTION 'Vehículo no encontrado';
  END IF;

  RETURN NEW;
END;
$;

CREATE TRIGGER trigger_asignar_taller_trabajo
  BEFORE INSERT ON public.trabajos
  FOR EACH ROW
  EXECUTE FUNCTION public.asignar_taller_trabajo();
