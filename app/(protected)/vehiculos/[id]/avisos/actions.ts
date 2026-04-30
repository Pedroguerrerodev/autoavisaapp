'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TipoAviso, EstadoAviso } from '@/types/database'
import { validarRecurrenciaMeses, puedeEditarAviso } from '@/lib/validaciones'

/**
 * Resultado de una operación de servidor.
 */
interface ResultadoAccion {
    exito: boolean
    error?: string
    avisoId?: string
}

/** Tipos de aviso válidos */
const TIPOS_VALIDOS: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

/**
 * Crea un aviso nuevo para un vehículo.
 * El trigger asignar_taller_aviso se encarga de asignar taller_id automáticamente.
 */
export async function crearAviso(formData: FormData): Promise<ResultadoAccion> {
    const vehiculo_id = formData.get('vehiculo_id')?.toString().trim() ?? ''
    const tipo = formData.get('tipo')?.toString().trim() ?? ''
    const fecha_programada = formData.get('fecha_programada')?.toString().trim() ?? ''
    const mensaje_personalizado = formData.get('mensaje_personalizado')?.toString().trim() || null
    const recurrenciaRaw = formData.get('recurrencia_meses')?.toString().trim() ?? ''

    // Parsear recurrencia usando la función de validación pura
    const resultadoRecurrencia = validarRecurrenciaMeses(recurrenciaRaw)
    if (!resultadoRecurrencia.valido) {
        return { exito: false, error: 'La recurrencia debe ser un número entero entre 1 y 36 meses' }
    }
    const recurrencia_meses = resultadoRecurrencia.valor

    // Validaciones
    if (!vehiculo_id) {
        return { exito: false, error: 'Vehículo no especificado' }
    }

    if (!tipo || !TIPOS_VALIDOS.includes(tipo as TipoAviso)) {
        return { exito: false, error: 'Selecciona un tipo de mantenimiento' }
    }

    if (!fecha_programada) {
        return { exito: false, error: 'La fecha del aviso es obligatoria' }
    }

    // Validar que la fecha sea futura
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaAviso = new Date(fecha_programada + 'T00:00:00')
    if (fechaAviso <= hoy) {
        return { exito: false, error: 'La fecha del aviso debe ser futura' }
    }

    const supabase = await createClient()

    // Insertar aviso — el trigger asignar_taller_aviso asigna taller_id automáticamente
    const { data, error } = await supabase
        .from('avisos')
        .insert({
            vehiculo_id,
            tipo,
            fecha_programada,
            estado: 'pendiente',
            es_manual: false,
            recurrencia_meses,
        })
        .select('id')
        .single()

    if (error) {
        return { exito: false, error: 'Error al crear el aviso. Inténtalo de nuevo.' }
    }

    revalidatePath(`/vehiculos/${vehiculo_id}`)
    return { exito: true, avisoId: data.id }
}

/**
 * Edita un aviso existente en estado "pendiente".
 * Valida campos, verifica estado pendiente, y actualiza en Supabase.
 * RLS garantiza que solo se puede editar avisos del propio taller.
 */
export async function editarAviso(formData: FormData): Promise<ResultadoAccion> {
    const avisoId = formData.get('avisoId')?.toString().trim() ?? ''
    const vehiculo_id = formData.get('vehiculo_id')?.toString().trim() ?? ''
    const tipo = formData.get('tipo')?.toString().trim() ?? ''
    const fecha_programada = formData.get('fecha_programada')?.toString().trim() ?? ''
    const mensaje_personalizado = formData.get('mensaje_personalizado')?.toString().trim() || null
    const recurrenciaRaw = formData.get('recurrencia_meses')?.toString().trim() ?? ''

    // Validaciones básicas
    if (!avisoId) {
        return { exito: false, error: 'Aviso no especificado' }
    }

    if (!vehiculo_id) {
        return { exito: false, error: 'Vehículo no especificado' }
    }

    if (!tipo || !TIPOS_VALIDOS.includes(tipo as TipoAviso)) {
        return { exito: false, error: 'Selecciona un tipo de mantenimiento' }
    }

    if (!fecha_programada) {
        return { exito: false, error: 'La fecha del aviso es obligatoria' }
    }

    // Validar que la fecha sea >= hoy
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaAviso = new Date(fecha_programada + 'T00:00:00')
    if (fechaAviso < hoy) {
        return { exito: false, error: 'La fecha del aviso debe ser igual o posterior a hoy' }
    }

    // Validar recurrencia usando la función de validación pura
    const resultadoRecurrencia = validarRecurrenciaMeses(recurrenciaRaw)
    if (!resultadoRecurrencia.valido) {
        return { exito: false, error: 'La recurrencia debe ser un número entero entre 1 y 36 meses' }
    }
    const recurrencia_meses = resultadoRecurrencia.valor

    const supabase = await createClient()

    // Verificar que el aviso existe y está en estado "pendiente"
    const { data: avisoActual, error: errorConsulta } = await supabase
        .from('avisos')
        .select('estado')
        .eq('id', avisoId)
        .single()

    if (errorConsulta || !avisoActual) {
        return { exito: false, error: 'Aviso no encontrado' }
    }

    const resultadoEdicion = puedeEditarAviso(avisoActual.estado as EstadoAviso)
    if (!resultadoEdicion.permitido) {
        return { exito: false, error: resultadoEdicion.error }
    }

    // Actualizar el aviso
    const { error: errorUpdate } = await supabase
        .from('avisos')
        .update({
            tipo,
            fecha_programada,
            mensaje_personalizado,
            recurrencia_meses,
        })
        .eq('id', avisoId)

    if (errorUpdate) {
        return { exito: false, error: 'Error al actualizar el aviso. Inténtalo de nuevo.' }
    }

    revalidatePath(`/vehiculos/${vehiculo_id}`)
    return { exito: true, avisoId }
}

/**
 * Elimina un aviso por su ID.
 * RLS garantiza que solo se puede eliminar avisos del propio taller.
 */
export async function eliminarAviso(avisoId: string, vehiculoId: string): Promise<ResultadoAccion> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('avisos')
        .delete()
        .eq('id', avisoId)

    if (error) {
        return { exito: false, error: 'Error al eliminar el aviso. Inténtalo de nuevo.' }
    }

    revalidatePath(`/vehiculos/${vehiculoId}`)
    return { exito: true }
}
