/**
 * Tests unitarios de middleware.
 *
 * Testeamos la lógica de identificación de rutas protegidas vs públicas
 * extraída de lib/supabase/middleware.ts.
 */
import { describe, it, expect } from 'vitest'

/**
 * Lógica extraída de lib/supabase/middleware.ts:
 * Las rutas protegidas son las que empiezan con /dashboard o /vehiculos,
 * o la ruta raíz /.
 */
const PROTECTED_PATHS = ['/dashboard', '/vehiculos']

function esRutaProtegida(pathname: string): boolean {
    return PROTECTED_PATHS.some(
        (path) => pathname.startsWith(path) || pathname === '/'
    )
}

describe('Middleware — identificación de rutas protegidas', () => {
    it('/dashboard es ruta protegida', () => {
        expect(esRutaProtegida('/dashboard')).toBe(true)
    })

    it('/dashboard/algo es ruta protegida', () => {
        expect(esRutaProtegida('/dashboard/algo')).toBe(true)
    })

    it('/vehiculos es ruta protegida', () => {
        expect(esRutaProtegida('/vehiculos')).toBe(true)
    })

    it('/vehiculos/nuevo es ruta protegida', () => {
        expect(esRutaProtegida('/vehiculos/nuevo')).toBe(true)
    })

    it('/vehiculos/abc-123/avisos/nuevo es ruta protegida', () => {
        expect(esRutaProtegida('/vehiculos/abc-123/avisos/nuevo')).toBe(true)
    })

    it('/ (raíz) es ruta protegida', () => {
        expect(esRutaProtegida('/')).toBe(true)
    })

    it('/login NO es ruta protegida', () => {
        expect(esRutaProtegida('/login')).toBe(false)
    })

    it('/api/send-whatsapp NO es ruta protegida', () => {
        expect(esRutaProtegida('/api/send-whatsapp')).toBe(false)
    })

    it('/favicon.ico NO es ruta protegida', () => {
        expect(esRutaProtegida('/favicon.ico')).toBe(false)
    })
})

describe('Middleware — lógica de redirección', () => {
    /**
     * Simula la lógica de decisión del middleware:
     * - Sin usuario + ruta protegida → redirigir a /login
     * - Con usuario + /login → redirigir a /dashboard
     * - Otros casos → continuar
     */
    function decidirAccion(
        user: { id: string } | null,
        pathname: string
    ): 'redirect-login' | 'redirect-dashboard' | 'continue' {
        const isProtected = esRutaProtegida(pathname)

        if (!user && isProtected) {
            return 'redirect-login'
        }

        if (user && pathname === '/login') {
            return 'redirect-dashboard'
        }

        return 'continue'
    }

    it('redirige a /login cuando no hay usuario en ruta protegida', () => {
        expect(decidirAccion(null, '/dashboard')).toBe('redirect-login')
    })

    it('redirige a /login cuando no hay usuario en /', () => {
        expect(decidirAccion(null, '/')).toBe('redirect-login')
    })

    it('redirige a /dashboard cuando usuario autenticado accede a /login', () => {
        expect(decidirAccion({ id: 'user-1' }, '/login')).toBe('redirect-dashboard')
    })

    it('continúa cuando usuario autenticado accede a ruta protegida', () => {
        expect(decidirAccion({ id: 'user-1' }, '/dashboard')).toBe('continue')
    })

    it('continúa cuando no hay usuario en ruta pública (no /login)', () => {
        expect(decidirAccion(null, '/api/send-whatsapp')).toBe('continue')
    })

    it('continúa cuando no hay usuario en /login', () => {
        expect(decidirAccion(null, '/login')).toBe('continue')
    })
})
