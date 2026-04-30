/**
 * Feature: autoavisa-pro, Property 5: Validación de intervalo de recurrencia
 * Validates: Requirements 2.9
 *
 * Para cualquier valor numérico, la validación de recurrencia_meses SHALL aceptar
 * únicamente enteros positivos entre 1 y 36 (inclusive) o null, y SHALL rechazar
 * todos los demás valores (negativos, cero, mayores a 36, decimales).
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validarRecurrenciaMeses } from '@/lib/validaciones'

describe('P5: Validación de intervalo de recurrencia', () => {
    it('acepta cadena vacía como null (sin recurrencia)', () => {
        const resultado = validarRecurrenciaMeses('')
        expect(resultado.valido).toBe(true)
        if (resultado.valido) {
            expect(resultado.valor).toBeNull()
        }
    })

    it('acepta enteros entre 1 y 36', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 36 }),
                (meses) => {
                    const resultado = validarRecurrenciaMeses(String(meses))
                    expect(resultado.valido).toBe(true)
                    if (resultado.valido) {
                        expect(resultado.valor).toBe(meses)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('rechaza enteros negativos', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -1000, max: -1 }),
                (meses) => {
                    const resultado = validarRecurrenciaMeses(String(meses))
                    expect(resultado.valido).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('rechaza cero', () => {
        const resultado = validarRecurrenciaMeses('0')
        expect(resultado.valido).toBe(false)
    })

    it('rechaza enteros mayores a 36', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 37, max: 10000 }),
                (meses) => {
                    const resultado = validarRecurrenciaMeses(String(meses))
                    expect(resultado.valido).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('rechaza decimales (no enteros)', () => {
        fc.assert(
            fc.property(
                fc.double({ min: 0.01, max: 36.99, noNaN: true, noDefaultInfinity: true })
                    .filter((n) => !Number.isInteger(n)),
                (decimal) => {
                    const resultado = validarRecurrenciaMeses(String(decimal))
                    expect(resultado.valido).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('para cualquier entero aleatorio, solo 1-36 son aceptados', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -1000, max: 1000 }),
                (n) => {
                    const resultado = validarRecurrenciaMeses(String(n))
                    const deberiaSerValido = n >= 1 && n <= 36

                    expect(resultado.valido).toBe(deberiaSerValido)
                    if (resultado.valido) {
                        expect(resultado.valor).toBe(n)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })
})
