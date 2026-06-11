'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ActivityFilters, Tag, UserProfile, Priority, ActivityStatus } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityFiltersProps {
  filters: ActivityFilters
  onChange: (filters: ActivityFilters) => void
  entityId?: string
}

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'urgente', label: 'Urgente' },
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]

const statusOptions: { value: ActivityStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
]

export function ActivityFiltersBar({ filters, onChange, entityId }: ActivityFiltersProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (entityId) {
      supabase
        .from('tags')
        .select('*')
        .eq('entity_id', entityId)
        .then(({ data }) => data && setTags(data as Tag[]))

      supabase
        .from('user_profiles')
        .select('*')
        .eq('entity_id', entityId)
        .then(({ data }) => data && setUsers(data as UserProfile[]))
    }
  }, [entityId])

  function toggleTag(tagId: string) {
    const current = filters.tag_ids || []
    const updated = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId]
    onChange({ ...filters, tag_ids: updated })
  }

  function toggleStatus(status: ActivityStatus) {
    const current = filters.status || []
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    onChange({ ...filters, status: updated })
  }

  function togglePriority(priority: Priority) {
    const current = filters.priority || []
    const updated = current.includes(priority)
      ? current.filter((p) => p !== priority)
      : [...current, priority]
    onChange({ ...filters, priority: updated })
  }

  function clearFilters() {
    onChange({})
  }

  const hasFilters =
    filters.search ||
    filters.context ||
    filters.responsible_id ||
    (filters.tag_ids && filters.tag_ids.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    (filters.priority && filters.priority.length > 0) ||
    filters.due_date_from ||
    filters.due_date_to

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar atividades..."
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(showAdvanced && 'bg-indigo-50 border-indigo-200 text-indigo-700')}
        >
          <Filter className="h-4 w-4 mr-1" />
          Filtros
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Contexto</label>
            <Input
              placeholder="Filtrar por contexto..."
              value={filters.context || ''}
              onChange={(e) => onChange({ ...filters, context: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Responsável</label>
            <Select
              value={filters.responsible_id || 'all'}
              onValueChange={(v) => onChange({ ...filters, responsible_id: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Vencimento de</label>
            <Input
              type="date"
              value={filters.due_date_from || ''}
              onChange={(e) => onChange({ ...filters, due_date_from: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Vencimento até</label>
            <Input
              type="date"
              value={filters.due_date_to || ''}
              onChange={(e) => onChange({ ...filters, due_date_to: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <div className="flex flex-wrap gap-1">
              {statusOptions.map((s) => (
                <button
                  key={s.value}
                  onClick={() => toggleStatus(s.value)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                    filters.status?.includes(s.value)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Prioridade</label>
            <div className="flex flex-wrap gap-1">
              {priorityOptions.map((p) => (
                <button
                  key={p.value}
                  onClick={() => togglePriority(p.value)}
                  className={cn(
                    'text-xs px-2.5 py-1 rounded-full border transition-colors',
                    filters.priority?.includes(p.value)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-xs font-medium text-gray-600 mb-1 block">Etiquetas</label>
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full border transition-colors',
                      filters.tag_ids?.includes(tag.id)
                        ? 'text-white border-transparent'
                        : 'bg-white text-gray-600 border-gray-200'
                    )}
                    style={
                      filters.tag_ids?.includes(tag.id)
                        ? { backgroundColor: tag.color, borderColor: tag.color }
                        : {}
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
