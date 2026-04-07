-- Migration: Add Meetings and Goals
-- 1. Create 'reunioes' table
CREATE TABLE IF NOT EXISTS public.reunioes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    titulo TEXT NOT NULL,
    data DATE NOT NULLDEFAULT CURRENT_DATE,
    hora TIME NOT NULL DEFAULT CURRENT_TIME,
    formato TEXT NOT NULL DEFAULT 'Online', -- Presencial, Online, Híbrido
    participantes TEXT,
    pauta TEXT,
    decisoes TEXT,
    proximos_passos JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Agendada', -- Agendada, Realizada, Cancelada
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Add 'metas' to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS metas JSONB DEFAULT '[]'::jsonb;

-- 3. Enable RLS
ALTER TABLE public.reunioes ENABLE ROW LEVEL SECURITY;

-- Policity for 'reunioes'
-- Users can see meetings in workspaces they belong to
CREATE POLICY "Users can view meetings in their workspaces" ON public.reunioes
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = reunioes.workspace_id 
        AND workspace_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert meetings in their workspaces" ON public.reunioes
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = reunioes.workspace_id 
        AND workspace_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update meetings in their workspaces" ON public.reunioes
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = reunioes.workspace_id 
        AND workspace_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete meetings in their workspaces" ON public.reunioes
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.workspace_members 
        WHERE workspace_members.workspace_id = reunioes.workspace_id 
        AND workspace_members.user_id = auth.uid()
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_reunioes_workspace_id ON public.reunioes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reunioes_cliente_id ON public.reunioes(cliente_id);
