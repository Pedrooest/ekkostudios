-- Allow Owners to Delete Workspaces
-- This policy ensures that only the creator/owner of a workspace can delete it.
-- Cascade deletion (on delete cascade) in other tables ensures all data is removed.

create policy "Owners can delete workspaces"
  on public.workspaces
  for delete
  using (auth.uid() = owner_id);
