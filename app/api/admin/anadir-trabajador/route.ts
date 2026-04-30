import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

/**
 * API Route para añadir un trabajador a un taller existente.
 * Crea usuario en Auth + perfil con rol 'trabajador'.
 * Protegida con ADMIN_SECRET.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        if (body.admin_secret !== process.env.ADMIN_SECRET) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { taller_id, email, password, nombre } = body

        if (!taller_id || !email || !password || !nombre) {
            return Response.json(
                { error: 'Faltan campos obligatorios: taller_id, email, password, nombre' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return Response.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            )
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Verificar que el taller existe
        const { data: taller, error: tallerError } = await supabase
            .from('talleres')
            .select('id, nombre')
            .eq('id', taller_id)
            .single()

        if (tallerError || !taller) {
            return Response.json({ error: 'Taller no encontrado' }, { status: 404 })
        }

        // Verificar que el taller tiene menos de 3 usuarios
        const { count } = await supabase
            .from('perfiles')
            .select('id', { count: 'exact', head: true })
            .eq('taller_id', taller_id)

        if ((count ?? 0) >= 3) {
            return Response.json(
                { error: 'El taller ya tiene el máximo de 3 usuarios (1 dueño + 2 trabajadores)' },
                { status: 400 }
            )
        }

        // Crear usuario en Auth
        const { data: userData, error: userError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        })

        if (userError) {
            return Response.json(
                { error: `Error al crear usuario: ${userError.message}` },
                { status: 400 }
            )
        }

        // Crear perfil como trabajador
        const { error: perfilError } = await supabase
            .from('perfiles')
            .insert({
                id: userData.user.id,
                taller_id,
                nombre,
                rol: 'trabajador',
            })

        if (perfilError) {
            await supabase.auth.admin.deleteUser(userData.user.id)
            return Response.json(
                { error: `Error al crear perfil: ${perfilError.message}` },
                { status: 500 }
            )
        }

        return Response.json({
            exito: true,
            mensaje: `Trabajador "${nombre}" añadido a "${taller.nombre}"`,
        })
    } catch {
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
