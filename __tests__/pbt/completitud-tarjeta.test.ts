/**
 * Feature: autoavisa-mvp, Property 8: Completitud de datos en tarjeta de vehículo
 * Validates: Requirements 5.4
 *
 * Para cualquier vehículo con avisos asociados, la representación en tarjeta SHALL incluir:
 * matrícula, nombre del cliente, teléfono, número de avisos pendientes y fecha del próximo aviso.
 */
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import type { TipoAviso, EstadoAviso } from '@/types/database'

const TIPOS_AVISO: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']
const ESTADOS_AVISO: EstadoAviso[] = ['pendiente', 'enviado', 'fallido']

interface AvisoData {
    tipo: TipoAviso
    fecha_programada: string
    estado: EstadoAviso
}

interface VehiculoData {
    matricula: string
    nombre_cliente: string | null
    telefono_cliente: string
    avisos: AvisoData[]
}

interface TarjetaVehiculo {
    matricula: string
    nombre_cliente: string | null
    telefono: string
    avisos_pendientes: number
    proximo_aviso: string | null
}

/**
 * Transforma datos de vehículo en datos de tarjeta para el dashboard.
 */
function crearDatosTarjeta(vehiculo: VehiculoData): TarjetaVehiculo {
    const avisosPendientes = vehiculo.avisos.filter((a) => a.estado === 'pendiente')
    const proximoAviso = avisosPendientes.length > 0
        ? avisosPendientes
            .map((a) => a.fecha_programada)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
        : null

    return {
        matricula: vehiculo.matricula,
        nombre_cliente: vehiculo.nombre_cliente,
        telefono: vehiculo.telefono_cliente,
        avisos_pendientes: avisosPendientes.length,
        proximo_aviso: proximoAviso,
    }
}

/**
 * Genera una fecha YYYY-MM-DD a partir de un entero de días desde 2024-01-01.
 */
function diasAFecha(dias: number): string {
    const base = new Date('2024-01-01T00:00:00Z')
    base.setUTCDate(base.getUTCDate() + dias)
    return base.toISOString().split('T')[0]
}

describe('P8: Completitud de datos en tarjeta de vehículo', () => {
    const arbFecha = fc.integer({ min: 0, max: 2500 }).map(diasAFecha)

    const arbAviso = fc.record({
        tipo: fc.constantFrom(...TIPOS_AVISO),
        fecha_programada: arbFecha,
        estado: fc.constantFrom(...ESTADOS_AVISO),
    })

    const arbVehiculo = fc.record({
        matricula: fc.stringMatching(/^[A-Z0-9]{1,10}$/),
        nombre_cliente: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
        telefono_cliente: fc.stringMatching(/^\+\d{9,15}$/),
        avisos: fc.array(arbAviso, { minLength: 0, maxLength: 10 }),
    })

    it('la tarjeta siempre incluye todos los campos requeridos', () => {
        fc.assert(
            fc.property(arbVehiculo, (vehiculo) => {
                const tarjeta = crearDatosTarjeta(vehiculo)

                expect(tarjeta).toHaveProperty('matricula')
                expect(tarjeta).toHaveProperty('nombre_cliente')
                expect(tarjeta).toHaveProperty('telefono')
                expect(tarjeta).toHaveProperty('avisos_pendientes')
                expect(tarjeta).toHaveProperty('proximo_aviso')

                expect(tarjeta.matricula).toBe(vehiculo.matricula)
                expect(tarjeta.nombre_cliente).toBe(vehiculo.nombre_cliente)
                expect(tarjeta.telefono).toBe(vehiculo.telefono_cliente)
                expect(typeof tarjeta.avisos_pendientes).toBe('number')
                expect(tarjeta.avisos_pendientes).toBeGreaterThanOrEqual(0)
            }),
            { numRuns: 100 }
        )
    })

    it('el conteo de avisos pendientes es correcto', () => {
        fc.assert(
            fc.property(arbVehiculo, (vehiculo) => {
                const tarjeta = crearDatosTarjeta(vehiculo)
                const esperado = vehiculo.avisos.filter((a) => a.estado === 'pendiente').length
                expect(tarjeta.avisos_pendientes).toBe(esperado)
            }),
            { numRuns: 100 }
        )
    })

    it('el próximo aviso es la fecha más cercana entre los pendientes', () => {
        fc.assert(
            fc.property(arbVehiculo, (vehiculo) => {
                const tarjeta = crearDatosTarjeta(vehiculo)
                const pendientes = vehiculo.avisos.filter((a) => a.estado === 'pendiente')

                if (pendientes.length === 0) {
                    expect(tarjeta.proximo_aviso).toBeNull()
                } else {
                    const fechaMinima = pendientes
                        .map((a) => a.fecha_programada)
                        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
                    expect(tarjeta.proximo_aviso).toBe(fechaMinima)
                }
            }),
            { numRuns: 100 }
        )
    })
})
