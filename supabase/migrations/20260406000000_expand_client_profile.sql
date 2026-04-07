-- Migration: Expandir perfil do cliente com links, logs, assets e identidade visual
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS log_comunicacao jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assets jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS paleta_cores jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fontes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tom_de_voz text DEFAULT '';
