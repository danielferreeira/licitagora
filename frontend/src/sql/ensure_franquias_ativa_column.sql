-- Função para garantir que a coluna 'ativa' exista na tabela franquias
CREATE OR REPLACE FUNCTION public.ensure_franquias_ativa_column()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar se a tabela franquias existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'franquias'
    ) THEN
        RAISE EXCEPTION 'A tabela franquias não existe no banco de dados';
        RETURN FALSE;
    END IF;

    -- Verificar se a coluna 'ativa' existe na tabela franquias
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'franquias'
        AND column_name = 'ativa'
    ) INTO column_exists;

    -- Se a coluna 'ativa' não existir, criá-la
    IF NOT column_exists THEN
        EXECUTE '
            ALTER TABLE public.franquias
            ADD COLUMN ativa BOOLEAN DEFAULT TRUE;
        ';
        RAISE NOTICE 'Coluna ativa criada na tabela franquias';
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'Coluna ativa já existe na tabela franquias';
        RETURN TRUE;
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao verificar/adicionar coluna ativa: %', SQLERRM;
    RETURN FALSE;
END;
$$; 