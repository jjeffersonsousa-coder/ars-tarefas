'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/lib/types'
import { formatRelative } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const unreadCount = notifications.filter((n) => !n.read).length

  useEffect(() => {
    fetchNotifications()
  }, [userId])

  async function fetchNotifications() {
    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setNotifications(data as Notification[])
    setLoading(false)
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const typeColors: Record<string, string> = {
    vencimento: 'bg-red-100 text-red-700',
    follow_up: 'bg-amber-100 text-amber-700',
    delegacao: 'bg-blue-100 text-blue-700',
    atualizacao: 'bg-gray-100 text-gray-700',
  }

  const typeLabels: Record<string, string> = {
    vencimento: 'Vencimento',
    follow_up: 'Follow-up',
    delegacao: 'Delegação',
    atualizacao: 'Atualização',
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-2">
          <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => (
              <Link
                key={notification.id}
                href={`/activities/${notification.activity_id}`}
                onClick={() => markAsRead(notification.id)}
                className={`block px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                  !notification.read ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 mt-0.5 ${
                      typeColors[notification.type] || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {typeLabels[notification.type] || notification.type}
                  </span>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-sm text-gray-800 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatRelative(notification.created_at)}</p>
              </Link>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full" onClick={fetchNotifications}>
            Atualizar
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
