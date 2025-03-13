-- Função para atualizar a estrutura da tabela requisitos_documentacao
CREATE OR REPLACE FUNCTION public.atualizar_tabela_requisitos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se a tabela existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao') THEN
        -- Criar a tabela se não existir
        CREATE TABLE public.requisitos_documentacao (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            licitacao_id UUID NOT NULL REFERENCES public.licitacoes(id) ON DELETE CASCADE,
            descricao TEXT NOT NULL,
            observacoes TEXT,
            atendido BOOLEAN DEFAULT false,
            ordem INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    ELSE
        -- Garantir que todas as colunas necessárias existam
        -- Adicionar coluna observacoes se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao' 
                      AND column_name = 'observacoes') THEN
            ALTER TABLE public.requisitos_documentacao ADD COLUMN observacoes TEXT;
        END IF;

        -- Adicionar coluna atendido se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao' 
                      AND column_name = 'atendido') THEN
            ALTER TABLE public.requisitos_documentacao ADD COLUMN atendido BOOLEAN DEFAULT false;
        END IF;

        -- Adicionar coluna ordem se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao' 
                      AND column_name = 'ordem') THEN
            ALTER TABLE public.requisitos_documentacao ADD COLUMN ordem INTEGER DEFAULT 0;
        END IF;

        -- Remover colunas que não são mais necessárias
        -- Remover tipo_documento_id se existir e não for mais necessária
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao' 
                  AND column_name = 'tipo_documento_id') THEN
            ALTER TABLE public.requisitos_documentacao DROP COLUMN tipo_documento_id CASCADE;
        END IF;

        -- Remover data_limite se existir e não for mais necessária
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao' 
                  AND column_name = 'data_limite') THEN
            ALTER TABLE public.requisitos_documentacao DROP COLUMN data_limite CASCADE;
        END IF;

        -- Remover obrigatorio se existir e não for mais necessário
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao' 
                  AND column_name = 'obrigatorio') THEN
            ALTER TABLE public.requisitos_documentacao DROP COLUMN obrigatorio CASCADE;
        END IF;

        -- Remover constraint que não é mais necessária
        BEGIN
            ALTER TABLE public.requisitos_documentacao DROP CONSTRAINT IF EXISTS uk_licitacao_tipo_doc;
        EXCEPTION WHEN OTHERS THEN
            -- Ignora erro se a constraint não existir
            NULL;
        END;
    END IF;

    -- Criar índices necessários
    CREATE INDEX IF NOT EXISTS idx_requisitos_licitacao ON public.requisitos_documentacao(licitacao_id);
    CREATE INDEX IF NOT EXISTS idx_requisitos_ordem ON public.requisitos_documentacao(ordem);

    -- Criar trigger para atualizar o campo updated_at
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_requisitos_documentacao_updated_at') THEN
        CREATE TRIGGER update_requisitos_documentacao_updated_at
        BEFORE UPDATE ON public.requisitos_documentacao
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- Executar a função para atualizar a tabela
SELECT public.atualizar_tabela_requisitos(); 