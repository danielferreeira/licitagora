-- Script para adicionar requisitos de teste para a licitação

-- Adicionar requisitos de teste para uma licitação específica
-- Substitua o UUID abaixo pelo ID da licitação que deseja testar
DO $$
DECLARE
    -- Use o ID de uma licitação existente no seu sistema
    v_licitacao_id UUID := '0d4a3aa7-d208-42f4-b2ad-874437e2c177'; 
    v_max_ordem INTEGER;
BEGIN
    -- Verificar se a licitação existe
    IF NOT EXISTS (SELECT 1 FROM licitacoes WHERE id = v_licitacao_id) THEN
        RAISE EXCEPTION 'Licitação com ID % não encontrada', v_licitacao_id;
    END IF;

    -- Obter a ordem máxima atual
    SELECT COALESCE(MAX(ordem), 0) INTO v_max_ordem FROM requisitos_documentacao WHERE licitacao_id = v_licitacao_id;
    
    -- Inserir requisitos de teste
    INSERT INTO requisitos_documentacao (
        licitacao_id,
        descricao,
        observacoes,
        atendido,
        ordem
    ) VALUES 
    (
        v_licitacao_id,
        'Certidão Negativa de Débitos Federais',
        'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
        false,
        v_max_ordem + 1
    ),
    (
        v_licitacao_id,
        'Certidão Negativa de Débitos Estaduais',
        'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
        false,
        v_max_ordem + 2
    ),
    (
        v_licitacao_id,
        'Certidão Negativa de Débitos Municipais',
        'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
        false,
        v_max_ordem + 3
    ),
    (
        v_licitacao_id,
        'Certidão Negativa de Débitos Trabalhistas',
        'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
        false,
        v_max_ordem + 4
    ),
    (
        v_licitacao_id,
        'Certificado de Regularidade do FGTS',
        'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
        false,
        v_max_ordem + 5
    ),
    (
        v_licitacao_id,
        'Contrato Social ou Estatuto',
        'Categoria: JURIDICA
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Habilitação Jurídica',
        false,
        v_max_ordem + 6
    ),
    (
        v_licitacao_id,
        'Atestado de Capacidade Técnica',
        'Categoria: TECNICA
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Qualificação Técnica',
        false,
        v_max_ordem + 7
    ),
    (
        v_licitacao_id,
        'Balanço Patrimonial',
        'Categoria: FINANCEIRA
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Qualificação Econômico-Financeira',
        false,
        v_max_ordem + 8
    ),
    (
        v_licitacao_id,
        'Declaração de que não emprega menor',
        'Categoria: DECLARACOES
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Declarações',
        false,
        v_max_ordem + 9
    ),
    (
        v_licitacao_id,
        'Declaração de inexistência de fato impeditivo',
        'Categoria: DECLARACOES
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Declarações',
        false,
        v_max_ordem + 10
    );

    RAISE NOTICE 'Adicionados 10 requisitos de teste para a licitação %', v_licitacao_id;
END $$;

-- Verificar se os requisitos foram adicionados
SELECT COUNT(*) FROM requisitos_documentacao 
WHERE licitacao_id = '0d4a3aa7-d208-42f4-b2ad-874437e2c177'; 