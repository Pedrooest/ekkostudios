-- MIGRATION PARA GARANTIR COLUNAS EM COBO E MATRIZ ESTRATÉGICA

-- TABELA COBO
CREATE TABLE IF NOT EXISTS cobo (
  id text PRIMARY KEY,
  workspace_id text NOT NULL
);

ALTER TABLE cobo
  ADD COLUMN IF NOT EXISTS "Cliente_ID" text,
  ADD COLUMN IF NOT EXISTS "Canal" text,
  ADD COLUMN IF NOT EXISTS "Frequência" text,
  ADD COLUMN IF NOT EXISTS "Público" text,
  ADD COLUMN IF NOT EXISTS "Voz" text,
  ADD COLUMN IF NOT EXISTS "Zona" text,
  ADD COLUMN IF NOT EXISTS "Intenção" text,
  ADD COLUMN IF NOT EXISTS "Formato" text,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "__archived" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "created_by" uuid,
  ADD COLUMN IF NOT EXISTS "updated_by" uuid;

-- TABELA MATRIZ_ESTRATEGICA
CREATE TABLE IF NOT EXISTS matriz_estrategica (
  id text PRIMARY KEY,
  workspace_id text NOT NULL
);

ALTER TABLE matriz_estrategica
  ADD COLUMN IF NOT EXISTS "Cliente_ID" text,
  ADD COLUMN IF NOT EXISTS "Rede_Social" text,
  ADD COLUMN IF NOT EXISTS "Função" text,
  ADD COLUMN IF NOT EXISTS "Quem fala" text,
  ADD COLUMN IF NOT EXISTS "Papel estratégico" text,
  ADD COLUMN IF NOT EXISTS "Tipo de conteúdo" text,
  ADD COLUMN IF NOT EXISTS "Resultado esperado" text,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "__archived" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "created_by" uuid,
  ADD COLUMN IF NOT EXISTS "updated_by" uuid;

-- HABILITAR RLS SE NÃO ESTIVER HABILITADO
ALTER TABLE cobo ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriz_estrategica ENABLE ROW LEVEL SECURITY;
