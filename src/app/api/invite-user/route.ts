import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('role, entity_id').eq('id', session.user.id).single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas administradores podem convidar usuários' }, { status: 403 })
  }

  const { email, full_name, cargo, role } = await req.json()
  if (!email || !full_name) {
    return NextResponse.json({ error: 'E-mail e nome são obrigatórios' }, { status: 400 })
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    return NextResponse.json({ error: 'Chave de serviço não configurada' }, { status: 500 })
  }

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

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
      entity_id: profile.entity_id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  return NextResponse.json({ success: true })
}
