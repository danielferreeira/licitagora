-- Função para atualizar o timestamp (reutilizamos a mesma do arquivo anterior)
-- CREATE OR REPLACE FUNCTION public.update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     NEW.updated_at = CURRENT_TIMESTAMP;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Função para criar ou atualizar a tabela de licitações
CREATE OR REPLACE FUNCTION public.criar_tabela_licitacoes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sql text;
BEGIN
    -- Criar enum para status da licitação
    v_sql := $sql$
    DO $$
    BEGIN
        CREATE TYPE status_licitacao AS ENUM (
            'EM_ANDAMENTO',
            'CONCLUIDA',
            'CANCELADA',
            'SUSPENSA',
            'FRACASSADA',
            'DESERTA'
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
    $$;
    $sql$;
    EXECUTE v_sql;

    -- Criar enum para modalidade
    v_sql := $sql$
    DO $$
    BEGIN
        CREATE TYPE modalidade_licitacao AS ENUM (
            'PREGAO_ELETRONICO',
            'PREGAO_PRESENCIAL',
            'CONCORRENCIA',
            'TOMADA_DE_PRECOS',
            'CONVITE',
            'LEILAO',
            'RDC',
            'DISPENSA',
            'INEXIGIBILIDADE'
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
    $$;
    $sql$;
    EXECUTE v_sql;

    -- Criar a tabela se não existir
    CREATE TABLE IF NOT EXISTS public.licitacoes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
        numero VARCHAR(50) NOT NULL,
        orgao VARCHAR(200) NOT NULL,
        objeto TEXT NOT NULL,
        modalidade modalidade_licitacao NOT NULL,
        valor_estimado DECIMAL(15,2),
        data_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
        data_fim TIMESTAMP WITH TIME ZONE,
        status status_licitacao NOT NULL DEFAULT 'EM_ANDAMENTO',
        observacoes TEXT,
        ramos_atividade TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uk_numero_orgao UNIQUE(numero, orgao)
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_licitacoes_cliente ON public.licitacoes(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_numero ON public.licitacoes(numero);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_status ON public.licitacoes(status);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_data_abertura ON public.licitacoes(data_abertura);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_modalidade ON public.licitacoes(modalidade);

    -- Remover trigger existente se houver
    DROP TRIGGER IF EXISTS update_licitacoes_updated_at ON public.licitacoes;
    
    -- Criar novo trigger
    CREATE TRIGGER update_licitacoes_updated_at
        BEFORE UPDATE ON public.licitacoes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Permitir acesso total as licitacoes" ON public.licitacoes;
    
    -- Criar nova política
    CREATE POLICY "Permitir acesso total as licitacoes"
    ON public.licitacoes
    FOR ALL
    USING (true)
    WITH CHECK (true);

    -- Habilitar RLS
    ALTER TABLE public.licitacoes ENABLE ROW LEVEL SECURITY;

    -- Criar função para buscar licitações por ramo
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

    -- Criar função para buscar licitações por cliente
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

    -- Criar função para buscar licitações por período
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
END;
$$; 