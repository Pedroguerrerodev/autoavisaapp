'use client'

import { Car, Phone, User, StickyNote } from 'lucide-react'

interface VehiculoInfoProps {
    matricula: string
    marca: string
    modelo: string
    telefono_cliente: string
    nombre_cliente: string | null
    notas: string | null
}

/**
 * Datos del vehículo con iconos — Client Component.
 */
export function VehiculoInfo({ matricula, marca, modelo, telefono_cliente, nombre_cliente, notas }: VehiculoInfoProps) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            {/* License plate as hero element */}
            <div className="mb-1 flex items-center gap-3">
                <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex h-12 w-3 items-center justify-center bg-gradient-to-b from-blue-600 to-blue-700" />
                    <div className="flex h-12 items-center px-4">
                        <span className="text-lg font-bold tracking-widest text-slate-800">
                            {matricula}
                        </span>
                    </div>
                </div>
            </div>
            {(marca || modelo) && (
                <p className="mb-4 ml-1 text-sm font-medium text-slate-500">
                    {marca} {modelo}
                </p>
            )}

            {/* Info grid */}
            <div className="grid gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                        <Phone className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{telefono_cliente}</span>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-slate-50/80 px-4 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                        <User className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{nombre_cliente ?? 'Sin nombre'}</span>
                </div>

                {notas && (
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 px-4 py-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                            <StickyNote className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <span className="text-sm text-slate-600 leading-relaxed">{notas}</span>
                    </div>
                )}
            </div>
        </div>
    )
}
