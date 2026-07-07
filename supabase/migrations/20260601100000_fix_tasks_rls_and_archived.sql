-- Fix tasks table: add __archived column + recreate correct RLS policies
-- This resolves the 500 error on GET /rest/v1/tasks

-- 1. Add missing __archived column (causes 500 on SELECT)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false;

UPDATE public.tasks SET __archived = false WHERE __archived IS NULL;

-- 2. Drop ALL existing tasks policies (they may be malformed)
DROP POLICY IF EXISTS "View Policy tasks" ON public.tasks;
DROP POLICY IF EXISTS "Insert Policy tasks" ON public.tasks;
DROP POLICY IF EXISTS "Update Policy tasks" ON public.tasks;
DROP POLICY IF EXISTS "Delete Policy tasks" ON public.tasks;
DROP POLICY IF EXISTS "Modify Policy tasks" ON public.tasks;
DROP POLICY IF EXISTS "Members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Editors can modify tasks" ON public.tasks;

-- 3. Ensure RLS is enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. Create correct policies using the same pattern as other tables
CREATE POLICY "Members can view tasks" ON public.tasks
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = tasks.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can modify tasks" ON public.tasks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = tasks.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('admin', 'editor', 'owner')
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = tasks.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('admin', 'editor', 'owner')
  )
);
