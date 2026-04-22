-- ROBUST RLS FIX WITH EXPLICIT CASTING
-- Run this in the Supabase SQL Editor if data is "disappearing" after creation.

DO $$ 
DECLARE 
    t text;
    tables text[] := ARRAY['clients', 'tasks', 'financas', 'reunioes', 'lembretes', 'checklists', 'rdc', 'cobo', 'matriz_estrategica', 'planejamento', 'collaborators'];
BEGIN 
    FOR t IN SELECT unnest(tables) LOOP
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS "View Policy %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Insert Policy %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Update Policy %I" ON public.%I', t, t);
        EXECUTE format('DROP POLICY IF EXISTS "Delete Policy %I" ON public.%I', t, t);
        
        -- Fallback for Portuguese names if they exist
        EXECUTE format('DROP POLICY IF EXISTS "Permitir visualizacao por workspace_id" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permitir insercao por workspace_id" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permitir edicao por workspace_id" ON public.%I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Permitir exclusao por workspace_id" ON public.%I', t);

        -- Create robust policies with explicit casting (::text)
        -- This ensures that UUID = TEXT comparisons work regardless of column types.
        
        EXECUTE format('CREATE POLICY "View Policy %I" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id::text = %I.workspace_id::text AND user_id::text = auth.uid()::text))', t, t, t);
        
        EXECUTE format('CREATE POLICY "Insert Policy %I" ON public.%I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id::text = %I.workspace_id::text AND user_id::text = auth.uid()::text AND (role = %L OR role = %L OR role = %L)))', t, t, t, 'admin', 'editor', 'owner');
        
        EXECUTE format('CREATE POLICY "Update Policy %I" ON public.%I FOR UPDATE USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id::text = %I.workspace_id::text AND user_id::text = auth.uid()::text AND (role = %L OR role = %L OR role = %L)))', t, t, t, 'admin', 'editor', 'owner');
        
        EXECUTE format('CREATE POLICY "Delete Policy %I" ON public.%I FOR DELETE USING (EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id::text = %I.workspace_id::text AND user_id::text = auth.uid()::text AND (role = %L OR role = %L OR role = %L)))', t, t, t, 'admin', 'editor', 'owner');
        
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;
