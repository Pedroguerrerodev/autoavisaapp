'use client'

import { LogOut } from 'lucide-react'
import { cerrarSesion } from './actions'

/**
 * Header de la app — Client Component para poder usar iconos Lucide.
 * Sticky with backdrop blur and gradient bottom border.
 */
export function Header({ nombreUsuario }: { nombreUsuario: string }) {
    // Generate initials from name
    const iniciales = nombreUsuario
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <img src="/logo-autoavisa.jpg" alt="AutoAvisa" className="h-8 w-8 rounded-lg object-cover shadow-sm" />
                    <h1 className="text-lg font-bold tracking-tight text-slate-900">
                        AutoAvisa
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* User avatar + name */}
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80">
                            {iniciales}
                        </div>
                        <span className="hidden text-sm font-medium text-slate-600 sm:inline">
                            {nombreUsuario}
                        </span>
                    </div>

                    {/* Logout */}
                    <form action={cerrarSesion}>
                        <button
                            type="submit"
                            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-700 hover:shadow active:scale-[0.97]"
                        >
                            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                            <span className="hidden sm:inline">Salir</span>
                        </button>
                    </form>
                </div>
            </div>
        </header>
    )
}
