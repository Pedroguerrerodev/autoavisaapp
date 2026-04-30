/**
 * Feature: autoavisa-mvp, Property 4: Validación de teléfono con prefijo internacional
 * Validates: Requirements 3.4
 *
 * Para cualquier cadena de texto, la función de validación de teléfono SHALL aceptar
 * únicamente cadenas que representen un número válido con prefijo internacional
 * (ej: +34612345678) y rechazar todas las demás.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { validarTelefono } from '@/lib/whatsapp'

describe('P4: Validación de teléfono con prefijo internacional', () => {
    it('acepta teléfonos válidos: + seguido de dígitos', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^\d{1,15}$/),
                (digitos) => {
                    const telefono = `+${digitos}`
                    expect(validarTelefono(telefono)).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('rechaza cadenas vacías', () => {
        expect(validarTelefono('')).toBe(false)
    })

    it('rechaza cadenas sin prefijo +', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^\d{1,15}$/),
                (digitos) => {
                    expect(validarTelefono(digitos)).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('rechaza cadenas con letras después del +', () => {
        fc.assert(
            fc.property(
                fc.stringMatching(/^[a-zA-Z]{1,10}$/),
                (letras) => {
                    expect(validarTelefono(`+${letras}`)).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('rechaza cadenas aleatorias que no cumplen el formato', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 0, maxLength: 20 }),
                (cadena) => {
                    const esValido = /^\+\d+$/.test(cadena)
                    expect(validarTelefono(cadena)).toBe(esValido)
                }
            ),
            { numRuns: 100 }
        )
    })
})
