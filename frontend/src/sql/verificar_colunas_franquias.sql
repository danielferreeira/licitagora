-- Função para verificar e garantir colunas na tabela franquias
CREATE OR REPLACE FUNCTION public.verificar_colunas_franquias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Remover a coluna responsavel se existir
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias DROP COLUMN IF EXISTS responsavel;';
    EXCEPTION 
        WHEN undefined_column OR undefined_table OR invalid_column_reference OR duplicate_column THEN
            -- Ignora se a coluna não existir
            NULL;
    END;

    -- Garantir que a coluna user_id seja nullable
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ALTER COLUMN user_id DROP NOT NULL;';
    EXCEPTION 
        WHEN undefined_column OR undefined_table OR invalid_column_reference THEN
            NULL;
    END;

    -- Verificar se existe a coluna bairro
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS bairro VARCHAR(100);';
    EXCEPTION
        WHEN undefined_table OR duplicate_column THEN
            NULL;
    END;

    -- Verificar se existe a coluna cidade
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);';
    EXCEPTION
        WHEN undefined_table OR duplicate_column THEN
            NULL;
    END;

    -- Verificar se existe a coluna estado
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS estado VARCHAR(2);';
    EXCEPTION
        WHEN undefined_table OR duplicate_column THEN
            NULL;
    END;

    -- Verificar se existe a coluna cep
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS cep VARCHAR(8);';
    EXCEPTION
        WHEN undefined_table OR duplicate_column THEN
            NULL;
    END;

    -- Verificar se existe a coluna endereco
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS endereco VARCHAR(200);';
    EXCEPTION
        WHEN undefined_table OR duplicate_column THEN
            NULL;
    END;

    -- Verificar se existe a coluna numero
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ADD COLUMN IF NOT EXISTS numero VARCHAR(20);';
    EXCEPTION
        WHEN undefined_table OR duplicate_column THEN
            NULL;
    END;
END;
$$; 