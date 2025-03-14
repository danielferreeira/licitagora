-- Script para testar o sistema de requisitos após a reconstrução

-- 1. Verificar se a tabela requisitos_documentacao existe e sua estrutura
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'requisitos_documentacao'
ORDER BY 
    ordinal_position;

-- 2. Verificar se existem requisitos na tabela
SELECT COUNT(*) as total_requisitos FROM requisitos_documentacao;

-- 3. Verificar se a função adicionar_requisitos_teste existe
SELECT 
    proname, 
    proargnames, 
    proargtypes
FROM 
    pg_proc 
WHERE 
    proname = 'adicionar_requisitos_teste';

-- 4. Testar a adição de requisitos para uma licitação específica
-- Substitua o UUID abaixo pelo ID de uma licitação existente no seu sistema
DO $$
DECLARE
    v_licitacao_id UUID := '0d4a3aa7-d208-42f4-b2ad-874437e2c177'; -- Substitua pelo ID real
    v_count INTEGER;
BEGIN
    -- Verificar se a licitação existe
    SELECT COUNT(*) INTO v_count FROM licitacoes WHERE id = v_licitacao_id;
    
    IF v_count = 0 THEN
        RAISE NOTICE 'Licitação com ID % não encontrada. Por favor, substitua pelo ID de uma licitação existente.', v_licitacao_id;
        RETURN;
    END IF;
    
    -- Limpar requisitos existentes para esta licitação (opcional)
    DELETE FROM requisitos_documentacao WHERE licitacao_id = v_licitacao_id;
    RAISE NOTICE 'Requisitos existentes para a licitação % foram removidos', v_licitacao_id;
    
    -- Adicionar requisitos de teste usando a função
    PERFORM adicionar_requisitos_teste(v_licitacao_id);
    
    -- Verificar se os requisitos foram adicionados
    SELECT COUNT(*) INTO v_count FROM requisitos_documentacao WHERE licitacao_id = v_licitacao_id;
    RAISE NOTICE 'Foram adicionados % requisitos para a licitação %', v_count, v_licitacao_id;
END$$;

-- 5. Listar os requisitos adicionados
-- Substitua o UUID abaixo pelo mesmo ID usado acima
SELECT 
    id, 
    descricao, 
    observacoes, 
    atendido, 
    ordem, 
    created_at
FROM 
    requisitos_documentacao
WHERE 
    licitacao_id = '0d4a3aa7-d208-42f4-b2ad-874437e2c177' -- Substitua pelo mesmo ID usado acima
ORDER BY 
    ordem; 