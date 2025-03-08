-- Remover objetos existentes
DROP FUNCTION IF EXISTS public.buscar_documentos_vencimento CASCADE;
DROP FUNCTION IF EXISTS public.buscar_proximos_prazos CASCADE;
DROP FUNCTION IF EXISTS public.importar_prazos_licitacoes CASCADE;
DROP FUNCTION IF EXISTS public.processar_requisitos_edital CASCADE;
DROP FUNCTION IF EXISTS public.criar_tabelas_documentos CASCADE;

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
    ('Edital', 'Edital da licitação', true),
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
    descricao TEXT NOT NULL,
    atendido BOOLEAN DEFAULT false,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_doc_cliente_cliente ON public.documentos_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_doc_cliente_tipo ON public.documentos_cliente(tipo_documento_id);
CREATE INDEX IF NOT EXISTS idx_doc_licitacao_licitacao ON public.documentos_licitacao(licitacao_id);
CREATE INDEX IF NOT EXISTS idx_doc_licitacao_tipo ON public.documentos_licitacao(tipo_documento_id);
CREATE INDEX IF NOT EXISTS idx_requisitos_licitacao ON public.requisitos_documentacao(licitacao_id);

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

-- Função para buscar documentos próximos do vencimento
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

-- Função para processar requisitos do edital
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