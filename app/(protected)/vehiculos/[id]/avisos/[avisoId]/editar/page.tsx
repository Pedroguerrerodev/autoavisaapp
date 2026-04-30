import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FormularioAviso } from '@/components/formulario-aviso'
import { editarAviso } from '../../actions'

interface Props {
    params: Promise<{ id: string; avisoId: string }>
}

/**
 * Página de edición de aviso.
 * Server Component que carga los datos actuales del aviso (incluyendo recurrencia)
 * y renderiza FormularioAviso en modo edición con la action editarAviso.
 * Solo accesible si el aviso está en estado "pendiente"; redirige en caso contrario.
 */
export default async function PaginaEditarAviso({ params }: Props) {
    const { id, avisoId } = await params
    const supabase = await createClient()

    // Cargar datos actuales del aviso
    const { data: aviso, error } = await supabase
        .from('avisos')
        .select('id, tipo, fecha_programada, mensaje_personalizado, recurrencia_meses, estado')
        .eq('id', avisoId)
        .single()

    // Si no se encuentra el aviso, redirigir a la ficha del vehículo
    if (error || !aviso) {
        redirect(`/vehiculos/${id}`)
    }

    // Solo se pueden editar avisos en estado "pendiente"
    if (aviso.estado !== 'pendiente') {
        redirect(`/vehiculos/${id}`)
    }

    return (
        <div className="space-y-6">
            {/* Cabecera con botón volver */}
            <div className="flex items-center gap-3">
                <Link
                    href={`/vehiculos/${id}`}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted hover:bg-secondary-light transition-colors"
                    aria-label="Volver a la ficha del vehículo"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2">
                    <CalendarPlus className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-foreground">
                        Editar Aviso
                    </h2>
                </div>
            </div>

            {/* Formulario en modo edición */}
            <FormularioAviso
                vehiculoId={id}
                avisoId={aviso.id}
                datosIniciales={{
                    tipo: aviso.tipo,
                    fecha_programada: aviso.fecha_programada,
                    mensaje_personalizado: aviso.mensaje_personalizado,
                    recurrencia_meses: aviso.recurrencia_meses,
                }}
                action={editarAviso}
            />
        </div>
    )
}
