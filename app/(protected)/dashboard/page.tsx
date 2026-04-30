import { createClient } from '@/lib/supabase/server'
import { BotonAnadirVehiculo } from '@/components/boton-anadir-vehiculo'
import {
    DashboardVehiculos,
    type VehiculoConAvisos,
} from '@/components/dashboard-vehiculos'
import { VistaDeDia } from '@/components/vista-del-dia'
import type { AvisoConVehiculo, TrabajoConVehiculo } from '@/components/vista-del-dia'
import type { TipoAviso } from '@/types/database'

/**
 * Dashboard principal del taller.
 * Server Component que consulta Supabase para obtener avisos clasificados,
 * trabajos en curso y vehículos.
 *
 * Secciones:
 * 1. Vista del Día — avisos de hoy, atrasados, próximos 7 días + trabajos en curso
 * 2. Todos los Vehículos — con buscador por matrícula
 *
 * Requisitos: 3.1, 3.2, 3.3, 3.4, 3.10, 8.8
 */
export default async function PaginaDashboard() {
    const supabase = await createClient()

    // Obtener el taller_id del usuario autenticado
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('taller_id')
        .eq('id', user!.id)
        .single()

    const tallerId = perfil!.taller_id

    // ─── Fechas de referencia ────────────────────────────────────────────
    const hoy = new Date()
    const hoyISO = hoy.toISOString().split('T')[0]

    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)
    const mananaISO = manana.toISOString().split('T')[0]

    const en7Dias = new Date(hoy)
    en7Dias.setDate(en7Dias.getDate() + 7)
    const en7DiasISO = en7Dias.toISOString().split('T')[0]

    // ─── Consultar TODOS los avisos pendientes relevantes (atrasados + hoy + próximos 7 días) ──
    const { data: avisosPendientesRaw } = await supabase
        .from('avisos')
        .select(
            'id, tipo, fecha_programada, vehiculo_id, recurrencia_meses, vehiculos(matricula, nombre_cliente)'
        )
        .eq('taller_id', tallerId)
        .eq('estado', 'pendiente')
        .lte('fecha_programada', en7DiasISO)
        .order('fecha_programada', { ascending: true })

    // Normalizar la relación vehiculos
    const avisosPendientes = (avisosPendientesRaw ?? []).map((aviso) => {
        const vehiculo = Array.isArray(aviso.vehiculos)
            ? aviso.vehiculos[0] ?? null
            : aviso.vehiculos
        return {
            id: aviso.id as string,
            tipo: aviso.tipo as TipoAviso,
            fecha_programada: aviso.fecha_programada as string,
            vehiculo_id: aviso.vehiculo_id as string,
            matricula: (vehiculo as { matricula: string; nombre_cliente: string | null } | null)?.matricula ?? '—',
            nombre_cliente: (vehiculo as { matricula: string; nombre_cliente: string | null } | null)?.nombre_cliente ?? null,
            recurrencia_meses: (aviso.recurrencia_meses as number | null) ?? null,
        } satisfies AvisoConVehiculo
    })

    // ─── Clasificar avisos en 3 secciones ────────────────────────────────
    const avisosHoy: AvisoConVehiculo[] = []
    const avisosAtrasados: AvisoConVehiculo[] = []
    const avisosProximos: AvisoConVehiculo[] = []

    for (const aviso of avisosPendientes) {
        if (aviso.fecha_programada < hoyISO) {
            avisosAtrasados.push(aviso)
        } else if (aviso.fecha_programada === hoyISO) {
            avisosHoy.push(aviso)
        } else {
            avisosProximos.push(aviso)
        }
    }

    // ─── Consultar trabajos en curso del taller ──────────────────────────
    const { data: trabajosRaw } = await supabase
        .from('trabajos')
        .select(
            'id, descripcion, vehiculo_id, created_at, vehiculos(matricula, nombre_cliente)'
        )
        .eq('taller_id', tallerId)
        .eq('estado', 'en_curso')
        .order('created_at', { ascending: false })

    const trabajosEnCurso: TrabajoConVehiculo[] = (trabajosRaw ?? []).map((trabajo) => {
        const vehiculo = Array.isArray(trabajo.vehiculos)
            ? trabajo.vehiculos[0] ?? null
            : trabajo.vehiculos
        return {
            id: trabajo.id as string,
            descripcion: trabajo.descripcion as string,
            vehiculo_id: trabajo.vehiculo_id as string,
            matricula: (vehiculo as { matricula: string; nombre_cliente: string | null } | null)?.matricula ?? '—',
            nombre_cliente: (vehiculo as { matricula: string; nombre_cliente: string | null } | null)?.nombre_cliente ?? null,
            created_at: trabajo.created_at as string,
        }
    })

    // ─── Consultar vehículos del taller con conteo de avisos pendientes ──
    const { data: vehiculosRaw } = await supabase
        .from('vehiculos')
        .select('id, matricula, marca, modelo, nombre_cliente, telefono_cliente')
        .eq('taller_id', tallerId)
        .order('created_at', { ascending: false })

    const vehiculosData = vehiculosRaw ?? []

    const vehiculosIds = vehiculosData.map((v) => v.id)

    const { data: avisosVehiculos } = vehiculosIds.length > 0
        ? await supabase
            .from('avisos')
            .select('vehiculo_id, fecha_programada, estado')
            .in('vehiculo_id', vehiculosIds)
            .eq('estado', 'pendiente')
            .order('fecha_programada', { ascending: true })
        : { data: [] }

    const avisosPorVehiculo = (avisosVehiculos ?? []).reduce<
        Record<string, { pendientes: number; proximo: string | null }>
    >((acc, aviso) => {
        if (!acc[aviso.vehiculo_id]) {
            acc[aviso.vehiculo_id] = { pendientes: 0, proximo: null }
        }
        acc[aviso.vehiculo_id].pendientes++
        if (!acc[aviso.vehiculo_id].proximo) {
            acc[aviso.vehiculo_id].proximo = aviso.fecha_programada
        }
        return acc
    }, {})

    const vehiculos: VehiculoConAvisos[] = vehiculosData.map((v) => ({
        id: v.id,
        matricula: v.matricula,
        marca: v.marca ?? '',
        modelo: v.modelo ?? '',
        nombre_cliente: v.nombre_cliente,
        telefono_cliente: v.telefono_cliente,
        avisos_pendientes: avisosPorVehiculo[v.id]?.pendientes ?? 0,
        proximo_aviso: avisosPorVehiculo[v.id]?.proximo ?? null,
    }))

    return (
        <div className="space-y-10">
            {/* Cabecera con título y botón de añadir */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Dashboard</h2>
                    <p className="mt-0.5 text-sm text-slate-500">Resumen de tu taller</p>
                </div>
                <BotonAnadirVehiculo />
            </div>

            {/* Vista del Día — avisos clasificados + trabajos en curso */}
            <VistaDeDia
                avisosHoy={avisosHoy}
                avisosAtrasados={avisosAtrasados}
                avisosProximos={avisosProximos}
                trabajosEnCurso={trabajosEnCurso}
            />

            {/* Sección: Todos los Vehículos */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-800">
                        Todos los Vehículos
                    </h3>
                    {vehiculos.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                            {vehiculos.length}
                        </span>
                    )}
                </div>
                {vehiculos.length > 0 ? (
                    <DashboardVehiculos vehiculos={vehiculos} />
                ) : (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                            <span className="text-2xl">🚗</span>
                        </div>
                        <p className="font-medium text-slate-700">
                            Aún no tienes vehículos registrados.
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Pulsa &quot;Añadir Vehículo&quot; para empezar.
                        </p>
                    </div>
                )}
            </section>
        </div>
    )
}
