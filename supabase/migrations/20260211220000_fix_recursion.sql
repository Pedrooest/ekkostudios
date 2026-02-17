-- Fix Infinite Recursion in RLS Policies
-- The issue arises because verifying membership requires querying workspace_members, which itself is protected by a policy checking membership.
-- Solution: Use SECURITY DEFINER functions to bypass RLS for the membership check itself.

-- 1. Create Helper Functions (Security Definer)

create or replace function public.is_member_of(_workspace_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id
    and user_id = auth.uid()
  );
end;
$$;

create or replace function public.is_workspace_admin(_workspace_id uuid)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id
    and user_id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- 2. Update Workspace Members Policies

drop policy if exists "Members can view other members" on public.workspace_members;
drop policy if exists "Admins can manage members" on public.workspace_members;

create policy "Members can view other members"
  on public.workspace_members for select
  using ( public.is_member_of(workspace_id) );

create policy "Admins can manage members"
  on public.workspace_members for all
  using ( public.is_workspace_admin(workspace_id) );

-- 3. Update Workspaces Policies (to be safe and efficient)

drop policy if exists "Members can view workspaces" on public.workspaces;

create policy "Members can view workspaces"
  on public.workspaces for select
  using (
    auth.uid() = owner_id or
    public.is_member_of(id)
  );

-- 4. Update Data Table Policies (Optional but recommended for performance/consistency)
-- We can leave them as is for now since they query workspace_members which now has a non-recursive SELECT policy.
-- But using the function is slightly better. Let's update one as an example or all? 
-- Detailed plan says fix recursion. The recursion is broken by step 2.
-- So Step 2 is the critical fix. Step 3 is good optimization.

-- Let's also ensure Users can see themselves in workspace_members unconditionally?
-- Actually "Members can view other members" covers "Self" because if I am a member, I am a member.
-- But what if I am checking "Am I a member?" -> is_member_of runs (no RLS) -> returns yes/no.
-- If yes, policy passes. If no, policy fails. Correct.

