'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ListTodo, Building2, Users2, Tag,
  Settings2, LogOut, Menu, X, Zap, CalendarDays,
  ChevronLeft, ChevronRight, Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { setSidebarCollapsed } from '@/lib/layout-preferences'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activities', label: 'Atividades', icon: ListTodo },
  { href: '/calendar', label: 'Calendário', icon: CalendarDays },
  { href: '/departments', label: 'Departamentos', icon: Layers },
  { href: '/entities', label: 'Entidades', icon: Building2 },
  { href: '/users', label: 'Usuários', icon: Users2 },
  { href: '/tags', label: 'Etiquetas', icon: Tag },
  { href: '/settings', label: 'Configurações', icon: Settings2 },
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  function handleToggle() {
    setSidebarCollapsed(!collapsed)
    onToggleCollapse?.()
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex h-full flex-col relative">
      {/* Toggle button (desktop only) */}
      {!isMobile && (
        <button
          onClick={handleToggle}
          className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-blue-700 text-white flex items-center justify-center shadow-md hover:bg-blue-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      )}

      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-white/10 transition-all', collapsed ? 'px-3 justify-center' : 'px-5')}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-bold text-base tracking-tight">ARS</p>
              <p className="text-slate-400 text-[10px] leading-none">Atividades & Rotinas</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-5 space-y-0.5 transition-all', collapsed ? 'px-2' : 'px-3')}>
        {!collapsed && <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold px-3 mb-3">Menu</p>}
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
                isActive
                  ? 'bg-gradient-to-r from-blue-700 to-blue-700 text-white shadow-md shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className={cn('border-t border-white/10 transition-all', collapsed ? 'p-2' : 'p-3')}>
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'flex items-center gap-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 w-full',
            collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sair da conta'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-[#0F1117] shrink-0 h-screen sticky top-0 transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#0F1117] text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-60 bg-[#0F1117] h-full shadow-2xl">
            <SidebarContent isMobile />
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
