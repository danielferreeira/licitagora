-- Funções para Licitações
CREATE OR REPLACE FUNCTION public.buscar_licitacoes_por_ramo(p_ramo_atividade TEXT)
RETURNS SETOF public.licitacoes
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT *
    FROM public.licitacoes
    WHERE p_ramo_atividade = ANY(ramos_atividade)
    ORDER BY data_abertura DESC;
$$;

CREATE OR REPLACE FUNCTION public.buscar_licitacoes_por_cliente(p_cliente_id UUID)
RETURNS SETOF public.licitacoes
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT *
    FROM public.licitacoes
    WHERE cliente_id = p_cliente_id
    ORDER BY data_abertura DESC;
$$;

CREATE OR REPLACE FUNCTION public.buscar_licitacoes_por_periodo(
    p_data_inicio TIMESTAMP WITH TIME ZONE,
    p_data_fim TIMESTAMP WITH TIME ZONE
)
RETURNS SETOF public.licitacoes
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT *
    FROM public.licitacoes
    WHERE data_abertura BETWEEN p_data_inicio AND p_data_fim
    ORDER BY data_abertura DESC;
$$;

-- Função para buscar licitações com detalhes do cliente
CREATE OR REPLACE FUNCTION public.buscar_licitacoes_detalhadas()
RETURNS TABLE (
    id UUID,
    numero VARCHAR(50),
    orgao VARCHAR(200),
    objeto TEXT,
    modalidade modalidade_licitacao,
    valor_estimado DECIMAL(15,2),
    data_abertura TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    status status_licitacao,
    observacoes TEXT,
    ramos_atividade TEXT[],
    cliente_id UUID,
    cliente_razao_social VARCHAR(200),
    cliente_cnpj VARCHAR(14)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        l.id,
        l.numero,
        l.orgao,
        l.objeto,
        l.modalidade,
        l.valor_estimado,
        l.data_abertura,
        l.data_fim,
        l.status,
        l.observacoes,
        l.ramos_atividade,
        c.id as cliente_id,
        c.razao_social as cliente_razao_social,
        c.cnpj as cliente_cnpj
    FROM public.licitacoes l
    JOIN public.clientes c ON c.id = l.cliente_id
    ORDER BY l.data_abertura DESC;
$$;

-- Função para buscar licitações por status
CREATE OR REPLACE FUNCTION public.buscar_licitacoes_por_status(p_status status_licitacao)
RETURNS TABLE (
    id UUID,
    numero VARCHAR(50),
    orgao VARCHAR(200),
    objeto TEXT,
    modalidade modalidade_licitacao,
    valor_estimado DECIMAL(15,2),
    data_abertura TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    status status_licitacao,
    observacoes TEXT,
    ramos_atividade TEXT[],
    cliente_id UUID,
    cliente_razao_social VARCHAR(200),
    cliente_cnpj VARCHAR(14)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        l.id,
        l.numero,
        l.orgao,
        l.objeto,
        l.modalidade,
        l.valor_estimado,
        l.data_abertura,
        l.data_fim,
        l.status,
        l.observacoes,
        l.ramos_atividade,
        c.id as cliente_id,
        c.razao_social as cliente_razao_social,
        c.cnpj as cliente_cnpj
    FROM public.licitacoes l
    JOIN public.clientes c ON c.id = l.cliente_id
    WHERE l.status = p_status
    ORDER BY l.data_abertura DESC;
$$;

-- Função para buscar licitações por modalidade
CREATE OR REPLACE FUNCTION public.buscar_licitacoes_por_modalidade(p_modalidade modalidade_licitacao)
RETURNS TABLE (
    id UUID,
    numero VARCHAR(50),
    orgao VARCHAR(200),
    objeto TEXT,
    modalidade modalidade_licitacao,
    valor_estimado DECIMAL(15,2),
    data_abertura TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    status status_licitacao,
    observacoes TEXT,
    ramos_atividade TEXT[],
    cliente_id UUID,
    cliente_razao_social VARCHAR(200),
    cliente_cnpj VARCHAR(14)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        l.id,
        l.numero,
        l.orgao,
        l.objeto,
        l.modalidade,
        l.valor_estimado,
        l.data_abertura,
        l.data_fim,
        l.status,
        l.observacoes,
        l.ramos_atividade,
        c.id as cliente_id,
        c.razao_social as cliente_razao_social,
        c.cnpj as cliente_cnpj
    FROM public.licitacoes l
    JOIN public.clientes c ON c.id = l.cliente_id
    WHERE l.modalidade = p_modalidade
    ORDER BY l.data_abertura DESC;
$$;

-- Função para buscar estatísticas gerais
CREATE OR REPLACE FUNCTION public.buscar_estatisticas()
RETURNS TABLE (
    total_clientes BIGINT,
    total_licitacoes BIGINT,
    licitacoes_em_andamento BIGINT,
    licitacoes_concluidas BIGINT,
    documentos_proximos_vencimento BIGINT,
    prazos_proximos BIGINT,
    valor_total_licitacoes DECIMAL(15,2)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        (SELECT COUNT(*) FROM clientes) as total_clientes,
        (SELECT COUNT(*) FROM licitacoes) as total_licitacoes,
        (SELECT COUNT(*) FROM licitacoes WHERE status = 'EM_ANDAMENTO') as licitacoes_em_andamento,
        (SELECT COUNT(*) FROM licitacoes WHERE status = 'CONCLUIDA') as licitacoes_concluidas,
        (
            SELECT COUNT(*) 
            FROM (
                SELECT data_validade FROM documentos_cliente WHERE data_validade <= (CURRENT_TIMESTAMP + '30 days'::INTERVAL)
                UNION ALL
                SELECT data_validade FROM documentos_licitacao WHERE data_validade <= (CURRENT_TIMESTAMP + '30 days'::INTERVAL)
            ) docs
        ) as documentos_proximos_vencimento,
        (
            SELECT COUNT(*)
            FROM prazos
            WHERE data_prazo >= CURRENT_TIMESTAMP AND data_prazo <= (CURRENT_TIMESTAMP + '7 days'::INTERVAL)
        ) as prazos_proximos,
        (SELECT COALESCE(SUM(valor_estimado), 0) FROM licitacoes) as valor_total_licitacoes;
$$; 