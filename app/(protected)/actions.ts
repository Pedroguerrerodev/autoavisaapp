'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action para cerrar sesión.
 * Cierra la sesión de Supabase y redirige a la página de login.
 */
export async function cerrarSesion() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
