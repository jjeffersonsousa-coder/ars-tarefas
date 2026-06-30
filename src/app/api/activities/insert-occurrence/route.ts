import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) return NextResponse.json({ error: 'Sem chave de serviço' }, { status: 500 })

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data: { user } } = await adminClient.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const body = await req.json()
  const { occurrence, historyEntry } = body

  // Insert next occurrence using service role (bypasses RLS for super_admin viewing other entities)
  const { data, error } = await adminClient.from('activities').insert(occurrence).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insert history entry if provided
  if (historyEntry) {
    await adminClient.from('activity_history').insert(historyEntry)
  }

  return NextResponse.json({ data })
}
