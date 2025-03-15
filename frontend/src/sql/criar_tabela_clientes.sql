-- Função para atualizar o timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar ou atualizar a tabela de clientes
CREATE OR REPLACE FUNCTION public.criar_tabela_clientes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    -- Criar a tabela se não existir
    CREATE TABLE IF NOT EXISTS public.clientes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        razao_social VARCHAR(200) NOT NULL,
        cnpj VARCHAR(14) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL,
        telefone VARCHAR(11),
        cep VARCHAR(8),
        endereco VARCHAR(200),
        numero VARCHAR(20),
        bairro VARCHAR(100),
        cidade VARCHAR(100),
        estado VARCHAR(2),
        cnaes JSONB DEFAULT '[]'::JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Verificar se a coluna ramos_atividade ainda existe
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'ramos_atividade'
    ) INTO column_exists;

    -- Se a coluna ramos_atividade existir, migrar os dados para cnaes e remover a coluna
    IF column_exists THEN
        -- Migrar dados de ramos_atividade para cnaes
        UPDATE public.clientes
        SET cnaes = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'codigo', '00.00-0-' || LPAD(ordinality::text, 2, '0'),
                    'descricao', value,
                    'tipo', CASE WHEN ordinality = 1 THEN 'principal' ELSE 'secundaria' END
                )
            )
            FROM unnest(ramos_atividade) WITH ORDINALITY
        )
        WHERE ramos_atividade IS NOT NULL AND array_length(ramos_atividade, 1) > 0;

        -- Remover a coluna ramos_atividade
        ALTER TABLE public.clientes DROP COLUMN IF EXISTS ramos_atividade;
    END IF;

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_clientes_razao_social ON public.clientes(razao_social);
    CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON public.clientes(cnpj);
    CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
    CREATE INDEX IF NOT EXISTS idx_clientes_cnaes ON public.clientes USING GIN (cnaes);

    -- Remover trigger existente se houver
    DROP TRIGGER IF EXISTS update_clientes_updated_at ON public.clientes;
    
    -- Criar novo trigger
    CREATE TRIGGER update_clientes_updated_at
        BEFORE UPDATE ON public.clientes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Permitir acesso total aos clientes" ON public.clientes;
    
    -- Criar nova política
    CREATE POLICY "Permitir acesso total aos clientes"
    ON public.clientes
    FOR ALL
    USING (true)
    WITH CHECK (true);

    -- Habilitar RLS
    ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
END;
$$; 