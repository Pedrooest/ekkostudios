-- RLS FIX FOR WORKSPACE INVITES & MEMBERSHIP VISIBILITY

-- 1. Enable users to see workspaces they are invited to
-- (Currently they only see workspaces they own or are already members of)
create policy "Users can view workspaces they are invited to"
on workspaces for select
using (
  exists (
    select 1 from invites
    where invites.workspace_id = workspaces.id
    and invites.email = auth.email()
  )
);

-- 2. Allow users to view their own invites
-- (Policies on 'invites' table might be missing or too restrictive)
create policy "Users can view own invites"
on invites for select
using ( email = auth.email() );

-- 3. Allow users to update their own invites (e.g. to mark as accepted if logic changes, or just read access mainly)
create policy "Users can update own invites"
on invites for update
using ( email = auth.email() );

-- 4. Ensure workspace_members policies are open for reading by members (usually already exists, but good to ensure)
create policy "Members can view other members in same workspace"
on workspace_members for select
using (
  workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  )
);
