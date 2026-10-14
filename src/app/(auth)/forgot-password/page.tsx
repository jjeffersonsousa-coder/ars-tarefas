'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Zap, Loader2, ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) {
      setError('Erro ao enviar e-mail. Verifique o endereço e tente novamente.')
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
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
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                <Mail className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">E-mail enviado!</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada e spam.
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full h-11 rounded-xl gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Recuperar senha</h2>
              <p className="text-sm text-gray-500 mb-5">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com" required className="mt-1.5 h-11 rounded-xl" />
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full h-11 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #006494, #13293D)', boxShadow: '0 4px 12px rgba(0,100,148,0.3)' }}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Enviar link de recuperação
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-4">
                Lembrou a senha?{' '}
                <Link href="/login" className="text-blue-700 hover:text-blue-900 font-semibold">
                  Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
