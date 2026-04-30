'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generarMensaje } from '@/lib/whatsapp'
import type { TipoAviso } from '@/types/database'

/**
 * Resultado de una operación de servidor.
 */
interface ResultadoAccion {
    exito: boolean
    error?: string
    advertencia?: string
}

/**
 * Envía un aviso de mantenimiento por WhatsApp inmediatamente.
 * 1. Obtiene el aviso con datos de vehículo y taller
 * 2. POST a /api/send-whatsapp
 * 3. UPDATE estado a "enviado" + fecha_envio
 * 4. Si recurrencia_meses != null, crea el siguiente aviso
 * 5. revalidatePath('/dashboard')
 *
 * Requisito: 3.6
 */
export async function enviarAvisoAhora(avisoId: string): Promise<ResultadoAccion> {
    if (!avisoId) {
        return { exito: false, error: 'Aviso no especificado' }
    }

    const supabase = await createClient()

    // 1. Obtener aviso con datos de vehículo y taller
    const { data: aviso, error: errorAviso } = await supabase
        .from('avisos')
        .select(`
            id,
            tipo,
            estado,
            mensaje_personalizado,
            recurrencia_meses,
            aviso_origen_id,
            vehiculo_id,
            vehiculos (
                matricula,
                telefono_cliente,
                nombre_cliente,
                taller_id
            )
        `)
        .eq('id', avisoId)
        .single()

    if (errorAviso || !aviso) {
        return { exito: false, error: 'Aviso no encontrado' }
    }

    if (aviso.estado !== 'pendiente') {
        return { exito: false, error: 'Solo se pueden enviar avisos pendientes' }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vehiculo = aviso.vehiculos as any
    if (!vehiculo) {
        return { exito: false, error: 'Vehículo no encontrado para este aviso' }
    }

    // Obtener datos del taller
    const { data: taller, error: errorTaller } = await supabase
        .from('talleres')
        .select('nombre')
        .eq('id', vehiculo.taller_id)
        .single()

    if (errorTaller || !taller) {
        return { exito: false, error: 'Taller no encontrado' }
    }

    // 2. Generar mensaje y enviar WhatsApp
    const mensaje = aviso.mensaje_personalizado
        ?? generarMensaje(aviso.tipo as TipoAviso, vehiculo.matricula, taller.nombre)

    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

        const response = await fetch(`${baseUrl}/api/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telefono: vehiculo.telefono_cliente,
                nombre_cliente: vehiculo.nombre_cliente ?? 'Cliente',
                nombre_taller: taller.nombre,
                tipo_mantenimiento: aviso.tipo,
                mensaje,
                matricula: vehiculo.matricula,
            }),
        })

        if (!response.ok) {
            return { exito: false, error: 'Error al enviar el mensaje de WhatsApp' }
        }
    } catch {
        return { exito: false, error: 'Error de conexión al enviar WhatsApp' }
    }

    // 3. Actualizar estado a "enviado" con fecha_envio
    const { error: errorUpdate } = await supabase
        .from('avisos')
        .update({
            estado: 'enviado',
            fecha_envio: new Date().toISOString(),
        })
        .eq('id', avisoId)

    if (errorUpdate) {
        return { exito: false, error: 'WhatsApp enviado pero no se pudo actualizar el estado del aviso' }
    }

    // 4. Si tiene recurrencia, crear el siguiente aviso
    if (aviso.recurrencia_meses != null && aviso.recurrencia_meses > 0) {
        const fechaEnvio = new Date()
        const siguienteFecha = new Date(fechaEnvio)
        siguienteFecha.setMonth(siguienteFecha.getMonth() + aviso.recurrencia_meses)
        const siguienteFechaISO = siguienteFecha.toISOString().split('T')[0]

        const origenId = aviso.aviso_origen_id ?? aviso.id

        const { error: errorRecurrencia } = await supabase
            .from('avisos')
            .insert({
                vehiculo_id: aviso.vehiculo_id,
                tipo: aviso.tipo,
                fecha_programada: siguienteFechaISO,
                mensaje_personalizado: aviso.mensaje_personalizado,
                estado: 'pendiente',
                es_manual: false,
                recurrencia_meses: aviso.recurrencia_meses,
                aviso_origen_id: origenId,
            })

        if (errorRecurrencia) {
            console.error(`[ERROR] No se pudo crear siguiente aviso recurrente para ${avisoId}: ${errorRecurrencia.message}`)
        }
    }

    // 5. Revalidar dashboard
    revalidatePath('/dashboard')
    return { exito: true }
}

/**
 * Pospone un aviso 1 día desde hoy.
 * 1. Calcula nueva fecha = hoy + 1 día
 * 2. UPDATE fecha_programada
 * 3. revalidatePath('/dashboard')
 *
 * Requisito: 3.7
 */
export async function posponerAviso(avisoId: string): Promise<ResultadoAccion> {
    if (!avisoId) {
        return { exito: false, error: 'Aviso no especificado' }
    }

    const supabase = await createClient()

    // Verificar que el aviso existe y está pendiente
    const { data: aviso, error: errorAviso } = await supabase
        .from('avisos')
        .select('id, estado')
        .eq('id', avisoId)
        .single()

    if (errorAviso || !aviso) {
        return { exito: false, error: 'Aviso no encontrado' }
    }

    if (aviso.estado !== 'pendiente') {
        return { exito: false, error: 'Solo se pueden posponer avisos pendientes' }
    }

    // Calcular nueva fecha: hoy + 1 día
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const nuevaFecha = manana.toISOString().split('T')[0]

    const { error: errorUpdate } = await supabase
        .from('avisos')
        .update({ fecha_programada: nuevaFecha })
        .eq('id', avisoId)

    if (errorUpdate) {
        return { exito: false, error: 'Error al posponer el aviso. Inténtalo de nuevo.' }
    }

    revalidatePath('/dashboard')
    return { exito: true }
}

/**
 * Marca un aviso como hecho sin enviar WhatsApp.
 * 1. UPDATE estado a "enviado" + fecha_envio = now()
 * 2. Si recurrencia_meses != null, crea el siguiente aviso
 * 3. revalidatePath('/dashboard')
 *
 * Requisito: 3.8
 */
export async function marcarAvisoHecho(avisoId: string): Promise<ResultadoAccion> {
    if (!avisoId) {
        return { exito: false, error: 'Aviso no especificado' }
    }

    const supabase = await createClient()

    // Obtener aviso con datos necesarios para recurrencia
    const { data: aviso, error: errorAviso } = await supabase
        .from('avisos')
        .select('id, estado, tipo, vehiculo_id, mensaje_personalizado, recurrencia_meses, aviso_origen_id')
        .eq('id', avisoId)
        .single()

    if (errorAviso || !aviso) {
        return { exito: false, error: 'Aviso no encontrado' }
    }

    if (aviso.estado !== 'pendiente') {
        return { exito: false, error: 'Solo se pueden marcar como hecho avisos pendientes' }
    }

    // 1. Actualizar estado a "enviado" con fecha_envio
    const { error: errorUpdate } = await supabase
        .from('avisos')
        .update({
            estado: 'enviado',
            fecha_envio: new Date().toISOString(),
        })
        .eq('id', avisoId)

    if (errorUpdate) {
        return { exito: false, error: 'Error al marcar el aviso como hecho. Inténtalo de nuevo.' }
    }

    // 2. Si tiene recurrencia, crear el siguiente aviso
    if (aviso.recurrencia_meses != null && aviso.recurrencia_meses > 0) {
        const fechaEnvio = new Date()
        const siguienteFecha = new Date(fechaEnvio)
        siguienteFecha.setMonth(siguienteFecha.getMonth() + aviso.recurrencia_meses)
        const siguienteFechaISO = siguienteFecha.toISOString().split('T')[0]

        const origenId = aviso.aviso_origen_id ?? aviso.id

        const { error: errorRecurrencia } = await supabase
            .from('avisos')
            .insert({
                vehiculo_id: aviso.vehiculo_id,
                tipo: aviso.tipo,
                fecha_programada: siguienteFechaISO,
                mensaje_personalizado: aviso.mensaje_personalizado,
                estado: 'pendiente',
                es_manual: false,
                recurrencia_meses: aviso.recurrencia_meses,
                aviso_origen_id: origenId,
            })

        if (errorRecurrencia) {
            console.error(`[ERROR] No se pudo crear siguiente aviso recurrente para ${avisoId}: ${errorRecurrencia.message}`)
        }
    }

    // 3. Revalidar dashboard
    revalidatePath('/dashboard')
    return { exito: true }
}
