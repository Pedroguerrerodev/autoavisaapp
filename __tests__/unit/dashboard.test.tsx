/**
 * Tests unitarios de dashboard.
 *
 * El dashboard es un Server Component que consulta Supabase.
 * Testeamos la lógica pura: agrupación de avisos por vehículo
 * y cálculo de la ventana de 7 días para avisos próximos.
 */
import { describe, it, expect, vi } from 'vitest'

// --- Lógica extraída del dashboard ---

interface AvisoRaw {
    vehiculo_id: string
    fecha_programada: string
    estado: string
}

interface AvisosPorVehiculo {
    pendientes: number
    proximo: string | null
}

/**
 * Agrupa avisos por vehículo, contando pendientes y encontrando el más próximo.
 * Los avisos deben venir ordenados por fecha_programada ASC.
 */
function agruparAvisosPorVehiculo(
    avisos: AvisoRaw[]
): Record<string, AvisosPorVehiculo> {
    return avisos.reduce<Record<string, AvisosPorVehiculo>>((acc, aviso) => {
        if (!acc[aviso.vehiculo_id]) {
            acc[aviso.vehiculo_id] = { pendientes: 0, proximo: null }
        }
        acc[aviso.vehiculo_id].pendientes++
        if (!acc[aviso.vehiculo_id].proximo) {
            acc[aviso.vehiculo_id].proximo = aviso.fecha_programada
        }
        return acc
    }, {})
}

/**
 * Calcula el rango de fechas para avisos próximos (hoy → hoy+7 días).
 */
function calcularVentana7Dias(hoy: Date): { hoyISO: string; en7DiasISO: string } {
    const hoyISO = hoy.toISOString().split('T')[0]
    const en7Dias = new Date(hoy)
    en7Dias.setDate(en7Dias.getDate() + 7)
    const en7DiasISO = en7Dias.toISOString().split('T')[0]
    return { hoyISO, en7DiasISO }
}

/**
 * Filtra avisos que están dentro de la ventana de 7 días.
 */
function filtrarAvisosProximos(
    avisos: AvisoRaw[],
    hoyISO: string,
    en7DiasISO: string
): AvisoRaw[] {
    return avisos.filter(
        (a) =>
            a.estado === 'pendiente' &&
            a.fecha_programada >= hoyISO &&
            a.fecha_programada <= en7DiasISO
    )
}

describe('Dashboard — agrupación de avisos por vehículo', () => {
    it('agrupa avisos de un solo vehículo correctamente', () => {
        const avisos: AvisoRaw[] = [
            { vehiculo_id: 'v1', fecha_programada: '2025-01-15', estado: 'pendiente' },
            { vehiculo_id: 'v1', fecha_programada: '2025-02-20', estado: 'pendiente' },
        ]

        const resultado = agruparAvisosPorVehiculo(avisos)

        expect(resultado['v1']).toEqual({
            pendientes: 2,
            proximo: '2025-01-15',
        })
    })

    it('agrupa avisos de múltiples vehículos', () => {
        const avisos: AvisoRaw[] = [
            { vehiculo_id: 'v1', fecha_programada: '2025-01-10', estado: 'pendiente' },
            { vehiculo_id: 'v2', fecha_programada: '2025-01-12', estado: 'pendiente' },
            { vehiculo_id: 'v1', fecha_programada: '2025-03-01', estado: 'pendiente' },
        ]

        const resultado = agruparAvisosPorVehiculo(avisos)

        expect(resultado['v1']).toEqual({ pendientes: 2, proximo: '2025-01-10' })
        expect(resultado['v2']).toEqual({ pendientes: 1, proximo: '2025-01-12' })
    })

    it('retorna objeto vacío cuando no hay avisos', () => {
        const resultado = agruparAvisosPorVehiculo([])
        expect(resultado).toEqual({})
    })

    it('el próximo aviso es el primero (asume orden ASC)', () => {
        const avisos: AvisoRaw[] = [
            { vehiculo_id: 'v1', fecha_programada: '2025-03-01', estado: 'pendiente' },
            { vehiculo_id: 'v1', fecha_programada: '2025-06-15', estado: 'pendiente' },
        ]

        const resultado = agruparAvisosPorVehiculo(avisos)
        expect(resultado['v1'].proximo).toBe('2025-03-01')
    })
})

describe('Dashboard — ventana de 7 días', () => {
    it('calcula correctamente el rango de 7 días', () => {
        const hoy = new Date('2025-07-10T12:00:00Z')
        const { hoyISO, en7DiasISO } = calcularVentana7Dias(hoy)

        expect(hoyISO).toBe('2025-07-10')
        expect(en7DiasISO).toBe('2025-07-17')
    })

    it('maneja fin de mes correctamente', () => {
        const hoy = new Date('2025-01-28T12:00:00Z')
        const { hoyISO, en7DiasISO } = calcularVentana7Dias(hoy)

        expect(hoyISO).toBe('2025-01-28')
        expect(en7DiasISO).toBe('2025-02-04')
    })

    it('maneja fin de año correctamente', () => {
        const hoy = new Date('2025-12-28T12:00:00Z')
        const { hoyISO, en7DiasISO } = calcularVentana7Dias(hoy)

        expect(hoyISO).toBe('2025-12-28')
        expect(en7DiasISO).toBe('2026-01-04')
    })
})

describe('Dashboard — filtrado de avisos próximos', () => {
    const hoyISO = '2025-07-10'
    const en7DiasISO = '2025-07-17'

    it('incluye avisos pendientes dentro de la ventana', () => {
        const avisos: AvisoRaw[] = [
            { vehiculo_id: 'v1', fecha_programada: '2025-07-12', estado: 'pendiente' },
        ]

        const resultado = filtrarAvisosProximos(avisos, hoyISO, en7DiasISO)
        expect(resultado).toHaveLength(1)
    })

    it('excluye avisos con estado enviado', () => {
        const avisos: AvisoRaw[] = [
            { vehiculo_id: 'v1', fecha_programada: '2025-07-12', estado: 'enviado' },
        ]

        const resultado = filtrarAvisosProximos(avisos, hoyISO, en7DiasISO)
        expect(resultado).toHaveLength(0)
    })

    it('excluye avisos fuera de la ventana de 7 días', () => {
        const avisos: AvisoRaw[] = [
            { vehiculo_id: 'v1', fecha_programada: '2025-07-25', estado: 'pendiente' },
        ]

        const resultado = filtrarAvisosProximos(avisos, hoyISO, en7DiasISO)
        expect(resultado).toHaveLength(0)
    })

    it('excluye avisos anteriores a hoy', () => {
        const avisos: AvisoRaw[] = [
            { vehiculo_id: 'v1', fecha_programada: '2025-07-05', estado: 'pendiente' },
        ]

        const resultado = filtrarAvisosProximos(avisos, hoyISO, en7DiasISO)
        expect(resultado).toHaveLength(0)
    })

    it('incluye avisos en los límites exactos de la ventana', () => {
        const avisos: AvisoRaw[] = [
            { vehiculo_id: 'v1', fecha_programada: '2025-07-10', estado: 'pendiente' },
            { vehiculo_id: 'v2', fecha_programada: '2025-07-17', estado: 'pendiente' },
        ]

        const resultado = filtrarAvisosProximos(avisos, hoyISO, en7DiasISO)
        expect(resultado).toHaveLength(2)
    })
})


// ─── Tests de renderizado del componente VistaDeDia ──────────────────────────
// Validates: Requirements 3.11, 3.12

import { render, screen } from '@testing-library/react'
import { VistaDeDia } from '@/components/vista-del-dia'
import type { AvisoConVehiculo, TrabajoConVehiculo } from '@/components/vista-del-dia'

// --- Mocks ---

vi.mock('@/components/ui/toast', () => ({
    useToast: () => ({
        mostrarExito: vi.fn(),
        mostrarError: vi.fn(),
    }),
}))

vi.mock('@/app/(protected)/dashboard/actions', () => ({
    enviarAvisoAhora: vi.fn(),
    posponerAviso: vi.fn(),
    marcarAvisoHecho: vi.fn(),
}))

vi.mock('@/app/(protected)/vehiculos/[id]/trabajos/actions', () => ({
    marcarTrabajoListo: vi.fn(),
}))

vi.mock('@/lib/whatsapp', () => ({
    EMOJI_POR_TIPO: {
        itv: '🚗',
        aceite: '🛢️',
        filtros: '🔧',
        revision: '🛠️',
        neumaticos: '🔘',
        otro: '🔔',
    },
    ETIQUETA_TIPO: {
        itv: 'ITV',
        aceite: 'Cambio de aceite',
        filtros: 'Filtros',
        revision: 'Revisión general',
        neumaticos: 'Neumáticos',
        otro: 'Otro',
    },
}))

// --- Helpers ---

function crearAviso(overrides: Partial<AvisoConVehiculo> = {}): AvisoConVehiculo {
    return {
        id: 'aviso-1',
        tipo: 'itv',
        fecha_programada: '2025-07-10',
        vehiculo_id: 'v1',
        matricula: '1234 ABC',
        nombre_cliente: 'Juan García',
        recurrencia_meses: null,
        ...overrides,
    }
}

function crearTrabajo(overrides: Partial<TrabajoConVehiculo> = {}): TrabajoConVehiculo {
    return {
        id: 'trabajo-1',
        descripcion: 'Cambio de pastillas',
        vehiculo_id: 'v1',
        matricula: '1234 ABC',
        nombre_cliente: 'Juan García',
        created_at: '2025-07-10T10:00:00Z',
        ...overrides,
    }
}

// --- Tests ---

describe('VistaDeDia — mensaje de celebración (Req 3.12)', () => {
    it('muestra emoji 🎉 y mensaje cuando no hay avisos en ninguna sección', () => {
        render(
            <VistaDeDia
                avisosHoy={[]}
                avisosAtrasados={[]}
                avisosProximos={[]}
                trabajosEnCurso={[]}
            />
        )

        expect(screen.getByText('🎉')).toBeDefined()
        expect(screen.getByText('¡No hay avisos pendientes!')).toBeDefined()
        expect(screen.getByText('Todo al día. Buen trabajo.')).toBeDefined()
    })

    it('no muestra mensaje de celebración cuando hay avisos de hoy', () => {
        render(
            <VistaDeDia
                avisosHoy={[crearAviso()]}
                avisosAtrasados={[]}
                avisosProximos={[]}
                trabajosEnCurso={[]}
            />
        )

        expect(screen.queryByText('🎉')).toBeNull()
        expect(screen.queryByText('¡No hay avisos pendientes!')).toBeNull()
    })

    it('no muestra mensaje de celebración cuando hay avisos atrasados', () => {
        render(
            <VistaDeDia
                avisosHoy={[]}
                avisosAtrasados={[crearAviso({ id: 'atrasado-1', fecha_programada: '2025-07-01' })]}
                avisosProximos={[]}
                trabajosEnCurso={[]}
            />
        )

        expect(screen.queryByText('🎉')).toBeNull()
    })

    it('no muestra mensaje de celebración cuando hay avisos próximos', () => {
        render(
            <VistaDeDia
                avisosHoy={[]}
                avisosAtrasados={[]}
                avisosProximos={[crearAviso({ id: 'proximo-1', fecha_programada: '2025-07-15' })]}
                trabajosEnCurso={[]}
            />
        )

        expect(screen.queryByText('🎉')).toBeNull()
    })

    it('muestra celebración incluso si hay trabajos en curso (solo depende de avisos)', () => {
        render(
            <VistaDeDia
                avisosHoy={[]}
                avisosAtrasados={[]}
                avisosProximos={[]}
                trabajosEnCurso={[crearTrabajo()]}
            />
        )

        expect(screen.getByText('🎉')).toBeDefined()
        expect(screen.getByText('¡No hay avisos pendientes!')).toBeDefined()
    })
})

describe('VistaDeDia — sección atrasados con estilo de advertencia (Req 3.11)', () => {
    it('muestra sección "Avisos Atrasados" con borde rojo cuando hay atrasados', () => {
        const { container } = render(
            <VistaDeDia
                avisosHoy={[]}
                avisosAtrasados={[
                    crearAviso({ id: 'atrasado-1', fecha_programada: '2025-07-01' }),
                ]}
                avisosProximos={[]}
                trabajosEnCurso={[]}
            />
        )

        expect(screen.getByText('Avisos Atrasados')).toBeDefined()

        // Verify the warning container has red border and background classes
        const alertDiv = container.querySelector('[role="alert"]')
        expect(alertDiv).not.toBeNull()
        expect(alertDiv!.className).toContain('border-red-200')
        expect(alertDiv!.className).toContain('red-50')
    })

    it('no muestra sección de atrasados cuando no hay avisos atrasados', () => {
        render(
            <VistaDeDia
                avisosHoy={[crearAviso()]}
                avisosAtrasados={[]}
                avisosProximos={[]}
                trabajosEnCurso={[]}
            />
        )

        expect(screen.queryByText('⚠️ Avisos Atrasados')).toBeNull()
    })

    it('muestra la matrícula del vehículo en la tarjeta de aviso atrasado', () => {
        render(
            <VistaDeDia
                avisosHoy={[]}
                avisosAtrasados={[
                    crearAviso({ id: 'atrasado-1', matricula: '5678 XYZ', fecha_programada: '2025-07-01' }),
                ]}
                avisosProximos={[]}
                trabajosEnCurso={[]}
            />
        )

        expect(screen.getByText('5678 XYZ')).toBeDefined()
    })

    it('muestra múltiples avisos atrasados dentro de la sección de advertencia', () => {
        const { container } = render(
            <VistaDeDia
                avisosHoy={[]}
                avisosAtrasados={[
                    crearAviso({ id: 'atrasado-1', matricula: '1111 AAA', fecha_programada: '2025-07-01' }),
                    crearAviso({ id: 'atrasado-2', matricula: '2222 BBB', fecha_programada: '2025-07-02' }),
                ]}
                avisosProximos={[]}
                trabajosEnCurso={[]}
            />
        )

        const alertDiv = container.querySelector('[role="alert"]')
        expect(alertDiv).not.toBeNull()
        expect(screen.getByText('1111 AAA')).toBeDefined()
        expect(screen.getByText('2222 BBB')).toBeDefined()
    })

    it('el contenedor de atrasados tiene role="alert" para accesibilidad', () => {
        const { container } = render(
            <VistaDeDia
                avisosHoy={[]}
                avisosAtrasados={[
                    crearAviso({ id: 'atrasado-1', fecha_programada: '2025-07-01' }),
                ]}
                avisosProximos={[]}
                trabajosEnCurso={[]}
            />
        )

        const alertDiv = container.querySelector('[role="alert"]')
        expect(alertDiv).not.toBeNull()
    })
})
