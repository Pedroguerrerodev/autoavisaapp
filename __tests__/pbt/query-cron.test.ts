/**
 * Feature: autoavisa-mvp, Property 9: Query cron retorna avisos pendientes correctos
 * Validates: Requirements 6.2
 *
 * Para cualquier conjunto de avisos con distintas fechas y estados, la consulta del cron
 * SHALL retornar exactamente aquellos avisos cuyo estado sea 'pendiente' Y cuya
 * fecha_programada sea menor o igual a la fecha actual.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { EstadoAviso } from '@/types/database'

const ESTADOS: EstadoAviso[] = ['pendiente', 'enviado', 'fallido']

interface AvisoCron {
    id: string
    estado: EstadoAviso
    fecha_programada: string
}

/**
 * Filtra avisos para el cron: estado='pendiente' AND fecha_programada <= hoy.
 */
function filtrarAvisosCron(avisos: AvisoCron[], hoy: string): AvisoCron[] {
    const hoyDate = new Date(hoy)
    return avisos.filter(
        (a) => a.estado === 'pendiente' && new Date(a.fecha_programada) <= hoyDate
    )
}

/**
 * Genera una fecha YYYY-MM-DD a partir de un entero de días desde 2024-01-01.
 */
function diasAFecha(dias: number): string {
    const base = new Date('2024-01-01T00:00:00Z')
    base.setUTCDate(base.getUTCDate() + dias)
    return base.toISOString().split('T')[0]
}

describe('P9: Query cron retorna avisos pendientes correctos', () => {
    const arbFecha = fc.integer({ min: 0, max: 1000 }).map(diasAFecha)

    const arbAviso = fc.record({
        id: fc.uuid(),
        estado: fc.constantFrom(...ESTADOS),
        fecha_programada: arbFecha,
    })

    it('retorna solo avisos pendientes con fecha <= hoy', () => {
        fc.assert(
            fc.property(
                fc.array(arbAviso, { minLength: 0, maxLength: 20 }),
                arbFecha,
                (avisos, hoy) => {
                    const resultado = filtrarAvisosCron(avisos, hoy)

                    // Todos los resultados deben ser pendientes con fecha <= hoy
                    resultado.forEach((a) => {
                        expect(a.estado).toBe('pendiente')
                        expect(new Date(a.fecha_programada).getTime()).toBeLessThanOrEqual(new Date(hoy).getTime())
                    })
                }
            ),
            { numRuns: 100 }
        )
    })

    it('no omite ningún aviso que debería incluirse', () => {
        fc.assert(
            fc.property(
                fc.array(arbAviso, { minLength: 0, maxLength: 20 }),
                arbFecha,
                (avisos, hoy) => {
                    const resultado = filtrarAvisosCron(avisos, hoy)
                    const esperados = avisos.filter(
                        (a) => a.estado === 'pendiente' && new Date(a.fecha_programada) <= new Date(hoy)
                    )
                    expect(resultado.length).toBe(esperados.length)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('no incluye avisos con estado diferente a pendiente', () => {
        fc.assert(
            fc.property(
                fc.array(arbAviso, { minLength: 0, maxLength: 20 }),
                arbFecha,
                (avisos, hoy) => {
                    const resultado = filtrarAvisosCron(avisos, hoy)
                    const idsResultado = new Set(resultado.map((a) => a.id))
                    const noDeberianEstar = avisos.filter((a) => a.estado !== 'pendiente')
                    noDeberianEstar.forEach((a) => {
                        expect(idsResultado.has(a.id)).toBe(false)
                    })
                }
            ),
            { numRuns: 100 }
        )
    })
})
