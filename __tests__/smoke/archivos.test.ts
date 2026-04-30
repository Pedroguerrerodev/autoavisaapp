/**
 * Tests smoke — verificación de existencia de archivos críticos.
 *
 * Comprobamos que los archivos esenciales del proyecto existen
 * y contienen el contenido esperado.
 */
import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

/** Helper para verificar que un archivo existe */
function archivoExiste(rutaRelativa: string): boolean {
    return existsSync(resolve(process.cwd(), rutaRelativa))
}

/** Helper para leer contenido de un archivo */
function leerArchivo(rutaRelativa: string): string {
    return readFileSync(resolve(process.cwd(), rutaRelativa), 'utf-8')
}

describe('Smoke — .env.local.example', () => {
    it('el archivo .env.local.example existe', () => {
        expect(archivoExiste('.env.local.example')).toBe(true)
    })

    it('contiene NEXT_PUBLIC_SUPABASE_URL', () => {
        const contenido = leerArchivo('.env.local.example')
        expect(contenido).toContain('NEXT_PUBLIC_SUPABASE_URL')
    })

    it('contiene NEXT_PUBLIC_SUPABASE_ANON_KEY', () => {
        const contenido = leerArchivo('.env.local.example')
        expect(contenido).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    })
})

describe('Smoke — migración SQL', () => {
    it('supabase/migrations/001_schema_inicial.sql existe', () => {
        expect(archivoExiste('supabase/migrations/001_schema_inicial.sql')).toBe(true)
    })
})

describe('Smoke — scripts de administración', () => {
    it('supabase/scripts/crear-taller.sql existe', () => {
        expect(archivoExiste('supabase/scripts/crear-taller.sql')).toBe(true)
    })

    it('supabase/scripts/añadir-trabajador.sql existe', () => {
        expect(archivoExiste('supabase/scripts/añadir-trabajador.sql')).toBe(true)
    })
})

describe('Smoke — documentación', () => {
    it('docs/admin-scripts.md existe', () => {
        expect(archivoExiste('docs/admin-scripts.md')).toBe(true)
    })
})

describe('Smoke — Edge Function', () => {
    it('supabase/functions/procesar-avisos-diarios/index.ts existe', () => {
        expect(archivoExiste('supabase/functions/procesar-avisos-diarios/index.ts')).toBe(true)
    })
})

// --- Tests smoke Pro (Req 6.1, 6.7, 7.1) ---

describe('Smoke — migración Pro', () => {
    it('supabase/migrations/002_pro.sql existe', () => {
        expect(archivoExiste('supabase/migrations/002_pro.sql')).toBe(true)
    })

    it('002_pro.sql contiene ALTER TABLE para avisos', () => {
        const contenido = leerArchivo('supabase/migrations/002_pro.sql')
        expect(contenido).toContain('ALTER TABLE')
        expect(contenido).toContain('recurrencia_meses')
        expect(contenido).toContain('aviso_origen_id')
    })

    it('002_pro.sql contiene CREATE TABLE trabajos', () => {
        const contenido = leerArchivo('supabase/migrations/002_pro.sql')
        expect(contenido).toContain('CREATE TABLE public.trabajos')
    })
})

describe('Smoke — variables de WhatsApp en .env.local.example', () => {
    it('contiene WHATSAPP_MODE', () => {
        const contenido = leerArchivo('.env.local.example')
        expect(contenido).toContain('WHATSAPP_MODE')
    })

    it('contiene WHATSAPP_ACCESS_TOKEN', () => {
        const contenido = leerArchivo('.env.local.example')
        expect(contenido).toContain('WHATSAPP_ACCESS_TOKEN')
    })

    it('contiene WHATSAPP_PHONE_NUMBER_ID', () => {
        const contenido = leerArchivo('.env.local.example')
        expect(contenido).toContain('WHATSAPP_PHONE_NUMBER_ID')
    })

    it('contiene WHATSAPP_TEMPLATE_NAME', () => {
        const contenido = leerArchivo('.env.local.example')
        expect(contenido).toContain('WHATSAPP_TEMPLATE_NAME')
    })
})

describe('Smoke — tipos TypeScript Pro', () => {
    it('types/database.ts contiene interfaz Trabajo', () => {
        const contenido = leerArchivo('types/database.ts')
        expect(contenido).toContain('interface Trabajo')
    })

    it('types/database.ts contiene EstadoTrabajo', () => {
        const contenido = leerArchivo('types/database.ts')
        expect(contenido).toContain('EstadoTrabajo')
    })

    it('types/database.ts contiene recurrencia_meses en Aviso', () => {
        const contenido = leerArchivo('types/database.ts')
        expect(contenido).toContain('recurrencia_meses')
    })

    it('types/database.ts contiene aviso_origen_id en Aviso', () => {
        const contenido = leerArchivo('types/database.ts')
        expect(contenido).toContain('aviso_origen_id')
    })
})
