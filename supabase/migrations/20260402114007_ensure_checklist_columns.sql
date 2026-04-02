-- Migration to ensure checklists table has the correct JSONB columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklists' AND column_name = 'itens_levar') THEN
        ALTER TABLE checklists ADD COLUMN itens_levar JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklists' AND column_name = 'itens_trazer') THEN
        ALTER TABLE checklists ADD COLUMN itens_trazer JSONB DEFAULT '[]'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklists' AND column_name = 'itens_gravar') THEN
        ALTER TABLE checklists ADD COLUMN itens_gravar JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;
