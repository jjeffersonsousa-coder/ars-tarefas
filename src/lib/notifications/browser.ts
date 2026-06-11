export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    return reg
  } catch {
    return null
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

export function sendBrowserNotification(title: string, body: string, url?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  const n = new Notification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: 'ars-notification',
  })
  if (url) n.onclick = () => { window.focus(); window.location.href = url }
}

export function getPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}
