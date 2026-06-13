'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, Department } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Plus, Pencil, Trash2, Users, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'

function DeptModal({ dept, entityId, onClose, onSaved }: { dept: Department | null; entityId: string; onClose: () => void; onSaved: (d: Department) => void }) {
  const [name, setName] = useState(dept?.name || '')
  const [description, setDescription] = useState(dept?.description || '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)

    if (dept) {
      const { data, error } = await supabase.from('departments').update({ name: name.trim(), description: description.trim() || null }).eq('id', dept.id).select().single()
      if (error) { toast.error('Erro ao atualizar: ' + error.message) } else { onSaved(data as Department); onClose() }
    } else {
      const { data, error } = await supabase.from('departments').insert({ name: name.trim(), description: description.trim() || null, entity_id: entityId }).select().single()
      if (error) { toast.error('Erro ao criar: ' + error.message) } else { onSaved(data as Department); onClose() }
    }
    setSaving(false)
  }

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.5)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>{dept ? 'Editar Departamento' : 'Novo Departamento'}</div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #E5E7EB', background: '#F9FAFB', cursor: 'pointer', fontSize: '18px', color: '#6B7280' }}>×</button>
        </div>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <Label htmlFor="dname">Nome do Departamento *</Label>
            <Input id="dname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Financeiro, Secretaria, Comunicação..." required className="mt-1 rounded-xl" autoFocus />
          </div>
          <div>
            <Label htmlFor="ddesc">Descrição (opcional)</Label>
            <Input id="ddesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição do departamento" className="mt-1 rounded-xl" />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancelar</Button>
            <Button type="submit" disabled={saving || !name.trim()} className="flex-1 rounded-xl bg-blue-700 hover:bg-blue-800">
              {saving ? 'Salvando...' : dept ? 'Salvar' : 'Criar Departamento'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({})
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalDept, setModalDept] = useState<Department | null | 'new'>('new' as any)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p as UserProfile)
        const { data: deps } = await supabase.from('departments').select('*').eq('entity_id', p.entity_id ?? '').order('name')
        if (deps) {
          setDepartments(deps as Department[])
          const { data: members } = await supabase.from('user_profiles').select('id, department_id').eq('entity_id', p.entity_id ?? '')
          if (members) {
            const counts: Record<string, number> = {}
            members.forEach((m: any) => { if (m.department_id) counts[m.department_id] = (counts[m.department_id] || 0) + 1 })
            setMemberCounts(counts)
          }
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza? Os usuários desse departamento ficarão sem departamento.')) return
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) { toast.error(error.message) } else {
      setDepartments((prev) => prev.filter((d) => d.id !== id))
      toast.success('Departamento removido')
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departamentos</h1>
          <p className="text-gray-500 text-sm mt-0.5">Organize sua empresa em departamentos para controle de acesso</p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditing(null); setModalOpen(true) }} className="bg-blue-700 hover:bg-blue-800 rounded-xl gap-2 shrink-0">
            <Plus className="h-4 w-4" />Novo Departamento
          </Button>
        )}
      </div>

      {departments.length === 0 && !loading ? (
        <div className="bg-white rounded-xl border p-12 text-center">
          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Nenhum departamento criado</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Crie departamentos para organizar os usuários e controlar o que cada um vê</p>
          {isAdmin && (
            <Button onClick={() => { setEditing(null); setModalOpen(true) }} className="bg-blue-700 hover:bg-blue-800 rounded-xl gap-2">
              <Plus className="h-4 w-4" />Criar primeiro departamento
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 animate-pulse" />)
          ) : departments.map((dept) => (
            <div key={dept.id} className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <Building2 className="h-5 w-5 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{dept.name}</p>
                {dept.description && <p className="text-sm text-gray-500">{dept.description}</p>}
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {memberCounts[dept.id] || 0} membro{(memberCounts[dept.id] || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(dept); setModalOpen(true) }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(dept.id)} className="p-2 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-sm font-semibold text-blue-800 mb-1">Como funciona o controle por departamento:</p>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Cada usuário é vinculado a um departamento na página de Usuários</li>
          <li>Usuários só veem as atividades do seu departamento</li>
          <li>Administradores veem todos os departamentos</li>
          <li>Usuários sem departamento não conseguem ver atividades</li>
        </ul>
      </div>

      {modalOpen && profile?.entity_id && (
        <DeptModal
          dept={editing}
          entityId={profile.entity_id}
          onClose={() => setModalOpen(false)}
          onSaved={(d) => {
            if (editing) {
              setDepartments((prev) => prev.map((x) => x.id === d.id ? d : x))
              toast.success('Departamento atualizado!')
            } else {
              setDepartments((prev) => [...prev, d])
              toast.success('Departamento criado!')
            }
          }}
        />
      )}
    </div>
  )
}
