self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Gartner'
  const options = {
    body: data.body || 'En av plantene dine trenger oppmerksomhet!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'gartner-varsel',
    renotify: true,
    data: { url: data.url || '/hjem' }
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/hjem')
  )
})

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sjekk-vanning') {
    event.waitUntil(sjekkVanning())
  }
})

async function sjekkVanning() {
  const cache = await caches.open('gartner-data')
  const response = await cache.match('vanning-varsler')
  if (response) {
    const planter = await response.json()
    const iDag = new Date()
    iDag.setHours(0, 0, 0, 0)

    for (const plante of planter) {
      const nesteVanning = new Date(plante.neste_vanning)
      nesteVanning.setHours(0, 0, 0, 0)
      if (nesteVanning <= iDag) {
        await self.registration.showNotification('Gartner 🌿', {
          body: plante.navn + ' trenger vann i dag!',
          icon: '/icon-192.png',
          tag: 'vanning-' + plante.id,
          data: { url: '/planter/' + plante.id }
        })
      }
    }
  }
}
