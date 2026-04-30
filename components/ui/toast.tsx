'use client'

import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

/** Variantes de toast disponibles */
type ToastVariante = 'exito' | 'error'

interface Toast {
    id: number
    mensaje: string
    variante: ToastVariante
    saliendo: boolean
}

interface ToastContexto {
    mostrarExito: (mensaje: string) => void
    mostrarError: (mensaje: string) => void
}

const ToastContext = createContext<ToastContexto | null>(null)

let toastId = 0

/** Hook para mostrar toasts desde cualquier componente */
export function useToast(): ToastContexto {
    const contexto = useContext(ToastContext)
    if (!contexto) {
        throw new Error('useToast debe usarse dentro de un ToastProvider')
    }
    return contexto
}

/** Proveedor de toasts — envuelve la app en el layout raíz */
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const eliminarToast = useCallback((id: number) => {
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, saliendo: true } : t))
        )
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 300)
    }, [])

    const agregarToast = useCallback(
        (mensaje: string, variante: ToastVariante) => {
            const id = ++toastId
            setToasts((prev) => [...prev, { id, mensaje, variante, saliendo: false }])
            setTimeout(() => eliminarToast(id), 3000)
        },
        [eliminarToast]
    )

    const mostrarExito = useCallback(
        (mensaje: string) => agregarToast(mensaje, 'exito'),
        [agregarToast]
    )

    const mostrarError = useCallback(
        (mensaje: string) => agregarToast(mensaje, 'error'),
        [agregarToast]
    )

    return (
        <ToastContext.Provider value={{ mostrarExito, mostrarError }}>
            {children}
            <div
                aria-live="polite"
                className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 flex-col gap-2"
            >
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => eliminarToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

/** Componente individual de toast */
function ToastItem({
    toast,
    onClose,
}: {
    toast: Toast
    onClose: () => void
}) {
    const esExito = toast.variante === 'exito'

    return (
        <div
            role="status"
            className={`flex min-w-[300px] max-w-[90vw] items-center gap-3 rounded-2xl px-5 py-3.5 shadow-lg backdrop-blur-sm ${toast.saliendo ? 'toast-exit' : 'toast-enter'
                } ${esExito
                    ? 'bg-emerald-50/95 text-emerald-900 border border-emerald-200/80'
                    : 'bg-red-50/95 text-red-900 border border-red-200/80'
                }`}
        >
            {esExito ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-500" />
            ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-500" />
            )}
            <p className="flex-1 text-sm font-medium">{toast.mensaje}</p>
            <button
                onClick={onClose}
                className="shrink-0 rounded-lg p-1 text-current opacity-50 hover:opacity-100 hover:bg-black/5 transition-all"
                aria-label="Cerrar notificación"
            >
                <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 1l12 12M13 1L1 13" />
                </svg>
            </button>
        </div>
    )
}
