'use client'

import { useState } from 'react'
import { BuscadorMatricula } from '@/components/buscador-matricula'
import { VehiculoCard } from '@/components/vehiculo-card'

export interface VehiculoConAvisos {
    id: string
    matricula: string
    marca: string
    modelo: string
    nombre_cliente: string | null
    telefono_cliente: string
    avisos_pendientes: number
    proximo_aviso: string | null
}

interface DashboardVehiculosProps {
    vehiculos: VehiculoConAvisos[]
}

/**
 * Componente cliente que envuelve la lista de vehículos con el buscador.
 * Filtra vehículos por matrícula en tiempo real (case-insensitive).
 */
export function DashboardVehiculos({ vehiculos }: DashboardVehiculosProps) {
    const [busqueda, setBusqueda] = useState('')

    const vehiculosFiltrados = busqueda
        ? vehiculos.filter((v) =>
            v.matricula.toLowerCase().includes(busqueda.toLowerCase())
        )
        : vehiculos

    return (
        <div>
            {/* Buscador por matrícula */}
            <BuscadorMatricula onFiltrar={setBusqueda} />

            {/* Lista de vehículos */}
            {vehiculosFiltrados.length > 0 ? (
                <div className="mt-4 grid gap-3">
                    {vehiculosFiltrados.map((vehiculo) => (
                        <VehiculoCard
                            key={vehiculo.id}
                            id={vehiculo.id}
                            matricula={vehiculo.matricula}
                            marca={vehiculo.marca}
                            modelo={vehiculo.modelo}
                            nombre_cliente={vehiculo.nombre_cliente}
                            telefono_cliente={vehiculo.telefono_cliente}
                            avisos_pendientes={vehiculo.avisos_pendientes}
                            proximo_aviso={vehiculo.proximo_aviso}
                        />
                    ))}
                </div>
            ) : busqueda ? (
                <div className="mt-6 text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50">
                        <span className="text-xl">🔍</span>
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                        No se encontraron vehículos con esa matrícula.
                    </p>
                </div>
            ) : null}
        </div>
    )
}
