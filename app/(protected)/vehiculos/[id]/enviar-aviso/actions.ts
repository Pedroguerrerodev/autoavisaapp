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
}

/** Tipos de aviso válidos */
const TIPOS_VALIDOS: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

/**
 * Envía un aviso manual por WhatsApp.
 * 1. Obtiene datos del vehículo y taller
 * 2. Llama a /api/send-whatsapp
 * 3. Crea registro de aviso con es_manual=true y estado='enviado'
 */
export async function enviarAvisoManual(formData: FormData): Promise<ResultadoAccion> {
    const vehiculo_id = formData.get('vehiculo_id')?.toString().trim() ?? ''
    const tipo = formData.get('tipo')?.toString().trim() ?? ''
    const mensaje_personalizado = formData.get('mensaje_personalizado')?.toString().trim() || null

    // Validaciones
    if (!vehiculo_id) {
        return { exito: false, error: 'Vehículo no especificado' }
    }

    if (!tipo || !TIPOS_VALIDOS.includes(tipo as TipoAviso)) {
        return { exito: false, error: 'Selecciona un tipo de mantenimiento' }
    }

    const supabase = await createClient()

    // Obtener datos del vehículo
    const { data: vehiculo, error: errorVehiculo } = await supabase
        .from('vehiculos')
        .select('id, matricula, telefono_cliente, nombre_cliente, taller_id')
        .eq('id', vehiculo_id)
        .single()

    if (errorVehiculo || !vehiculo) {
        return { exito: false, error: 'Vehículo no encontrado' }
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

    // Generar mensaje
    const tipoAviso = tipo as TipoAviso
    const mensaje = mensaje_personalizado
        ?? generarMensaje(tipoAviso, vehiculo.matricula, taller.nombre)

    // Llamar a la API de WhatsApp
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            ? new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').origin
            : 'http://localhost:3000'

        const response = await fetch(`${baseUrl}/api/send-whatsapp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telefono: vehiculo.telefono_cliente,
                nombre_cliente: vehiculo.nombre_cliente ?? 'Cliente',
                nombre_taller: taller.nombre,
                tipo_mantenimiento: tipoAviso,
                mensaje,
                matricula: vehiculo.matricula,
            }),
        })

        if (!response.ok) {
            return { exito: false, error: 'Error al enviar el aviso por WhatsApp' }
        }
    } catch {
        return { exito: false, error: 'Error de conexión con el servicio de WhatsApp' }
    }

    // Registrar aviso en la BD con es_manual=true y estado='enviado'
    // El trigger asignar_taller_aviso asigna taller_id automáticamente
    const hoy = new Date().toISOString().split('T')[0]

    const { error: errorAviso } = await supabase
        .from('avisos')
        .insert({
            vehiculo_id,
            tipo: tipoAviso,
            fecha_programada: hoy,
            mensaje_personalizado,
            estado: 'enviado',
            fecha_envio: new Date().toISOString(),
            es_manual: true,
        })

    if (errorAviso) {
        // El envío fue exitoso pero no se pudo registrar — informar al usuario
        return {
            exito: false,
            error: 'El aviso se envió pero no se pudo registrar en el historial',
        }
    }

    revalidatePath(`/vehiculos/${vehiculo_id}`)
    return { exito: true }
}
