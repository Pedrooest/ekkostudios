CREATE TABLE IF NOT EXISTS checklists (
  id text PRIMARY KEY,
  workspace_id text NOT NULL,
  titulo text,
  data date,
  cliente_id text,
  local text,
  observacoes text,
  status text DEFAULT 'planejada',
  itens_levar jsonb DEFAULT '[]'::jsonb,
  itens_trazer jsonb DEFAULT '[]'::jsonb,
  itens_gravar jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklists_workspace" ON checklists
  USING (workspace_id = current_setting('app.workspace_id', true));
