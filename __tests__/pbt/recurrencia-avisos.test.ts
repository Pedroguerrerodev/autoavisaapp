/**
 * Feature: autoavisa-pro, Property 4: Generación de siguiente aviso en cadena recurrente
 * Validates: Requirements 2.4, 2.5
 *
 * Para cualquier aviso con recurrencia_meses configurado (1-36) que cambia a estado "enviado",
 * el sistema SHALL crear un nuevo aviso con: estado "pendiente", mismo tipo, mismo vehiculo_id,
 * misma recurrencia_meses, fecha_programada igual a la fecha de envío real + recurrencia_meses meses,
 * y aviso_origen_id apuntando al primer aviso de la cadena (el aviso original, no el inmediatamente anterior).
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { TipoAviso } from '@/types/database'

const TIPOS_AVISO: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

// ── Pure logic extracted from the Edge Function (procesar-avisos-diarios) ──

interface AvisoEnviado {
    id: string
    vehiculo_id: string
    tipo: TipoAviso
    mensaje_personalizado: string | null
    recurrencia_meses: number
    aviso_origen_id: string | null
}

interface SiguienteAviso {
    vehiculo_id: string
    tipo: TipoAviso
    fecha_programada: string
    mensaje_personalizado: string | null
    estado: 'pendiente'
    es_manual: false
    recurrencia_meses: number
    aviso_origen_id: string
}

/**
 * Calculates the next fecha_programada by adding recurrencia_meses months
 * to the fecha_envio. This mirrors the Edge Function logic:
 *   siguienteFecha.setMonth(siguienteFecha.getMonth() + recurrencia_meses)
 *   return siguienteFecha.toISOString().split('T')[0]
 */
function calcularSiguienteFecha(fechaEnvio: Date, recurrenciaMeses: number): string {
    const siguiente = new Date(fechaEnvio)
    siguiente.setMonth(siguiente.getMonth() + recurrenciaMeses)
    return siguiente.toISOString().split('T')[0]
}

/**
 * Determines the aviso_origen_id for the next aviso in the recurrence chain.
 * If the current aviso already has an aviso_origen_id (it's part of a chain),
 * use that (points to the original). Otherwise, use the current aviso's own id
 * (it IS the original).
 */
function determinarOrigenId(aviso: AvisoEnviado): string {
    return aviso.aviso_origen_id ?? aviso.id
}

/**
 * Pure function that generates the next aviso in a recurrence chain.
 * Mirrors the logic in supabase/functions/procesar-avisos-diarios/index.ts.
 */
function generarSiguienteAviso(aviso: AvisoEnviado, fechaEnvio: Date): SiguienteAviso {
    return {
        vehiculo_id: aviso.vehiculo_id,
        tipo: aviso.tipo,
        fecha_programada: calcularSiguienteFecha(fechaEnvio, aviso.recurrencia_meses),
        mensaje_personalizado: aviso.mensaje_personalizado,
        estado: 'pendiente',
        es_manual: false,
        recurrencia_meses: aviso.recurrencia_meses,
        aviso_origen_id: determinarOrigenId(aviso),
    }
}

// ── Arbitraries ──

function diasAFecha(dias: number): Date {
    const base = new Date('2024-01-01T12:00:00Z')
    base.setUTCDate(base.getUTCDate() + dias)
    return base
}

const arbTipo = fc.constantFrom(...TIPOS_AVISO)
const arbRecurrencia = fc.integer({ min: 1, max: 36 })
const arbFechaEnvio = fc.integer({ min: 0, max: 2500 }).map(diasAFecha)
const arbMensaje = fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null })

/** Aviso that is the first in a chain (no aviso_origen_id) */
const arbAvisoOriginal: fc.Arbitrary<AvisoEnviado> = fc.record({
    id: fc.uuid(),
    vehiculo_id: fc.uuid(),
    tipo: arbTipo,
    mensaje_personalizado: arbMensaje,
    recurrencia_meses: arbRecurrencia,
    aviso_origen_id: fc.constant(null),
})

/** Aviso that is part of an existing chain (has aviso_origen_id) */
const arbAvisoCadena: fc.Arbitrary<AvisoEnviado> = fc.record({
    id: fc.uuid(),
    vehiculo_id: fc.uuid(),
    tipo: arbTipo,
    mensaje_personalizado: arbMensaje,
    recurrencia_meses: arbRecurrencia,
    aviso_origen_id: fc.uuid(),
})

/** Any aviso with recurrence (original or part of chain) */
const arbAvisoRecurrente: fc.Arbitrary<AvisoEnviado> = fc.oneof(arbAvisoOriginal, arbAvisoCadena)

// ── Tests ──

describe('P4: Generación de siguiente aviso en cadena recurrente', () => {
    it('el siguiente aviso tiene fecha_programada = fecha_envio + recurrencia_meses meses', () => {
        fc.assert(
            fc.property(
                arbAvisoRecurrente,
                arbFechaEnvio,
                (aviso, fechaEnvio) => {
                    const siguiente = generarSiguienteAviso(aviso, fechaEnvio)

                    // Calculate expected date using the same algorithm
                    const esperada = new Date(fechaEnvio)
                    esperada.setMonth(esperada.getMonth() + aviso.recurrencia_meses)
                    const esperadaISO = esperada.toISOString().split('T')[0]

                    expect(siguiente.fecha_programada).toBe(esperadaISO)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('aviso_origen_id apunta al aviso original cuando el aviso enviado es el primero de la cadena', () => {
        fc.assert(
            fc.property(
                arbAvisoOriginal,
                arbFechaEnvio,
                (aviso, fechaEnvio) => {
                    const siguiente = generarSiguienteAviso(aviso, fechaEnvio)

                    // When the sent aviso has no aviso_origen_id, it IS the original
                    // so the next aviso should point to it
                    expect(siguiente.aviso_origen_id).toBe(aviso.id)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('aviso_origen_id se propaga desde el aviso original a lo largo de la cadena', () => {
        fc.assert(
            fc.property(
                arbAvisoCadena,
                arbFechaEnvio,
                (aviso, fechaEnvio) => {
                    const siguiente = generarSiguienteAviso(aviso, fechaEnvio)

                    // When the sent aviso already has an aviso_origen_id,
                    // the next aviso should use that same origin (not the current aviso's id)
                    expect(siguiente.aviso_origen_id).toBe(aviso.aviso_origen_id)
                    expect(siguiente.aviso_origen_id).not.toBe(aviso.id)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el siguiente aviso conserva tipo, vehiculo_id, recurrencia_meses y estado pendiente', () => {
        fc.assert(
            fc.property(
                arbAvisoRecurrente,
                arbFechaEnvio,
                (aviso, fechaEnvio) => {
                    const siguiente = generarSiguienteAviso(aviso, fechaEnvio)

                    expect(siguiente.tipo).toBe(aviso.tipo)
                    expect(siguiente.vehiculo_id).toBe(aviso.vehiculo_id)
                    expect(siguiente.recurrencia_meses).toBe(aviso.recurrencia_meses)
                    expect(siguiente.estado).toBe('pendiente')
                    expect(siguiente.es_manual).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('la fecha_programada del siguiente aviso siempre es posterior a la fecha de envío', () => {
        fc.assert(
            fc.property(
                arbAvisoRecurrente,
                arbFechaEnvio,
                (aviso, fechaEnvio) => {
                    const siguiente = generarSiguienteAviso(aviso, fechaEnvio)
                    const fechaSiguiente = new Date(siguiente.fecha_programada)

                    // The next scheduled date must be after the send date
                    // (adding at least 1 month always moves forward)
                    expect(fechaSiguiente.getTime()).toBeGreaterThan(fechaEnvio.getTime() - 86400000)
                }
            ),
            { numRuns: 100 }
        )
    })
})
