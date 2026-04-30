/**
 * Tests unitarios de formularios.
 *
 * Testeamos la lógica de validación de los formularios de vehículos y avisos:
 * - Matrícula: obligatoria, se convierte a mayúsculas
 * - Teléfono: usa validarTelefono de lib/whatsapp
 * - Fecha: debe ser futura
 * - Tipo de aviso: debe ser un tipo válido
 */
import { describe, it, expect } from 'vitest'
import { validarTelefono } from '@/lib/whatsapp'
import type { TipoAviso } from '@/types/database'

// --- Lógica de validación extraída de las server actions ---

const TIPOS_VALIDOS: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

/**
 * Valida matrícula: obligatoria, se convierte a mayúsculas.
 * Extraída de app/(protected)/vehiculos/actions.ts
 */
function validarMatricula(valor: string | null | undefined): {
    valido: boolean
    matricula: string
    error?: string
} {
    const matricula = (valor?.toString().trim() ?? '').toUpperCase()
    if (!matricula) {
        return { valido: false, matricula, error: 'La matrícula es obligatoria' }
    }
    return { valido: true, matricula }
}

/**
 * Valida que la fecha sea futura.
 * Extraída de app/(protected)/vehiculos/[id]/avisos/actions.ts
 */
function validarFechaFutura(fechaStr: string, hoy: Date): {
    valido: boolean
    error?: string
} {
    if (!fechaStr) {
        return { valido: false, error: 'La fecha del aviso es obligatoria' }
    }

    const hoyNormalizado = new Date(hoy)
    hoyNormalizado.setHours(0, 0, 0, 0)
    const fechaAviso = new Date(fechaStr + 'T00:00:00')

    if (fechaAviso <= hoyNormalizado) {
        return { valido: false, error: 'La fecha del aviso debe ser futura' }
    }

    return { valido: true }
}

/**
 * Valida tipo de aviso.
 * Extraída de las server actions de avisos.
 */
function validarTipoAviso(tipo: string): {
    valido: boolean
    error?: string
} {
    if (!tipo || !TIPOS_VALIDOS.includes(tipo as TipoAviso)) {
        return { valido: false, error: 'Selecciona un tipo de mantenimiento' }
    }
    return { valido: true }
}

// --- Tests ---

describe('Formularios — validación de matrícula', () => {
    it('acepta matrícula válida y la convierte a mayúsculas', () => {
        const resultado = validarMatricula('abc1234')
        expect(resultado.valido).toBe(true)
        expect(resultado.matricula).toBe('ABC1234')
    })

    it('rechaza matrícula vacía', () => {
        const resultado = validarMatricula('')
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La matrícula es obligatoria')
    })

    it('rechaza matrícula null', () => {
        const resultado = validarMatricula(null)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La matrícula es obligatoria')
    })

    it('rechaza matrícula undefined', () => {
        const resultado = validarMatricula(undefined)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La matrícula es obligatoria')
    })

    it('rechaza matrícula con solo espacios', () => {
        const resultado = validarMatricula('   ')
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La matrícula es obligatoria')
    })

    it('elimina espacios y convierte a mayúsculas', () => {
        const resultado = validarMatricula('  abc 1234  ')
        expect(resultado.valido).toBe(true)
        expect(resultado.matricula).toBe('ABC 1234')
    })
})

describe('Formularios — validación de teléfono', () => {
    it('acepta teléfono con prefijo internacional válido', () => {
        expect(validarTelefono('+34612345678')).toBe(true)
    })

    it('acepta teléfono con otro prefijo internacional', () => {
        expect(validarTelefono('+1555123456')).toBe(true)
    })

    it('rechaza teléfono sin prefijo +', () => {
        expect(validarTelefono('34612345678')).toBe(false)
    })

    it('rechaza teléfono vacío', () => {
        expect(validarTelefono('')).toBe(false)
    })

    it('rechaza teléfono con letras', () => {
        expect(validarTelefono('+34abc')).toBe(false)
    })

    it('rechaza solo el signo +', () => {
        expect(validarTelefono('+')).toBe(false)
    })

    it('rechaza teléfono con espacios', () => {
        expect(validarTelefono('+34 612 345 678')).toBe(false)
    })
})

describe('Formularios — validación de fecha futura', () => {
    const hoy = new Date('2025-07-10T10:00:00')

    it('acepta fecha futura', () => {
        const resultado = validarFechaFutura('2025-07-15', hoy)
        expect(resultado.valido).toBe(true)
    })

    it('rechaza fecha de hoy', () => {
        const resultado = validarFechaFutura('2025-07-10', hoy)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La fecha del aviso debe ser futura')
    })

    it('rechaza fecha pasada', () => {
        const resultado = validarFechaFutura('2025-07-01', hoy)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La fecha del aviso debe ser futura')
    })

    it('rechaza fecha vacía', () => {
        const resultado = validarFechaFutura('', hoy)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La fecha del aviso es obligatoria')
    })

    it('acepta fecha de mañana', () => {
        const resultado = validarFechaFutura('2025-07-11', hoy)
        expect(resultado.valido).toBe(true)
    })
})

describe('Formularios — validación de tipo de aviso', () => {
    it('acepta todos los tipos válidos', () => {
        for (const tipo of TIPOS_VALIDOS) {
            const resultado = validarTipoAviso(tipo)
            expect(resultado.valido).toBe(true)
        }
    })

    it('rechaza tipo vacío', () => {
        const resultado = validarTipoAviso('')
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('Selecciona un tipo de mantenimiento')
    })

    it('rechaza tipo inválido', () => {
        const resultado = validarTipoAviso('frenos')
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('Selecciona un tipo de mantenimiento')
    })

    it('rechaza tipo con mayúsculas (case-sensitive)', () => {
        const resultado = validarTipoAviso('ITV')
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('Selecciona un tipo de mantenimiento')
    })
})

// --- Tests de validación de recurrencia (Req 2.1, 2.2, 2.9) ---
// Tests completos del componente SelectorRecurrencia en __tests__/unit/selector-recurrencia.test.tsx

import { validarRecurrenciaMeses } from '@/lib/validaciones'

describe('Formularios — validación de recurrencia', () => {
    it('acepta cadena vacía como null (sin recurrencia)', () => {
        const resultado = validarRecurrenciaMeses('')
        expect(resultado.valido).toBe(true)
        if (resultado.valido) {
            expect(resultado.valor).toBeNull()
        }
    })

    it('acepta valores entre 1 y 36', () => {
        for (const valor of [1, 3, 6, 12, 24, 36]) {
            const resultado = validarRecurrenciaMeses(String(valor))
            expect(resultado.valido).toBe(true)
            if (resultado.valido) {
                expect(resultado.valor).toBe(valor)
            }
        }
    })

    it('rechaza valores fuera de rango', () => {
        for (const valor of [0, -1, 37, 100]) {
            const resultado = validarRecurrenciaMeses(String(valor))
            expect(resultado.valido).toBe(false)
        }
    })

    it('rechaza decimales', () => {
        const resultado = validarRecurrenciaMeses('3.5')
        expect(resultado.valido).toBe(false)
    })
})
