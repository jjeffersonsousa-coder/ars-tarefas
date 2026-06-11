import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const context = searchParams.get('context')
  const responsible_id = searchParams.get('responsible_id')

  let query = supabase
    .from('activities')
    .select(`
      *,
      responsible:responsible_id(id, full_name, avatar_url),
      delegated_to:delegated_to_id(id, full_name, avatar_url),
      activity_tags(tag_id, tags(*))
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)
  if (context) query = query.ilike('context', `%${context}%`)
  if (responsible_id) query = query.eq('responsible_id', responsible_id)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('entity_id, role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { tag_ids, ...activityData } = body

  const { data: activity, error } = await supabase
    .from('activities')
    .insert({
      ...activityData,
      entity_id: profile.entity_id,
      created_by: session.user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tag_ids && tag_ids.length > 0) {
    await supabase.from('activity_tags').insert(
      tag_ids.map((tagId: string) => ({ activity_id: activity.id, tag_id: tagId }))
    )
  }

  // Insert creation history
  await supabase.from('activity_history').insert({
    activity_id: activity.id,
    user_id: session.user.id,
    field_changed: 'created',
  })

  return NextResponse.json(activity, { status: 201 })
}
