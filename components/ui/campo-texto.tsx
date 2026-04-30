'use client'

import { type InputHTMLAttributes, forwardRef, useId } from 'react'

interface CampoTextoProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
    /** Etiqueta del campo (obligatoria) */
    etiqueta: string
    /** Mensaje de error a mostrar debajo del campo */
    error?: string
    /** Tipo de input */
    type?: 'text' | 'email' | 'password' | 'tel' | 'date'
}

/**
 * Campo de texto reutilizable con etiqueta, indicador de obligatorio y mensaje de error.
 * Tamaño mínimo de 44px para accesibilidad táctil en móvil.
 */
export const CampoTexto = forwardRef<HTMLInputElement, CampoTextoProps>(
    function CampoTexto(
        { etiqueta, error, required, className = '', type = 'text', ...props },
        ref
    ) {
        const id = useId()
        const errorId = `${id}-error`

        return (
            <div className="flex flex-col gap-2">
                <label htmlFor={id} className="text-sm font-medium text-slate-700 tracking-[-0.01em]">
                    {etiqueta}
                    {required && (
                        <span className="ml-0.5 text-red-500" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
                <input
                    ref={ref}
                    id={id}
                    type={type}
                    required={required}
                    aria-invalid={error ? 'true' : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={`
            min-h-[44px] w-full rounded-xl border bg-white px-4 py-2.5 text-[15px]
            text-slate-900 placeholder:text-slate-400
            shadow-sm
            transition-all duration-200
            focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:shadow-md
            hover:border-slate-300
            ${error
                            ? 'border-red-300 bg-red-50/50 focus:border-red-500 focus:ring-red-500/10'
                            : 'border-slate-200'
                        }
            ${className}
          `}
                    {...props}
                />
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
)
