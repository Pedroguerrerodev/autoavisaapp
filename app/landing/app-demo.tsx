'use client'

import { useState, useEffect } from 'react'

type Paso =
    | 'dashboard'
    | 'tap-vehiculo'
    | 'ficha'
    | 'tap-listo'
    | 'enviando'
    | 'enviado'
    | 'reset'

/**
 * Simulación animada de cómo un mecánico usa AutoAvisa en su día a día.
 * Muestra: dashboard → toca vehículo → ficha → pulsa Listo → WhatsApp enviado.
 */
export function AppDemo() {
    const [paso, setPaso] = useState<Paso>('dashboard')

    useEffect(() => {
        const delays: Record<Paso, { next: Paso; ms: number }> = {
            dashboard: { next: 'tap-vehiculo', ms: 2500 },
            'tap-vehiculo': { next: 'ficha', ms: 600 },
            ficha: { next: 'tap-listo', ms: 2500 },
            'tap-listo': { next: 'enviando', ms: 400 },
            enviando: { next: 'enviado', ms: 1500 },
            enviado: { next: 'reset', ms: 3000 },
            reset: { next: 'dashboard', ms: 500 },
        }

        const { next, ms } = delays[paso]
        const timer = setTimeout(() => setPaso(next), ms)
        return () => clearTimeout(timer)
    }, [paso])

    return (
        <div className="w-full max-w-[300px] mx-auto">
            {/* Marco del móvil */}
            <div className="rounded-[2rem] border-[3px] border-slate-800 bg-slate-800 p-1.5 shadow-2xl">
                {/* Notch */}
                <div className="mx-auto mb-1 h-5 w-24 rounded-full bg-slate-900" />

                {/* Pantalla */}
                <div className="overflow-hidden rounded-[1.25rem] bg-white min-h-[420px] flex flex-col">
                    {/* Header de la app */}
                    <div className="flex items-center justify-between bg-white px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white">A</div>
                            <span className="text-xs font-semibold text-slate-900">AutoAvisa</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center">
                                <span className="text-[7px] font-bold text-slate-500">AG</span>
                            </div>
                        </div>
                    </div>

                    {/* Contenido animado */}
                    <div className="flex-1 bg-slate-50 p-3 flex flex-col">
                        {(paso === 'dashboard' || paso === 'tap-vehiculo') && (
                            <DashboardView pulsado={paso === 'tap-vehiculo'} />
                        )}

                        {(paso === 'ficha' || paso === 'tap-listo') && (
                            <FichaView pulsado={paso === 'tap-listo'} />
                        )}

                        {paso === 'enviando' && <EnviandoView />}

                        {paso === 'enviado' && <EnviadoView />}

                        {paso === 'reset' && (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Indicador de paso */}
            <p className="mt-4 text-center text-xs text-slate-400">
                {paso === 'dashboard' && '📋 El mecánico abre la app por la mañana'}
                {paso === 'tap-vehiculo' && '👆 Toca el coche que acaba de reparar'}
                {paso === 'ficha' && '📄 Ve la ficha con los datos del cliente'}
                {paso === 'tap-listo' && '👆 Pulsa "Listo ✅"'}
                {paso === 'enviando' && '📤 Enviando WhatsApp...'}
                {paso === 'enviado' && '✅ ¡Cliente avisado! Sin llamar.'}
                {paso === 'reset' && ''}
            </p>
        </div>
    )
}

function DashboardView({ pulsado }: { pulsado: boolean }) {
    return (
        <div className="animate-fade-in space-y-2.5">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trabajos en curso</p>

            {/* Tarjeta 1 — la que se pulsa */}
            <div className={`rounded-xl border bg-white p-3 transition-all duration-200 ${pulsado ? 'scale-95 border-blue-300 bg-blue-50' : 'border-slate-200'}`}>
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center overflow-hidden rounded-md border border-slate-200">
                        <div className="h-7 w-1.5 bg-blue-600" />
                        <span className="px-2 text-[10px] font-bold tracking-wider text-slate-800">5678 XYZ</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-slate-700 truncate">Seat Ibiza · Pedro G.</p>
                        <p className="text-[9px] text-slate-400">Cambio de pastillas</p>
                    </div>
                    <div className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">
                        En curso
                    </div>
                </div>
            </div>

            {/* Tarjeta 2 */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 opacity-60">
                <div className="flex items-center gap-2.5">
                    <div className="flex items-center overflow-hidden rounded-md border border-slate-200">
                        <div className="h-7 w-1.5 bg-blue-600" />
                        <span className="px-2 text-[10px] font-bold tracking-wider text-slate-800">1234 ABC</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-medium text-slate-700 truncate">Audi A3 · Juan P.</p>
                        <p className="text-[9px] text-slate-400">Revisión general</p>
                    </div>
                    <div className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700">
                        En curso
                    </div>
                </div>
            </div>

            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-3">Avisos de hoy</p>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm">🛢️</span>
                    <div>
                        <p className="text-[10px] font-medium text-slate-700">9012 DEF · Cambio de aceite</p>
                        <p className="text-[9px] text-slate-400">María López · +34612345678</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FichaView({ pulsado }: { pulsado: boolean }) {
    return (
        <div className="animate-fade-in space-y-3">
            {/* Botón volver */}
            <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">←</div>
                <p className="text-xs font-semibold text-slate-900">Ficha del Vehículo</p>
            </div>

            {/* Matrícula */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center overflow-hidden rounded-md border border-slate-200">
                        <div className="h-8 w-2 bg-blue-600" />
                        <span className="px-2.5 text-xs font-bold tracking-widest text-slate-800">5678 XYZ</span>
                    </div>
                </div>
                <p className="text-[10px] text-slate-500">Seat Ibiza · Pedro Guerrero</p>
                <p className="text-[10px] text-slate-400">+34612345678</p>
            </div>

            {/* Trabajo en curso */}
            <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Trabajo en curso</p>
                <p className="text-[10px] font-medium text-slate-700 mb-3">Cambio de pastillas de freno</p>

                {/* Botón Listo */}
                <button
                    className={`w-full rounded-lg py-2.5 text-xs font-semibold text-white transition-all duration-200 ${pulsado
                        ? 'scale-95 bg-green-700'
                        : 'bg-green-600 hover:bg-green-700'
                        }`}
                >
                    Listo ✅
                </button>
            </div>
        </div>
    )
}

function EnviandoView() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in gap-4">
            <div className="relative">
                <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="h-7 w-7 text-green-600 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </div>
                {/* Ondas */}
                <div className="absolute inset-0 rounded-full border-2 border-green-300 animate-ping opacity-30" />
            </div>
            <div className="text-center">
                <p className="text-xs font-semibold text-slate-700">Enviando WhatsApp...</p>
                <p className="text-[10px] text-slate-400 mt-0.5">a Pedro Guerrero (+34612345678)</p>
            </div>
        </div>
    )
}

function EnviadoView() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center animate-fade-in gap-4">
            <div className="h-14 w-14 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <div className="text-center">
                <p className="text-xs font-semibold text-slate-900">¡WhatsApp enviado!</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                    Pedro ya sabe que su Seat Ibiza está listo para recoger
                </p>
            </div>

            {/* Mini preview del mensaje */}
            <div className="w-full max-w-[240px] rounded-xl bg-[#ece5dd] p-2.5">
                <div className="rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                    <p className="text-[10px] leading-relaxed text-slate-700">
                        🔧 ¡Hola Pedro! Desde <strong>Talleres García</strong> te informamos que tu <strong>5678 XYZ</strong> ya está listo. ¡Puedes pasar a recogerlo!
                    </p>
                    <div className="mt-1 flex items-center justify-end gap-0.5">
                        <span className="text-[8px] text-slate-400">10:32</span>
                        <svg className="h-3 w-3 text-blue-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 8.5l3 3 5-6" />
                            <path d="M5 8.5l3 3 5-6" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    )
}
