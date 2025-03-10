-- Dropar função se existir
DROP FUNCTION IF EXISTS processar_requisitos_edital;

-- Criar tipo composto para o resultado se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'requisito_result') THEN
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
    END IF;
END$$;

-- Função para processar requisitos do edital
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
BEGIN
    -- Verificar se a licitação existe
    IF NOT EXISTS (SELECT 1 FROM licitacoes WHERE id = p_licitacao_id) THEN
        RAISE EXCEPTION 'Licitação não encontrada';
    END IF;

    -- Limpar requisitos existentes para esta licitação
    DELETE FROM requisitos_documentacao WHERE licitacao_id = p_licitacao_id;

    -- Dividir o texto em linhas e limpar espaços extras
    v_linhas := string_to_array(p_texto, E'\n');
    
    -- Processar linha por linha
    FOR i IN 1..array_length(v_linhas, 1) LOOP
        -- Limpar a linha atual
        v_linha := trim(regexp_replace(v_linhas[i], '\s+', ' ', 'g'));
        
        -- Pular linhas vazias
        CONTINUE WHEN length(v_linha) < 3;
        
        -- Identificar seções principais de habilitação
        IF v_linha ~* '(HABILITAÇÃO|DOCUMENTOS DE HABILITAÇÃO|DOCUMENTAÇÃO PARA HABILITAÇÃO)' THEN
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
                        
                        -- Preparar observações com seção, subseção e prazo se houver
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

    -- Se nenhum requisito foi encontrado, registrar isso como observação
    IF v_contador = 0 THEN
        WITH inserted AS (
            INSERT INTO requisitos_documentacao (
                licitacao_id,
                descricao,
                observacoes,
                atendido,
                ordem
            ) VALUES (
                p_licitacao_id,
                'Verificação manual necessária',
                'Não foi possível identificar requisitos automaticamente no documento. Por favor, verifique manualmente.',
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
$$ LANGUAGE plpgsql; 