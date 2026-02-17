-- Add Authorship and Timestamp tracking to all data tables

-- Function to add columns if they don't exist
create or replace procedure add_audit_columns(table_name text)
language plpgsql
as $$
begin
    execute format('alter table %I add column if not exists created_by uuid references public.profiles(id)', table_name);
    execute format('alter table %I add column if not exists updated_by uuid references public.profiles(id)', table_name);
    execute format('alter table %I add column if not exists updated_at timestamptz default now()', table_name);
end;
$$;

-- Apply to all data tables
call add_audit_columns('clients');
call add_audit_columns('cobo');
call add_audit_columns('matriz_estrategica');
call add_audit_columns('rdc');
call add_audit_columns('planejamento');
call add_audit_columns('financas');
call add_audit_columns('tasks');
call add_audit_columns('collaborators');
call add_audit_columns('systematic_modeling');

-- Cleanup helper procedure
drop procedure add_audit_columns;
