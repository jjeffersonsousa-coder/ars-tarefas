'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Entity, UserProfile, ENTITY_TYPE_LABELS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, Plus, Pencil, Mail, Phone } from 'lucide-react'
import { Loader2 } from 'lucide-react'

export default function EntitiesPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntity, setEditEntity] = useState<Entity | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<'empresa' | 'familia' | 'pessoa_fisica'>('empresa')
  const [document, setDocument] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) setProfile(p as UserProfile)
      const { data: ents } = await supabase.from('entities').select('*').order('name')
      if (ents) setEntities(ents as Entity[])
      setLoading(false)
    }
    load()
  }, [])

  function openEdit(entity: Entity) {
    setEditEntity(entity)
    setName(entity.name)
    setType(entity.type)
    setDocument(entity.document || '')
    setEmail(entity.email || '')
    setPhone(entity.phone || '')
    setAddress(entity.address || '')
    setDialogOpen(true)
  }

  function openNew() {
    setEditEntity(null)
    setName('')
    setType('empresa')
    setDocument('')
    setEmail('')
    setPhone('')
    setAddress('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const payload = {
      name,
      type,
      document: document || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      updated_at: new Date().toISOString(),
    }

    if (editEntity) {
      const { error } = await supabase.from('entities').update(payload).eq('id', editEntity.id)
      if (error) { setError(error.message); setSaving(false); return }
      setEntities((prev) => prev.map((e) => e.id === editEntity.id ? { ...e, ...payload } : e))
    } else {
      const { data, error } = await supabase.from('entities').insert(payload).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      setEntities((prev) => [...prev, data as Entity])
    }

    setDialogOpen(false)
    setSaving(false)
  }

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie empresas, famílias e pessoas</p>
        </div>
        {isAdmin && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Entidade
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : entities.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma entidade cadastrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => (
            <Card key={entity.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{entity.name}</CardTitle>
                      <p className="text-xs text-gray-500">{ENTITY_TYPE_LABELS[entity.type]}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(entity)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5">
                {entity.email && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="h-3 w-3 text-gray-400" />
                    {entity.email}
                  </div>
                )}
                {entity.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {entity.phone}
                  </div>
                )}
                {entity.document && (
                  <p className="text-xs text-gray-500">Doc: {entity.document}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editEntity ? 'Editar Entidade' : 'Nova Entidade'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
                {error}
              </div>
            )}
            <div>
              <Label>Nome *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Nome da entidade" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'empresa' | 'familia' | 'pessoa_fisica')}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="familia">Família</SelectItem>
                  <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Documento</Label>
                <Input value={document} onChange={(e) => setDocument(e.target.value)} className="mt-1" placeholder="CNPJ/CPF" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" placeholder="contato@empresa.com" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" placeholder="Endereço completo" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
