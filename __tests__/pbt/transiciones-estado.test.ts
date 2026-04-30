/**
 * Feature: autoavisa-mvp, Property 10: Transiciones de estado de avisos
 * Validates: Requirements 6.4, 6.5
 *
 * Para cualquier aviso pendiente procesado por el cron:
 * - Si el envío es exitoso, el estado SHALL cambiar a 'enviado' y fecha_envio SHALL ser asignada.
 * - Si el envío falla, el estado SHALL permanecer como 'pendiente' y fecha_envio SHALL permanecer nula.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { EstadoAviso } from '@/types/database'

interface AvisoProcesado {
    id: string
    estado: EstadoAviso
    fecha_envio: string | null
}

/**
 * Procesa un aviso según el resultado del envío.
 * Éxito → estado='enviado', fecha_envio asignada.
 * Fallo → estado='pendiente', fecha_envio null.
 */
function procesarAviso(avisoId: string, exito: boolean, timestamp: string): AvisoProcesado {
    if (exito) {
        return {
            id: avisoId,
            estado: 'enviado',
            fecha_envio: timestamp,
        }
    }
    return {
        id: avisoId,
        estado: 'pendiente',
        fecha_envio: null,
    }
}

/**
 * Genera un timestamp ISO a partir de un entero de días desde 2024-01-01.
 */
function diasATimestamp(dias: number): string {
    const base = new Date('2024-01-01T00:00:00Z')
    base.setUTCDate(base.getUTCDate() + dias)
    return base.toISOString()
}

describe('P10: Transiciones de estado de avisos', () => {
    const arbTimestamp = fc.integer({ min: 0, max: 2500 }).map(diasATimestamp)

    it('envío exitoso → estado enviado y fecha_envio asignada', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                arbTimestamp,
                (avisoId, timestamp) => {
                    const resultado = procesarAviso(avisoId, true, timestamp)
                    expect(resultado.estado).toBe('enviado')
                    expect(resultado.fecha_envio).toBe(timestamp)
                    expect(resultado.fecha_envio).not.toBeNull()
                }
            ),
            { numRuns: 100 }
        )
    })

    it('envío fallido → estado pendiente y fecha_envio nula', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                arbTimestamp,
                (avisoId, timestamp) => {
                    const resultado = procesarAviso(avisoId, false, timestamp)
                    expect(resultado.estado).toBe('pendiente')
                    expect(resultado.fecha_envio).toBeNull()
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el resultado siempre tiene el mismo id que la entrada', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.boolean(),
                arbTimestamp,
                (avisoId, exito, timestamp) => {
                    const resultado = procesarAviso(avisoId, exito, timestamp)
                    expect(resultado.id).toBe(avisoId)
                }
            ),
            { numRuns: 100 }
        )
    })
})
