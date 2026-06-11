'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Loader2, User, Lock, Camera, LayoutDashboard, PanelLeft } from 'lucide-react'
import { toast } from 'sonner'
import { getMenuStyle, setMenuStyle, type MenuStyle } from '@/lib/layout-preferences'

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [menuStyle, setMenuStyleState] = useState<MenuStyle>('sidebar')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setMenuStyleState(getMenuStyle())
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
      if (p) { setProfile(p as UserProfile); setFullName(p.full_name) }
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Arquivo muito grande. Máximo 2MB.'); return }

    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${profile.id}.${ext}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (uploadError) { toast.error('Erro ao enviar foto: ' + uploadError.message); setUploadingAvatar(false); return }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const { error: updateError } = await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    if (updateError) { toast.error('Erro ao salvar foto'); setUploadingAvatar(false); return }

    setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev)
    toast.success('Foto de perfil atualizada!')
    setUploadingAvatar(false)
  }

  async function handleUpdateProfile() {
    if (!profile) return
    setSavingProfile(true)
    const { error } = await supabase.from('user_profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', profile.id)
    if (error) { toast.error(error.message) } else { setProfile(prev => prev ? { ...prev, full_name: fullName } : prev); toast.success('Perfil atualizado!') }
    setSavingProfile(false)
  }

  async function handleUpdatePassword() {
    if (newPassword !== confirmPassword) { toast.error('As senhas não coincidem'); return }
    if (newPassword.length < 6) { toast.error('Senha deve ter pelo menos 6 caracteres'); return }
    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { toast.error(error.message) } else { toast.success('Senha alterada!'); setNewPassword(''); setConfirmPassword('') }
    setSavingPassword(false)
  }

  function handleMenuStyleChange(style: MenuStyle) {
    setMenuStyle(style)
    setMenuStyleState(style)
    toast.success(`Menu ${style === 'sidebar' ? 'lateral' : 'superior'} ativado!`)
    setTimeout(() => window.location.reload(), 500)
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Gerencie sua conta e preferências</p>
      </div>

      {/* Avatar + Profile */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-violet-600" />
          <h2 className="font-semibold text-gray-900">Perfil</h2>
        </div>

        {/* Avatar upload */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-violet-100">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name} />}
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xl font-bold">
                {profile ? getInitials(profile.full_name) : ''}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-md hover:bg-violet-700 transition-colors"
            >
              {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{profile?.full_name}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <button onClick={() => fileInputRef.current?.click()} className="text-xs text-violet-600 hover:underline mt-1">
              Alterar foto de perfil
            </button>
            <p className="text-xs text-gray-400">JPG, PNG ou WebP · máx. 2MB</p>
          </div>
        </div>

        <div>
          <Label htmlFor="fullName">Nome completo</Label>
          <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>E-mail</Label>
          <Input value={profile?.email || ''} disabled className="mt-1 bg-gray-50" />
          <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado</p>
        </div>
        <Button onClick={handleUpdateProfile} disabled={savingProfile || !fullName.trim()} className="bg-violet-600 hover:bg-violet-700">
          {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Salvar Perfil
        </Button>
      </div>

      {/* Menu Style */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-violet-600" />
          <h2 className="font-semibold text-gray-900">Estilo do Menu</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleMenuStyleChange('sidebar')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${menuStyle === 'sidebar' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <PanelLeft className={`h-8 w-8 ${menuStyle === 'sidebar' ? 'text-violet-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${menuStyle === 'sidebar' ? 'text-violet-700' : 'text-gray-600'}`}>Menu Lateral</span>
            {menuStyle === 'sidebar' && <span className="text-xs text-violet-500">✓ Ativo</span>}
          </button>
          <button
            onClick={() => handleMenuStyleChange('topbar')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${menuStyle === 'topbar' ? 'border-violet-600 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <LayoutDashboard className={`h-8 w-8 ${menuStyle === 'topbar' ? 'text-violet-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${menuStyle === 'topbar' ? 'text-violet-700' : 'text-gray-600'}`}>Menu Superior</span>
            {menuStyle === 'topbar' && <span className="text-xs text-violet-500">✓ Ativo</span>}
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-violet-600" />
          <h2 className="font-semibold text-gray-900">Alterar Senha</h2>
        </div>
        <div>
          <Label htmlFor="newPassword">Nova senha</Label>
          <Input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="mt-1" />
        </div>
        <Button onClick={handleUpdatePassword} disabled={savingPassword || !newPassword || !confirmPassword} className="bg-violet-600 hover:bg-violet-700">
          {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Alterar Senha
        </Button>
      </div>
    </div>
  )
}
