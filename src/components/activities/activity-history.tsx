import { ActivityHistory as ActivityHistoryType } from '@/lib/types'
import { formatDateTime, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock } from 'lucide-react'

interface ActivityHistoryProps {
  history: ActivityHistoryType[]
}

const fieldLabels: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  context: 'Contexto',
  responsible_id: 'Responsável',
  delegated_to_id: 'Delegado para',
  priority: 'Prioridade',
  status: 'Status',
  rich_notes: 'Notas',
  due_date: 'Vencimento',
  follow_up_date: 'Follow-up',
  created: 'Criação',
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  aguardando: 'Aguardando',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const priorityLabels: Record<string, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

function formatValue(field: string | null | undefined, value: string | null | undefined): string {
  if (!value) return '—'
  if (field === 'status') return statusLabels[value] || value
  if (field === 'priority') return priorityLabels[value] || value
  if (field === 'due_date' || field === 'follow_up_date') {
    try {
      return new Date(value).toLocaleDateString('pt-BR')
    } catch {
      return value
    }
  }
  return value
}

export function ActivityHistoryLog({ history }: ActivityHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        Nenhum histórico disponível
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => (
        <div key={entry.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            {entry.user ? (
              <Avatar className="h-7 w-7 shrink-0">
                {entry.user.avatar_url && <AvatarImage src={entry.user.avatar_url} />}
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                  {getInitials(entry.user.full_name)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
              </div>
            )}
            <div className="w-px flex-1 bg-gray-100 mt-1" />
          </div>
          <div className="pb-4 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-gray-900">
                {entry.user?.full_name || 'Sistema'}
              </span>
              <span className="text-xs text-gray-400">{formatDateTime(entry.created_at)}</span>
            </div>
            {entry.field_changed === 'created' ? (
              <p className="text-sm text-gray-600 mt-0.5">Atividade criada</p>
            ) : (
              <p className="text-sm text-gray-600 mt-0.5">
                Alterou{' '}
                <span className="font-medium text-gray-800">
                  {fieldLabels[entry.field_changed || ''] || entry.field_changed}
                </span>
                {entry.old_value && (
                  <>
                    {' '}
                    de{' '}
                    <span className="bg-red-50 text-red-700 px-1 rounded text-xs">
                      {formatValue(entry.field_changed, entry.old_value)}
                    </span>
                  </>
                )}
                {entry.new_value && (
                  <>
                    {' '}
                    para{' '}
                    <span className="bg-green-50 text-green-700 px-1 rounded text-xs">
                      {formatValue(entry.field_changed, entry.new_value)}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
