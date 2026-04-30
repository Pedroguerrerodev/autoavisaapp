import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente Supabase para Client Components (navegador).
 * Usa document.cookie automáticamente para gestionar la sesión.
 * Implementa patrón singleton por defecto.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
