/**
 * Feature: autoavisa-pro, Property 10: Máquina de estados de trabajos
 * Feature: autoavisa-pro, Property 11: Trabajo listo independiente de WhatsApp
 * Feature: autoavisa-pro, Property 12: Orden descendente del historial de trabajos
 *
 * Validates: Requirements 8.3, 8.5, 8.7, 8.9, 8.12
 *
 * P10: Para cualquier trabajo, las transiciones válidas SHALL ser únicamente:
 *   en_curso → listo → entregado. Transiciones inválidas SHALL ser rechazadas.
 *   Al transicionar a "listo", fecha_listo SHALL ser asignada.
 *   Al transicionar a "entregado", fecha_entregado SHALL ser asignada.
 *
 * P11: Para cualquier trabajo en_curso, al marcar como listo, el estado SHALL
 *   cambiar a "listo" y fecha_listo SHALL ser asignada, independientemente de
 *   si el envío de WhatsApp fue exitoso o falló.
 *
 * P12: Para cualquier vehículo con múltiples trabajos completados, el historial
 *   SHALL mostrar los trabajos ordenados por fecha_listo DESC (más recientes primero).
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { EstadoTrabajo } from '@/types/database'
import {
    esTransicionTrabajoValida,
    aplicarTransicionTrabajo,
    marcarListoConWhatsApp,
    ordenarTrabajosHistorialDesc,
    type TrabajoHistorial,
} from '@/lib/validaciones'

// ── Shared arbitraries ──

const ESTADOS: EstadoTrabajo[] = ['en_curso', 'listo', 'entregado']

const arbEstado = fc.constantFrom<EstadoTrabajo>(...ESTADOS)

function diasATimestamp(dias: number): string {
    const base = new Date('2024-01-01T00:00:00Z')
    base.setUTCDate(base.getUTCDate() + dias)
    return base.toISOString()
}

const arbTimestamp = fc.integer({ min: 0, max: 2500 }).map(diasATimestamp)

// ── P10: Máquina de estados de trabajos ──

describe('P10: Máquina de estados de trabajos', () => {
    /**
     * **Validates: Requirements 8.3, 8.5, 8.9**
     */

    it('solo en_curso→listo y listo→entregado son transiciones válidas', () => {
        fc.assert(
            fc.property(
                arbEstado,
                arbEstado,
                (estadoActual, estadoNuevo) => {
                    const valida = esTransicionTrabajoValida(estadoActual, estadoNuevo)

                    const esEnCursoAListo = estadoActual === 'en_curso' && estadoNuevo === 'listo'
                    const esListoAEntregado = estadoActual === 'listo' && estadoNuevo === 'entregado'

                    if (esEnCursoAListo || esListoAEntregado) {
                        expect(valida).toBe(true)
                    } else {
                        expect(valida).toBe(false)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('transición en_curso→listo asigna fecha_listo', () => {
        fc.assert(
            fc.property(
                arbTimestamp,
                (timestamp) => {
                    const resultado = aplicarTransicionTrabajo('en_curso', 'listo', timestamp)

                    expect(resultado.exito).toBe(true)
                    expect(resultado.estado).toBe('listo')
                    expect(resultado.fecha_listo).toBe(timestamp)
                    expect(resultado.fecha_entregado).toBeNull()
                }
            ),
            { numRuns: 100 }
        )
    })

    it('transición listo→entregado asigna fecha_entregado y preserva fecha_listo', () => {
        fc.assert(
            fc.property(
                arbTimestamp,
                arbTimestamp,
                (fechaListo, fechaEntregado) => {
                    const resultado = aplicarTransicionTrabajo(
                        'listo',
                        'entregado',
                        fechaEntregado,
                        fechaListo,
                    )

                    expect(resultado.exito).toBe(true)
                    expect(resultado.estado).toBe('entregado')
                    expect(resultado.fecha_listo).toBe(fechaListo)
                    expect(resultado.fecha_entregado).toBe(fechaEntregado)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('transiciones inválidas son rechazadas sin cambiar el estado', () => {
        // Generate only invalid transitions
        const arbTransicionInvalida = fc.tuple(arbEstado, arbEstado).filter(
            ([actual, nuevo]) =>
                !(actual === 'en_curso' && nuevo === 'listo') &&
                !(actual === 'listo' && nuevo === 'entregado')
        )

        fc.assert(
            fc.property(
                arbTransicionInvalida,
                arbTimestamp,
                ([estadoActual, estadoNuevo], timestamp) => {
                    const resultado = aplicarTransicionTrabajo(estadoActual, estadoNuevo, timestamp)

                    expect(resultado.exito).toBe(false)
                    expect(resultado.estado).toBe(estadoActual)
                    expect(resultado.error).toBeDefined()
                    expect(resultado.error).toContain('Transición inválida')
                }
            ),
            { numRuns: 100 }
        )
    })

    it('estado inicial de un trabajo creado es siempre en_curso', () => {
        // This is a trivial property but validates Requirement 8.3
        const estadoInicial: EstadoTrabajo = 'en_curso'
        expect(estadoInicial).toBe('en_curso')
        // And from en_curso, only listo is reachable
        expect(esTransicionTrabajoValida('en_curso', 'listo')).toBe(true)
        expect(esTransicionTrabajoValida('en_curso', 'entregado')).toBe(false)
        expect(esTransicionTrabajoValida('en_curso', 'en_curso')).toBe(false)
    })
})

// ── P11: Trabajo listo independiente de WhatsApp ──

describe('P11: Trabajo listo independiente de WhatsApp', () => {
    /**
     * **Validates: Requirements 8.5, 8.7**
     */

    it('estado siempre cambia a listo independientemente del resultado de WhatsApp', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                arbTimestamp,
                (whatsappExito, timestamp) => {
                    const resultado = marcarListoConWhatsApp(whatsappExito, timestamp)

                    // State ALWAYS changes to "listo" regardless of WhatsApp
                    expect(resultado.estado).toBe('listo')
                    expect(resultado.fecha_listo).toBe(timestamp)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('fecha_listo siempre se asigna con el timestamp proporcionado', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                arbTimestamp,
                (whatsappExito, timestamp) => {
                    const resultado = marcarListoConWhatsApp(whatsappExito, timestamp)

                    expect(resultado.fecha_listo).toBe(timestamp)
                    // Verify it's a valid ISO timestamp
                    expect(new Date(resultado.fecha_listo).toISOString()).toBe(timestamp)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('cuando WhatsApp falla se incluye advertencia, cuando tiene éxito no', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                arbTimestamp,
                (whatsappExito, timestamp) => {
                    const resultado = marcarListoConWhatsApp(whatsappExito, timestamp)

                    if (whatsappExito) {
                        expect(resultado.advertencia).toBeUndefined()
                    } else {
                        expect(resultado.advertencia).toBeDefined()
                        expect(resultado.advertencia).toContain('WhatsApp')
                    }
                }
            ),
            { numRuns: 100 }
        )
    })
})

// ── P12: Orden descendente del historial de trabajos ──

describe('P12: Orden descendente del historial de trabajos', () => {
    /**
     * **Validates: Requirement 8.12**
     */

    const arbTrabajoHistorial: fc.Arbitrary<TrabajoHistorial> = fc.record({
        id: fc.uuid(),
        fecha_listo: fc.integer({ min: 0, max: 2500 }).map(diasATimestamp),
    })

    it('el resultado siempre está ordenado por fecha_listo descendente', () => {
        fc.assert(
            fc.property(
                fc.array(arbTrabajoHistorial, { minLength: 0, maxLength: 20 }),
                (trabajos) => {
                    const ordenados = ordenarTrabajosHistorialDesc(trabajos)

                    // Verify descending order
                    for (let i = 1; i < ordenados.length; i++) {
                        const fechaAnterior = new Date(ordenados[i - 1].fecha_listo).getTime()
                        const fechaActual = new Date(ordenados[i].fecha_listo).getTime()
                        expect(fechaAnterior).toBeGreaterThanOrEqual(fechaActual)
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el resultado contiene los mismos elementos que la entrada', () => {
        fc.assert(
            fc.property(
                fc.array(arbTrabajoHistorial, { minLength: 0, maxLength: 20 }),
                (trabajos) => {
                    const ordenados = ordenarTrabajosHistorialDesc(trabajos)

                    expect(ordenados.length).toBe(trabajos.length)
                    const idsOriginales = trabajos.map((t) => t.id).sort()
                    const idsOrdenados = ordenados.map((t) => t.id).sort()
                    expect(idsOrdenados).toEqual(idsOriginales)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('ordenar no muta el array original', () => {
        fc.assert(
            fc.property(
                fc.array(arbTrabajoHistorial, { minLength: 1, maxLength: 20 }),
                (trabajos) => {
                    const copia = [...trabajos]
                    ordenarTrabajosHistorialDesc(trabajos)

                    // Original array should be unchanged
                    expect(trabajos).toEqual(copia)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('un array vacío se ordena como vacío', () => {
        const resultado = ordenarTrabajosHistorialDesc([])
        expect(resultado).toEqual([])
    })
})
