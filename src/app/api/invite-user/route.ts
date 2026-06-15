import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Chave de serviço não configurada no servidor' }, { status: 500 })
  }

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Verify caller via Bearer token
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await adminClient
    .from('user_profiles').select('role, entity_id').eq('id', user.id).single()

  const isSuperAdmin = profile?.role === 'super_admin'
  const isAdmin = profile?.role === 'admin'

  if (!isSuperAdmin && !isAdmin) {
    return NextResponse.json({ error: 'Apenas administradores podem convidar usuários' }, { status: 403 })
  }

  const { email, full_name, cargo, role, entity_id: bodyEntityId } = await req.json()
  if (!email || !full_name) {
    return NextResponse.json({ error: 'E-mail e nome são obrigatórios' }, { status: 400 })
  }

  // super_admin pode especificar entity_id diretamente (ex: ao criar empresa + admin)
  const targetEntityId = isSuperAdmin && bodyEntityId ? bodyEntityId : profile?.entity_id

  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')}/auth/callback`,
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  if (invited?.user?.id) {
    await adminClient.from('user_profiles').upsert({
      id: invited.user.id,
      email,
      full_name,
      cargo: cargo || null,
      role: role || 'editor',
      entity_id: targetEntityId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  return NextResponse.json({ success: true })
}
