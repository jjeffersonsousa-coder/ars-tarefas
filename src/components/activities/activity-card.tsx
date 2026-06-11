'use client'

import Link from 'next/link'
import { Activity, PRIORITY_LABELS, STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn, formatDate, getInitials, isOverdue, isDueToday } from '@/lib/utils'
import { CalendarDays, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ActivityStatus } from '@/lib/types'
import { toast } from 'sonner'

const PRIORITY_DOT: Record<string, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-orange-500',
  media: 'bg-yellow-400',
  baixa: 'bg-green-500',
}

const PRIORITY_BADGE: Record<string, string> = {
  urgente: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  alta: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  media: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200',
  baixa: 'bg-green-50 text-green-700 ring-1 ring-green-200',
}

const PRIORITY_BORDER: Record<string, string> = {
  urgente: 'border-l-red-500',
  alta: 'border-l-orange-400',
  media: 'border-l-yellow-400',
  baixa: 'border-l-green-500',
}

interface ActivityCardProps {
  activity: Activity
  onUpdate?: () => void
  canEdit?: boolean
  compact?: boolean
}

export function ActivityCard({ activity, onUpdate, canEdit = false, compact = false }: ActivityCardProps) {
  const [status, setStatus] = useState<ActivityStatus>(activity.status)
  const [updating, setUpdating] = useState(false)
  const supabase = createClient()

  const overdue = isOverdue(activity.due_date)
  const dueToday = isDueToday(activity.due_date)
  const isFinished = status === 'concluida' || status === 'cancelada'

  async function handleStatusChange(newStatus: ActivityStatus) {
    if (!canEdit) return
    setUpdating(true)
    const { error } = await supabase
      .from('activities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', activity.id)
    if (!error) {
      setStatus(newStatus)
      toast.success(`Status atualizado para "${STATUS_LABELS[newStatus]}"`)
      onUpdate?.()
    } else {
      toast.error('Erro ao atualizar status')
    }
    setUpdating(false)
  }

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-gray-100 border-l-4 p-5 card-hover group',
        PRIORITY_BORDER[activity.priority],
        overdue && !isFinished && 'bg-red-50/30 border-l-red-500'
      )}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', PRIORITY_DOT[activity.priority])} />

        <div className="flex-1 min-w-0">
          <Link
            href={`/activities/${activity.id}`}
            className="group/link flex items-center gap-1"
          >
            <h3 className={cn(
              'font-semibold text-gray-900 truncate group-hover/link:text-violet-700 transition-colors',
              isFinished && 'line-through text-gray-400'
            )}>
              {activity.title}
            </h3>
            <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover/link:text-violet-500 shrink-0 transition-colors" />
          </Link>

          {activity.context && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{activity.context}</p>
          )}
        </div>

        <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0', PRIORITY_BADGE[activity.priority])}>
          {PRIORITY_LABELS[activity.priority]}
        </span>
      </div>

      {/* Description */}
      {activity.description && (
        <p className="text-sm text-gray-500 mt-2.5 ml-5 line-clamp-2 leading-relaxed">
          {activity.description}
        </p>
      )}

      {/* Tags */}
      {activity.tags && activity.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 ml-5">
          {activity.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-[11px] px-2.5 py-0.5 rounded-full text-white font-medium"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 ml-5">
        <div className="flex items-center gap-3">
          {activity.due_date && (
            <div className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              overdue && !isFinished ? 'text-red-600' : dueToday && !isFinished ? 'text-amber-600' : 'text-gray-400'
            )}>
              {overdue && !isFinished
                ? <AlertTriangle className="h-3.5 w-3.5" />
                : dueToday && !isFinished
                ? <Clock className="h-3.5 w-3.5" />
                : <CalendarDays className="h-3.5 w-3.5" />
              }
              {formatDate(activity.due_date)}
            </div>
          )}

          {activity.responsible && (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5 ring-1 ring-gray-200">
                {activity.responsible.avatar_url && <AvatarImage src={activity.responsible.avatar_url} />}
                <AvatarFallback className="bg-violet-100 text-violet-700 text-[9px] font-bold">
                  {getInitials(activity.responsible.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500 font-medium">{activity.responsible.full_name.split(' ')[0]}</span>
            </div>
          )}
        </div>

        {canEdit ? (
          <Select value={status} onValueChange={(v) => handleStatusChange(v as ActivityStatus)} disabled={updating}>
            <SelectTrigger className={cn('h-7 text-xs px-2.5 rounded-lg w-auto gap-1 border font-medium', STATUS_COLORS[status])}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="aguardando">Aguardando</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className={cn('text-xs font-medium px-2.5 py-1 rounded-lg border', STATUS_COLORS[status])}>
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>
    </div>
  )
}
