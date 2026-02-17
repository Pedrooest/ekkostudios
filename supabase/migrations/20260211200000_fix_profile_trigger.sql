-- Create a trigger to automatically create a profile entry when a new user signs up via Supabase Auth.

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, status, priorities)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'Especialista',
    'online',
    ARRAY[]::text[]
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill: Ensure existing users have a profile to prevent FK errors
insert into public.profiles (id, email)
select id, email from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;
