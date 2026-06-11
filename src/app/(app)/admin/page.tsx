'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building2, Users, Plus, Loader2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

interface Entity {
  id: string
  name: string
  type: string
  created_at: string
}

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  entity_id: string | null
  entities?: { name: string; type: string }
}

const SUPER_ADMIN_EMAIL = 'jjeffersonsousa@gmail.com'

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [entities, setEntities] = useState<Entity[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [creating, setCreating] = useState(false)

  // Form state
  const [entityName, setEntityName] = useState('')
  const [entityType, setEntityType] = useState<'empresa' | 'familia'>('empresa')
  const [entityDocument, setEntityDocument] = useState('')
  const [masterUserId, setMasterUserId] = useState('')

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== SUPER_ADMIN_EMAIL) {
        router.replace('/dashboard')
        return
      }
      setAuthorized(true)
      await loadData()
      setLoading(false)
    }
    init()
  }, [])

  async function loadData() {
    const [{ data: entitiesData }, { data: usersData }] = await Promise.all([
      supabase.from('entities').select('*').order('created_at', { ascending: false }),
      supabase.from('user_profiles').select('*, entities(name, type)').order('full_name'),
    ])
    if (entitiesData) setEntities(entitiesData.filter(e => e.type !== 'pessoa_fisica'))
    if (usersData) setUsers(usersData as UserProfile[])
  }

  async function handleCreateEntity(e: React.FormEvent) {
    e.preventDefault()
    if (!masterUserId) { toast.error('Selecione um usuário master'); return }
    setCreating(true)

    // Cria a entidade
    const { data: entity, error: entityError } = await supabase
      .from('entities')
      .insert({ name: entityName, type: entityType, document: entityDocument || null })
      .select().single()

    if (entityError) { toast.error('Erro ao criar entidade: ' + entityError.message); setCreating(false); return }

    // Atualiza o usuário master para apontar para essa entidade
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({ entity_id: entity.id, role: 'admin' })
      .eq('id', masterUserId)

    if (profileError) { toast.error('Erro ao vincular usuário: ' + profileError.message); setCreating(false); return }

    toast.success(`"${entityName}" criada e vinculada a ${users.find(u => u.id === masterUserId)?.full_name}!`)
    setEntityName(''); setEntityDocument(''); setMasterUserId('')
    await loadData()
    setCreating(false)
  }

  async function handleAssignUser(userId: string, entityId: string, role: 'admin' | 'editor' | 'visualizador') {
    const { error } = await supabase.from('user_profiles').update({ entity_id: entityId, role }).eq('id', userId)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Usuário atualizado!')
    await loadData()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
    </div>
  )

  if (!authorized) return null

  const unlinkedUsers = users.filter(u => !u.entity_id || users.find(u2 => u2.id === u.id)?.entities === null)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-7 w-7 text-violet-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel do Super Admin</h1>
          <p className="text-sm text-gray-500">Gerencie empresas, grupos familiares e usuários</p>
        </div>
      </div>

      {/* Criar nova entidade */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5 text-violet-600" /> Criar Empresa ou Grupo Familiar
        </h2>
        <form onSubmit={handleCreateEntity} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome *</Label>
            <Input value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="Nome da empresa/família" required className="mt-1" />
          </div>
          <div>
            <Label>Tipo *</Label>
            <Select value={entityType} onValueChange={v => setEntityType(v as 'empresa' | 'familia')}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="empresa">Empresa</SelectItem>
                <SelectItem value="familia">Grupo Familiar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>CNPJ/Documento (opcional)</Label>
            <Input value={entityDocument} onChange={e => setEntityDocument(e.target.value)} placeholder="Número do documento" className="mt-1" />
          </div>
          <div>
            <Label>Usuário Master *</Label>
            <Select value={masterUserId} onValueChange={setMasterUserId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione um usuário" /></SelectTrigger>
              <SelectContent>
                {users.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={creating} className="w-full md:w-auto">
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar e Vincular Usuário Master
            </Button>
          </div>
        </form>
      </div>

      {/* Lista de entidades */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-violet-600" /> Empresas e Grupos ({entities.length})
        </h2>
        {entities.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma empresa/grupo criado ainda.</p>
        ) : (
          <div className="space-y-3">
            {entities.map(entity => {
              const members = users.filter(u => u.entity_id === entity.id)
              return (
                <div key={entity.id} className="border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{entity.name}</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {entity.type === 'empresa' ? 'Empresa' : 'Grupo Familiar'}
                      </Badge>
                    </div>
                    <span className="text-sm text-gray-500">{members.length} membro(s)</span>
                  </div>
                  {members.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {members.map(m => (
                        <div key={m.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{m.full_name} <span className="text-gray-400">({m.email})</span></span>
                          <Badge className={m.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-700'}>
                            {m.role === 'admin' ? 'Master' : m.role}
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

      {/* Todos os usuários */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-600" /> Todos os Usuários ({users.length})
        </h2>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between border rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">{u.full_name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{(u as any).entities?.name ?? 'Sem empresa'}</p>
                <Badge variant="outline" className="text-xs">{u.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
