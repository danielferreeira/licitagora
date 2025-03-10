-- Primeiro, vamos garantir que a tabela licitacoes existe
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

-- Primeiro, remover as funções que dependem da tabela prazos
DROP FUNCTION IF EXISTS public.buscar_prazos_por_licitacao(UUID);
DROP FUNCTION IF EXISTS public.buscar_prazos_por_periodo(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.importar_prazos_licitacoes();

-- Agora podemos remover a tabela prazos
DROP TABLE IF EXISTS public.prazos CASCADE;

-- Criar enum para tipo de prazo se não existir
DO $$
BEGIN
    CREATE TYPE tipo_prazo AS ENUM (
        'ABERTURA',
        'VISITA_TECNICA',
        'IMPUGNACAO',
        'ESCLARECIMENTO',
        'RECURSO',
        'CONTRARRAZAO',
        'ASSINATURA_CONTRATO',
        'ENTREGA_DOCUMENTOS',
        'OUTROS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar a tabela prazos
CREATE TABLE public.prazos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    licitacao_id UUID NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    tipo tipo_prazo NOT NULL,
    data_prazo TIMESTAMP WITH TIME ZONE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prazos_licitacao FOREIGN KEY (licitacao_id)
        REFERENCES public.licitacoes(id) ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX idx_prazos_licitacao ON public.prazos(licitacao_id);
CREATE INDEX idx_prazos_data ON public.prazos(data_prazo);
CREATE INDEX idx_prazos_tipo ON public.prazos(tipo);

-- Criar trigger para atualização do timestamp
CREATE TRIGGER update_prazos_updated_at
    BEFORE UPDATE ON public.prazos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar política RLS
DROP POLICY IF EXISTS "Permitir acesso total aos prazos" ON public.prazos;
CREATE POLICY "Permitir acesso total aos prazos"
ON public.prazos
FOR ALL
USING (true)
WITH CHECK (true);

-- Habilitar RLS
ALTER TABLE public.prazos ENABLE ROW LEVEL SECURITY;

-- Recriar as funções que foram removidas
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