-- Script para reconstruir completamente o sistema de requisitos
-- Execute este script diretamente no Supabase SQL Editor

-- 1. Verificar e recriar o tipo requisito_result
DO $$
BEGIN
    -- Remover o tipo se existir
    DROP TYPE IF EXISTS requisito_result CASCADE;
    
    -- Criar o tipo novamente
    CREATE TYPE requisito_result AS (
        id uuid,
        licitacao_id uuid,
        descricao text,
        observacoes text,
        atendido boolean,
        ordem integer,
        created_at timestamp with time zone,
        updated_at timestamp with time zone
    );
    
    RAISE NOTICE 'Tipo requisito_result recriado com sucesso';
END$$;

-- 2. Verificar e recriar a tabela requisitos_documentacao
DO $$
BEGIN
    -- Verificar se a tabela existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao') THEN
        -- Fazer backup dos dados existentes se necessário
        CREATE TABLE IF NOT EXISTS requisitos_documentacao_backup AS 
        SELECT * FROM requisitos_documentacao;
        
        -- Remover a tabela existente
        DROP TABLE requisitos_documentacao CASCADE;
        
        RAISE NOTICE 'Tabela requisitos_documentacao removida e dados salvos em backup';
    END IF;
    
    -- Criar a tabela novamente
    CREATE TABLE requisitos_documentacao (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        licitacao_id UUID NOT NULL REFERENCES licitacoes(id) ON DELETE CASCADE,
        descricao TEXT NOT NULL,
        observacoes TEXT,
        atendido BOOLEAN DEFAULT false,
        ordem INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Restaurar dados do backup se existir
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao_backup') THEN
        INSERT INTO requisitos_documentacao (id, licitacao_id, descricao, observacoes, atendido, ordem, created_at, updated_at)
        SELECT id, licitacao_id, descricao, observacoes, atendido, ordem, created_at, updated_at
        FROM requisitos_documentacao_backup;
        
        RAISE NOTICE 'Dados restaurados do backup';
    END IF;
    
    RAISE NOTICE 'Tabela requisitos_documentacao recriada com sucesso';
END$$;

-- 3. Configurar permissões da tabela
DO $$
BEGIN
    -- Conceder permissões para os perfis do Supabase
    GRANT ALL ON TABLE requisitos_documentacao TO authenticated;
    GRANT ALL ON TABLE requisitos_documentacao TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE requisitos_documentacao TO anon;
    
    RAISE NOTICE 'Permissões da tabela configuradas com sucesso';
END$$;

-- 4. Recriar a função processar_requisitos_edital
DROP FUNCTION IF EXISTS processar_requisitos_edital;

CREATE OR REPLACE FUNCTION processar_requisitos_edital(
    p_texto text,
    p_licitacao_id uuid
) RETURNS SETOF requisito_result AS $$
DECLARE
    v_linha TEXT;
    v_texto_requisito TEXT := '';
    v_capturando_requisitos BOOLEAN := false;
    v_contador INTEGER := 0;
    v_secao_atual TEXT := '';
    v_subsecao_atual TEXT := '';
    v_categoria_atual TEXT := '';
    v_linhas TEXT[];
    v_resultado requisito_result;
    v_prazo_validade TEXT := '';
    v_ultima_linha_numerada TEXT := '';
    v_ultimo_numero TEXT := '';
    v_max_ordem INTEGER;
BEGIN
    -- Verificar se a licitação existe
    IF NOT EXISTS (SELECT 1 FROM licitacoes WHERE id = p_licitacao_id) THEN
        RAISE EXCEPTION 'Licitação não encontrada';
    END IF;

    -- Excluir requisitos existentes para esta licitação
    DELETE FROM requisitos_documentacao WHERE licitacao_id = p_licitacao_id;
    
    -- Iniciar contador de ordem
    v_contador := 1;

    -- Dividir o texto em linhas e limpar espaços extras
    v_linhas := string_to_array(p_texto, E'\n');
    
    -- Processar linha por linha
    FOR i IN 1..array_length(v_linhas, 1) LOOP
        -- Limpar a linha atual
        v_linha := trim(regexp_replace(v_linhas[i], '\s+', ' ', 'g'));
        
        -- Pular linhas vazias
        CONTINUE WHEN length(v_linha) < 3;
        
        -- Identificar seções principais de habilitação
        IF v_linha ~* '(HABILITAÇÃO|DOCUMENTOS DE HABILITAÇÃO|DOCUMENTAÇÃO PARA HABILITAÇÃO|DOCUMENTOS NECESSÁRIOS|REQUISITOS)' THEN
            v_capturando_requisitos := true;
            v_secao_atual := v_linha;
            CONTINUE;
        END IF;

        -- Identificar subseções de habilitação
        IF v_capturando_requisitos AND v_linha ~* '(Habilitação Jurídica|Regularidade Fiscal|Qualificação Técnica|Qualificação Econômico.Financeira|Declarações|MICROEMPRESA.*ME|EMPRESA DE PEQUENO PORTE.*EPP)' THEN
            v_subsecao_atual := v_linha;
            -- Extrair categoria principal
            v_categoria_atual := CASE 
                WHEN v_linha ~* 'Jurídica' THEN 'JURIDICA'
                WHEN v_linha ~* 'Fiscal' THEN 'FISCAL'
                WHEN v_linha ~* 'Técnica' THEN 'TECNICA'
                WHEN v_linha ~* 'Econômico.Financeira' THEN 'FINANCEIRA'
                WHEN v_linha ~* 'Declarações' THEN 'DECLARACOES'
                WHEN v_linha ~* '(MICROEMPRESA|ME|EPP)' THEN 'ME_EPP'
                ELSE 'OUTROS'
            END;
            CONTINUE;
        END IF;

        -- Capturar prazo de validade se mencionado
        IF v_linha ~* '(prazo.*validade|válido.*por|dentro.*prazo).*(\d+).*dias' THEN
            v_prazo_validade := regexp_replace(v_linha, '.*?(\d+).*dias.*', '\1 dias', 'i');
        END IF;

        -- Identificar fim de seção
        IF v_linha ~* '(PROPOSTA|PREÇO|PAGAMENTO|DISPOSIÇÕES FINAIS|ANEXO|ENCERRAMENTO)' AND v_capturando_requisitos THEN
            v_capturando_requisitos := false;
            v_secao_atual := '';
            v_subsecao_atual := '';
            v_categoria_atual := '';
        END IF;

        -- Processar linha se estiver capturando requisitos
        IF v_capturando_requisitos AND length(v_linha) > 5 THEN
            -- Extrair número do item se presente
            IF v_linha ~* '^(\d+\.[\d\.]*|\([a-z]\))' THEN
                v_ultimo_numero := regexp_replace(v_linha, '^((\d+\.[\d\.]*|\([a-z]\))).*', '\1');
                v_ultima_linha_numerada := v_linha;
            END IF;

            -- Identificar padrões comuns de requisitos
            IF v_linha ~* '^(\d+\.[\d\.]*|\([a-z]\)|\-|\•|[a-z]\.|\[\d+\]|[IVX]+\.)' OR  -- Vários tipos de numeração/bullets
               v_linha ~* '^(apresentar|fornecer|comprovar|demonstrar|possuir|prova)' OR  -- Verbos comuns
               v_linha ~* '(certidão|atestado|declaração|comprovante|documento|registro|inscrição|alvará|licença)' OR  -- Documentos comuns
               v_linha ~* '^(cópia|certificado)' OR  -- Outros indicadores de requisitos
               v_linha ~* '(ME|EPP|Microempresa|Empresa de Pequeno Porte).*dever[áã]' THEN  -- Requisitos específicos ME/EPP
                
                -- Verificar se é continuação do último item numerado
                IF v_ultimo_numero != '' AND 
                   NOT v_linha ~* '^(\d+\.[\d\.]*|\([a-z]\)|\-|\•|[a-z]\.|\[\d+\]|[IVX]+\.)' AND
                   (
                       v_linha ~* '^(e|ou|para|quando|no caso|em caso|conforme|mediante|desde que|sendo|onde|que|com)'
                       OR v_linha ~* '^[a-z]'  -- Começa com letra minúscula
                       OR length(v_texto_requisito) = 0  -- Primeira linha após número
                   ) THEN
                    -- É continuação do item anterior
                    IF length(v_texto_requisito) = 0 THEN
                        v_texto_requisito := v_ultima_linha_numerada;
                    END IF;
                    v_texto_requisito := v_texto_requisito || ' ' || v_linha;
                ELSE
                    -- Se já tiver um requisito acumulado, inserir
                    IF length(v_texto_requisito) > 0 THEN
                        -- Limpar o requisito
                        v_texto_requisito := regexp_replace(v_texto_requisito, '^\W+', ''); -- Remove caracteres especiais do início
                        v_texto_requisito := regexp_replace(v_texto_requisito, '\s+', ' '); -- Normaliza espaços
                        
                        -- Inserir o requisito
                        WITH inserted AS (
                            INSERT INTO requisitos_documentacao (
                                licitacao_id,
                                descricao,
                                observacoes,
                                atendido,
                                ordem
                            ) VALUES (
                                p_licitacao_id,
                                trim(v_texto_requisito),
                                CASE 
                                    WHEN v_subsecao_atual != '' THEN 
                                        'Categoria: ' || v_categoria_atual || 
                                        E'\nSeção: ' || v_secao_atual || 
                                        E'\nSubseção: ' || v_subsecao_atual ||
                                        CASE 
                                            WHEN v_prazo_validade != '' THEN E'\nPrazo de Validade: ' || v_prazo_validade
                                            ELSE ''
                                        END
                                    ELSE 
                                        'Seção: ' || v_secao_atual ||
                                        CASE 
                                            WHEN v_prazo_validade != '' THEN E'\nPrazo de Validade: ' || v_prazo_validade
                                            ELSE ''
                                        END
                                END,
                                false,
                                v_contador
                            )
                            RETURNING requisitos_documentacao.*
                        )
                        SELECT 
                            inserted.id,
                            inserted.licitacao_id,
                            inserted.descricao,
                            inserted.observacoes,
                            inserted.atendido,
                            inserted.ordem,
                            inserted.created_at,
                            inserted.updated_at
                        INTO v_resultado
                        FROM inserted;

                        RETURN NEXT v_resultado;
                        v_contador := v_contador + 1;
                    END IF;
                    
                    -- Iniciar novo requisito
                    v_texto_requisito := v_linha;
                END IF;
            ELSE
                -- Verificar se é continuação do requisito atual
                IF length(v_texto_requisito) > 0 AND length(v_linha) > 0 THEN
                    -- Verificar se a linha parece ser uma continuação natural
                    IF v_linha ~* '^(e|ou|para|quando|no caso|em caso|conforme|mediante|desde que|sendo|onde|que|com)' OR
                       v_linha ~* '^[a-z]' OR  -- Começa com letra minúscula
                       NOT v_linha ~* '^(\d+\.|\(|\-|\•|[a-z]\.|\[\d+\]|[IVX]+\.)' THEN
                        v_texto_requisito := v_texto_requisito || ' ' || v_linha;
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- Inserir último requisito se houver
    IF length(v_texto_requisito) > 0 THEN
        -- Limpar o requisito
        v_texto_requisito := regexp_replace(v_texto_requisito, '^\W+', ''); -- Remove caracteres especiais do início
        v_texto_requisito := regexp_replace(v_texto_requisito, '\s+', ' '); -- Normaliza espaços
        
        WITH inserted AS (
            INSERT INTO requisitos_documentacao (
                licitacao_id,
                descricao,
                observacoes,
                atendido,
                ordem
            ) VALUES (
                p_licitacao_id,
                trim(v_texto_requisito),
                CASE 
                    WHEN v_subsecao_atual != '' THEN 
                        'Categoria: ' || v_categoria_atual || 
                        E'\nSeção: ' || v_secao_atual || 
                        E'\nSubseção: ' || v_subsecao_atual ||
                        CASE 
                            WHEN v_prazo_validade != '' THEN E'\nPrazo de Validade: ' || v_prazo_validade
                            ELSE ''
                        END
                    ELSE 
                        'Seção: ' || v_secao_atual ||
                        CASE 
                            WHEN v_prazo_validade != '' THEN E'\nPrazo de Validade: ' || v_prazo_validade
                            ELSE ''
                        END
                END,
                false,
                v_contador
            )
            RETURNING requisitos_documentacao.*
        )
        SELECT 
            inserted.id,
            inserted.licitacao_id,
            inserted.descricao,
            inserted.observacoes,
            inserted.atendido,
            inserted.ordem,
            inserted.created_at,
            inserted.updated_at
        INTO v_resultado
        FROM inserted;

        RETURN NEXT v_resultado;
    END IF;

    -- Se nenhum requisito foi encontrado, adicionar uma mensagem
    IF v_contador = 1 THEN
        WITH inserted AS (
            INSERT INTO requisitos_documentacao (
                licitacao_id,
                descricao,
                observacoes,
                atendido,
                ordem
            ) VALUES (
                p_licitacao_id,
                'Não foi possível extrair requisitos automaticamente',
                'Recomendamos adicionar os requisitos manualmente ou verificar o formato do edital.',
                false,
                0
            )
            RETURNING requisitos_documentacao.*
        )
        SELECT 
            inserted.id,
            inserted.licitacao_id,
            inserted.descricao,
            inserted.observacoes,
            inserted.atendido,
            inserted.ordem,
            inserted.created_at,
            inserted.updated_at
        INTO v_resultado
        FROM inserted;

        RETURN NEXT v_resultado;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar função para adicionar requisitos de teste
CREATE OR REPLACE FUNCTION adicionar_requisitos_teste(
    p_licitacao_id uuid
) RETURNS SETOF requisitos_documentacao AS $$
DECLARE
    v_max_ordem INTEGER;
BEGIN
    -- Verificar se a licitação existe
    IF NOT EXISTS (SELECT 1 FROM licitacoes WHERE id = p_licitacao_id) THEN
        RAISE EXCEPTION 'Licitação com ID % não encontrada', p_licitacao_id;
    END IF;

    -- Obter a ordem máxima atual
    SELECT COALESCE(MAX(ordem), 0) INTO v_max_ordem FROM requisitos_documentacao WHERE licitacao_id = p_licitacao_id;
    
    -- Inserir requisitos de teste
    RETURN QUERY
    WITH inserted AS (
        INSERT INTO requisitos_documentacao (
            licitacao_id,
            descricao,
            observacoes,
            atendido,
            ordem
        ) VALUES 
        (
            p_licitacao_id,
            'Certidão Negativa de Débitos Federais',
            'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
            false,
            v_max_ordem + 1
        ),
        (
            p_licitacao_id,
            'Certidão Negativa de Débitos Estaduais',
            'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
            false,
            v_max_ordem + 2
        ),
        (
            p_licitacao_id,
            'Certidão Negativa de Débitos Municipais',
            'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
            false,
            v_max_ordem + 3
        ),
        (
            p_licitacao_id,
            'Certidão Negativa de Débitos Trabalhistas',
            'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
            false,
            v_max_ordem + 4
        ),
        (
            p_licitacao_id,
            'Certificado de Regularidade do FGTS',
            'Categoria: FISCAL
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Regularidade Fiscal
Prazo de Validade: 30 dias',
            false,
            v_max_ordem + 5
        ),
        (
            p_licitacao_id,
            'Contrato Social ou Estatuto',
            'Categoria: JURIDICA
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Habilitação Jurídica',
            false,
            v_max_ordem + 6
        ),
        (
            p_licitacao_id,
            'Atestado de Capacidade Técnica',
            'Categoria: TECNICA
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Qualificação Técnica',
            false,
            v_max_ordem + 7
        ),
        (
            p_licitacao_id,
            'Balanço Patrimonial',
            'Categoria: FINANCEIRA
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Qualificação Econômico-Financeira',
            false,
            v_max_ordem + 8
        ),
        (
            p_licitacao_id,
            'Declaração de que não emprega menor',
            'Categoria: DECLARACOES
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Declarações',
            false,
            v_max_ordem + 9
        ),
        (
            p_licitacao_id,
            'Declaração de inexistência de fato impeditivo',
            'Categoria: DECLARACOES
Seção: DOCUMENTOS DE HABILITAÇÃO
Subseção: Declarações',
            false,
            v_max_ordem + 10
        )
        RETURNING *
    )
    SELECT * FROM inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar função para executar SQL personalizado (útil para manutenção)
CREATE OR REPLACE FUNCTION executar_sql_personalizado(
    p_sql text
) RETURNS jsonb AS $$
DECLARE
    v_resultado jsonb;
    v_erro text;
BEGIN
    -- Registrar a execução para auditoria
    INSERT INTO log_execucao_sql (sql_executado, usuario)
    VALUES (p_sql, current_user);
    
    BEGIN
        EXECUTE p_sql INTO v_resultado;
        RETURN jsonb_build_object('sucesso', true, 'resultado', v_resultado);
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS v_erro = PG_EXCEPTION_DETAIL;
        
        -- Registrar o erro
        UPDATE log_execucao_sql 
        SET erro = v_erro
        WHERE id = (SELECT max(id) FROM log_execucao_sql WHERE usuario = current_user);
        
        RETURN jsonb_build_object('sucesso', false, 'erro', SQLERRM, 'detalhe', v_erro);
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar tabela de log se não existir
CREATE TABLE IF NOT EXISTS log_execucao_sql (
    id SERIAL PRIMARY KEY,
    sql_executado TEXT NOT NULL,
    usuario TEXT NOT NULL,
    erro TEXT,
    data_execucao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Conceder permissões para as funções
DO $$
BEGIN
    -- Conceder permissões para as funções
    GRANT EXECUTE ON FUNCTION processar_requisitos_edital(text, uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION processar_requisitos_edital(text, uuid) TO anon;
    GRANT EXECUTE ON FUNCTION processar_requisitos_edital(text, uuid) TO service_role;
    
    GRANT EXECUTE ON FUNCTION adicionar_requisitos_teste(uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION adicionar_requisitos_teste(uuid) TO anon;
    GRANT EXECUTE ON FUNCTION adicionar_requisitos_teste(uuid) TO service_role;
    
    GRANT EXECUTE ON FUNCTION executar_sql_personalizado(text) TO authenticated;
    GRANT EXECUTE ON FUNCTION executar_sql_personalizado(text) TO service_role;
    
    RAISE NOTICE 'Permissões das funções configuradas com sucesso';
END$$;

-- 9. Adicionar gatilho para atualizar o campo updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover o gatilho se existir e criar novamente
DROP TRIGGER IF EXISTS update_requisitos_documentacao_updated_at ON requisitos_documentacao;

CREATE TRIGGER update_requisitos_documentacao_updated_at
BEFORE UPDATE ON requisitos_documentacao
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 10. Verificar se tudo foi criado corretamente
DO $$
DECLARE
    v_tabela_existe boolean;
    v_funcao_existe boolean;
    v_tipo_existe boolean;
BEGIN
    -- Verificar tabela
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'requisitos_documentacao'
    ) INTO v_tabela_existe;
    
    -- Verificar função
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'processar_requisitos_edital'
    ) INTO v_funcao_existe;
    
    -- Verificar tipo
    SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'requisito_result'
    ) INTO v_tipo_existe;
    
    -- Exibir resultados
    RAISE NOTICE 'Verificação final:';
    RAISE NOTICE 'Tabela requisitos_documentacao: %', CASE WHEN v_tabela_existe THEN 'OK' ELSE 'FALHA' END;
    RAISE NOTICE 'Função processar_requisitos_edital: %', CASE WHEN v_funcao_existe THEN 'OK' ELSE 'FALHA' END;
    RAISE NOTICE 'Tipo requisito_result: %', CASE WHEN v_tipo_existe THEN 'OK' ELSE 'FALHA' END;
    
    -- Verificar se tudo está OK
    IF v_tabela_existe AND v_funcao_existe AND v_tipo_existe THEN
        RAISE NOTICE 'Reconstrução do sistema de requisitos concluída com sucesso!';
    ELSE
        RAISE WARNING 'Reconstrução do sistema de requisitos concluída com problemas. Verifique os logs acima.';
    END IF;
END$$; 