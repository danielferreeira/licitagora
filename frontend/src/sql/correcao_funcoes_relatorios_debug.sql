-- Função para gerar relatório de licitações com melhor tratamento de valores nulos e logs
CREATE OR REPLACE FUNCTION public.relatorio_licitacoes_v3(
    p_data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_fim TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_status status_licitacao DEFAULT NULL,
    p_cliente_id UUID DEFAULT NULL
)
RETURNS TABLE (
    total_licitacoes BIGINT,
    licitacoes_ganhas BIGINT,
    licitacoes_perdidas BIGINT,
    licitacoes_em_andamento BIGINT,
    valor_total_ganho DECIMAL(15,2),
    lucro_total DECIMAL(15,2),
    taxa_sucesso DECIMAL(5,2),
    detalhes JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count_total BIGINT;
    v_count_filtros TEXT;
BEGIN
    -- Log dos parâmetros recebidos para depuração
    RAISE NOTICE 'Parâmetros recebidos: p_data_inicio=%, p_data_fim=%, p_status=%, p_cliente_id=%', 
                 p_data_inicio, p_data_fim, p_status, p_cliente_id;
    
    -- Verificar se existem licitações na tabela
    SELECT COUNT(*) INTO v_count_total FROM licitacoes;
    RAISE NOTICE 'Total de licitações na tabela: %', v_count_total;
    
    -- Verificar quantas licitações correspondem aos filtros
    v_count_filtros := 'SELECT COUNT(*) FROM licitacoes l WHERE 1=1';
    
    IF p_data_inicio IS NOT NULL THEN
        v_count_filtros := v_count_filtros || ' AND l.data_abertura >= ''' || p_data_inicio || '''';
    END IF;
    
    IF p_data_fim IS NOT NULL THEN
        v_count_filtros := v_count_filtros || ' AND l.data_abertura <= ''' || p_data_fim || '''';
    END IF;
    
    IF p_status IS NOT NULL THEN
        v_count_filtros := v_count_filtros || ' AND l.status = ''' || p_status || '''';
    END IF;
    
    IF p_cliente_id IS NOT NULL THEN
        v_count_filtros := v_count_filtros || ' AND l.cliente_id = ''' || p_cliente_id || '''';
    END IF;
    
    EXECUTE v_count_filtros INTO v_count_total;
    RAISE NOTICE 'Licitações que correspondem aos filtros: %', v_count_total;

    RETURN QUERY
    WITH licitacoes_filtradas AS (
        SELECT l.*,
               c.razao_social as cliente_razao_social,
               c.cnpj as cliente_cnpj
        FROM licitacoes l
        LEFT JOIN clientes c ON c.id = l.cliente_id
        WHERE (p_data_inicio IS NULL OR l.data_abertura >= p_data_inicio)
        AND (p_data_fim IS NULL OR l.data_abertura <= p_data_fim)
        AND (p_status IS NULL OR l.status = p_status)
        AND (p_cliente_id IS NULL OR l.cliente_id = p_cliente_id)
    ),
    metricas AS (
        SELECT 
            COUNT(*) as total_licitacoes,
            COUNT(*) FILTER (WHERE status = 'CONCLUIDA' AND foi_ganha = true) as licitacoes_ganhas,
            COUNT(*) FILTER (WHERE status = 'CONCLUIDA' AND foi_ganha = false) as licitacoes_perdidas,
            COUNT(*) FILTER (WHERE status = 'EM_ANDAMENTO') as licitacoes_em_andamento,
            COALESCE(SUM(CASE WHEN status = 'CONCLUIDA' AND foi_ganha = true THEN valor_final ELSE 0 END), 0) as valor_total_ganho,
            COALESCE(SUM(CASE WHEN status = 'CONCLUIDA' AND foi_ganha = true THEN lucro_final ELSE 0 END), 0) as lucro_total,
            CASE 
                WHEN COUNT(*) FILTER (WHERE status = 'CONCLUIDA') > 0 
                THEN (COUNT(*) FILTER (WHERE status = 'CONCLUIDA' AND foi_ganha = true)::DECIMAL / 
                     COUNT(*) FILTER (WHERE status = 'CONCLUIDA')) * 100
                ELSE 0
            END as taxa_sucesso,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', id,
                        'numero', numero,
                        'orgao', orgao,
                        'cliente_razao_social', cliente_razao_social,
                        'cliente_cnpj', cliente_cnpj,
                        'modalidade', modalidade,
                        'valor_estimado', valor_estimado,
                        'valor_final', valor_final,
                        'lucro_estimado', lucro_estimado,
                        'lucro_final', lucro_final,
                        'foi_ganha', foi_ganha,
                        'status', status,
                        'data_abertura', data_abertura,
                        'data_fechamento', data_fechamento
                    )
                    ORDER BY data_abertura DESC
                ) FILTER (WHERE id IS NOT NULL),
                '[]'::json
            ) as detalhes
        FROM licitacoes_filtradas
    )
    SELECT * FROM metricas;
END;
$$;

-- Função para gerar relatório de clientes com melhor tratamento de valores nulos e logs
CREATE OR REPLACE FUNCTION public.relatorio_clientes_v3(
    p_data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_fim TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_clientes BIGINT,
    clientes_ativos BIGINT,
    valor_total_licitacoes DECIMAL(15,2),
    detalhes JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count_total BIGINT;
BEGIN
    -- Log dos parâmetros recebidos para depuração
    RAISE NOTICE 'Parâmetros recebidos: p_data_inicio=%, p_data_fim=%', 
                 p_data_inicio, p_data_fim;
    
    -- Verificar se existem clientes na tabela
    SELECT COUNT(*) INTO v_count_total FROM clientes;
    RAISE NOTICE 'Total de clientes na tabela: %', v_count_total;

    RETURN QUERY
    WITH metricas_clientes AS (
        SELECT 
            c.id,
            c.razao_social,
            c.cnpj,
            COUNT(l.id) as total_licitacoes,
            COUNT(*) FILTER (WHERE l.status = 'CONCLUIDA' AND l.foi_ganha = true) as licitacoes_ganhas,
            COUNT(*) FILTER (WHERE l.status = 'EM_ANDAMENTO') as licitacoes_em_andamento,
            COALESCE(SUM(CASE WHEN l.status = 'CONCLUIDA' AND l.foi_ganha = true THEN l.valor_final ELSE 0 END), 0) as valor_total_ganho,
            COALESCE(SUM(CASE WHEN l.status = 'CONCLUIDA' AND l.foi_ganha = true THEN l.lucro_final ELSE 0 END), 0) as lucro_total
        FROM clientes c
        LEFT JOIN licitacoes l ON l.cliente_id = c.id
            AND (p_data_inicio IS NULL OR l.data_abertura >= p_data_inicio)
            AND (p_data_fim IS NULL OR l.data_abertura <= p_data_fim)
        GROUP BY c.id, c.razao_social, c.cnpj
    )
    SELECT 
        COUNT(*)::BIGINT as total_clientes,
        COUNT(*) FILTER (WHERE total_licitacoes > 0)::BIGINT as clientes_ativos,
        COALESCE(SUM(valor_total_ganho), 0) as valor_total_licitacoes,
        COALESCE(
            json_agg(
                json_build_object(
                    'id', id,
                    'razao_social', razao_social,
                    'cnpj', cnpj,
                    'total_licitacoes', total_licitacoes,
                    'licitacoes_ganhas', licitacoes_ganhas,
                    'licitacoes_em_andamento', licitacoes_em_andamento,
                    'valor_total_ganho', valor_total_ganho,
                    'lucro_total', lucro_total
                )
                ORDER BY razao_social
            ) FILTER (WHERE id IS NOT NULL),
            '[]'::json
        ) as detalhes
    FROM metricas_clientes;
END;
$$;

-- Função para gerar relatório de desempenho com melhor tratamento de valores nulos e logs
CREATE OR REPLACE FUNCTION public.relatorio_desempenho_v3(
    p_data_inicio TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_fim TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_licitacoes BIGINT,
    taxa_sucesso DECIMAL(5,2),
    valor_total_ganho DECIMAL(15,2),
    lucro_total DECIMAL(15,2),
    media_prazo_fechamento DECIMAL(10,2),
    motivos_perda JSON,
    evolucao_mensal JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_motivos_perda JSON;
    v_evolucao_mensal JSON;
    v_count_total BIGINT;
BEGIN
    -- Log dos parâmetros recebidos para depuração
    RAISE NOTICE 'Parâmetros recebidos: p_data_inicio=%, p_data_fim=%', 
                 p_data_inicio, p_data_fim;
    
    -- Verificar se existem licitações na tabela
    SELECT COUNT(*) INTO v_count_total FROM licitacoes;
    RAISE NOTICE 'Total de licitações na tabela: %', v_count_total;

    -- Primeiro, calcular os motivos de perda
    SELECT COALESCE(
        json_object_agg(
            COALESCE(motivo_perda, 'NÃO ESPECIFICADO'),
            total_motivo
        ),
        '{}'::json
    )
    INTO v_motivos_perda
    FROM (
        SELECT motivo_perda, COUNT(*) as total_motivo
        FROM licitacoes l
        WHERE (p_data_inicio IS NULL OR l.data_abertura >= p_data_inicio)
        AND (p_data_fim IS NULL OR l.data_abertura <= p_data_fim)
        AND l.status = 'CONCLUIDA' 
        AND l.foi_ganha = false
        GROUP BY l.motivo_perda
    ) m;

    -- Depois, calcular a evolução mensal
    SELECT COALESCE(
        json_agg(
            json_build_object(
                'mes', e.mes,
                'total_licitacoes', e.total_licitacoes,
                'licitacoes_ganhas', e.licitacoes_ganhas,
                'valor_total', e.valor_total,
                'lucro_total', e.lucro_total
            ) ORDER BY e.mes
        ),
        '[]'::json
    )
    INTO v_evolucao_mensal
    FROM (
        SELECT 
            TO_CHAR(l.data_abertura, 'YYYY-MM') as mes,
            COUNT(*) as total_licitacoes,
            COUNT(*) FILTER (WHERE l.status = 'CONCLUIDA' AND l.foi_ganha = true) as licitacoes_ganhas,
            COALESCE(SUM(CASE WHEN l.status = 'CONCLUIDA' AND l.foi_ganha = true THEN l.valor_final ELSE 0 END), 0) as valor_total,
            COALESCE(SUM(CASE WHEN l.status = 'CONCLUIDA' AND l.foi_ganha = true THEN l.lucro_final ELSE 0 END), 0) as lucro_total
        FROM licitacoes l
        WHERE (p_data_inicio IS NULL OR l.data_abertura >= p_data_inicio)
        AND (p_data_fim IS NULL OR l.data_abertura <= p_data_fim)
        GROUP BY TO_CHAR(l.data_abertura, 'YYYY-MM')
    ) e;

    -- Por fim, retornar todos os dados
    RETURN QUERY
    WITH metricas AS (
        SELECT 
            COUNT(*) as total_licitacoes,
            COUNT(*) FILTER (WHERE l.status = 'CONCLUIDA') as total_concluidas,
            COUNT(*) FILTER (WHERE l.status = 'CONCLUIDA' AND l.foi_ganha = true) as total_ganhas,
            COALESCE(SUM(CASE WHEN l.status = 'CONCLUIDA' AND l.foi_ganha = true THEN l.valor_final ELSE 0 END), 0) as valor_total_ganho,
            COALESCE(SUM(CASE WHEN l.status = 'CONCLUIDA' AND l.foi_ganha = true THEN l.lucro_final ELSE 0 END), 0) as lucro_total,
            COALESCE(AVG(EXTRACT(EPOCH FROM (l.data_fechamento - l.data_abertura))/86400.0) FILTER (WHERE l.status = 'CONCLUIDA'), 0) as media_prazo_fechamento
        FROM licitacoes l
        WHERE (p_data_inicio IS NULL OR l.data_abertura >= p_data_inicio)
        AND (p_data_fim IS NULL OR l.data_abertura <= p_data_fim)
    )
    SELECT 
        m.total_licitacoes,
        CASE 
            WHEN m.total_concluidas > 0 
            THEN (m.total_ganhas::DECIMAL / m.total_concluidas * 100)
            ELSE 0
        END as taxa_sucesso,
        m.valor_total_ganho,
        m.lucro_total,
        m.media_prazo_fechamento,
        v_motivos_perda as motivos_perda,
        v_evolucao_mensal as evolucao_mensal
    FROM metricas m;
END;
$$; 