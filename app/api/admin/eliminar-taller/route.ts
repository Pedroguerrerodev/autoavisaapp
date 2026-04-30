import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

/**
 * API Route para eliminar un taller y todos sus datos.
 * Elimina: avisos → vehículos → perfiles → taller → usuarios de Auth.
 * Protegida con ADMIN_SECRET.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (body.admin_secret !== process.env.ADMIN_SECRET) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { taller_id } = body
        if (!taller_id) {
            return Response.json({ error: 'Falta taller_id' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Obtener usuarios del taller para eliminarlos de Auth después
        const { data: perfiles } = await supabase
            .from('perfiles')
            .select('id')
            .eq('taller_id', taller_id)

        const userIds = (perfiles ?? []).map((p) => p.id)

        // Eliminar en orden (las FK con CASCADE se encargan de avisos y vehículos)
        const { error } = await supabase
            .from('talleres')
            .delete()
            .eq('id', taller_id)

        if (error) {
            return Response.json({ error: `Error al eliminar taller: ${error.message}` }, { status: 500 })
        }

        // Eliminar usuarios de Auth
        for (const userId of userIds) {
            await supabase.auth.admin.deleteUser(userId)
        }

        return Response.json({
            exito: true,
            mensaje: `Taller eliminado junto con ${userIds.length} usuario(s)`,
        })
    } catch {
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
