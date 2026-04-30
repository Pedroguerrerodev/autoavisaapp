/**
 * Feature: autoavisa-pro, Property 1: Selección de modo WhatsApp
 * Feature: autoavisa-pro, Property 2: Construcción del payload de plantilla
 * Feature: autoavisa-pro, Property 3: Manejo de errores de Cloud API
 * Feature: autoavisa-pro, Property 13: Validación de variables de entorno en modo real
 *
 * Validates: Requirements 1.1, 1.3, 1.4, 1.6, 1.7, 1.8, 7.2, 7.3
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import fc from 'fast-check'
import type { TipoAviso } from '@/types/database'
import { ETIQUETA_TIPO } from '@/lib/whatsapp'

const TIPOS_AVISO: TipoAviso[] = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

/** Arbitrary for valid TipoAviso */
const arbTipo = fc.constantFrom(...TIPOS_AVISO)

/** Arbitrary for non-empty alphanumeric strings (names, plates, etc.) */
const arbNombreTaller = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)
const arbMatricula = fc.stringMatching(/^[A-Z0-9]{1,10}$/)
const arbNombreCliente = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)
const arbMensaje = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0)
const arbTelefono = fc.stringMatching(/^\+\d{7,15}$/)

/** Helper to build valid aviso params */
function arbAvisoParams() {
    return fc.record({
        telefono: arbTelefono,
        nombre_cliente: arbNombreCliente,
        nombre_taller: arbNombreTaller,
        tipo_mantenimiento: arbTipo,
        mensaje: arbMensaje,
        matricula: arbMatricula,
    })
}

// Store original env
const originalEnv = { ...process.env }

beforeEach(() => {
    vi.resetModules()
})

afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
})

/**
 * Helper: dynamically import enviarWhatsApp after setting env vars.
 * We must re-import because the module reads process.env at call time.
 */
async function importWhatsApp() {
    return await import('@/lib/whatsapp')
}

// ---------------------------------------------------------------------------
// Property 1: Selección de modo WhatsApp
// ---------------------------------------------------------------------------
describe('Feature: autoavisa-pro, Property 1: Selección de modo WhatsApp', () => {
    /**
     * **Validates: Requirements 1.1, 1.3, 7.2**
     *
     * For any value of WHATSAPP_MODE (including undefined, empty, or arbitrary strings),
     * enviarWhatsApp() SHALL use "real" mode (Cloud API) only when the value is exactly "real",
     * and SHALL use "dummy" mode (console.log) in all other cases.
     */
    it('solo el valor exacto "real" activa Cloud API; cualquier otro valor usa dummy', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate arbitrary strings including edge cases
                fc.oneof(
                    fc.constant(undefined),
                    fc.constant(''),
                    fc.constant('dummy'),
                    fc.constant('REAL'),
                    fc.constant('Real'),
                    fc.constant(' real'),
                    fc.constant('real '),
                    fc.string({ minLength: 0, maxLength: 30 }).filter((s) => s !== 'real'),
                ),
                arbAvisoParams(),
                async (modoValue, params) => {
                    // Set env
                    if (modoValue === undefined) {
                        delete process.env.WHATSAPP_MODE
                    } else {
                        process.env.WHATSAPP_MODE = modoValue
                    }
                    // Ensure no real API tokens so real mode would fail if called
                    delete process.env.WHATSAPP_ACCESS_TOKEN
                    delete process.env.WHATSAPP_PHONE_NUMBER_ID

                    const mod = await importWhatsApp()

                    // Spy on console.log to detect dummy mode
                    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

                    // Since mode is NOT "real", it should use dummy (console.log)
                    const result = await mod.enviarWhatsApp(params)

                    expect(result.estado).toBe('enviado')
                    expect(result.timestamp).toBeDefined()
                    // Dummy mode logs to console
                    expect(consoleSpy).toHaveBeenCalled()
                    // Dummy mode does NOT return whatsapp_message_id
                    expect(result.whatsapp_message_id).toBeUndefined()

                    consoleSpy.mockRestore()
                }
            ),
            { numRuns: 100 }
        )
    })

    it('el valor exacto "real" intenta usar Cloud API (no usa dummy)', async () => {
        await fc.assert(
            fc.asyncProperty(
                arbAvisoParams(),
                async (params) => {
                    process.env.WHATSAPP_MODE = 'real'
                    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
                    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id'

                    const mod = await importWhatsApp()

                    // Mock global fetch to simulate Cloud API success
                    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                        new Response(
                            JSON.stringify({ messages: [{ id: 'wamid.test123' }] }),
                            { status: 200, headers: { 'Content-Type': 'application/json' } }
                        )
                    )
                    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

                    const result = await mod.enviarWhatsApp(params)

                    expect(result.estado).toBe('enviado')
                    expect(result.whatsapp_message_id).toBe('wamid.test123')
                    // Real mode calls fetch, NOT console.log
                    expect(fetchSpy).toHaveBeenCalled()
                    expect(consoleSpy).not.toHaveBeenCalled()

                    fetchSpy.mockRestore()
                    consoleSpy.mockRestore()
                }
            ),
            { numRuns: 100 }
        )
    })
})

// ---------------------------------------------------------------------------
// Property 2: Construcción del payload de plantilla WhatsApp
// ---------------------------------------------------------------------------
describe('Feature: autoavisa-pro, Property 2: Construcción del payload de plantilla', () => {
    /**
     * **Validates: Requirements 1.4, 1.6**
     *
     * For any valid aviso data, the payload sent to WhatsApp Cloud API SHALL contain:
     * messaging_product: "whatsapp", type: "template", the configured template name,
     * language "es", and exactly 3 body parameters: nombre_taller, matrícula, etiqueta tipo.
     */
    it('el payload contiene estructura correcta con 3 parámetros en orden', async () => {
        await fc.assert(
            fc.asyncProperty(
                arbAvisoParams(),
                async (params) => {
                    process.env.WHATSAPP_MODE = 'real'
                    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
                    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id'
                    process.env.WHATSAPP_TEMPLATE_NAME = 'aviso_mantenimiento'

                    const mod = await importWhatsApp()

                    let capturedBody: string | undefined
                    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
                        async (_url: string | URL | Request, init?: RequestInit) => {
                            capturedBody = init?.body as string
                            return new Response(
                                JSON.stringify({ messages: [{ id: 'wamid.test' }] }),
                                { status: 200, headers: { 'Content-Type': 'application/json' } }
                            )
                        }
                    )

                    await mod.enviarWhatsApp(params)

                    expect(capturedBody).toBeDefined()
                    const payload = JSON.parse(capturedBody!)

                    // Verify top-level structure
                    expect(payload.messaging_product).toBe('whatsapp')
                    expect(payload.type).toBe('template')
                    expect(payload.to).toBe(params.telefono.replace(/^\+/, ''))

                    // Verify template structure
                    expect(payload.template.name).toBe('aviso_mantenimiento')
                    expect(payload.template.language.code).toBe('es')

                    // Verify exactly 3 body parameters in correct order
                    const components = payload.template.components
                    expect(components).toHaveLength(1)
                    expect(components[0].type).toBe('body')

                    const parameters = components[0].parameters
                    expect(parameters).toHaveLength(3)

                    // Parameter 1: nombre_taller
                    expect(parameters[0]).toEqual({ type: 'text', text: params.nombre_taller })
                    // Parameter 2: matrícula
                    expect(parameters[1]).toEqual({ type: 'text', text: params.matricula })
                    // Parameter 3: etiqueta del tipo de mantenimiento
                    const etiquetaEsperada = mod.ETIQUETA_TIPO[params.tipo_mantenimiento] ?? params.tipo_mantenimiento
                    expect(parameters[2]).toEqual({ type: 'text', text: etiquetaEsperada })

                    fetchSpy.mockRestore()
                }
            ),
            { numRuns: 100 }
        )
    })
})

// ---------------------------------------------------------------------------
// Property 3: Manejo de errores de Cloud API
// ---------------------------------------------------------------------------
describe('Feature: autoavisa-pro, Property 3: Manejo de errores de Cloud API', () => {
    /**
     * **Validates: Requirements 1.7, 1.8**
     *
     * For any error response from the WhatsApp Cloud API (4xx, 5xx, rate limit 429),
     * the API /api/send-whatsapp SHALL return HTTP 502 with error detail.
     */
    it('cualquier error de Cloud API resulta en HTTP 502 con detalle', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate random HTTP error status codes (4xx and 5xx)
                fc.oneof(
                    fc.integer({ min: 400, max: 499 }),
                    fc.integer({ min: 500, max: 599 })
                ),
                // Generate random WhatsApp error codes
                fc.option(fc.integer({ min: 100, max: 200000 }), { nil: undefined }),
                // Generate random error messages
                fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
                arbAvisoParams(),
                async (httpStatus, whatsappCode, errorMessage, params) => {
                    process.env.WHATSAPP_MODE = 'real'
                    process.env.WHATSAPP_ACCESS_TOKEN = 'test-token'
                    process.env.WHATSAPP_PHONE_NUMBER_ID = 'test-phone-id'

                    const mod = await importWhatsApp()

                    // Mock fetch to return an error response from Cloud API
                    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                        new Response(
                            JSON.stringify({
                                error: {
                                    message: errorMessage,
                                    code: whatsappCode,
                                },
                            }),
                            { status: httpStatus, headers: { 'Content-Type': 'application/json' } }
                        )
                    )

                    // Import the route handler
                    const { POST } = await import('@/app/api/send-whatsapp/route')

                    // Spy on enviarWhatsApp to use the real implementation with mocked fetch
                    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

                    const request = new Request('http://localhost:3000/api/send-whatsapp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(params),
                    })

                    const response = await POST(request)

                    // Should always return 502 for Cloud API errors
                    expect(response.status).toBe(502)

                    const body = await response.json()
                    expect(body.error).toBe('Error de WhatsApp')
                    expect(body.detalle).toBeDefined()
                    expect(typeof body.detalle).toBe('string')

                    fetchSpy.mockRestore()
                    consoleSpy.mockRestore()
                }
            ),
            { numRuns: 100 }
        )
    })
})

// ---------------------------------------------------------------------------
// Property 13: Validación de variables de entorno en modo real
// ---------------------------------------------------------------------------
describe('Feature: autoavisa-pro, Property 13: Validación de variables de entorno en modo real', () => {
    /**
     * **Validates: Requisito 7.3**
     *
     * For any combination of env vars where WHATSAPP_MODE is "real",
     * if WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID are not configured
     * (undefined or empty), enviarWhatsApp() SHALL throw a descriptive error.
     */
    it('lanza error descriptivo cuando faltan variables en modo real', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate combinations where at least one required var is missing/empty
                fc.record({
                    accessToken: fc.oneof(
                        fc.constant(undefined),
                        fc.constant(''),
                        fc.constant('valid-token-123')
                    ),
                    phoneNumberId: fc.oneof(
                        fc.constant(undefined),
                        fc.constant(''),
                        fc.constant('valid-phone-id-456')
                    ),
                }).filter(({ accessToken, phoneNumberId }) => {
                    // At least one must be missing or empty
                    const tokenMissing = accessToken === undefined || accessToken === ''
                    const phoneMissing = phoneNumberId === undefined || phoneNumberId === ''
                    return tokenMissing || phoneMissing
                }),
                arbAvisoParams(),
                async ({ accessToken, phoneNumberId }, params) => {
                    process.env.WHATSAPP_MODE = 'real'

                    if (accessToken === undefined) {
                        delete process.env.WHATSAPP_ACCESS_TOKEN
                    } else {
                        process.env.WHATSAPP_ACCESS_TOKEN = accessToken
                    }

                    if (phoneNumberId === undefined) {
                        delete process.env.WHATSAPP_PHONE_NUMBER_ID
                    } else {
                        process.env.WHATSAPP_PHONE_NUMBER_ID = phoneNumberId
                    }

                    const mod = await importWhatsApp()

                    await expect(mod.enviarWhatsApp(params)).rejects.toThrow()

                    try {
                        await mod.enviarWhatsApp(params)
                    } catch (error) {
                        expect(error).toBeInstanceOf(Error)
                        const msg = (error as Error).message
                        // Error message should mention the required variables
                        expect(msg).toContain('WHATSAPP_ACCESS_TOKEN')
                        expect(msg).toContain('WHATSAPP_PHONE_NUMBER_ID')
                    }
                }
            ),
            { numRuns: 100 }
        )
    })

    it('NO lanza error cuando ambas variables están configuradas en modo real', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate non-empty token and phone ID
                fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
                fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
                arbAvisoParams(),
                async (token, phoneId, params) => {
                    process.env.WHATSAPP_MODE = 'real'
                    process.env.WHATSAPP_ACCESS_TOKEN = token
                    process.env.WHATSAPP_PHONE_NUMBER_ID = phoneId

                    const mod = await importWhatsApp()

                    // Mock fetch for successful response
                    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
                        new Response(
                            JSON.stringify({ messages: [{ id: 'wamid.test' }] }),
                            { status: 200, headers: { 'Content-Type': 'application/json' } }
                        )
                    )

                    // Should NOT throw
                    const result = await mod.enviarWhatsApp(params)
                    expect(result.estado).toBe('enviado')

                    fetchSpy.mockRestore()
                }
            ),
            { numRuns: 100 }
        )
    })
})
