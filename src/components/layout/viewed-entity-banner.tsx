'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowLeft, Eye } from 'lucide-react'
import { getViewedEntity, clearViewedEntity, ViewedEntity } from '@/lib/viewed-entity'

export function ViewedEntityBanner() {
  const [entity, setEntity] = useState<ViewedEntity | null>(null)
  const router = useRouter()

  useEffect(() => {
    setEntity(getViewedEntity())
  }, [])

  if (!entity) return null

  function handleExit() {
    clearViewedEntity()
    window.location.href = '/admin'
  }

  return (
    <div className="w-full flex items-center justify-between px-4 py-2.5 gap-3 shrink-0"
      style={{ background: 'linear-gradient(90deg, #4338ca, #6366f1)', borderBottom: '1px solid #4338ca' }}>
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
          <Eye className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex items-center gap-2 text-white">
          <span className="text-xs font-medium text-indigo-200">Visualizando empresa:</span>
          <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-0.5 rounded-full">
            <Building2 className="h-3 w-3 text-white" />
            <span className="text-sm font-bold text-white">{entity.name}</span>
          </div>
          <span className="text-xs text-indigo-200 hidden sm:block">— Todas as ações afetam apenas esta empresa</span>
        </div>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao Super Admin
      </button>
    </div>
  )
}
