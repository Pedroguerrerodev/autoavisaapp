import {
    CAMPOS_OBLIGATORIOS,
    validarTelefono,
    enviarWhatsApp,
    WhatsAppApiError,
} from '@/lib/whatsapp'
import type { TipoAviso } from '@/types/database'

/**
 * API Route dummy para envío de WhatsApp.
 * Acepta POST con datos del aviso, valida campos, genera log en consola
 * y retorna estado 'enviado'. Preparada para futura integración con Twilio.
 */
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validar campos obligatorios
        const camposFaltantes = CAMPOS_OBLIGATORIOS.filter(
            (campo) => !body[campo] || String(body[campo]).trim() === ''
        )

        if (camposFaltantes.length > 0) {
            return Response.json(
                { error: `Faltan campos obligatorios: ${camposFaltantes.join(', ')}` },
                { status: 400 }
            )
        }

        // Validar formato de teléfono (+ seguido de dígitos)
        if (!validarTelefono(body.telefono)) {
            return Response.json(
                { error: 'Teléfono inválido' },
                { status: 400 }
            )
        }

        // Enviar mensaje (dummy: log en consola)
        const resultado = await enviarWhatsApp({
            telefono: body.telefono,
            nombre_cliente: body.nombre_cliente,
            nombre_taller: body.nombre_taller,
            tipo_mantenimiento: body.tipo_mantenimiento as TipoAviso,
            mensaje: body.mensaje,
            matricula: body.matricula,
        })

        return Response.json(resultado, { status: 200 })
    } catch (error) {
        if (error instanceof WhatsAppApiError) {
            console.error(`[ERROR WHATSAPP] HTTP ${error.httpStatus}: ${error.message}`)
            return Response.json(
                { error: 'Error de WhatsApp', detalle: error.message, codigo: error.whatsappCode },
                { status: 502 }
            )
        }
        return Response.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
