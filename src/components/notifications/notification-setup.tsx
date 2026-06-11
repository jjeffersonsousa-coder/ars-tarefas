'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { registerServiceWorker, requestNotificationPermission, getPermissionStatus } from '@/lib/notifications/browser'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function NotificationSetup() {
  const [permission, setPermission] = useState<string>('default')

  useEffect(() => {
    setPermission(getPermissionStatus())
    registerServiceWorker()
  }, [])

  async function enable() {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') {
      toast.success('Notificações ativadas!', { description: 'Você receberá alertas de vencimento e retorno.' })
      // Test notification
      setTimeout(() => {
        new Notification('ARS — Notificações ativas ✓', {
          body: 'Você será avisado sobre vencimentos e retornos.',
          icon: '/icon-192.png',
        })
      }, 500)
    } else if (result === 'denied') {
      toast.error('Permissão negada', { description: 'Habilite notificações nas configurações do navegador.' })
    }
  }

  if (permission === 'unsupported') return null

  return (
    <button
      onClick={permission !== 'granted' ? enable : undefined}
      title={permission === 'granted' ? 'Notificações ativas' : 'Ativar notificações'}
      className={cn(
        'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium transition-all',
        permission === 'granted'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default'
          : permission === 'denied'
          ? 'bg-red-50 text-red-600 border-red-200 cursor-default'
          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
      )}
    >
      {permission === 'granted'
        ? <><BellRing className="h-3.5 w-3.5" />Notificações ativas</>
        : permission === 'denied'
        ? <><BellOff className="h-3.5 w-3.5" />Bloqueadas pelo navegador</>
        : <><Bell className="h-3.5 w-3.5" />Ativar notificações</>
      }
    </button>
  )
}
