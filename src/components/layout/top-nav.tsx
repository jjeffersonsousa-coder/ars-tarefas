'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ListTodo, Building2, Users2, Tag, Settings2, Zap, CalendarDays, Layers } from 'lucide-react'
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
  { href: '/dashboard',   label: 'Dashboard',     icon: LayoutDashboard, color: '#1B98E0' },
  { href: '/activities',  label: 'Atividades',    icon: ListTodo,        color: '#1ABC9C' },
  { href: '/calendar',    label: 'Calendário',    icon: CalendarDays,    color: '#2ECC71' },
  { href: '/departments', label: 'Departamentos', icon: Layers,          color: '#9B59B6' },
  { href: '/entities',    label: 'Entidades',     icon: Building2,       color: '#E67E22' },
  { href: '/users',       label: 'Usuários',      icon: Users2,          color: '#E74C3C' },
  { href: '/tags',        label: 'Etiquetas',     icon: Tag,             color: '#F1C40F' },
  { href: '/settings',    label: 'Configurações', icon: Settings2,       color: '#95A5A6' },
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
    <header style={{ height: '56px', background: '#13293D', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px', flexShrink: 0, zIndex: 30 }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'linear-gradient(135deg, #1B98E0, #006494)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(27,152,224,0.35)' }}>
          <Zap style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <span style={{ color: 'white', fontWeight: 800, fontSize: '14px' }} className="hidden sm:block">ARS</span>
      </div>

      {/* Nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, overflowX: 'auto' }}>
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
                whiteSpace: 'nowrap', textDecoration: 'none', transition: 'all 0.15s',
                background: isActive ? `rgba(${item.color === '#1B98E0' ? '27,152,224' : item.color === '#1ABC9C' ? '26,188,156' : item.color === '#2ECC71' ? '46,204,113' : item.color === '#9B59B6' ? '155,89,182' : item.color === '#E67E22' ? '230,126,34' : item.color === '#E74C3C' ? '231,76,60' : item.color === '#F1C40F' ? '241,196,15' : '149,165,166'},0.2)` : 'transparent',
                color: isActive ? item.color : 'rgba(255,255,255,0.45)',
              }}
            >
              <Icon style={{ width: '14px', height: '14px', color: item.color }} />
              <span className="hidden md:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <HelpMenu />
        <NotificationSetup />
        <NotificationBell userId={user.id} />
        <LayoutToggle menuStyle={menuStyle} onMenuStyleChange={onMenuStyleChange} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '10px', background: 'transparent', border: 'none', cursor: 'pointer' }}
              className="hover:bg-white/5 transition-colors">
              <Avatar className="h-7 w-7 ring-2 ring-blue-400/40">
                {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
                <AvatarFallback style={{ background: 'linear-gradient(135deg, #1B98E0, #006494)', color: 'white', fontSize: '11px', fontWeight: 600 }}>
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 500 }} className="hidden sm:block">{user.full_name.split(' ')[0]}</span>
              <ChevronDown style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.4)' }} className="hidden sm:block" />
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
