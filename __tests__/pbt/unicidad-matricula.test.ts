/**
 * Feature: autoavisa-mvp, Property 3: Unicidad de matrícula por taller
 * Validates: Requirements 3.3
 *
 * Para cualquier taller y cualquier matrícula ya registrada en ese taller,
 * un intento de insertar otro vehículo con la misma matrícula en el mismo taller
 * SHALL ser rechazado. Sin embargo, la misma matrícula en un taller diferente
 * SHALL ser aceptada.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

interface Vehiculo {
    matricula: string
    taller_id: string
}

/**
 * Verifica unicidad de matrícula dentro de un taller usando un Set.
 * Retorna true si la matrícula es única en el taller, false si es duplicada.
 */
function esMatriculaUnicaEnTaller(
    vehiculosExistentes: Vehiculo[],
    nuevaMatricula: string,
    tallerId: string
): boolean {
    const matriculasTaller = new Set(
        vehiculosExistentes
            .filter((v) => v.taller_id === tallerId)
            .map((v) => v.matricula)
    )
    return !matriculasTaller.has(nuevaMatricula)
}

describe('P3: Unicidad de matrícula por taller', () => {
    const arbMatricula = fc.stringMatching(/^[A-Z0-9]{1,10}$/)
    const arbTallerId = fc.uuid()

    it('rechaza matrícula duplicada en el mismo taller', () => {
        fc.assert(
            fc.property(
                arbMatricula,
                arbTallerId,
                (matricula, tallerId) => {
                    const existentes: Vehiculo[] = [{ matricula, taller_id: tallerId }]
                    expect(esMatriculaUnicaEnTaller(existentes, matricula, tallerId)).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('acepta la misma matrícula en un taller diferente', () => {
        fc.assert(
            fc.property(
                arbMatricula,
                arbTallerId,
                arbTallerId,
                (matricula, tallerId1, tallerId2) => {
                    fc.pre(tallerId1 !== tallerId2)
                    const existentes: Vehiculo[] = [{ matricula, taller_id: tallerId1 }]
                    expect(esMatriculaUnicaEnTaller(existentes, matricula, tallerId2)).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('acepta matrícula nueva en un taller con otros vehículos', () => {
        fc.assert(
            fc.property(
                arbMatricula,
                arbMatricula,
                arbTallerId,
                (matriculaExistente, matriculaNueva, tallerId) => {
                    fc.pre(matriculaExistente !== matriculaNueva)
                    const existentes: Vehiculo[] = [{ matricula: matriculaExistente, taller_id: tallerId }]
                    expect(esMatriculaUnicaEnTaller(existentes, matriculaNueva, tallerId)).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })
})
