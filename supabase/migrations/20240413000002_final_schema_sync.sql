-- MASTER SCHEMA CORRECTION - Pedrooest/ekkostudios
-- Este script garante a consistência total entre o Banco de Dados e o DatabaseService.ts para TODAS as tabelas.

-- 1. FUNÇÃO AUXILIAR PARA ADICIONAR COLUNAS DE CONTROLE
DO $$ 
DECLARE
    t text;
    tables_to_fix text[] := ARRAY[
        'clients', 'financas', 'tasks', 'checklists', 'cobo', 
        'matriz_estrategica', 'rdc', 'collaborators', 
        'reunioes', 'lembretes', 'retiradas_socios', 'planejamento'
    ];
BEGIN
    FOREACH t IN ARRAY tables_to_fix LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()', t);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()', t);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by uuid', t);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_by uuid', t);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS __archived boolean DEFAULT false', t);
    END LOOP;
END $$;

-- 2. CORREÇÕES ESPECÍFICAS POR TABELA (Colunas faltantes detectadas no VALID_FIELDS)

-- Planejamento
ALTER TABLE public.planejamento ADD COLUMN IF NOT EXISTS google_event_id text;

-- Clients
ALTER TABLE public.clients 
  ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS log_comunicacao jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS assets jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS paleta_cores jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS fontes jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS tom_de_voz text,
  ADD COLUMN IF NOT EXISTS metas jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "Fee" numeric DEFAULT 0;

-- Tasks
ALTER TABLE public.tasks 
  ADD COLUMN IF NOT EXISTS "Tags" text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS "Estimativa_H" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "Tempo_Gasto_H" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "Relacionado_A" text,
  ADD COLUMN IF NOT EXISTS "Relacionado_ID" text,
  ADD COLUMN IF NOT EXISTS "Relacionado_Conteudo" text,
  ADD COLUMN IF NOT EXISTS "Hora_Entrega" text;

-- RDC
ALTER TABLE public.rdc ADD COLUMN IF NOT EXISTS "horasMensais" numeric DEFAULT 0;

-- Checklists
ALTER TABLE public.checklists ADD COLUMN IF NOT EXISTS hora text;

-- Lembretes
ALTER TABLE public.lembretes ADD COLUMN IF NOT EXISTS auto_gerado boolean DEFAULT false;

-- Collaborators
ALTER TABLE public.collaborators ADD COLUMN IF NOT EXISTS "calculatedVh" numeric DEFAULT 0;

-- 3. RECARREGAR CACHE DO POSTGREST
NOTIFY pgrst, 'reload schema';
