-- TABELA CLIENTS (clientes)
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS log_comunicacao jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS assets jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS paleta_cores jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fontes jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tom_de_voz text DEFAULT '',
  ADD COLUMN IF NOT EXISTS metas jsonb DEFAULT '[]'::jsonb;

-- TABELA TASKS (tarefas)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "Checklist" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "Anexos" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "Comentarios" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "Atividades" jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "Tempo_Gasto_H" numeric DEFAULT 0;

-- TABELA FINANCAS
ALTER TABLE financas
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS "Status" text DEFAULT 'Pendente';

-- TABELA CHECKLISTS
CREATE TABLE IF NOT EXISTS checklists (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  titulo text DEFAULT '',
  data date,
  cliente_id text,
  local text DEFAULT '',
  observacoes text DEFAULT '',
  status text DEFAULT 'planejada',
  itens_levar jsonb DEFAULT '[]'::jsonb,
  itens_trazer jsonb DEFAULT '[]'::jsonb,
  itens_gravar jsonb DEFAULT '[]'::jsonb,
  updated_at timestamptz DEFAULT now()
);

-- TABELA REUNIOES
CREATE TABLE IF NOT EXISTS reunioes (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  cliente_id text,
  titulo text DEFAULT '',
  data date,
  hora time,
  formato text DEFAULT 'Online',
  participantes text DEFAULT '',
  pauta text DEFAULT '',
  decisoes text DEFAULT '',
  proximos_passos jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'Agendada',
  updated_at timestamptz DEFAULT now()
);

-- TABELA LEMBRETES
CREATE TABLE IF NOT EXISTS lembretes (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  titulo text DEFAULT '',
  data date,
  hora time,
  tipo text DEFAULT 'Outro',
  cliente_id text,
  descricao text DEFAULT '',
  concluido boolean DEFAULT false,
  auto_gerado boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- TABELA RETIRADAS_SOCIOS
CREATE TABLE IF NOT EXISTS retiradas_socios (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  socio integer,
  valor numeric DEFAULT 0,
  data date,
  mes_referencia text,
  observacao text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

-- RLS para todas as novas tabelas
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunioes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lembretes ENABLE ROW LEVEL SECURITY;
ALTER TABLE retiradas_socios ENABLE ROW LEVEL SECURITY;
