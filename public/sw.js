// Service Worker básico para PWA — permite instalar la app
// No cachea nada agresivamente (la app necesita datos frescos de Supabase)

self.addEventListener('install', (event) => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
    // Network-first: siempre intenta la red, no cachea
    event.respondWith(fetch(event.request))
})
