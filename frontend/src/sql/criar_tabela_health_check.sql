-- Função para criar tabela de verificação de saúde do banco de dados
CREATE OR REPLACE FUNCTION public.criar_tabela_health_check()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar se a tabela já existe
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'health_check'
    ) THEN
        -- Criar a tabela de verificação de saúde
        CREATE TABLE public.health_check (
            id SERIAL PRIMARY KEY,
            status TEXT DEFAULT 'ok',
            last_check TIMESTAMPTZ DEFAULT NOW(),
            details JSONB DEFAULT '{}'::jsonb
        );
        
        -- Inserir um registro para verificações
        INSERT INTO public.health_check (status, details)
        VALUES ('ok', jsonb_build_object('message', 'Health check table created'));
        
        RAISE NOTICE 'Tabela health_check criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela health_check já existe';
    END IF;
    
    -- Atualizar o registro mais recente para indicar que a verificação foi executada
    UPDATE public.health_check
    SET last_check = NOW(),
        details = jsonb_build_object('message', 'Health check performed')
    WHERE id = (SELECT MAX(id) FROM public.health_check);
    
    -- Limitar registros de verificação para evitar crescimento desnecessário
    DELETE FROM public.health_check
    WHERE id NOT IN (
        SELECT id FROM public.health_check
        ORDER BY last_check DESC
        LIMIT 100
    );
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar/atualizar tabela health_check: %', SQLERRM;
    RETURN FALSE;
END;
$$; 