-- Função para garantir que a coluna user_id seja nullable
CREATE OR REPLACE FUNCTION public.garantir_user_id_nullable()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verifica se a tabela franquias existe
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'franquias'
    ) THEN
        -- Verifica se a coluna user_id existe e é NOT NULL
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'franquias'
            AND column_name = 'user_id'
            AND is_nullable = 'NO'
        ) THEN
            -- Modifica a coluna para permitir NULL
            EXECUTE 'ALTER TABLE public.franquias ALTER COLUMN user_id DROP NOT NULL;';
        END IF;
    END IF;
END;
$$;

-- Executa a função automaticamente quando este script é executado
SELECT public.garantir_user_id_nullable();

-- Função para executar todas as etapas de configuração
CREATE OR REPLACE FUNCTION public.configurar_tabela_franquias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Remove a coluna responsavel se existir
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias DROP COLUMN IF EXISTS responsavel;';
    EXCEPTION 
        WHEN undefined_column OR undefined_table OR invalid_column_reference OR duplicate_column THEN
            NULL;
    END;

    -- Garante que user_id é nullable
    PERFORM public.garantir_user_id_nullable();
    
    -- Verifica e adiciona todas as colunas necessárias
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);';
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);';
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS estado VARCHAR(2);';
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS cep VARCHAR(8);';
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS endereco VARCHAR(200);';
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS numero VARCHAR(20);';
    EXCEPTION
        WHEN undefined_table THEN
            NULL;
    END;
END;
$$;

-- Executa a função de configuração automaticamente
SELECT public.configurar_tabela_franquias(); 