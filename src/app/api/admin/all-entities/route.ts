import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return NextResponse.json({ error: 'Sem chave de serviço' }, { status: 500 })

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await adminClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const { data: profile } = await adminClient.from('user_profiles').select('role').eq('id', user.id).single()
  if (!profile || (profile as { role: string }).role !== 'super_admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const [{ data: entities }, { data: users }] = await Promise.all([
    adminClient.from('entities').select('*').order('name'),
    adminClient.from('user_profiles').select('id, full_name, email, role, entity_id').order('full_name'),
  ])

  return NextResponse.json({ entities: entities ?? [], users: users ?? [] })
}
