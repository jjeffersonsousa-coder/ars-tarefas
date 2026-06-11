'use client'

import { UserProfile } from '@/lib/types'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { NotificationSetup } from '@/components/notifications/notification-setup'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  visualizador: 'Visualizador',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-violet-100 text-violet-700 border-violet-200',
  editor: 'bg-blue-100 text-blue-700 border-blue-200',
  visualizador: 'bg-gray-100 text-gray-700 border-gray-200',
}

interface HeaderProps {
  user: UserProfile
}

export function Header({ user }: HeaderProps) {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="h-16 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div className="lg:hidden w-10" />
      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <NotificationSetup />
        <NotificationBell userId={user.id} />

        <div className="w-px h-6 bg-gray-200" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2">
              <Avatar className="h-8 w-8 ring-2 ring-violet-100">
                {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs font-semibold">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900 leading-none">{user.full_name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-xl border-gray-100 p-1">
            <DropdownMenuLabel className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-violet-100">
                  {user.avatar_url && <AvatarImage src={user.avatar_url} alt={user.full_name} />}
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-semibold">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <Badge className={`mt-1 text-[10px] border ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer px-3 py-2">
              <Link href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-xl cursor-pointer px-3 py-2 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
