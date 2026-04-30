'use client'

import Link from 'next/link'
import { Plus, Bell, ArrowLeft, Pencil } from 'lucide-react'
import { Boton } from '@/components/ui/boton'

/**
 * Botones de acción del vehículo — Client Component para iconos Lucide.
 */
export function VehiculoAcciones({ vehiculoId }: { vehiculoId: string }) {
    return (
        <div className="flex flex-col gap-2.5 sm:flex-row">
            <Link href={`/vehiculos/${vehiculoId}/editar`} className="flex-1">
                <Boton anchoCompleto variante="secundario" tamano="md" icono={Pencil}>
                    Editar
                </Boton>
            </Link>
            <Link href={`/vehiculos/${vehiculoId}/avisos/nuevo`} className="flex-1">
                <Boton anchoCompleto icono={Plus} tamano="md">
                    Nuevo Aviso
                </Boton>
            </Link>
            <Link href={`/vehiculos/${vehiculoId}/enviar-aviso`} className="flex-1">
                <Boton anchoCompleto variante="exito" tamano="md" icono={Bell}>
                    Enviar Aviso
                </Boton>
            </Link>
        </div>
    )
}

export function BotonVolver() {
    return (
        <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-700 hover:shadow active:scale-95"
            aria-label="Volver al dashboard"
        >
            <ArrowLeft className="h-5 w-5" />
        </Link>
    )
}
