'use client'

import { LayoutDashboard, PanelLeft } from 'lucide-react'
import { type MenuStyle, setMenuStyle } from '@/lib/layout-preferences'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface LayoutToggleProps {
  menuStyle: MenuStyle
  onMenuStyleChange: (s: MenuStyle) => void
}

export function LayoutToggle({ menuStyle, onMenuStyleChange }: LayoutToggleProps) {
  function toggle() {
    const next: MenuStyle = menuStyle === 'sidebar' ? 'topbar' : 'sidebar'
    setMenuStyle(next)
    onMenuStyleChange(next)
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border font-medium transition-all bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
          >
            {menuStyle === 'sidebar' ? <LayoutDashboard className="h-3.5 w-3.5" /> : <PanelLeft className="h-3.5 w-3.5" />}
            <span className="hidden sm:block">{menuStyle === 'sidebar' ? 'Menu Superior' : 'Menu Lateral'}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Alternar para {menuStyle === 'sidebar' ? 'menu superior' : 'menu lateral'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
