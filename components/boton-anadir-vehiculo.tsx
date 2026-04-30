'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Boton } from '@/components/ui/boton'

/**
 * Botón "Añadir Vehículo" — Client Component para poder usar iconos Lucide.
 */
export function BotonAnadirVehiculo() {
    return (
        <Link href="/vehiculos/nuevo">
            <Boton tamano="sm" icono={Plus}>
                Añadir Vehículo
            </Boton>
        </Link>
    )
}
