'use client'

import { EMOJI_POR_TIPO, ETIQUETA_TIPO } from '@/lib/whatsapp'
import type { TipoAviso, EstadoAviso } from '@/types/database'

interface AvisoCardProps {
    tipo: TipoAviso
    fecha_programada: string
    estado: EstadoAviso
    matricula: string
    nombre_cliente: string | null
    /** Si true, destaca visualmente (aviso dentro de los próximos 7 días) */
    destacado?: boolean
    /** Intervalo de recurrencia en meses (null = aviso de una sola vez) */
    recurrencia_meses?: number | null
}

/** Colores del badge de estado */
const CLASES_ESTADO: Record<EstadoAviso, string> = {
    pendiente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',
    enviado: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
    fallido: 'bg-red-50 text-red-700 ring-1 ring-red-200/80',
}

/** Dot colors for status */
const DOT_ESTADO: Record<EstadoAviso, string> = {
    pendiente: 'bg-amber-400',
    enviado: 'bg-emerald-400',
    fallido: 'bg-red-400',
}

/** Etiquetas de estado en español */
const ETIQUETA_ESTADO: Record<EstadoAviso, string> = {
    pendiente: 'Pendiente',
    enviado: 'Enviado',
    fallido: 'Fallido',
}

/**
 * Tarjeta de aviso individual.
 * Muestra tipo con emoji, fecha programada, estado y datos del vehículo/cliente.
 * Borde/fondo destacado si está dentro de los próximos 7 días.
 */
export function AvisoCard({
    tipo,
    fecha_programada,
    estado,
    matricula,
    nombre_cliente,
    destacado = false,
    recurrencia_meses,
}: AvisoCardProps) {
    const emoji = EMOJI_POR_TIPO[tipo] ?? '🔔'
    const etiquetaTipo = ETIQUETA_TIPO[tipo] ?? tipo

    return (
        <div
            className={`rounded-2xl border p-4 transition-all duration-200 ${destacado
                ? 'border-blue-200 bg-gradient-to-r from-blue-50/80 to-white shadow-sm'
                : 'border-slate-200/80 bg-white'
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                {/* Tipo con emoji in colored circle */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100">
                        <span className="text-lg" aria-hidden="true">{emoji}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-slate-800">{etiquetaTipo}</span>
                        {recurrencia_meses != null && (
                            <span
                                className="ml-2 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-100"
                                title={`Recurrente cada ${recurrencia_meses} meses`}
                                aria-label={`Recurrente cada ${recurrencia_meses} meses`}
                            >
                                🔁 {recurrencia_meses}m
                            </span>
                        )}
                    </div>
                </div>

                {/* Badge de estado with dot */}
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${CLASES_ESTADO[estado]}`}
                >
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT_ESTADO[estado]}`} />
                    {ETIQUETA_ESTADO[estado]}
                </span>
            </div>

            {/* Datos del vehículo y fecha */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span className="font-medium text-slate-700">{matricula}</span>
                <span className="text-slate-300">·</span>
                <span>{nombre_cliente ?? 'Sin nombre'}</span>
                <span className="text-slate-300">·</span>
                <span className="tabular-nums">{formatearFecha(fecha_programada)}</span>
            </div>
        </div>
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
