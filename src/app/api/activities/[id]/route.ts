import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      responsible:responsible_id(id, full_name, avatar_url),
      delegated_to:delegated_to_id(id, full_name, avatar_url),
      activity_tags(tag_id, tags(*)),
      checklist_items(*),
      activity_history(*, user:user_id(id, full_name, avatar_url))
    `)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['admin', 'editor'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { tag_ids, ...activityData } = body

  const { data, error } = await supabase
    .from('activities')
    .update({ ...activityData, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tag_ids !== undefined) {
    await supabase.from('activity_tags').delete().eq('activity_id', params.id)
    if (tag_ids.length > 0) {
      await supabase.from('activity_tags').insert(
        tag_ids.map((tagId: string) => ({ activity_id: params.id, tag_id: tagId }))
      )
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('activities').delete().eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
