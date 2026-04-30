import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

/**
 * API Route para listar todos los talleres con sus usuarios.
 * Protegida con ADMIN_SECRET. Usa service_role para bypass de RLS.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (body.admin_secret !== process.env.ADMIN_SECRET) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Obtener talleres con sus perfiles y conteo de vehículos/avisos
        const { data: talleres, error } = await supabase
            .from('talleres')
            .select(`
                id,
                nombre,
                telefono_taller,
                created_at,
                perfiles (id, nombre, rol, created_at),
                vehiculos (id),
                avisos (id, tipo, estado, fecha_programada, fecha_envio, es_manual, vehiculos(matricula, telefono_cliente, nombre_cliente))
            `)
            .order('created_at', { ascending: false })

        if (error) {
            return Response.json({ error: error.message }, { status: 500 })
        }

        // Obtener emails de auth.users para cada perfil
        const { data: authUsers } = await supabase.auth.admin.listUsers()

        const emailMap = new Map<string, string>()
        if (authUsers?.users) {
            for (const u of authUsers.users) {
                emailMap.set(u.id, u.email ?? '')
            }
        }

        const resultado = (talleres ?? []).map((t) => {
            // deno-lint-ignore no-explicit-any
            const avisos = Array.isArray(t.avisos) ? t.avisos : []
            const avisosEnviados = avisos
                .filter((a: { estado: string }) => a.estado === 'enviado')
                .sort((a: { fecha_envio: string | null }, b: { fecha_envio: string | null }) =>
                    (b.fecha_envio ?? '').localeCompare(a.fecha_envio ?? '')
                )
                .slice(0, 20) // Últimos 20 enviados
                // deno-lint-ignore no-explicit-any
                .map((a: any) => {
                    const vehiculo = Array.isArray(a.vehiculos) ? a.vehiculos[0] : a.vehiculos
                    return {
                        id: a.id,
                        tipo: a.tipo,
                        fecha_programada: a.fecha_programada,
                        fecha_envio: a.fecha_envio,
                        es_manual: a.es_manual,
                        matricula: vehiculo?.matricula ?? '—',
                        telefono_cliente: vehiculo?.telefono_cliente ?? '—',
                        nombre_cliente: vehiculo?.nombre_cliente ?? null,
                    }
                })

            return {
                id: t.id,
                nombre: t.nombre,
                telefono_taller: t.telefono_taller,
                created_at: t.created_at,
                num_vehiculos: Array.isArray(t.vehiculos) ? t.vehiculos.length : 0,
                num_avisos: avisos.length,
                num_enviados: avisosEnviados.length,
                avisos_enviados: avisosEnviados,
                usuarios: Array.isArray(t.perfiles)
                    ? t.perfiles.map((p: { id: string; nombre: string; rol: string; created_at: string }) => ({
                        id: p.id,
                        nombre: p.nombre,
                        rol: p.rol,
                        email: emailMap.get(p.id) ?? '',
                        created_at: p.created_at,
                    }))
                    : [],
            }
        })

        return Response.json({ talleres: resultado })
    } catch {
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
