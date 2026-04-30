import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from './header'

/**
 * Layout protegido para todas las rutas autenticadas.
 * Verifica la sesión del usuario y carga su perfil (taller_id, rol).
 * Redirige a /login si no hay sesión o no existe perfil.
 */
export default async function LayoutProtegido({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Verificar sesión con getUser() (valida el token contra el servidor)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Obtener perfil del usuario (taller_id y rol)
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('nombre, rol, taller_id')
        .eq('id', user.id)
        .single()

    // Si no hay perfil (usuario en Auth pero sin perfil en la tabla), redirigir
    if (!perfil) {
        redirect('/login')
    }

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <Header nombreUsuario={perfil.nombre} />

            {/* Contenido principal */}
            <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
                <div className="animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    )
}
