import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AvisoCard } from '@/components/aviso-card'
import { HistorialAvisos } from '@/components/historial-avisos'
import { TrabajoCard } from '@/components/trabajo-card'
import { EliminarAvisoBoton } from './eliminar-aviso-boton'
import { VehiculoInfo } from './vehiculo-info'
import { VehiculoAcciones, BotonVolver } from './vehiculo-acciones'
import { FormularioTrabajoInline } from './formulario-trabajo-inline'
import type { TipoAviso, EstadoAviso, EstadoTrabajo } from '@/types/database'

interface Props {
    params: Promise<{ id: string }>
}

/**
 * Ficha detallada de un vehículo.
 * Server Component que muestra datos del vehículo, trabajos, avisos programados y historial.
 */
export default async function PaginaVehiculo({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    // Obtener datos del vehículo
    const { data: vehiculo, error: errorVehiculo } = await supabase
        .from('vehiculos')
        .select('*')
        .eq('id', id)
        .single()

    if (errorVehiculo || !vehiculo) {
        redirect('/dashboard')
    }

    // Obtener todos los avisos del vehículo ordenados por fecha_programada ASC
    const { data: avisosRaw } = await supabase
        .from('avisos')
        .select('*')
        .eq('vehiculo_id', id)
        .order('fecha_programada', { ascending: true })

    const avisos = avisosRaw ?? []

    // Obtener todos los trabajos del vehículo ordenados por created_at DESC
    const { data: trabajosRaw } = await supabase
        .from('trabajos')
        .select('*')
        .eq('vehiculo_id', id)
        .order('created_at', { ascending: false })

    const trabajos = trabajosRaw ?? []

    // Separar trabajos en curso y completados (listo/entregado)
    const trabajosEnCurso = trabajos.filter((t) => t.estado === 'en_curso')
    const trabajosCompletados = trabajos
        .filter((t) => t.estado === 'listo' || t.estado === 'entregado')
        .sort((a, b) => {
            const fechaA = a.fecha_listo ?? a.created_at
            const fechaB = b.fecha_listo ?? b.created_at
            return fechaB.localeCompare(fechaA)
        })

    // Separar avisos en programados (pendiente) e historial (enviado/fallido)
    const avisosProgramados = avisos.filter((a) => a.estado === 'pendiente')
    const avisosHistorial = avisos
        .filter((a) => a.estado === 'enviado' || a.estado === 'fallido')
        .sort((a, b) => {
            const fechaA = a.fecha_envio ?? a.fecha_programada
            const fechaB = b.fecha_envio ?? b.fecha_programada
            return fechaB.localeCompare(fechaA)
        })

    // Calcular qué avisos están dentro de los próximos 7 días
    const hoy = new Date()
    const en7Dias = new Date(hoy)
    en7Dias.setDate(en7Dias.getDate() + 7)
    const hoyISO = hoy.toISOString().split('T')[0]
    const en7DiasISO = en7Dias.toISOString().split('T')[0]

    return (
        <div className="space-y-8">
            {/* Cabecera con botón volver */}
            <div className="flex items-center gap-3">
                <BotonVolver />
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    Ficha del Vehículo
                </h2>
            </div>

            {/* Datos del vehículo */}
            <VehiculoInfo
                matricula={vehiculo.matricula}
                marca={vehiculo.marca ?? ''}
                modelo={vehiculo.modelo ?? ''}
                telefono_cliente={vehiculo.telefono_cliente}
                nombre_cliente={vehiculo.nombre_cliente}
                notas={vehiculo.notas}
            />

            {/* Botones de acción */}
            <VehiculoAcciones vehiculoId={id} />

            {/* Sección: Trabajos en Curso */}
            <section>
                <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-800">
                        Trabajos en Curso
                    </h3>
                    {trabajosEnCurso.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                            {trabajosEnCurso.length}
                        </span>
                    )}
                </div>
                {trabajosEnCurso.length > 0 ? (
                    <div className="grid gap-3 mb-3">
                        {trabajosEnCurso.map((trabajo) => (
                            <TrabajoCard
                                key={trabajo.id}
                                id={trabajo.id}
                                descripcion={trabajo.descripcion}
                                estado={trabajo.estado as EstadoTrabajo}
                                matricula={vehiculo.matricula}
                                nombre_cliente={vehiculo.nombre_cliente}
                                created_at={trabajo.created_at}
                                fecha_listo={trabajo.fecha_listo}
                                vehiculoId={id}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="mb-3 text-sm text-slate-500">
                        No hay trabajos en curso para este vehículo.
                    </p>
                )}
                <FormularioTrabajoInline vehiculoId={id} />
            </section>

            {/* Sección: Historial de Trabajos */}
            {trabajosCompletados.length > 0 && (
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-800">
                            Historial de Trabajos
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                            {trabajosCompletados.length}
                        </span>
                    </div>
                    <div className="grid gap-3">
                        {trabajosCompletados.map((trabajo) => (
                            <TrabajoCard
                                key={trabajo.id}
                                id={trabajo.id}
                                descripcion={trabajo.descripcion}
                                estado={trabajo.estado as EstadoTrabajo}
                                matricula={vehiculo.matricula}
                                nombre_cliente={vehiculo.nombre_cliente}
                                created_at={trabajo.created_at}
                                fecha_listo={trabajo.fecha_listo}
                                vehiculoId={id}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Sección: Avisos Programados */}
            <section>
                <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-800">
                        Avisos Programados
                    </h3>
                    {avisosProgramados.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                            {avisosProgramados.length}
                        </span>
                    )}
                </div>
                {avisosProgramados.length > 0 ? (
                    <div className="grid gap-3">
                        {avisosProgramados.map((aviso) => {
                            const destacado =
                                aviso.fecha_programada >= hoyISO &&
                                aviso.fecha_programada <= en7DiasISO

                            return (
                                <div key={aviso.id} className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <AvisoCard
                                            tipo={aviso.tipo as TipoAviso}
                                            fecha_programada={aviso.fecha_programada}
                                            estado={aviso.estado as EstadoAviso}
                                            matricula={vehiculo.matricula}
                                            nombre_cliente={vehiculo.nombre_cliente}
                                            destacado={destacado}
                                            recurrencia_meses={aviso.recurrencia_meses ?? null}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 pt-3">
                                        <Link
                                            href={`/vehiculos/${id}/avisos/${aviso.id}/editar`}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
                                            aria-label="Editar aviso"
                                            title="Editar aviso"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <EliminarAvisoBoton
                                            avisoId={aviso.id}
                                            vehiculoId={id}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">
                        No hay avisos programados para este vehículo.
                    </p>
                )}
            </section>

            {/* Sección: Historial de Avisos */}
            <section>
                <div className="mb-3 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-800">
                        Historial de Avisos
                    </h3>
                    {avisosHistorial.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                            {avisosHistorial.length}
                        </span>
                    )}
                </div>
                <HistorialAvisos avisos={avisosHistorial} />
            </section>
        </div>
    )
}
