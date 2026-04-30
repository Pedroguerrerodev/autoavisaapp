'use client'

import { type ReactNode, type MouseEvent } from 'react'

interface TarjetaProps {
    children: ReactNode
    /** Sección de cabecera opcional */
    cabecera?: ReactNode
    /** Si se proporciona, la tarjeta es clicable con efecto hover */
    onClick?: (e: MouseEvent<HTMLDivElement>) => void
    /** Clases CSS adicionales */
    className?: string
}

/**
 * Tarjeta reutilizable con fondo blanco, sombra sutil y esquinas redondeadas.
 * Si tiene onClick, se comporta como elemento interactivo con hover.
 */
export function Tarjeta({
    children,
    cabecera,
    onClick,
    className = '',
}: TarjetaProps) {
    const esClicable = !!onClick

    return (
        <div
            role={esClicable ? 'button' : undefined}
            tabIndex={esClicable ? 0 : undefined}
            onClick={onClick}
            onKeyDown={
                esClicable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onClick?.(e as unknown as MouseEvent<HTMLDivElement>)
                        }
                    }
                    : undefined
            }
            className={`
        rounded-2xl bg-white border border-slate-200/80 shadow-sm
        ${esClicable
                    ? 'cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300 active:translate-y-0 active:shadow-sm'
                    : ''
                }
        ${className}
      `}
        >
            {cabecera && (
                <div className="border-b border-slate-100 px-5 py-3.5 sm:px-6">
                    {cabecera}
                </div>
            )}
            <div className="px-5 py-4 sm:px-6">{children}</div>
        </div>
    )
}
