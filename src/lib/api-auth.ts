import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured')
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function verifyApiUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null
  if (!token) return null

  // Verify using user-scoped client (more reliable than admin.getUser)
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
  const { data: { user }, error } = await userClient.auth.getUser()
  if (error || !user) return null

  const adminClient = getAdminClient()
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('role, entity_id')
    .eq('id', user.id)
    .single()

  return profile ? { user, role: profile.role as string, entity_id: profile.entity_id as string } : null
}
