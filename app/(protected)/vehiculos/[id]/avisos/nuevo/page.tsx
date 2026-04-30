'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus } from 'lucide-react'
import { CampoTexto } from '@/components/ui/campo-texto'
import { Boton } from '@/components/ui/boton'
import { useToast } from '@/components/ui/toast'
import { SelectorTipoAviso } from '@/components/selector-tipo-aviso'
import { SelectorRecurrencia } from '@/components/selector-recurrencia'
import { crearAviso } from '../actions'
import type { TipoAviso } from '@/types/database'

/**
 * Formulario para crear un nuevo aviso de mantenimiento.
 * Client Component con validación y llamada a server action.
 */
export default function PaginaNuevoAviso() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const vehiculoId = params.id
    const { mostrarExito, mostrarError } = useToast()

    const [tipo, setTipo] = useState<TipoAviso | ''>('')
    const [recurrenciaMeses, setRecurrenciaMeses] = useState<number | null>(null)
    const [cargando, setCargando] = useState(false)
    const [errores, setErrores] = useState<Record<string, string>>({})

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        // Asegurar que vehiculo_id está en el formData
        formData.set('vehiculo_id', vehiculoId)

        // Incluir recurrencia_meses en el formData
        if (recurrenciaMeses !== null) {
            formData.set('recurrencia_meses', String(recurrenciaMeses))
        } else {
            formData.delete('recurrencia_meses')
        }

        // Validación client-side
        const nuevosErrores: Record<string, string> = {}

        if (!tipo) {
            nuevosErrores.tipo = 'Selecciona un tipo de mantenimiento'
        }

        const fecha = formData.get('fecha_programada')?.toString().trim() ?? ''
        if (!fecha) {
            nuevosErrores.fecha_programada = 'La fecha del aviso es obligatoria'
        } else {
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)
            const fechaAviso = new Date(fecha + 'T00:00:00')
            if (fechaAviso <= hoy) {
                nuevosErrores.fecha_programada = 'La fecha del aviso debe ser futura'
            }
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores)
            return
        }

        setErrores({})
        setCargando(true)

        try {
            const resultado = await crearAviso(formData)

            if (resultado.exito) {
                mostrarExito('Aviso programado correctamente')
                router.push(`/vehiculos/${vehiculoId}`)
            } else {
                mostrarError(resultado.error ?? 'Error al crear el aviso')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    // Fecha mínima: mañana
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const fechaMinima = manana.toISOString().split('T')[0]

    return (
        <div className="space-y-6">
            {/* Cabecera con botón volver */}
            <div className="flex items-center gap-3">
                <Link
                    href={`/vehiculos/${vehiculoId}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted hover:bg-secondary-light transition-colors"
                    aria-label="Volver a la ficha del vehículo"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <CalendarPlus className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-foreground">
                        Nuevo Aviso
                    </h2>
                </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="vehiculo_id" value={vehiculoId} />

                <SelectorTipoAviso
                    valor={tipo}
                    onChange={setTipo}
                    error={errores.tipo}
                />

                <CampoTexto
                    etiqueta="Fecha programada"
                    name="fecha_programada"
                    type="date"
                    required
                    min={fechaMinima}
                    error={errores.fecha_programada}
                />

                <SelectorRecurrencia
                    valor={recurrenciaMeses}
                    onChange={setRecurrenciaMeses}
                />

                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="mensaje_personalizado"
                        className="text-sm font-medium text-foreground"
                    >
                        Mensaje personalizado
                    </label>
                    <textarea
                        id="mensaje_personalizado"
                        name="mensaje_personalizado"
                        rows={3}
                        placeholder="Mensaje adicional para el cliente (opcional)"
                        className="min-h-[44px] w-full rounded-lg border border-border px-3 py-2 text-base placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors duration-150"
                    />
                </div>

                <div className="flex flex-col gap-3 pt-2">
                    <Boton
                        type="submit"
                        anchoCompleto
                        cargando={cargando}
                        icono={CalendarPlus}
                    >
                        Programar Aviso
                    </Boton>

                    <Link href={`/vehiculos/${vehiculoId}`}>
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
    )
}
