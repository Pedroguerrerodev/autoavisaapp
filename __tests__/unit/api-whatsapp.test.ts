/**
 * Tests unitarios de la API WhatsApp.
 *
 * Importamos directamente la función POST de app/api/send-whatsapp/route.ts
 * y creamos objetos Request para testear la lógica.
 */
import { describe, it, expect, vi } from 'vitest'
import { POST } from '@/app/api/send-whatsapp/route'
import { WhatsAppApiError } from '@/lib/whatsapp'

/** Datos válidos para una petición de envío de WhatsApp */
function crearDatosValidos() {
    return {
        telefono: '+34612345678',
        nombre_cliente: 'Juan García',
        nombre_taller: 'Taller AutoPro',
        tipo_mantenimiento: 'itv',
        mensaje: 'Recordatorio de ITV',
        matricula: '1234ABC',
    }
}

/** Helper para crear un Request con body JSON */
function crearRequest(body: unknown): Request {
    return new Request('http://localhost:3000/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

describe('API WhatsApp — respuestas con datos válidos', () => {
    it('retorna 200 con datos válidos', async () => {
        const request = crearRequest(crearDatosValidos())
        const response = await POST(request)

        expect(response.status).toBe(200)
    })

    it('retorna { estado: "enviado", timestamp } con datos válidos', async () => {
        const request = crearRequest(crearDatosValidos())
        const response = await POST(request)
        const body = await response.json()

        expect(body.estado).toBe('enviado')
        expect(body.timestamp).toBeDefined()
        expect(typeof body.timestamp).toBe('string')
    })

    it('el timestamp es una fecha ISO válida', async () => {
        const request = crearRequest(crearDatosValidos())
        const response = await POST(request)
        const body = await response.json()

        const fecha = new Date(body.timestamp)
        expect(fecha.getTime()).not.toBeNaN()
    })
})

describe('API WhatsApp — validación de campos obligatorios', () => {
    it('retorna 400 cuando falta telefono', async () => {
        const datos = crearDatosValidos()
        const { telefono, ...sinTelefono } = datos
        const request = crearRequest(sinTelefono)
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('telefono')
    })

    it('retorna 400 cuando falta nombre_cliente', async () => {
        const datos = crearDatosValidos()
        const { nombre_cliente, ...sinNombre } = datos
        const request = crearRequest(sinNombre)
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('nombre_cliente')
    })

    it('retorna 400 cuando falta nombre_taller', async () => {
        const datos = crearDatosValidos()
        const { nombre_taller, ...sinTaller } = datos
        const request = crearRequest(sinTaller)
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('nombre_taller')
    })

    it('retorna 400 cuando falta tipo_mantenimiento', async () => {
        const datos = crearDatosValidos()
        const { tipo_mantenimiento, ...sinTipo } = datos
        const request = crearRequest(sinTipo)
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('tipo_mantenimiento')
    })

    it('retorna 400 cuando falta mensaje', async () => {
        const datos = crearDatosValidos()
        const { mensaje, ...sinMensaje } = datos
        const request = crearRequest(sinMensaje)
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('mensaje')
    })

    it('retorna 400 cuando falta matricula', async () => {
        const datos = crearDatosValidos()
        const { matricula, ...sinMatricula } = datos
        const request = crearRequest(sinMatricula)
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('matricula')
    })

    it('retorna 400 listando múltiples campos faltantes', async () => {
        const request = crearRequest({})
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('Faltan campos obligatorios')
    })

    it('retorna 400 cuando un campo es string vacío', async () => {
        const datos = { ...crearDatosValidos(), telefono: '' }
        const request = crearRequest(datos)
        const response = await POST(request)

        expect(response.status).toBe(400)
    })
})

describe('API WhatsApp — validación de teléfono', () => {
    it('retorna 400 con teléfono sin prefijo +', async () => {
        const datos = { ...crearDatosValidos(), telefono: '34612345678' }
        const request = crearRequest(datos)
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('Teléfono inválido')
    })

    it('retorna 400 con teléfono con letras', async () => {
        const datos = { ...crearDatosValidos(), telefono: '+34abc' }
        const request = crearRequest(datos)
        const response = await POST(request)

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body.error).toContain('Teléfono inválido')
    })
})

describe('API WhatsApp — manejo de errores', () => {
    it('retorna 500 con body no-JSON', async () => {
        const request = new Request('http://localhost:3000/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'esto no es json',
        })
        const response = await POST(request)

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error).toBe('Error interno del servidor')
    })
})


describe('API WhatsApp — manejo de errores de Cloud API', () => {
    it('retorna 502 con detalle cuando enviarWhatsApp lanza WhatsAppApiError', async () => {
        const { enviarWhatsApp } = await import('@/lib/whatsapp')

        // Mock enviarWhatsApp para lanzar WhatsAppApiError
        const mod = await import('@/lib/whatsapp')
        const spy = vi.spyOn(mod, 'enviarWhatsApp').mockRejectedValueOnce(
            new WhatsAppApiError('Token expirado', 401, 190)
        )

        const request = crearRequest(crearDatosValidos())
        const response = await POST(request)

        expect(response.status).toBe(502)
        const body = await response.json()
        expect(body.error).toBe('Error de WhatsApp')
        expect(body.detalle).toBe('Token expirado')
        expect(body.codigo).toBe(190)

        spy.mockRestore()
    })

    it('retorna 502 con codigo undefined cuando WhatsAppApiError no tiene whatsappCode', async () => {
        const mod = await import('@/lib/whatsapp')
        const spy = vi.spyOn(mod, 'enviarWhatsApp').mockRejectedValueOnce(
            new WhatsAppApiError('Error desconocido', 500)
        )

        const request = crearRequest(crearDatosValidos())
        const response = await POST(request)

        expect(response.status).toBe(502)
        const body = await response.json()
        expect(body.error).toBe('Error de WhatsApp')
        expect(body.detalle).toBe('Error desconocido')

        spy.mockRestore()
    })

    it('registra error en console.error con formato correcto', async () => {
        const mod = await import('@/lib/whatsapp')
        const spy = vi.spyOn(mod, 'enviarWhatsApp').mockRejectedValueOnce(
            new WhatsAppApiError('Rate limit exceeded', 429, 130429)
        )
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

        const request = crearRequest(crearDatosValidos())
        await POST(request)

        expect(consoleSpy).toHaveBeenCalledWith(
            '[ERROR WHATSAPP] HTTP 429: Rate limit exceeded'
        )

        spy.mockRestore()
        consoleSpy.mockRestore()
    })

    it('retorna 500 para errores genéricos (no WhatsAppApiError)', async () => {
        const mod = await import('@/lib/whatsapp')
        const spy = vi.spyOn(mod, 'enviarWhatsApp').mockRejectedValueOnce(
            new Error('Error genérico inesperado')
        )

        const request = crearRequest(crearDatosValidos())
        const response = await POST(request)

        expect(response.status).toBe(500)
        const body = await response.json()
        expect(body.error).toBe('Error interno del servidor')

        spy.mockRestore()
    })
})
