const STATIC_CACHE = 'link-static-v1'
const OFFLINE_CACHE = 'link-offline-v2'
const OFFLINE_URL = '/offline'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then(async (cache) => {
      try {
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))
      } catch {
        // Ignore cache warmup failures and let the worker continue installing.
      }
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![STATIC_CACHE, OFFLINE_CACHE].includes(key))
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  if (request.method !== 'GET') {
    return
  }

  const url = new URL(request.url)

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(OFFLINE_CACHE)
        return cache.match(OFFLINE_URL)
      })
    )
    return
  }

  if (url.origin !== self.location.origin) {
    return
  }

  if (!['document', 'font', 'image', 'script', 'style', 'worker'].includes(request.destination)) {
    return
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => cachedResponse || Response.error())

      return cachedResponse || networkResponse
    })
  )
})
