'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ListTodo, Building2, Users2, Tag, Settings2, Zap, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserProfile } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { NotificationSetup } from '@/components/notifications/notification-setup'
import { HelpMenu } from './help-menu'
import { LayoutToggle } from './layout-toggle'
import { type MenuStyle } from '@/lib/layout-preferences'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings, ChevronDown } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/activities', label: 'Atividades', icon: ListTodo },
  { href: '/calendar', label: 'Calendário', icon: CalendarDays },
  { href: '/entities', label: 'Entidades', icon: Building2 },
  { href: '/users', label: 'Usuários', icon: Users2 },
  { href: '/tags', label: 'Etiquetas', icon: Tag },
  { href: '/settings', label: 'Configurações', icon: Settings2 },
]

interface TopNavProps {
  user: UserProfile
  menuStyle: MenuStyle
  onMenuStyleChange: (s: MenuStyle) => void
}

export function TopNav({ user, menuStyle, onMenuStyleChange }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-14 bg-[#0F1117] border-b border-white/10 flex items-center px-4 gap-2 shrink-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-white font-bold text-sm hidden sm:block">ARS</span>
      </div>

      {/* Nav links */}
      <nav className="flex items-center gap-1 flex-1 overflow-x-auto">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
                isActive ? 'bg-blue-700 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden md:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <HelpMenu />
        <NotificationSetup />
        <NotificationBell userId={user.id} />
        <LayoutToggle menuStyle={menuStyle} onMenuStyleChange={onMenuStyleChange} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/5 transition-colors">
              <Avatar className="h-7 w-7 ring-2 ring-blue-600/40">
                {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-semibold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-white text-xs font-medium hidden sm:block">{user.full_name.split(' ')[0]}</span>
              <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuLabel className="text-xs">{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild><Link href="/settings" className="flex items-center gap-2 cursor-pointer"><Settings className="h-4 w-4" />Configurações</Link></DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer flex items-center gap-2">
              <LogOut className="h-4 w-4" />Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
