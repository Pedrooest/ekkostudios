-- Atualização Financeira: Recorrência e Inteligência
ALTER TABLE financas
  ADD COLUMN IF NOT EXISTS "_origem_id" text,
  ADD COLUMN IF NOT EXISTS "_auto_gerado" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "Dia_Pagamento" integer;

-- Comentários para documentação das novas colunas
COMMENT ON COLUMN financas._origem_id IS 'ID do lançamento pai que originou esta recorrência';
COMMENT ON COLUMN financas._auto_gerado IS 'Flag para identificar lançamentos criados automaticamente pelo sistema';
COMMENT ON COLUMN financas."Dia_Pagamento" IS 'Dia do mês preferencial para o pagamento ou geração da recorrência';
