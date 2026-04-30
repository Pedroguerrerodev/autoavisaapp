'use client'

import { useState } from 'react'
import { Boton } from '@/components/ui/boton'
import { useToast } from '@/components/ui/toast'
import { marcarTrabajoListo, marcarTrabajoEntregado } from '@/app/(protected)/vehiculos/[id]/trabajos/actions'
import type { EstadoTrabajo } from '@/types/database'

interface TrabajoCardProps {
    id: string
    descripcion: string
    estado: EstadoTrabajo
    matricula: string
    nombre_cliente: string | null
    created_at: string
    fecha_listo: string | null
    vehiculoId: string
}

/** Etiquetas de estado en español */
const ETIQUETA_ESTADO: Record<EstadoTrabajo, string> = {
    en_curso: 'En curso',
    listo: 'Listo',
    entregado: 'Entregado',
}

/** Clases del badge de estado */
const CLASES_ESTADO: Record<EstadoTrabajo, string> = {
    en_curso: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',
    listo: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
    entregado: 'bg-slate-50 text-slate-500 ring-1 ring-slate-200/80',
}

/** Dot colors */
const DOT_ESTADO: Record<EstadoTrabajo, string> = {
    en_curso: 'bg-blue-400',
    listo: 'bg-emerald-400',
    entregado: 'bg-slate-300',
}

/**
 * Tarjeta de trabajo con botón de acción según estado.
 */
export function TrabajoCard({
    id,
    descripcion,
    estado,
    matricula,
    nombre_cliente,
    created_at,
    fecha_listo,
    vehiculoId,
}: TrabajoCardProps) {
    const { mostrarExito, mostrarError } = useToast()
    const [cargando, setCargando] = useState(false)

    const esCompletado = estado === 'entregado'

    async function handleListo() {
        setCargando(true)
        try {
            const resultado = await marcarTrabajoListo(id, vehiculoId)
            if (resultado.exito) {
                mostrarExito('Trabajo marcado como listo — cliente notificado por WhatsApp')
                if (resultado.advertencia) {
                    mostrarError(resultado.advertencia)
                }
            } else {
                mostrarError(resultado.error ?? 'Error al marcar el trabajo como listo')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    async function handleEntregado() {
        setCargando(true)
        try {
            const resultado = await marcarTrabajoEntregado(id, vehiculoId)
            if (resultado.exito) {
                mostrarExito('Trabajo marcado como entregado')
            } else {
                mostrarError(resultado.error ?? 'Error al marcar el trabajo como entregado')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    return (
        <div className={`rounded-2xl border bg-white p-4 transition-all duration-200 ${esCompletado ? 'border-slate-100 opacity-60' : 'border-slate-200/80 shadow-sm'}`}>
            {/* Status timeline dot */}
            <div className="flex items-start gap-3">
                <div className="flex flex-col items-center pt-1">
                    <div className={`h-3 w-3 rounded-full ring-4 ring-white ${DOT_ESTADO[estado]}`} />
                    {!esCompletado && <div className="mt-1 h-8 w-0.5 bg-slate-100 rounded-full" />}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Cabecera: descripción + badge de estado */}
                    <div className="flex items-start justify-between gap-2">
                        <span className={`font-semibold ${esCompletado ? 'text-slate-400' : 'text-slate-800'}`}>
                            {descripcion}
                        </span>
                        <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${CLASES_ESTADO[estado]}`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${DOT_ESTADO[estado]}`} />
                            {ETIQUETA_ESTADO[estado]}
                        </span>
                    </div>

                    {/* Datos del vehículo y fechas */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-500">
                        <span className="font-medium text-slate-600">{matricula}</span>
                        <span className="text-slate-300">·</span>
                        <span>{nombre_cliente ?? 'Sin nombre'}</span>
                        <span className="text-slate-300">·</span>
                        <span className="tabular-nums">{formatearFecha(created_at)}</span>
                        {fecha_listo && (
                            <>
                                <span className="text-slate-300">·</span>
                                <span className="text-emerald-600">✓ {formatearFecha(fecha_listo)}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Botón de acción según estado */}
            {estado === 'en_curso' && (
                <div className="mt-4 ml-6">
                    <Boton
                        variante="exito"
                        tamano="lg"
                        anchoCompleto
                        cargando={cargando}
                        onClick={handleListo}
                    >
                        Listo ✅
                    </Boton>
                </div>
            )}

            {estado === 'listo' && (
                <div className="mt-4 ml-6">
                    <Boton
                        variante="secundario"
                        tamano="md"
                        anchoCompleto
                        cargando={cargando}
                        onClick={handleEntregado}
                    >
                        Entregado 🤝
                    </Boton>
                </div>
            )}
        </div>
    )
}

/** Formatea una fecha ISO a formato legible en español */
function formatearFecha(fechaISO: string): string {
    const fecha = new Date(fechaISO)
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
