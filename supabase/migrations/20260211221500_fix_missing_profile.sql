-- Fix Missing Profiles
-- This script ensures that every user in auth.users has a corresponding record in public.profiles.
-- This fixes the "violates foreign key constraint workspaces_owner_id_fkey" error.

insert into public.profiles (id, email, full_name)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', email)
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
