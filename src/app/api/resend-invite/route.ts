import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
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
    .from('user_profiles').select('role').eq('id', user.id).single()

  if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const { email, full_name } = await req.json()
  if (!email) return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })

  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin')
  const inviteRedirect = `${origin}/auth/callback`
  // Reset password goes directly to /set-password (hash params are client-side only)
  const resetRedirect = `${origin}/set-password`

  // Try invite first; if user already exists, fall back to password reset
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { full_name },
    redirectTo: inviteRedirect,
  })

  if (inviteError) {
    const alreadyRegistered = inviteError.message.toLowerCase().includes('already been registered')
      || inviteError.message.toLowerCase().includes('already registered')
    if (!alreadyRegistered) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 })
    }

    // User exists — send password reset link directly to /set-password
    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: resetRedirect,
    })
    if (resetError) return NextResponse.json({ error: resetError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
