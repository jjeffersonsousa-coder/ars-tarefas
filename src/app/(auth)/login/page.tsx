'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Zap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleOAuth(provider: 'google' | 'azure') {
    setOauthLoading(provider)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: provider === 'azure' ? 'email profile openid' : undefined,
      },
    })
    if (error) {
      toast.error('Erro ao conectar', { description: error.message })
      setOauthLoading(null)
    }
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

        <div className="bg-white rounded-2xl border border-white/20 p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Entrar</h2>
          <p className="text-sm text-gray-500 mb-5">Acesse sua conta para continuar</p>

          <div className="space-y-2 mb-5">
            <Button type="button" variant="outline"
              className="w-full h-11 rounded-xl gap-3 font-medium border-gray-200 hover:bg-gray-50"
              onClick={() => handleOAuth('google')} disabled={!!oauthLoading}>
              {oauthLoading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
              Continuar com Google
            </Button>
            <Button type="button" variant="outline"
              className="w-full h-11 rounded-xl gap-3 font-medium border-gray-200 hover:bg-gray-50"
              onClick={() => handleOAuth('azure')} disabled={!!oauthLoading}>
              {oauthLoading === 'azure' ? <Loader2 className="h-4 w-4 animate-spin" /> : <MicrosoftIcon />}
              Continuar com Microsoft
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">ou use e-mail</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" required className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required className="mt-1.5 h-11 rounded-xl" />
            </div>
            <Button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #006494, #13293D)', boxShadow: '0 4px 12px rgba(0,100,148,0.3)' }}
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Não tem conta?{' '}
            <Link href="/register" className="text-blue-700 hover:text-blue-900 font-semibold">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
