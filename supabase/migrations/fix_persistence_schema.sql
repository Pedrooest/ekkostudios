-- ADICIONANDO CAMPOS DE CONTROLE E METADADOS EM TODAS AS TABELAS PRINCIPAIS

-- TABELA CLIENTS
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS "Fee" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA FINANCAS
ALTER TABLE financas
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA TASKS
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS "Descrição" text,
  ADD COLUMN IF NOT EXISTS "Hora_Entrega" text,
  ADD COLUMN IF NOT EXISTS "Tags" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "Estimativa_H" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "Relacionado_A" text,
  ADD COLUMN IF NOT EXISTS "Relacionado_ID" text,
  ADD COLUMN IF NOT EXISTS "Relacionado_Conteudo" text,
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA CHECKLISTS
ALTER TABLE checklists
  ADD COLUMN IF NOT EXISTS "time" text,
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA COBO
ALTER TABLE cobo
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA MATRIZ_ESTRATEGICA
ALTER TABLE matriz_estrategica
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA RDC
ALTER TABLE rdc
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA PLANEJAMENTO
ALTER TABLE planejamento
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA COLLABORATORS
ALTER TABLE collaborators
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA REUNIOES
ALTER TABLE reunioes
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA LEMBRETES
ALTER TABLE lembretes
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- TABELA RETIRADAS_SOCIOS
ALTER TABLE retiradas_socios
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_by uuid,
  ADD COLUMN IF NOT EXISTS updated_by uuid,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
