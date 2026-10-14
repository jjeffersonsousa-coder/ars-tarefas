-- Adiciona coluna de aprovação em user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Super admins e admins já existentes ficam aprovados automaticamente
UPDATE user_profiles SET is_approved = true WHERE role IN ('super_admin', 'admin');

-- Usuários criados via convite (set-password) também ficam aprovados
-- (eles já foram criados pelo admin, então já são confiáveis)
UPDATE user_profiles SET is_approved = true WHERE created_at < now();
