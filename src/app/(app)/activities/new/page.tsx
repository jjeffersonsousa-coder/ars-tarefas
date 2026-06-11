'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ActivityForm } from '@/components/activities/activity-form'
import { UserProfile } from '@/lib/types'
import { Loader2 } from 'lucide-react'

export default function NewActivityPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (!p) { router.replace('/login'); return }
      if (p.role !== 'admin' && p.role !== 'editor') { router.replace('/activities'); return }
      setProfile(p as UserProfile)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }
  if (!profile) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nova Atividade</h1>
        <p className="text-gray-500 text-sm mt-0.5">Preencha os campos abaixo para criar uma nova atividade</p>
      </div>
      <ActivityForm entityId={profile.entity_id || ''} userId={profile.id} />
    </div>
  )
}
