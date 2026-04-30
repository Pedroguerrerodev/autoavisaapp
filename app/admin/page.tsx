'use client'

import { useState, useEffect, useCallback } from 'react'
import { Boton } from '@/components/ui/boton'
import { CampoTexto } from '@/components/ui/campo-texto'
import { useToast } from '@/components/ui/toast'
import { Building2, UserPlus, Shield, Trash2, KeyRound, Users, Car, Bell, RefreshCw, MessageSquare } from 'lucide-react'

interface Usuario {
    id: string
    nombre: string
    rol: string
    email: string
    created_at: string
}

interface AvisoEnviado {
    id: string
    tipo: string
    fecha_programada: string
    fecha_envio: string | null
    es_manual: boolean
    matricula: string
    telefono_cliente: string
    nombre_cliente: string | null
}

interface Taller {
    id: string
    nombre: string
    telefono_taller: string | null
    created_at: string
    num_vehiculos: number
    num_avisos: number
    num_enviados: number
    avisos_enviados: AvisoEnviado[]
    usuarios: Usuario[]
}

export default function PaginaAdmin() {
    const { mostrarExito, mostrarError } = useToast()
    const [autenticado, setAutenticado] = useState(false)
    const [adminSecret, setAdminSecret] = useState('')
    const [pestana, setPestana] = useState<'crear' | 'listar'>('listar')

    // Estado crear taller
    const [cargando, setCargando] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [nombreTaller, setNombreTaller] = useState('')
    const [telefonoTaller, setTelefonoTaller] = useState('')
    const [nombreDueno, setNombreDueno] = useState('')

    // Estado listar talleres
    const [talleres, setTalleres] = useState<Taller[]>([])
    const [cargandoLista, setCargandoLista] = useState(false)

    // Estado resetear contraseña
    const [resetUserId, setResetUserId] = useState<string | null>(null)
    const [nuevaPassword, setNuevaPassword] = useState('')

    // Estado añadir trabajador
    const [addWorkerTallerId, setAddWorkerTallerId] = useState<string | null>(null)
    const [addWorkerTallerNombre, setAddWorkerTallerNombre] = useState('')
    const [workerNombre, setWorkerNombre] = useState('')
    const [workerEmail, setWorkerEmail] = useState('')
    const [workerPassword, setWorkerPassword] = useState('')

    const cargarTalleres = useCallback(async () => {
        setCargandoLista(true)
        try {
            const res = await fetch('/api/admin/listar-talleres', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_secret: adminSecret }),
            })
            const data = await res.json()
            if (data.talleres) {
                setTalleres(data.talleres)
            } else if (res.status === 401) {
                setAutenticado(false)
            } else {
                mostrarError(data.error || 'Error al cargar talleres')
            }
        } catch {
            mostrarError('Error de conexión')
        } finally {
            setCargandoLista(false)
        }
    }, [adminSecret, mostrarError])

    useEffect(() => {
        if (autenticado) cargarTalleres()
    }, [autenticado, cargarTalleres])

    function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        if (adminSecret.trim()) setAutenticado(true)
    }

    async function handleCrearTaller(e: React.FormEvent) {
        e.preventDefault()
        setCargando(true)
        try {
            const res = await fetch('/api/admin/crear-taller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_secret: adminSecret, email, password,
                    nombre_taller: nombreTaller, telefono_taller: telefonoTaller,
                    nombre_dueno: nombreDueno,
                }),
            })
            const data = await res.json()
            if (data.exito) {
                mostrarExito(`Taller "${nombreTaller}" creado`)
                setEmail(''); setPassword(''); setNombreTaller('')
                setTelefonoTaller(''); setNombreDueno('')
                setPestana('listar')
                cargarTalleres()
            } else {
                mostrarError(data.error || 'Error')
                if (res.status === 401) setAutenticado(false)
            }
        } catch { mostrarError('Error de conexión') }
        finally { setCargando(false) }
    }

    async function handleEliminarTaller(tallerId: string, nombre: string) {
        if (!window.confirm(`¿Eliminar "${nombre}" y TODOS sus datos (vehículos, avisos, usuarios)? Esta acción NO se puede deshacer.`)) return
        try {
            const res = await fetch('/api/admin/eliminar-taller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_secret: adminSecret, taller_id: tallerId }),
            })
            const data = await res.json()
            if (data.exito) {
                mostrarExito(data.mensaje)
                cargarTalleres()
            } else { mostrarError(data.error) }
        } catch { mostrarError('Error de conexión') }
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault()
        if (!resetUserId) return
        try {
            const res = await fetch('/api/admin/resetear-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_secret: adminSecret, user_id: resetUserId, new_password: nuevaPassword }),
            })
            const data = await res.json()
            if (data.exito) {
                mostrarExito('Contraseña actualizada')
                setResetUserId(null); setNuevaPassword('')
            } else { mostrarError(data.error) }
        } catch { mostrarError('Error de conexión') }
    }

    async function handleAnadirTrabajador(e: React.FormEvent) {
        e.preventDefault()
        if (!addWorkerTallerId) return
        try {
            const res = await fetch('/api/admin/anadir-trabajador', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_secret: adminSecret,
                    taller_id: addWorkerTallerId,
                    email: workerEmail,
                    password: workerPassword,
                    nombre: workerNombre,
                }),
            })
            const data = await res.json()
            if (data.exito) {
                mostrarExito(data.mensaje)
                setAddWorkerTallerId(null)
                setWorkerNombre(''); setWorkerEmail(''); setWorkerPassword('')
                cargarTalleres()
            } else { mostrarError(data.error) }
        } catch { mostrarError('Error de conexión') }
    }

    // Login
    if (!autenticado) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 px-4">
                <div className="w-full max-w-sm animate-fade-in">
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg shadow-slate-500/20">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Panel Admin</h1>
                        <p className="mt-1.5 text-sm text-slate-500">AutoAvisa — Gestión de talleres</p>
                    </div>
                    <form onSubmit={handleLogin} className="rounded-2xl border border-white/80 bg-white/70 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-xl space-y-5">
                        <CampoTexto etiqueta="Contraseña de administrador" type="password" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} required placeholder="Introduce la contraseña" />
                        <Boton type="submit" anchoCompleto icono={Shield}>Acceder</Boton>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 shadow-sm">
                            <Shield className="h-4 w-4 text-white" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">Admin</h1>
                    </div>
                    <button
                        onClick={() => setAutenticado(false)}
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:text-slate-700 hover:shadow active:scale-[0.97]"
                    >
                        Cerrar
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-4 py-8 space-y-8">
                {/* Tabs — underline style */}
                <div className="flex gap-1 border-b border-slate-200">
                    <button
                        onClick={() => setPestana('listar')}
                        className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${pestana === 'listar'
                            ? 'text-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Talleres
                        {talleres.length > 0 && (
                            <span className={`ml-1.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-bold ${pestana === 'listar' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {talleres.length}
                            </span>
                        )}
                        {pestana === 'listar' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setPestana('crear')}
                        className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${pestana === 'crear'
                            ? 'text-blue-600'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Crear Taller
                        {pestana === 'crear' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                        )}
                    </button>
                </div>

                {/* Pestaña: Listar talleres */}
                {pestana === 'listar' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-semibold text-slate-800">Talleres registrados</h2>
                            <Boton tamano="sm" variante="secundario" icono={RefreshCw} cargando={cargandoLista} onClick={cargarTalleres}>Actualizar</Boton>
                        </div>

                        {talleres.length === 0 && !cargandoLista && (
                            <div className="rounded-2xl border border-slate-200/80 bg-white p-10 text-center shadow-sm">
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50">
                                    <Building2 className="h-6 w-6 text-slate-400" />
                                </div>
                                <p className="font-medium text-slate-500">No hay talleres registrados.</p>
                            </div>
                        )}

                        {talleres.map((taller) => (
                            <div key={taller.id} className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                                <div className="p-5">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                                                    <Building2 className="h-4.5 w-4.5" />
                                                </div>
                                                <h3 className="font-bold text-slate-800">{taller.nombre}</h3>
                                            </div>
                                            {taller.telefono_taller && <p className="mt-1.5 ml-[46px] text-sm text-slate-500">{taller.telefono_taller}</p>}
                                            <div className="mt-2 ml-[46px] flex flex-wrap gap-3 text-xs text-slate-500">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200/80">
                                                    <Car className="h-3 w-3" />{taller.num_vehiculos} vehículos
                                                </span>
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2 py-0.5 ring-1 ring-slate-200/80">
                                                    <Bell className="h-3 w-3" />{taller.num_avisos} avisos
                                                </span>
                                                <span className="text-slate-400">
                                                    Creado: {new Date(taller.created_at).toLocaleDateString('es-ES')}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleEliminarTaller(taller.id, taller.nombre)}
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                                            title="Eliminar taller"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Usuarios del taller */}
                                <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
                                    <div className="flex items-center justify-between mb-2.5">
                                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                                            <Users className="h-3.5 w-3.5" />Usuarios ({taller.usuarios.length}/3)
                                        </p>
                                        {taller.usuarios.length < 3 && (
                                            <button
                                                onClick={() => {
                                                    setAddWorkerTallerId(taller.id)
                                                    setAddWorkerTallerNombre(taller.nombre)
                                                    setWorkerNombre(''); setWorkerEmail(''); setWorkerPassword('')
                                                }}
                                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-all"
                                            >
                                                <UserPlus className="h-3 w-3" />
                                                Añadir trabajador
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {taller.usuarios.map((u) => (
                                            <div key={u.id} className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-slate-200/80">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-[10px] font-bold text-slate-600">
                                                        {u.nombre.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-slate-700">{u.nombre}</span>
                                                        <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${u.rol === 'dueño' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80' : 'bg-slate-50 text-slate-500 ring-1 ring-slate-200/80'}`}>{u.rol}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="hidden text-xs text-slate-400 sm:inline">{u.email}</span>
                                                    <button
                                                        onClick={() => { setResetUserId(u.id); setNuevaPassword('') }}
                                                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-50 hover:text-blue-600 transition-all"
                                                        title="Cambiar contraseña"
                                                    >
                                                        <KeyRound className="h-3 w-3" />
                                                        <span className="hidden sm:inline">Contraseña</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Historial de avisos enviados */}
                                {taller.avisos_enviados.length > 0 && (
                                    <div className="border-t border-slate-100 px-5 py-4">
                                        <p className="text-xs font-semibold text-slate-500 mb-2.5 flex items-center gap-1.5">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            Últimos WhatsApp enviados ({taller.avisos_enviados.length})
                                        </p>
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                            {taller.avisos_enviados.map((a) => (
                                                <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="shrink-0 inline-flex items-center rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-green-200/80">
                                                            {a.es_manual ? 'Manual' : 'Auto'}
                                                        </span>
                                                        <span className="font-medium text-slate-700 truncate">{a.matricula}</span>
                                                        <span className="text-slate-400 truncate">{a.nombre_cliente ?? '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        <span className="text-slate-500 font-mono">{a.telefono_cliente}</span>
                                                        <span className="text-slate-400">{a.tipo}</span>
                                                        <span className="text-slate-400">
                                                            {a.fecha_envio
                                                                ? new Date(a.fecha_envio).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
                                                                : '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Pestaña: Crear taller */}
                {pestana === 'crear' && (
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                                <Building2 className="h-4.5 w-4.5" />
                            </div>
                            <h2 className="text-base font-semibold text-slate-800">Crear Nuevo Taller</h2>
                        </div>
                        <form onSubmit={handleCrearTaller} className="space-y-5">
                            <div className="rounded-xl bg-blue-50/80 border border-blue-100 px-4 py-3">
                                <p className="text-sm text-blue-700 font-semibold">📋 Datos del taller</p>
                            </div>
                            <CampoTexto etiqueta="Nombre del taller" value={nombreTaller} onChange={(e) => setNombreTaller(e.target.value)} required placeholder="Ej: Talleres García e Hijos" />
                            <CampoTexto etiqueta="Teléfono del taller" type="tel" value={telefonoTaller} onChange={(e) => setTelefonoTaller(e.target.value)} placeholder="+34912345678 (opcional)" />

                            <div className="rounded-xl bg-emerald-50/80 border border-emerald-100 px-4 py-3">
                                <p className="text-sm text-emerald-700 font-semibold">👤 Datos del dueño</p>
                            </div>
                            <CampoTexto etiqueta="Nombre del dueño" value={nombreDueno} onChange={(e) => setNombreDueno(e.target.value)} required placeholder="Ej: Antonio García López" />
                            <CampoTexto etiqueta="Email de acceso" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="dueno@taller.com" />
                            <CampoTexto etiqueta="Contraseña de acceso" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />

                            <div className="pt-2">
                                <Boton type="submit" anchoCompleto cargando={cargando} icono={UserPlus}>Crear Taller</Boton>
                            </div>
                        </form>
                    </div>
                )}

                {/* Modal resetear contraseña */}
                {resetUserId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
                            <h3 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                                    <KeyRound className="h-4 w-4" />
                                </div>
                                Cambiar contraseña
                            </h3>
                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <CampoTexto etiqueta="Nueva contraseña" type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
                                <div className="flex gap-2.5">
                                    <Boton type="submit" anchoCompleto icono={KeyRound}>Guardar</Boton>
                                    <Boton type="button" variante="secundario" anchoCompleto onClick={() => setResetUserId(null)}>Cancelar</Boton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal añadir trabajador */}
                {addWorkerTallerId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
                            <h3 className="text-base font-semibold text-slate-800 mb-1 flex items-center gap-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                                    <UserPlus className="h-4 w-4" />
                                </div>
                                Añadir trabajador
                            </h3>
                            <p className="text-sm text-slate-500 mb-5 ml-[46px]">a {addWorkerTallerNombre}</p>
                            <form onSubmit={handleAnadirTrabajador} className="space-y-4">
                                <CampoTexto etiqueta="Nombre del trabajador" value={workerNombre} onChange={(e) => setWorkerNombre(e.target.value)} required placeholder="Ej: María López" />
                                <CampoTexto etiqueta="Email de acceso" type="email" value={workerEmail} onChange={(e) => setWorkerEmail(e.target.value)} required placeholder="trabajador@email.com" />
                                <CampoTexto etiqueta="Contraseña" type="password" value={workerPassword} onChange={(e) => setWorkerPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
                                <div className="flex gap-2.5 pt-1">
                                    <Boton type="submit" anchoCompleto icono={UserPlus}>Añadir</Boton>
                                    <Boton type="button" variante="secundario" anchoCompleto onClick={() => setAddWorkerTallerId(null)}>Cancelar</Boton>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
