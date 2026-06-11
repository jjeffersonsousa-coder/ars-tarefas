'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ListTodo,
  Building2,
  Users2,
  Tag,
  Settings2,
  LogOut,
  Menu,
  X,
  Zap,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activities', label: 'Atividades', icon: ListTodo },
  { href: '/calendar', label: 'Calendário', icon: CalendarDays },
  { href: '/entities', label: 'Entidades', icon: Building2 },
  { href: '/users', label: 'Usuários', icon: Users2 },
  { href: '/tags', label: 'Etiquetas', icon: Tag },
  { href: '/settings', label: 'Configurações', icon: Settings2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-900/30">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base tracking-tight">ARS</p>
            <p className="text-slate-400 text-[10px] leading-none">Atividades & Rotinas</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5">
        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold px-3 mb-3">Menu</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-900/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-500')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150 w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair da conta
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden lg:flex w-60 flex-col bg-[#0F1117] shrink-0 h-screen sticky top-0">
        <SidebarContent />
      </aside>

      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-[#0F1117] text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-60 bg-[#0F1117] h-full shadow-2xl">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
