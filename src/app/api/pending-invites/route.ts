import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return NextResponse.json({ error: 'Chave não configurada' }, { status: 500 })

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await adminClient
    .from('user_profiles').select('role, entity_id').eq('id', user.id).single()

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // List all auth users and cross-reference with user_profiles of this entity
  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers({ perPage: 1000 })

  // Get entity's user profiles
  const { data: profiles } = await adminClient
    .from('user_profiles').select('id, email, full_name, created_at').eq('entity_id', profile.entity_id ?? '')

  const profileIds = new Set((profiles ?? []).map((p: { id: string }) => p.id))

  // Pending = in auth but email_confirmed_at is null, and profile exists for this entity
  const pending = (authUsers ?? [])
    .filter(u => !u.email_confirmed_at && profileIds.has(u.id))
    .map(u => ({
      id: u.id,
      email: u.email,
      full_name: profiles?.find((p: { id: string }) => p.id === u.id)?.full_name ?? '',
      invited_at: u.created_at,
    }))

  return NextResponse.json({ pending })
}
