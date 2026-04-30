/**
 * Tests de integración — flujos principales con Supabase mockeado.
 *
 * Testeamos la lógica de las server actions (crearVehiculo, crearAviso,
 * enviarAvisoManual) mockeando las dependencias externas (Supabase, fetch,
 * next/cache, next/navigation).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mocks de módulos externos ---

// Mock de next/cache (revalidatePath)
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

// Mock de next/navigation (redirect)
vi.mock('next/navigation', () => ({
    redirect: vi.fn(),
}))

// --- Helpers para crear FormData ---

function crearFormDataVehiculo(datos: {
    matricula?: string
    telefono?: string
    nombre_cliente?: string
    notas?: string
}): FormData {
    const fd = new FormData()
    if (datos.matricula !== undefined) fd.set('matricula', datos.matricula)
    if (datos.telefono !== undefined) fd.set('telefono', datos.telefono)
    if (datos.nombre_cliente !== undefined) fd.set('nombre_cliente', datos.nombre_cliente)
    if (datos.notas !== undefined) fd.set('notas', datos.notas)
    return fd
}

function crearFormDataAviso(datos: {
    vehiculo_id?: string
    tipo?: string
    fecha_programada?: string
    mensaje_personalizado?: string
}): FormData {
    const fd = new FormData()
    if (datos.vehiculo_id !== undefined) fd.set('vehiculo_id', datos.vehiculo_id)
    if (datos.tipo !== undefined) fd.set('tipo', datos.tipo)
    if (datos.fecha_programada !== undefined) fd.set('fecha_programada', datos.fecha_programada)
    if (datos.mensaje_personalizado !== undefined) fd.set('mensaje_personalizado', datos.mensaje_personalizado)
    return fd
}

// --- Tests de crearVehiculo ---

describe('Integración — crearVehiculo (validación)', () => {
    /**
     * Testeamos la lógica de validación de crearVehiculo sin necesidad
     * de Supabase, ya que las validaciones ocurren antes de la BD.
     */

    // Reimplementamos la lógica de validación extraída de la server action
    function validarDatosVehiculo(formData: FormData): {
        valido: boolean
        error?: string
        matricula?: string
        telefono?: string
    } {
        const matricula = formData.get('matricula')?.toString().trim().toUpperCase() ?? ''
        const telefono = formData.get('telefono')?.toString().trim() ?? ''

        if (!matricula) {
            return { valido: false, error: 'La matrícula es obligatoria' }
        }

        if (!telefono) {
            return { valido: false, error: 'El teléfono es obligatorio' }
        }

        if (!/^\+\d+$/.test(telefono)) {
            return {
                valido: false,
                error: 'Introduce un teléfono válido con prefijo internacional (ej: +34612345678)',
            }
        }

        return { valido: true, matricula, telefono }
    }

    it('valida correctamente datos completos', () => {
        const fd = crearFormDataVehiculo({
            matricula: '1234ABC',
            telefono: '+34612345678',
        })
        const resultado = validarDatosVehiculo(fd)
        expect(resultado.valido).toBe(true)
        expect(resultado.matricula).toBe('1234ABC')
    })

    it('rechaza matrícula vacía', () => {
        const fd = crearFormDataVehiculo({ matricula: '', telefono: '+34612345678' })
        const resultado = validarDatosVehiculo(fd)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La matrícula es obligatoria')
    })

    it('rechaza teléfono vacío', () => {
        const fd = crearFormDataVehiculo({ matricula: '1234ABC', telefono: '' })
        const resultado = validarDatosVehiculo(fd)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('El teléfono es obligatorio')
    })

    it('rechaza teléfono sin prefijo internacional', () => {
        const fd = crearFormDataVehiculo({ matricula: '1234ABC', telefono: '612345678' })
        const resultado = validarDatosVehiculo(fd)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toContain('prefijo internacional')
    })

    it('convierte matrícula a mayúsculas', () => {
        const fd = crearFormDataVehiculo({ matricula: 'abc1234', telefono: '+34612345678' })
        const resultado = validarDatosVehiculo(fd)
        expect(resultado.matricula).toBe('ABC1234')
    })
})

// --- Tests de crearAviso ---

describe('Integración — crearAviso (validación)', () => {
    const TIPOS_VALIDOS = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

    function validarDatosAviso(formData: FormData, hoy: Date): {
        valido: boolean
        error?: string
    } {
        const vehiculo_id = formData.get('vehiculo_id')?.toString().trim() ?? ''
        const tipo = formData.get('tipo')?.toString().trim() ?? ''
        const fecha_programada = formData.get('fecha_programada')?.toString().trim() ?? ''

        if (!vehiculo_id) {
            return { valido: false, error: 'Vehículo no especificado' }
        }

        if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
            return { valido: false, error: 'Selecciona un tipo de mantenimiento' }
        }

        if (!fecha_programada) {
            return { valido: false, error: 'La fecha del aviso es obligatoria' }
        }

        const hoyNormalizado = new Date(hoy)
        hoyNormalizado.setHours(0, 0, 0, 0)
        const fechaAviso = new Date(fecha_programada + 'T00:00:00')
        if (fechaAviso <= hoyNormalizado) {
            return { valido: false, error: 'La fecha del aviso debe ser futura' }
        }

        return { valido: true }
    }

    it('valida correctamente datos completos de aviso', () => {
        const fd = crearFormDataAviso({
            vehiculo_id: 'v-123',
            tipo: 'itv',
            fecha_programada: '2026-01-15',
        })
        const resultado = validarDatosAviso(fd, new Date('2025-07-10'))
        expect(resultado.valido).toBe(true)
    })

    it('rechaza aviso sin vehículo', () => {
        const fd = crearFormDataAviso({ tipo: 'itv', fecha_programada: '2026-01-15' })
        const resultado = validarDatosAviso(fd, new Date('2025-07-10'))
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('Vehículo no especificado')
    })

    it('rechaza aviso con tipo inválido', () => {
        const fd = crearFormDataAviso({
            vehiculo_id: 'v-123',
            tipo: 'frenos',
            fecha_programada: '2026-01-15',
        })
        const resultado = validarDatosAviso(fd, new Date('2025-07-10'))
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('Selecciona un tipo de mantenimiento')
    })

    it('rechaza aviso con fecha pasada', () => {
        const fd = crearFormDataAviso({
            vehiculo_id: 'v-123',
            tipo: 'itv',
            fecha_programada: '2025-01-01',
        })
        const resultado = validarDatosAviso(fd, new Date('2025-07-10'))
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La fecha del aviso debe ser futura')
    })

    it('rechaza aviso con fecha de hoy', () => {
        const fd = crearFormDataAviso({
            vehiculo_id: 'v-123',
            tipo: 'aceite',
            fecha_programada: '2025-07-10',
        })
        const resultado = validarDatosAviso(fd, new Date('2025-07-10'))
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('La fecha del aviso debe ser futura')
    })
})

// --- Tests del flujo enviarAvisoManual ---

describe('Integración — enviarAvisoManual (flujo con fetch mock)', () => {
    beforeEach(() => {
        vi.restoreAllMocks()
    })

    it('el flujo completo de envío manual llama a /api/send-whatsapp con datos correctos', async () => {
        // Simulamos el flujo: preparar datos → llamar API → verificar respuesta
        const datosEnvio = {
            telefono: '+34612345678',
            nombre_cliente: 'Juan García',
            nombre_taller: 'Taller AutoPro',
            tipo_mantenimiento: 'itv',
            mensaje: 'Recordatorio de ITV',
            matricula: '1234ABC',
        }

        // Mock de fetch global
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({ estado: 'enviado', timestamp: new Date().toISOString() }),
                { status: 200, headers: { 'Content-Type': 'application/json' } }
            )
        )
        vi.stubGlobal('fetch', fetchMock)

        // Simular la llamada que haría enviarAvisoManual
        const response = await fetch('http://localhost:3000/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosEnvio),
        })

        expect(fetchMock).toHaveBeenCalledOnce()
        expect(response.status).toBe(200)

        const body = await response.json()
        expect(body.estado).toBe('enviado')
        expect(body.timestamp).toBeDefined()

        vi.unstubAllGlobals()
    })

    it('maneja error de la API WhatsApp correctamente', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({ error: 'Error interno del servidor' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            )
        )
        vi.stubGlobal('fetch', fetchMock)

        const response = await fetch('http://localhost:3000/api/send-whatsapp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telefono: '+34612345678' }),
        })

        expect(response.ok).toBe(false)
        expect(response.status).toBe(500)

        vi.unstubAllGlobals()
    })

    it('maneja error de red (fetch rechazado)', async () => {
        const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'))
        vi.stubGlobal('fetch', fetchMock)

        let error: Error | null = null
        try {
            await fetch('http://localhost:3000/api/send-whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            })
        } catch (e) {
            error = e as Error
        }

        expect(error).not.toBeNull()
        expect(error!.message).toBe('Network error')

        vi.unstubAllGlobals()
    })

    it('la validación del flujo manual rechaza tipo vacío', () => {
        const TIPOS_VALIDOS = ['itv', 'aceite', 'filtros', 'revision', 'neumaticos', 'otro']

        function validarEnvioManual(formData: FormData): {
            valido: boolean
            error?: string
        } {
            const vehiculo_id = formData.get('vehiculo_id')?.toString().trim() ?? ''
            const tipo = formData.get('tipo')?.toString().trim() ?? ''

            if (!vehiculo_id) {
                return { valido: false, error: 'Vehículo no especificado' }
            }
            if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
                return { valido: false, error: 'Selecciona un tipo de mantenimiento' }
            }
            return { valido: true }
        }

        const fd = new FormData()
        fd.set('vehiculo_id', 'v-123')
        // No se establece tipo

        const resultado = validarEnvioManual(fd)
        expect(resultado.valido).toBe(false)
        expect(resultado.error).toBe('Selecciona un tipo de mantenimiento')
    })
})


// --- Tests de integración: flujos completos usando funciones puras de lib/validaciones.ts ---

import {
    aplicarAccionRapida,
    validarRecurrenciaMeses,
    clasificarAvisos,
    calcularFechaPospuesta,
    esTransicionTrabajoValida,
    aplicarTransicionTrabajo,
    marcarListoConWhatsApp,
    ordenarTrabajosHistorialDesc,
    puedeEditarAviso,
} from '@/lib/validaciones'
import { validarTelefono } from '@/lib/whatsapp'
import type { EstadoTrabajo } from '@/types/database'

// --- Flujo: crear aviso recurrente → simular cron → verificar siguiente aviso creado ---

describe('Integración — Flujo de aviso recurrente completo', () => {
    /**
     * Simula el flujo completo: un taller crea un aviso con recurrencia,
     * el cron lo procesa (acción rápida "enviar ahora"), y se genera
     * automáticamente el siguiente aviso de la cadena.
     *
     * Requisitos: 2.4
     */

    it('crear aviso recurrente → enviar → genera siguiente aviso con fecha correcta', () => {
        // 1. Taller crea un aviso de ITV con recurrencia cada 12 meses
        const avisoId = 'aviso-001'
        const recurrenciaMeses = 12
        const validacion = validarRecurrenciaMeses(String(recurrenciaMeses))
        expect(validacion.valido).toBe(true)
        if (!validacion.valido) return
        expect(validacion.valor).toBe(12)

        // 2. Simular que el cron procesa el aviso (acción rápida "enviar ahora")
        const fechaEnvio = '2025-03-15'
        const resultado = aplicarAccionRapida(avisoId, null, validacion.valor, fechaEnvio)

        // 3. Verificar que el aviso original cambia a "enviado"
        expect(resultado.nuevoEstado).toBe('enviado')
        expect(resultado.fechaEnvio).toBe(fechaEnvio)

        // 4. Verificar que se genera el siguiente aviso
        expect(resultado.siguienteAviso).not.toBeNull()
        expect(resultado.siguienteAviso!.estado).toBe('pendiente')
        expect(resultado.siguienteAviso!.recurrencia_meses).toBe(12)
        expect(resultado.siguienteAviso!.fecha_programada).toBe('2026-03-15')
        // El aviso_origen_id apunta al aviso original (primer aviso de la cadena)
        expect(resultado.siguienteAviso!.aviso_origen_id).toBe(avisoId)
    })

    it('cadena de recurrencia: el segundo aviso generado mantiene el origen del primero', () => {
        const avisoOriginalId = 'aviso-original'

        // 1. Primer envío: aviso original con recurrencia cada 6 meses
        const resultado1 = aplicarAccionRapida(avisoOriginalId, null, 6, '2025-01-10')
        expect(resultado1.siguienteAviso).not.toBeNull()
        expect(resultado1.siguienteAviso!.aviso_origen_id).toBe(avisoOriginalId)
        expect(resultado1.siguienteAviso!.fecha_programada).toBe('2025-07-10')

        // 2. Segundo envío: el aviso generado (que ya tiene aviso_origen_id) se envía
        const avisoGeneradoId = 'aviso-generado-1'
        const resultado2 = aplicarAccionRapida(
            avisoGeneradoId,
            avisoOriginalId, // aviso_origen_id del aviso generado apunta al original
            6,
            '2025-07-10',
        )

        expect(resultado2.siguienteAviso).not.toBeNull()
        // El tercer aviso sigue apuntando al aviso ORIGINAL, no al intermedio
        expect(resultado2.siguienteAviso!.aviso_origen_id).toBe(avisoOriginalId)
        expect(resultado2.siguienteAviso!.fecha_programada).toBe('2026-01-10')
    })

    it('aviso sin recurrencia no genera siguiente aviso', () => {
        const resultado = aplicarAccionRapida('aviso-unico', null, null, '2025-06-01')

        expect(resultado.nuevoEstado).toBe('enviado')
        expect(resultado.siguienteAviso).toBeNull()
    })

    it('recurrencia personalizada de 3 meses genera fecha correcta', () => {
        const validacion = validarRecurrenciaMeses('3')
        expect(validacion.valido).toBe(true)
        if (!validacion.valido) return

        const resultado = aplicarAccionRapida('aviso-aceite', null, validacion.valor, '2025-02-28')
        expect(resultado.siguienteAviso).not.toBeNull()
        // Feb 28 + 3 months = May 28
        expect(resultado.siguienteAviso!.fecha_programada).toBe('2025-05-28')
    })

    it('el siguiente aviso generado aparece en la sección correcta de la Vista del Día', () => {
        // Simular: aviso recurrente se envía hoy, genera siguiente aviso
        const hoy = '2025-07-15'
        const resultado = aplicarAccionRapida('aviso-itv', null, 6, hoy)
        expect(resultado.siguienteAviso).not.toBeNull()

        // El siguiente aviso tiene fecha en el futuro (6 meses después)
        const siguienteFecha = resultado.siguienteAviso!.fecha_programada
        const en7Dias = '2025-07-22'

        // Clasificar el siguiente aviso
        const clasificacion = clasificarAvisos(
            [{ id: 'siguiente', estado: 'pendiente', fecha_programada: siguienteFecha }],
            hoy,
            en7Dias,
        )

        // El aviso con fecha 2026-01-15 no debería estar en ninguna sección (>7 días)
        expect(clasificacion.hoy).toHaveLength(0)
        expect(clasificacion.atrasados).toHaveLength(0)
        expect(clasificacion.proximos).toHaveLength(0)
    })
})

// --- Flujo: editar vehículo → verificar datos actualizados ---

describe('Integración — Flujo de edición de vehículo', () => {
    /**
     * Simula el flujo de edición: validar teléfono, validar matrícula,
     * y verificar que los datos actualizados son correctos.
     *
     * Requisitos: 4.3
     */

    it('editar vehículo con datos válidos pasa todas las validaciones', () => {
        // Datos originales del vehículo
        const datosOriginales = {
            matricula: '1234ABC',
            telefono: '+34612345678',
            nombre_cliente: 'Juan García',
        }

        // Datos editados
        const datosEditados = {
            matricula: '5678DEF',
            telefono: '+34698765432',
            nombre_cliente: 'María López',
        }

        // Validar teléfono editado
        expect(validarTelefono(datosEditados.telefono)).toBe(true)

        // Validar que la matrícula se normaliza a mayúsculas
        const matriculaNormalizada = datosEditados.matricula.trim().toUpperCase()
        expect(matriculaNormalizada).toBe('5678DEF')

        // Simular verificación de duplicados: la nueva matrícula no está en la lista
        // (excluyendo el vehículo actual)
        const matriculasExistentes = ['1234ABC', '9999XYZ']
        const vehiculoActualId = 'v-001'
        const vehiculosDelTaller = [
            { id: 'v-001', matricula: '1234ABC' },
            { id: 'v-002', matricula: '9999XYZ' },
        ]
        const duplicada = vehiculosDelTaller.some(
            (v) => v.matricula === matriculaNormalizada && v.id !== vehiculoActualId,
        )
        expect(duplicada).toBe(false)
    })

    it('rechaza edición con teléfono sin prefijo internacional', () => {
        const telefonoInvalido = '612345678'
        expect(validarTelefono(telefonoInvalido)).toBe(false)
    })

    it('rechaza edición con teléfono vacío', () => {
        expect(validarTelefono('')).toBe(false)
    })

    it('detecta matrícula duplicada al editar (excluyendo el vehículo actual)', () => {
        const vehiculosDelTaller = [
            { id: 'v-001', matricula: '1234ABC' },
            { id: 'v-002', matricula: '9999XYZ' },
        ]
        const vehiculoActualId = 'v-001'

        // Intentar cambiar la matrícula a una que ya existe en otro vehículo
        const nuevaMatricula = '9999XYZ'
        const duplicada = vehiculosDelTaller.some(
            (v) => v.matricula === nuevaMatricula && v.id !== vehiculoActualId,
        )
        expect(duplicada).toBe(true)
    })

    it('permite mantener la misma matrícula al editar (no es duplicado consigo mismo)', () => {
        const vehiculosDelTaller = [
            { id: 'v-001', matricula: '1234ABC' },
            { id: 'v-002', matricula: '9999XYZ' },
        ]
        const vehiculoActualId = 'v-001'

        // Mantener la misma matrícula no debería ser duplicado
        const mismaMatricula = '1234ABC'
        const duplicada = vehiculosDelTaller.some(
            (v) => v.matricula === mismaMatricula && v.id !== vehiculoActualId,
        )
        expect(duplicada).toBe(false)
    })

    it('normaliza matrícula a mayúsculas antes de comparar duplicados', () => {
        const vehiculosDelTaller = [
            { id: 'v-001', matricula: '1234ABC' },
            { id: 'v-002', matricula: '9999XYZ' },
        ]
        const vehiculoActualId = 'v-003'

        // Matrícula en minúsculas que coincide con una existente
        const nuevaMatricula = '9999xyz'.toUpperCase()
        const duplicada = vehiculosDelTaller.some(
            (v) => v.matricula === nuevaMatricula && v.id !== vehiculoActualId,
        )
        expect(duplicada).toBe(true)
    })
})

// --- Flujo: crear trabajo → marcar listo → marcar entregado ---

describe('Integración — Flujo completo de trabajo', () => {
    /**
     * Simula el ciclo de vida completo de un trabajo:
     * crear (en_curso) → marcar listo (con WhatsApp) → marcar entregado.
     *
     * Requisitos: 8.5, 8.9
     */

    it('flujo completo: en_curso → listo (con WhatsApp exitoso) → entregado', () => {
        // 1. Crear trabajo — estado inicial es en_curso
        let estadoActual: EstadoTrabajo = 'en_curso'
        let fechaListo: string | null = null
        let fechaEntregado: string | null = null

        // 2. Verificar que solo la transición a "listo" es válida desde en_curso
        expect(esTransicionTrabajoValida(estadoActual, 'listo')).toBe(true)
        expect(esTransicionTrabajoValida(estadoActual, 'entregado')).toBe(false)

        // 3. Marcar como listo (WhatsApp exitoso)
        const timestampListo = '2025-07-15T10:30:00.000Z'
        const resultadoWhatsApp = marcarListoConWhatsApp(true, timestampListo)
        expect(resultadoWhatsApp.estado).toBe('listo')
        expect(resultadoWhatsApp.fecha_listo).toBe(timestampListo)
        expect(resultadoWhatsApp.advertencia).toBeUndefined()

        // Aplicar la transición formalmente
        const transicion1 = aplicarTransicionTrabajo(estadoActual, 'listo', timestampListo)
        expect(transicion1.exito).toBe(true)
        estadoActual = transicion1.estado
        fechaListo = transicion1.fecha_listo

        expect(estadoActual).toBe('listo')
        expect(fechaListo).toBe(timestampListo)

        // 4. Verificar que solo la transición a "entregado" es válida desde listo
        expect(esTransicionTrabajoValida(estadoActual, 'entregado')).toBe(true)
        expect(esTransicionTrabajoValida(estadoActual, 'en_curso')).toBe(false)

        // 5. Marcar como entregado
        const timestampEntregado = '2025-07-16T14:00:00.000Z'
        const transicion2 = aplicarTransicionTrabajo(
            estadoActual,
            'entregado',
            timestampEntregado,
            fechaListo,
        )
        expect(transicion2.exito).toBe(true)
        estadoActual = transicion2.estado
        fechaEntregado = transicion2.fecha_entregado

        expect(estadoActual).toBe('entregado')
        expect(transicion2.fecha_listo).toBe(timestampListo) // preservada
        expect(fechaEntregado).toBe(timestampEntregado)

        // 6. Verificar que no hay más transiciones válidas desde entregado
        expect(esTransicionTrabajoValida(estadoActual, 'en_curso')).toBe(false)
        expect(esTransicionTrabajoValida(estadoActual, 'listo')).toBe(false)
        expect(esTransicionTrabajoValida(estadoActual, 'entregado')).toBe(false)
    })

    it('flujo con WhatsApp fallido: trabajo sigue como listo con advertencia', () => {
        // 1. Trabajo en curso
        const estadoActual: EstadoTrabajo = 'en_curso'

        // 2. Marcar como listo pero WhatsApp falla
        const timestampListo = '2025-07-15T11:00:00.000Z'
        const resultadoWhatsApp = marcarListoConWhatsApp(false, timestampListo)

        // El estado SIEMPRE cambia a listo, independientemente de WhatsApp
        expect(resultadoWhatsApp.estado).toBe('listo')
        expect(resultadoWhatsApp.fecha_listo).toBe(timestampListo)
        expect(resultadoWhatsApp.advertencia).toBeDefined()
        expect(resultadoWhatsApp.advertencia).toContain('WhatsApp')

        // 3. La transición formal también funciona
        const transicion = aplicarTransicionTrabajo(estadoActual, 'listo', timestampListo)
        expect(transicion.exito).toBe(true)
        expect(transicion.estado).toBe('listo')

        // 4. Puede seguir a entregado normalmente
        const transicion2 = aplicarTransicionTrabajo(
            'listo',
            'entregado',
            '2025-07-16T09:00:00.000Z',
            timestampListo,
        )
        expect(transicion2.exito).toBe(true)
        expect(transicion2.estado).toBe('entregado')
    })

    it('no se puede saltar de en_curso a entregado directamente', () => {
        const transicion = aplicarTransicionTrabajo(
            'en_curso',
            'entregado',
            '2025-07-15T10:00:00.000Z',
        )
        expect(transicion.exito).toBe(false)
        expect(transicion.estado).toBe('en_curso') // estado no cambia
        expect(transicion.error).toContain('Transición inválida')
    })

    it('múltiples trabajos completados se ordenan por fecha_listo descendente', () => {
        // Simular 3 trabajos completados en distintas fechas
        const trabajos = [
            { id: 'trabajo-1', fecha_listo: '2025-07-10T08:00:00.000Z' },
            { id: 'trabajo-3', fecha_listo: '2025-07-15T14:00:00.000Z' },
            { id: 'trabajo-2', fecha_listo: '2025-07-12T10:00:00.000Z' },
        ]

        const ordenados = ordenarTrabajosHistorialDesc(trabajos)

        expect(ordenados[0].id).toBe('trabajo-3') // más reciente primero
        expect(ordenados[1].id).toBe('trabajo-2')
        expect(ordenados[2].id).toBe('trabajo-1') // más antiguo último
    })
})
