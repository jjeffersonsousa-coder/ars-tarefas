'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ActivityDetail } from '@/components/activities/activity-detail'
import { Activity, ActivityHistory, ChecklistItem, UserProfile } from '@/lib/types'
import { Loader2 } from 'lucide-react'

export default function ActivityPage() {
  const params = useParams()
  const id = params.id as string
  const [activity, setActivity] = useState<Activity | null>(null)
  const [history, setHistory] = useState<ActivityHistory[]>([])
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([])
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
      setProfile(p as UserProfile)

      const { data: act } = await (supabase as any)
        .from('activities')
        .select(`*, responsible:responsible_id(id, full_name, avatar_url, email, role, entity_id, created_at, updated_at), delegated_to:delegated_to_id(id, full_name, avatar_url, email, role, entity_id, created_at, updated_at), activity_tags(tag_id, tags(*))`)
        .eq('id', id)
        .single()

      if (!act) { router.replace('/activities'); return }

      setActivity({ ...act, tags: (act.activity_tags || []).map((at: { tags: unknown }) => at.tags).filter(Boolean) })

      const { data: hist } = await (supabase as any)
        .from('activity_history')
        .select('*, user:user_id(id, full_name, avatar_url, email, role, entity_id, created_at, updated_at)')
        .eq('activity_id', id)
        .order('created_at', { ascending: false })
      setHistory((hist || []) as ActivityHistory[])

      const { data: cl } = await supabase
        .from('checklist_items')
        .select('*')
        .eq('activity_id', id)
        .order('order_index')
      setChecklistItems((cl || []) as ChecklistItem[])

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
  if (!activity || !profile) return null

  return (
    <ActivityDetail
      activity={activity}
      history={history}
      checklistItems={checklistItems}
      userRole={profile.role}
      currentUserId={profile.id}
    />
  )
}
