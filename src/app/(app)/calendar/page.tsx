'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Activity, UserProfile, PRIORITY_COLORS, STATUS_COLORS, STATUS_LABELS } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, X } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const PRIORITY_DOT: Record<string, string> = {
  urgente: 'bg-red-500',
  alta: 'bg-orange-400',
  media: 'bg-yellow-400',
  baixa: 'bg-green-400',
}

export default function CalendarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) setProfile(p as UserProfile)

      const { data } = await (supabase as any)
        .from('activities')
        .select('*, activity_tags(tag_id, tags(*))')
        .not('due_date', 'is', null)
        .order('due_date', { ascending: true })
      if (data) {
        setActivities(data.map((a: Record<string, unknown>) => ({
          ...a,
          tags: ((a.activity_tags as Array<{ tags: unknown }>) || []).map((at) => at.tags).filter(Boolean),
        })) as Activity[])
      }
      setLoading(false)
    }
    init()
  }, [])

  const canEdit = profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'gestor' || profile?.role === 'editor'

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const activitiesByDay = useMemo(() => {
    const map: Record<number, Activity[]> = {}
    for (const a of activities) {
      if (!a.due_date) continue
      const d = new Date(a.due_date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map[day]) map[day] = []
        map[day].push(a)
      }
    }
    return map
  }, [activities, year, month])

  const selectedActivities = selectedDay ? (activitiesByDay[selectedDay] || []) : []

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-blue-700" />
            Calendário
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Atividades organizadas por data de vencimento</p>
        </div>
        {canEdit && (
          <Button asChild className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-800 shadow-md shadow-blue-200 rounded-xl">
            <Link href="/activities/new"><Plus className="h-4 w-4 mr-2" />Nova Atividade</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-50">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white/80 transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">{MONTHS[month]}</h2>
              <p className="text-sm text-gray-500">{year}</p>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white/80 transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dayActivities = day ? (activitiesByDay[day] || []) : []
              const isSelected = day === selectedDay
              const isTod = day ? isToday(day) : false
              const hasOverdue = dayActivities.some(
                (a) => a.status !== 'concluida' && a.status !== 'cancelada' && new Date(a.due_date!) < today
              )

              return (
                <div
                  key={idx}
                  onClick={() => day && setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'min-h-[90px] p-2 border-b border-r border-gray-50 last:border-r-0',
                    idx % 7 === 6 && 'border-r-0',
                    day ? 'cursor-pointer hover:bg-blue-50/50 transition-colors' : 'bg-gray-50/30',
                    isSelected && 'bg-blue-50 ring-2 ring-inset ring-blue-300',
                  )}
                >
                  {day && (
                    <>
                      <div className={cn(
                        'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-1.5',
                        isTod ? 'bg-blue-700 text-white' : 'text-gray-700',
                        hasOverdue && !isTod && 'text-red-600',
                      )}>
                        {day}
                      </div>
                      <div className="space-y-0.5">
                        {dayActivities.slice(0, 3).map((a) => (
                          <div
                            key={a.id}
                            onClick={(e) => { e.stopPropagation(); router.push(`/activities/${a.id}`) }}
                            className={cn(
                              'text-[10px] leading-tight px-1.5 py-0.5 rounded font-medium truncate cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1',
                              a.status === 'concluida' ? 'bg-emerald-100 text-emerald-700' :
                              a.status === 'cancelada' ? 'bg-gray-100 text-gray-500 line-through' :
                              hasOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-800'
                            )}
                          >
                            <span className={cn('inline-block w-1.5 h-1.5 rounded-full flex-shrink-0', PRIORITY_DOT[a.priority])} />
                            <span className="truncate">{a.title}</span>
                          </div>
                        ))}
                        {dayActivities.length > 3 && (
                          <div className="text-[10px] text-gray-400 font-medium px-1">
                            +{dayActivities.length - 3} mais
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-5 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Prioridade:</span>
            {Object.entries(PRIORITY_DOT).map(([k, cls]) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
                <span className={cn('w-2 h-2 rounded-full', cls)} />
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </span>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="xl:col-span-1 space-y-4">
          {selectedDay ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-50">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">
                    {selectedDay} de {MONTHS[month]}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedActivities.length} atividade{selectedActivities.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg hover:bg-white/80">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {selectedActivities.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-gray-400">Nenhuma atividade</div>
                ) : selectedActivities.map((a) => (
                  <Link key={a.id} href={`/activities/${a.id}`} className="block px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2.5">
                      <span className={cn('mt-1 inline-block w-2 h-2 rounded-full flex-shrink-0', PRIORITY_DOT[a.priority])} />
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-semibold text-gray-800 truncate', a.status === 'cancelada' && 'line-through text-gray-400')}>
                          {a.title}
                        </p>
                        {a.context && <p className="text-xs text-gray-400 mt-0.5 truncate">{a.context}</p>}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium border', STATUS_COLORS[a.status])}>
                            {STATUS_LABELS[a.status]}
                          </span>
                          {a.due_date && (
                            <span className="text-[10px] text-gray-400">
                              {new Date(a.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500 text-center">Clique em um dia para ver as atividades</p>
            </div>
          )}

          {/* This month summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-gray-800 text-sm">Resumo do Mês</h3>
            {loading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />)}</div>
            ) : (
              <>
                {[
                  { label: 'Com atividades', value: Object.keys(activitiesByDay).length, color: 'text-blue-700' },
                  { label: 'Total de atividades', value: Object.values(activitiesByDay).reduce((s, a) => s + a.length, 0), color: 'text-gray-800' },
                  { label: 'Concluídas', value: Object.values(activitiesByDay).flat().filter(a => a.status === 'concluida').length, color: 'text-emerald-600' },
                  { label: 'Pendentes/Em andamento', value: Object.values(activitiesByDay).flat().filter(a => a.status === 'pendente' || a.status === 'em_andamento').length, color: 'text-amber-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={cn('font-bold', color)}>{value}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
