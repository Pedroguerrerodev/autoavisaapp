'use client'

import { useRouter } from 'next/navigation'
import { Car } from 'lucide-react'
import { Tarjeta } from '@/components/ui/tarjeta'

interface VehiculoCardProps {
    id: string
    matricula: string
    marca: string
    modelo: string
    nombre_cliente: string | null
    telefono_cliente: string
    /** Número de avisos pendientes */
    avisos_pendientes: number
    /** Fecha del próximo aviso (ISO string o null) */
    proximo_aviso: string | null
}

/**
 * Tarjeta de vehículo para el dashboard.
 * Muestra matrícula destacada, datos del cliente, avisos pendientes y próximo aviso.
 * Clic navega a la ficha del vehículo.
 */
export function VehiculoCard({
    id,
    matricula,
    marca,
    modelo,
    nombre_cliente,
    telefono_cliente,
    avisos_pendientes,
    proximo_aviso,
}: VehiculoCardProps) {
    const router = useRouter()

    function handleClick() {
        router.push(`/vehiculos/${id}`)
    }

    return (
        <Tarjeta onClick={handleClick}>
            <div className="flex items-start gap-4">
                {/* License plate styled like a Spanish plate */}
                <div className="flex shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                    <div className="flex h-10 w-2.5 items-center justify-center bg-gradient-to-b from-blue-600 to-blue-700" />
                    <div className="flex h-10 items-center px-3">
                        <span className="text-sm font-bold tracking-wider text-slate-800">
                            {matricula}
                        </span>
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    {/* Marca y modelo */}
                    {(marca || modelo) && (
                        <p className="text-xs font-medium text-slate-500 mb-0.5">
                            {marca} {modelo}
                        </p>
                    )}

                    {/* Nombre del cliente */}
                    <p className="text-sm font-medium text-slate-800 truncate">
                        {nombre_cliente ?? 'Sin nombre'}
                    </p>

                    {/* Teléfono */}
                    <p className="mt-0.5 text-sm text-slate-500">
                        {telefono_cliente}
                    </p>
                </div>

                {/* Badge de avisos pendientes + próximo aviso */}
                <div className="flex flex-col items-end gap-1.5">
                    {avisos_pendientes > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            {avisos_pendientes} {avisos_pendientes === 1 ? 'aviso' : 'avisos'}
                        </span>
                    )}

                    {proximo_aviso && (
                        <span className="text-xs text-slate-400">
                            Próximo: {formatearFecha(proximo_aviso)}
                        </span>
                    )}
                </div>
            </div>
        </Tarjeta>
    )
}

/** Formatea una fecha ISO a formato legible en español (dd/mm/yyyy) */
function formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO + 'T00:00:00')
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })
}
