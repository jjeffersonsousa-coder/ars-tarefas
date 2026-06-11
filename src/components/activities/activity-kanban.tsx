'use client'

import { Activity, ActivityStatus, STATUS_LABELS, STATUS_COLORS } from '@/lib/types'
import { ActivityCard } from './activity-card'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const COLUMNS: { status: ActivityStatus; color: string; dot: string }[] = [
  { status: 'pendente',    color: 'border-t-gray-400',    dot: 'bg-gray-400' },
  { status: 'em_andamento',color: 'border-t-blue-500',    dot: 'bg-blue-500' },
  { status: 'aguardando',  color: 'border-t-amber-500',   dot: 'bg-amber-500' },
  { status: 'concluida',   color: 'border-t-emerald-500', dot: 'bg-emerald-500' },
  { status: 'cancelada',   color: 'border-t-red-400',     dot: 'bg-red-400' },
]

interface ActivityKanbanProps {
  activities: Activity[]
  canEdit: boolean
  onUpdate: () => void
}

export function ActivityKanban({ activities, canEdit, onUpdate }: ActivityKanbanProps) {
  const supabase = createClient()

  async function handleDrop(e: React.DragEvent, newStatus: ActivityStatus) {
    e.preventDefault()
    const activityId = e.dataTransfer.getData('activityId')
    if (!activityId) return

    const activity = activities.find(a => a.id === activityId)
    if (!activity || activity.status === newStatus) return

    const { error } = await supabase
      .from('activities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', activityId)

    if (error) {
      toast.error('Erro ao mover atividade')
    } else {
      toast.success(`Movida para "${STATUS_LABELS[newStatus]}"`)
      onUpdate()
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
      {COLUMNS.map(({ status, color, dot }) => {
        const colActivities = activities.filter(a => a.status === status)
        return (
          <div
            key={status}
            className="flex-shrink-0 w-72"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column header */}
            <div className={cn('bg-white rounded-xl border border-t-4 px-4 py-3 mb-3 shadow-sm', color)}>
              <div className="flex items-center gap-2">
                <span className={cn('w-2.5 h-2.5 rounded-full', dot)} />
                <span className="font-semibold text-sm text-gray-700">{STATUS_LABELS[status]}</span>
                <span className="ml-auto bg-gray-100 text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full">
                  {colActivities.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px]">
              {colActivities.map((activity) => (
                <div
                  key={activity.id}
                  draggable={canEdit}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('activityId', activity.id)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  className={cn(canEdit && 'cursor-grab active:cursor-grabbing')}
                >
                  <ActivityCard activity={activity} canEdit={canEdit} onUpdate={onUpdate} compact />
                </div>
              ))}
              {colActivities.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl h-20 flex items-center justify-center">
                  <p className="text-xs text-gray-300">Arraste aqui</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
