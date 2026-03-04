-- Enable RLS on both tables
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vh_config ENABLE ROW LEVEL SECURITY;

-- Policies for invites
CREATE POLICY "Members can view invites" ON public.invites
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = invites.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can modify invites" ON public.invites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = invites.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('admin', 'editor')
  )
);

-- Policies for vh_config
CREATE POLICY "Members can view vh_config" ON public.vh_config
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = vh_config.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

CREATE POLICY "Editors can modify vh_config" ON public.vh_config
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_members.workspace_id = vh_config.workspace_id
    AND workspace_members.user_id = auth.uid()
    AND workspace_members.role IN ('admin', 'editor')
  )
);
