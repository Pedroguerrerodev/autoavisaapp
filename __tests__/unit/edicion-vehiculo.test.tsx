/**
 * Tests unitarios para edición de vehículos.
 *
 * Verifica:
 * - Pre-relleno de campos en modo edición (Req 4.2)
 * - Validación de matrícula duplicada (Req 4.4)
 * - Cancelación descarta cambios (Req 4.6)
 *
 * Validates: Requirements 4.2, 4.4, 4.6
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { FormularioVehiculo } from '@/components/formulario-vehiculo'

// --- Mocks ---

const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        back: mockBack,
    }),
}))

const mockMostrarExito = vi.fn()
const mockMostrarError = vi.fn()

vi.mock('@/components/ui/toast', () => ({
    useToast: () => ({
        mostrarExito: mockMostrarExito,
        mostrarError: mockMostrarError,
    }),
}))

// --- Helpers ---

const datosIniciales = {
    matricula: '1234 ABC',
    telefono_cliente: '+34612345678',
    nombre_cliente: 'Juan García',
    notas: 'Coche azul, puerta rayada',
}

function renderFormularioEdicion(
    action: (formData: FormData) => Promise<{ exito: boolean; error?: string; vehiculoId?: string }> = async () => ({ exito: true, vehiculoId: 'v1' })
) {
    return render(
        <FormularioVehiculo
            vehiculoId="v1"
            datosIniciales={datosIniciales}
            action={action}
        />
    )
}

function renderFormularioCreacion(
    action: (formData: FormData) => Promise<{ exito: boolean; error?: string; vehiculoId?: string }> = async () => ({ exito: true, vehiculoId: 'v1' })
) {
    return render(
        <FormularioVehiculo action={action} />
    )
}

// --- Tests ---

beforeEach(() => {
    vi.clearAllMocks()
})

describe('Edición de vehículos — pre-relleno de campos (Req 4.2)', () => {
    it('pre-rellena la matrícula con el valor de datosIniciales', () => {
        renderFormularioEdicion()
        const input = screen.getByDisplayValue('1234 ABC') as HTMLInputElement
        expect(input).toBeDefined()
        expect(input.value).toBe('1234 ABC')
    })

    it('pre-rellena el teléfono con el valor de datosIniciales', () => {
        renderFormularioEdicion()
        const input = screen.getByDisplayValue('+34612345678') as HTMLInputElement
        expect(input).toBeDefined()
        expect(input.value).toBe('+34612345678')
    })

    it('pre-rellena el nombre del cliente con el valor de datosIniciales', () => {
        renderFormularioEdicion()
        const input = screen.getByDisplayValue('Juan García') as HTMLInputElement
        expect(input).toBeDefined()
        expect(input.value).toBe('Juan García')
    })

    it('pre-rellena las notas con el valor de datosIniciales', () => {
        renderFormularioEdicion()
        const textarea = screen.getByDisplayValue('Coche azul, puerta rayada') as HTMLTextAreaElement
        expect(textarea).toBeDefined()
        expect(textarea.value).toBe('Coche azul, puerta rayada')
    })

    it('muestra "Guardar Cambios" como texto del botón en modo edición', () => {
        renderFormularioEdicion()
        expect(screen.getByText('Guardar Cambios')).toBeDefined()
    })

    it('muestra "Guardar Vehículo" como texto del botón en modo creación', () => {
        renderFormularioCreacion()
        expect(screen.getByText('Guardar Vehículo')).toBeDefined()
    })

    it('campos vacíos cuando no hay datosIniciales (modo creación)', () => {
        renderFormularioCreacion()
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        for (const input of inputs) {
            expect(input.value).toBe('')
        }
    })
})

describe('Edición de vehículos — validación de matrícula duplicada (Req 4.4)', () => {
    it('muestra error cuando la action retorna matrícula duplicada', async () => {
        const actionDuplicada = vi.fn().mockResolvedValue({
            exito: false,
            error: 'Esta matrícula ya está registrada en otro vehículo.',
            vehiculoId: 'v-existente',
        })

        renderFormularioEdicion(actionDuplicada)

        const form = screen.getByText('Guardar Cambios').closest('form')!
        fireEvent.submit(form)

        await waitFor(() => {
            expect(actionDuplicada).toHaveBeenCalled()
            expect(mockMostrarError).toHaveBeenCalledWith(
                'Esta matrícula ya está registrada en otro vehículo.'
            )
        })
    })

    it('valida client-side que la matrícula no esté vacía', () => {
        renderFormularioCreacion()

        // In creation mode, matrícula is empty — submit should show client-side error
        const form = screen.getByText('Guardar Vehículo').closest('form')!
        fireEvent.submit(form)

        // Client-side validation sets error state synchronously
        expect(screen.getByText('La matrícula es obligatoria')).toBeDefined()
    })

    it('valida client-side que el teléfono tenga formato internacional', () => {
        renderFormularioCreacion()

        // Fill matrícula but put invalid phone
        const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
        // First textbox is matrícula
        fireEvent.change(inputs[0], { target: { value: 'ABC1234' } })

        // Phone input is type="tel", not textbox — find it by placeholder
        const telefonoInput = screen.getByPlaceholderText('+34612345678') as HTMLInputElement
        fireEvent.change(telefonoInput, { target: { value: '612345678' } })

        const form = screen.getByText('Guardar Vehículo').closest('form')!
        fireEvent.submit(form)

        expect(
            screen.getByText('Introduce un teléfono válido con prefijo internacional (ej: +34612345678)')
        ).toBeDefined()
    })

    it('redirige a la ficha del vehículo existente cuando hay duplicado con vehiculoId', async () => {
        const actionDuplicada = vi.fn().mockResolvedValue({
            exito: false,
            error: 'Este vehículo ya está registrado.',
            vehiculoId: 'v-existente',
        })

        renderFormularioEdicion(actionDuplicada)

        const form = screen.getByText('Guardar Cambios').closest('form')!
        fireEvent.submit(form)

        // Wait for the action to be called and error shown
        await waitFor(() => {
            expect(mockMostrarError).toHaveBeenCalledWith('Este vehículo ya está registrado.')
        })

        // The setTimeout redirect happens after 1500ms — advance time
        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith('/vehiculos/v-existente')
        }, { timeout: 3000 })
    })
})

describe('Edición de vehículos — cancelación (Req 4.6)', () => {
    it('muestra botón "Cancelar"', () => {
        renderFormularioEdicion()
        expect(screen.getByText('Cancelar')).toBeDefined()
    })

    it('navega atrás al hacer clic en "Cancelar"', () => {
        renderFormularioEdicion()
        const botonCancelar = screen.getByText('Cancelar')
        fireEvent.click(botonCancelar)
        expect(mockBack).toHaveBeenCalledTimes(1)
    })

    it('no llama a la action al cancelar', () => {
        const action = vi.fn()
        renderFormularioEdicion(action)
        const botonCancelar = screen.getByText('Cancelar')
        fireEvent.click(botonCancelar)
        expect(action).not.toHaveBeenCalled()
    })

    it('muestra toast de éxito y navega a la ficha tras guardar correctamente', async () => {
        const actionExitosa = vi.fn().mockResolvedValue({
            exito: true,
            vehiculoId: 'v1',
        })

        renderFormularioEdicion(actionExitosa)

        const form = screen.getByText('Guardar Cambios').closest('form')!
        fireEvent.submit(form)

        await waitFor(() => {
            expect(mockMostrarExito).toHaveBeenCalledWith('Vehículo actualizado correctamente')
            expect(mockPush).toHaveBeenCalledWith('/vehiculos/v1')
        })
    })
})
