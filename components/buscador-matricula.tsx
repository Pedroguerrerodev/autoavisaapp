'use client'

import { useState } from 'react'
import { Search, X } from 'lucide-react'

interface BuscadorMatriculaProps {
    /** Callback que recibe el texto de búsqueda para filtrar vehículos */
    onFiltrar: (busqueda: string) => void
}

/**
 * Campo de búsqueda por matrícula en la parte superior del dashboard.
 * Filtrado client-side en tiempo real (case-insensitive).
 */
export function BuscadorMatricula({ onFiltrar }: BuscadorMatriculaProps) {
    const [busqueda, setBusqueda] = useState('')

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const valor = e.target.value
        setBusqueda(valor)
        onFiltrar(valor)
    }

    function handleClear() {
        setBusqueda('')
        onFiltrar('')
    }

    return (
        <div className="group relative">
            <Search
                className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500"
                aria-hidden="true"
            />
            <input
                type="text"
                value={busqueda}
                onChange={handleChange}
                placeholder="Buscar por matrícula..."
                aria-label="Buscar vehículo por matrícula"
                className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-10 py-3 text-[15px]
          text-slate-800 placeholder:text-slate-400
          shadow-sm
          transition-all duration-200
          focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:shadow-md"
            />
            {busqueda && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
                    aria-label="Limpiar búsqueda"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
