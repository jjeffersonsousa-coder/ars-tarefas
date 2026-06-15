import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = createServerClient()

  // Invite / password-reset flow (token_hash)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })
    if (!error && data.user) {
      if (type === 'invite' || type === 'recovery') {
        // Redirect to set-password page; email is passed so the form can show it
        const email = encodeURIComponent(data.user.email ?? '')
        return NextResponse.redirect(`${origin}/set-password?email=${email}`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
    return NextResponse.redirect(`${origin}/login?error=invalid_token`)
  }

  // OAuth flow (code)
  if (code) {
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
