/**
 * Feature: autoavisa-mvp, Property 11: Formato de mensajes WhatsApp
 * Validates: Requirements 7.1, 7.2
 *
 * Para cualquier aviso con datos válidos de vehículo y taller, el mensaje generado
 * por la API WhatsApp SHALL contener el emoji correspondiente al tipo de mantenimiento,
 * estar en español, e incluir el nombre del taller, matrícula y tipo de mantenimiento.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { generarMensaje, EMOJI_POR_TIPO, ETIQUETA_TIPO } from '@/lib/whatsapp'
import type { TipoAviso } from '@/types/database'

const TIPOS_AVISO: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

describe('P11: Formato de mensajes WhatsApp', () => {
    const arbTipo = fc.constantFrom(...TIPOS_AVISO)
    const arbMatricula = fc.stringMatching(/^[A-Z0-9]{1,10}$/)
    const arbNombreTaller = fc.string({ minLength: 1, maxLength: 50 })

    it('el mensaje contiene el emoji correcto según el tipo', () => {
        fc.assert(
            fc.property(
                arbTipo,
                arbMatricula,
                arbNombreTaller,
                (tipo, matricula, nombreTaller) => {
                    const mensaje = generarMensaje(tipo, matricula, nombreTaller)
                    const emojiEsperado = EMOJI_POR_TIPO[tipo]
                    expect(mensaje).toContain(emojiEsperado)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el mensaje está en español (contiene palabras clave en español)', () => {
        fc.assert(
            fc.property(
                arbTipo,
                arbMatricula,
                arbNombreTaller,
                (tipo, matricula, nombreTaller) => {
                    const mensaje = generarMensaje(tipo, matricula, nombreTaller)
                    // El mensaje debe contener al menos una palabra en español
                    const palabrasEspanol = ['Hola', 'recordamos', 'vehículo', 'matrícula', 'programado', 'esperamos']
                    const contieneEspanol = palabrasEspanol.some((p) => mensaje.includes(p))
                    expect(contieneEspanol).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el mensaje incluye la matrícula del vehículo', () => {
        fc.assert(
            fc.property(
                arbTipo,
                arbMatricula,
                arbNombreTaller,
                (tipo, matricula, nombreTaller) => {
                    const mensaje = generarMensaje(tipo, matricula, nombreTaller)
                    expect(mensaje).toContain(matricula)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el mensaje incluye el nombre del taller', () => {
        fc.assert(
            fc.property(
                arbTipo,
                arbMatricula,
                arbNombreTaller,
                (tipo, matricula, nombreTaller) => {
                    const mensaje = generarMensaje(tipo, matricula, nombreTaller)
                    expect(mensaje).toContain(nombreTaller)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el mensaje incluye la etiqueta del tipo de mantenimiento', () => {
        fc.assert(
            fc.property(
                arbTipo,
                arbMatricula,
                arbNombreTaller,
                (tipo, matricula, nombreTaller) => {
                    const mensaje = generarMensaje(tipo, matricula, nombreTaller)
                    const etiqueta = ETIQUETA_TIPO[tipo]
                    expect(mensaje).toContain(etiqueta)
                }
            ),
            { numRuns: 100 }
        )
    })
})
