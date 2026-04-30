'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus } from 'lucide-react'
import { CampoTexto } from '@/components/ui/campo-texto'
import { Boton } from '@/components/ui/boton'
import { useToast } from '@/components/ui/toast'
import { SelectorTipoAviso } from '@/components/selector-tipo-aviso'
import { SelectorRecurrencia } from '@/components/selector-recurrencia'
import type { TipoAviso } from '@/types/database'

/** Resultado estándar de una Server Action */
interface ResultadoAccion {
    exito: boolean
    error?: string
    avisoId?: string
}

/** Datos iniciales para modo edición */
interface DatosInicialesAviso {
    tipo: TipoAviso
    fecha_programada: string
    mensaje_personalizado: string | null
    recurrencia_meses: number | null
}

interface FormularioAvisoProps {
    /** ID del vehículo al que pertenece el aviso */
    vehiculoId: string
    /** Si existe, el formulario está en modo edición */
    avisoId?: string
    /** Datos actuales del aviso para pre-rellenar (modo edición) */
    datosIniciales?: DatosInicialesAviso
    /** Server Action que procesa el formulario */
    action: (formData: FormData) => Promise<ResultadoAccion>
}

/**
 * Formulario reutilizable para crear y editar avisos de mantenimiento.
 */
export function FormularioAviso({
    vehiculoId,
    avisoId,
    datosIniciales,
    action,
}: FormularioAvisoProps) {
    const router = useRouter()
    const { mostrarExito, mostrarError } = useToast()
    const [cargando, setCargando] = useState(false)
    const [errores, setErrores] = useState<Record<string, string>>({})

    const modoEdicion = !!datosIniciales

    const [tipo, setTipo] = useState<TipoAviso | ''>(datosIniciales?.tipo ?? '')
    const [recurrenciaMeses, setRecurrenciaMeses] = useState<number | null>(
        datosIniciales?.recurrencia_meses ?? null
    )

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        formData.set('vehiculo_id', vehiculoId)
        if (avisoId) {
            formData.set('avisoId', avisoId)
        }

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
            if (fechaAviso < hoy) {
                nuevosErrores.fecha_programada = 'La fecha del aviso debe ser igual o posterior a hoy'
            }
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
                        ? 'Aviso actualizado correctamente'
                        : 'Aviso programado correctamente'
                )
                router.push(`/vehiculos/${vehiculoId}`)
            } else {
                mostrarError(resultado.error ?? 'Error al guardar el aviso')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

    // Fecha mínima: hoy para edición, mañana para creación
    const fechaMinima = (() => {
        const d = new Date()
        if (!modoEdicion) {
            d.setDate(d.getDate() + 1)
        }
        return d.toISOString().split('T')[0]
    })()

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
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
                defaultValue={datosIniciales?.fecha_programada ?? ''}
            />

            <SelectorRecurrencia
                valor={recurrenciaMeses}
                onChange={setRecurrenciaMeses}
            />

            <div className="flex flex-col gap-2">
                <label
                    htmlFor="mensaje_personalizado"
                    className="text-sm font-medium text-slate-700 tracking-[-0.01em]"
                >
                    Mensaje personalizado
                </label>
                <textarea
                    id="mensaje_personalizado"
                    name="mensaje_personalizado"
                    rows={3}
                    placeholder="Mensaje adicional para el cliente (opcional)"
                    defaultValue={datosIniciales?.mensaje_personalizado ?? ''}
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:shadow-md hover:border-slate-300"
                />
            </div>

            <div className="flex flex-col gap-3 pt-2">
                <Boton
                    type="submit"
                    anchoCompleto
                    cargando={cargando}
                    icono={CalendarPlus}
                >
                    {modoEdicion ? 'Guardar Cambios' : 'Programar Aviso'}
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
