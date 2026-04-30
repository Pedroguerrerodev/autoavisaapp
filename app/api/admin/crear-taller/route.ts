import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

/**
 * API Route para crear un taller completo (usuario + taller + perfil).
 * Protegida con ADMIN_SECRET. Usa service_role para bypass de RLS.
 */
export async function POST(request: NextRequest) {
    try {
        // Verificar secreto de admin
        const body = await request.json()
        const { admin_secret, email, password, nombre_taller, telefono_taller, nombre_dueno } = body

        if (admin_secret !== process.env.ADMIN_SECRET) {
            return Response.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Validar campos obligatorios
        if (!email || !password || !nombre_taller || !nombre_dueno) {
            return Response.json(
                { error: 'Faltan campos obligatorios: email, password, nombre_taller, nombre_dueno' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return Response.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            )
        }

        // Crear cliente con service_role (bypass RLS)
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Paso 1: Crear usuario en Auth
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

        const userId = userData.user.id

        // Paso 2: Crear taller
        const { data: tallerData, error: tallerError } = await supabase
            .from('talleres')
            .insert({
                nombre: nombre_taller,
                telefono_taller: telefono_taller || null,
            })
            .select('id')
            .single()

        if (tallerError) {
            // Rollback: eliminar usuario creado
            await supabase.auth.admin.deleteUser(userId)
            return Response.json(
                { error: `Error al crear taller: ${tallerError.message}` },
                { status: 500 }
            )
        }

        // Paso 3: Crear perfil del dueño
        const { error: perfilError } = await supabase
            .from('perfiles')
            .insert({
                id: userId,
                taller_id: tallerData.id,
                nombre: nombre_dueno,
                rol: 'dueño',
            })

        if (perfilError) {
            // Rollback: eliminar taller y usuario
            await supabase.from('talleres').delete().eq('id', tallerData.id)
            await supabase.auth.admin.deleteUser(userId)
            return Response.json(
                { error: `Error al crear perfil: ${perfilError.message}` },
                { status: 500 }
            )
        }

        return Response.json({
            exito: true,
            taller_id: tallerData.id,
            user_id: userId,
            mensaje: `Taller "${nombre_taller}" creado con dueño "${nombre_dueno}" (${email})`,
        })
    } catch {
        return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
    }
}
