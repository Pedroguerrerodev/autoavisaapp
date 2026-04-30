'use client'

import { useState, useEffect } from 'react'

const mensajes = [
    {
        taller: 'Talleres García',
        matricula: '1234 ABC',
        tipo: 'cambio de aceite',
        emoji: '🛢️',
    },
    {
        taller: 'AutoPro Madrid',
        matricula: '5678 XYZ',
        tipo: 'ITV',
        emoji: '🚗',
    },
    {
        taller: 'Talleres López',
        matricula: '9012 DEF',
        tipo: 'revisión de frenos',
        emoji: '🔧',
    },
]

/**
 * Simulación animada de mensajes WhatsApp enviándose automáticamente.
 */
export function WhatsAppDemo() {
    const [indice, setIndice] = useState(0)
    const [fase, setFase] = useState<'escribiendo' | 'enviado' | 'pausa'>('escribiendo')

    useEffect(() => {
        const timers: NodeJS.Timeout[] = []

        // Ciclo: escribiendo (1.5s) → enviado (2.5s) → pausa (0.5s) → siguiente
        timers.push(setTimeout(() => setFase('enviado'), 1500))
        timers.push(setTimeout(() => setFase('pausa'), 4000))
        timers.push(setTimeout(() => {
            setIndice((prev) => (prev + 1) % mensajes.length)
            setFase('escribiendo')
        }, 4500))

        return () => timers.forEach(clearTimeout)
    }, [indice])

    const msg = mensajes[indice]

    return (
        <div className="w-full max-w-xs mx-auto">
            {/* Cabecera WhatsApp */}
            <div className="flex items-center gap-2.5 rounded-t-2xl bg-[#075e54] px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
                    A
                </div>
                <div>
                    <p className="text-sm font-medium text-white">AutoAvisa</p>
                    <p className="text-[10px] text-green-200">
                        {fase === 'escribiendo' ? 'escribiendo...' : 'en línea'}
                    </p>
                </div>
            </div>

            {/* Chat */}
            <div className="bg-[#ece5dd] px-3 py-4 rounded-b-2xl min-h-[140px] flex flex-col justify-end">
                {fase === 'escribiendo' && (
                    <div className="self-start animate-fade-in">
                        <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 shadow-sm">
                            <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                {fase === 'enviado' && (
                    <div className="self-start animate-fade-in">
                        <div className="max-w-[260px] rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 shadow-sm">
                            <p className="text-[13px] leading-relaxed text-slate-800">
                                {msg.emoji} ¡Hola! Desde <strong>{msg.taller}</strong> te recordamos que a tu vehículo <strong>{msg.matricula}</strong> le toca: <strong>{msg.tipo}</strong>. ¡Te esperamos!
                            </p>
                            <div className="mt-1 flex items-center justify-end gap-1">
                                <span className="text-[10px] text-slate-400">08:00</span>
                                <svg className="h-3.5 w-3.5 text-blue-500" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M2 8.5l3 3 5-6" />
                                    <path d="M5 8.5l3 3 5-6" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
