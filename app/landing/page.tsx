import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { WhatsAppDemo } from './whatsapp-demo'
import { AppDemo } from './app-demo'

export const metadata: Metadata = {
    title: 'AutoAvisa — Tus clientes vuelven al taller. Automáticamente.',
    description:
        'Envía recordatorios de mantenimiento por WhatsApp a tus clientes. Automático. Sin esfuerzo. Más coches en tu taller.',
}

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Nav */}
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
                <span className="text-base font-semibold text-slate-900">AutoAvisa</span>
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/guia" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline">
                        Guía de uso
                    </Link>
                    <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                        Acceder
                    </Link>
                    <a href="#contacto" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:px-4">
                        Quiero probarlo
                    </a>
                </div>
            </nav>

            {/* Hero con foto + animación WhatsApp */}
            <section className="mx-auto max-w-5xl px-6 pt-12 pb-12 sm:pt-20 sm:pb-16">
                <div className="grid items-center gap-10 lg:grid-cols-2">
                    <div>
                        <p className="mb-4 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
                            Ya funciona en talleres reales
                        </p>
                        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                            ¿Cuántos clientes has perdido este mes por no avisarles?
                        </h1>
                        <p className="mt-5 text-lg leading-relaxed text-slate-600">
                            AutoAvisa les envía un WhatsApp automático cuando les toca la revisión. Ellos vuelven. Tú facturas.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a href="#contacto" className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                                Quiero recuperar esos clientes
                            </a>
                            <a href="#como" className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                Ver cómo funciona
                            </a>
                        </div>
                    </div>

                    {/* Animación WhatsApp en vivo */}
                    <div className="flex justify-center">
                        <WhatsAppDemo />
                    </div>
                </div>
            </section>

            {/* Foto Nissan + texto */}
            <section className="border-t border-slate-200 bg-slate-50">
                <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                        <div className="overflow-hidden rounded-2xl">
                            <Image
                                src="/foto-nissan.avif"
                                alt="Coche en taller mecánico"
                                width={600}
                                height={400}
                                className="h-auto w-full object-cover"
                                priority
                            />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-red-500">El problema</p>
                            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                                Tu cliente se olvida de ti
                            </h2>
                            <ul className="mt-4 space-y-3 text-base text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-red-400">✕</span>
                                    Le tocaba el aceite hace 2 meses. No le avisaste.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-red-400">✕</span>
                                    Pasó por delante de otro taller y entró ahí.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-red-400">✕</span>
                                    Tú ni te enteraste de que lo perdiste.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-red-400">✕</span>
                                    Multiplica eso por 10 clientes al mes.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Foto Audi + solución */}
            <section className="border-t border-slate-200">
                <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                        <div className="order-2 lg:order-1">
                            <p className="text-xs font-medium uppercase tracking-wider text-green-600">Con AutoAvisa</p>
                            <h2 className="mt-3 text-2xl font-semibold text-slate-900">
                                Tu cliente recibe un WhatsApp y te llama
                            </h2>
                            <ul className="mt-4 space-y-3 text-base text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-green-500">✓</span>
                                    &ldquo;Hola Juan, desde Talleres García te recordamos que a tu 1234ABC le toca el aceite&rdquo;
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-green-500">✓</span>
                                    El cliente lee el WhatsApp y te llama para pedir cita.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-green-500">✓</span>
                                    Tú no hiciste nada. El sistema lo hizo por ti.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 text-green-500">✓</span>
                                    Ese cliente vuelve cada 6 meses. Para siempre.
                                </li>
                            </ul>
                        </div>
                        <div className="order-1 overflow-hidden rounded-2xl lg:order-2">
                            <Image
                                src="/foto-audi.avif"
                                alt="Coche de cliente listo para recoger"
                                width={600}
                                height={400}
                                className="h-auto w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Números */}
            <section className="border-t border-slate-200 bg-slate-900">
                <div className="mx-auto max-w-5xl px-6 py-12">
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="text-center">
                            <p className="text-3xl font-semibold text-white">68%</p>
                            <p className="mt-1 text-sm text-slate-400">de los clientes no vuelven si no les recuerdas</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-semibold text-white">30 seg</p>
                            <p className="mt-1 text-sm text-slate-400">es lo que tardas en programar un aviso</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-semibold text-white">0 llamadas</p>
                            <p className="mt-1 text-sm text-slate-400">el WhatsApp se envía solo, tú no tocas nada</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Cómo funciona */}
            <section id="como" className="border-t border-slate-200">
                <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                    <div className="grid items-start gap-12 lg:grid-cols-2">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Así de fácil</p>
                            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Tres pasos. Cinco minutos. Clientes que vuelven.</h2>

                            <div className="mt-10 space-y-8">
                                <div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">1</div>
                                    <h3 className="mt-4 text-base font-semibold text-slate-900">Registra el coche</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        Matrícula, marca, modelo y teléfono del cliente. 30 segundos con las manos sucias.
                                    </p>
                                </div>
                                <div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">2</div>
                                    <h3 className="mt-4 text-base font-semibold text-slate-900">Programa el aviso</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        &ldquo;Aceite cada 6 meses&rdquo;, &ldquo;ITV en marzo&rdquo;. Elige tipo y fecha, el sistema se encarga.
                                    </p>
                                </div>
                                <div>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">3</div>
                                    <h3 className="mt-4 text-base font-semibold text-slate-900">El cliente recibe el WhatsApp</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                        Llega el día, el mensaje se envía solo. El cliente te llama. Tú facturas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Demo animada de la app */}
                        <div className="flex justify-center lg:sticky lg:top-8">
                            <AppDemo />
                        </div>
                    </div>
                </div>
            </section>

            {/* Funcionalidades */}
            <section className="border-t border-slate-200 bg-slate-50">
                <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Pero hay más</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">No solo avisa. Te organiza el día.</h2>

                    <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                        <Feature titulo="Coche listo → WhatsApp al cliente" texto="Terminas la reparación, pulsas un botón, el cliente sabe que puede recoger. Sin llamar." />
                        <Feature titulo="Avisos recurrentes" texto="Configuras 'aceite cada 6 meses' una vez. El sistema reprograma el siguiente aviso solo." />
                        <Feature titulo="Vista del día" texto="Abres la app por la mañana: qué avisos enviar hoy, cuáles van atrasados, qué coches están listos." />
                        <Feature titulo="Búsqueda por matrícula" texto="Escribes la matrícula y encuentras el coche con todo su historial. Rápido." />
                        <Feature titulo="Funciona en el móvil" texto="Diseñado para usarlo con una mano y las manos sucias. Botones grandes, pantallas claras." />
                        <Feature titulo="Cada taller ve solo sus datos" texto="Seguridad real. Tu competencia no ve tus clientes. Ni tú los suyos." />
                    </div>
                </div>
            </section>

            {/* Precio */}
            <section className="border-t border-slate-200 bg-slate-50">
                <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Precio</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Un precio. Todo incluido.</h2>

                    <div className="mt-10 mx-auto max-w-md">
                        <div className="rounded-2xl border border-slate-200 bg-white p-8">
                            <div className="text-center">
                                <p className="text-sm font-medium text-slate-500">AutoAvisa para tu taller</p>
                                <div className="mt-4 flex items-baseline justify-center gap-1">
                                    <span className="text-5xl font-semibold tracking-tight text-slate-900">29€</span>
                                    <span className="text-base text-slate-500">/mes</span>
                                </div>
                                <p className="mt-2 text-sm text-slate-500">por taller · IVA no incluido</p>
                                <p className="mt-1.5 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-green-200">
                                    Primer mes gratis
                                </p>
                            </div>

                            <hr className="my-6 border-slate-200" />

                            <ul className="space-y-3 text-sm text-slate-600">
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span><strong>Primer mes gratis</strong> — pruébalo sin riesgo</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span><strong>Instalación gratuita</strong> — te lo configuramos nosotros</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span><strong>Sin permanencia</strong> — cancela cuando quieras</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span>Vehículos ilimitados</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span>Avisos automáticos por WhatsApp</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span>Avisos recurrentes (aceite, ITV, filtros...)</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span>Aviso de &ldquo;coche listo&rdquo; al cliente</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span>Hasta 3 usuarios por taller</span>
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-0.5 text-green-500">✓</span>
                                    <span>Soporte por WhatsApp</span>
                                </li>
                            </ul>

                            <a
                                href="https://wa.me/34651335628?text=Hola%2C%20quiero%20contratar%20AutoAvisa%20para%20mi%20taller"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-8 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800"
                            >
                                Empezar ahora
                            </a>

                            <p className="mt-4 text-center text-xs text-slate-400">
                                Si recuperas un solo cliente al mes, ya te sale rentable.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="border-t border-slate-200">
                <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Preguntas frecuentes</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900">Lo que nos preguntan siempre</h2>

                    <div className="mt-10 grid gap-6 sm:grid-cols-2">
                        <Pregunta q="¿Necesito instalar algo?" a="No. Es una app web. Abres el navegador del móvil y ya está. Sin descargas, sin actualizaciones." />
                        <Pregunta q="¿Mis clientes necesitan tener una app?" a="No. Reciben un WhatsApp normal. No tienen que instalar nada ni registrarse en ningún sitio." />
                        <Pregunta q="¿Es difícil de usar?" a="Si sabes usar WhatsApp, sabes usar AutoAvisa. Está diseñado para mecánicos, no para informáticos." />
                        <Pregunta q="¿Cuánto cuesta?" a="29€/mes por taller. Primer mes gratis. Instalación gratuita. Sin permanencia. Cancela cuando quieras." />
                        <Pregunta q="¿Puedo tener varios trabajadores?" a="Sí. El dueño y hasta 2 trabajadores, cada uno con su acceso. Todos ven los mismos datos." />
                        <Pregunta q="¿Y si ya tengo una hoja de Excel?" a="Perfecto. Pero la hoja no le manda un WhatsApp a tu cliente a las 8 de la mañana. AutoAvisa sí." />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="contacto" className="border-t border-slate-200 bg-slate-900">
                <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
                    <div className="mx-auto max-w-xl text-center">
                        <h2 className="text-3xl font-semibold text-white">
                            Cada día sin avisar es un cliente que pierdes
                        </h2>
                        <p className="mt-4 text-base leading-relaxed text-slate-400">
                            Te configuramos el taller en el día. Sin compromiso. Pruébalo con 10 clientes y decide si te merece la pena.
                        </p>
                        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                            <a
                                href="https://wa.me/34651335628?text=Hola%2C%20quiero%20probar%20AutoAvisa%20en%20mi%20taller"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-md bg-green-500 px-6 py-3 text-sm font-medium text-white hover:bg-green-600"
                            >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                Escríbenos por WhatsApp
                            </a>
                            <Link href="/login" className="rounded-md border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                                Ya tengo cuenta
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
                    <div className="flex items-center gap-2">
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

function Feature({ titulo, texto }: { titulo: string; texto: string }) {
    return (
        <div className="border-l-2 border-slate-200 pl-4">
            <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{texto}</p>
        </div>
    )
}

function Pregunta({ q, a }: { q: string; a: string }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-900">{q}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{a}</p>
        </div>
    )
}
