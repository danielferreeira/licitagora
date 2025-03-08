-- Funções para Documentos
CREATE OR REPLACE FUNCTION public.buscar_documentos_vencimento(
    p_dias_alerta INTEGER DEFAULT 30
)
RETURNS TABLE (
    id UUID,
    nome VARCHAR(200),
    tipo_documento_id UUID,
    tipo_documento_nome VARCHAR(100),
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
        d.tipo_documento_id,
        td.nome as tipo_documento_nome,
        d.data_validade,
        EXTRACT(DAY FROM (d.data_validade - CURRENT_TIMESTAMP))::INTEGER as dias_para_vencer,
        c.id as cliente_id,
        c.razao_social as cliente_razao_social,
        NULL::UUID as licitacao_id,
        NULL::VARCHAR as licitacao_numero
    FROM documentos_cliente d
    JOIN clientes c ON c.id = d.cliente_id
    JOIN tipos_documentos td ON td.id = d.tipo_documento_id
    WHERE 
        d.data_validade IS NOT NULL 
        AND d.data_validade <= (CURRENT_TIMESTAMP + (p_dias_alerta || ' days')::INTERVAL)
    UNION ALL
    SELECT 
        d.id,
        d.nome,
        d.tipo_documento_id,
        td.nome as tipo_documento_nome,
        d.data_validade,
        EXTRACT(DAY FROM (d.data_validade - CURRENT_TIMESTAMP))::INTEGER as dias_para_vencer,
        NULL::UUID as cliente_id,
        NULL::VARCHAR as cliente_razao_social,
        l.id as licitacao_id,
        l.numero as licitacao_numero
    FROM documentos_licitacao d
    JOIN licitacoes l ON l.id = d.licitacao_id
    JOIN tipos_documentos td ON td.id = d.tipo_documento_id
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

-- Função para extrair e processar requisitos do edital
CREATE OR REPLACE FUNCTION public.processar_requisitos_edital(
    p_texto TEXT,
    p_licitacao_id UUID
)
RETURNS SETOF public.requisitos_documentacao
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_linha TEXT;
    v_requisito TEXT := '';
    v_capturando_requisitos BOOLEAN := false;
    v_contador INTEGER := 0;
BEGIN
    -- Processar o texto linha por linha
    FOR v_linha IN SELECT unnest(string_to_array(p_texto, E'\n')) LOOP
        -- Converter para minúsculo para comparação
        v_linha := trim(v_linha);
        
        -- Identificar início de seção de requisitos
        IF v_linha ~* '(documentação|habilitação|qualificação|requisitos)' THEN
            v_capturando_requisitos := true;
            CONTINUE;
        END IF;

        -- Identificar fim de seção de requisitos
        IF v_linha ~* '(proposta|preço|pagamento)' THEN
            v_capturando_requisitos := false;
        END IF;

        -- Processar linha se estiver capturando requisitos
        IF v_capturando_requisitos AND length(v_linha) > 0 THEN
            -- Verificar se é uma nova linha de requisito
            IF v_linha ~ '^[0-9\.\-]+\s' THEN
                -- Se já tiver um requisito acumulado, inserir
                IF length(v_requisito) > 0 THEN
                    INSERT INTO public.requisitos_documentacao (
                        licitacao_id,
                        descricao,
                        atendido,
                        ordem
                    ) VALUES (
                        p_licitacao_id,
                        trim(v_requisito),
                        false,
                        v_contador
                    )
                    RETURNING * INTO v_requisito;

                    RETURN NEXT v_requisito;
                    v_contador := v_contador + 1;
                END IF;
                
                -- Iniciar novo requisito
                v_requisito := v_linha;
            ELSE
                -- Continuar requisito atual
                v_requisito := v_requisito || ' ' || v_linha;
            END IF;
        END IF;
    END LOOP;

    -- Inserir último requisito se houver
    IF length(v_requisito) > 0 THEN
        INSERT INTO public.requisitos_documentacao (
            licitacao_id,
            descricao,
            atendido,
            ordem
        ) VALUES (
            p_licitacao_id,
            trim(v_requisito),
            false,
            v_contador
        )
        RETURNING * INTO v_requisito;

        RETURN NEXT v_requisito;
    END IF;

    RETURN;
END;
$$; 