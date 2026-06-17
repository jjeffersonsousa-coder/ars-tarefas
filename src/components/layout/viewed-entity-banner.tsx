'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, X } from 'lucide-react'
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
    setEntity(null)
    router.push('/admin')
  }

  return (
    <div className="w-full bg-indigo-600 text-white text-sm flex items-center justify-between px-4 py-2 gap-3 z-50">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0" />
        <span>Visualizando painel de: <strong>{entity.name}</strong></span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-1.5 text-indigo-200 hover:text-white transition-colors text-xs font-medium"
      >
        <X className="h-3.5 w-3.5" />
        Sair da visualização
      </button>
    </div>
  )
}
