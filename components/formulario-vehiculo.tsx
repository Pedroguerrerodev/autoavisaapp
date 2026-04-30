'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Car } from 'lucide-react'
import { CampoTexto } from '@/components/ui/campo-texto'
import { Boton } from '@/components/ui/boton'
import { useToast } from '@/components/ui/toast'
import { validarTelefono } from '@/lib/whatsapp'

/** Resultado estándar de una Server Action */
interface ResultadoAccion {
    exito: boolean
    error?: string
    vehiculoId?: string
}

/** Datos iniciales para modo edición */
interface DatosInicialesVehiculo {
    matricula: string
    marca: string
    modelo: string
    telefono_cliente: string
    nombre_cliente: string | null
    notas: string | null
}

interface FormularioVehiculoProps {
    /** Si existe, el formulario está en modo edición */
    vehiculoId?: string
    /** Datos actuales del vehículo para pre-rellenar (modo edición) */
    datosIniciales?: DatosInicialesVehiculo
    /** Server Action que procesa el formulario */
    action: (formData: FormData) => Promise<ResultadoAccion>
}

/**
 * Formulario reutilizable para crear y editar vehículos.
 */
export function FormularioVehiculo({
    vehiculoId,
    datosIniciales,
    action,
}: FormularioVehiculoProps) {
    const router = useRouter()
    const { mostrarExito, mostrarError } = useToast()
    const [cargando, setCargando] = useState(false)
    const [errores, setErrores] = useState<Record<string, string>>({})

    const modoEdicion = !!datosIniciales

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        if (vehiculoId) {
            formData.set('vehiculoId', vehiculoId)
        }

        // Validación client-side
        const matricula = formData.get('matricula')?.toString().trim() ?? ''
        const marca = formData.get('marca')?.toString().trim() ?? ''
        const modelo = formData.get('modelo')?.toString().trim() ?? ''
        const telefono = formData.get('telefono')?.toString().trim() ?? ''
        const nuevosErrores: Record<string, string> = {}

        if (!matricula) {
            nuevosErrores.matricula = 'La matrícula es obligatoria'
        }

        if (!marca) {
            nuevosErrores.marca = 'La marca es obligatoria'
        }

        if (!modelo) {
            nuevosErrores.modelo = 'El modelo es obligatorio'
        }

        if (!telefono) {
            nuevosErrores.telefono = 'El teléfono es obligatorio'
        } else if (!validarTelefono(telefono)) {
            nuevosErrores.telefono =
                'Introduce un teléfono válido con prefijo internacional (ej: +34612345678)'
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores)
            return
        }

        setErrores({})
        setCargando(true)

        try {
            const resultado = await action(formData)

            if (resultado.exito) {
                mostrarExito(
                    modoEdicion
                        ? 'Vehículo actualizado correctamente'
                        : 'Vehículo registrado correctamente'
                )
                router.push(
                    modoEdicion && vehiculoId
                        ? `/vehiculos/${vehiculoId}`
                        : '/dashboard'
                )
            } else if (
                resultado.vehiculoId &&
                resultado.error?.includes('ya está registrad')
            ) {
                mostrarError(resultado.error)
                setTimeout(() => {
                    router.push(`/vehiculos/${resultado.vehiculoId}`)
                }, 1500)
            } else {
                mostrarError(resultado.error ?? 'Error al guardar los datos')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <CampoTexto
                etiqueta="Matrícula"
                name="matricula"
                placeholder="Ej: 1234 ABC"
                required
                error={errores.matricula}
                autoCapitalize="characters"
                defaultValue={datosIniciales?.matricula ?? ''}
            />

            <div className="grid grid-cols-2 gap-3">
                <CampoTexto
                    etiqueta="Marca"
                    name="marca"
                    placeholder="Ej: Seat"
                    required
                    error={errores.marca}
                    defaultValue={datosIniciales?.marca ?? ''}
                />
                <CampoTexto
                    etiqueta="Modelo"
                    name="modelo"
                    placeholder="Ej: Ibiza"
                    required
                    error={errores.modelo}
                    defaultValue={datosIniciales?.modelo ?? ''}
                />
            </div>

            <CampoTexto
                etiqueta="Teléfono del cliente"
                name="telefono"
                type="tel"
                placeholder="+34612345678"
                required
                error={errores.telefono}
                defaultValue={datosIniciales?.telefono_cliente ?? ''}
            />
            <p className="text-xs text-slate-400 -mt-3">
                Incluye el prefijo internacional (ej: +34 para España)
            </p>

            <CampoTexto
                etiqueta="Nombre del cliente"
                name="nombre_cliente"
                placeholder="Ej: Juan García (opcional)"
                defaultValue={datosIniciales?.nombre_cliente ?? ''}
            />

            <div className="flex flex-col gap-2">
                <label
                    htmlFor="notas"
                    className="text-sm font-medium text-slate-700 tracking-[-0.01em]"
                >
                    Notas
                </label>
                <textarea
                    id="notas"
                    name="notas"
                    rows={3}
                    placeholder="Observaciones sobre el vehículo (opcional)"
                    defaultValue={datosIniciales?.notas ?? ''}
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:shadow-md hover:border-slate-300"
                />
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <Boton
                    type="submit"
                    anchoCompleto
                    cargando={cargando}
                    icono={Car}
                >
                    {modoEdicion ? 'Guardar Cambios' : 'Guardar Vehículo'}
                </Boton>

                <Boton
                    type="button"
                    variante="secundario"
                    anchoCompleto
                    onClick={() => router.back()}
                >
                    Cancelar
                </Boton>
            </div>
        </form>
    )
}
