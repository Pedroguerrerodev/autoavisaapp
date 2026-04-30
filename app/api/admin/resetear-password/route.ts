import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

/**
 * API Route para resetear la contraseña de un usuario.
 * Protegida con ADMIN_SECRET.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (body.admin_secret !== process.env.ADMIN_SECRET) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { user_id, new_password } = body
        if (!user_id || !new_password) {
            return Response.json({ error: 'Faltan user_id y new_password' }, { status: 400 })
        }

        if (new_password.length < 6) {
            return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error } = await supabase.auth.admin.updateUserById(user_id, {
            password: new_password,
        })

        if (error) {
            return Response.json({ error: `Error: ${error.message}` }, { status: 500 })
        }

        return Response.json({ exito: true, mensaje: 'Contraseña actualizada correctamente' })
    } catch {
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
