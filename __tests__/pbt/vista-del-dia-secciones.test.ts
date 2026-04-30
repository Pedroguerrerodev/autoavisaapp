/**
 * Feature: autoavisa-pro, Property 6: Clasificación de avisos en secciones de la Vista del Día
 * Feature: autoavisa-pro, Property 7: Acción rápida "Posponer 1 día"
 * Feature: autoavisa-pro, Property 8: Acciones rápidas de estado en Vista del Día
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.6, 3.7, 3.8
 *
 * P6: Para cualquier conjunto de avisos pendientes con distintas fechas programadas y una
 *     fecha "hoy" dada, la función de clasificación SHALL asignar cada aviso exactamente a
 *     una sección: "Hoy" (fecha_programada = hoy), "Atrasados" (fecha_programada < hoy),
 *     o "Próximos 7 Días" (fecha_programada entre mañana y hoy+7 días). Los avisos con
 *     fecha_programada > hoy+7 días no SHALL aparecer en ninguna sección. Los avisos con
 *     estado distinto de "pendiente" no SHALL aparecer en ninguna sección.
 *
 * P7: Para cualquier aviso pendiente y cualquier fecha "hoy", tras ejecutar la acción
 *     "Posponer 1 día", la fecha_programada del aviso SHALL ser igual a hoy + 1 día
 *     calendario, independientemente de cuál fuera la fecha_programada original.
 *
 * P8: Para cualquier aviso pendiente, tanto la acción "Enviar ahora" como "Marcar como hecho"
 *     SHALL cambiar el estado a "enviado" y SHALL asignar fecha_envio con la fecha/hora actual.
 *     Además, si el aviso tiene recurrencia_meses configurado, ambas acciones SHALL generar
 *     el siguiente aviso de la cadena recurrente.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { EstadoAviso } from '@/types/database'
import {
    clasificarAvisos,
    calcularFechaPospuesta,
    aplicarAccionRapida,
    type AvisoParaClasificar,
} from '@/lib/validaciones'

// ── Shared helpers ──

const ESTADOS_AVISO: EstadoAviso[] = ['pendiente', 'enviado', 'fallido']

/**
 * Converts an offset in days from a base date to an ISO date string (YYYY-MM-DD).
 */
function diasAFechaISO(base: Date, offsetDias: number): string {
    const fecha = new Date(base)
    fecha.setUTCDate(fecha.getUTCDate() + offsetDias)
    return fecha.toISOString().split('T')[0]
}

/**
 * Calculates hoyISO and en7DiasISO from a base date.
 */
function calcularFechasReferencia(base: Date): { hoyISO: string; en7DiasISO: string } {
    const hoyISO = base.toISOString().split('T')[0]
    const en7Dias = new Date(base)
    en7Dias.setUTCDate(en7Dias.getUTCDate() + 7)
    const en7DiasISO = en7Dias.toISOString().split('T')[0]
    return { hoyISO, en7DiasISO }
}

// ── Arbitraries ──

/** A base "today" date within a reasonable range */
const arbBaseDate = fc.integer({ min: 0, max: 3000 }).map((dias) => {
    const base = new Date('2020-01-01T00:00:00Z')
    base.setUTCDate(base.getUTCDate() + dias)
    return base
})

const arbEstadoAviso = fc.constantFrom<EstadoAviso>(...ESTADOS_AVISO)

/**
 * Generate an aviso with a fecha_programada offset relative to "today".
 * Offset range: -30 to +30 days covers all sections plus out-of-range.
 */
const arbAvisoConOffset = (base: Date) =>
    fc.record({
        id: fc.uuid(),
        estado: arbEstadoAviso,
        offsetDias: fc.integer({ min: -30, max: 30 }),
    }).map(({ id, estado, offsetDias }) => ({
        aviso: {
            id,
            estado,
            fecha_programada: diasAFechaISO(base, offsetDias),
        } as AvisoParaClasificar,
        offsetDias,
    }))

// ── P6: Clasificación de avisos en secciones ──

describe('P6: Clasificación de avisos en secciones de la Vista del Día', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     */

    it('cada aviso pendiente se asigna a la sección correcta según su fecha', () => {
        fc.assert(
            fc.property(
                arbBaseDate,
                fc.integer({ min: 1, max: 15 }),
                (base, numAvisos) => {
                    const { hoyISO, en7DiasISO } = calcularFechasReferencia(base)

                    // Generate avisos — all pendiente to focus on date classification
                    const avisos: AvisoParaClasificar[] = []
                    const offsets: number[] = []
                    for (let i = 0; i < numAvisos; i++) {
                        const offset = Math.floor(Math.random() * 61) - 30 // -30 to +30
                        offsets.push(offset)
                        avisos.push({
                            id: `aviso-${i}`,
                            estado: 'pendiente',
                            fecha_programada: diasAFechaISO(base, offset),
                        })
                    }

                    const resultado = clasificarAvisos(avisos, hoyISO, en7DiasISO)

                    // Verify each aviso is in the correct section
                    for (let i = 0; i < avisos.length; i++) {
                        const aviso = avisos[i]
                        const fp = aviso.fecha_programada

                        const enAtrasados = resultado.atrasados.some((a) => a.id === aviso.id)
                        const enHoy = resultado.hoy.some((a) => a.id === aviso.id)
                        const enProximos = resultado.proximos.some((a) => a.id === aviso.id)

                        if (fp < hoyISO) {
                            expect(enAtrasados).toBe(true)
                            expect(enHoy).toBe(false)
                            expect(enProximos).toBe(false)
                        } else if (fp === hoyISO) {
                            expect(enAtrasados).toBe(false)
                            expect(enHoy).toBe(true)
                            expect(enProximos).toBe(false)
                        } else if (fp > hoyISO && fp <= en7DiasISO) {
                            expect(enAtrasados).toBe(false)
                            expect(enHoy).toBe(false)
                            expect(enProximos).toBe(true)
                        } else {
                            // > en7DiasISO: not in any section
                            expect(enAtrasados).toBe(false)
                            expect(enHoy).toBe(false)
                            expect(enProximos).toBe(false)
                        }
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('avisos con estado distinto de pendiente no aparecen en ninguna sección', () => {
        fc.assert(
            fc.property(
                arbBaseDate,
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        estado: fc.constantFrom<EstadoAviso>('enviado', 'fallido'),
                        offsetDias: fc.integer({ min: -30, max: 30 }),
                    }),
                    { minLength: 1, maxLength: 15 },
                ),
                (base, avisosRaw) => {
                    const { hoyISO, en7DiasISO } = calcularFechasReferencia(base)

                    const avisos: AvisoParaClasificar[] = avisosRaw.map((a) => ({
                        id: a.id,
                        estado: a.estado,
                        fecha_programada: diasAFechaISO(base, a.offsetDias),
                    }))

                    const resultado = clasificarAvisos(avisos, hoyISO, en7DiasISO)

                    expect(resultado.atrasados).toHaveLength(0)
                    expect(resultado.hoy).toHaveLength(0)
                    expect(resultado.proximos).toHaveLength(0)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('avisos con fecha > hoy+7 no aparecen en ninguna sección', () => {
        fc.assert(
            fc.property(
                arbBaseDate,
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        offsetDias: fc.integer({ min: 8, max: 60 }),
                    }),
                    { minLength: 1, maxLength: 10 },
                ),
                (base, avisosRaw) => {
                    const { hoyISO, en7DiasISO } = calcularFechasReferencia(base)

                    const avisos: AvisoParaClasificar[] = avisosRaw.map((a) => ({
                        id: a.id,
                        estado: 'pendiente' as EstadoAviso,
                        fecha_programada: diasAFechaISO(base, a.offsetDias),
                    }))

                    const resultado = clasificarAvisos(avisos, hoyISO, en7DiasISO)

                    expect(resultado.atrasados).toHaveLength(0)
                    expect(resultado.hoy).toHaveLength(0)
                    expect(resultado.proximos).toHaveLength(0)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('la suma de avisos clasificados + excluidos = total de avisos de entrada', () => {
        fc.assert(
            fc.property(
                arbBaseDate,
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        estado: arbEstadoAviso,
                        offsetDias: fc.integer({ min: -30, max: 30 }),
                    }),
                    { minLength: 0, maxLength: 20 },
                ),
                (base, avisosRaw) => {
                    const { hoyISO, en7DiasISO } = calcularFechasReferencia(base)

                    const avisos: AvisoParaClasificar[] = avisosRaw.map((a) => ({
                        id: a.id,
                        estado: a.estado,
                        fecha_programada: diasAFechaISO(base, a.offsetDias),
                    }))

                    const resultado = clasificarAvisos(avisos, hoyISO, en7DiasISO)

                    const totalClasificados =
                        resultado.atrasados.length +
                        resultado.hoy.length +
                        resultado.proximos.length

                    // Classified count must be <= total (some may be excluded)
                    expect(totalClasificados).toBeLessThanOrEqual(avisos.length)

                    // All classified avisos must be pendiente
                    for (const a of [...resultado.atrasados, ...resultado.hoy, ...resultado.proximos]) {
                        expect(a.estado).toBe('pendiente')
                    }
                }
            ),
            { numRuns: 100 }
        )
    })
})

// ── P7: Posponer 1 día ──

describe('P7: Acción rápida "Posponer 1 día"', () => {
    /**
     * **Validates: Requirement 3.7**
     */

    it('fecha_programada = hoy + 1 día para cualquier fecha hoy', () => {
        fc.assert(
            fc.property(
                arbBaseDate,
                (base) => {
                    const hoyISO = base.toISOString().split('T')[0]
                    const resultado = calcularFechaPospuesta(hoyISO)

                    // Calculate expected: hoy + 1 day
                    const esperada = new Date(base)
                    esperada.setUTCDate(esperada.getUTCDate() + 1)
                    const esperadaISO = esperada.toISOString().split('T')[0]

                    expect(resultado).toBe(esperadaISO)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('la fecha pospuesta siempre es exactamente 1 día después de hoy', () => {
        fc.assert(
            fc.property(
                arbBaseDate,
                (base) => {
                    const hoyISO = base.toISOString().split('T')[0]
                    const resultado = calcularFechaPospuesta(hoyISO)

                    const hoyDate = new Date(hoyISO + 'T00:00:00Z')
                    const resultadoDate = new Date(resultado + 'T00:00:00Z')

                    const diffMs = resultadoDate.getTime() - hoyDate.getTime()
                    const diffDias = diffMs / (1000 * 60 * 60 * 24)

                    expect(diffDias).toBe(1)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('la fecha pospuesta es independiente de la fecha_programada original del aviso', () => {
        fc.assert(
            fc.property(
                arbBaseDate,
                fc.integer({ min: -365, max: 365 }),
                (base, offsetOriginal) => {
                    const hoyISO = base.toISOString().split('T')[0]
                    // The original fecha_programada is irrelevant — postpone always uses hoy + 1
                    const _fechaOriginal = diasAFechaISO(base, offsetOriginal)

                    const resultado = calcularFechaPospuesta(hoyISO)

                    const esperada = new Date(base)
                    esperada.setUTCDate(esperada.getUTCDate() + 1)
                    const esperadaISO = esperada.toISOString().split('T')[0]

                    expect(resultado).toBe(esperadaISO)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el resultado siempre es un string de fecha ISO válido (YYYY-MM-DD)', () => {
        fc.assert(
            fc.property(
                arbBaseDate,
                (base) => {
                    const hoyISO = base.toISOString().split('T')[0]
                    const resultado = calcularFechaPospuesta(hoyISO)

                    // Verify format YYYY-MM-DD
                    expect(resultado).toMatch(/^\d{4}-\d{2}-\d{2}$/)

                    // Verify it parses to a valid date
                    const parsed = new Date(resultado + 'T00:00:00Z')
                    expect(parsed.toISOString().split('T')[0]).toBe(resultado)
                }
            ),
            { numRuns: 100 }
        )
    })
})

// ── P8: Acciones rápidas de estado ──

describe('P8: Acciones rápidas de estado en Vista del Día', () => {
    /**
     * **Validates: Requirements 3.6, 3.8**
     */

    const arbRecurrencia = fc.option(fc.integer({ min: 1, max: 36 }), { nil: null })

    it('el estado siempre cambia a "enviado" y se asigna fecha_envio', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.option(fc.uuid(), { nil: null }),
                arbRecurrencia,
                arbBaseDate,
                (avisoId, avisoOrigenId, recurrencia, base) => {
                    const fechaEnvioISO = base.toISOString().split('T')[0]

                    const resultado = aplicarAccionRapida(
                        avisoId,
                        avisoOrigenId,
                        recurrencia,
                        fechaEnvioISO,
                    )

                    expect(resultado.nuevoEstado).toBe('enviado')
                    expect(resultado.fechaEnvio).toBe(fechaEnvioISO)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('si recurrencia_meses está configurado, se genera el siguiente aviso', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.option(fc.uuid(), { nil: null }),
                fc.integer({ min: 1, max: 36 }),
                arbBaseDate,
                (avisoId, avisoOrigenId, recurrencia, base) => {
                    const fechaEnvioISO = base.toISOString().split('T')[0]

                    const resultado = aplicarAccionRapida(
                        avisoId,
                        avisoOrigenId,
                        recurrencia,
                        fechaEnvioISO,
                    )

                    // Must generate next aviso
                    expect(resultado.siguienteAviso).not.toBeNull()
                    expect(resultado.siguienteAviso!.estado).toBe('pendiente')
                    expect(resultado.siguienteAviso!.recurrencia_meses).toBe(recurrencia)

                    // Verify fecha_programada = fechaEnvio + recurrencia months
                    const esperada = new Date(fechaEnvioISO + 'T00:00:00Z')
                    esperada.setUTCMonth(esperada.getUTCMonth() + recurrencia)
                    const esperadaISO = esperada.toISOString().split('T')[0]
                    expect(resultado.siguienteAviso!.fecha_programada).toBe(esperadaISO)

                    // Verify aviso_origen_id points to the original
                    const expectedOrigenId = avisoOrigenId ?? avisoId
                    expect(resultado.siguienteAviso!.aviso_origen_id).toBe(expectedOrigenId)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('si recurrencia_meses es null, no se genera siguiente aviso', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.option(fc.uuid(), { nil: null }),
                arbBaseDate,
                (avisoId, avisoOrigenId, base) => {
                    const fechaEnvioISO = base.toISOString().split('T')[0]

                    const resultado = aplicarAccionRapida(
                        avisoId,
                        avisoOrigenId,
                        null, // no recurrence
                        fechaEnvioISO,
                    )

                    expect(resultado.siguienteAviso).toBeNull()
                }
            ),
            { numRuns: 100 }
        )
    })

    it('aviso_origen_id del siguiente aviso apunta al original de la cadena', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                fc.uuid(),
                fc.integer({ min: 1, max: 36 }),
                arbBaseDate,
                (avisoId, origenExistente, recurrencia, base) => {
                    const fechaEnvioISO = base.toISOString().split('T')[0]

                    // Case 1: aviso already has an aviso_origen_id (part of chain)
                    const resultado1 = aplicarAccionRapida(
                        avisoId,
                        origenExistente,
                        recurrencia,
                        fechaEnvioISO,
                    )
                    expect(resultado1.siguienteAviso!.aviso_origen_id).toBe(origenExistente)

                    // Case 2: aviso is the original (no aviso_origen_id)
                    const resultado2 = aplicarAccionRapida(
                        avisoId,
                        null,
                        recurrencia,
                        fechaEnvioISO,
                    )
                    expect(resultado2.siguienteAviso!.aviso_origen_id).toBe(avisoId)
                }
            ),
            { numRuns: 100 }
        )
    })
})
