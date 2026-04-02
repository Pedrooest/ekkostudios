-- Garante que a tabela financas tem as colunas corretas
ALTER TABLE financas
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Remove coluna errada se existir
ALTER TABLE financas
  DROP COLUMN IF EXISTS "Atualizado_Em";
