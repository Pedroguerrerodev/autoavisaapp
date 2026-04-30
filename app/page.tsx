import { redirect } from 'next/navigation'

/**
 * Página raíz — redirige al dashboard.
 * El middleware se encarga de redirigir a /login si no hay sesión.
 */
export default function Home() {
  redirect('/dashboard')
}
