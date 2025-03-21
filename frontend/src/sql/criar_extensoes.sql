-- Função para criar as extensões necessárias no banco de dados
CREATE OR REPLACE FUNCTION public.criar_extensoes()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Criar a extensão pgcrypto se não existir
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    
    -- Criar a extensão uuid-ossp se não existir
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar extensões: %', SQLERRM;
    RETURN FALSE;
END;
$$; 