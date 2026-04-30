'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { Boton } from '@/components/ui/boton'
import { useToast } from '@/components/ui/toast'
import { SelectorTipoAviso } from '@/components/selector-tipo-aviso'
import { enviarAvisoManual } from './actions'
import type { TipoAviso } from '@/types/database'

/**
 * Formulario de envío manual de aviso por WhatsApp.
 * Client Component con selector de tipo y mensaje opcional.
 */
export default function PaginaEnviarAviso() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const vehiculoId = params.id
    const { mostrarExito, mostrarError } = useToast()

    const [tipo, setTipo] = useState<TipoAviso | ''>('')
    const [cargando, setCargando] = useState(false)
    const [errores, setErrores] = useState<Record<string, string>>({})

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)

        formData.set('vehiculo_id', vehiculoId)

        // Validación client-side
        const nuevosErrores: Record<string, string> = {}

        if (!tipo) {
            nuevosErrores.tipo = 'Selecciona un tipo de mantenimiento'
        }

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores)
            return
        }

        setErrores({})
        setCargando(true)

        try {
            const resultado = await enviarAvisoManual(formData)

            if (resultado.exito) {
                mostrarExito('Aviso enviado correctamente')
                router.push(`/vehiculos/${vehiculoId}`)
            } else {
                mostrarError(resultado.error ?? 'Error al enviar el aviso')
            }
        } catch {
            mostrarError('Error de conexión. Inténtalo de nuevo.')
        } finally {
            setCargando(false)
        }
    }

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
                    <Send className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-foreground">
                        Enviar Aviso 🔔
                    </h2>
                </div>
            </div>

            <p className="text-sm text-muted">
                Envía un aviso de mantenimiento al cliente de forma inmediata por WhatsApp.
            </p>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input type="hidden" name="vehiculo_id" value={vehiculoId} />

                <SelectorTipoAviso
                    valor={tipo}
                    onChange={setTipo}
                    error={errores.tipo}
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
                        variante="exito"
                        icono={Send}
                    >
                        Enviar Aviso 🔔
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
