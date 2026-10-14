'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Zap, Clock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PendingApprovalPage() {
  const supabase = createClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #13293D 0%, #006494 50%, #247BA0 100%)' }}
    >
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #1B98E0, #006494)', boxShadow: '0 8px 24px rgba(27,152,224,0.4)' }}>
          <Zap className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">ARS</h1>
        <p className="text-sm mb-8" style={{ color: '#7EC8E3' }}>Gerenciamento de Atividades e Rotinas</p>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-5">
            <Clock className="h-8 w-8 text-blue-500" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-3">Conta aguardando aprovação</h2>

          <p className="text-gray-600 leading-relaxed mb-2">
            Sua conta foi criada com sucesso!
          </p>
          <p className="text-gray-600 leading-relaxed mb-6">
            Um <strong>administrador</strong> precisa aprovar seu acesso antes que você possa entrar no sistema. Você receberá uma notificação quando for aprovado.
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
            <p className="font-semibold mb-0.5">Precisa de ajuda?</p>
            <p>jjeffersonsousa@gmail.com</p>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full rounded-xl gap-2 text-gray-600"
          >
            <LogOut className="h-4 w-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  )
}
