'use client'

import { EMOJI_POR_TIPO, ETIQUETA_TIPO } from '@/lib/whatsapp'
import type { TipoAviso, EstadoAviso } from '@/types/database'

interface AvisoHistorial {
    id: string
    tipo: string
    fecha_programada: string
    fecha_envio: string | null
    estado: string
    es_manual: boolean
}

interface HistorialAvisosProps {
    /** Array de avisos con estado enviado o fallido, ya ordenados por fecha_envio DESC */
    avisos: AvisoHistorial[]
}

/** Colores del badge de estado */
const CLASES_ESTADO: Record<EstadoAviso, string> = {
    pendiente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/80',
    enviado: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
    fallido: 'bg-red-50 text-red-700 ring-1 ring-red-200/80',
}

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
 * Lista de historial de avisos enviados/fallidos.
 */
export function HistorialAvisos({ avisos }: HistorialAvisosProps) {
    if (avisos.length === 0) {
        return (
            <p className="text-sm text-slate-500">
                Aún no hay avisos en el historial.
            </p>
        )
    }

    return (
        <div className="grid gap-3">
            {avisos.map((aviso) => {
                const tipo = aviso.tipo as TipoAviso
                const estado = aviso.estado as EstadoAviso
                const emoji = EMOJI_POR_TIPO[tipo] ?? '🔔'
                const etiquetaTipo = ETIQUETA_TIPO[tipo] ?? aviso.tipo

                return (
                    <div
                        key={aviso.id}
                        className="rounded-2xl border border-slate-200/80 bg-white p-4"
                    >
                        <div className="flex items-start justify-between gap-2">
                            {/* Tipo con emoji */}
                            <div className="flex items-center gap-2.5">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100">
                                    <span className="text-base" aria-hidden="true">{emoji}</span>
                                </div>
                                <span className="font-semibold text-slate-800">{etiquetaTipo}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Indicador manual/automático */}
                                <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200/80">
                                    {aviso.es_manual ? 'Manual' : 'Automático'}
                                </span>

                                {/* Badge de estado */}
                                <span
                                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${CLASES_ESTADO[estado] ?? ''}`}
                                >
                                    <span className={`h-1.5 w-1.5 rounded-full ${DOT_ESTADO[estado] ?? ''}`} />
                                    {ETIQUETA_ESTADO[estado] ?? estado}
                                </span>
                            </div>
                        </div>

                        {/* Fechas */}
                        <div className="mt-2 ml-[46px] flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                            <span className="tabular-nums">Programado: {formatearFecha(aviso.fecha_programada)}</span>
                            {aviso.fecha_envio && (
                                <span className="tabular-nums">Enviado: {formatearFechaHora(aviso.fecha_envio)}</span>
                            )}
                        </div>
                    </div>
                )
            })}
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

/** Formatea un timestamp ISO a formato legible con hora */
function formatearFechaHora(timestampISO: string): string {
    const fecha = new Date(timestampISO)
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
