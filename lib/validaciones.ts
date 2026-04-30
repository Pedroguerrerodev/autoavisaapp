/**
 * Funciones de validación puras reutilizables.
 * Separadas de los Server Actions para evitar restricciones de 'use server'.
 */

import type { EstadoAviso, EstadoTrabajo } from '@/types/database'

/**
 * Determines whether an aviso can be edited based on its current state.
 * Only avisos with estado "pendiente" can be edited.
 * "enviado" and "fallido" states are rejected.
 *
 * @param estado - The current state of the aviso
 * @returns { permitido: true } if editing is allowed, { permitido: false, error: string } if not
 */
export function puedeEditarAviso(estado: EstadoAviso): { permitido: true } | { permitido: false; error: string } {
    if (estado === 'pendiente') {
        return { permitido: true }
    }
    return { permitido: false, error: 'Solo se pueden editar avisos en estado pendiente' }
}

/**
 * Validates a recurrence interval value.
 * Accepts: null (no recurrence) or integers 1-36.
 * Rejects: negative, 0, >36, decimals, NaN.
 *
 * @param raw - The raw string value from the form (empty string means null/no recurrence)
 * @returns { valido: true, valor: number | null } if valid, { valido: false } if invalid
 */
export function validarRecurrenciaMeses(raw: string): { valido: true; valor: number | null } | { valido: false } {
    if (raw === '') {
        return { valido: true, valor: null }
    }
    const parsed = Number(raw)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 36) {
        return { valido: false }
    }
    return { valido: true, valor: parsed }
}


// ── Trabajo state machine (Properties 10, 11, 12) ──

/** Valid transitions in the trabajo state machine: en_curso→listo→entregado */
const TRANSICIONES_VALIDAS: Record<EstadoTrabajo, EstadoTrabajo | null> = {
    en_curso: 'listo',
    listo: 'entregado',
    entregado: null,
}

/**
 * Validates whether a state transition is allowed in the trabajo state machine.
 * Only en_curso→listo and listo→entregado are valid.
 *
 * @param estadoActual - Current state of the trabajo
 * @param estadoNuevo - Desired new state
 * @returns true if the transition is valid, false otherwise
 */
export function esTransicionTrabajoValida(estadoActual: EstadoTrabajo, estadoNuevo: EstadoTrabajo): boolean {
    return TRANSICIONES_VALIDAS[estadoActual] === estadoNuevo
}

/**
 * Result of attempting a trabajo state transition.
 */
interface ResultadoTransicionTrabajo {
    exito: boolean
    estado: EstadoTrabajo
    fecha_listo: string | null
    fecha_entregado: string | null
    error?: string
}

/**
 * Pure function that applies a state transition to a trabajo.
 * Mirrors the logic in trabajos/actions.ts (marcarTrabajoListo, marcarTrabajoEntregado).
 *
 * - en_curso → listo: sets fecha_listo
 * - listo → entregado: sets fecha_entregado
 * - Invalid transitions are rejected with an error
 *
 * @param estadoActual - Current state
 * @param estadoNuevo - Desired new state
 * @param timestamp - ISO timestamp to use for fecha_listo or fecha_entregado
 * @param fechaListoActual - Current fecha_listo value (for listo→entregado transitions)
 */
export function aplicarTransicionTrabajo(
    estadoActual: EstadoTrabajo,
    estadoNuevo: EstadoTrabajo,
    timestamp: string,
    fechaListoActual: string | null = null,
): ResultadoTransicionTrabajo {
    if (!esTransicionTrabajoValida(estadoActual, estadoNuevo)) {
        return {
            exito: false,
            estado: estadoActual,
            fecha_listo: fechaListoActual,
            fecha_entregado: null,
            error: `Transición inválida: ${estadoActual} → ${estadoNuevo}`,
        }
    }

    if (estadoNuevo === 'listo') {
        return {
            exito: true,
            estado: 'listo',
            fecha_listo: timestamp,
            fecha_entregado: null,
        }
    }

    // estadoNuevo === 'entregado'
    return {
        exito: true,
        estado: 'entregado',
        fecha_listo: fechaListoActual,
        fecha_entregado: timestamp,
    }
}

/**
 * Simulates the "marcar trabajo listo" action where WhatsApp may succeed or fail.
 * The key property: the trabajo state always changes to "listo" regardless of WhatsApp outcome.
 *
 * @param whatsappExito - Whether the WhatsApp send succeeded
 * @param timestamp - ISO timestamp for fecha_listo
 * @returns The trabajo state and an optional warning
 */
export function marcarListoConWhatsApp(
    whatsappExito: boolean,
    timestamp: string,
): { estado: EstadoTrabajo; fecha_listo: string; advertencia?: string } {
    // State always changes to "listo" regardless of WhatsApp result
    return {
        estado: 'listo',
        fecha_listo: timestamp,
        advertencia: whatsappExito
            ? undefined
            : 'Trabajo marcado como listo, pero no se pudo enviar el mensaje de WhatsApp',
    }
}

/**
 * Represents a completed trabajo for historial ordering.
 */
export interface TrabajoHistorial {
    id: string
    fecha_listo: string
}

/**
 * Sorts completed trabajos by fecha_listo in descending order (most recent first).
 * Mirrors the ORDER BY fecha_listo DESC used in the vehicle detail page query.
 */
export function ordenarTrabajosHistorialDesc(trabajos: TrabajoHistorial[]): TrabajoHistorial[] {
    return [...trabajos].sort(
        (a, b) => new Date(b.fecha_listo).getTime() - new Date(a.fecha_listo).getTime()
    )
}


// ── Vista del Día: classification, postpone, quick actions (Properties 6, 7, 8) ──

/**
 * Aviso with minimal fields needed for section classification.
 */
export interface AvisoParaClasificar {
    id: string
    estado: EstadoAviso
    fecha_programada: string // ISO date string (YYYY-MM-DD)
}

/**
 * Result of classifying avisos into the 3 Vista del Día sections.
 */
export interface ClasificacionAvisos {
    atrasados: AvisoParaClasificar[]
    hoy: AvisoParaClasificar[]
    proximos: AvisoParaClasificar[]
}

/**
 * Pure function that classifies avisos into the 3 Vista del Día sections.
 * Mirrors the classification logic in dashboard/page.tsx.
 *
 * Rules:
 * - Only "pendiente" avisos are classified
 * - fecha_programada < hoyISO → "atrasados"
 * - fecha_programada === hoyISO → "hoy"
 * - fecha_programada > hoyISO && <= en7DiasISO → "proximos"
 * - fecha_programada > en7DiasISO → not in any section
 * - Non-pendiente avisos → not in any section
 *
 * @param avisos - Array of avisos to classify
 * @param hoyISO - Today's date as ISO string (YYYY-MM-DD)
 * @param en7DiasISO - Date 7 days from today as ISO string (YYYY-MM-DD)
 */
export function clasificarAvisos(
    avisos: AvisoParaClasificar[],
    hoyISO: string,
    en7DiasISO: string,
): ClasificacionAvisos {
    const atrasados: AvisoParaClasificar[] = []
    const hoy: AvisoParaClasificar[] = []
    const proximos: AvisoParaClasificar[] = []

    for (const aviso of avisos) {
        // Only pendiente avisos are classified
        if (aviso.estado !== 'pendiente') {
            continue
        }

        if (aviso.fecha_programada < hoyISO) {
            atrasados.push(aviso)
        } else if (aviso.fecha_programada === hoyISO) {
            hoy.push(aviso)
        } else if (aviso.fecha_programada > hoyISO && aviso.fecha_programada <= en7DiasISO) {
            proximos.push(aviso)
        }
        // fecha_programada > en7DiasISO → not in any section
    }

    return { atrasados, hoy, proximos }
}

/**
 * Pure function that calculates the postponed date (today + 1 day).
 * Mirrors the logic in dashboard/actions.ts posponerAviso().
 *
 * @param hoyISO - Today's date as ISO string (YYYY-MM-DD)
 * @returns The date one day after hoyISO as ISO string (YYYY-MM-DD)
 */
export function calcularFechaPospuesta(hoyISO: string): string {
    const manana = new Date(hoyISO + 'T00:00:00Z')
    manana.setUTCDate(manana.getUTCDate() + 1)
    return manana.toISOString().split('T')[0]
}

/**
 * Result of a quick state action (enviar ahora / marcar como hecho).
 */
export interface ResultadoAccionRapida {
    nuevoEstado: 'enviado'
    fechaEnvio: string
    siguienteAviso: {
        estado: 'pendiente'
        fecha_programada: string
        recurrencia_meses: number
        aviso_origen_id: string
    } | null
}

/**
 * Pure function that simulates the state change and recurrence generation
 * for quick actions ("Enviar ahora" and "Marcar como hecho").
 * Mirrors the logic in dashboard/actions.ts enviarAvisoAhora() and marcarAvisoHecho().
 *
 * Both actions:
 * 1. Change estado to "enviado"
 * 2. Set fecha_envio to current timestamp
 * 3. If recurrencia_meses is set, generate the next aviso in the chain
 *
 * @param avisoId - ID of the aviso being acted upon
 * @param avisoOrigenId - The aviso_origen_id of the current aviso (null if it's the original)
 * @param recurrenciaMeses - Recurrence interval in months (null if no recurrence)
 * @param fechaEnvioISO - The send date as ISO date string (YYYY-MM-DD)
 */
export function aplicarAccionRapida(
    avisoId: string,
    avisoOrigenId: string | null,
    recurrenciaMeses: number | null,
    fechaEnvioISO: string,
): ResultadoAccionRapida {
    const resultado: ResultadoAccionRapida = {
        nuevoEstado: 'enviado',
        fechaEnvio: fechaEnvioISO,
        siguienteAviso: null,
    }

    // If recurrence is configured, generate the next aviso
    if (recurrenciaMeses != null && recurrenciaMeses > 0) {
        const fechaEnvio = new Date(fechaEnvioISO + 'T00:00:00Z')
        const siguienteFecha = new Date(fechaEnvio)
        siguienteFecha.setUTCMonth(siguienteFecha.getUTCMonth() + recurrenciaMeses)
        const siguienteFechaISO = siguienteFecha.toISOString().split('T')[0]

        const origenId = avisoOrigenId ?? avisoId

        resultado.siguienteAviso = {
            estado: 'pendiente',
            fecha_programada: siguienteFechaISO,
            recurrencia_meses: recurrenciaMeses,
            aviso_origen_id: origenId,
        }
    }

    return resultado
}
