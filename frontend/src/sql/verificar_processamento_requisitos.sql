-- Script para verificar e testar o processamento de requisitos do edital

-- 1. Verificar se a função processar_requisitos_edital existe
SELECT 
    proname, 
    proargnames, 
    proargtypes,
    prosrc
FROM 
    pg_proc 
WHERE 
    proname = 'processar_requisitos_edital';

-- 2. Verificar se o tipo requisito_result existe
SELECT 
    typname, 
    typtype, 
    typelem
FROM 
    pg_type 
WHERE 
    typname = 'requisito_result';

-- 3. Criar uma função para testar o processamento de requisitos com um texto de exemplo
CREATE OR REPLACE FUNCTION testar_processamento_requisitos(
    p_licitacao_id uuid
) RETURNS SETOF requisito_result AS $$
DECLARE
    v_texto_exemplo TEXT;
BEGIN
    -- Verificar se a licitação existe
    IF NOT EXISTS (SELECT 1 FROM licitacoes WHERE id = p_licitacao_id) THEN
        RAISE EXCEPTION 'Licitação não encontrada';
    END IF;
    
    -- Texto de exemplo com requisitos de documentação
    v_texto_exemplo := '
DOCUMENTOS DE HABILITAÇÃO

Habilitação Jurídica:
1. Registro comercial, no caso de empresa individual;
2. Ato constitutivo, estatuto ou contrato social em vigor, devidamente registrado, em se tratando de sociedades comerciais;
3. Documentos de eleição dos atuais administradores, tratando-se de sociedades por ações;
4. Decreto de autorização e ato de registro, tratando-se de empresa ou sociedade estrangeira em funcionamento no País.

Regularidade Fiscal:
5. Prova de inscrição no Cadastro Nacional de Pessoas Jurídicas (CNPJ);
6. Certidão Negativa de Débitos Federais, com prazo de validade de 30 dias;
7. Certidão Negativa de Débitos Estaduais;
8. Certidão Negativa de Débitos Municipais;
9. Certificado de Regularidade do FGTS - CRF;
10. Certidão Negativa de Débitos Trabalhistas (CNDT).

Qualificação Técnica:
11. Registro ou inscrição na entidade profissional competente;
12. Comprovação de aptidão para desempenho de atividade pertinente e compatível com o objeto da licitação;
13. Atestado(s) de capacidade técnica, fornecido(s) por pessoa jurídica de direito público ou privado.

Qualificação Econômico-Financeira:
14. Balanço patrimonial e demonstrações contábeis do último exercício social;
15. Certidão negativa de falência ou concordata expedida pelo distribuidor da sede da pessoa jurídica.

Declarações:
16. Declaração de que não emprega menor de 18 anos em trabalho noturno, perigoso ou insalubre;
17. Declaração de inexistência de fato superveniente impeditivo da habilitação.

PROPOSTA COMERCIAL
A proposta deverá conter:
- Preço unitário e total;
- Prazo de validade da proposta;
- Prazo de entrega.
    ';
    
    -- Limpar requisitos existentes para esta licitação
    DELETE FROM requisitos_documentacao WHERE licitacao_id = p_licitacao_id;
    
    -- Processar o texto de exemplo
    RETURN QUERY
    SELECT * FROM processar_requisitos_edital(v_texto_exemplo, p_licitacao_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Conceder permissões para a função de teste
DO $$
BEGIN
    GRANT EXECUTE ON FUNCTION testar_processamento_requisitos(uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION testar_processamento_requisitos(uuid) TO anon;
    GRANT EXECUTE ON FUNCTION testar_processamento_requisitos(uuid) TO service_role;
    
    RAISE NOTICE 'Permissões da função testar_processamento_requisitos configuradas com sucesso';
END$$;

-- 5. Testar o processamento de requisitos com uma licitação específica
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
    
    -- Executar o teste
    PERFORM testar_processamento_requisitos(v_licitacao_id);
    
    -- Verificar se os requisitos foram adicionados
    SELECT COUNT(*) INTO v_count FROM requisitos_documentacao WHERE licitacao_id = v_licitacao_id;
    RAISE NOTICE 'Foram processados % requisitos para a licitação %', v_count, v_licitacao_id;
END$$;

-- 6. Listar os requisitos processados
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