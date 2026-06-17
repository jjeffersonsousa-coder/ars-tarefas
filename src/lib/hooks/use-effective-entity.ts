'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { getViewedEntity, ViewedEntity } from '@/lib/viewed-entity'

interface UseEffectiveEntityResult {
  profile: UserProfile | null
  effectiveEntityId: string | null
  viewedEntity: ViewedEntity | null   // non-null when super_admin is viewing another company
  userDeptIds: string[] | null        // null = not loaded yet; [] = no filter (admin)
  isSuperAdminViewing: boolean
}

export function useEffectiveEntity(): UseEffectiveEntityResult {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userDeptIds, setUserDeptIds] = useState<string[] | null>(null)
  const [viewedEntity, setViewedEntity] = useState<ViewedEntity | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const viewed = getViewedEntity()
    setViewedEntity(viewed)

    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('user_profiles').select('*').eq('id', data.user.id).single()
        .then(async ({ data: p }) => {
          if (!p) return
          const prof = p as UserProfile
          setProfile(prof)

          if (prof.role === 'super_admin' || prof.role === 'admin') {
            setUserDeptIds([])
          } else {
            const { data: depts } = await (supabase as any)
              .from('user_departments').select('department_id').eq('user_id', data.user!.id)
            setUserDeptIds((depts ?? []).map((d: { department_id: string }) => d.department_id))
          }
        })
    })
  }, [])

  const isSuperAdminViewing = profile?.role === 'super_admin' && viewedEntity !== null
  const effectiveEntityId = isSuperAdminViewing ? viewedEntity!.id : (profile?.entity_id ?? null)

  return { profile, effectiveEntityId, viewedEntity, userDeptIds, isSuperAdminViewing }
}
