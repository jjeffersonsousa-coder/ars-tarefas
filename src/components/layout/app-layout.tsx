'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { TopNav } from './top-nav'
import { UserProfile } from '@/lib/types'
import { getMenuStyle, getSidebarCollapsed, type MenuStyle } from '@/lib/layout-preferences'

interface AppLayoutProps {
  children: React.ReactNode
  user: UserProfile
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [menuStyle, setMenuStyle] = useState<MenuStyle>('sidebar')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMenuStyle(getMenuStyle())
    setSidebarCollapsed(getSidebarCollapsed())
    setMounted(true)
  }, [])

  if (!mounted) return null

  if (menuStyle === 'topbar') {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#E8F1F2]">
        <TopNav user={user} menuStyle={menuStyle} onMenuStyleChange={setMenuStyle} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">{children}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#E8F1F2]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        userRole={user.role}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          user={user}
          menuStyle={menuStyle}
          onMenuStyleChange={setMenuStyle}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(v => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
