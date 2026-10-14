import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

async function verifyUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const adminClient = getAdminClient()
  const { data: { user } } = await adminClient.auth.getUser(token)
  if (!user) return null
  const { data: profile } = await adminClient.from('user_profiles').select('role').eq('id', user.id).single()
  return profile?.role as string | null
}

export async function GET(req: NextRequest) {
  const role = await verifyUser(req)
  if (!role) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = getAdminClient()
  const { data, error } = await adminClient.from('entities').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const role = await verifyUser(req)
  if (!role) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const adminClient = getAdminClient()
  const body = await req.json()
  const { data, error } = await adminClient.from('entities').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const role = await verifyUser(req)
  if (!role) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['super_admin', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const adminClient = getAdminClient()
  const { id, ...body } = await req.json()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { data, error } = await adminClient.from('entities').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
