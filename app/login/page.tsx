import { LoginForm } from './login-form'

export default async function PaginaLogin({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = await searchParams

    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Panel izquierdo — branding (solo desktop) */}
            <div className="hidden lg:flex lg:w-[480px] lg:flex-col lg:justify-between bg-slate-900 p-10 text-white">
                <div>
                    <div className="flex items-center gap-2.5">
                        <img src="/logo-autoavisa.jpg" alt="AutoAvisa" className="h-9 w-9 rounded-lg object-cover" />
                        <span className="text-lg font-semibold tracking-tight">AutoAvisa</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-3xl font-semibold leading-tight tracking-tight">
                        Tus clientes no se olvidan del taller.
                        <br />
                        <span className="text-blue-400">El taller no se olvida de ellos.</span>
                    </h2>
                    <p className="text-base leading-relaxed text-slate-400">
                        Programa avisos de mantenimiento y envía recordatorios por WhatsApp.
                        Automático. Sin esfuerzo. Tus clientes vuelven.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">✓</div>
                        <p className="text-sm text-slate-400">Avisos automáticos por WhatsApp cuando toca la revisión</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">✓</div>
                        <p className="text-sm text-slate-400">Avisa al cliente en un clic cuando su coche está listo</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">✓</div>
                        <p className="text-sm text-slate-400">Diseñado para mecánicos, no para informáticos</p>
                    </div>
                </div>
            </div>

            {/* Panel derecho — formulario */}
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-[360px]">
                    {/* Logo mobile */}
                    <div className="mb-10 lg:hidden">
                        <div className="flex items-center gap-2.5">
                            <img src="/logo-autoavisa.jpg" alt="AutoAvisa" className="h-9 w-9 rounded-lg object-cover" />
                            <span className="text-lg font-semibold tracking-tight text-slate-900">AutoAvisa</span>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Entra en tu taller
                        </h1>
                        <p className="mt-1.5 text-sm text-slate-500">
                            Introduce tus credenciales para acceder
                        </p>
                    </div>

                    <LoginForm error={error} />

                    <p className="mt-8 text-center text-xs text-slate-400">
                        ¿No tienes cuenta? Habla con tu administrador.
                    </p>
                </div>
            </div>
        </div>
    )
}
