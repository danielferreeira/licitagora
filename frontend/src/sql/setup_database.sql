-- Criar o enum status_licitacao
DO $$
BEGIN
    DROP TYPE IF EXISTS status_licitacao CASCADE;
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
END $$;

-- Criar o enum modalidade_licitacao
DO $$
BEGIN
    DROP TYPE IF EXISTS modalidade_licitacao CASCADE;
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
END $$;

-- Dropar a tabela se existir
DROP TABLE IF EXISTS public.licitacoes CASCADE;

-- Criar a tabela de licitações
CREATE TABLE public.licitacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    numero VARCHAR(50) NOT NULL,
    orgao VARCHAR(200) NOT NULL,
    objeto TEXT NOT NULL,
    modalidade modalidade_licitacao NOT NULL,
    valor_estimado DECIMAL(15,2),
    lucro_estimado DECIMAL(15,2),
    data_abertura TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE,
    status status_licitacao NOT NULL DEFAULT 'EM_ANDAMENTO'::status_licitacao,
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

-- Habilitar RLS na tabela
ALTER TABLE public.licitacoes ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Permitir acesso total as licitacoes"
ON public.licitacoes
FOR ALL
USING (true)
WITH CHECK (true);

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