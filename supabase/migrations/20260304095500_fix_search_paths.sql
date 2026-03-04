CREATE OR REPLACE FUNCTION public.accept_invite(token_in text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
declare
  invite_record record;
  user_id_in uuid;
  existing_member record;
begin
  -- Get current user
  user_id_in := auth.uid();
  if user_id_in is null then
    raise exception 'Not authenticated';
  end if;

  -- 1. Find Invite
  select * into invite_record
  from public.invites
  where token = token_in;

  if not found then
    raise exception 'Convite inválido ou não encontrado.';
  end if;

  -- 2. Check Expiration
  if invite_record.expires_at < now() then
    raise exception 'Convite expirado.';
  end if;

  -- 3. Check if already member
  select * into existing_member
  from public.workspace_members
  where workspace_id = invite_record.workspace_id
  and user_id = user_id_in;

  if found then
    -- Already member, just return success
    return jsonb_build_object('workspace_id', invite_record.workspace_id, 'status', 'already_member');
  end if;

  -- 3.5 Ensure Profile Exists (Fix FK Violation)
  -- If the profile trigger failed or hasn't run, we force create it here
  insert into public.profiles (id, email, full_name)
  select 
    id, 
    email, 
    coalesce(raw_user_meta_data->>'full_name', email)
  from auth.users
  where id = user_id_in
  on conflict (id) do nothing;

  -- 4. Add Member
  insert into public.workspace_members (workspace_id, user_id, role)
  values (invite_record.workspace_id, user_id_in, invite_record.role);
  
  return jsonb_build_object('workspace_id', invite_record.workspace_id, 'status', 'joined');
end;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_workspace()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, auth.uid(), 'admin');
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_member_of(_workspace_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  return exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id
    and user_id = auth.uid()
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(_workspace_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
begin
  return exists (
    select 1 from public.workspace_members
    where workspace_id = _workspace_id
    and user_id = auth.uid()
    and role = 'admin'
  );
end;
$function$;
