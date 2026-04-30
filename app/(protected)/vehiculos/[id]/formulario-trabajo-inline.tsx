'use client'

import { useState } from 'react'
import { Boton } from '@/components/ui/boton'
import { useToast } from '@/components/ui/toast'
import { crearTrabajo } from './trabajos/actions'

interface FormularioTrabajoInlineProps {
    vehiculoId: string
}

/**
 * Formulario inline para crear un trabajo nuevo.
 */
export function FormularioTrabajoInline({ vehiculoId }: FormularioTrabajoInlineProps) {
    const { mostrarExito, mostrarError } = useToast()
    const [abierto, setAbierto] = useState(false)
    const [descripcion, setDescripcion] = useState('')
    const [cargando, setCargando] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!descripcion.trim()) {
            mostrarError('La descripción del trabajo es obligatoria')
            return
        }

        setCargando(true)
        try {
            const formData = new FormData()
            formData.set('vehiculo_id', vehiculoId)
            formData.set('descripcion', descripcion.trim())

            const resultado = await crearTrabajo(formData)
            if (resultado.exito) {
                mostrarExito('Trabajo registrado correctamente')
                setDescripcion('')
                setAbierto(false)
            } else {
                mostrarError(resultado.error ?? 'Error al crear el trabajo')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    if (!abierto) {
        return (
            <Boton
                variante="primario"
                tamano="md"
                anchoCompleto
                onClick={() => setAbierto(true)}
            >
                + Registrar Trabajo
            </Boton>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
            <label htmlFor="descripcion-trabajo" className="block text-sm font-medium text-slate-700">
                Descripción del trabajo
            </label>
            <input
                id="descripcion-trabajo"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej: Cambio de pastillas de freno"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:shadow-md hover:border-slate-300"
                autoFocus
                disabled={cargando}
            />
            <div className="flex gap-2.5">
                <Boton
                    type="submit"
                    variante="primario"
                    tamano="md"
                    cargando={cargando}
                    className="flex-1"
                >
                    Guardar
                </Boton>
                <Boton
                    type="button"
                    variante="secundario"
                    tamano="md"
                    onClick={() => {
                        setAbierto(false)
                        setDescripcion('')
                    }}
                    disabled={cargando}
                    className="flex-1"
                >
                    Cancelar
                </Boton>
            </div>
        </form>
    )
}
