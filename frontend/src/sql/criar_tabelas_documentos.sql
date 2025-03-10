-- Função para criar tabelas de documentos
CREATE OR REPLACE FUNCTION public.criar_tabelas_documentos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Criar tipo enum para tipos de documentos
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento') THEN
        CREATE TYPE tipo_documento AS ENUM (
            'EDITAL',
            'PROPOSTA',
            'HABILITACAO',
            'CONTRATO',
            'ADITIVO',
            'OUTROS'
        );
    END IF;

    -- Criar tabela de tipos de documentos
    CREATE TABLE IF NOT EXISTS public.tipos_documentos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(100) NOT NULL,
        descricao TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de documentos de cliente
    CREATE TABLE IF NOT EXISTS public.documentos_cliente (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
        tipo_documento_id UUID NOT NULL REFERENCES public.tipos_documentos(id),
        nome VARCHAR(255) NOT NULL,
        arquivo_url TEXT NOT NULL,
        data_validade TIMESTAMP WITH TIME ZONE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de documentos de licitação
    CREATE TABLE IF NOT EXISTS public.documentos_licitacao (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        licitacao_id UUID NOT NULL REFERENCES public.licitacoes(id) ON DELETE CASCADE,
        tipo_documento_id UUID NOT NULL REFERENCES public.tipos_documentos(id),
        nome VARCHAR(255) NOT NULL,
        arquivo_url TEXT NOT NULL,
        data_validade TIMESTAMP WITH TIME ZONE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de requisitos de documentação
    CREATE TABLE IF NOT EXISTS public.requisitos_documentacao (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        licitacao_id UUID NOT NULL REFERENCES public.licitacoes(id) ON DELETE CASCADE,
        descricao TEXT NOT NULL,
        atendido BOOLEAN DEFAULT FALSE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_documentos_cliente_cliente_id ON public.documentos_cliente(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_documentos_cliente_tipo_documento_id ON public.documentos_cliente(tipo_documento_id);
    CREATE INDEX IF NOT EXISTS idx_documentos_licitacao_licitacao_id ON public.documentos_licitacao(licitacao_id);
    CREATE INDEX IF NOT EXISTS idx_documentos_licitacao_tipo_documento_id ON public.documentos_licitacao(tipo_documento_id);
    CREATE INDEX IF NOT EXISTS idx_requisitos_documentacao_licitacao_id ON public.requisitos_documentacao(licitacao_id);

    -- Criar triggers para atualização de timestamps
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $function$;

    -- Aplicar triggers
    DROP TRIGGER IF EXISTS update_tipos_documentos_updated_at ON public.tipos_documentos;
    CREATE TRIGGER update_tipos_documentos_updated_at
        BEFORE UPDATE ON public.tipos_documentos
        FOR EACH ROW
        EXECUTE PROCEDURE public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_documentos_cliente_updated_at ON public.documentos_cliente;
    CREATE TRIGGER update_documentos_cliente_updated_at
        BEFORE UPDATE ON public.documentos_cliente
        FOR EACH ROW
        EXECUTE PROCEDURE public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_documentos_licitacao_updated_at ON public.documentos_licitacao;
    CREATE TRIGGER update_documentos_licitacao_updated_at
        BEFORE UPDATE ON public.documentos_licitacao
        FOR EACH ROW
        EXECUTE PROCEDURE public.update_updated_at_column();

    DROP TRIGGER IF EXISTS update_requisitos_documentacao_updated_at ON public.requisitos_documentacao;
    CREATE TRIGGER update_requisitos_documentacao_updated_at
        BEFORE UPDATE ON public.requisitos_documentacao
        FOR EACH ROW
        EXECUTE PROCEDURE public.update_updated_at_column();

    -- Criar políticas RLS
    ALTER TABLE public.tipos_documentos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.documentos_cliente ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.documentos_licitacao ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.requisitos_documentacao ENABLE ROW LEVEL SECURITY;

    -- Políticas para tipos_documentos
    DROP POLICY IF EXISTS "Tipos documentos são visíveis para usuários autenticados" ON public.tipos_documentos;
    CREATE POLICY "Tipos documentos são visíveis para usuários autenticados"
        ON public.tipos_documentos FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

    -- Políticas para documentos_cliente
    DROP POLICY IF EXISTS "Documentos de cliente são visíveis para usuários autenticados" ON public.documentos_cliente;
    CREATE POLICY "Documentos de cliente são visíveis para usuários autenticados"
        ON public.documentos_cliente FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

    -- Políticas para documentos_licitacao
    DROP POLICY IF EXISTS "Documentos de licitação são visíveis para usuários autenticados" ON public.documentos_licitacao;
    CREATE POLICY "Documentos de licitação são visíveis para usuários autenticados"
        ON public.documentos_licitacao FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);

    -- Políticas para requisitos_documentacao
    DROP POLICY IF EXISTS "Requisitos são visíveis para usuários autenticados" ON public.requisitos_documentacao;
    CREATE POLICY "Requisitos são visíveis para usuários autenticados"
        ON public.requisitos_documentacao FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
END;
$$; 