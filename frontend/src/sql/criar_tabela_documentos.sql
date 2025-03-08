-- Função para criar ou atualizar as tabelas de documentos
CREATE OR REPLACE FUNCTION public.criar_tabelas_documentos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Criar enum para tipo de documento
    DROP TYPE IF EXISTS tipo_documento CASCADE;
    CREATE TYPE tipo_documento AS ENUM (
        'CONTRATO',
        'EDITAL',
        'PROPOSTA',
        'HABILITACAO',
        'RECURSO',
        'IMPUGNACAO',
        'OUTROS'
    );

    -- Criar tabela de tipos de documentos
    DROP TABLE IF EXISTS public.tipos_documentos CASCADE;
    CREATE TABLE public.tipos_documentos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nome VARCHAR(100) NOT NULL UNIQUE,
        descricao TEXT,
        obrigatorio BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Inserir tipos de documentos padrão
    INSERT INTO public.tipos_documentos (nome, descricao, obrigatorio)
    VALUES
        ('Contrato Social', 'Documento constitutivo da empresa', true),
        ('Certidão Negativa Federal', 'Certidão negativa de débitos federais', true),
        ('Certidão Negativa Estadual', 'Certidão negativa de débitos estaduais', true),
        ('Certidão Negativa Municipal', 'Certidão negativa de débitos municipais', true),
        ('CNPJ', 'Comprovante de inscrição e situação cadastral', true),
        ('Inscrição Estadual', 'Comprovante de inscrição estadual', false),
        ('Inscrição Municipal', 'Comprovante de inscrição municipal', false),
        ('Atestado de Capacidade Técnica', 'Atestado comprovando experiência prévia', false),
        ('Balanço Patrimonial', 'Demonstrações contábeis do último exercício', true),
        ('Certidão Negativa Trabalhista', 'Certidão negativa de débitos trabalhistas', true),
        ('FGTS', 'Certificado de regularidade do FGTS', true),
        ('RG dos Sócios', 'Documento de identificação dos sócios', true),
        ('CPF dos Sócios', 'CPF dos sócios', true),
        ('Alvará de Funcionamento', 'Licença para funcionamento', true),
        ('Certificado de Registro Cadastral', 'CRC do órgão licitante', false),
        ('Procuração', 'Documento de representação legal', false),
        ('Outros', 'Outros documentos', false)
    ON CONFLICT (nome) DO UPDATE SET
        descricao = EXCLUDED.descricao,
        obrigatorio = EXCLUDED.obrigatorio;

    -- Criar tabela de documentos do cliente
    DROP TABLE IF EXISTS public.documentos_cliente CASCADE;
    CREATE TABLE public.documentos_cliente (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
        tipo_documento_id UUID NOT NULL REFERENCES public.tipos_documentos(id),
        nome VARCHAR(200) NOT NULL,
        arquivo_url TEXT NOT NULL,
        data_validade TIMESTAMP WITH TIME ZONE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de documentos da licitação
    DROP TABLE IF EXISTS public.documentos_licitacao CASCADE;
    CREATE TABLE public.documentos_licitacao (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        licitacao_id UUID NOT NULL REFERENCES public.licitacoes(id) ON DELETE CASCADE,
        tipo_documento_id UUID NOT NULL REFERENCES public.tipos_documentos(id),
        nome VARCHAR(200) NOT NULL,
        arquivo_url TEXT NOT NULL,
        data_validade TIMESTAMP WITH TIME ZONE,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar tabela de requisitos de documentação
    DROP TABLE IF EXISTS public.requisitos_documentacao CASCADE;
    CREATE TABLE public.requisitos_documentacao (
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