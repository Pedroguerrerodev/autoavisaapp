/**
 * Feature: autoavisa-mvp, Property 7: Filtrado de vehículos por matrícula
 * Validates: Requirements 5.2
 *
 * Para cualquier conjunto de vehículos de un taller y cualquier cadena de búsqueda,
 * los resultados filtrados SHALL contener únicamente vehículos cuya matrícula contenga
 * la cadena de búsqueda (case-insensitive), y SHALL incluir todos los vehículos que coincidan.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

interface VehiculoSimple {
    id: string
    matricula: string
}

/**
 * Filtra vehículos por matrícula de forma case-insensitive.
 */
function filtrarPorMatricula(vehiculos: VehiculoSimple[], query: string): VehiculoSimple[] {
    if (!query) return vehiculos
    const queryLower = query.toLowerCase()
    return vehiculos.filter((v) => v.matricula.toLowerCase().includes(queryLower))
}

describe('P7: Filtrado de vehículos por matrícula', () => {
    const arbVehiculo = fc.record({
        id: fc.uuid(),
        matricula: fc.stringMatching(/^[A-Z0-9]{1,10}$/),
    })

    it('todos los resultados contienen la cadena de búsqueda (case-insensitive)', () => {
        fc.assert(
            fc.property(
                fc.array(arbVehiculo, { minLength: 0, maxLength: 20 }),
                fc.stringMatching(/^[A-Za-z0-9]{0,5}$/),
                (vehiculos, query) => {
                    const resultados = filtrarPorMatricula(vehiculos, query)
                    if (query) {
                        resultados.forEach((v) => {
                            expect(v.matricula.toLowerCase()).toContain(query.toLowerCase())
                        })
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('incluye todos los vehículos que coinciden', () => {
        fc.assert(
            fc.property(
                fc.array(arbVehiculo, { minLength: 0, maxLength: 20 }),
                fc.stringMatching(/^[A-Za-z0-9]{0,5}$/),
                (vehiculos, query) => {
                    const resultados = filtrarPorMatricula(vehiculos, query)
                    const esperados = vehiculos.filter((v) =>
                        !query || v.matricula.toLowerCase().includes(query.toLowerCase())
                    )
                    expect(resultados.length).toBe(esperados.length)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('no incluye vehículos que no coinciden', () => {
        fc.assert(
            fc.property(
                fc.array(arbVehiculo, { minLength: 0, maxLength: 20 }),
                fc.stringMatching(/^[A-Za-z0-9]{1,5}$/),
                (vehiculos, query) => {
                    const resultados = filtrarPorMatricula(vehiculos, query)
                    const noCoinciden = vehiculos.filter(
                        (v) => !v.matricula.toLowerCase().includes(query.toLowerCase())
                    )
                    noCoinciden.forEach((v) => {
                        expect(resultados.find((r) => r.id === v.id)).toBeUndefined()
                    })
                }
            ),
            { numRuns: 100 }
        )
    })
})
