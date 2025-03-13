-- Inserir dados de teste apenas se as tabelas estiverem vazias
DO $$
DECLARE
    v_count_clientes INTEGER;
    v_count_licitacoes INTEGER;
    v_cliente_id UUID;
BEGIN
    -- Verificar se já existem dados
    SELECT COUNT(*) INTO v_count_clientes FROM clientes;
    SELECT COUNT(*) INTO v_count_licitacoes FROM licitacoes;
    
    RAISE NOTICE 'Clientes existentes: %, Licitações existentes: %', v_count_clientes, v_count_licitacoes;
    
    -- Inserir dados de teste apenas se não existirem
    IF v_count_clientes = 0 THEN
        RAISE NOTICE 'Inserindo clientes de teste...';
        
        -- Inserir clientes de teste
        INSERT INTO clientes (razao_social, cnpj, email, telefone, endereco, cidade, estado, cep)
        VALUES 
            ('Empresa ABC Ltda', '12345678000190', 'contato@empresaabc.com.br', '1133334444', 'Rua A, 123', 'São Paulo', 'SP', '01234567'),
            ('Comércio XYZ S.A.', '98765432000110', 'contato@comercioxyz.com.br', '1144445555', 'Av. B, 456', 'Rio de Janeiro', 'RJ', '20000000'),
            ('Indústria 123 Ltda', '45678912000134', 'contato@industria123.com.br', '1155556666', 'Rua C, 789', 'Belo Horizonte', 'MG', '30000000')
        RETURNING id INTO v_cliente_id;
        
        RAISE NOTICE 'Clientes inseridos com sucesso!';
    ELSE
        -- Obter um ID de cliente existente para as licitações
        SELECT id INTO v_cliente_id FROM clientes LIMIT 1;
    END IF;
    
    IF v_count_licitacoes = 0 AND v_cliente_id IS NOT NULL THEN
        RAISE NOTICE 'Inserindo licitações de teste...';
        
        -- Inserir licitações de teste
        INSERT INTO licitacoes (
            numero, cliente_id, orgao, objeto, modalidade, 
            valor_estimado, lucro_estimado, valor_final, lucro_final,
            data_abertura, data_fechamento, status, foi_ganha
        )
        VALUES 
            -- Licitação concluída e ganha
            ('001/2023', v_cliente_id, 'Prefeitura Municipal', 'Fornecimento de materiais de escritório', 'PREGAO_ELETRONICO',
             50000.00, 15000.00, 48000.00, 14000.00,
             CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE - INTERVAL '2 months', 'CONCLUIDA', TRUE),
             
            -- Licitação concluída e perdida
            ('002/2023', v_cliente_id, 'Secretaria de Educação', 'Serviços de manutenção predial', 'CONCORRENCIA',
             100000.00, 30000.00, NULL, NULL,
             CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE - INTERVAL '3 months', 'CONCLUIDA', FALSE),
             
            -- Licitação em andamento
            ('003/2023', v_cliente_id, 'Secretaria de Saúde', 'Fornecimento de equipamentos médicos', 'PREGAO_ELETRONICO',
             200000.00, 60000.00, NULL, NULL,
             CURRENT_DATE - INTERVAL '1 month', NULL, 'EM_ANDAMENTO', NULL),
             
            -- Outra licitação concluída e ganha
            ('004/2023', v_cliente_id, 'Tribunal de Justiça', 'Serviços de limpeza', 'TOMADA_DE_PRECO',
             75000.00, 22500.00, 70000.00, 21000.00,
             CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE - INTERVAL '5 months', 'CONCLUIDA', TRUE),
             
            -- Outra licitação em andamento
            ('005/2023', v_cliente_id, 'Ministério Público', 'Fornecimento de mobiliário', 'PREGAO_PRESENCIAL',
             150000.00, 45000.00, NULL, NULL,
             CURRENT_DATE - INTERVAL '2 weeks', NULL, 'EM_ANDAMENTO', NULL);
        
        RAISE NOTICE 'Licitações inseridas com sucesso!';
    END IF;
END $$; 