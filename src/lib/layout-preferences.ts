export type MenuStyle = 'sidebar' | 'topbar'

export function getMenuStyle(): MenuStyle {
  if (typeof window === 'undefined') return 'sidebar'
  return (localStorage.getItem('ars-menu-style') as MenuStyle) || 'sidebar'
}

export function setMenuStyle(style: MenuStyle) {
  localStorage.setItem('ars-menu-style', style)
}

export function getSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('ars-sidebar-collapsed') === 'true'
}

export function setSidebarCollapsed(collapsed: boolean) {
  localStorage.setItem('ars-sidebar-collapsed', String(collapsed))
}
