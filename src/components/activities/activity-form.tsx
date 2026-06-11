'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Activity, Tag, UserProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Loader2, FileText, Tag as TagIcon, Users, Calendar, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { RichEditor } from '@/components/ui/rich-editor'

const activitySchema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
  context: z.string().optional(),
  responsible_id: z.string().optional(),
  delegated_to_id: z.string().optional(),
  priority: z.enum(['urgente', 'alta', 'media', 'baixa']),
  status: z.enum(['pendente', 'em_andamento', 'aguardando', 'concluida', 'cancelada']),
  rich_notes: z.string().optional(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
  follow_up_date: z.string().optional(),
  follow_up_time: z.string().optional(),
})

type ActivityFormData = z.infer<typeof activitySchema>

interface ActivityFormProps {
  activity?: Activity
  entityId: string
  userId: string
}

function toLocalDatetime(iso?: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const date = d.toISOString().split('T')[0]
  const time = d.toTimeString().slice(0, 5)
  return { date, time }
}

function buildISOString(date: string, time: string): string | null {
  if (!date) return null
  const timeStr = time || '00:00'
  return new Date(`${date}T${timeStr}`).toISOString()
}

export function ActivityForm({ activity, entityId, userId }: ActivityFormProps) {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>(
    activity?.tags?.map((t) => t.id) || []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const dueDT = toLocalDatetime(activity?.due_date)
  const followDT = toLocalDatetime(activity?.follow_up_date)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: activity?.title || '',
      description: activity?.description || '',
      context: activity?.context || '',
      responsible_id: activity?.responsible_id || '',
      delegated_to_id: activity?.delegated_to_id || '',
      priority: activity?.priority || 'media',
      status: activity?.status || 'pendente',
      rich_notes: activity?.rich_notes || '',
      due_date: dueDT.date,
      due_time: dueDT.time,
      follow_up_date: followDT.date,
      follow_up_time: followDT.time,
    },
  })

  useEffect(() => {
    supabase.from('user_profiles').select('*').eq('entity_id', entityId)
      .then(({ data }) => data && setUsers(data as UserProfile[]))
    supabase.from('tags').select('*').eq('entity_id', entityId)
      .then(({ data }) => data && setTags(data as Tag[]))
  }, [entityId])

  function toggleTag(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  async function onSubmit(data: ActivityFormData) {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...data,
        entity_id: entityId,
        responsible_id: data.responsible_id || null,
        delegated_to_id: data.delegated_to_id || null,
        due_date: buildISOString(data.due_date || '', data.due_time || ''),
        follow_up_date: buildISOString(data.follow_up_date || '', data.follow_up_time || ''),
        updated_at: new Date().toISOString(),
        due_time: undefined,
        follow_up_time: undefined,
      }

      let activityId = activity?.id
      const db = supabase as ReturnType<typeof import('@/lib/supabase/client').createClient>

      if (activity) {
        const changes: Array<{ field: string; old_value: string | null; new_value: string | null }> = []
        const fields = ['title', 'description', 'context', 'priority', 'status', 'due_date', 'follow_up_date'] as const
        for (const field of fields) {
          const oldVal = String(activity[field as keyof Activity] || '')
          const newVal = String((data as Record<string, unknown>)[field] || '')
          if (oldVal !== newVal) changes.push({ field, old_value: oldVal || null, new_value: newVal || null })
        }
        const updatePayload = { title: payload.title, description: payload.description, context: payload.context, responsible_id: payload.responsible_id, delegated_to_id: payload.delegated_to_id, priority: payload.priority, status: payload.status, rich_notes: payload.rich_notes, due_date: payload.due_date, follow_up_date: payload.follow_up_date, updated_at: payload.updated_at }
        const { error: updateError } = await db.from('activities').update(updatePayload).eq('id', activity.id)
        if (updateError) throw updateError
        for (const change of changes) {
          await db.from('activity_history').insert({ activity_id: activity.id, user_id: userId, field_changed: change.field, old_value: change.old_value, new_value: change.new_value })
        }
      } else {
        const insertPayload = { entity_id: payload.entity_id, title: payload.title, description: payload.description, context: payload.context, responsible_id: payload.responsible_id, delegated_to_id: payload.delegated_to_id, priority: payload.priority, status: payload.status, rich_notes: payload.rich_notes, due_date: payload.due_date, follow_up_date: payload.follow_up_date, created_by: userId, updated_at: payload.updated_at }
        const { data: created, error: insertError } = await db.from('activities').insert(insertPayload).select().single()
        if (insertError) throw insertError
        activityId = created.id
        await db.from('activity_history').insert({ activity_id: activityId, user_id: userId, field_changed: 'created', old_value: null, new_value: null })
      }

      if (activityId) {
        await supabase.from('activity_tags').delete().eq('activity_id', activityId)
        if (selectedTags.length > 0) {
          await supabase.from('activity_tags').insert(selectedTags.map((tagId) => ({ activity_id: activityId!, tag_id: tagId })))
        }
      }

      toast.success(activity ? 'Atividade atualizada!' : 'Atividade criada!', {
        description: activity ? 'As alterações foram salvas.' : 'Nova atividade adicionada com sucesso.',
      })
      router.push(activityId ? `/activities/${activityId}` : '/activities')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar'
      setError(msg)
      toast.error('Erro ao salvar', { description: msg })
    } finally {
      setSaving(false)
    }
  }

  const priority = watch('priority')
  const status = watch('status')

  const SECTION = 'bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4'
  const SECTION_TITLE = 'flex items-center gap-2 font-semibold text-gray-800 text-sm uppercase tracking-wide mb-1'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className={SECTION}>
        <div className={SECTION_TITLE}>
          <FileText className="h-4 w-4 text-violet-500" />
          Informações Básicas
        </div>
        <div>
          <Label htmlFor="title" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Título *</Label>
          <Input id="title" {...register('title')} placeholder="Ex: Reunião com cliente, Enviar relatório..." className="mt-1.5 h-11 rounded-xl" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <Label htmlFor="description" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Descrição</Label>
          <Textarea id="description" {...register('description')} placeholder="Descreva a atividade com detalhes..." rows={3} className="mt-1.5 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="context" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contexto</Label>
          <Input id="context" {...register('context')} placeholder="Ex: Projeto Alpha, Cliente XYZ, Financeiro..." className="mt-1.5 h-11 rounded-xl" />
        </div>
      </div>

      {/* Classification */}
      <div className={SECTION}>
        <div className={SECTION_TITLE}>
          <Calendar className="h-4 w-4 text-violet-500" />
          Classificação & Datas
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Prioridade</Label>
            <Select value={priority} onValueChange={(v) => setValue('priority', v as ActivityFormData['priority'])}>
              <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgente">🔴 Urgente</SelectItem>
                <SelectItem value="alta">🟠 Alta</SelectItem>
                <SelectItem value="media">🟡 Média</SelectItem>
                <SelectItem value="baixa">🟢 Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</Label>
            <Select value={status} onValueChange={(v) => setValue('status', v as ActivityFormData['status'])}>
              <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">⏳ Pendente</SelectItem>
                <SelectItem value="em_andamento">▶️ Em Andamento</SelectItem>
                <SelectItem value="aguardando">⏸️ Aguardando</SelectItem>
                <SelectItem value="concluida">✅ Concluída</SelectItem>
                <SelectItem value="cancelada">❌ Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due date with time */}
        <div>
          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Data e Horário de Vencimento</Label>
          <div className="flex gap-2 mt-1.5">
            <Input type="date" {...register('due_date')} className="flex-1 h-11 rounded-xl" />
            <Input type="time" {...register('due_time')} className="w-32 h-11 rounded-xl" />
          </div>
        </div>

        {/* Follow-up date with time */}
        <div>
          <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Data e Horário de Follow-up</Label>
          <div className="flex gap-2 mt-1.5">
            <Input type="date" {...register('follow_up_date')} className="flex-1 h-11 rounded-xl" />
            <Input type="time" {...register('follow_up_time')} className="w-32 h-11 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Responsibility */}
      <div className={SECTION}>
        <div className={SECTION_TITLE}>
          <Users className="h-4 w-4 text-violet-500" />
          Responsabilidade
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Responsável</Label>
            <Select value={watch('responsible_id') || 'none'} onValueChange={(v) => setValue('responsible_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Delegado para</Label>
            <Select value={watch('delegated_to_id') || 'none'} onValueChange={(v) => setValue('delegated_to_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className={SECTION}>
          <div className={SECTION_TITLE}>
            <TagIcon className="h-4 w-4 text-violet-500" />
            Etiquetas
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                type="button"
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={cn(
                  'text-sm px-3.5 py-1.5 rounded-full border-2 font-medium transition-all duration-150',
                  selectedTags.includes(tag.id) ? 'text-white border-transparent shadow-sm scale-105' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
                style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className={SECTION}>
        <div className={SECTION_TITLE}>
          <StickyNote className="h-4 w-4 text-violet-500" />
          Notas & Observações
        </div>
        <RichEditor
          value={watch('rich_notes') || ''}
          onChange={(html) => setValue('rich_notes', html)}
          placeholder="Adicione notas, instruções ou qualquer informação relevante..."
          minHeight="140px"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pb-6">
        <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl px-6">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="rounded-xl px-8 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {activity ? 'Salvar Alterações' : '✨ Criar Atividade'}
        </Button>
      </div>
    </form>
  )
}
