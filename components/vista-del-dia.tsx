'use client'

import { useState } from 'react'
import { Boton } from '@/components/ui/boton'
import { useToast } from '@/components/ui/toast'
import { EMOJI_POR_TIPO, ETIQUETA_TIPO } from '@/lib/whatsapp'
import { enviarAvisoAhora, posponerAviso, marcarAvisoHecho } from '@/app/(protected)/dashboard/actions'
import { marcarTrabajoListo } from '@/app/(protected)/vehiculos/[id]/trabajos/actions'
import type { TipoAviso } from '@/types/database'

/**
 * Aviso con datos del vehículo para la Vista del Día.
 */
export interface AvisoConVehiculo {
    id: string
    tipo: TipoAviso
    fecha_programada: string
    vehiculo_id: string
    matricula: string
    nombre_cliente: string | null
    recurrencia_meses: number | null
}

/**
 * Trabajo con datos del vehículo para la Vista del Día.
 */
export interface TrabajoConVehiculo {
    id: string
    descripcion: string
    vehiculo_id: string
    matricula: string
    nombre_cliente: string | null
    created_at: string
}

interface VistaDiaProps {
    avisosHoy: AvisoConVehiculo[]
    avisosAtrasados: AvisoConVehiculo[]
    avisosProximos: AvisoConVehiculo[]
    trabajosEnCurso: TrabajoConVehiculo[]
}

/**
 * Vista del Día — componente principal del dashboard.
 */
export function VistaDeDia({
    avisosHoy,
    avisosAtrasados,
    avisosProximos,
    trabajosEnCurso,
}: VistaDiaProps) {
    const sinAvisos =
        avisosHoy.length === 0 &&
        avisosAtrasados.length === 0 &&
        avisosProximos.length === 0

    return (
        <div className="space-y-6">
            {/* Contadores numéricos — premium stat cards */}
            <div className="grid grid-cols-3 gap-3">
                <ContadorSeccion
                    etiqueta="Hoy"
                    cantidad={avisosHoy.length}
                    icono="📋"
                    colorClase="from-blue-500 to-blue-600"
                    bgClase="bg-blue-50"
                    textClase="text-blue-700"
                />
                <ContadorSeccion
                    etiqueta="Atrasados"
                    cantidad={avisosAtrasados.length}
                    icono="⚠️"
                    colorClase={avisosAtrasados.length > 0 ? 'from-red-500 to-red-600' : 'from-slate-300 to-slate-400'}
                    bgClase={avisosAtrasados.length > 0 ? 'bg-red-50' : 'bg-slate-50'}
                    textClase={avisosAtrasados.length > 0 ? 'text-red-700' : 'text-slate-500'}
                />
                <ContadorSeccion
                    etiqueta="7 días"
                    cantidad={avisosProximos.length}
                    icono="📅"
                    colorClase="from-emerald-500 to-emerald-600"
                    bgClase="bg-emerald-50"
                    textClase="text-emerald-700"
                />
            </div>

            {/* Sección: Trabajos en Curso */}
            {trabajosEnCurso.length > 0 && (
                <SeccionTrabajos trabajos={trabajosEnCurso} />
            )}

            {/* Mensaje de celebración si no hay avisos */}
            {sinAvisos && (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-800">
                        ¡No hay avisos pendientes!
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Todo al día. Buen trabajo.
                    </p>
                </div>
            )}

            {/* Sección: Avisos Atrasados */}
            {avisosAtrasados.length > 0 && (
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-800">
                            Avisos Atrasados
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                            {avisosAtrasados.length}
                        </span>
                    </div>
                    <div
                        className="rounded-2xl border border-red-200/80 bg-gradient-to-r from-red-50/80 to-orange-50/40 p-4"
                        role="alert"
                    >
                        <div className="grid gap-3">
                            {avisosAtrasados.map((aviso) => (
                                <TarjetaAviso key={aviso.id} aviso={aviso} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Sección: Avisos de Hoy */}
            {avisosHoy.length > 0 && (
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-800">
                            Avisos de Hoy
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                            {avisosHoy.length}
                        </span>
                    </div>
                    <div className="grid gap-3">
                        {avisosHoy.map((aviso) => (
                            <TarjetaAviso key={aviso.id} aviso={aviso} />
                        ))}
                    </div>
                </section>
            )}

            {/* Sección: Próximos 7 Días */}
            {avisosProximos.length > 0 && (
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-800">
                            Próximos 7 Días
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                            {avisosProximos.length}
                        </span>
                    </div>
                    <div className="grid gap-3">
                        {avisosProximos.map((aviso) => (
                            <TarjetaAviso key={aviso.id} aviso={aviso} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}


// ─── Sub-componentes internos ────────────────────────────────────────────────

/** Contador numérico para la cabecera — premium stat card */
function ContadorSeccion({
    etiqueta,
    cantidad,
    icono,
    colorClase,
    bgClase,
    textClase,
}: {
    etiqueta: string
    cantidad: number
    icono: string
    colorClase: string
    bgClase: string
    textClase: string
}) {
    return (
        <div className={`rounded-2xl ${bgClase} p-4 text-center transition-all duration-200`}>
            <div className="mb-1 text-lg">{icono}</div>
            <p className={`text-2xl font-bold tabular-nums ${textClase}`}>{cantidad}</p>
            <p className={`text-xs font-medium ${textClase} opacity-70`}>{etiqueta}</p>
        </div>
    )
}

/** Sección de trabajos en curso con botón "Listo ✅" */
function SeccionTrabajos({ trabajos }: { trabajos: TrabajoConVehiculo[] }) {
    return (
        <section>
            <div className="mb-3 flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-800">
                    Trabajos en Curso
                </h3>
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                    {trabajos.length}
                </span>
            </div>
            <div className="grid gap-3">
                {trabajos.map((trabajo) => (
                    <TarjetaTrabajo key={trabajo.id} trabajo={trabajo} />
                ))}
            </div>
        </section>
    )
}

/** Tarjeta de trabajo en curso con botón "Listo ✅" */
function TarjetaTrabajo({ trabajo }: { trabajo: TrabajoConVehiculo }) {
    const { mostrarExito, mostrarError } = useToast()
    const [cargando, setCargando] = useState(false)

    async function handleListo() {
        setCargando(true)
        try {
            const resultado = await marcarTrabajoListo(trabajo.id, trabajo.vehiculo_id)
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

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 ring-1 ring-amber-100">
                            <span className="text-base" aria-hidden="true">🔧</span>
                        </div>
                        <span className="font-semibold text-slate-800">{trabajo.descripcion}</span>
                    </div>
                    <div className="mt-2 ml-[46px] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-500">
                        <span className="font-medium text-slate-600">{trabajo.matricula}</span>
                        <span className="text-slate-300">·</span>
                        <span>{trabajo.nombre_cliente ?? 'Sin nombre'}</span>
                    </div>
                </div>
            </div>
            <div className="mt-3">
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
        </div>
    )
}

/** Tarjeta de aviso con acciones rápidas: Enviar, Posponer, Marcar hecho */
function TarjetaAviso({ aviso }: { aviso: AvisoConVehiculo }) {
    const { mostrarExito, mostrarError } = useToast()
    const [cargando, setCargando] = useState<'enviar' | 'posponer' | 'hecho' | null>(null)

    const emoji = EMOJI_POR_TIPO[aviso.tipo] ?? '🔔'
    const etiquetaTipo = ETIQUETA_TIPO[aviso.tipo] ?? aviso.tipo

    async function handleEnviar() {
        setCargando('enviar')
        try {
            const resultado = await enviarAvisoAhora(aviso.id)
            if (resultado.exito) {
                mostrarExito('Aviso enviado por WhatsApp')
            } else {
                mostrarError(resultado.error ?? 'Error al enviar el aviso')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(null)
        }
    }

    async function handlePosponer() {
        setCargando('posponer')
        try {
            const resultado = await posponerAviso(aviso.id)
            if (resultado.exito) {
                mostrarExito('Aviso pospuesto 1 día')
            } else {
                mostrarError(resultado.error ?? 'Error al posponer el aviso')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(null)
        }
    }

    async function handleHecho() {
        setCargando('hecho')
        try {
            const resultado = await marcarAvisoHecho(aviso.id)
            if (resultado.exito) {
                mostrarExito('Aviso marcado como hecho')
            } else {
                mostrarError(resultado.error ?? 'Error al marcar el aviso como hecho')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(null)
        }
    }

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-200">
            {/* Cabecera: tipo con emoji + recurrencia */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-100">
                        <span className="text-base" aria-hidden="true">{emoji}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-slate-800">{etiquetaTipo}</span>
                        {aviso.recurrencia_meses != null && (
                            <span
                                className="ml-2 inline-flex items-center gap-0.5 rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600 ring-1 ring-indigo-100"
                                title={`Recurrente cada ${aviso.recurrencia_meses} meses`}
                                aria-label={`Recurrente cada ${aviso.recurrencia_meses} meses`}
                            >
                                🔁 {aviso.recurrencia_meses}m
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Datos del vehículo y fecha */}
            <div className="mt-2 ml-[46px] flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-500">
                <span className="font-medium text-slate-600">{aviso.matricula}</span>
                <span className="text-slate-300">·</span>
                <span>{aviso.nombre_cliente ?? 'Sin nombre'}</span>
                <span className="text-slate-300">·</span>
                <span className="tabular-nums">{formatearFecha(aviso.fecha_programada)}</span>
            </div>

            {/* Botones de acción rápida */}
            <div className="mt-3 ml-[46px] flex flex-wrap gap-2">
                <Boton
                    variante="primario"
                    tamano="sm"
                    cargando={cargando === 'enviar'}
                    disabled={cargando !== null}
                    onClick={handleEnviar}
                >
                    Enviar ahora
                </Boton>
                <Boton
                    variante="secundario"
                    tamano="sm"
                    cargando={cargando === 'posponer'}
                    disabled={cargando !== null}
                    onClick={handlePosponer}
                >
                    Posponer 1 día
                </Boton>
                <Boton
                    variante="exito"
                    tamano="sm"
                    cargando={cargando === 'hecho'}
                    disabled={cargando !== null}
                    onClick={handleHecho}
                >
                    Hecho
                </Boton>
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
