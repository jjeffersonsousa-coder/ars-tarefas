'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Building2, Users, Plus, Loader2, ShieldAlert, Mail, ChevronDown, ChevronRight, Crown, Check } from 'lucide-react'
import { toast } from 'sonner'
import { getInitials } from '@/lib/utils'
import { ROLE_LABELS, ROLE_COLORS, UserRole } from '@/lib/types'

interface Entity {
  id: string
  name: string
  type: string
  document?: string | null
  email?: string | null
  created_at: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: UserRole
  entity_id: string | null
}

type Step = 'empresa' | 'admin' | 'done'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [entities, setEntities] = useState<Entity[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null)

  // Wizard state
  const [step, setStep] = useState<Step>('empresa')
  const [saving, setSaving] = useState(false)
  const [createdEntity, setCreatedEntity] = useState<Entity | null>(null)

  // Empresa fields
  const [entityName, setEntityName] = useState('')
  const [entityType, setEntityType] = useState<'empresa' | 'familia'>('empresa')
  const [entityDocument, setEntityDocument] = useState('')
  const [entityEmail, setEntityEmail] = useState('')

  // Admin fields
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminCargo, setAdminCargo] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/dashboard'); return }
      const { data: p } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
      if (!p || p.role !== 'super_admin') { router.replace('/dashboard'); return }
      setAuthorized(true)
      await loadData()
      setLoading(false)
    }
    init()
  }, [])

  async function loadData() {
    const [{ data: ents }, { data: us }] = await Promise.all([
      supabase.from('entities').select('*').order('created_at', { ascending: false }),
      supabase.from('user_profiles').select('id, full_name, email, role, entity_id').order('full_name'),
    ])
    if (ents) setEntities(ents.filter((e: Entity) => e.type !== 'pessoa_fisica'))
    if (us) setUsers(us as UserProfile[])
  }

  async function handleCreateEmpresa(e: React.FormEvent) {
    e.preventDefault()
    if (!entityName.trim()) return
    setSaving(true)
    const { data: entity, error } = await supabase.from('entities').insert({
      name: entityName.trim(),
      type: entityType,
      document: entityDocument || null,
      email: entityEmail || null,
      updated_at: new Date().toISOString(),
    }).select().single()
    if (error) { toast.error('Erro ao criar empresa: ' + error.message); setSaving(false); return }
    setCreatedEntity(entity as Entity)
    setStep('admin')
    setSaving(false)
  }

  async function handleInviteAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!adminEmail.trim() || !adminName.trim() || !createdEntity) return
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({
          email: adminEmail.trim(),
          full_name: adminName.trim(),
          cargo: adminCargo.trim() || null,
          role: 'admin',
          entity_id: createdEntity.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao convidar')
      toast.success('Empresa criada e convite enviado!', {
        description: `${adminName} receberá um e-mail para acessar "${createdEntity.name}".`,
      })
      // reset
      setStep('done')
      await loadData()
    } catch (err: unknown) {
      toast.error('Erro ao enviar convite', { description: err instanceof Error ? err.message : 'Tente novamente' })
    } finally {
      setSaving(false)
    }
  }

  function resetWizard() {
    setStep('empresa')
    setCreatedEntity(null)
    setEntityName(''); setEntityType('empresa'); setEntityDocument(''); setEntityEmail('')
    setAdminName(''); setAdminEmail(''); setAdminCargo('')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#006494' }} />
    </div>
  )
  if (!authorized) return null

  const STEP_INFO: Record<Step, { label: string; num: number }> = {
    empresa: { label: 'Dados da Empresa', num: 1 },
    admin: { label: 'Convidar Administrador', num: 2 },
    done: { label: 'Concluído', num: 3 },
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #006494, #13293D)' }}>
          <ShieldAlert className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Super Admin</h1>
          <p className="text-sm text-gray-500">Provisione empresas e seus administradores</p>
        </div>
      </div>

      {/* Wizard: Criar Empresa */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #F0F7FC, #E8F1F2)' }}>
          <Plus className="h-5 w-5" style={{ color: '#006494' }} />
          <h2 className="font-semibold text-gray-900">Criar Nova Empresa</h2>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-0 px-6 pt-5 pb-2">
          {(['empresa', 'admin', 'done'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step === s ? '#006494' : (STEP_INFO[s].num < STEP_INFO[step].num || step === 'done') ? '#16A34A' : '#E5E7EB',
                    color: step === s || STEP_INFO[s].num < STEP_INFO[step].num || step === 'done' ? 'white' : '#6B7280',
                  }}>
                  {(STEP_INFO[s].num < STEP_INFO[step].num || step === 'done') && s !== step
                    ? <Check className="h-3.5 w-3.5" />
                    : STEP_INFO[s].num}
                </div>
                <span className="text-xs font-medium" style={{ color: step === s ? '#006494' : '#9CA3AF' }}>
                  {STEP_INFO[s].label}
                </span>
              </div>
              {i < 2 && <div className="w-8 h-px mx-2" style={{ background: '#E5E7EB' }} />}
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 pt-4">
          {step === 'empresa' && (
            <form onSubmit={handleCreateEmpresa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nome da Empresa *</Label>
                  <Input value={entityName} onChange={e => setEntityName(e.target.value)}
                    placeholder="Ex: Igreja Adventista Central" required className="mt-1.5 h-11 rounded-xl" autoFocus />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Tipo *</Label>
                  <select value={entityType} onChange={e => setEntityType(e.target.value as 'empresa' | 'familia')}
                    className="mt-1.5 w-full h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white text-gray-900">
                    <option value="empresa">Empresa / Organização</option>
                    <option value="familia">Grupo Familiar</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">CNPJ / Documento</Label>
                  <Input value={entityDocument} onChange={e => setEntityDocument(e.target.value)}
                    placeholder="Opcional" className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">E-mail da empresa</Label>
                  <Input type="email" value={entityEmail} onChange={e => setEntityEmail(e.target.value)}
                    placeholder="contato@empresa.com (opcional)" className="mt-1.5 h-11 rounded-xl" />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving || !entityName.trim()} className="rounded-xl gap-2 px-6"
                  style={{ background: 'linear-gradient(135deg, #006494, #13293D)' }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  Criar Empresa e Continuar
                </Button>
              </div>
            </form>
          )}

          {step === 'admin' && createdEntity && (
            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-green-50 mb-2">
                <Check className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">"{createdEntity.name}" criada com sucesso!</p>
                  <p className="text-xs text-green-600">Agora convide o administrador responsável por esta empresa.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nome completo *</Label>
                  <Input value={adminName} onChange={e => setAdminName(e.target.value)}
                    placeholder="Nome do administrador" required className="mt-1.5 h-11 rounded-xl" autoFocus />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">E-mail *</Label>
                  <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                    placeholder="admin@empresa.com" required className="mt-1.5 h-11 rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cargo / Função</Label>
                  <Input value={adminCargo} onChange={e => setAdminCargo(e.target.value)}
                    placeholder="Ex: Diretor, Pastor..." className="mt-1.5 h-11 rounded-xl" />
                </div>
              </div>
              <div className="p-3 rounded-xl border border-blue-100 bg-blue-50 text-xs text-blue-700 leading-relaxed">
                <strong>Papel: Administrador</strong> — este usuário poderá gerenciar departamentos, convidar membros e ver todas as atividades da empresa.
              </div>
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setStep('empresa')} className="text-sm text-gray-500 hover:text-gray-700 underline">
                  ← Voltar
                </button>
                <Button type="submit" disabled={saving || !adminName.trim() || !adminEmail.trim()} className="rounded-xl gap-2 px-6"
                  style={{ background: 'linear-gradient(135deg, #006494, #13293D)' }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Enviar Convite
                </Button>
              </div>
            </form>
          )}

          {step === 'done' && createdEntity && (
            <div className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Tudo pronto!</h3>
              <p className="text-sm text-gray-500 mb-1">A empresa <strong>"{createdEntity.name}"</strong> foi criada.</p>
              <p className="text-sm text-gray-500 mb-6">O administrador receberá um e-mail para definir a senha e acessar o sistema.</p>
              <Button onClick={resetWizard} variant="outline" className="rounded-xl gap-2">
                <Plus className="h-4 w-4" />Criar outra empresa
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de empresas */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #F0F7FC, #E8F1F2)' }}>
          <Building2 className="h-5 w-5" style={{ color: '#006494' }} />
          <h2 className="font-semibold text-gray-900">Empresas Cadastradas</h2>
          <span className="ml-auto text-xs text-gray-400 bg-white/80 px-2.5 py-0.5 rounded-full border">{entities.length}</span>
        </div>
        {entities.length === 0 ? (
          <p className="text-sm text-gray-400 p-6">Nenhuma empresa cadastrada ainda.</p>
        ) : (
          <div className="divide-y">
            {entities.map(entity => {
              const members = users.filter(u => u.entity_id === entity.id)
              const admins = members.filter(u => u.role === 'admin' || u.role === 'super_admin')
              const isExpanded = expandedEntity === entity.id
              return (
                <div key={entity.id}>
                  <button
                    onClick={() => setExpandedEntity(isExpanded ? null : entity.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{entity.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{entity.type === 'empresa' ? 'Empresa' : 'Grupo Familiar'}</span>
                        {entity.document && <span className="text-xs text-gray-300">• {entity.document}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />{members.length}
                      </span>
                      {admins.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <Crown className="h-3 w-3" />{admins[0].full_name.split(' ')[0]}
                        </span>
                      )}
                      {admins.length === 0 && (
                        <span className="text-xs text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Sem admin</span>
                      )}
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    </div>
                  </button>
                  {isExpanded && members.length > 0 && (
                    <div className="bg-gray-50 border-t px-5 py-3 space-y-2">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center gap-3 py-1">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[10px] font-bold bg-blue-100 text-blue-700">
                              {getInitials(m.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{m.full_name}</p>
                            <p className="text-xs text-gray-400 truncate">{m.email}</p>
                          </div>
                          <Badge className={`text-[10px] border ${ROLE_COLORS[m.role]}`}>
                            {ROLE_LABELS[m.role]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
