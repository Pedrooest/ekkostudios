-- Fix RLS policy to allow owners to see their workspaces immediately upon creation
-- This resolves the race condition where the member trigger hasn't fired yet during the select return

drop policy if exists "Members can view workspaces" on public.workspaces;

create policy "Members can view workspaces"
  on public.workspaces for select
  using (
    auth.uid() = owner_id or
    exists (
      select 1 from public.workspace_members
      where workspace_id = id and user_id = auth.uid()
    )
  );
