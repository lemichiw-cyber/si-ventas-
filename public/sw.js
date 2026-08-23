const CACHE = 'dulce-encanto-v1'
const PRECACHE = ['/', '/css/styles.css', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  // La API y los eventos SSE siempre van a red
  if (url.pathname.startsWith('/api/')) return

  // Navegación: red primero, respaldo offline
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then((res) => {
          const copia = res.clone()
          caches.open(CACHE).then((c) => c.put('/', copia))
          return res
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  // Assets estáticos: cache primero, refresco en segundo plano
  e.respondWith(
    caches.match(request).then((cacheado) => {
      const red = fetch(request).then((res) => {
        if (res.ok) {
          const copia = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copia))
        }
        return res
      }).catch(() => cacheado)
      return cacheado || red
    })
  )
})
