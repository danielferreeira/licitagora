-- Remover as funções existentes
DROP FUNCTION IF EXISTS public.gerar_relatorio_licitacoes;
DROP FUNCTION IF EXISTS public.gerar_relatorio_clientes;
DROP FUNCTION IF EXISTS public.gerar_relatorio_desempenho;

-- Função para gerar relatório de licitações por período com nomes de parâmetros únicos
CREATE OR REPLACE FUNCTION public.gerar_relatorio_licitacoes(
    p_data_inicio_lic TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_fim_lic TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_status_lic status_licitacao DEFAULT NULL,
    p_cliente_id_lic UUID DEFAULT NULL
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
BEGIN
    RETURN QUERY
    WITH licitacoes_filtradas AS (
        SELECT l.*,
               c.razao_social as cliente_razao_social,
               c.cnpj as cliente_cnpj
        FROM licitacoes l
        JOIN clientes c ON c.id = l.cliente_id
        WHERE (p_data_inicio_lic IS NULL OR l.data_abertura >= p_data_inicio_lic)
        AND (p_data_fim_lic IS NULL OR l.data_abertura <= p_data_fim_lic)
        AND (p_status_lic IS NULL OR l.status = p_status_lic)
        AND (p_cliente_id_lic IS NULL OR l.cliente_id = p_cliente_id_lic)
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
            ) as detalhes
        FROM licitacoes_filtradas
    )
    SELECT * FROM metricas;
END;
$$;

-- Função para gerar relatório de clientes com nomes de parâmetros únicos
CREATE OR REPLACE FUNCTION public.gerar_relatorio_clientes(
    p_data_inicio_cli TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_fim_cli TIMESTAMP WITH TIME ZONE DEFAULT NULL
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
BEGIN
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
        AND (p_data_inicio_cli IS NULL OR l.data_abertura >= p_data_inicio_cli)
        AND (p_data_fim_cli IS NULL OR l.data_abertura <= p_data_fim_cli)
        GROUP BY c.id, c.razao_social, c.cnpj
    )
    SELECT 
        COUNT(*)::BIGINT as total_clientes,
        COUNT(*) FILTER (WHERE total_licitacoes > 0)::BIGINT as clientes_ativos,
        COALESCE(SUM(valor_total_ganho), 0) as valor_total_licitacoes,
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
        ) as detalhes
    FROM metricas_clientes;
END;
$$;

-- Função para gerar relatório de desempenho com nomes de parâmetros únicos
CREATE OR REPLACE FUNCTION public.gerar_relatorio_desempenho(
    p_data_inicio_des TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_data_fim_des TIMESTAMP WITH TIME ZONE DEFAULT NULL
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
BEGIN
    -- Primeiro, calcular os motivos de perda
    SELECT json_object_agg(
        COALESCE(motivo_perda, 'NÃO ESPECIFICADO'),
        total_motivo
    )
    INTO v_motivos_perda
    FROM (
        SELECT motivo_perda, COUNT(*) as total_motivo
        FROM licitacoes l
        WHERE (p_data_inicio_des IS NULL OR l.data_abertura >= p_data_inicio_des)
        AND (p_data_fim_des IS NULL OR l.data_abertura <= p_data_fim_des)
        AND l.status = 'CONCLUIDA' 
        AND l.foi_ganha = false
        GROUP BY l.motivo_perda
    ) m;

    -- Depois, calcular a evolução mensal
    SELECT json_agg(
        json_build_object(
            'mes', e.mes,
            'total_licitacoes', e.total_licitacoes,
            'licitacoes_ganhas', e.licitacoes_ganhas,
            'valor_total', e.valor_total,
            'lucro_total', e.lucro_total
        ) ORDER BY e.mes
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
        WHERE (p_data_inicio_des IS NULL OR l.data_abertura >= p_data_inicio_des)
        AND (p_data_fim_des IS NULL OR l.data_abertura <= p_data_fim_des)
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
        WHERE (p_data_inicio_des IS NULL OR l.data_abertura >= p_data_inicio_des)
        AND (p_data_fim_des IS NULL OR l.data_abertura <= p_data_fim_des)
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
        COALESCE(v_motivos_perda, '{}'::json) as motivos_perda,
        COALESCE(v_evolucao_mensal, '[]'::json) as evolucao_mensal
    FROM metricas m;
END;
$$; 