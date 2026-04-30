'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { eliminarAviso } from './avisos/actions'

interface EliminarAvisoBotonProps {
    avisoId: string
    vehiculoId: string
}

/**
 * Botón para eliminar un aviso con diálogo de confirmación en español.
 */
export function EliminarAvisoBoton({ avisoId, vehiculoId }: EliminarAvisoBotonProps) {
    const { mostrarExito, mostrarError } = useToast()
    const [cargando, setCargando] = useState(false)

    async function handleEliminar() {
        const confirmado = window.confirm(
            '¿Estás seguro de que quieres eliminar este aviso? Esta acción no se puede deshacer.'
        )

        if (!confirmado) return

        setCargando(true)
        try {
            const resultado = await eliminarAviso(avisoId, vehiculoId)
            if (resultado.exito) {
                mostrarExito('Aviso eliminado correctamente')
            } else {
                mostrarError(resultado.error ?? 'Error al eliminar el aviso')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    return (
        <button
            onClick={handleEliminar}
            disabled={cargando}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all disabled:opacity-50"
            aria-label="Eliminar aviso"
            title="Eliminar aviso"
        >
            <Trash2 className="h-4 w-4" />
        </button>
    )
}
