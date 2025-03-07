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
        ramos_atividade TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_clientes_razao_social ON public.clientes(razao_social);
    CREATE INDEX IF NOT EXISTS idx_clientes_cnpj ON public.clientes(cnpj);
    CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);

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