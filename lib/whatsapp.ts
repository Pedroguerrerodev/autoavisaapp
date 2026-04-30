import type { TipoAviso } from '@/types/database'

/**
 * Mapa de emojis por tipo de mantenimiento.
 * Usado en la API WhatsApp y en las tarjetas de aviso del dashboard.
 */
export const EMOJI_POR_TIPO: Record<TipoAviso, string> = {
    itv: '🚗',
    aceite: '🛢️',
    filtros: '🔧',
    revision: '🛠️',
    neumaticos: '🔘',
    otro: '🔔',
}

/**
 * Etiquetas legibles en español para cada tipo de mantenimiento.
 */
export const ETIQUETA_TIPO: Record<TipoAviso, string> = {
    itv: 'ITV',
    aceite: 'Cambio de aceite',
    filtros: 'Filtros',
    revision: 'Revisión general',
    neumaticos: 'Neumáticos',
    otro: 'Otro',
}

/**
 * Valida que un teléfono tenga formato internacional: empieza con + seguido de dígitos.
 * Ejemplo válido: +34612345678
 */
export function validarTelefono(telefono: string): boolean {
    return /^\+\d+$/.test(telefono)
}

/**
 * Genera un mensaje de aviso en español con emoji según el tipo de mantenimiento.
 * Estructura modular para futura integración con Twilio.
 */
export function generarMensaje(
    tipo: TipoAviso,
    matricula: string,
    nombreTaller: string
): string {
    const emoji = EMOJI_POR_TIPO[tipo] ?? '🔔'
    const etiqueta = ETIQUETA_TIPO[tipo] ?? tipo

    return `${emoji} ¡Hola! Desde ${nombreTaller} te recordamos que tu vehículo con matrícula ${matricula} tiene programado: ${etiqueta}. ¡Te esperamos!`
}

/**
 * Campos obligatorios para la petición de envío de WhatsApp.
 */
export const CAMPOS_OBLIGATORIOS = [
    'telefono',
    'nombre_cliente',
    'nombre_taller',
    'tipo_mantenimiento',
    'mensaje',
    'matricula',
] as const

/**
 * Error personalizado para errores de la WhatsApp Cloud API.
 * Incluye el código HTTP y el código de error de WhatsApp para diagnóstico.
 */
export class WhatsAppApiError extends Error {
    constructor(
        message: string,
        public httpStatus: number,
        public whatsappCode?: number
    ) {
        super(message)
        this.name = 'WhatsAppApiError'
    }

    /** Indica si el error es un rate limit (HTTP 429 o código WhatsApp 130429) */
    get esRateLimit(): boolean {
        return this.httpStatus === 429 || this.whatsappCode === 130429
    }
}

/**
 * Envío de WhatsApp en modo dummy: registra el mensaje en consola.
 * Preserva el comportamiento original del MVP.
 */
async function enviarWhatsAppDummy(params: {
    telefono: string
    nombre_cliente: string
    nombre_taller: string
    tipo_mantenimiento: TipoAviso
    mensaje: string
    matricula: string
}): Promise<{ estado: 'enviado'; timestamp: string }> {
    const emoji = EMOJI_POR_TIPO[params.tipo_mantenimiento] ?? '🔔'

    console.log(
        `[WHATSAPP LOG] ${emoji} Taller: ${params.nombre_taller} | Para: ${params.nombre_cliente} (${params.telefono}) | Aviso: ${ETIQUETA_TIPO[params.tipo_mantenimiento] ?? params.tipo_mantenimiento} | Mensaje: ${params.mensaje}`
    )

    return {
        estado: 'enviado',
        timestamp: new Date().toISOString(),
    }
}

/**
 * Envío de WhatsApp en modo real: llama a la WhatsApp Cloud API de Meta.
 * Usa una plantilla pre-aprobada con 3 parámetros: nombre_taller, matrícula, etiqueta tipo.
 */
async function enviarWhatsAppReal(params: {
    telefono: string
    nombre_cliente: string
    nombre_taller: string
    tipo_mantenimiento: TipoAviso
    mensaje: string
    matricula: string
}): Promise<{ estado: 'enviado'; timestamp: string; whatsapp_message_id?: string }> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME ?? 'aviso_mantenimiento'

    if (!accessToken || !phoneNumberId) {
        throw new Error(
            'Variables WHATSAPP_ACCESS_TOKEN y WHATSAPP_PHONE_NUMBER_ID requeridas para modo real'
        )
    }

    // Formatear teléfono: quitar el "+" para la API de Meta
    const telefonoSinPlus = params.telefono.replace(/^\+/, '')

    const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: telefonoSinPlus,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: 'es' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: params.nombre_taller },
                                { type: 'text', text: params.matricula },
                                { type: 'text', text: ETIQUETA_TIPO[params.tipo_mantenimiento] ?? params.tipo_mantenimiento },
                            ],
                        },
                    ],
                },
            }),
        }
    )

    if (!response.ok) {
        const errorBody = await response.json()
        throw new WhatsAppApiError(
            errorBody.error?.message ?? 'Error desconocido de WhatsApp',
            response.status,
            errorBody.error?.code
        )
    }

    const data = await response.json()
    return {
        estado: 'enviado',
        timestamp: new Date().toISOString(),
        whatsapp_message_id: data.messages?.[0]?.id,
    }
}

/**
 * Función principal de envío de WhatsApp con modo dual.
 * Selecciona entre modo dummy (console.log) y modo real (WhatsApp Cloud API)
 * según la variable de entorno WHATSAPP_MODE.
 * Solo el valor exacto "real" activa la Cloud API; cualquier otro valor usa dummy.
 */
export async function enviarWhatsApp(params: {
    telefono: string
    nombre_cliente: string
    nombre_taller: string
    tipo_mantenimiento: TipoAviso
    mensaje: string
    matricula: string
}): Promise<{ estado: 'enviado'; timestamp: string; whatsapp_message_id?: string }> {
    const modo = process.env.WHATSAPP_MODE ?? 'dummy'

    if (modo === 'real') {
        return enviarWhatsAppReal(params)
    }

    return enviarWhatsAppDummy(params)
}
