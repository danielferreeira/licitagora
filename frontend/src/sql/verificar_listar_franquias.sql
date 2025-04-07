-- Verificando se a função listar_franquias existe e criando-a se necessário
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Verificar se a função existe
    SELECT EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'listar_franquias'
        AND n.nspname = 'public'
    ) INTO v_exists;

    IF NOT v_exists THEN
        RAISE NOTICE 'A função listar_franquias não existe. Criando...';
        
        -- Criar a função listar_franquias
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.listar_franquias(
            p_somente_ativas BOOLEAN DEFAULT TRUE,
            p_ordenar_por TEXT DEFAULT ''nome'',
            p_direcao TEXT DEFAULT ''ASC''
        )
        RETURNS TABLE (
            id UUID,
            nome VARCHAR,
            cnpj VARCHAR,
            email VARCHAR,
            telefone VARCHAR,
            user_id UUID,
            nome_responsavel TEXT,
            matriz_id UUID,
            nome_matriz TEXT,
            ativa BOOLEAN,
            data_cadastro TIMESTAMP WITH TIME ZONE,
            total_clientes BIGINT,
            total_colaboradores BIGINT
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $func$
        BEGIN
            RETURN QUERY
            WITH colaboradores_count AS (
                SELECT 
                    pu.franquia_id,
                    COUNT(*) AS total
                FROM 
                    public.perfis_usuario pu
                WHERE 
                    pu.tipo = ''FRANQUIA'' AND
                    pu.is_responsavel = FALSE
                GROUP BY 
                    pu.franquia_id
            ),
            clientes_count AS (
                SELECT 
                    franquia_id,
                    COUNT(*) AS total
                FROM 
                    public.clientes
                WHERE 
                    franquia_id IS NOT NULL
                GROUP BY 
                    franquia_id
            ),
            responsaveis AS (
                SELECT 
                    pu.franquia_id,
                    u.raw_user_meta_data->>''nome'' AS nome_responsavel
                FROM 
                    public.perfis_usuario pu
                JOIN 
                    auth.users u ON pu.user_id = u.id
                WHERE 
                    pu.tipo = ''FRANQUIA'' AND
                    pu.is_responsavel = TRUE
            ),
            matriz_info AS (
                SELECT 
                    f.id AS franquia_id,
                    u.raw_user_meta_data->>''nome'' AS nome_matriz
                FROM 
                    public.franquias f
                JOIN 
                    auth.users u ON f.matriz_id = u.id
            )
            SELECT 
                f.id,
                f.nome,
                f.cnpj,
                f.email,
                f.telefone,
                f.user_id,
                r.nome_responsavel,
                f.matriz_id,
                m.nome_matriz,
                f.ativa,
                f.created_at AS data_cadastro,
                COALESCE(cc.total, 0) AS total_clientes,
                COALESCE(co.total, 0) AS total_colaboradores
            FROM 
                public.franquias f
            LEFT JOIN 
                colaboradores_count co ON f.id = co.franquia_id
            LEFT JOIN 
                clientes_count cc ON f.id = cc.franquia_id
            LEFT JOIN 
                responsaveis r ON f.id = r.franquia_id
            LEFT JOIN 
                matriz_info m ON f.id = m.franquia_id
            WHERE 
                (NOT p_somente_ativas OR f.ativa = TRUE)
            ORDER BY 
                CASE WHEN p_ordenar_por = ''nome'' AND p_direcao = ''ASC'' THEN f.nome END ASC,
                CASE WHEN p_ordenar_por = ''nome'' AND p_direcao = ''DESC'' THEN f.nome END DESC,
                CASE WHEN p_ordenar_por = ''data_cadastro'' AND p_direcao = ''ASC'' THEN f.created_at END ASC,
                CASE WHEN p_ordenar_por = ''data_cadastro'' AND p_direcao = ''DESC'' THEN f.created_at END DESC,
                CASE WHEN p_ordenar_por = ''cnpj'' AND p_direcao = ''ASC'' THEN f.cnpj END ASC,
                CASE WHEN p_ordenar_por = ''cnpj'' AND p_direcao = ''DESC'' THEN f.cnpj END DESC,
                CASE WHEN p_ordenar_por = ''email'' AND p_direcao = ''ASC'' THEN f.email END ASC,
                CASE WHEN p_ordenar_por = ''email'' AND p_direcao = ''DESC'' THEN f.email END DESC,
                f.nome ASC;
        END;
        $func$;
        ';
    ELSE
        RAISE NOTICE 'A função listar_franquias já existe.';
    END IF;
END $$;

-- Verificar e corrigir coluna is_ativa na tabela franquias
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Verificar se a coluna 'is_ativa' existe na tabela franquias
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'franquias'
        AND column_name = 'is_ativa'
    ) INTO column_exists;
    
    -- Se a coluna 'is_ativa' existir, renomeá-la para 'ativa'
    IF column_exists THEN
        EXECUTE 'ALTER TABLE public.franquias RENAME COLUMN is_ativa TO ativa';
        RAISE NOTICE 'Coluna is_ativa renomeada para ativa';
    ELSE
        -- Verificar se a coluna 'ativa' existe
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'franquias'
            AND column_name = 'ativa'
        ) INTO column_exists;
        
        -- Se a coluna 'ativa' não existir, criá-la
        IF NOT column_exists THEN
            EXECUTE 'ALTER TABLE public.franquias ADD COLUMN ativa BOOLEAN DEFAULT TRUE';
            RAISE NOTICE 'Coluna ativa adicionada à tabela franquias';
        END IF;
    END IF;
END $$;

-- Verificar se existem franquias no sistema
SELECT COUNT(*) as total_franquias FROM public.franquias;

-- Listar franquias (todas - ativas e inativas)
SELECT * FROM public.listar_franquias(FALSE);

-- Listar apenas franquias ativas
SELECT * FROM public.listar_franquias(TRUE);

-- Listar franquias ordenadas por data de cadastro decrescente
SELECT * FROM public.listar_franquias(FALSE, 'data_cadastro', 'DESC'); 