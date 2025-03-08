-- Dropar função se existir
DROP FUNCTION IF EXISTS processar_requisitos_edital;

-- Função para processar requisitos do edital
CREATE OR REPLACE FUNCTION processar_requisitos_edital(
    p_texto text, -- Agora recebe a URL do PDF
    p_licitacao_id uuid
) RETURNS SETOF requisitos_documentacao AS $$
DECLARE
    v_result requisitos_documentacao;
BEGIN
    -- Verificar se a licitação existe
    IF NOT EXISTS (SELECT 1 FROM licitacoes WHERE id = p_licitacao_id) THEN
        RAISE EXCEPTION 'Licitação não encontrada';
    END IF;

    -- Limpar requisitos existentes para esta licitação
    DELETE FROM requisitos_documentacao WHERE licitacao_id = p_licitacao_id;

    -- Inserir um requisito padrão com a URL do documento
    INSERT INTO requisitos_documentacao (
        licitacao_id,
        descricao,
        status,
        observacoes
    ) VALUES (
        p_licitacao_id,
        'Verificar requisitos no documento do edital',
        'PENDENTE'::status_requisito,
        'URL do documento: ' || p_texto
    ) RETURNING * INTO v_result;

    RETURN NEXT v_result;
    RETURN;
END;
$$ LANGUAGE plpgsql; 