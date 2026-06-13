'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ActivityForm } from '@/components/activities/activity-form'
import { Activity, UserProfile } from '@/lib/types'
import { Loader2 } from 'lucide-react'

export default function EditActivityPage() {
  const params = useParams()
  const id = params.id as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (!p) { router.replace('/login'); return }
      if (p.role !== 'admin' && p.role !== 'editor') { router.replace(`/activities/${id}`); return }
      setProfile(p as UserProfile)

      const { data: act } = await (supabase as any)
        .from('activities')
        .select('*, activity_tags(tag_id, tags(*))')
        .eq('id', id)
        .single()

      if (!act) { router.replace('/activities'); return }

      const mapped: Activity = {
        ...act,
        tags: (act.activity_tags || []).map((at: { tags: unknown }) => at.tags).filter(Boolean),
      }
      setActivity(mapped)
      setLoading(false)
    }
    init()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-700" />
      </div>
    )
  }
  if (!profile || !activity) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar Atividade</h1>
        <p className="text-gray-500 text-sm mt-0.5">Altere os campos e salve as mudanças</p>
      </div>
      <ActivityForm
        activity={activity}
        entityId={profile.entity_id || ''} userDepartmentId={profile.department_id} userRole={profile.role}
        userId={profile.id}
      />
    </div>
  )
}
