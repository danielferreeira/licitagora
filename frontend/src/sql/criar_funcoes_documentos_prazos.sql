-- Funções para Documentos
CREATE OR REPLACE FUNCTION public.buscar_documentos_vencimento(
    p_dias_alerta INTEGER DEFAULT 30
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR(200),
    tipo tipo_documento,
    data_validade TIMESTAMP WITH TIME ZONE,
    dias_para_vencer INTEGER,
    cliente_id UUID,
    cliente_razao_social VARCHAR(200),
    licitacao_id UUID,
    licitacao_numero VARCHAR(50)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        d.id,
        d.nome,
        d.tipo,
        d.data_validade,
        EXTRACT(DAY FROM (d.data_validade - CURRENT_TIMESTAMP))::INTEGER as dias_para_vencer,
        c.id as cliente_id,
        c.razao_social as cliente_razao_social,
        NULL::UUID as licitacao_id,
        NULL::VARCHAR as licitacao_numero
    FROM documentos_cliente d
    JOIN clientes c ON c.id = d.cliente_id
    WHERE 
        d.data_validade IS NOT NULL 
        AND d.data_validade <= (CURRENT_TIMESTAMP + (p_dias_alerta || ' days')::INTERVAL)
    UNION ALL
    SELECT 
        d.id,
        d.nome,
        d.tipo,
        d.data_validade,
        EXTRACT(DAY FROM (d.data_validade - CURRENT_TIMESTAMP))::INTEGER as dias_para_vencer,
        NULL::UUID as cliente_id,
        NULL::VARCHAR as cliente_razao_social,
        l.id as licitacao_id,
        l.numero as licitacao_numero
    FROM documentos_licitacao d
    JOIN licitacoes l ON l.id = d.licitacao_id
    WHERE 
        d.data_validade IS NOT NULL 
        AND d.data_validade <= (CURRENT_TIMESTAMP + (p_dias_alerta || ' days')::INTERVAL)
    ORDER BY dias_para_vencer;
$$;

-- Funções para Prazos
CREATE OR REPLACE FUNCTION public.buscar_proximos_prazos(
    p_dias_alerta INTEGER DEFAULT 7
)
RETURNS TABLE (
    id UUID,
    titulo VARCHAR(200),
    tipo tipo_prazo,
    data_prazo TIMESTAMP WITH TIME ZONE,
    dias_restantes INTEGER,
    licitacao_id UUID,
    licitacao_numero VARCHAR(50),
    licitacao_orgao VARCHAR(200)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        p.id,
        p.titulo,
        p.tipo,
        p.data_prazo,
        EXTRACT(DAY FROM (p.data_prazo - CURRENT_TIMESTAMP))::INTEGER as dias_restantes,
        l.id as licitacao_id,
        l.numero as licitacao_numero,
        l.orgao as licitacao_orgao
    FROM prazos p
    JOIN licitacoes l ON l.id = p.licitacao_id
    WHERE 
        p.data_prazo >= CURRENT_TIMESTAMP
        AND p.data_prazo <= (CURRENT_TIMESTAMP + (p_dias_alerta || ' days')::INTERVAL)
    ORDER BY p.data_prazo;
$$;

-- Função para importar prazos das licitações
CREATE OR REPLACE FUNCTION public.importar_prazos_licitacoes()
RETURNS SETOF public.prazos
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Inserir prazo de abertura para licitações que não têm
    INSERT INTO public.prazos (
        licitacao_id,
        titulo,
        tipo,
        data_prazo,
        observacoes
    )
    SELECT 
        l.id,
        'Abertura da Licitação: ' || l.numero,
        'ABERTURA'::tipo_prazo,
        l.data_abertura,
        'Prazo importado automaticamente'
    FROM public.licitacoes l
    WHERE NOT EXISTS (
        SELECT 1 
        FROM public.prazos p 
        WHERE p.licitacao_id = l.id 
        AND p.tipo = 'ABERTURA'
    );

    -- Retornar todos os prazos criados
    RETURN QUERY
    SELECT *
    FROM public.prazos
    WHERE created_at >= NOW() - INTERVAL '5 minutes'
    ORDER BY data_prazo;
END;
$$; 