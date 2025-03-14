-- Script para verificar e corrigir problemas na tabela de requisitos

-- 1. Verificar se a tabela existe e tem a estrutura correta
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao') THEN
        RAISE NOTICE 'A tabela requisitos_documentacao não existe!';
        
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
        
        RAISE NOTICE 'Tabela requisitos_documentacao criada com sucesso!';
    ELSE
        RAISE NOTICE 'A tabela requisitos_documentacao já existe.';
    END IF;
END $$;

-- 2. Verificar se há requisitos na tabela
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM requisitos_documentacao;
    RAISE NOTICE 'Total de requisitos na tabela: %', v_count;
END $$;

-- 3. Verificar se há requisitos para uma licitação específica (substitua o UUID pelo ID da sua licitação)
DO $$
DECLARE
    v_licitacao_id UUID := '0d4a3aa7-d208-42f4-b2ad-874437e2c177'; -- Substitua pelo ID da sua licitação
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM requisitos_documentacao WHERE licitacao_id = v_licitacao_id;
    RAISE NOTICE 'Total de requisitos para a licitação %: %', v_licitacao_id, v_count;
END $$;

-- 4. Verificar se há permissões corretas para a tabela
DO $$
BEGIN
    -- Conceder permissões para o usuário anônimo
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.requisitos_documentacao TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.requisitos_documentacao TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.requisitos_documentacao TO service_role;
    
    -- Conceder permissões para a sequência de ID se existir
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public' AND sequence_name = 'requisitos_documentacao_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE public.requisitos_documentacao_id_seq TO anon;
        GRANT USAGE, SELECT ON SEQUENCE public.requisitos_documentacao_id_seq TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE public.requisitos_documentacao_id_seq TO service_role;
    END IF;
    
    RAISE NOTICE 'Permissões concedidas para a tabela requisitos_documentacao.';
END $$;

-- 5. Verificar se a função processar_requisitos_edital está funcionando corretamente
DO $$
DECLARE
    v_licitacao_id UUID := '0d4a3aa7-d208-42f4-b2ad-874437e2c177'; -- Substitua pelo ID da sua licitação
    v_count INTEGER;
BEGIN
    -- Inserir um requisito de teste para verificar se a função está funcionando
    INSERT INTO requisitos_documentacao (
        licitacao_id,
        descricao,
        observacoes,
        atendido,
        ordem
    ) VALUES (
        v_licitacao_id,
        'Requisito de teste - Por favor, remova após verificação',
        'Este é um requisito de teste inserido para verificar se a tabela está funcionando corretamente.',
        false,
        9999
    );
    
    SELECT COUNT(*) INTO v_count FROM requisitos_documentacao WHERE licitacao_id = v_licitacao_id;
    RAISE NOTICE 'Total de requisitos após inserção de teste: %', v_count;
END $$;

-- 6. Verificar se há algum trigger que possa estar interferindo
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name, event_manipulation, action_statement 
              FROM information_schema.triggers 
              WHERE event_object_table = 'requisitos_documentacao') LOOP
        RAISE NOTICE 'Trigger encontrado: % (%) - %', r.trigger_name, r.event_manipulation, r.action_statement;
    END LOOP;
END $$; 