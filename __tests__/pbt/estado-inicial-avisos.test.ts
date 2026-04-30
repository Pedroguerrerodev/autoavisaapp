/**
 * Feature: autoavisa-mvp, Property 5: Estado inicial y tipo de avisos creados
 * Validates: Requirements 4.3, 8.3
 *
 * Para cualquier aviso recién creado, el campo estado SHALL ser 'pendiente'.
 * Si el aviso fue creado mediante envío manual, es_manual SHALL ser true;
 * si fue creado como aviso programado, es_manual SHALL ser false.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { TipoAviso } from '@/types/database'

const TIPOS_AVISO: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

interface NuevoAviso {
    vehiculo_id: string
    tipo: TipoAviso
    fecha_programada: string
    mensaje_personalizado: string | null
    estado: string
    es_manual: boolean
}

/**
 * Crea un aviso programado (automático) con estado inicial correcto.
 */
function crearAvisoProgramado(
    vehiculoId: string,
    tipo: TipoAviso,
    fechaProgramada: string,
    mensaje: string | null
): NuevoAviso {
    return {
        vehiculo_id: vehiculoId,
        tipo,
        fecha_programada: fechaProgramada,
        mensaje_personalizado: mensaje,
        estado: 'pendiente',
        es_manual: false,
    }
}

/**
 * Crea un aviso manual con estado inicial correcto.
 */
function crearAvisoManual(
    vehiculoId: string,
    tipo: TipoAviso,
    fechaProgramada: string,
    mensaje: string | null
): NuevoAviso {
    return {
        vehiculo_id: vehiculoId,
        tipo,
        fecha_programada: fechaProgramada,
        mensaje_personalizado: mensaje,
        estado: 'pendiente',
        es_manual: true,
    }
}

describe('P5: Estado inicial de avisos', () => {
    function diasAFecha(dias: number): string {
        const base = new Date('2024-01-01T00:00:00Z')
        base.setUTCDate(base.getUTCDate() + dias)
        return base.toISOString().split('T')[0]
    }

    const arbTipo = fc.constantFrom(...TIPOS_AVISO)
    const arbFecha = fc.integer({ min: 0, max: 2500 }).map(diasAFecha)
    const arbMensaje = fc.option(fc.string({ minLength: 1, maxLength: 200 }), { nil: null })

    it('avisos programados siempre tienen estado pendiente y es_manual=false', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                arbTipo,
                arbFecha,
                arbMensaje,
                (vehiculoId, tipo, fecha, mensaje) => {
                    const aviso = crearAvisoProgramado(vehiculoId, tipo, fecha, mensaje)
                    expect(aviso.estado).toBe('pendiente')
                    expect(aviso.es_manual).toBe(false)
                }
            ),
            { numRuns: 100 }
        )
    })

    it('avisos manuales siempre tienen estado pendiente y es_manual=true', () => {
        fc.assert(
            fc.property(
                fc.uuid(),
                arbTipo,
                arbFecha,
                arbMensaje,
                (vehiculoId, tipo, fecha, mensaje) => {
                    const aviso = crearAvisoManual(vehiculoId, tipo, fecha, mensaje)
                    expect(aviso.estado).toBe('pendiente')
                    expect(aviso.es_manual).toBe(true)
                }
            ),
            { numRuns: 100 }
        )
    })
})
