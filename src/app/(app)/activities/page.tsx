'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, ActivityFilters, UserProfile } from '@/lib/types'
import { ActivityFiltersBar } from '@/components/activities/activity-filters'
import { ActivityCard } from '@/components/activities/activity-card'
import { ActivityKanban } from '@/components/activities/activity-kanban'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, LayoutList, KanbanSquare, ArrowUpDown, Upload, Loader2, FileSpreadsheet, FileText } from 'lucide-react'
import Link from 'next/link'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { nextRecurrenceDate, buildNextOccurrence } from '@/lib/recurrence'

type SortKey = 'created_at' | 'due_date' | 'priority' | 'title'
type ViewMode = 'list' | 'kanban'

const PRIORITY_ORDER: Record<string, number> = { urgente: 0, alta: 1, media: 2, baixa: 3 }

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [filters, setFilters] = useState<ActivityFilters>({})
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userDeptIds, setUserDeptIds] = useState<string[] | null>(null) // null = not loaded yet
  const [view, setView] = useState<ViewMode>('list')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickSaving, setQuickSaving] = useState(false)
  const quickRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // On load: recover any recurring activities that were concluded but whose next
  // occurrence was never generated (e.g. completed before this feature was deployed,
  // or a network failure during the insert).
  const recoverMissingRecurrences = useCallback(async (entityId: string) => {
    const today = new Date().toISOString().split('T')[0] // "2026-06-16"
    const todayEnd = today + 'T23:59:59'

    const { data: concluded } = await (supabase as any)
      .from('activities')
      .select('*')
      .eq('entity_id', entityId)
      .eq('is_recurring', true)
      .eq('status', 'concluida')
      .lt('due_date', todayEnd) // works with both date and timestamp columns

    if (!concluded?.length) return

    for (const act of concluded as Activity[]) {
      const nextDate = nextRecurrenceDate(act)
      if (!nextDate) continue

      const { data: existing } = await (supabase as any)
        .from('activities')
        .select('id')
        .eq('entity_id', act.entity_id)
        .eq('title', act.title)
        .eq('is_recurring', true)
        .gte('due_date', today)
        .limit(1)

      if (existing?.length) continue

      const payload = buildNextOccurrence(act, nextDate)
      await (supabase as any).from('activities').insert(payload)
    }
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('user_profiles').select('*').eq('id', data.user.id).single()
        .then(async ({ data: p }) => {
          if (!p) return
          setProfile(p as UserProfile)
          const role = (p as UserProfile).role
          if ((p as UserProfile).entity_id) {
            await recoverMissingRecurrences((p as UserProfile).entity_id!)
          }
          if (role === 'super_admin' || role === 'admin') {
            setUserDeptIds([]) // empty = no filter (see all)
          } else {
            const { data: depts } = await (supabase as any)
              .from('user_departments').select('department_id').eq('user_id', data.user!.id)
            setUserDeptIds((depts ?? []).map((d: { department_id: string }) => d.department_id))
          }
        })
    })
  }, [recoverMissingRecurrences])

  const fetchActivities = useCallback(async () => {
    if (userDeptIds === null) return // wait until departments are loaded
    setLoading(true)
    let query = (supabase as any)
      .from('activities')
      .select(`*, responsible:responsible_id(id, full_name, avatar_url), delegated_to:delegated_to_id(id, full_name, avatar_url), activity_tags(tag_id, tags(*))`)

    // Department filter: admins see all; others see only their departments (no null dept_id)
    if (userDeptIds.length > 0) {
      query = query.in('department_id', userDeptIds)
    } else if (userDeptIds.length === 0 && profile && profile.role !== 'super_admin' && profile.role !== 'admin') {
      // User has no departments assigned — see nothing
      query = query.eq('id', 'no-match')
    }

    if (filters.search) query = query.ilike('title', `%${filters.search}%`)
    if (filters.context) query = query.ilike('context', `%${filters.context}%`)
    if (filters.responsible_id) query = query.eq('responsible_id', filters.responsible_id)
    if (filters.status?.length) query = query.in('status', filters.status)
    if (filters.priority?.length) query = query.in('priority', filters.priority)
    if (filters.due_date_from) query = query.gte('due_date', filters.due_date_from)
    if (filters.due_date_to) query = query.lte('due_date', filters.due_date_to + 'T23:59:59')

    query = query.order('created_at', { ascending: false })

    const { data } = await query
    if (data) {
      let mapped = data.map((a: Record<string, unknown>) => ({
        ...a,
        tags: ((a.activity_tags as Array<{ tags: unknown }>) || []).map((at) => at.tags).filter(Boolean),
      })) as Activity[]

      if (filters.tag_ids?.length) {
        mapped = mapped.filter((a) => a.tags?.some((t) => filters.tag_ids!.includes(t.id)))
      }

      // client-side sort
      mapped = mapped.sort((a, b) => {
        let cmp = 0
        if (sortKey === 'due_date') {
          cmp = (a.due_date || '9999') < (b.due_date || '9999') ? -1 : 1
        } else if (sortKey === 'priority') {
          cmp = (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
        } else if (sortKey === 'title') {
          cmp = a.title.localeCompare(b.title, 'pt-BR')
        } else {
          cmp = a.created_at < b.created_at ? -1 : 1
        }
        return sortAsc ? cmp : -cmp
      })

      setActivities(mapped)
    }
    setLoading(false)
  }, [filters, sortKey, sortAsc, userDeptIds, profile])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const canEdit = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'gestor' || profile?.role === 'editor'

  async function handleQuickCreate(e: React.KeyboardEvent) {
    if (e.key !== 'Enter' || !quickTitle.trim() || !profile) return
    setQuickSaving(true)
    const { error } = await (supabase as any).from('activities').insert({
      title: quickTitle.trim(),
      entity_id: profile.entity_id,
      department_id: profile.department_id || null,
      created_by: profile.id,
      status: 'pendente',
      priority: 'media',
      updated_at: new Date().toISOString(),
    })
    if (!error) {
      toast.success('Atividade criada!', { description: quickTitle.trim() })
      setQuickTitle('')
      fetchActivities()
    } else {
      toast.error('Erro ao criar atividade')
    }
    setQuickSaving(false)
  }

  const hasActiveFilters = filters.search || filters.context || filters.responsible_id ||
    filters.status?.length || filters.priority?.length || filters.due_date_from || filters.due_date_to || filters.tag_ids?.length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {loading ? '...' : `${activities.length} atividade${activities.length !== 1 ? 's' : ''} encontrada${activities.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 border-green-200 text-green-700 hover:bg-green-50"
            onClick={() => import('@/lib/export').then(m => m.exportToExcel(activities))}>
            <FileSpreadsheet className="h-3.5 w-3.5" />Excel
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-2 border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => import('@/lib/export').then(m => m.exportToPDF(activities))}>
            <FileText className="h-3.5 w-3.5" />PDF
          </Button>
          {canEdit && (
            <Button asChild variant="outline" size="sm" className="rounded-xl gap-2">
              <Link href="/activities/import">
                <Upload className="h-3.5 w-3.5" />
                Importar
              </Link>
            </Button>
          )}
          {canEdit && (
            <Button asChild className="rounded-xl" style={{ background: 'linear-gradient(135deg, #006494, #13293D)' }}>
              <Link href="/activities/new"><Plus className="h-4 w-4 mr-2" />Nova Atividade</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Quick create */}
      {canEdit && (
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm">
          <Plus className="h-4 w-4 text-gray-300 shrink-0" />
          <Input
            ref={quickRef}
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            onKeyDown={handleQuickCreate}
            placeholder="Criação rápida — Digite o título e pressione Enter..."
            className="border-0 shadow-none focus-visible:ring-0 p-0 text-sm"
            disabled={quickSaving}
          />
          {quickSaving && <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <ActivityFiltersBar filters={filters} onChange={setFilters} entityId={profile?.entity_id || undefined} />

        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-white rounded-xl border border-gray-200 px-3 py-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="border-0 shadow-none h-auto p-0 text-xs font-medium text-gray-600 w-28 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Mais recentes</SelectItem>
                <SelectItem value="due_date">Vencimento</SelectItem>
                <SelectItem value="priority">Prioridade</SelectItem>
                <SelectItem value="title">Título A-Z</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setSortAsc(v => !v)}
              className="text-xs text-gray-400 hover:text-gray-700 font-mono"
              title={sortAsc ? 'Crescente' : 'Decrescente'}
            >
              {sortAsc ? '↑' : '↓'}
            </button>
          </div>

          {/* View toggle */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1">
            <button
              onClick={() => setView('list')}
              className={cn('p-1.5 rounded-lg transition-colors', view === 'list' ? 'bg-blue-100 text-blue-800' : 'text-gray-400 hover:text-gray-600')}
              title="Lista"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn('p-1.5 rounded-lg transition-colors', view === 'kanban' ? 'bg-blue-100 text-blue-800' : 'text-gray-400 hover:text-gray-600')}
              title="Kanban"
            >
              <KanbanSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : activities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500">Nenhuma atividade encontrada</p>
          {hasActiveFilters && (
            <button onClick={() => setFilters({})} className="text-xs text-blue-700 underline mt-2">Limpar filtros</button>
          )}
          {canEdit && (
            <Button asChild size="sm" className="mt-4">
              <Link href="/activities/new"><Plus className="h-4 w-4 mr-1" />Criar primeira atividade</Link>
            </Button>
          )}
        </div>
      ) : view === 'kanban' ? (
        <ActivityKanban activities={activities} canEdit={canEdit} onUpdate={fetchActivities} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} canEdit={canEdit} onUpdate={fetchActivities} />
          ))}
        </div>
      )}
    </div>
  )
}
