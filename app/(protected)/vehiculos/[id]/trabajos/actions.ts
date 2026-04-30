'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Resultado de una operación de servidor.
 */
interface ResultadoAccion {
    exito: boolean
    error?: string
    advertencia?: string
    trabajoId?: string
}

/**
 * Crea un trabajo nuevo para un vehículo con estado "en_curso".
 * El trigger asignar_taller_trabajo se encarga de asignar taller_id automáticamente.
 *
 * Requisitos: 8.2, 8.3
 */
export async function crearTrabajo(formData: FormData): Promise<ResultadoAccion> {
    const vehiculo_id = formData.get('vehiculo_id')?.toString().trim() ?? ''
    const descripcion = formData.get('descripcion')?.toString().trim() ?? ''

    // Validaciones
    if (!vehiculo_id) {
        return { exito: false, error: 'Vehículo no especificado' }
    }

    if (!descripcion) {
        return { exito: false, error: 'La descripción del trabajo es obligatoria' }
    }

    const supabase = await createClient()

    // Insertar trabajo — el trigger asignar_taller_trabajo asigna taller_id automáticamente
    const { data, error } = await supabase
        .from('trabajos')
        .insert({
            vehiculo_id,
            descripcion,
            estado: 'en_curso',
        })
        .select('id')
        .single()

    if (error) {
        return { exito: false, error: 'Error al crear el trabajo. Inténtalo de nuevo.' }
    }

    revalidatePath(`/vehiculos/${vehiculo_id}`)
    return { exito: true, trabajoId: data.id }
}

/**
 * Marca un trabajo como "listo", registra fecha_listo, y envía WhatsApp al cliente.
 * Si el envío de WhatsApp falla, el trabajo sigue como "listo" pero se retorna advertencia.
 *
 * Requisitos: 8.5, 8.6, 8.7
 */
export async function marcarTrabajoListo(trabajoId: string, vehiculoId: string): Promise<ResultadoAccion> {
    if (!trabajoId) {
        return { exito: false, error: 'Trabajo no especificado' }
    }

    if (!vehiculoId) {
        return { exito: false, error: 'Vehículo no especificado' }
    }

    const supabase = await createClient()

    // Obtener datos del trabajo
    const { data: trabajo, error: errorTrabajo } = await supabase
        .from('trabajos')
        .select('id, descripcion, estado, vehiculo_id')
        .eq('id', trabajoId)
        .single()

    if (errorTrabajo || !trabajo) {
        return { exito: false, error: 'Trabajo no encontrado' }
    }

    if (trabajo.estado !== 'en_curso') {
        return { exito: false, error: 'Solo se pueden marcar como listo los trabajos en curso' }
    }

    // Actualizar estado a "listo" con fecha_listo
    const { error: errorUpdate } = await supabase
        .from('trabajos')
        .update({
            estado: 'listo',
            fecha_listo: new Date().toISOString(),
        })
        .eq('id', trabajoId)

    if (errorUpdate) {
        return { exito: false, error: 'Error al actualizar el trabajo. Inténtalo de nuevo.' }
    }

    // Obtener datos del vehículo para el mensaje WhatsApp
    const { data: vehiculo, error: errorVehiculo } = await supabase
        .from('vehiculos')
        .select('id, matricula, telefono_cliente, nombre_cliente, taller_id')
        .eq('id', vehiculoId)
        .single()

    if (errorVehiculo || !vehiculo) {
        revalidatePath(`/vehiculos/${vehiculoId}`)
        return {
            exito: true,
            advertencia: 'Trabajo marcado como listo, pero no se pudo obtener datos del vehículo para enviar WhatsApp',
            trabajoId,
        }
    }

    // Obtener datos del taller
    const { data: taller, error: errorTaller } = await supabase
        .from('talleres')
        .select('nombre')
        .eq('id', vehiculo.taller_id)
        .single()

    if (errorTaller || !taller) {
        revalidatePath(`/vehiculos/${vehiculoId}`)
        return {
            exito: true,
            advertencia: 'Trabajo marcado como listo, pero no se pudo obtener datos del taller para enviar WhatsApp',
            trabajoId,
        }
    }

    // Generar mensaje de "trabajo listo"
    const mensaje = `🔧 ¡Hola! Desde ${taller.nombre} te informamos que tu vehículo con matrícula ${vehiculo.matricula} está listo para recoger. Trabajo: ${trabajo.descripcion}. ¡Te esperamos!`

    // Enviar WhatsApp
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

        const response = await fetch(`${baseUrl}/api/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telefono: vehiculo.telefono_cliente,
                nombre_cliente: vehiculo.nombre_cliente ?? 'Cliente',
                nombre_taller: taller.nombre,
                tipo_mantenimiento: 'revision' as const,
                mensaje,
                matricula: vehiculo.matricula,
            }),
        })

        if (!response.ok) {
            revalidatePath(`/vehiculos/${vehiculoId}`)
            return {
                exito: true,
                advertencia: 'Trabajo marcado como listo, pero no se pudo enviar el mensaje de WhatsApp',
                trabajoId,
            }
        }
    } catch {
        revalidatePath(`/vehiculos/${vehiculoId}`)
        return {
            exito: true,
            advertencia: 'Trabajo marcado como listo, pero hubo un error de conexión al enviar WhatsApp',
            trabajoId,
        }
    }

    revalidatePath(`/vehiculos/${vehiculoId}`)
    return { exito: true, trabajoId }
}

/**
 * Marca un trabajo como "entregado" y registra fecha_entregado.
 *
 * Requisito: 8.9
 */
export async function marcarTrabajoEntregado(trabajoId: string, vehiculoId: string): Promise<ResultadoAccion> {
    if (!trabajoId) {
        return { exito: false, error: 'Trabajo no especificado' }
    }

    if (!vehiculoId) {
        return { exito: false, error: 'Vehículo no especificado' }
    }

    const supabase = await createClient()

    // Verificar que el trabajo está en estado "listo"
    const { data: trabajo, error: errorTrabajo } = await supabase
        .from('trabajos')
        .select('id, estado')
        .eq('id', trabajoId)
        .single()

    if (errorTrabajo || !trabajo) {
        return { exito: false, error: 'Trabajo no encontrado' }
    }

    if (trabajo.estado !== 'listo') {
        return { exito: false, error: 'Solo se pueden marcar como entregado los trabajos con estado listo' }
    }

    // Actualizar estado a "entregado" con fecha_entregado
    const { error: errorUpdate } = await supabase
        .from('trabajos')
        .update({
            estado: 'entregado',
            fecha_entregado: new Date().toISOString(),
        })
        .eq('id', trabajoId)

    if (errorUpdate) {
        return { exito: false, error: 'Error al actualizar el trabajo. Inténtalo de nuevo.' }
    }

    revalidatePath(`/vehiculos/${vehiculoId}`)
    return { exito: true, trabajoId }
}
