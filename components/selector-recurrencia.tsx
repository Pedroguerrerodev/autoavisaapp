'use client'

import { useId } from 'react'

/** Opciones predefinidas del selector de recurrencia */
const OPCIONES_RECURRENCIA = [
    { valor: 'null', etiqueta: 'Una vez' },
    { valor: '3', etiqueta: 'Cada 3 meses' },
    { valor: '6', etiqueta: 'Cada 6 meses' },
    { valor: '12', etiqueta: 'Cada 12 meses' },
    { valor: 'personalizado', etiqueta: 'Personalizado' },
] as const

interface SelectorRecurrenciaProps {
    /** Valor actual: null = una vez, número = meses de recurrencia */
    valor: number | null
    /** Callback cuando cambia la selección */
    onChange: (meses: number | null) => void
    /** Mensaje de error a mostrar */
    error?: string
}

/**
 * Determina el valor del <select> a partir del valor numérico.
 */
function obtenerValorSelect(valor: number | null): string {
    if (valor === null) return 'null'
    if (valor === 3 || valor === 6 || valor === 12) return String(valor)
    return 'personalizado'
}

/**
 * Selector de recurrencia para formularios de avisos.
 */
export function SelectorRecurrencia({
    valor,
    onChange,
    error,
}: SelectorRecurrenciaProps) {
    const id = useId()
    const errorId = `${id}-error`
    const customId = `${id}-custom`

    const valorSelect = obtenerValorSelect(valor)
    const esPersonalizado = valorSelect === 'personalizado'

    function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const seleccion = e.target.value
        if (seleccion === 'null') {
            onChange(null)
        } else if (seleccion === 'personalizado') {
            onChange(1)
        } else {
            onChange(Number(seleccion))
        }
    }

    function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
        const raw = e.target.value
        if (raw === '') {
            onChange(1)
            return
        }
        const num = parseInt(raw, 10)
        if (!isNaN(num)) {
            onChange(Math.max(1, Math.min(36, num)))
        }
    }

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-medium text-slate-700 tracking-[-0.01em]">
                Recurrencia
            </label>

            <select
                id={id}
                value={valorSelect}
                onChange={handleSelectChange}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? errorId : undefined}
                className={`
                    min-h-[44px] w-full rounded-xl border px-4 py-2.5 text-[15px]
                    bg-white text-slate-900
                    shadow-sm
                    transition-all duration-200
                    focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:shadow-md
                    hover:border-slate-300
                    ${error
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                        : 'border-slate-200'
                    }
                `}
            >
                {OPCIONES_RECURRENCIA.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                    </option>
                ))}
            </select>

            {esPersonalizado && (
                <div className="flex items-center gap-2.5">
                    <label htmlFor={customId} className="text-sm text-slate-500 whitespace-nowrap">
                        Cada
                    </label>
                    <input
                        id={customId}
                        type="number"
                        min={1}
                        max={36}
                        value={valor ?? 1}
                        onChange={handleCustomChange}
                        aria-invalid={error ? 'true' : undefined}
                        aria-describedby={error ? errorId : undefined}
                        className={`
                            min-h-[44px] w-20 rounded-xl border px-3 py-2.5 text-[15px] text-center
                            bg-white text-slate-900
                            shadow-sm
                            transition-all duration-200
                            focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:shadow-md
                            hover:border-slate-300
                            ${error
                                ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10'
                                : 'border-slate-200'
                            }
                        `}
                    />
                    <span className="text-sm text-slate-500">meses</span>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-red-500" viewBox="0 0 16 16" fill="currentColor">
                        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                    <p id={errorId} role="alert" className="text-sm text-red-600 font-medium">
                        {error}
                    </p>
                </div>
            )}
        </div>
    )
}
