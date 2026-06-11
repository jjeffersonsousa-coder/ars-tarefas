self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {}
  const options = {
    body: data.body || 'Você tem uma nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' },
    ],
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'ARS', options)
  )
})

self.addEventListener('notificationclick', function(event) {
  event.notification.close()
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/dashboard')
    )
  }
})

self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()))
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()))
