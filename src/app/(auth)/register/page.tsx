'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { CheckSquare, Loader2 } from 'lucide-react'

type Step = 'account' | 'entity'

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const initialStep: Step = searchParams.get('step') === 'entity' ? 'entity' : 'account'

  const [step, setStep] = useState<Step>(initialStep)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Account fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // Entity fields
  const [entityName, setEntityName] = useState('')
  const [entityType, setEntityType] = useState<'empresa' | 'familia' | 'pessoa_fisica'>('empresa')
  const [entityDocument, setEntityDocument] = useState('')
  const [entityEmail, setEntityEmail] = useState('')
  const [entityPhone, setEntityPhone] = useState('')

  const supabase = createClient()
  const router = useRouter()

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error || !data.user) {
      setError(error?.message || 'Erro ao criar conta')
      setLoading(false)
      return
    }

    setUserId(data.user.id)
    setLoading(false)
    setStep('entity')
  }

  async function handleCreateEntity(e: React.FormEvent) {
    e.preventDefault()
    let resolvedUserId = userId
    if (!resolvedUserId) {
      const { data } = await supabase.auth.getUser()
      resolvedUserId = data.user?.id ?? null
    }
    if (!resolvedUserId) return
    setLoading(true)
    setError(null)

    try {
      // Create entity
      const { data: entity, error: entityError } = await supabase
        .from('entities')
        .insert({
          name: entityName,
          type: entityType,
          document: entityDocument || null,
          email: entityEmail || null,
          phone: entityPhone || null,
        })
        .select()
        .single()

      if (entityError) throw entityError

      // Create user profile as admin
      const { error: profileError } = await supabase.from('user_profiles').insert({
        id: resolvedUserId,
        entity_id: entity.id,
        full_name: fullName,
        email: email,
        role: 'admin',
      })

      if (profileError) throw profileError

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao configurar entidade'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-indigo-600 mb-4">
            <CheckSquare className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ARS</h1>
          <p className="text-gray-500 text-sm mt-1">Criar nova conta</p>
        </div>

        <div className="bg-white rounded-xl border p-6 shadow-sm">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-2 flex-1">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'account' || step === 'entity' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                1
              </div>
              <span className={`text-xs font-medium ${step === 'account' ? 'text-indigo-600' : 'text-gray-500'}`}>
                Conta
              </span>
            </div>
            <div className="h-px flex-1 bg-gray-200" />
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${step === 'entity' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                2
              </div>
              <span className={`text-xs font-medium ${step === 'entity' ? 'text-indigo-600' : 'text-gray-500'}`}>
                Entidade
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {step === 'account' && (
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <h2 className="font-semibold text-gray-900">Dados da Conta</h2>
              <div>
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Continuar
              </Button>
            </form>
          )}

          {step === 'entity' && (
            <form onSubmit={handleCreateEntity} className="space-y-4">
              <h2 className="font-semibold text-gray-900">Configurar Entidade</h2>
              <p className="text-sm text-gray-500">
                Configure sua empresa, família ou perfil pessoal.
              </p>
              <div>
                <Label htmlFor="entityName">Nome da entidade *</Label>
                <Input
                  id="entityName"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="Nome da empresa, família, etc."
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Tipo de entidade</Label>
                <Select value={entityType} onValueChange={(v) => setEntityType(v as 'empresa' | 'familia' | 'pessoa_fisica')}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="familia">Família</SelectItem>
                    <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="entityDocument">
                  {entityType === 'empresa' ? 'CNPJ' : entityType === 'pessoa_fisica' ? 'CPF' : 'Documento'} (opcional)
                </Label>
                <Input
                  id="entityDocument"
                  value={entityDocument}
                  onChange={(e) => setEntityDocument(e.target.value)}
                  placeholder="Número do documento"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="entityEmail">E-mail (opcional)</Label>
                <Input
                  id="entityEmail"
                  type="email"
                  value={entityEmail}
                  onChange={(e) => setEntityEmail(e.target.value)}
                  placeholder="contato@empresa.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="entityPhone">Telefone (opcional)</Label>
                <Input
                  id="entityPhone"
                  value={entityPhone}
                  onChange={(e) => setEntityPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('account')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Conta
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-500 mt-4">
            Já tem conta?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
