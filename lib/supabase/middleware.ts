import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Actualiza la sesión del usuario en el middleware.
 * Refresca tokens expirados y pasa cookies actualizadas al response.
 * Redirige a /login si el usuario no está autenticado en rutas protegidas.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANTE: No usar getSession() aquí.
    // getUser() envía una petición al servidor de Supabase Auth para revalidar
    // el token. getSession() no lo hace y puede devolver datos obsoletos.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Rutas protegidas: redirigir a /login si no hay usuario autenticado
    const protectedPaths = ['/dashboard', '/vehiculos']
    const isProtectedRoute = protectedPaths.some(
        (path) =>
            request.nextUrl.pathname.startsWith(path) ||
            request.nextUrl.pathname === '/'
    )

    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Si el usuario está autenticado y accede a /login, redirigir al dashboard
    if (user && request.nextUrl.pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
