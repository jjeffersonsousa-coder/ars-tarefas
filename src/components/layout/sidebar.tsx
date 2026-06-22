'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ListTodo, Building2, Users2, Tag,
  Settings2, LogOut, Menu, X, Zap, CalendarDays,
  ChevronLeft, ChevronRight, Layers, ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { setSidebarCollapsed } from '@/lib/layout-preferences'

// Paleta Adventista: #13293D base, itens com cores vibrantes Flat UI
const navItems = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard, color: '#1B98E0', bg: 'rgba(27,152,224,0.18)' },
  { href: '/activities',   label: 'Atividades',    icon: ListTodo,        color: '#1ABC9C', bg: 'rgba(26,188,156,0.18)' },
  { href: '/calendar',     label: 'Calendário',    icon: CalendarDays,    color: '#2ECC71', bg: 'rgba(46,204,113,0.18)' },
  { href: '/departments',  label: 'Departamentos', icon: Layers,          color: '#9B59B6', bg: 'rgba(155,89,182,0.18)' },
  { href: '/entities',     label: 'Empresas',     icon: Building2,       color: '#E67E22', bg: 'rgba(230,126,34,0.18)'  },
  { href: '/users',        label: 'Usuários',      icon: Users2,          color: '#E74C3C', bg: 'rgba(231,76,60,0.18)'  },
  { href: '/tags',         label: 'Etiquetas',     icon: Tag,             color: '#F1C40F', bg: 'rgba(241,196,15,0.18)' },
  { href: '/settings',     label: 'Configurações', icon: Settings2,       color: '#95A5A6', bg: 'rgba(149,165,166,0.18)' },
]

// Prussian Blue sidebar
const SIDEBAR_BG = '#13293D'
const SIDEBAR_BORDER = 'rgba(255,255,255,0.08)'

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  userRole?: string
}

export function Sidebar({ collapsed = false, onToggleCollapse, userRole }: SidebarProps) {
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
    <div style={{ display: 'flex', height: '100%', flexDirection: 'column', position: 'relative' }}>
      {/* Toggle button desktop */}
      {!isMobile && (
        <button
          onClick={handleToggle}
          style={{
            position: 'absolute', right: '-12px', top: '24px', zIndex: 10,
            width: '24px', height: '24px', borderRadius: '50%',
            background: '#006494', color: 'white', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,100,148,0.4)',
          }}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      )}

      {/* Logo */}
      <div style={{
        display: 'flex', height: '64px', alignItems: 'center',
        borderBottom: `1px solid ${SIDEBAR_BORDER}`,
        padding: collapsed ? '0 12px' : '0 20px',
        justifyContent: collapsed ? 'center' : 'flex-start',
      }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #1B98E0, #006494)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(27,152,224,0.4)',
          }}>
            <Zap style={{ width: '18px', height: '18px', color: 'white' }} />
          </div>
          {!collapsed && (
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: '16px', margin: 0, letterSpacing: '-0.3px' }}>ARS</p>
              <p style={{ color: '#7BA7BC', fontSize: '10px', margin: 0, lineHeight: 1 }}>Atividades & Rotinas</p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '16px 8px' : '16px 10px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
        {!collapsed && (
          <p style={{ color: '#4A7890', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, padding: '0 10px', marginBottom: '8px' }}>Menu</p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: collapsed ? '10px' : '9px 12px',
                borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                transition: 'all 0.15s',
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: isActive ? item.bg : 'transparent',
                color: isActive ? item.color : 'rgba(255,255,255,0.45)',
              }}
              onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)' } }}
              onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' } }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? item.color : 'transparent',
                transition: 'all 0.15s',
              }}>
                <Icon style={{ width: '15px', height: '15px', color: isActive ? 'white' : item.color }} />
              </div>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Super Admin link */}
      {userRole === 'super_admin' && (
        <div style={{ padding: collapsed ? '4px 8px' : '4px 10px' }}>
          {!collapsed && (
            <p style={{ color: '#4A7890', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, padding: '0 10px', marginBottom: '6px' }}>Sistema</p>
          )}
          {(() => {
            const isActive = pathname === '/admin' || pathname.startsWith('/admin/')
            return (
              <Link href="/admin" onClick={() => setMobileOpen(false)} title={collapsed ? 'Super Admin' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: collapsed ? '10px' : '9px 12px',
                  borderRadius: '10px', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  background: isActive ? 'rgba(155,89,182,0.18)' : 'transparent',
                  color: isActive ? '#9B59B6' : 'rgba(255,255,255,0.45)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)' } }}
                onMouseLeave={(e) => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.45)' } }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? '#9B59B6' : 'transparent', transition: 'all 0.15s' }}>
                  <ShieldAlert style={{ width: '15px', height: '15px', color: isActive ? 'white' : '#9B59B6' }} />
                </div>
                {!collapsed && 'Super Admin'}
              </Link>
            )
          })()}
        </div>
      )}

      {/* Sign out */}
      <div style={{ borderTop: `1px solid ${SIDEBAR_BORDER}`, padding: collapsed ? '8px' : '12px' }}>
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sair' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: collapsed ? '10px' : '9px 12px',
            borderRadius: '10px', fontSize: '13px', fontWeight: 500,
            color: 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', cursor: 'pointer',
            width: '100%', justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(231,76,60,0.12)'; (e.currentTarget as HTMLElement).style.color = '#E74C3C' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)' }}
        >
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut style={{ width: '15px', height: '15px' }} />
          </div>
          {!collapsed && 'Sair da conta'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        style={{ background: SIDEBAR_BG }}
        className={cn(
          'hidden lg:flex flex-col shrink-0 h-screen sticky top-0 transition-all duration-300 relative',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile toggle */}
      <button
        style={{ background: SIDEBAR_BG }}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl text-white shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-64 h-full shadow-2xl" style={{ background: SIDEBAR_BG }}>
            <SidebarContent isMobile />
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
