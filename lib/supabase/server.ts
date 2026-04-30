import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 * Gestiona cookies del servidor para mantener la sesión del usuario.
 */
export async function createClient() {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // setAll puede fallar en Server Components donde no se pueden
                        // establecer cookies. Esto es seguro de ignorar si el middleware
                        // ya refresca la sesión del usuario.
                    }
                },
            },
        }
    )
}
