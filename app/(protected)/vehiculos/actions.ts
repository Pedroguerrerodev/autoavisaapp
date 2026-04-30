'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validarTelefono } from '@/lib/whatsapp'

/**
 * Resultado de una operación de servidor.
 * El cliente decide cómo mostrar el resultado (toast, redirección, etc.)
 */
interface ResultadoAccion {
    exito: boolean
    error?: string
    vehiculoId?: string
}

/**
 * Crea un vehículo nuevo asociado al taller del usuario autenticado.
 * Valida datos, maneja error de matrícula duplicada (código 23505).
 */
export async function crearVehiculo(formData: FormData): Promise<ResultadoAccion> {
    const matricula = formData.get('matricula')?.toString().trim().toUpperCase() ?? ''
    const marca = formData.get('marca')?.toString().trim() ?? ''
    const modelo = formData.get('modelo')?.toString().trim() ?? ''
    const telefono = formData.get('telefono')?.toString().trim() ?? ''
    const nombre_cliente = formData.get('nombre_cliente')?.toString().trim() || null
    const notas = formData.get('notas')?.toString().trim() || null

    // Validaciones
    if (!matricula) {
        return { exito: false, error: 'La matrícula es obligatoria' }
    }

    if (!marca) {
        return { exito: false, error: 'La marca es obligatoria' }
    }

    if (!modelo) {
        return { exito: false, error: 'El modelo es obligatorio' }
    }

    if (!telefono) {
        return { exito: false, error: 'El teléfono es obligatorio' }
    }

    if (!validarTelefono(telefono)) {
        return {
            exito: false,
            error: 'Introduce un teléfono válido con prefijo internacional (ej: +34612345678)',
        }
    }

    const supabase = await createClient()

    // Obtener taller_id del perfil del usuario autenticado
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { exito: false, error: 'No autenticado' }
    }

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('taller_id')
        .eq('id', user.id)
        .single()

    if (!perfil) {
        return { exito: false, error: 'Perfil no encontrado' }
    }

    // Insertar vehículo
    const { data, error } = await supabase
        .from('vehiculos')
        .insert({
            taller_id: perfil.taller_id,
            matricula,
            marca,
            modelo,
            telefono_cliente: telefono,
            nombre_cliente,
            notas,
        })
        .select('id')
        .single()

    if (error) {
        // Error 23505 = violación de constraint UNIQUE (matrícula duplicada en el taller)
        if (error.code === '23505') {
            // Buscar el vehículo existente para ofrecer enlace a su ficha
            const { data: existente } = await supabase
                .from('vehiculos')
                .select('id')
                .eq('taller_id', perfil.taller_id)
                .eq('matricula', matricula)
                .single()

            return {
                exito: false,
                error: 'Este vehículo ya está registrado.',
                vehiculoId: existente?.id,
            }
        }

        return { exito: false, error: 'Error al guardar los datos. Inténtalo de nuevo.' }
    }

    revalidatePath('/dashboard')
    return { exito: true, vehiculoId: data.id }
}

/**
 * Edita un vehículo existente asociado al taller del usuario autenticado.
 * Valida datos con las mismas reglas que crearVehiculo.
 * Verifica que la matrícula no esté duplicada en el taller (excluyendo el vehículo actual).
 */
export async function editarVehiculo(formData: FormData): Promise<ResultadoAccion> {
    const vehiculoId = formData.get('vehiculoId')?.toString().trim() ?? ''
    const matricula = formData.get('matricula')?.toString().trim().toUpperCase() ?? ''
    const marca = formData.get('marca')?.toString().trim() ?? ''
    const modelo = formData.get('modelo')?.toString().trim() ?? ''
    const telefono = formData.get('telefono')?.toString().trim() ?? ''
    const nombre_cliente = formData.get('nombre_cliente')?.toString().trim() || null
    const notas = formData.get('notas')?.toString().trim() || null

    // Validaciones
    if (!vehiculoId) {
        return { exito: false, error: 'ID de vehículo no proporcionado' }
    }

    if (!matricula) {
        return { exito: false, error: 'La matrícula es obligatoria' }
    }

    if (!marca) {
        return { exito: false, error: 'La marca es obligatoria' }
    }

    if (!modelo) {
        return { exito: false, error: 'El modelo es obligatorio' }
    }

    if (!telefono) {
        return { exito: false, error: 'El teléfono es obligatorio' }
    }

    if (!validarTelefono(telefono)) {
        return {
            exito: false,
            error: 'Introduce un teléfono válido con prefijo internacional (ej: +34612345678)',
        }
    }

    const supabase = await createClient()

    // Obtener taller_id del perfil del usuario autenticado
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { exito: false, error: 'No autenticado' }
    }

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('taller_id')
        .eq('id', user.id)
        .single()

    if (!perfil) {
        return { exito: false, error: 'Perfil no encontrado' }
    }

    // Verificar que la matrícula no esté duplicada en el taller (excluyendo el vehículo actual)
    const { data: duplicado } = await supabase
        .from('vehiculos')
        .select('id')
        .eq('taller_id', perfil.taller_id)
        .eq('matricula', matricula)
        .neq('id', vehiculoId)
        .single()

    if (duplicado) {
        return {
            exito: false,
            error: 'Esta matrícula ya está registrada en otro vehículo.',
            vehiculoId: duplicado.id,
        }
    }

    // Actualizar vehículo
    const { error } = await supabase
        .from('vehiculos')
        .update({
            matricula,
            marca,
            modelo,
            telefono_cliente: telefono,
            nombre_cliente,
            notas,
        })
        .eq('id', vehiculoId)

    if (error) {
        return { exito: false, error: 'Error al guardar los datos. Inténtalo de nuevo.' }
    }

    revalidatePath(`/vehiculos/${vehiculoId}`)
    revalidatePath('/dashboard')
    return { exito: true, vehiculoId }
}

/**
 * Elimina un vehículo por su ID.
 * RLS garantiza que solo se puede eliminar vehículos del propio taller.
 */
export async function eliminarVehiculo(vehiculoId: string): Promise<ResultadoAccion> {
    const supabase = await createClient()

    const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('id', vehiculoId)

    if (error) {
        return { exito: false, error: 'Error al eliminar el vehículo. Inténtalo de nuevo.' }
    }

    revalidatePath('/dashboard')
    return { exito: true }
}
