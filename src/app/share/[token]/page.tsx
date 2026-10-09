'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Activity, ChecklistItem } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Calendar, User, CalendarDays, AlertTriangle, Loader2, Lock } from 'lucide-react'

function formatShortDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function isOverdue(iso: string) {
  return iso < new Date().toISOString().split('T')[0]
}

export default function SharePage() {
  const params = useParams()
  const token = params.token as string
  const supabase = createClient()

  const [activity, setActivity] = useState<Activity | null>(null)
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: act } = await (supabase as any)
        .from('activities')
        .select(`*, responsible:responsible_id(id, full_name, avatar_url, email, role, entity_id, created_at, updated_at), delegated_to:delegated_to_id(id, full_name, avatar_url, email, role, entity_id, created_at, updated_at), activity_tags(tag_id, tags(*))`)
        .eq('share_token', token)
        .single()

      if (!act) { setNotFound(true); setLoading(false); return }

      setActivity({ ...act, tags: (act.activity_tags || []).map((at: { tags: unknown }) => at.tags).filter(Boolean) })

      const { data: cl } = await (supabase as any)
        .from('checklist_items')
        .select('*')
        .eq('activity_id', act.id)
        .order('order_index')
      setChecklist((cl || []) as ChecklistItem[])

      setLoading(false)
    }
    load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 text-center px-4">
        <Lock className="h-10 w-10 text-gray-300" />
        <h1 className="text-lg font-semibold text-gray-700">Link inválido ou expirado</h1>
        <p className="text-sm text-gray-400">Este link de compartilhamento não existe ou foi removido.</p>
      </div>
    )
  }

  if (!activity) return null

  const completedCount = checklist.filter(i => i.completed).length
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header branding */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium">ARS · Gerenciamento de Tarefas</span>
          <span className="text-xs text-gray-300">Visualização compartilhada · somente leitura</span>
        </div>

        {/* Activity card */}
        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge className={cn('border text-xs', PRIORITY_COLORS[activity.priority])}>
              {PRIORITY_LABELS[activity.priority]}
            </Badge>
            <Badge className={cn('border text-xs', STATUS_COLORS[activity.status])}>
              {STATUS_LABELS[activity.status]}
            </Badge>
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">{activity.title}</h1>
            {activity.context && (
              <p className="text-sm text-indigo-600 mt-1 font-medium">{activity.context}</p>
            )}
            {activity.description && (
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{activity.description}</p>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {activity.start_date && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Calendar className="h-3 w-3" /> Início</p>
                <p className="font-medium text-gray-800">{formatDate(activity.start_date)}</p>
              </div>
            )}
            {activity.due_date && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Calendar className="h-3 w-3" /> {activity.start_date ? 'Término' : 'Vencimento'}</p>
                <p className="font-medium text-gray-800">{formatDate(activity.due_date)}</p>
              </div>
            )}
            {activity.responsible && (
              <div>
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><User className="h-3 w-3" /> Responsável</p>
                <p className="font-medium text-gray-800">{activity.responsible.full_name}</p>
              </div>
            )}
          </div>

          {activity.tags && activity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {activity.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2.5 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Checklist */}
        {checklist.length > 0 && (
          <div className="bg-white rounded-xl border shadow-sm p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Checklist ({completedCount}/{checklist.length})</h2>
              <span className="text-xs text-gray-400">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-1.5">
              {checklist.map(item => {
                const over = item.due_date && !item.completed && isOverdue(item.due_date)
                return (
                  <div key={item.id} className={cn('flex items-start gap-2.5 rounded-lg px-3 py-2 border', over ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-transparent')}>
                    <Checkbox checked={item.completed} disabled className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-sm', item.completed ? 'line-through text-gray-400' : 'text-gray-700')}>{item.text}</span>
                      {item.due_date && (
                        <div className={cn('flex items-center gap-1 mt-0.5', over ? 'text-red-500' : 'text-gray-400')}>
                          {over ? <AlertTriangle className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
                          <span className="text-[11px] font-medium">{formatShortDate(item.due_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        {activity.rich_notes && (
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Notas</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700
                [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                [&_li]:my-0.5 [&_p]:my-1 [&_p]:leading-relaxed
                [&_strong]:font-semibold [&_em]:italic
                [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-bold"
              dangerouslySetInnerHTML={{ __html: activity.rich_notes }}
            />
          </div>
        )}

        <p className="text-center text-xs text-gray-300 pb-4">
          Compartilhado via ARS · Gerenciamento de Tarefas
        </p>
      </div>
    </div>
  )
}
