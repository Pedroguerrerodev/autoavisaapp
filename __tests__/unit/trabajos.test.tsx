/**
 * Tests unitarios para trabajos (TrabajoCard y FormularioTrabajoInline).
 *
 * Verifica:
 * - Botón correcto según estado: "Listo ✅" (en_curso), "Entregado 🤝" (listo), sin botones (entregado) (Req 8.4, 8.5, 8.9)
 * - Formulario inline de creación de trabajo (Req 8.2, 8.3)
 *
 * Validates: Requirements 8.4, 8.5, 8.9
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TrabajoCard } from '@/components/trabajo-card'
import { FormularioTrabajoInline } from '@/app/(protected)/vehiculos/[id]/formulario-trabajo-inline'

// --- Mocks ---

const mockMostrarExito = vi.fn()
const mockMostrarError = vi.fn()

vi.mock('@/components/ui/toast', () => ({
    useToast: () => ({
        mostrarExito: mockMostrarExito,
        mostrarError: mockMostrarError,
    }),
}))

const mockMarcarTrabajoListo = vi.fn()
const mockMarcarTrabajoEntregado = vi.fn()

vi.mock('@/app/(protected)/vehiculos/[id]/trabajos/actions', () => ({
    crearTrabajo: vi.fn().mockResolvedValue({ exito: true, trabajoId: 't-new' }),
    marcarTrabajoListo: (...args: unknown[]) => mockMarcarTrabajoListo(...args),
    marcarTrabajoEntregado: (...args: unknown[]) => mockMarcarTrabajoEntregado(...args),
}))

// --- Helpers ---

const baseProps = {
    id: 't1',
    descripcion: 'Cambio de pastillas de freno',
    matricula: '1234 ABC',
    nombre_cliente: 'Juan García',
    created_at: '2025-01-15T10:00:00Z',
    fecha_listo: null,
    vehiculoId: 'v1',
}

// --- Tests ---

beforeEach(() => {
    vi.clearAllMocks()
    mockMarcarTrabajoListo.mockResolvedValue({ exito: true })
    mockMarcarTrabajoEntregado.mockResolvedValue({ exito: true })
})

describe('TrabajoCard — botón según estado (Req 8.4, 8.5, 8.9)', () => {
    it('muestra botón "Listo ✅" cuando estado es "en_curso"', () => {
        render(<TrabajoCard {...baseProps} estado="en_curso" />)
        expect(screen.getByText('Listo ✅')).toBeDefined()
    })

    it('no muestra botón "Entregado 🤝" cuando estado es "en_curso"', () => {
        render(<TrabajoCard {...baseProps} estado="en_curso" />)
        expect(screen.queryByText('Entregado 🤝')).toBeNull()
    })

    it('muestra botón "Entregado 🤝" cuando estado es "listo"', () => {
        render(
            <TrabajoCard
                {...baseProps}
                estado="listo"
                fecha_listo="2025-01-16T14:00:00Z"
            />
        )
        expect(screen.getByText('Entregado 🤝')).toBeDefined()
    })

    it('no muestra botón "Listo ✅" cuando estado es "listo"', () => {
        render(
            <TrabajoCard
                {...baseProps}
                estado="listo"
                fecha_listo="2025-01-16T14:00:00Z"
            />
        )
        expect(screen.queryByText('Listo ✅')).toBeNull()
    })

    it('no muestra ningún botón de acción cuando estado es "entregado"', () => {
        render(
            <TrabajoCard
                {...baseProps}
                estado="entregado"
                fecha_listo="2025-01-16T14:00:00Z"
            />
        )
        expect(screen.queryByText('Listo ✅')).toBeNull()
        expect(screen.queryByText('Entregado 🤝')).toBeNull()
    })

    it('muestra la descripción del trabajo', () => {
        render(<TrabajoCard {...baseProps} estado="en_curso" />)
        expect(screen.getByText('Cambio de pastillas de freno')).toBeDefined()
    })

    it('muestra la matrícula del vehículo', () => {
        render(<TrabajoCard {...baseProps} estado="en_curso" />)
        expect(screen.getByText('1234 ABC')).toBeDefined()
    })

    it('muestra "Sin nombre" cuando nombre_cliente es null', () => {
        render(
            <TrabajoCard {...baseProps} estado="en_curso" nombre_cliente={null} />
        )
        expect(screen.getByText('Sin nombre')).toBeDefined()
    })

    it('muestra badge "En curso" cuando estado es "en_curso"', () => {
        render(<TrabajoCard {...baseProps} estado="en_curso" />)
        expect(screen.getByText('En curso')).toBeDefined()
    })

    it('muestra badge "Listo" cuando estado es "listo"', () => {
        render(
            <TrabajoCard
                {...baseProps}
                estado="listo"
                fecha_listo="2025-01-16T14:00:00Z"
            />
        )
        expect(screen.getByText('Listo')).toBeDefined()
    })

    it('muestra badge "Entregado" cuando estado es "entregado"', () => {
        render(
            <TrabajoCard
                {...baseProps}
                estado="entregado"
                fecha_listo="2025-01-16T14:00:00Z"
            />
        )
        expect(screen.getByText('Entregado')).toBeDefined()
    })
})

describe('TrabajoCard — acciones (Req 8.5, 8.9)', () => {
    it('llama a marcarTrabajoListo al hacer clic en "Listo ✅"', async () => {
        render(<TrabajoCard {...baseProps} estado="en_curso" />)

        fireEvent.click(screen.getByText('Listo ✅'))

        await waitFor(() => {
            expect(mockMarcarTrabajoListo).toHaveBeenCalledWith('t1', 'v1')
        })
    })

    it('muestra toast de éxito al marcar como listo', async () => {
        render(<TrabajoCard {...baseProps} estado="en_curso" />)

        fireEvent.click(screen.getByText('Listo ✅'))

        await waitFor(() => {
            expect(mockMostrarExito).toHaveBeenCalledWith(
                'Trabajo marcado como listo — cliente notificado por WhatsApp'
            )
        })
    })

    it('muestra toast de error si marcarTrabajoListo falla', async () => {
        mockMarcarTrabajoListo.mockResolvedValue({
            exito: false,
            error: 'Solo se pueden marcar como listo los trabajos en curso',
        })

        render(<TrabajoCard {...baseProps} estado="en_curso" />)

        fireEvent.click(screen.getByText('Listo ✅'))

        await waitFor(() => {
            expect(mockMostrarError).toHaveBeenCalledWith(
                'Solo se pueden marcar como listo los trabajos en curso'
            )
        })
    })

    it('llama a marcarTrabajoEntregado al hacer clic en "Entregado 🤝"', async () => {
        render(
            <TrabajoCard
                {...baseProps}
                estado="listo"
                fecha_listo="2025-01-16T14:00:00Z"
            />
        )

        fireEvent.click(screen.getByText('Entregado 🤝'))

        await waitFor(() => {
            expect(mockMarcarTrabajoEntregado).toHaveBeenCalledWith('t1', 'v1')
        })
    })

    it('muestra toast de éxito al marcar como entregado', async () => {
        render(
            <TrabajoCard
                {...baseProps}
                estado="listo"
                fecha_listo="2025-01-16T14:00:00Z"
            />
        )

        fireEvent.click(screen.getByText('Entregado 🤝'))

        await waitFor(() => {
            expect(mockMostrarExito).toHaveBeenCalledWith(
                'Trabajo marcado como entregado'
            )
        })
    })
})

describe('FormularioTrabajoInline — creación de trabajo (Req 8.2, 8.3)', () => {
    it('muestra botón "Registrar Trabajo" inicialmente', () => {
        render(<FormularioTrabajoInline vehiculoId="v1" />)
        expect(screen.getByText('+ Registrar Trabajo')).toBeDefined()
    })

    it('muestra formulario al hacer clic en "Registrar Trabajo"', () => {
        render(<FormularioTrabajoInline vehiculoId="v1" />)

        fireEvent.click(screen.getByText('+ Registrar Trabajo'))

        expect(screen.getByLabelText('Descripción del trabajo')).toBeDefined()
        expect(screen.getByText('Guardar')).toBeDefined()
        expect(screen.getByText('Cancelar')).toBeDefined()
    })

    it('muestra error si se envía sin descripción', () => {
        render(<FormularioTrabajoInline vehiculoId="v1" />)

        fireEvent.click(screen.getByText('+ Registrar Trabajo'))

        const form = screen.getByText('Guardar').closest('form')!
        fireEvent.submit(form)

        expect(mockMostrarError).toHaveBeenCalledWith(
            'La descripción del trabajo es obligatoria'
        )
    })

    it('cierra el formulario al hacer clic en "Cancelar"', () => {
        render(<FormularioTrabajoInline vehiculoId="v1" />)

        fireEvent.click(screen.getByText('+ Registrar Trabajo'))
        expect(screen.getByLabelText('Descripción del trabajo')).toBeDefined()

        fireEvent.click(screen.getByText('Cancelar'))
        expect(screen.queryByLabelText('Descripción del trabajo')).toBeNull()
        expect(screen.getByText('+ Registrar Trabajo')).toBeDefined()
    })

    it('muestra toast de éxito y cierra formulario tras crear trabajo', async () => {
        render(<FormularioTrabajoInline vehiculoId="v1" />)

        fireEvent.click(screen.getByText('+ Registrar Trabajo'))

        const input = screen.getByLabelText('Descripción del trabajo')
        fireEvent.change(input, { target: { value: 'Cambio de aceite' } })

        const form = screen.getByText('Guardar').closest('form')!
        fireEvent.submit(form)

        await waitFor(() => {
            expect(mockMostrarExito).toHaveBeenCalledWith(
                'Trabajo registrado correctamente'
            )
        })

        // Formulario se cierra y vuelve a mostrar el botón
        await waitFor(() => {
            expect(screen.getByText('+ Registrar Trabajo')).toBeDefined()
        })
    })
})
