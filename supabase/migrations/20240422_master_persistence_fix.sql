-- MASTER PERSISTENCE FIX
-- Purpose: Unify schema types, fix RLS policies, and ensure workspace membership.

-- 1. Fix 'reunioes' schema inconsistencies
DO $$ 
BEGIN
    -- Fix 'data' column syntax error if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reunioes' AND column_name = 'data') THEN
        ALTER TABLE public.reunioes ALTER COLUMN "data" SET DEFAULT CURRENT_DATE;
    END IF;

    -- Fix 'cliente_id' type mismatch (UUID -> TEXT)
    -- This is tricky if there's data, but for consistency we must do it.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reunioes' AND column_name = 'cliente_id' AND data_type = 'uuid') THEN
        ALTER TABLE public.reunioes ALTER COLUMN cliente_id TYPE TEXT USING cliente_id::text;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin_or_editor(ws_id_input text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id::text = ws_id_input::text
    AND user_id = auth.uid()
    AND role IN ('admin', 'editor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure all Workspace Owners are Members (Admin)
INSERT INTO public.workspace_members (workspace_id, user_id, role)
SELECT id, owner_id, 'admin'
FROM public.workspaces
ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'admin';

-- 4. Re-apply Robust RLS Policies for All Data Tables
-- We do this for all core tables to ensure consistency.

DO $$
DECLARE
    t text;
    tables_to_fix text[] := ARRAY['clients', 'financas', 'tasks', 'checklists', 'cobo', 'matriz_estrategica', 'rdc', 'planejamento', 'collaborators', 'reunioes', 'lembretes'];
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        -- Drop existing policies to avoid conflicts
        EXECUTE format('DROP POLICY IF EXISTS "Members can view %s" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Editors can modify %s" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can view %s in their workspaces" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can insert %s in their workspaces" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can update %s in their workspaces" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Users can delete %s in their workspaces" ON public.%I', t, t);

        -- Create View Policy
        EXECUTE format('CREATE POLICY "View Policy %s" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id::text = %I.workspace_id::text AND user_id = auth.uid()))', t, t, t);
        
        -- Create Modify Policy (ALL covers INSERT/UPDATE/DELETE)
        EXECUTE format('CREATE POLICY "Modify Policy %s" ON public.%I FOR ALL USING (public.is_admin_or_editor(workspace_id::text)) WITH CHECK (public.is_admin_or_editor(workspace_id::text))', t, t);
    END LOOP;
END $$;

-- 5. Fix handle_new_workspace trigger to be security definer
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new.id, auth.uid(), 'admin');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
