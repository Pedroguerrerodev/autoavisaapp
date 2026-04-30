/**
 * Feature: autoavisa-pro, Property 9: Restricción de edición a avisos pendientes
 * Validates: Requirements 5.5
 *
 * Para cualquier aviso con estado distinto de "pendiente" (es decir, "enviado" o "fallido"),
 * un intento de edición SHALL ser rechazado con un error, sin modificar el registro.
 * Solo avisos con estado "pendiente" permiten edición.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { EstadoAviso } from '@/types/database'
import { puedeEditarAviso } from '@/lib/validaciones'

/** All valid aviso states */
const TODOS_LOS_ESTADOS: EstadoAviso[] = ['pendiente', 'enviado', 'fallido']

/** States that should NOT allow editing */
const ESTADOS_NO_EDITABLES: EstadoAviso[] = ['enviado', 'fallido']

/** Arbitrary that generates a random EstadoAviso */
const arbEstadoAviso: fc.Arbitrary<EstadoAviso> = fc.constantFrom(...TODOS_LOS_ESTADOS)

/** Arbitrary that generates only non-editable states */
const arbEstadoNoEditable: fc.Arbitrary<EstadoAviso> = fc.constantFrom(...ESTADOS_NO_EDITABLES)

describe('P9: Restricción de edición a avisos pendientes', () => {
    it('avisos con estado "pendiente" siempre permiten edición', () => {
        fc.assert(
            fc.property(
                fc.constant('pendiente' as EstadoAviso),
                (estado) => {
                    const resultado = puedeEditarAviso(estado)
                    expect(resultado.permitido).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('avisos con estado "enviado" o "fallido" siempre rechazan edición', () => {
        fc.assert(
            fc.property(
                arbEstadoNoEditable,
                (estado) => {
                    const resultado = puedeEditarAviso(estado)
                    expect(resultado.permitido).toBe(false)
                    if (!resultado.permitido) {
                        expect(resultado.error).toBe('Solo se pueden editar avisos en estado pendiente')
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('para cualquier estado aleatorio, solo "pendiente" permite edición', () => {
        fc.assert(
            fc.property(
                arbEstadoAviso,
                (estado) => {
                    const resultado = puedeEditarAviso(estado)
                    if (estado === 'pendiente') {
                        expect(resultado.permitido).toBe(true)
                    } else {
                        expect(resultado.permitido).toBe(false)
                        if (!resultado.permitido) {
                            expect(resultado.error).toContain('pendiente')
                        }
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('estados no editables siempre retornan un mensaje de error descriptivo', () => {
        fc.assert(
            fc.property(
                arbEstadoNoEditable,
                (estado) => {
                    const resultado = puedeEditarAviso(estado)
                    expect(resultado.permitido).toBe(false)
                    if (!resultado.permitido) {
                        expect(typeof resultado.error).toBe('string')
                        expect(resultado.error.length).toBeGreaterThan(0)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })
})
