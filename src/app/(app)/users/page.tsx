'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, ROLE_LABELS } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { getInitials, formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p as UserProfile)
        const { data: us } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('entity_id', p.entity_id ?? '')
          .order('full_name')
        if (us) setUsers(us as UserProfile[])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function updateRole(userId: string, newRole: 'admin' | 'editor' | 'visualizador') {
    setUpdatingId(userId)
    await supabase.from('user_profiles').update({ role: newRole }).eq('id', userId)
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u))
    setUpdatingId(null)
  }

  const isAdmin = profile?.role === 'admin'

  const roleColors: Record<string, string> = {
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    editor: 'bg-blue-100 text-blue-800 border-blue-200',
    visualizador: 'bg-gray-100 text-gray-700 border-gray-200',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie os membros da sua equipe</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-4">
              <Avatar className="h-10 w-10">
                {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user.full_name}
                  {user.id === profile?.id && (
                    <span className="ml-2 text-xs text-gray-400">(você)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">Membro desde {formatDate(user.created_at)}</p>
              </div>
              <div>
                {isAdmin && user.id !== profile?.id ? (
                  <Select
                    value={user.role}
                    onValueChange={(v) => updateRole(user.id, v as 'admin' | 'editor' | 'visualizador')}
                    disabled={updatingId === user.id}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="visualizador">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={`text-xs border ${roleColors[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
