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
BEGIN
    -- Criar enum para status da licitação se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_licitacao') THEN
        CREATE TYPE status_licitacao AS ENUM (
            'EM_ANDAMENTO',
            'CONCLUIDA',
            'CANCELADA',
            'SUSPENSA',
            'FRACASSADA',
            'DESERTA'
        );
    END IF;

    -- Criar enum para modalidade se não existir
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modalidade_licitacao') THEN
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
    END IF;

    -- Criar a tabela se não existir
    CREATE TABLE IF NOT EXISTS public.licitacoes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
        numero VARCHAR(50) NOT NULL,
        orgao VARCHAR(200) NOT NULL,
        objeto TEXT NOT NULL,
        modalidade modalidade_licitacao NOT NULL,
        valor_estimado DECIMAL(15,2),
        lucro_estimado DECIMAL(15,2),
        valor_final DECIMAL(15,2),
        lucro_final DECIMAL(15,2),
        foi_ganha BOOLEAN,
        motivo_perda TEXT,
        data_fechamento TIMESTAMP WITH TIME ZONE,
        data_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
        data_fim TIMESTAMP WITH TIME ZONE,
        status status_licitacao NOT NULL DEFAULT 'EM_ANDAMENTO',
        descricao TEXT,
        requisitos TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_licitacoes_foi_ganha ON public.licitacoes(foi_ganha);
    CREATE INDEX IF NOT EXISTS idx_licitacoes_data_fechamento ON public.licitacoes(data_fechamento);

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
END;
$$;

-- Criar função para buscar licitações por ramo
CREATE OR REPLACE FUNCTION public.buscar_licitacoes_por_ramo(p_ramo_atividade TEXT)
RETURNS SETOF public.licitacoes
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.licitacoes 
    WHERE p_ramo_atividade = ANY(ramos_atividade) 
    ORDER BY data_abertura DESC;
$$;

-- Criar função para buscar licitações por cliente
CREATE OR REPLACE FUNCTION public.buscar_licitacoes_por_cliente(p_cliente_id UUID)
RETURNS SETOF public.licitacoes
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.licitacoes
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
    SELECT * FROM public.licitacoes
    WHERE data_abertura BETWEEN p_data_inicio AND p_data_fim
    ORDER BY data_abertura DESC;
$$;

-- Criar função para buscar prazos por licitação
CREATE OR REPLACE FUNCTION public.buscar_prazos_por_licitacao(p_licitacao_id UUID)
RETURNS SETOF public.prazos
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT p.* 
    FROM public.prazos p
    INNER JOIN public.licitacoes l ON p.licitacao_id = l.id
    WHERE p.licitacao_id = p_licitacao_id
    ORDER BY p.data_prazo ASC;
$$;

-- Criar função para buscar prazos por período
CREATE OR REPLACE FUNCTION public.buscar_prazos_por_periodo(
    p_data_inicio TIMESTAMP WITH TIME ZONE,
    p_data_fim TIMESTAMP WITH TIME ZONE
)
RETURNS SETOF public.prazos
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT p.* 
    FROM public.prazos p
    WHERE p.data_prazo BETWEEN p_data_inicio AND p_data_fim
    ORDER BY p.data_prazo ASC;
$$; 