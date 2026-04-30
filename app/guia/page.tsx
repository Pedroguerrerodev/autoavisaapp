import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Guía de uso — AutoAvisa',
    description: 'Aprende a usar AutoAvisa en 5 minutos. Guía paso a paso para talleres.',
}

export default function GuiaPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
                <Link href="/landing" className="flex items-center gap-2">
                    <img src="/logo-autoavisa.jpg" alt="AutoAvisa" className="h-8 w-8 rounded-md object-cover" />
                    <span className="text-base font-semibold text-slate-900">AutoAvisa</span>
                </Link>
                <Link href="/login" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                    Acceder
                </Link>
            </nav>

            {/* Contenido */}
            <article className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Guía de uso de AutoAvisa
                </h1>
                <p className="mt-3 text-base text-slate-500">
                    Todo lo que necesitas saber para sacarle partido a AutoAvisa en tu taller. En 5 minutos.
                </p>

                <hr className="my-10 border-slate-200" />

                {/* 1. Primer acceso */}
                <Seccion numero="1" titulo="Tu primer acceso">
                    <p>
                        El administrador de AutoAvisa te habrá dado un <strong>email</strong> y una <strong>contraseña</strong>.
                        Ve a la pantalla de login e introdúcelos. Llegarás directamente al dashboard de tu taller.
                    </p>
                    <Nota>Si no tienes credenciales, contacta con tu administrador. Las cuentas no se crean desde la app.</Nota>
                </Seccion>

                {/* 2. Dashboard */}
                <Seccion numero="2" titulo="El dashboard: tu vista del día">
                    <p>
                        Nada más entrar ves lo importante:
                    </p>
                    <ul className="mt-3 space-y-2">
                        <Li>🔴 <strong>Avisos atrasados</strong> — avisos que debieron enviarse y no se han enviado aún.</Li>
                        <Li>🔵 <strong>Avisos de hoy</strong> — los que toca enviar hoy.</Li>
                        <Li>⚪ <strong>Próximos 7 días</strong> — lo que viene la semana que viene.</Li>
                        <Li>🟡 <strong>Trabajos en curso</strong> — coches que estás reparando ahora mismo.</Li>
                    </ul>
                    <p className="mt-3">
                        Debajo tienes la lista de todos tus vehículos con un buscador por matrícula.
                    </p>
                </Seccion>

                {/* 3. Registrar vehículo */}
                <Seccion numero="3" titulo="Registrar un vehículo">
                    <p>
                        Pulsa <strong>&ldquo;Añadir Vehículo&rdquo;</strong> en el dashboard. Rellena:
                    </p>
                    <ul className="mt-3 space-y-2">
                        <Li><strong>Matrícula</strong> — obligatoria. Se guarda en mayúsculas.</Li>
                        <Li><strong>Marca y modelo</strong> — obligatorios. Ej: Seat Ibiza.</Li>
                        <Li><strong>Teléfono del cliente</strong> — con prefijo internacional (+34 para España). Es el número al que se enviarán los WhatsApp.</Li>
                        <Li><strong>Nombre del cliente</strong> — opcional pero recomendado.</Li>
                        <Li><strong>Notas</strong> — lo que quieras apuntar sobre el coche.</Li>
                    </ul>
                    <Nota>Si intentas meter una matrícula que ya existe en tu taller, te avisará y te llevará a la ficha existente.</Nota>
                </Seccion>

                {/* 4. Programar aviso */}
                <Seccion numero="4" titulo="Programar un aviso de mantenimiento">
                    <p>
                        Entra en la ficha de un vehículo y pulsa <strong>&ldquo;Nuevo Aviso&rdquo;</strong>. Elige:
                    </p>
                    <ul className="mt-3 space-y-2">
                        <Li><strong>Tipo</strong> — ITV, cambio de aceite, filtros, revisión general, neumáticos u otro.</Li>
                        <Li><strong>Fecha programada</strong> — cuándo quieres que se envíe el aviso. Debe ser futura.</Li>
                        <Li><strong>Recurrencia</strong> — &ldquo;Una vez&rdquo;, &ldquo;Cada 3 meses&rdquo;, &ldquo;Cada 6 meses&rdquo;, &ldquo;Cada 12 meses&rdquo; o personalizado (1-36 meses).</Li>
                        <Li><strong>Mensaje personalizado</strong> — opcional. Si no pones nada, se genera uno automático.</Li>
                    </ul>
                    <Nota>
                        Los avisos recurrentes se reprograman solos. Cuando se envía uno, el sistema crea el siguiente automáticamente.
                        Si un aviso lleva meses atrasado, el siguiente se programa desde la fecha de envío real, no desde la fecha original.
                    </Nota>
                </Seccion>

                {/* 5. Acciones rápidas */}
                <Seccion numero="5" titulo="Acciones rápidas desde el dashboard">
                    <p>
                        Cada aviso en el dashboard tiene tres botones:
                    </p>
                    <ul className="mt-3 space-y-2">
                        <Li><strong>Enviar ahora</strong> — envía el WhatsApp al cliente en ese momento y marca el aviso como enviado.</Li>
                        <Li><strong>Posponer 1 día</strong> — mueve el aviso a mañana. Útil si hoy no te viene bien.</Li>
                        <Li><strong>Marcar como hecho</strong> — marca el aviso como enviado sin enviar WhatsApp. Para cuando ya has hablado con el cliente por otro medio.</Li>
                    </ul>
                </Seccion>

                {/* 6. Trabajos */}
                <Seccion numero="6" titulo="Registrar trabajos y avisar cuando está listo">
                    <p>
                        Cuando un coche entra al taller para una reparación:
                    </p>
                    <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-600">
                        <li>Ve a la ficha del vehículo.</li>
                        <li>En &ldquo;Trabajos&rdquo;, escribe qué vas a hacer (ej: &ldquo;Cambio de pastillas de freno&rdquo;) y pulsa <strong>Registrar</strong>.</li>
                        <li>Cuando termines, pulsa <strong>&ldquo;Listo ✅&rdquo;</strong>. El cliente recibe un WhatsApp diciendo que su coche está listo para recoger.</li>
                        <li>Cuando el cliente recoge el coche, pulsa <strong>&ldquo;Entregado 🤝&rdquo;</strong>.</li>
                    </ol>
                    <Nota>Si el WhatsApp falla por algún motivo, el trabajo se marca como listo igualmente. Puedes llamar al cliente manualmente.</Nota>
                </Seccion>

                {/* 7. Editar */}
                <Seccion numero="7" titulo="Editar vehículos y avisos">
                    <p>
                        En la ficha de un vehículo puedes:
                    </p>
                    <ul className="mt-3 space-y-2">
                        <Li><strong>Editar el vehículo</strong> — cambiar matrícula, teléfono, nombre, marca, modelo o notas.</Li>
                        <Li><strong>Editar un aviso pendiente</strong> — cambiar fecha, tipo, recurrencia o mensaje. Solo se pueden editar avisos que aún no se han enviado.</Li>
                        <Li><strong>Eliminar un aviso</strong> — con confirmación. Los avisos ya enviados se quedan en el historial.</Li>
                    </ul>
                </Seccion>

                {/* 8. Búsqueda */}
                <Seccion numero="8" titulo="Buscar por matrícula">
                    <p>
                        En el dashboard hay un buscador en la parte superior de la lista de vehículos.
                        Escribe parte de la matrícula y filtra al instante. No distingue mayúsculas de minúsculas.
                    </p>
                </Seccion>

                {/* 9. WhatsApp */}
                <Seccion numero="9" titulo="¿Cómo se envían los WhatsApp?">
                    <p>
                        AutoAvisa tiene dos modos:
                    </p>
                    <ul className="mt-3 space-y-2">
                        <Li><strong>Modo dummy</strong> (desarrollo) — los mensajes se registran en la consola del servidor pero no se envían de verdad. Perfecto para probar.</Li>
                        <Li><strong>Modo real</strong> (producción) — los mensajes se envían a través de la WhatsApp Cloud API de Meta. Requiere configuración.</Li>
                    </ul>
                    <p className="mt-3">
                        Además, cada día a las 8:00 de la mañana (hora española), un proceso automático revisa todos los avisos pendientes
                        y envía los que correspondan. No tienes que hacer nada.
                    </p>
                </Seccion>

                {/* 10. Usuarios */}
                <Seccion numero="10" titulo="Usuarios y permisos">
                    <p>
                        Cada taller puede tener hasta <strong>3 usuarios</strong>: 1 dueño + 2 trabajadores.
                        Todos ven los mismos datos del taller. Las cuentas las crea el administrador de AutoAvisa.
                    </p>
                    <Nota>Los datos de tu taller están completamente aislados. Ningún otro taller puede ver tus clientes ni tus avisos.</Nota>
                </Seccion>

                <hr className="my-10 border-slate-200" />

                <div className="text-center">
                    <p className="text-sm text-slate-500">
                        ¿Tienes dudas? Escríbenos por{' '}
                        <a
                            href="https://wa.me/34651335628?text=Hola%2C%20tengo%20una%20duda%20sobre%20AutoAvisa"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-green-600 underline underline-offset-2 hover:text-green-700"
                        >
                            WhatsApp
                        </a>
                    </p>
                    <Link
                        href="/login"
                        className="mt-6 inline-block rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        Ir a la app
                    </Link>
                </div>
            </article>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2">
                        <img src="/logo-autoavisa.jpg" alt="AutoAvisa" className="h-6 w-6 rounded object-cover" />
                        <span className="text-sm font-medium text-slate-600">AutoAvisa</span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400">© {new Date().getFullYear()} · v0.1</p>
                        <p className="text-xs text-slate-400">
                            Desarrollado por{' '}
                            <a href="https://pedroguerrerodev.es" target="_blank" rel="noopener noreferrer" className="text-slate-500 underline underline-offset-2 hover:text-slate-700">
                                pedroguerrerodev.es
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function Seccion({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
    return (
        <section className="mb-10">
            <div className="flex items-center gap-3 mb-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-medium text-white">
                    {numero}
                </div>
                <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
            </div>
            <div className="ml-10 text-base leading-relaxed text-slate-600">
                {children}
            </div>
        </section>
    )
}

function Li({ children }: { children: React.ReactNode }) {
    return <li className="flex items-start gap-2 text-slate-600">{children}</li>
}

function Nota({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <strong>Nota:</strong> {children}
        </div>
    )
}
