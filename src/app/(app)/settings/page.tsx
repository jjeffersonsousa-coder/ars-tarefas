'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Loader2, User, Lock } from 'lucide-react'

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p as UserProfile)
        setFullName(p.full_name)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleUpdateProfile() {
    if (!profile) return
    setSavingProfile(true)
    setProfileError(null)
    setProfileSuccess(false)

    const { error } = await supabase
      .from('user_profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (error) {
      setProfileError(error.message)
    } else {
      setProfile((prev) => prev ? { ...prev, full_name: fullName } : prev)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    }
    setSavingProfile(false)
  }

  async function handleUpdatePassword() {
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres')
      return
    }
    setSavingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    }
    setSavingPassword(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-100 rounded w-32 animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-lg border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Perfil</h2>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-semibold">
              {profile ? getInitials(profile.full_name) : ''}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <p className="text-xs text-indigo-600 capitalize mt-0.5">{profile?.role}</p>
          </div>
        </div>

        {profileError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded">
            Perfil atualizado com sucesso!
          </div>
        )}

        <div>
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label>E-mail</Label>
          <Input value={profile?.email || ''} disabled className="mt-1 bg-gray-50" />
          <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado</p>
        </div>

        <Button onClick={handleUpdateProfile} disabled={savingProfile || !fullName.trim()}>
          {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Perfil
        </Button>
      </div>

      {/* Password section */}
      <div className="bg-white rounded-lg border p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-gray-500" />
          <h2 className="font-semibold text-gray-900">Alterar Senha</h2>
        </div>

        {passwordError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded">
            Senha alterada com sucesso!
          </div>
        )}

        <div>
          <Label htmlFor="newPassword">Nova senha</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita a nova senha"
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleUpdatePassword}
          disabled={savingPassword || !newPassword || !confirmPassword}
        >
          {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Alterar Senha
        </Button>
      </div>
    </div>
  )
}
