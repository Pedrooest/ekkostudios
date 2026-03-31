CREATE TABLE IF NOT EXISTS checklists (
    id TEXT PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    client TEXT,
    title TEXT,
    date TEXT,
    time TEXT,
    location TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    checklist JSONB DEFAULT '[]'::jsonb,
    __archived BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- Politica: Quem pode ver, editar, deletar?
-- Permite acesso aos membros do workspace da tarefa (proprietários e membros da tabela workspace_members)
CREATE POLICY "Users can access checklists from their workspaces"
ON checklists
FOR ALL
USING (
  workspace_id IN (
    SELECT id FROM workspaces WHERE owner_id = auth.uid()
    UNION
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  )
);
