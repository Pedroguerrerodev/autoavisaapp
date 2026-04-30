import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Car } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FormularioVehiculo } from '@/components/formulario-vehiculo'
import { editarVehiculo } from '../../actions'

interface Props {
    params: Promise<{ id: string }>
}

/**
 * Página de edición de vehículo.
 * Server Component que carga los datos actuales y renderiza
 * FormularioVehiculo en modo edición con la action editarVehiculo.
 */
export default async function PaginaEditarVehiculo({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    // Cargar datos actuales del vehículo
    const { data: vehiculo, error } = await supabase
        .from('vehiculos')
        .select('id, matricula, marca, modelo, telefono_cliente, nombre_cliente, notas')
        .eq('id', id)
        .single()

    if (error || !vehiculo) {
        redirect('/dashboard')
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
                    <Car className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="text-xl font-semibold text-foreground">
                        Editar Vehículo
                    </h2>
                </div>
            </div>

            {/* Formulario en modo edición */}
            <FormularioVehiculo
                vehiculoId={vehiculo.id}
                datosIniciales={{
                    matricula: vehiculo.matricula,
                    marca: vehiculo.marca,
                    modelo: vehiculo.modelo,
                    telefono_cliente: vehiculo.telefono_cliente,
                    nombre_cliente: vehiculo.nombre_cliente,
                    notas: vehiculo.notas,
                }}
                action={editarVehiculo}
            />
        </div>
    )
}
