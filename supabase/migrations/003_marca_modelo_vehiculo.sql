-- Añadir marca y modelo obligatorios a la tabla vehiculos
ALTER TABLE public.vehiculos ADD COLUMN marca TEXT NOT NULL DEFAULT '';
ALTER TABLE public.vehiculos ADD COLUMN modelo TEXT NOT NULL DEFAULT '';
ALTER TABLE public.vehiculos ALTER COLUMN marca DROP DEFAULT;
ALTER TABLE public.vehiculos ALTER COLUMN modelo DROP DEFAULT;
