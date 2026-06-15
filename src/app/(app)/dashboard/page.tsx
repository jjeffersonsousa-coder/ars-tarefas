'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Activity, ActivityFilters, DashboardStats, UserProfile } from '@/lib/types'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { ActivityChart } from '@/components/dashboard/activity-chart'
import { ActivityFiltersBar } from '@/components/activities/activity-filters'
import { ActivityCard } from '@/components/activities/activity-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, RefreshCw, AlertTriangle, Bell, CalendarDays, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { isOverdue, isDueToday, formatDate } from '@/lib/utils'
import { addDays, startOfDay, parseISO, isToday } from 'date-fns'
import { cn } from '@/lib/utils'

function SectionHeader({ icon: Icon, label, count, color }: { icon: React.ElementType; label: string; count: number; color: string }) {
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold text-sm', color)}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
      <span className="ml-auto bg-white/60 px-2 py-0.5 rounded-full text-xs font-bold">{count}</span>
    </div>
  )
}

type Period = 'today' | 'week' | 'month' | 'year' | 'custom'

function getPeriodRange(period: Period, customFrom: string, customTo: string): { from: string; to: string } | null {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (period === 'today') { const t = fmt(now); return { from: t, to: t } }
  if (period === 'week') {
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { from: fmt(mon), to: fmt(sun) }
  }
  if (period === 'month') {
    const from = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { from, to: fmt(last) }
  }
  if (period === 'year') {
    return { from: `${now.getFullYear()}-01-01`, to: `${now.getFullYear()}-12-31` }
  }
  if (period === 'custom' && customFrom && customTo) return { from: customFrom, to: customTo }
  return null
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje', week: 'Semana', month: 'Mês', year: 'Ano', custom: 'Período'
}

export default function DashboardPage() {
  const [allActivities, setAllActivities] = useState<Activity[]>([])
  const [filters, setFilters] = useState<ActivityFilters>({})
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userDeptIds, setUserDeptIds] = useState<string[] | null>(null)
  const [period, setPeriod] = useState<Period>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      supabase.from('user_profiles').select('*').eq('id', data.user.id).single()
        .then(async ({ data: p }) => {
          if (!p) return
          setProfile(p as UserProfile)
          const role = (p as UserProfile).role
          if (role === 'super_admin' || role === 'admin') {
            setUserDeptIds([])
          } else {
            const { data: depts } = await (supabase as any)
              .from('user_departments').select('department_id').eq('user_id', data.user!.id)
            setUserDeptIds((depts ?? []).map((d: { department_id: string }) => d.department_id))
          }
        })
    })
  }, [])

  const fetchActivities = useCallback(async () => {
    if (userDeptIds === null) return
    setLoading(true)
    let activitiesQuery = (supabase as any)
      .from('activities')
      .select(`*, responsible:responsible_id(id, full_name, avatar_url), delegated_to:delegated_to_id(id, full_name, avatar_url), activity_tags(tag_id, tags(*))`)

    if (userDeptIds.length > 0) {
      activitiesQuery = activitiesQuery.in('department_id', userDeptIds)
    } else if (userDeptIds.length === 0 && profile && profile.role !== 'super_admin' && profile.role !== 'admin') {
      activitiesQuery = activitiesQuery.eq('id', 'no-match')
    }

    activitiesQuery = activitiesQuery.order('due_date', { ascending: true, nullsFirst: false })
    const { data } = await activitiesQuery

    if (data) {
      setAllActivities(data.map((a: Record<string, unknown>) => ({
        ...a,
        tags: ((a.activity_tags as Array<{ tags: unknown }>) || []).map((at) => at.tags).filter(Boolean),
      })) as Activity[])
    }
    setLoading(false)
  }, [userDeptIds, profile])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  const periodActivities = useMemo(() => {
    const range = getPeriodRange(period, customFrom, customTo)
    if (!range) return allActivities
    return allActivities.filter((a) => {
      const date = a.due_date || a.created_at
      if (!date) return false
      const d = date.slice(0, 10)
      return d >= range.from && d <= range.to
    })
  }, [allActivities, period, customFrom, customTo])

  const stats: DashboardStats = useMemo(() => ({
    total: periodActivities.length,
    overdue: periodActivities.filter((a) => isOverdue(a.due_date) && a.status !== 'concluida' && a.status !== 'cancelada').length,
    dueToday: periodActivities.filter((a) => isDueToday(a.due_date)).length,
    inProgress: periodActivities.filter((a) => a.status === 'em_andamento').length,
    completed: periodActivities.filter((a) => a.status === 'concluida').length,
    pending: periodActivities.filter((a) => a.status === 'pendente').length,
  }), [periodActivities])

  // Seções especiais
  const followUpToday = useMemo(() =>
    allActivities.filter((a) => a.follow_up_date && isToday(parseISO(a.follow_up_date)) && a.status !== 'concluida' && a.status !== 'cancelada'),
    [allActivities])

  const overdueList = useMemo(() =>
    allActivities.filter((a) => isOverdue(a.due_date) && a.status !== 'concluida' && a.status !== 'cancelada'),
    [allActivities])

  const next7Days = useMemo(() => {
    const today = startOfDay(new Date())
    const in7 = addDays(today, 7)
    return allActivities.filter((a) => {
      if (!a.due_date) return false
      const d = parseISO(a.due_date)
      return d >= today && d <= in7 && a.status !== 'concluida' && a.status !== 'cancelada'
    })
  }, [allActivities])

  // Lista filtrada para a seção geral
  const filteredActivities = useMemo(() => {
    let list = periodActivities
    if (activeStatFilter === 'overdue') list = list.filter((a) => isOverdue(a.due_date) && a.status !== 'concluida' && a.status !== 'cancelada')
    else if (activeStatFilter === 'dueToday') list = list.filter((a) => isDueToday(a.due_date))
    else if (activeStatFilter === 'inProgress') list = list.filter((a) => a.status === 'em_andamento')
    else if (activeStatFilter === 'completed') list = list.filter((a) => a.status === 'concluida')
    else if (activeStatFilter === 'pending') list = list.filter((a) => a.status === 'pendente')
    if (filters.search) list = list.filter((a) => a.title.toLowerCase().includes(filters.search!.toLowerCase()))
    if (filters.context) list = list.filter((a) => a.context?.toLowerCase().includes(filters.context!.toLowerCase()))
    if (filters.responsible_id) list = list.filter((a) => a.responsible_id === filters.responsible_id)
    if (filters.status?.length) list = list.filter((a) => filters.status!.includes(a.status))
    if (filters.priority?.length) list = list.filter((a) => filters.priority!.includes(a.priority))
    if (filters.due_date_from) list = list.filter((a) => a.due_date && a.due_date >= filters.due_date_from!)
    if (filters.due_date_to) list = list.filter((a) => a.due_date && a.due_date <= filters.due_date_to! + 'T23:59:59')
    if (filters.tag_ids?.length) list = list.filter((a) => a.tags?.some((t) => filters.tag_ids!.includes(t.id)))
    return list
  }, [allActivities, activeStatFilter, filters])

  const canEdit = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'gestor' || profile?.role === 'editor'
  const hasFilters = activeStatFilter || Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Visão geral das suas atividades</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period filter */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 gap-0.5">
            {(['today','week','month','year','custom'] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={period === p ? { background: '#006494', color: 'white' } : { color: '#6B7280' }}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchActivities} className="rounded-xl gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          {canEdit && (
            <Button asChild className="rounded-xl" style={{ background: 'linear-gradient(135deg, #006494, #13293D)' }}>
              <Link href="/activities/new"><Plus className="h-4 w-4 mr-2" />Nova Atividade</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Custom date range */}
      {period === 'custom' && (
        <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
          <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-500 shrink-0">De</span>
          <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-8 rounded-lg w-36 text-sm" />
          <span className="text-sm text-gray-500 shrink-0">até</span>
          <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-8 rounded-lg w-36 text-sm" />
          {customFrom && customTo && (
            <span className="text-xs text-gray-400 ml-auto">
              {periodActivities.length} atividade{periodActivities.length !== 1 ? 's' : ''} no período
            </span>
          )}
        </div>
      )}

      <StatsCards stats={stats} activeFilter={activeStatFilter} onFilter={(k) => { setActiveStatFilter(k); setFilters({}) }} />

      {/* Seções especiais — só aparecem quando não há filtro ativo */}
      {!hasFilters && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Retornos de hoje */}
          <div className="space-y-2">
            <SectionHeader icon={Bell} label="Retornos de Hoje" count={followUpToday.length} color="bg-amber-50 border-amber-200 text-amber-700" />
            {loading ? <Skeleton className="h-24 w-full rounded-xl" /> : followUpToday.length === 0 ? (
              <p className="text-xs text-gray-400 px-2">Nenhum retorno para hoje</p>
            ) : followUpToday.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/activities/${a.id}`} className="block bg-white rounded-xl border border-amber-100 px-4 py-3 hover:shadow-sm transition-shadow">
                <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                <p className="text-xs text-amber-600 mt-0.5">Follow-up: {formatDate(a.follow_up_date)}</p>
              </Link>
            ))}
          </div>

          {/* Vencidas */}
          <div className="space-y-2">
            <SectionHeader icon={AlertTriangle} label="Vencidas" count={overdueList.length} color="bg-red-50 border-red-200 text-red-700" />
            {loading ? <Skeleton className="h-24 w-full rounded-xl" /> : overdueList.length === 0 ? (
              <p className="text-xs text-gray-400 px-2">Nenhuma atividade vencida 🎉</p>
            ) : overdueList.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/activities/${a.id}`} className="block bg-white rounded-xl border border-red-100 px-4 py-3 hover:shadow-sm transition-shadow">
                <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                <p className="text-xs text-red-500 mt-0.5">Venceu: {formatDate(a.due_date)}</p>
              </Link>
            ))}
          </div>

          {/* Próximos 7 dias */}
          <div className="space-y-2">
            <SectionHeader icon={CalendarDays} label="Próximos 7 Dias" count={next7Days.length} color="bg-blue-50 border-blue-200 text-blue-700" />
            {loading ? <Skeleton className="h-24 w-full rounded-xl" /> : next7Days.length === 0 ? (
              <p className="text-xs text-gray-400 px-2">Nenhuma atividade nos próximos 7 dias</p>
            ) : next7Days.slice(0, 4).map((a) => (
              <Link key={a.id} href={`/activities/${a.id}`} className="block bg-white rounded-xl border border-blue-100 px-4 py-3 hover:shadow-sm transition-shadow">
                <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                <p className="text-xs text-blue-500 mt-0.5">Vence: {formatDate(a.due_date)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico + lista filtrada */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ActivityChart stats={stats} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          {activeStatFilter && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Filtrando:</span>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium text-xs">
                {activeStatFilter === 'total' ? 'Todas' : activeStatFilter === 'overdue' ? 'Vencidas' : activeStatFilter === 'dueToday' ? 'Vencem Hoje' : activeStatFilter === 'inProgress' ? 'Em Andamento' : activeStatFilter === 'completed' ? 'Concluídas' : 'Pendentes'}
              </span>
              <button onClick={() => setActiveStatFilter(null)} className="text-gray-400 hover:text-gray-600 text-xs underline">limpar</button>
            </div>
          )}
          <ActivityFiltersBar filters={filters} onChange={setFilters} entityId={profile?.entity_id || undefined} />
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
          ) : filteredActivities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <p className="text-gray-500 text-sm">Nenhuma atividade encontrada</p>
              {canEdit && <Button asChild size="sm" className="mt-3"><Link href="/activities/new"><Plus className="h-4 w-4 mr-1" />Criar atividade</Link></Button>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((a) => <ActivityCard key={a.id} activity={a} canEdit={canEdit} onUpdate={fetchActivities} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
