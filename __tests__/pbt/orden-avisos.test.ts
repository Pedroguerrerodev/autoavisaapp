/**
 * Feature: autoavisa-mvp, Property 6: Avisos ordenados por fecha ASC
 * Validates: Requirements 4.4
 *
 * Para cualquier vehículo con múltiples avisos programados, al consultar
 * los avisos de ese vehículo, estos SHALL estar ordenados por fecha_programada
 * de forma ascendente.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

interface AvisoConFecha {
    id: string
    fecha_programada: string
}

/**
 * Ordena avisos por fecha_programada ascendente.
 */
function ordenarAvisosPorFechaAsc(avisos: AvisoConFecha[]): AvisoConFecha[] {
    return [...avisos].sort(
        (a, b) => new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime()
    )
}

/**
 * Verifica que un array de avisos está ordenado por fecha ascendente.
 */
function estaOrdenadoAsc(avisos: AvisoConFecha[]): boolean {
    for (let i = 1; i < avisos.length; i++) {
        if (new Date(avisos[i].fecha_programada).getTime() < new Date(avisos[i - 1].fecha_programada).getTime()) {
            return false
        }
    }
    return true
}

/**
 * Genera una fecha YYYY-MM-DD a partir de un entero de días desde 2024-01-01.
 */
function diasAFecha(dias: number): string {
    const base = new Date('2024-01-01T00:00:00Z')
    base.setUTCDate(base.getUTCDate() + dias)
    return base.toISOString().split('T')[0]
}

describe('P6: Avisos ordenados por fecha ASC', () => {
    const arbFecha = fc.integer({ min: 0, max: 2500 }).map(diasAFecha)

    const arbAviso = fc.record({
        id: fc.uuid(),
        fecha_programada: arbFecha,
    })

    it('el resultado de ordenar siempre está en orden ascendente', () => {
        fc.assert(
            fc.property(
                fc.array(arbAviso, { minLength: 0, maxLength: 20 }),
                (avisos) => {
                    const ordenados = ordenarAvisosPorFechaAsc(avisos)
                    expect(estaOrdenadoAsc(ordenados)).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el resultado contiene los mismos elementos que la entrada', () => {
        fc.assert(
            fc.property(
                fc.array(arbAviso, { minLength: 0, maxLength: 20 }),
                (avisos) => {
                    const ordenados = ordenarAvisosPorFechaAsc(avisos)
                    expect(ordenados.length).toBe(avisos.length)
                    const idsOriginales = avisos.map((a) => a.id).sort()
                    const idsOrdenados = ordenados.map((a) => a.id).sort()
                    expect(idsOrdenados).toEqual(idsOriginales)
                }
            ),
            { numRuns: 100 }
        )
    })
})
