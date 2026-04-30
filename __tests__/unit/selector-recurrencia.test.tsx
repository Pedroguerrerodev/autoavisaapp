/**
 * Tests unitarios del componente SelectorRecurrencia.
 *
 * Verifica:
 * - Renderizado correcto de opciones
 * - Cambio entre opciones predefinidas y personalizado
 * - Campo numérico con rango 1-36 en modo personalizado
 * - Visualización de errores
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SelectorRecurrencia } from '@/components/selector-recurrencia'

describe('SelectorRecurrencia', () => {
    it('renderiza el selector con la etiqueta "Recurrencia"', () => {
        render(<SelectorRecurrencia valor={null} onChange={() => { }} />)
        expect(screen.getByLabelText('Recurrencia')).toBeDefined()
    })

    it('muestra "Una vez" seleccionado cuando valor es null', () => {
        render(<SelectorRecurrencia valor={null} onChange={() => { }} />)
        const select = screen.getByLabelText('Recurrencia') as HTMLSelectElement
        expect(select.value).toBe('null')
    })

    it('muestra la opción predefinida correcta para valor 3', () => {
        render(<SelectorRecurrencia valor={3} onChange={() => { }} />)
        const select = screen.getByLabelText('Recurrencia') as HTMLSelectElement
        expect(select.value).toBe('3')
    })

    it('muestra la opción predefinida correcta para valor 6', () => {
        render(<SelectorRecurrencia valor={6} onChange={() => { }} />)
        const select = screen.getByLabelText('Recurrencia') as HTMLSelectElement
        expect(select.value).toBe('6')
    })

    it('muestra la opción predefinida correcta para valor 12', () => {
        render(<SelectorRecurrencia valor={12} onChange={() => { }} />)
        const select = screen.getByLabelText('Recurrencia') as HTMLSelectElement
        expect(select.value).toBe('12')
    })

    it('muestra "Personalizado" y campo numérico para valores no predefinidos', () => {
        render(<SelectorRecurrencia valor={5} onChange={() => { }} />)
        const select = screen.getByLabelText('Recurrencia') as HTMLSelectElement
        expect(select.value).toBe('personalizado')
        expect(screen.getByRole('spinbutton')).toBeDefined()
    })

    it('no muestra campo numérico cuando no es personalizado', () => {
        render(<SelectorRecurrencia valor={null} onChange={() => { }} />)
        expect(screen.queryByRole('spinbutton')).toBeNull()
    })

    it('llama onChange con null al seleccionar "Una vez"', () => {
        const onChange = vi.fn()
        render(<SelectorRecurrencia valor={3} onChange={onChange} />)
        fireEvent.change(screen.getByLabelText('Recurrencia'), {
            target: { value: 'null' },
        })
        expect(onChange).toHaveBeenCalledWith(null)
    })

    it('llama onChange con 3 al seleccionar "Cada 3 meses"', () => {
        const onChange = vi.fn()
        render(<SelectorRecurrencia valor={null} onChange={onChange} />)
        fireEvent.change(screen.getByLabelText('Recurrencia'), {
            target: { value: '3' },
        })
        expect(onChange).toHaveBeenCalledWith(3)
    })

    it('llama onChange con 1 al seleccionar "Personalizado"', () => {
        const onChange = vi.fn()
        render(<SelectorRecurrencia valor={null} onChange={onChange} />)
        fireEvent.change(screen.getByLabelText('Recurrencia'), {
            target: { value: 'personalizado' },
        })
        expect(onChange).toHaveBeenCalledWith(1)
    })

    it('campo numérico personalizado tiene min=1 y max=36', () => {
        render(<SelectorRecurrencia valor={5} onChange={() => { }} />)
        const input = screen.getByRole('spinbutton') as HTMLInputElement
        expect(input.min).toBe('1')
        expect(input.max).toBe('36')
    })

    it('campo numérico personalizado muestra el valor actual', () => {
        render(<SelectorRecurrencia valor={18} onChange={() => { }} />)
        const input = screen.getByRole('spinbutton') as HTMLInputElement
        expect(input.value).toBe('18')
    })

    it('clampea valores mayores a 36 en campo personalizado', () => {
        const onChange = vi.fn()
        render(<SelectorRecurrencia valor={5} onChange={onChange} />)
        fireEvent.change(screen.getByRole('spinbutton'), {
            target: { value: '50' },
        })
        expect(onChange).toHaveBeenCalledWith(36)
    })

    it('clampea valores menores a 1 en campo personalizado', () => {
        const onChange = vi.fn()
        render(<SelectorRecurrencia valor={5} onChange={onChange} />)
        fireEvent.change(screen.getByRole('spinbutton'), {
            target: { value: '0' },
        })
        expect(onChange).toHaveBeenCalledWith(1)
    })

    it('muestra mensaje de error cuando se proporciona', () => {
        render(
            <SelectorRecurrencia
                valor={null}
                onChange={() => { }}
                error="La recurrencia es inválida"
            />
        )
        const alert = screen.getByRole('alert')
        expect(alert.textContent).toBe('La recurrencia es inválida')
    })

    it('no muestra mensaje de error cuando no hay error', () => {
        render(<SelectorRecurrencia valor={null} onChange={() => { }} />)
        expect(screen.queryByRole('alert')).toBeNull()
    })

    it('marca el select como aria-invalid cuando hay error', () => {
        render(
            <SelectorRecurrencia
                valor={null}
                onChange={() => { }}
                error="Error"
            />
        )
        expect(
            screen.getByLabelText('Recurrencia').getAttribute('aria-invalid')
        ).toBe('true')
    })

    it('contiene las 5 opciones esperadas', () => {
        render(<SelectorRecurrencia valor={null} onChange={() => { }} />)
        const select = screen.getByLabelText('Recurrencia') as HTMLSelectElement
        const opciones = Array.from(select.options).map((o) => o.text)
        expect(opciones).toEqual([
            'Una vez',
            'Cada 3 meses',
            'Cada 6 meses',
            'Cada 12 meses',
            'Personalizado',
        ])
    })
})
