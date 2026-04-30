/**
 * Feature: autoavisa-mvp, Property 12: Historial de avisos ordenado DESC
 * Validates: Requirements 9.1
 *
 * Para cualquier vehículo con múltiples avisos enviados, el historial SHALL mostrar
 * los avisos ordenados por fecha de envío de forma descendente (más recientes primero).
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

interface AvisoHistorial {
    id: string
    fecha_envio: string
}

/**
 * Ordena avisos del historial por fecha_envio descendente.
 */
function ordenarHistorialDesc(avisos: AvisoHistorial[]): AvisoHistorial[] {
    return [...avisos].sort(
        (a, b) => new Date(b.fecha_envio).getTime() - new Date(a.fecha_envio).getTime()
    )
}

/**
 * Verifica que un array de avisos está ordenado por fecha_envio descendente.
 */
function estaOrdenadoDesc(avisos: AvisoHistorial[]): boolean {
    for (let i = 1; i < avisos.length; i++) {
        if (new Date(avisos[i].fecha_envio).getTime() > new Date(avisos[i - 1].fecha_envio).getTime()) {
            return false
        }
    }
    return true
}

describe('P12: Historial de avisos ordenado DESC', () => {
    function diasATimestamp(dias: number): string {
        const base = new Date('2024-01-01T00:00:00Z')
        base.setUTCDate(base.getUTCDate() + dias)
        return base.toISOString()
    }

    const arbAviso = fc.record({
        id: fc.uuid(),
        fecha_envio: fc.integer({ min: 0, max: 2500 }).map(diasATimestamp),
    })

    it('el resultado de ordenar siempre está en orden descendente', () => {
        fc.assert(
            fc.property(
                fc.array(arbAviso, { minLength: 0, maxLength: 20 }),
                (avisos) => {
                    const ordenados = ordenarHistorialDesc(avisos)
                    expect(estaOrdenadoDesc(ordenados)).toBe(true)
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
                    const ordenados = ordenarHistorialDesc(avisos)
                    expect(ordenados.length).toBe(avisos.length)
                    const idsOriginales = avisos.map((a) => a.id).sort()
                    const idsOrdenados = ordenados.map((a) => a.id).sort()
                    expect(idsOrdenados).toEqual(idsOriginales)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('un array vacío se ordena como vacío', () => {
        const resultado = ordenarHistorialDesc([])
        expect(resultado).toEqual([])
        expect(estaOrdenadoDesc(resultado)).toBe(true)
    })
})
