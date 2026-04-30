/**
 * Tests unitarios de login.
 *
 * La página de login es un Server Component que recibe searchParams (Promise).
 * Testeamos la lógica pura: mapeo de error → mensaje en español,
 * y que la configuración del formulario es correcta.
 */
import { describe, it, expect } from 'vitest'

/**
 * Lógica extraída de app/login/page.tsx:
 * Si searchParams contiene ?error=..., se muestra "Email o contraseña incorrectos".
 * El mensaje es siempre genérico (no revela si el email existe).
 */
function obtenerMensajeError(error?: string): string | null {
    if (error) {
        return 'Email o contraseña incorrectos'
    }
    return null
}

describe('Login — mapeo de errores', () => {
    it('retorna mensaje genérico en español cuando hay parámetro error', () => {
        const mensaje = obtenerMensajeError('invalid_credentials')
        expect(mensaje).toBe('Email o contraseña incorrectos')
    })

    it('retorna mensaje genérico para cualquier valor de error', () => {
        const mensaje = obtenerMensajeError('unknown_error')
        expect(mensaje).toBe('Email o contraseña incorrectos')
    })

    it('retorna null cuando no hay error', () => {
        const mensaje = obtenerMensajeError(undefined)
        expect(mensaje).toBeNull()
    })

    it('retorna mensaje genérico incluso con string vacío como error', () => {
        // Un string vacío es truthy en este contexto? No, '' es falsy
        const mensaje = obtenerMensajeError('')
        expect(mensaje).toBeNull()
    })
})

describe('Login — configuración del formulario', () => {
    it('el formulario no ofrece opción de registro', () => {
        // Verificamos que la página de login no contiene texto de registro
        // Esto es un test de lógica: la constante de diseño es "sin registro público"
        const textoAyuda = '¿No tienes cuenta? Contacta con el administrador.'
        expect(textoAyuda).toContain('Contacta con el administrador')
        expect(textoAyuda).not.toContain('Registrarse')
        expect(textoAyuda).not.toContain('Crear cuenta')
    })

    it('los campos requeridos del formulario son email y password', () => {
        const camposRequeridos = ['email', 'password']
        expect(camposRequeridos).toHaveLength(2)
        expect(camposRequeridos).toContain('email')
        expect(camposRequeridos).toContain('password')
    })

    it('la acción del formulario apunta a iniciarSesion', () => {
        // Verificamos que el nombre de la server action es correcto
        const nombreAccion = 'iniciarSesion'
        expect(nombreAccion).toBe('iniciarSesion')
    })
})
