-- Função para criar ou atualizar a tabela de prazos
CREATE OR REPLACE FUNCTION public.criar_tabela_prazos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Criar enum para tipo de prazo
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

    -- Criar a tabela se não existir
    CREATE TABLE IF NOT EXISTS public.prazos (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        licitacao_id UUID NOT NULL REFERENCES public.licitacoes(id) ON DELETE CASCADE,
        titulo VARCHAR(200) NOT NULL,
        tipo tipo_prazo NOT NULL,
        data_prazo TIMESTAMP WITH TIME ZONE NOT NULL,
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_prazos_licitacao ON public.prazos(licitacao_id);
    CREATE INDEX IF NOT EXISTS idx_prazos_data ON public.prazos(data_prazo);
    CREATE INDEX IF NOT EXISTS idx_prazos_tipo ON public.prazos(tipo);

    -- Remover trigger existente se houver
    DROP TRIGGER IF EXISTS update_prazos_updated_at ON public.prazos;
    
    -- Criar novo trigger
    CREATE TRIGGER update_prazos_updated_at
        BEFORE UPDATE ON public.prazos
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Remover política existente se houver
    DROP POLICY IF EXISTS "Permitir acesso total aos prazos" ON public.prazos;
    
    -- Criar nova política
    CREATE POLICY "Permitir acesso total aos prazos"
    ON public.prazos
    FOR ALL
    USING (true)
    WITH CHECK (true);

    -- Habilitar RLS
    ALTER TABLE public.prazos ENABLE ROW LEVEL SECURITY;

    -- Criar função para importar prazos das licitações
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
END;
$$; 