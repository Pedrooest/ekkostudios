-- Comprehensive Database Schema Repair
-- Adds missing authorship and archive columns across all core data tables

DO $$ 
BEGIN
    DECLARE
        t_name TEXT;
        tables_to_fix TEXT[] := ARRAY['clients', 'cobo', 'matriz_estrategica', 'rdc', 'planejamento', 'financas', 'tasks', 'collaborators', 'vh_config', 'systematic_modeling'];
    BEGIN
        FOREACH t_name IN ARRAY tables_to_fix
        LOOP
            -- 1. Add Authorship uuid columns
            EXECUTE format('alter table %I add column if not exists created_by uuid references public.profiles(id)', t_name);
            EXECUTE format('alter table %I add column if not exists updated_by uuid references public.profiles(id)', t_name);
            
            -- 2. Add Timestamps
            EXECUTE format('alter table %I add column if not exists updated_at timestamptz default now()', t_name);
            
            -- 3. Add Archive flag
            EXECUTE format('alter table %I add column if not exists __archived boolean default false', t_name);
        END LOOP;
    END;
$$;
