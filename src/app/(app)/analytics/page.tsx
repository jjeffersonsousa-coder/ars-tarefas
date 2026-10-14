'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Activity, UserProfile, Department } from '@/lib/types'
import { BarChart2, Layers, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
)

type Period = 'month' | 'week' | 'year'

const PERIOD_LABELS: Record<Period, string> = { month: 'Mês', week: 'Semana', year: 'Ano' }
const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function getPeriodRange(period: Period, offset: number): { from: Date; to: Date } {
  const now = new Date()
  if (period === 'week') {
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1 + offset * 7); mon.setHours(0,0,0,0)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
    return { from: mon, to: sun }
  }
  if (period === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59)
    return { from, to }
  }
  const y = now.getFullYear() + offset
  return { from: new Date(y, 0, 1), to: new Date(y, 11, 31, 23, 59, 59) }
}

function getPeriodLabel(period: Period, offset: number): string {
  if (offset === 0) return PERIOD_LABELS[period]
  const now = new Date()
  if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
  }
  if (period === 'week') {
    const pad = (n: number) => String(n).padStart(2,'0')
    const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1 + offset * 7)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return `${pad(mon.getDate())}/${pad(mon.getMonth()+1)} – ${pad(sun.getDate())}/${pad(sun.getMonth()+1)}`
  }
  return String(now.getFullYear() + offset)
}

function toLocalDate(iso: string) {
  const d = new Date(iso)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function formatDay(d: Date) {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
}

export default function AnalyticsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState('all')
  const [period, setPeriod] = useState<Period>('month')
  const [periodOffset, setPeriodOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const entityIdRef = useState<string | null>(null)

  async function fetchActivities(entityId: string) {
    let query = (supabase as any).from('activities').select('*')
    if (entityId) query = query.eq('entity_id', entityId)
    const { data } = await query
    if (data) setActivities(data as Activity[])
  }

  async function handleRefresh() {
    if (!entityIdRef[0]) return
    setRefreshing(true)
    await fetchActivities(entityIdRef[0])
    setRefreshing(false)
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (!p) { router.replace('/login'); return }
      setProfile(p as UserProfile)

      const effectiveEntityId = (p as any).viewing_entity_id ?? p.entity_id
      entityIdRef[1](effectiveEntityId ?? null)
      await fetchActivities(effectiveEntityId)

      if (effectiveEntityId) {
        const { data: depts } = await (supabase as any)
          .from('departments').select('*').eq('entity_id', effectiveEntityId).order('name')
        setDepartments(depts ?? [])
      }
      setLoading(false)
    }
    init()

    function onFocus() { if (entityIdRef[0]) fetchActivities(entityIdRef[0]) }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const filtered = useMemo(() => {
    const { from, to } = getPeriodRange(period, periodOffset)
    return activities.filter(a => {
      if (!a.due_date) return false
      const d = toLocalDate(a.due_date)
      if (d < from || d > to) return false
      if (selectedDept !== 'all' && a.department_id !== selectedDept) return false
      return true
    })
  }, [activities, period, periodOffset, selectedDept])

  const { labels, concluidas, pendentes, cumulative } = useMemo(() => {
    const { from: start, to: periodEnd } = getPeriodRange(period, periodOffset)
    const end = periodOffset === 0 ? new Date() : periodEnd
    const days: Date[] = []
    const cur = new Date(start)
    while (cur <= end) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1) }

    const labels = days.map(formatDay)
    const concluidas = days.map(d =>
      filtered.filter(a => {
        if (a.status !== 'concluida' || !a.due_date) return false
        const dd = toLocalDate(a.due_date)
        return dd.getTime() === d.getTime()
      }).length
    )
    const pendentes = days.map(d =>
      filtered.filter(a => {
        if (a.status === 'concluida' || a.status === 'cancelada' || !a.due_date) return false
        const dd = toLocalDate(a.due_date)
        return dd.getTime() === d.getTime()
      }).length
    )
    const cumulative = concluidas.reduce((acc: number[], v, i) => [...acc, (acc[i-1] ?? 0) + v], [])

    return { labels, concluidas, pendentes, cumulative }
  }, [filtered, period, periodOffset])

  const byPriority = useMemo(() => ({
    urgente: filtered.filter(a => a.priority === 'urgente').length,
    alta: filtered.filter(a => a.priority === 'alta').length,
    media: filtered.filter(a => a.priority === 'media').length,
    baixa: filtered.filter(a => a.priority === 'baixa').length,
  }), [filtered])

  const total = filtered.length
  const done = filtered.filter(a => a.status === 'concluida').length
  const pending = filtered.filter(a => a.status !== 'concluida' && a.status !== 'cancelada').length
  const rate = total > 0 ? Math.round((done / total) * 100) : 0

  const gridColor = 'rgba(120,120,120,0.12)'
  const tickColor = '#888'

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, maxTicksLimit: 15, maxRotation: 0 } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 }, stepSize: 1 }, beginAtZero: true },
    },
  }

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 8 } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, beginAtZero: true },
    },
  }

  const prioOptions = {
    indexAxis: 'y' as const,
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } }, beginAtZero: true },
      y: { grid: { display: false }, ticks: { color: tickColor, font: { size: 12 } } },
    },
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-indigo-600 shrink-0" />
            Análise de Atividades
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {departments.length > 0 && (
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger className="h-9 text-sm w-44 bg-white">
                <Layers className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg border bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>
          {/* Period selector + navigation — same style as Dashboard */}
          <div className="flex items-center bg-white border rounded-xl overflow-hidden shadow-sm">
            {(['month','week','year'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => { setPeriod(p); setPeriodOffset(0) }}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors border-r last:border-r-0',
                  period === p ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
            <div className="flex items-center border-l">
              <button
                onClick={() => setPeriodOffset(o => o - 1)}
                className="px-2 py-2 text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[80px] text-center">
                {getPeriodLabel(period, periodOffset)}
              </span>
              <button
                onClick={() => setPeriodOffset(o => o + 1)}
                disabled={periodOffset >= 0}
                className={cn('px-2 py-2 transition-colors',
                  periodOffset < 0 ? 'text-gray-500 hover:bg-gray-50 hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total no período', value: total, color: 'text-gray-900' },
          { label: 'Concluídas', value: done, color: 'text-green-600' },
          { label: 'Pendentes', value: pending, color: 'text-orange-500' },
          { label: 'Taxa de conclusão', value: `${rate}%`, color: 'text-gray-900' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
            <p className={cn('text-2xl font-semibold', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Main bar chart */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <p className="text-sm font-medium text-gray-700">Concluídas vs pendentes por dia</p>
          <div className="flex gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Concluídas</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" />Pendentes</span>
          </div>
        </div>
        <div style={{ position: 'relative', height: '240px' }}>
          <Bar
            data={{
              labels,
              datasets: [
                { label: 'Concluídas', data: concluidas, backgroundColor: '#22c55e', borderRadius: 4, barPercentage: 0.6 },
                { label: 'Pendentes',  data: pendentes,  backgroundColor: '#6366f1', borderRadius: 4, barPercentage: 0.6 },
              ],
            }}
            options={barOptions}
          />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-medium text-gray-700 mb-4">Progresso acumulado</p>
          <div style={{ position: 'relative', height: '180px' }}>
            <Line
              data={{
                labels,
                datasets: [{
                  label: 'Acumulado',
                  data: cumulative,
                  borderColor: '#22c55e',
                  backgroundColor: 'rgba(34,197,94,0.08)',
                  borderWidth: 2,
                  pointRadius: 2,
                  fill: true,
                  tension: 0.3,
                }],
              }}
              options={lineOptions}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <p className="text-sm font-medium text-gray-700 mb-4">Distribuição por prioridade</p>
          <div style={{ position: 'relative', height: '180px' }}>
            <Bar
              data={{
                labels: ['Urgente','Alta','Média','Baixa'],
                datasets: [{
                  data: [byPriority.urgente, byPriority.alta, byPriority.media, byPriority.baixa],
                  backgroundColor: ['#ef4444','#f97316','#eab308','#22c55e'],
                  borderRadius: 4,
                }],
              }}
              options={prioOptions}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
