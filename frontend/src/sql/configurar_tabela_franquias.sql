-- Função para configurar a tabela de franquias e verificar/corrigir problemas
CREATE OR REPLACE FUNCTION public.configurar_tabela_franquias()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    column_exists BOOLEAN;
    responsavel_exists BOOLEAN;
BEGIN
    -- Verificar se a coluna 'user_id' existe na tabela franquias
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'franquias'
        AND column_name = 'user_id'
    ) INTO column_exists;

    -- Se a coluna 'user_id' não existir, criá-la
    IF NOT column_exists THEN
        EXECUTE '
            ALTER TABLE public.franquias
            ADD COLUMN user_id UUID NULL,
            ADD CONSTRAINT fk_user
                FOREIGN KEY (user_id)
                REFERENCES auth.users(id)
                ON DELETE SET NULL;
        ';
        RAISE NOTICE 'Coluna user_id criada na tabela franquias';
    END IF;

    -- Verificar se a coluna 'responsavel' existe
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'franquias'
        AND column_name = 'responsavel'
    ) INTO responsavel_exists;

    -- Se a coluna 'responsavel' existir, removê-la
    IF responsavel_exists THEN
        EXECUTE '
            ALTER TABLE public.franquias
            DROP COLUMN IF EXISTS responsavel;
        ';
        RAISE NOTICE 'Coluna responsavel removida da tabela franquias';
    END IF;

    -- Verificar se a coluna 'ativa' existe na tabela franquias
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'franquias'
        AND column_name = 'ativa'
    ) INTO column_exists;

    -- Se a coluna 'ativa' não existir, criá-la
    IF NOT column_exists THEN
        EXECUTE '
            ALTER TABLE public.franquias
            ADD COLUMN ativa BOOLEAN DEFAULT TRUE;
        ';
        RAISE NOTICE 'Coluna ativa criada na tabela franquias';
    END IF;

    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao configurar tabela de franquias: %', SQLERRM;
    RETURN FALSE;
END;
$$; 