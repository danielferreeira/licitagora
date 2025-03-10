-- Função para atualizar a estrutura da tabela requisitos_documentacao
CREATE OR REPLACE FUNCTION public.atualizar_tabela_requisitos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Remover constraint que não precisamos mais
    ALTER TABLE public.requisitos_documentacao 
    DROP CONSTRAINT IF EXISTS uk_licitacao_tipo_doc;

    -- Remover colunas que não são mais necessárias
    ALTER TABLE public.requisitos_documentacao 
    DROP COLUMN IF EXISTS tipo_documento_id,
    DROP COLUMN IF EXISTS data_limite,
    DROP COLUMN IF EXISTS obrigatorio;

    -- Adicionar novas colunas se não existirem
    ALTER TABLE public.requisitos_documentacao 
    ADD COLUMN IF NOT EXISTS atendido BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

    -- Atualizar valores do campo atendido baseado no status
    UPDATE public.requisitos_documentacao
    SET atendido = CASE 
        WHEN status = 'CONCLUIDO' THEN true
        ELSE false
    END
    WHERE atendido IS NULL;

    -- Atualizar a estrutura da tabela para remover a restrição NOT NULL de colunas opcionais
    ALTER TABLE public.requisitos_documentacao 
    ALTER COLUMN observacoes DROP NOT NULL;

    -- Criar índice para ordem se não existir
    CREATE INDEX IF NOT EXISTS idx_requisitos_ordem 
    ON public.requisitos_documentacao(ordem);
END;
$$;

-- Executar a função
SELECT public.atualizar_tabela_requisitos(); 