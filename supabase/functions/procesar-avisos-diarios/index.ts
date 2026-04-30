/**
 * Edge Function: procesar-avisos-diarios
 *
 * Se ejecuta diariamente vía pg_cron + pg_net.
 * Consulta todos los avisos pendientes cuya fecha_programada <= hoy (Europe/Madrid),
 * invoca /api/send-whatsapp para cada uno y actualiza el estado a 'enviado'.
 *
 * Usa service_role key para bypass de RLS y acceder a avisos de TODOS los talleres.
 */

import { createClient } from "jsr:@supabase/supabase-js@2"

/** Mapa de emojis por tipo de mantenimiento (replicado aquí para el entorno Deno) */
const EMOJI_POR_TIPO: Record<string, string> = {
    itv: '🚗',
    aceite: '🛢️',
    filtros: '🔧',
    revision: '🛠️',
    neumaticos: '🔘',
    otro: '🔔',
}

/** Etiquetas legibles en español para cada tipo de mantenimiento */
const ETIQUETA_TIPO: Record<string, string> = {
    itv: 'ITV',
    aceite: 'Cambio de aceite',
    filtros: 'Filtros',
    revision: 'Revisión general',
    neumaticos: 'Neumáticos',
    otro: 'Otro',
}

/**
 * Genera un mensaje de aviso en español con emoji según el tipo de mantenimiento.
 */
function generarMensaje(tipo: string, matricula: string, nombreTaller: string): string {
    const emoji = EMOJI_POR_TIPO[tipo] ?? '🔔'
    const etiqueta = ETIQUETA_TIPO[tipo] ?? tipo
    return `${emoji} ¡Hola! Desde ${nombreTaller} te recordamos que tu vehículo con matrícula ${matricula} tiene programado: ${etiqueta}. ¡Te esperamos!`
}

Deno.serve(async (_req: Request) => {
    // Contadores para el resumen de procesamiento
    let total = 0
    let exitosos = 0
    let fallidos = 0

    try {
        // --- 11.1: Crear cliente Supabase con service_role (bypass RLS) ---
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !serviceRoleKey) {
            console.error('[ERROR] Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configuradas')
            return new Response(
                JSON.stringify({ error: 'Variables de entorno no configuradas' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey)

        // --- 11.2: Consultar avisos pendientes con fecha <= hoy (Europe/Madrid) ---
        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' })
        console.log(`[INFO] Procesando avisos pendientes para fecha <= ${hoy} (Europe/Madrid)`)

        const { data: avisos, error: errorConsulta } = await supabase
            .from('avisos')
            .select(`
        id,
        vehiculo_id,
        taller_id,
        tipo,
        fecha_programada,
        mensaje_personalizado,
        recurrencia_meses,
        aviso_origen_id,
        vehiculos (
          matricula,
          telefono_cliente,
          nombre_cliente
        ),
        talleres:taller_id (
          nombre
        )
      `)
            .eq('estado', 'pendiente')
            .lte('fecha_programada', hoy)

        if (errorConsulta) {
            console.error('[ERROR] No se pudo consultar avisos pendientes:', errorConsulta.message)
            return new Response(
                JSON.stringify({ error: 'Error al consultar avisos pendientes', detalle: errorConsulta.message }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        }

        // Si no hay avisos pendientes, retornar éxito temprano
        if (!avisos || avisos.length === 0) {
            console.log('[INFO] No hay avisos pendientes para procesar')
            return new Response(
                JSON.stringify({ mensaje: 'No hay avisos pendientes', total: 0, exitosos: 0, fallidos: 0 }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
        }

        total = avisos.length
        console.log(`[INFO] Se encontraron ${total} avisos pendientes para procesar`)

        // --- 11.3: Bucle de procesamiento ---
        // Determinar la URL base para llamar a /api/send-whatsapp
        const siteUrl = Deno.env.get('SITE_URL') ?? supabaseUrl

        for (const aviso of avisos) {
            try {
                // Extraer datos del vehículo y taller desde el join
                // deno-lint-ignore no-explicit-any
                const vehiculo = aviso.vehiculos as any
                // deno-lint-ignore no-explicit-any
                const taller = aviso.talleres as any

                if (!vehiculo || !taller) {
                    console.error(`[ERROR] Datos incompletos para aviso ${aviso.id}: vehículo o taller no encontrado`)
                    fallidos++
                    continue
                }

                const matricula: string = vehiculo.matricula
                const telefonoCliente: string = vehiculo.telefono_cliente
                const nombreCliente: string = vehiculo.nombre_cliente ?? 'Cliente'
                const nombreTaller: string = taller.nombre

                // Generar mensaje (usar personalizado si existe, sino generar automático)
                const mensaje = aviso.mensaje_personalizado
                    ?? generarMensaje(aviso.tipo, matricula, nombreTaller)

                // POST a /api/send-whatsapp
                const response = await fetch(`${siteUrl}/api/send-whatsapp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        telefono: telefonoCliente,
                        nombre_cliente: nombreCliente,
                        nombre_taller: nombreTaller,
                        tipo_mantenimiento: aviso.tipo,
                        mensaje,
                        matricula,
                    }),
                })

                if (!response.ok) {
                    const errorBody = await response.text()
                    console.error(`[ERROR] Fallo al enviar aviso ${aviso.id}: HTTP ${response.status} - ${errorBody}`)
                    fallidos++
                    continue
                }

                // Envío exitoso: actualizar estado a 'enviado' con fecha_envio
                const { error: errorUpdate } = await supabase
                    .from('avisos')
                    .update({
                        estado: 'enviado',
                        fecha_envio: new Date().toISOString(),
                    })
                    .eq('id', aviso.id)

                if (errorUpdate) {
                    console.error(`[ERROR] Aviso ${aviso.id} enviado pero no se pudo actualizar en BD: ${errorUpdate.message}`)
                    fallidos++
                    continue
                }

                // --- Recurrencia: crear siguiente aviso si tiene recurrencia configurada ---
                if (aviso.recurrencia_meses != null && aviso.recurrencia_meses > 0) {
                    const fechaEnvio = new Date()
                    const siguienteFecha = new Date(fechaEnvio)
                    siguienteFecha.setMonth(siguienteFecha.getMonth() + aviso.recurrencia_meses)
                    const siguienteFechaISO = siguienteFecha.toISOString().split('T')[0]

                    // Determinar aviso_origen_id: si este aviso ya tiene uno, usar ese; si no, usar su propio id
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
                        console.error(`[ERROR] No se pudo crear siguiente aviso recurrente para ${aviso.id}: ${errorRecurrencia.message}`)
                    } else {
                        console.log(`[OK] Creado siguiente aviso recurrente para ${aviso.id} → ${siguienteFechaISO}`)
                    }
                }

                exitosos++
                console.log(`[OK] Aviso ${aviso.id} enviado correctamente (${aviso.tipo} → ${matricula})`)
            } catch (errorAviso) {
                // Error inesperado procesando un aviso individual — continuar con el siguiente
                console.error(`[ERROR] Fallo al procesar aviso ${aviso.id}:`, errorAviso)
                fallidos++
            }
        }

        // --- 11.4: Respuesta con resumen de procesamiento ---
        const resumen = { total, exitosos, fallidos }
        console.log(`[INFO] Procesamiento completado: ${JSON.stringify(resumen)}`)

        return new Response(
            JSON.stringify(resumen),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        // Error general no capturado
        console.error('[ERROR] Error fatal en procesar-avisos-diarios:', error)
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor', total, exitosos, fallidos }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
})
