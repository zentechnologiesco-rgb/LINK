const STATIC_CACHE = 'link-static-v2'
const OFFLINE_CACHE = 'link-offline-v3'
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

self.addEventListener('push', (event) => {
  const payload = event.data
    ? event.data.json()
    : {
        title: 'LINK',
        body: 'You have a new update.',
        icon: '/pwa-icon-192',
        badge: '/pwa-icon-192',
        data: { url: '/' },
      }

  const title = payload?.title || 'LINK'
  const options = {
    body: payload?.body || 'You have a new update.',
    icon: payload?.icon || '/pwa-icon-192',
    badge: payload?.badge || '/pwa-icon-192',
    tag: payload?.tag,
    data: payload?.data || { url: '/' },
    requireInteraction: Boolean(payload?.requireInteraction),
    renotify: Boolean(payload?.tag),
    vibrate: [90, 30, 90],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification?.data?.url || '/'
  const absoluteUrl = new URL(targetUrl, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.startsWith(self.location.origin)) {
          return client.navigate(absoluteUrl).then(() => client.focus())
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl)
      }

      return undefined
    })
  )
})
