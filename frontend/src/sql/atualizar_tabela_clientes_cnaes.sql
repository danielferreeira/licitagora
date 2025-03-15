-- Script para atualizar a tabela de clientes para suportar CNAEs
-- Este script adiciona uma coluna 'cnaes' do tipo JSONB para armazenar os CNAEs dos clientes

-- Verificar se a coluna cnaes já existe e adicioná-la se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clientes' 
        AND column_name = 'cnaes'
    ) THEN
        -- Adicionar coluna cnaes
        ALTER TABLE public.clientes ADD COLUMN cnaes JSONB DEFAULT '[]'::jsonb;
        
        -- Criar índice para a coluna cnaes
        CREATE INDEX idx_clientes_cnaes ON public.clientes USING GIN (cnaes);
        
        -- Converter ramos_atividade existentes para cnaes
        UPDATE public.clientes
        SET cnaes = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'codigo', '00.00-0-' || LPAD(idx::text, 2, '0'),
                    'descricao', ramo,
                    'tipo', CASE WHEN idx = 0 THEN 'principal' ELSE 'secundaria' END
                )
            )
            FROM (
                SELECT ramo, idx
                FROM unnest(ramos_atividade) WITH ORDINALITY AS t(ramo, idx)
            ) sub
        )
        WHERE ramos_atividade IS NOT NULL AND array_length(ramos_atividade, 1) > 0;
        
        RAISE NOTICE 'Coluna cnaes adicionada com sucesso à tabela clientes';
    ELSE
        RAISE NOTICE 'Coluna cnaes já existe na tabela clientes';
    END IF;
END $$;

-- Criar função para buscar clientes por CNAE
CREATE OR REPLACE FUNCTION public.buscar_clientes_por_cnae(p_codigo_cnae TEXT)
RETURNS SETOF public.clientes
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT *
    FROM public.clientes
    WHERE EXISTS (
        SELECT 1
        FROM jsonb_array_elements(cnaes) AS cnae
        WHERE cnae->>'codigo' LIKE '%' || p_codigo_cnae || '%'
    );
$$; 