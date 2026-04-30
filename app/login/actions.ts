'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Server Action para iniciar sesión.
 * Recibe FormData con email y password, autentica con Supabase
 * y redirige al dashboard en éxito o de vuelta a login con error.
 */
export async function iniciarSesion(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // Redirigir a login con error genérico (no revelar si el email existe)
        redirect('/login?error=invalid_credentials')
    }

    // Revalidar el layout completo para reflejar el nuevo estado de autenticación
    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
