'use client'

import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'

/** Variantes de estilo del botón */
type BotonVariante = 'primario' | 'secundario' | 'peligro' | 'exito'

/** Tamaños disponibles */
type BotonTamano = 'sm' | 'md' | 'lg'

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: BotonVariante
    tamano?: BotonTamano
    cargando?: boolean
    anchoCompleto?: boolean
    icono?: LucideIcon
    children: ReactNode
}

/** Clases de estilo por variante — premium gradients + shadows */
const clasesVariante: Record<BotonVariante, string> = {
    primario:
        'bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700 hover:shadow-md hover:shadow-blue-500/30 active:from-blue-700 active:to-blue-800 focus-visible:ring-blue-500',
    secundario:
        'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100 focus-visible:ring-slate-400',
    peligro:
        'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm shadow-red-500/25 hover:from-red-600 hover:to-red-700 hover:shadow-md hover:shadow-red-500/30 active:from-red-700 active:to-red-800 focus-visible:ring-red-500',
    exito:
        'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/25 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-md hover:shadow-emerald-500/30 active:from-emerald-700 active:to-emerald-800 focus-visible:ring-emerald-500',
}

/** Clases de tamaño */
const clasesTamano: Record<BotonTamano, string> = {
    sm: 'min-h-[36px] px-3.5 py-1.5 text-sm',
    md: 'min-h-[44px] px-4 py-2.5 text-sm',
    lg: 'min-h-[48px] px-6 py-3 text-[15px]',
}

/**
 * Botón reutilizable con variantes, tamaños y estado de carga.
 * Tamaño mínimo de 44px para accesibilidad táctil.
 */
export function Boton({
    variante = 'primario',
    tamano = 'lg',
    cargando = false,
    anchoCompleto = false,
    icono: Icono,
    children,
    disabled,
    className = '',
    ...props
}: BotonProps) {
    const deshabilitado = disabled || cargando

    return (
        <button
            disabled={deshabilitado}
            className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        tracking-[-0.01em]
        transition-all duration-150 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-40 disabled:saturate-50
        hover:scale-[1.01] active:scale-[0.98]
        ${clasesVariante[variante]}
        ${clasesTamano[tamano]}
        ${anchoCompleto ? 'w-full' : ''}
        ${cargando ? 'animate-pulse-soft' : ''}
        ${className}
      `}
            {...props}
        >
            {cargando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : Icono ? (
                <Icono className="h-4 w-4" aria-hidden="true" />
            ) : null}
            {children}
        </button>
    )
}
