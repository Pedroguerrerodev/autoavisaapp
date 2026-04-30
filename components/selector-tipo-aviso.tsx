'use client'

import { EMOJI_POR_TIPO, ETIQUETA_TIPO } from '@/lib/whatsapp'
import type { TipoAviso } from '@/types/database'

/** Todos los tipos de aviso disponibles */
const TIPOS: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

interface SelectorTipoAvisoProps {
    /** Valor seleccionado actualmente */
    valor: TipoAviso | ''
    /** Callback cuando cambia la selección */
    onChange: (tipo: TipoAviso) => void
    /** Mensaje de error a mostrar */
    error?: string
    /** Nombre del campo para FormData */
    name?: string
}

/**
 * Selector de tipo de mantenimiento con emojis.
 * Botones/tarjetas grandes y touch-friendly para selección fácil en móvil.
 */
export function SelectorTipoAviso({
    valor,
    onChange,
    error,
    name = 'tipo',
}: SelectorTipoAvisoProps) {
    return (
        <div className="flex flex-col gap-2.5">
            <label className="text-sm font-medium text-slate-700 tracking-[-0.01em]">
                Tipo de mantenimiento
                <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
            </label>

            {/* Input oculto para FormData */}
            <input type="hidden" name={name} value={valor} />

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TIPOS.map((tipo) => {
                    const seleccionado = valor === tipo
                    const emoji = EMOJI_POR_TIPO[tipo]
                    const etiqueta = ETIQUETA_TIPO[tipo]

                    return (
                        <button
                            key={tipo}
                            type="button"
                            onClick={() => onChange(tipo)}
                            className={`flex items-center gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left transition-all duration-150 ${seleccionado
                                ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-sm shadow-blue-500/10 scale-[1.02]'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]'
                                }`}
                            aria-pressed={seleccionado}
                        >
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${seleccionado ? 'bg-blue-100' : 'bg-slate-50'}`}>
                                <span className="text-base" aria-hidden="true">{emoji}</span>
                            </div>
                            <span className="text-sm">{etiqueta}</span>
                        </button>
                    )
                })}
            </div>

            {error && (
                <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 shrink-0 text-red-500" viewBox="0 0 16 16" fill="currentColor">
                        <path fillRule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14ZM8 4a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                    </svg>
                    <p role="alert" className="text-sm text-red-600 font-medium">
                        {error}
                    </p>
                </div>
            )}
        </div>
    )
}
