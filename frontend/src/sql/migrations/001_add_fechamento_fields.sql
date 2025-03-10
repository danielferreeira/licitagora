-- Adicionar campos relacionados ao fechamento de licitações
ALTER TABLE public.licitacoes
ADD COLUMN IF NOT EXISTS valor_final DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS lucro_final DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS foi_ganha BOOLEAN,
ADD COLUMN IF NOT EXISTS motivo_perda TEXT,
ADD COLUMN IF NOT EXISTS data_fechamento TIMESTAMP WITH TIME ZONE;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_licitacoes_foi_ganha ON public.licitacoes(foi_ganha);
CREATE INDEX IF NOT EXISTS idx_licitacoes_data_fechamento ON public.licitacoes(data_fechamento); 