'use client'

import { Activity, ActivityHistory as ActivityHistoryType, ChecklistItem, UserRole } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/types'
import { formatDate, formatDateTime, getInitials, cn } from '@/lib/utils'
import { Calendar, Clock, User, UserCheck, Edit, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Checklist } from './checklist'
import { ActivityHistoryLog } from './activity-history'

interface ActivityDetailProps {
  activity: Activity
  history: ActivityHistoryType[]
  checklistItems: ChecklistItem[]
  userRole: UserRole
  currentUserId: string
}

export function ActivityDetail({
  activity,
  history,
  checklistItems,
  userRole,
  currentUserId,
}: ActivityDetailProps) {
  const canEdit = userRole === 'admin' || userRole === 'editor'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/activities">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <Badge className={cn('border text-xs', PRIORITY_COLORS[activity.priority])}>
                {PRIORITY_LABELS[activity.priority]}
              </Badge>
              <Badge className={cn('border text-xs', STATUS_COLORS[activity.status])}>
                {STATUS_LABELS[activity.status]}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{activity.title}</h1>
            {activity.context && (
              <p className="text-sm text-indigo-600 mt-1 font-medium">{activity.context}</p>
            )}
          </div>
          {canEdit && (
            <Button asChild size="sm">
              <Link href={`/activities/${activity.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Link>
            </Button>
          )}
        </div>

        {activity.description && (
          <p className="text-gray-700 mt-4 text-sm leading-relaxed">{activity.description}</p>
        )}

        <Separator className="my-4" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Vencimento
            </p>
            <p className="text-sm font-medium text-gray-800">
              {formatDate(activity.due_date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Follow-up
            </p>
            <p className="text-sm font-medium text-gray-800">
              {formatDate(activity.follow_up_date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <User className="h-3 w-3" /> Responsável
            </p>
            {activity.responsible ? (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  {activity.responsible.avatar_url && <AvatarFallback>{getInitials(activity.responsible.full_name)}</AvatarFallback>}
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                    {getInitials(activity.responsible.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-800">
                  {activity.responsible.full_name}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <UserCheck className="h-3 w-3" /> Delegado para
            </p>
            {activity.delegated_to ? (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                    {getInitials(activity.delegated_to.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-800">
                  {activity.delegated_to.full_name}
                </span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        </div>

        {activity.tags && activity.tags.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Etiquetas</p>
            <div className="flex flex-wrap gap-1">
              {activity.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2.5 py-1 rounded-full text-white font-medium"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-400 flex gap-4">
          <span>Criado em {formatDateTime(activity.created_at)}</span>
          <span>Atualizado em {formatDateTime(activity.updated_at)}</span>
        </div>
      </div>

      <Tabs defaultValue="checklist">
        <TabsList>
          <TabsTrigger value="checklist">
            Checklist ({checklistItems.filter((i) => i.completed).length}/{checklistItems.length})
          </TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="history">Histórico ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="checklist">
          <div className="bg-white rounded-lg border p-6">
            <Checklist
              activityId={activity.id}
              items={checklistItems}
              canEdit={canEdit}
            />
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="bg-white rounded-lg border p-6">
            {activity.rich_notes ? (
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {activity.rich_notes}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Nenhuma nota adicionada</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="bg-white rounded-lg border p-6">
            <ActivityHistoryLog history={history} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
