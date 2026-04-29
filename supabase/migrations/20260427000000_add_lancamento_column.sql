-- Adiciona a coluna "Lançamento" na tabela financas que o código sempre esperou.
-- A migração inicial (20260211180000_multi_user_workspace.sql) criou
-- "Lancamento_ID" por engano. O código (constants.ts COLUNAS_FINANCAS,
-- DatabaseService.ts MAPA_COLUNAS e VALID_FIELDS, FinancasView) usa
-- "Lançamento" como o nome/título do lançamento financeiro, não como um ID.
-- Resultado: ao tentar salvar um lançamento novo, o PostgREST retornava
-- "Could not find the 'Lançamento' column of 'financas' in the schema cache".

ALTER TABLE public.financas
  ADD COLUMN IF NOT EXISTS "Lançamento" text;

-- Migra qualquer dado existente da coluna antiga "Lancamento_ID" (se houver)
-- para a nova coluna "Lançamento". Idempotente: não sobrescreve valores já preenchidos.
UPDATE public.financas
SET "Lançamento" = "Lancamento_ID"
WHERE "Lançamento" IS NULL AND "Lancamento_ID" IS NOT NULL;

-- Recarrega o cache do PostgREST para que a nova coluna apareça via API.
NOTIFY pgrst, 'reload schema';
