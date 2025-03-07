-- Função para criar ou atualizar as tabelas de documentos
CREATE OR REPLACE FUNCTION public.criar_tabelas_documentos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Criar enum para tipo de documento
    DO $$
    BEGIN
        CREATE TYPE tipo_documento AS ENUM (
            'CONTRATO',
            'EDITAL',
            'PROPOSTA',
            'HABILITACAO',
            'RECURSO',
            'IMPUGNACAO',
            'OUTROS'
        );
    EXCEPTION
        WHEN duplicate_object THEN null;
    END $$;

    -- Criar tabela de tipos de documentos
    CREATE TABLE IF NOT EXISTS public.tipos_documentos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        obrigatorio BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de documentos do cliente
    CREATE TABLE IF NOT EXISTS public.documentos_cliente (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
        tipo_documento_id UUID NOT NULL REFERENCES public.tipos_documentos(id),
        nome VARCHAR(200) NOT NULL,
        tipo tipo_documento NOT NULL,
        arquivo_url TEXT NOT NULL,
        data_validade TIMESTAMP WITH TIME ZONE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de documentos da licitação
    CREATE TABLE IF NOT EXISTS public.documentos_licitacao (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        licitacao_id UUID NOT NULL REFERENCES public.licitacoes(id) ON DELETE CASCADE,
        tipo_documento_id UUID NOT NULL REFERENCES public.tipos_documentos(id),
        nome VARCHAR(200) NOT NULL,
        tipo tipo_documento NOT NULL,
        arquivo_url TEXT NOT NULL,
        data_validade TIMESTAMP WITH TIME ZONE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de requisitos de documentação
    CREATE TABLE IF NOT EXISTS public.requisitos_documentacao (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        licitacao_id UUID NOT NULL REFERENCES public.licitacoes(id) ON DELETE CASCADE,
        tipo_documento_id UUID NOT NULL REFERENCES public.tipos_documentos(id),
        descricao TEXT NOT NULL,
        obrigatorio BOOLEAN DEFAULT true,
        data_limite TIMESTAMP WITH TIME ZONE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uk_licitacao_tipo_doc UNIQUE(licitacao_id, tipo_documento_id)
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_doc_cliente_cliente ON public.documentos_cliente(cliente_id);
    CREATE INDEX IF NOT EXISTS idx_doc_cliente_tipo ON public.documentos_cliente(tipo_documento_id);
    CREATE INDEX IF NOT EXISTS idx_doc_licitacao_licitacao ON public.documentos_licitacao(licitacao_id);
    CREATE INDEX IF NOT EXISTS idx_doc_licitacao_tipo ON public.documentos_licitacao(tipo_documento_id);
    CREATE INDEX IF NOT EXISTS idx_requisitos_licitacao ON public.requisitos_documentacao(licitacao_id);
    CREATE INDEX IF NOT EXISTS idx_requisitos_tipo ON public.requisitos_documentacao(tipo_documento_id);

    -- Criar triggers para updated_at
    DROP TRIGGER IF EXISTS update_tipos_documentos_updated_at ON public.tipos_documentos;
    DROP TRIGGER IF EXISTS update_documentos_cliente_updated_at ON public.documentos_cliente;
    DROP TRIGGER IF EXISTS update_documentos_licitacao_updated_at ON public.documentos_licitacao;
    DROP TRIGGER IF EXISTS update_requisitos_documentacao_updated_at ON public.requisitos_documentacao;
    
    CREATE TRIGGER update_tipos_documentos_updated_at
        BEFORE UPDATE ON public.tipos_documentos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_documentos_cliente_updated_at
        BEFORE UPDATE ON public.documentos_cliente
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_documentos_licitacao_updated_at
        BEFORE UPDATE ON public.documentos_licitacao
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER update_requisitos_documentacao_updated_at
        BEFORE UPDATE ON public.requisitos_documentacao
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Criar políticas RLS
    DROP POLICY IF EXISTS "Permitir acesso total aos tipos de documentos" ON public.tipos_documentos;
    DROP POLICY IF EXISTS "Permitir acesso total aos documentos do cliente" ON public.documentos_cliente;
    DROP POLICY IF EXISTS "Permitir acesso total aos documentos da licitacao" ON public.documentos_licitacao;
    DROP POLICY IF EXISTS "Permitir acesso total aos requisitos" ON public.requisitos_documentacao;
    
    CREATE POLICY "Permitir acesso total aos tipos de documentos"
    ON public.tipos_documentos FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Permitir acesso total aos documentos do cliente"
    ON public.documentos_cliente FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Permitir acesso total aos documentos da licitacao"
    ON public.documentos_licitacao FOR ALL USING (true) WITH CHECK (true);

    CREATE POLICY "Permitir acesso total aos requisitos"
    ON public.requisitos_documentacao FOR ALL USING (true) WITH CHECK (true);

    -- Habilitar RLS
    ALTER TABLE public.tipos_documentos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.documentos_cliente ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.documentos_licitacao ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.requisitos_documentacao ENABLE ROW LEVEL SECURITY;
END;
$$; 