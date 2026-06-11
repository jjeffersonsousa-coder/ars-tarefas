import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('entity_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.entity_id) {
    return NextResponse.json([])
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, full_name, email, role, avatar_url')
    .eq('entity_id', profile.entity_id)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
