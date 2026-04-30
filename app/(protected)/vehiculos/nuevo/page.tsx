'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Car } from 'lucide-react'
import Link from 'next/link'
import { CampoTexto } from '@/components/ui/campo-texto'
import { Boton } from '@/components/ui/boton'
import { useToast } from '@/components/ui/toast'
import { crearVehiculo } from '../actions'
import { validarTelefono } from '@/lib/whatsapp'

/**
 * Formulario para añadir un vehículo nuevo.
 */
export default function PaginaNuevoVehiculo() {
    const router = useRouter()
    const { mostrarExito, mostrarError } = useToast()
    const [cargando, setCargando] = useState(false)
    const [errores, setErrores] = useState<Record<string, string>>({})

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

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
            const resultado = await crearVehiculo(formData)

            if (resultado.exito) {
                mostrarExito('Vehículo registrado correctamente')
                router.push('/dashboard')
            } else if (resultado.vehiculoId && resultado.error?.includes('ya está registrado')) {
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
        <div className="space-y-8">
            {/* Cabecera con botón volver */}
            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-700 hover:shadow active:scale-95"
                    aria-label="Volver al dashboard"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                        <Car className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                        Nuevo Vehículo
                    </h2>
                </div>
            </div>

            {/* Formulario */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <CampoTexto
                        etiqueta="Matrícula"
                        name="matricula"
                        placeholder="Ej: 1234 ABC"
                        required
                        error={errores.matricula}
                        autoCapitalize="characters"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <CampoTexto
                            etiqueta="Marca"
                            name="marca"
                            placeholder="Ej: Seat"
                            required
                            error={errores.marca}
                        />
                        <CampoTexto
                            etiqueta="Modelo"
                            name="modelo"
                            placeholder="Ej: Ibiza"
                            required
                            error={errores.modelo}
                        />
                    </div>

                    <CampoTexto
                        etiqueta="Teléfono del cliente"
                        name="telefono"
                        type="tel"
                        placeholder="+34612345678"
                        required
                        error={errores.telefono}
                    />
                    <p className="text-xs text-slate-400 -mt-3">
                        Incluye el prefijo internacional (ej: +34 para España)
                    </p>

                    <CampoTexto
                        etiqueta="Nombre del cliente"
                        name="nombre_cliente"
                        placeholder="Ej: Juan García (opcional)"
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
                            Guardar Vehículo
                        </Boton>

                        <Link href="/dashboard">
                            <Boton
                                type="button"
                                variante="secundario"
                                anchoCompleto
                            >
                                Cancelar
                            </Boton>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
