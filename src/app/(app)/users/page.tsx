'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, Department, UserRole, ROLE_LABELS, ROLE_COLORS } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getInitials, formatDate } from '@/lib/utils'
import { Users, Mail, Search, X, Building2, UserPlus, Filter, Shield, Crown, Layers, Clock, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'

interface UserDepartment {
  id: string
  user_id: string
  department_id: string
  role: 'gestor' | 'usuario'
  department?: Department
}

// Modal: Cadastrar/Convidar Usuário
function InviteModal({ onClose, entityId }: { onClose: () => void; entityId: string }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('')
  const [role, setRole] = useState('editor')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !fullName.trim()) return
    setSaving(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token || ''}` },
        body: JSON.stringify({ email: email.trim(), full_name: fullName.trim(), cargo: cargo.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao convidar')
      toast.success('Convite enviado!', { description: `${fullName} receberá um e-mail para definir sua senha.` })
      onClose()
    } catch (err: unknown) {
      toast.error('Erro ao enviar convite', { description: err instanceof Error ? err.message : 'Tente novamente' })
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '460px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #006494, #13293D)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>Cadastrar Usuário</div>
              <div style={{ fontSize: '12px', color: '#9CA3AF' }}>Envio de convite por e-mail</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', fontSize: '18px', color: '#6B7280' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <Label htmlFor="inv-name" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Nome completo *</Label>
            <Input id="inv-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="João da Silva" required className="mt-1.5 h-11 rounded-xl" autoFocus />
          </div>
          <div>
            <Label htmlFor="inv-email" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">E-mail *</Label>
            <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@email.com" required className="mt-1.5 h-11 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cargo / Função</Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Pastor, Tesoureiro..." className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Papel no sistema</Label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                style={{ marginTop: '6px', height: '44px', width: '100%', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '0 12px', fontSize: '14px', background: 'white', color: '#111827', cursor: 'pointer' }}>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Administrador</option>
                <option value="gestor">Gestor</option>
                <option value="editor">Editor</option>
                <option value="visualizador">Visualizador</option>
              </select>
            </div>
          </div>
          <div style={{ background: '#E8F4FD', borderRadius: '10px', padding: '12px', fontSize: '12px', color: '#1E5478', lineHeight: 1.6 }}>
            <strong>Como funciona:</strong> o usuário receberá um e-mail com link para definir sua senha e acessar o sistema. Após o cadastro, você poderá atribuir os departamentos.
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={saving || !fullName.trim() || !email.trim()} className="flex-1 rounded-xl gap-2" style={{ background: 'linear-gradient(135deg, #006494, #13293D)' }}>
              <Mail className="h-4 w-4" />{saving ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// Modal: Gerenciar Departamentos do Usuário
function DeptModal({ user, departments, userDepts, onClose, onSaved }: {
  user: UserProfile
  departments: Department[]
  userDepts: UserDepartment[]
  onClose: () => void
  onSaved: (depts: UserDepartment[]) => void
}) {
  const supabase = createClient()
  const [assignments, setAssignments] = useState<Record<string, 'gestor' | 'usuario' | null>>(
    () => {
      const map: Record<string, 'gestor' | 'usuario' | null> = {}
      departments.forEach(d => { map[d.id] = null })
      userDepts.forEach(ud => { map[ud.department_id] = ud.role })
      return map
    }
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function toggle(deptId: string) {
    setAssignments(prev => {
      if (prev[deptId] === null) return { ...prev, [deptId]: 'usuario' }
      if (prev[deptId] === 'usuario') return { ...prev, [deptId]: 'gestor' }
      return { ...prev, [deptId]: null }
    })
  }

  function setRole(deptId: string, role: 'gestor' | 'usuario') {
    setAssignments(prev => ({ ...prev, [deptId]: role }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await (supabase as any).from('user_departments').delete().eq('user_id', user.id)
      const toInsert = Object.entries(assignments)
        .filter(([, role]) => role !== null)
        .map(([deptId, role]) => ({ user_id: user.id, department_id: deptId, role }))
      if (toInsert.length > 0) {
        await (supabase as any).from('user_departments').insert(toInsert)
      }
      const newDepts: UserDepartment[] = toInsert.map(row => ({
        id: '',
        user_id: row.user_id,
        department_id: row.department_id,
        role: row.role as 'gestor' | 'usuario',
        department: departments.find(d => d.id === row.department_id),
      }))
      onSaved(newDepts)
      toast.success('Departamentos atualizados!')
      onClose()
    } catch {
      toast.error('Erro ao salvar departamentos')
    } finally {
      setSaving(false)
    }
  }

  const selected = Object.values(assignments).filter(r => r !== null).length

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '28px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>Departamentos de {user.full_name.split(' ')[0]}</div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>Clique para selecionar • clique de novo para definir o papel</div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', fontSize: '18px', color: '#6B7280' }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {departments.map((dept) => {
            const role = assignments[dept.id]
            const isSelected = role !== null
            return (
              <div key={dept.id} style={{
                borderRadius: '12px', border: '2px solid', padding: '14px 16px',
                borderColor: isSelected ? '#006494' : '#E5E7EB',
                background: isSelected ? '#F0F7FC' : 'white',
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button type="button" onClick={() => toggle(dept.id)} style={{
                    width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0, cursor: 'pointer',
                    border: '2px solid', borderColor: isSelected ? '#006494' : '#D1D5DB',
                    background: isSelected ? '#006494' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isSelected && <span style={{ color: 'white', fontSize: '13px', lineHeight: 1 }}>✓</span>}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{dept.name}</div>
                    {dept.description && <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{dept.description}</div>}
                  </div>
                  {isSelected && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" onClick={() => setRole(dept.id, 'usuario')}
                        style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          border: '1.5px solid', borderColor: role === 'usuario' ? '#006494' : '#E5E7EB',
                          background: role === 'usuario' ? '#006494' : 'white',
                          color: role === 'usuario' ? 'white' : '#6B7280',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                        <Shield style={{ width: '10px', height: '10px' }} />Usuário
                      </button>
                      <button type="button" onClick={() => setRole(dept.id, 'gestor')}
                        style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                          border: '1.5px solid', borderColor: role === 'gestor' ? '#E67E22' : '#E5E7EB',
                          background: role === 'gestor' ? '#E67E22' : 'white',
                          color: role === 'gestor' ? 'white' : '#6B7280',
                          display: 'flex', alignItems: 'center', gap: '4px',
                        }}>
                        <Crown style={{ width: '10px', height: '10px' }} />Gestor
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ background: '#FFF8E8', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#92400E', marginBottom: '16px' }}>
          <strong>Gestor</strong> vê todas as atividades do departamento. <strong>Usuário</strong> segue as permissões normais.
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl gap-2" style={{ background: 'linear-gradient(135deg, #006494, #13293D)' }}>
            <Layers className="h-4 w-4" />{saving ? 'Salvando...' : `Salvar (${selected} dept.)`}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

interface PendingInvite {
  id: string
  email: string
  full_name: string
  invited_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [userDepts, setUserDepts] = useState<Record<string, UserDepartment[]>>({})
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterDept, setFilterDept] = useState('all')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deptModalUser, setDeptModalUser] = useState<UserProfile | null>(null)
  const [editingCargo, setEditingCargo] = useState<string | null>(null)
  const [cargoValue, setCargoValue] = useState('')
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([])
  const [resendingId, setResendingId] = useState<string | null>(null)
  const supabase = createClient()

  async function loadPendingInvites(session: { access_token: string }) {
    try {
      const res = await fetch('/api/pending-invites', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPendingInvites(data.pending ?? [])
      }
    } catch { /* silently ignore */ }
  }

  async function handleResend(invite: PendingInvite) {
    setResendingId(invite.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/resend-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email: invite.email, full_name: invite.full_name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success('Convite reenviado!', { description: `Novo e-mail enviado para ${invite.email}` })
    } catch (err: unknown) {
      toast.error('Erro ao reenviar', { description: err instanceof Error ? err.message : 'Tente novamente' })
    } finally {
      setResendingId(null)
    }
  }

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p as UserProfile)
        const [{ data: us }, { data: deps }, { data: uds }] = await Promise.all([
          supabase.from('user_profiles').select('*').eq('entity_id', p.entity_id ?? '').order('full_name'),
          supabase.from('departments').select('*').eq('entity_id', p.entity_id ?? '').order('name'),
          (supabase as any).from('user_departments').select('*, department:departments(*)'),
        ])
        if (us) setUsers(us as UserProfile[])
        if (deps) setDepartments(deps as Department[])
        if (uds) {
          const map: Record<string, UserDepartment[]> = {}
          for (const ud of uds as UserDepartment[]) {
            if (!map[ud.user_id]) map[ud.user_id] = []
            map[ud.user_id].push(ud)
          }
          setUserDepts(map)
        }
        if (p.role === 'admin' || p.role === 'super_admin') {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) loadPendingInvites(session)
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function updateRole(userId: string, newRole: UserRole) {
    setUpdatingId(userId)
    await (supabase as any).from('user_profiles').update({ role: newRole }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    setUpdatingId(null)
    toast.success('Papel atualizado!')
  }

  async function saveCargo(userId: string) {
    await (supabase as any).from('user_profiles').update({ cargo: cargoValue || null }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, cargo: cargoValue || null } : u))
    setEditingCargo(null)
    toast.success('Cargo atualizado!')
  }

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.cargo ?? '').toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchDept = filterDept === 'all' || (userDepts[u.id] || []).some(ud => ud.department_id === filterDept)
    return matchSearch && matchRole && matchDept
  })


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie os membros da sua equipe</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setInviteOpen(true)} className="rounded-xl gap-2 shrink-0" style={{ background: 'linear-gradient(135deg, #006494, #13293D)' }}>
            <UserPlus className="h-4 w-4" />Cadastrar Usuário
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
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="gestor">Gestor</SelectItem>
            <SelectItem value="editor">Editor</SelectItem>
            <SelectItem value="visualizador">Visualizador</SelectItem>
          </SelectContent>
        </Select>
        {departments.length > 0 && (
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-44 h-10 rounded-xl text-sm"><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400 flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" />{filtered.length} de {users.length} usuários
        </p>
      </div>

      {/* Convites pendentes */}
      {isAdmin && pendingInvites.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-amber-200">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Convites pendentes ({pendingInvites.length})</span>
            <span className="text-xs text-amber-600 ml-auto">Usuários que ainda não definiram a senha</span>
          </div>
          <div className="divide-y divide-amber-100">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{invite.full_name || '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{invite.email}</p>
                </div>
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                  Aguardando
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={resendingId === invite.id}
                  onClick={() => handleResend(invite)}
                  className="h-7 rounded-lg text-xs gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
                >
                  {resendingId === invite.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <RefreshCw className="h-3 w-3" />}
                  Reenviar
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Nenhum usuário encontrado</p>
          {isAdmin && <Button onClick={() => setInviteOpen(true)} variant="outline" className="rounded-xl gap-2"><UserPlus className="h-4 w-4" />Cadastrar primeiro usuário</Button>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {filtered.map((user) => {
            const depts = userDepts[user.id] || []
            return (
              <div key={user.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900">{user.full_name}</p>
                      {user.id === profile?.id && <span className="text-xs text-gray-400">(você)</span>}
                      <Badge className={`text-[10px] border ${ROLE_COLORS[user.role]}`}>{ROLE_LABELS[user.role]}</Badge>
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {editingCargo === user.id ? (
                        <div className="flex items-center gap-1">
                          <Input value={cargoValue} onChange={(e) => setCargoValue(e.target.value)} placeholder="Ex: Pastor, Tesoureiro..."
                            className="h-6 text-xs w-44 rounded-lg px-2" autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter') saveCargo(user.id); if (e.key === 'Escape') setEditingCargo(null) }} />
                          <button onClick={() => saveCargo(user.id)} className="text-xs text-blue-700 font-medium">Salvar</button>
                          <button onClick={() => setEditingCargo(null)} className="text-xs text-gray-400">×</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingCargo(user.id); setCargoValue(user.cargo || '') }}
                          className="text-xs text-gray-400 hover:text-blue-700 transition-colors">
                          {user.cargo ? `💼 ${user.cargo}` : '+ Cargo'}
                        </button>
                      )}
                      <span className="text-xs text-gray-300">Desde {formatDate(user.created_at)}</span>
                    </div>

                    {/* Departamentos do usuário */}
                    {depts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {depts.map((ud) => (
                          <span key={ud.department_id} style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                            background: ud.role === 'gestor' ? '#FEF3C7' : '#E8F4FD',
                            color: ud.role === 'gestor' ? '#92400E' : '#1E5478',
                            border: `1px solid ${ud.role === 'gestor' ? '#FDE68A' : '#BAD8EE'}`,
                          }}>
                            {ud.role === 'gestor' ? <Crown style={{ width: '10px', height: '10px' }} /> : <Shield style={{ width: '10px', height: '10px' }} />}
                            {(ud.department as Department | undefined)?.name || 'Dept.'}
                          </span>
                        ))}
                      </div>
                    )}
                    {depts.length === 0 && (
                      <div className="mt-1.5">
                        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Sem departamento</span>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      {user.id !== profile?.id && (
                        <Select value={user.role} onValueChange={(v) => updateRole(user.id, v as UserRole)} disabled={updatingId === user.id}>
                          <SelectTrigger className="h-8 w-36 text-xs rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="gestor">Gestor</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="visualizador">Visualizador</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50"
                        onClick={() => setDeptModalUser(user)}>
                        <Building2 className="h-3.5 w-3.5" />Departamentos
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {inviteOpen && profile && <InviteModal onClose={() => setInviteOpen(false)} entityId={profile.entity_id || ''} />}
      {deptModalUser && (
        <DeptModal
          user={deptModalUser}
          departments={departments}
          userDepts={userDepts[deptModalUser.id] || []}
          onClose={() => setDeptModalUser(null)}
          onSaved={(newDepts) => setUserDepts(prev => ({ ...prev, [deptModalUser.id]: newDepts }))}
        />
      )}
    </div>
  )
}
