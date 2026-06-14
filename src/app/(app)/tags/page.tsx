'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Tag, UserProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Tags } from 'lucide-react'
import { Loader2 } from 'lucide-react'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#64748b',
]

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTag, setEditTag] = useState<Tag | null>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p as UserProfile)
        const { data: t } = await supabase.from('tags').select('*').eq('entity_id', p.entity_id ?? '').order('name')
        if (t) setTags(t as Tag[])
      }
      setLoading(false)
    }
    load()
  }, [])

  function openNew() {
    setEditTag(null)
    setName('')
    setColor('#6366f1')
    setDialogOpen(true)
  }

  function openEdit(tag: Tag) {
    setEditTag(tag)
    setName(tag.name)
    setColor(tag.color)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!name.trim() || !profile?.entity_id) return
    setSaving(true)

    if (editTag) {
      const { error } = await supabase.from('tags').update({ name, color }).eq('id', editTag.id)
      if (!error) {
        setTags((prev) => prev.map((t) => t.id === editTag.id ? { ...t, name, color } : t))
      }
    } else {
      const { data, error } = await supabase
        .from('tags')
        .insert({ name, color, entity_id: profile.entity_id })
        .select()
        .single()
      if (!error && data) setTags((prev) => [...prev, data as Tag])
    }

    setSaving(false)
    setDialogOpen(false)
  }

  async function handleDelete(tagId: string) {
    if (!confirm('Excluir esta etiqueta? Ela será removida de todas as atividades.')) return
    await supabase.from('tags').delete().eq('id', tagId)
    setTags((prev) => prev.filter((t) => t.id !== tagId))
  }

  const canEdit = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'gestor' || profile?.role === 'editor'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etiquetas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Organize suas atividades com etiquetas coloridas</p>
        </div>
        {canEdit && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Etiqueta
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(6)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : tags.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Tags className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhuma etiqueta criada ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {tags.map((tag) => (
            <div key={tag.id} className="bg-white rounded-lg border p-3 flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span
                  className="h-6 w-6 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm font-medium text-gray-800">{tag.name}</span>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(tag)} className="p-1 hover:bg-gray-100 rounded">
                    <Pencil className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(tag.id)} className="p-1 hover:bg-red-50 rounded">
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTag ? 'Editar Etiqueta' : 'Nova Etiqueta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="Nome da etiqueta" />
            </div>
            <div>
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-8 w-16 rounded cursor-pointer border border-gray-200"
                />
                <span className="text-xs text-gray-500">Cor personalizada</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Prévia:</span>
              <span
                className="text-xs px-3 py-1 rounded-full text-white font-medium"
                style={{ backgroundColor: color }}
              >
                {name || 'Etiqueta'}
              </span>
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
