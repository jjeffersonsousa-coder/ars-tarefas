'use client'

import { DashboardStats } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ActivityChartProps {
  stats: DashboardStats
}

export function ActivityChart({ stats }: ActivityChartProps) {
  const data = [
    { label: 'Pendente', value: stats.pending, color: '#9ca3af' },
    { label: 'Em Andamento', value: stats.inProgress, color: '#3b82f6' },
    { label: 'Concluída', value: stats.completed, color: '#22c55e' },
    { label: 'Vencidas', value: stats.overdue, color: '#ef4444' },
  ]

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-gray-700">
          Distribuição por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhuma atividade ainda</p>
        ) : (
          <div className="space-y-3">
            {data.map((item) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-800">
                      {item.value} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
