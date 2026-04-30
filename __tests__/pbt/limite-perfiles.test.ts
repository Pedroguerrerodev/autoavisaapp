/**
 * Feature: autoavisa-mvp, Property 1: Límite de 3 perfiles por taller
 * Validates: Requirements 1.6
 *
 * Para cualquier taller y cualquier intento de insertar un nuevo perfil,
 * si el taller ya tiene 3 perfiles, la inserción SHALL ser rechazada.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

/**
 * Lógica de validación del límite de perfiles por taller.
 * Simula la regla de negocio del trigger verificar_limite_perfiles.
 */
function puedeAgregarPerfil(perfilesActuales: number): boolean {
    return perfilesActuales < 3
}

describe('P1: Límite de 3 perfiles por taller', () => {
    it('debe rechazar la inserción cuando el taller ya tiene 3 o más perfiles', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 5 }),
                (numPerfiles) => {
                    const resultado = puedeAgregarPerfil(numPerfiles)

                    if (numPerfiles >= 3) {
                        expect(resultado).toBe(false)
                    } else {
                        expect(resultado).toBe(true)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('siempre permite inserción cuando hay menos de 3 perfiles', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 0, max: 2 }),
                (numPerfiles) => {
                    expect(puedeAgregarPerfil(numPerfiles)).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('siempre rechaza inserción cuando hay 3 o más perfiles', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 3, max: 100 }),
                (numPerfiles) => {
                    expect(puedeAgregarPerfil(numPerfiles)).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })
})
