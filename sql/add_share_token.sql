-- Adiciona coluna de token de compartilhamento público nas atividades
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE DEFAULT NULL;

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_activities_share_token ON activities(share_token) WHERE share_token IS NOT NULL;
