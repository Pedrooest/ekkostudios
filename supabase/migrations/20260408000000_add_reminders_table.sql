-- Migration: Add Reminders Table
-- Created: 2026-04-08
-- Description: Creates the 'lembretes' table for storing user-defined and auto-generated reminders.

CREATE TABLE IF NOT EXISTS public.lembretes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    data DATE NOT NULL,
    hora TIME,
    tipo TEXT NOT NULL CHECK (tipo IN ('Post', 'Reunião', 'Pagamento', 'Tarefa', 'Contrato', 'Outro')),
    cliente_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    descricao TEXT,
    concluido BOOLEAN DEFAULT FALSE,
    auto_gerado BOOLEAN DEFAULT FALSE,
    auto_id TEXT UNIQUE, -- Optional: used to prevent duplicate auto-generated reminders (e.g. 'task_vence_tomorrow:task_id')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_lembretes_workspace_id ON public.lembretes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_lembretes_data ON public.lembretes(data);

-- Enable RLS
ALTER TABLE public.lembretes ENABLE ROW LEVEL SECURITY;

-- Policies for RLS (ensure user belongs to the workspace)
CREATE POLICY "Users can view reminders in their workspaces" ON public.lembretes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = lembretes.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert reminders in their workspaces" ON public.lembretes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = lembretes.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update reminders in their workspaces" ON public.lembretes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = lembretes.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete reminders in their workspaces" ON public.lembretes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_members.workspace_id = lembretes.workspace_id
            AND workspace_members.user_id = auth.uid()
        )
    );
