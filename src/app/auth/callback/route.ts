import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('user_profiles').select('id').eq('id', data.user.id).single()
      if (!profile) {
        return NextResponse.redirect(`${origin}/register?step=entity`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }
  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
