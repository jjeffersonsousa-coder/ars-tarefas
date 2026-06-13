'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from './app-layout'
import { UserProfile } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { registerServiceWorker, sendBrowserNotification, getPermissionStatus } from '@/lib/notifications/browser'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login')
        return
      }
      const { data: p } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!p) {
        // Cria perfil automaticamente se não existe
        await (supabase.rpc as any)('create_user_profile', {
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
          user_email: user.email || '',
        })
        const { data: newProfile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
        if (!newProfile) { router.replace('/login'); return }
        setProfile(newProfile as UserProfile)
        setLoading(false)
        return
      }
      setProfile(p as UserProfile)
      setLoading(false)

      // Registrar service worker e checar vencimentos
      await registerServiceWorker()
      if (getPermissionStatus() === 'granted') {
        checkDueActivities(user.id)
      }
    }

    async function checkDueActivities(userId: string) {
      const today = new Date().toISOString().slice(0, 10)
      const { data } = await supabase
        .from('activities')
        .select('title, due_date, follow_up_date')
        .eq('created_by', userId)
        .not('status', 'in', '("concluida","cancelada")')
        .or(`due_date.lte.${today}T23:59:59,follow_up_date.eq.${today}T00:00:00`)
        .limit(5)

      if (data && data.length > 0) {
        const overdue = data.filter(a => a.due_date && a.due_date.slice(0, 10) < today)
        const dueToday = data.filter(a => a.due_date && a.due_date.slice(0, 10) === today)
        const followUp = data.filter(a => a.follow_up_date && a.follow_up_date.slice(0, 10) === today)

        if (overdue.length > 0) {
          sendBrowserNotification(
            `⚠️ ${overdue.length} atividade${overdue.length > 1 ? 's' : ''} vencida${overdue.length > 1 ? 's' : ''}`,
            overdue.map(a => a.title).join(', '),
            '/activities'
          )
        } else if (dueToday.length > 0) {
          sendBrowserNotification(
            `📅 ${dueToday.length} atividade${dueToday.length > 1 ? 's' : ''} vence${dueToday.length > 1 ? 'm' : ''} hoje`,
            dueToday.map(a => a.title).join(', '),
            '/activities'
          )
        } else if (followUp.length > 0) {
          sendBrowserNotification(
            `🔔 ${followUp.length} retorno${followUp.length > 1 ? 's' : ''} agendado${followUp.length > 1 ? 's' : ''} para hoje`,
            followUp.map(a => a.title).join(', '),
            '/dashboard'
          )
        }
      }
    }

    init()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8F1F2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-gray-500 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  return <AppLayout user={profile}>{children}</AppLayout>
}
