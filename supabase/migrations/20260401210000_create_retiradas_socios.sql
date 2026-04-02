-- Tabela para histórico de retiradas dos sócios
CREATE TABLE IF NOT EXISTS retiradas_socios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  socio int NOT NULL CHECK (socio IN (1, 2)),
  valor numeric NOT NULL,
  data timestamptz NOT NULL DEFAULT now(),
  mes_referencia text NOT NULL, -- Formato: "2024-03"
  observacao text,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Ativa RLS
ALTER TABLE retiradas_socios ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view withdrawals of their workspaces" 
  ON retiradas_socios FOR SELECT 
  USING (
    workspace_id IN (
      SELECT id_workspace FROM workspace_members WHERE id_usuario = auth.uid()
    )
  );

CREATE POLICY "Users can insert withdrawals in their workspaces" 
  ON retiradas_socios FOR INSERT 
  WITH CHECK (
    workspace_id IN (
      SELECT id_workspace FROM workspace_members WHERE id_usuario = auth.uid()
    )
  );

CREATE POLICY "Users can delete withdrawals in their workspaces" 
  ON retiradas_socios FOR DELETE 
  USING (
    workspace_id IN (
      SELECT id_workspace FROM workspace_members WHERE id_usuario = auth.uid()
    )
  );
