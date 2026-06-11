import { Sidebar } from './sidebar'
import { Header } from './header'
import { UserProfile } from '@/lib/types'

interface AppLayoutProps {
  children: React.ReactNode
  user: UserProfile
}

export function AppLayout({ children, user }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FC]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
