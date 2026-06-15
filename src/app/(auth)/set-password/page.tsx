'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

function SetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const emailParam = searchParams.get('email') ?? ''
  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Handle invite flow: user already authenticated via /auth/callback
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        if (!emailParam && data.user.email) setEmail(data.user.email)
        setReady(true)
        return
      }

      // Handle password-reset flow: Supabase sends hash params (#access_token=...)
      // onAuthStateChange fires PASSWORD_RECOVERY when the hash is consumed
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          if (session?.user) {
            if (!emailParam && session.user.email) setEmail(session.user.email)
            setReady(true)
          }
        }
      })

      // Give the hash a moment to be processed, then redirect if still not authed
      const timeout = setTimeout(async () => {
        const { data: check } = await supabase.auth.getUser()
        if (!check.user) router.replace('/login?error=link_expirado')
      }, 3000)

      return () => {
        subscription.unsubscribe()
        clearTimeout(timeout)
      }
    })
  }, [])

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3

  const strengthLabel = ['', 'Muito fraca', 'Fraca', 'Boa', 'Forte']
  const strengthColor = ['', '#EF4444', '#F97316', '#EAB308', '#22C55E']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return }
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #13293D 0%, #006494 50%, #247BA0 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #1B98E0, #006494)', boxShadow: '0 8px 24px rgba(27,152,224,0.4)' }}>
            <Zap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">ARS</h1>
          <p className="text-sm mt-1" style={{ color: '#7EC8E3' }}>Gerenciamento de Atividades e Rotinas</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {!ready && !done ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" style={{ color: '#006494' }} />
              <p className="text-sm text-gray-500">Validando seu link de acesso...</p>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">Senha definida!</h2>
              <p className="text-sm text-gray-500">Redirecionando para o sistema...</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Criar sua senha</h2>
              <p className="text-sm text-gray-500 mb-5">Escolha uma senha segura para acessar o sistema.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">E-mail</Label>
                  <Input value={email} readOnly
                    className="mt-1.5 h-11 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium">Nova senha *</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      className="h-11 rounded-xl pr-10"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-1 flex-1 rounded-full transition-all"
                            style={{ background: i <= strength ? strengthColor[strength] : '#E5E7EB' }} />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: strengthColor[strength] }}>{strengthLabel[strength]}</p>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirm" className="text-sm font-medium">Confirmar senha *</Label>
                  <Input
                    id="confirm"
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    required
                    className="mt-1.5 h-11 rounded-xl"
                  />
                  {confirm.length > 0 && password !== confirm && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading || !password || !confirm || password !== confirm}
                  className="w-full h-11 rounded-xl font-semibold mt-2"
                  style={{ background: 'linear-gradient(135deg, #006494, #13293D)', boxShadow: '0 4px 12px rgba(0,100,148,0.3)' }}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar senha e entrar
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  )
}
