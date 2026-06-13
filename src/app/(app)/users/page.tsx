'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, Department, ROLE_LABELS } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getInitials, formatDate } from '@/lib/utils'
import { Users, Mail, Search, X, Building2, Send, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    const registerUrl = `${window.location.origin}/register`
    const subject = encodeURIComponent('Convite para o sistema ARS')
    const body = encodeURIComponent(
      `Olá!\n\nVocê foi convidado(a) para fazer parte do nosso sistema de gestão de atividades ARS.\n\nClique no link abaixo para criar sua conta:\n${registerUrl}\n\nApós o cadastro, o administrador irá vincular você ao departamento correto.\n\nAbraços!`
    )
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank')
    toast.success('Abrindo seu app de e-mail com o convite pronto!')
    setSending(false)
    onClose()
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail style={{ width: '18px', height: '18px', color: '#1D4ED8' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>Convidar por E-mail</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Envie o link de cadastro</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', fontSize: '18px', color: '#6B7280' }}>×</button>
        </div>
        <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', display: 'block', marginBottom: '6px' }}>E-mail do convidado</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@email.com" required className="h-11 rounded-xl" />
          </div>
          <div style={{ background: '#EFF6FF', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#1E40AF', lineHeight: 1.6 }}>
            Será aberto o seu app de e-mail com mensagem pronta. Após o cadastro, você vincula o usuário ao departamento nesta página.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={sending} className="flex-1 rounded-xl bg-blue-700 hover:bg-blue-800 gap-2">
              <Send className="h-4 w-4" />Enviar Convite
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editingCargo, setEditingCargo] = useState<string | null>(null)
  const [cargoValue, setCargoValue] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p as UserProfile)
        const [{ data: us }, { data: deps }] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('entity_id', p.entity_id ?? '').order('full_name'),
          supabase.from('departments').select('*').eq('entity_id', p.entity_id ?? '').order('name'),
        ])
        if (us) setUsers(us as UserProfile[])
        if (deps) setDepartments(deps as Department[])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function updateRole(userId: string, newRole: 'admin' | 'editor' | 'visualizador') {
    setUpdatingId(userId)
    await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    setUpdatingId(null)
  }

  async function saveCargo(userId: string) {
    await supabase.from('user_profiles').update({ cargo: cargoValue || null }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, cargo: cargoValue || null } : u))
    setEditingCargo(null)
    toast.success('Cargo atualizado!')
  }

  const isAdmin = profile?.role === 'admin'

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.cargo ?? '').toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchDept = filterDept === 'all' || (filterDept === 'none' ? !u.department_id : u.department_id === filterDept)
    return matchSearch && matchRole && matchDept
  })

  const roleColors: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    editor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    visualizador: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie os membros da sua equipe</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)} className="bg-blue-700 hover:bg-blue-800 rounded-xl gap-2 shrink-0">
            <Mail className="h-4 w-4" />Convidar por E-mail
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Buscar por nome, e-mail ou cargo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl h-10" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-gray-400" /></button>}
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-40 h-10 rounded-xl text-sm"><SelectValue placeholder="Papel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="visualizador">Visualizador</SelectItem>
          </SelectContent>
        </Select>
        {departments.length > 0 && (
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-44 h-10 rounded-xl text-sm"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="none">Sem departamento</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <p className="text-sm text-gray-400 flex items-center gap-1.5">
        <Filter className="h-3.5 w-3.5" />{filtered.length} de {users.length} usuários
      </p>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {filtered.map((user) => {
            const dept = departments.find((d) => d.id === user.department_id)
            return (
              <div key={user.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                <Avatar className="h-10 w-10 shrink-0">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    {user.id === profile?.id && <span className="text-xs text-gray-400">(você)</span>}
                    <Badge className={`text-[10px] border ${roleColors[user.role]}`}>{ROLE_LABELS[user.role]}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {editingCargo === user.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={cargoValue}
                          onChange={(e) => setCargoValue(e.target.value)}
                          placeholder="Ex: Gerente, Pastor..."
                          className="h-6 text-xs w-44 rounded-lg px-2"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') saveCargo(user.id); if (e.key === 'Escape') setEditingCargo(null) }}
                        />
                        <button onClick={() => saveCargo(user.id)} className="text-xs text-blue-700 font-medium">Salvar</button>
                        <button onClick={() => setEditingCargo(null)} className="text-xs text-gray-400">×</button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingCargo(user.id); setCargoValue(user.cargo || '') }} className="text-xs text-gray-400 hover:text-blue-700 transition-colors">
                        {user.cargo ? `💼 ${user.cargo}` : '+ Adicionar cargo'}
                      </button>
                    )}
                    {dept && <span className="text-xs flex items-center gap-1 text-gray-500"><Building2 className="h-3 w-3" />{dept.name}</span>}
                    <span className="text-xs text-gray-300">Desde {formatDate(user.created_at)}</span>
                  </div>
                </div>
                {isAdmin && user.id !== profile?.id && (
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Select value={user.role} onValueChange={(v) => updateRole(user.id, v as 'admin' | 'editor' | 'visualizador')} disabled={updatingId === user.id}>
                      <SelectTrigger className="h-8 w-36 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="visualizador">Visualizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  )
}
