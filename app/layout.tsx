import type { Metadata } from 'next'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'AutoAvisa - Gestión de Avisos para Talleres',
  description:
    'Sistema de gestión de avisos de mantenimiento para talleres de automóviles. Programa recordatorios automáticos por WhatsApp para tus clientes.',
  icons: {
    icon: '/logo-autoavisa.jpg',
    apple: '/logo-autoavisa.jpg',
  },
  openGraph: {
    title: 'AutoAvisa - Gestión de Avisos para Talleres',
    description: 'Envía recordatorios de mantenimiento por WhatsApp a tus clientes. Automático. Sin esfuerzo.',
    images: ['/logo-autoavisa.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AutoAvisa" />
        <link rel="apple-touch-icon" href="/logo-autoavisa.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
            })
          }
        `}} />
      </head>
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
