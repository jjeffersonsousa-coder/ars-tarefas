'use client'

import { DashboardStats } from '@/lib/types'
import { CheckCircle2, AlertTriangle, Clock3, Loader2, ListChecks, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: DashboardStats
  activeFilter?: string | null
  onFilter?: (key: string | null) => void
}

const cards = [
  {
    key: 'total',
    label: 'Total',
    icon: ListChecks,
    gradient: 'from-blue-600 to-blue-700',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    shadow: 'shadow-blue-100',
    ring: 'ring-blue-500',
  },
  {
    key: 'overdue',
    label: 'Vencidas',
    icon: AlertTriangle,
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-50',
    text: 'text-red-600',
    shadow: 'shadow-red-100',
    ring: 'ring-red-400',
  },
  {
    key: 'dueToday',
    label: 'Vencem Hoje',
    icon: Clock3,
    gradient: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    shadow: 'shadow-amber-100',
    ring: 'ring-amber-400',
  },
  {
    key: 'inProgress',
    label: 'Em Andamento',
    icon: Loader2,
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    shadow: 'shadow-blue-100',
    ring: 'ring-blue-400',
  },
  {
    key: 'completed',
    label: 'Concluídas',
    icon: CheckCircle2,
    gradient: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    shadow: 'shadow-emerald-100',
    ring: 'ring-emerald-400',
  },
  {
    key: 'pending',
    label: 'Pendentes',
    icon: CircleDot,
    gradient: 'from-slate-500 to-gray-600',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    shadow: 'shadow-slate-100',
    ring: 'ring-slate-400',
  },
]

export function StatsCards({ stats, activeFilter, onFilter }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        const value = stats[card.key as keyof DashboardStats]
        const isActive = activeFilter === card.key

        return (
          <button
            key={card.key}
            onClick={() => onFilter?.(isActive ? null : card.key)}
            className={cn(
              `bg-white rounded-2xl border p-5 shadow-sm text-left w-full transition-all duration-150`,
              card.shadow,
              isActive
                ? `ring-2 ${card.ring} border-transparent scale-[1.03]`
                : 'border-gray-100 hover:scale-[1.02] hover:shadow-md card-hover'
            )}
          >
            <div className={`inline-flex p-2.5 rounded-xl ${card.bg} mb-4`}>
              <Icon className={`h-5 w-5 ${card.text}`} />
            </div>
            <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-xs text-gray-500 mt-1.5 font-medium">{card.label}</p>
          </button>
        )
      })}
    </div>
  )
}
