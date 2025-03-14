-- Script para verificar e corrigir a exclusão de documentos de licitação
-- Este script garante que os requisitos sejam excluídos quando o último edital for removido

-- 1. Criar uma função para excluir documentos de licitação
CREATE OR REPLACE FUNCTION excluir_documento_licitacao(
    p_documento_id uuid
) RETURNS boolean AS $$
DECLARE
    v_documento RECORD;
    v_is_edital boolean;
    v_outros_editais integer;
    v_licitacao_id uuid;
BEGIN
    -- Obter informações do documento
    SELECT 
        dl.id, 
        dl.licitacao_id, 
        dl.arquivo_url,
        td.nome AS tipo_documento_nome
    INTO v_documento
    FROM 
        documentos_licitacao dl
        JOIN tipos_documentos td ON dl.tipo_documento_id = td.id
    WHERE 
        dl.id = p_documento_id;
    
    -- Verificar se o documento existe
    IF v_documento.id IS NULL THEN
        RAISE EXCEPTION 'Documento não encontrado';
    END IF;
    
    -- Armazenar o ID da licitação para uso posterior
    v_licitacao_id := v_documento.licitacao_id;
    
    -- Verificar se é um edital
    v_is_edital := v_documento.tipo_documento_nome ILIKE '%edital%';
    
    -- Se for um edital, verificar se é o último
    IF v_is_edital THEN
        -- Contar outros editais para esta licitação
        SELECT COUNT(*)
        INTO v_outros_editais
        FROM 
            documentos_licitacao dl
            JOIN tipos_documentos td ON dl.tipo_documento_id = td.id
        WHERE 
            dl.licitacao_id = v_licitacao_id
            AND dl.id != p_documento_id
            AND td.nome ILIKE '%edital%';
        
        -- Se for o último edital, excluir os requisitos
        IF v_outros_editais = 0 THEN
            RAISE NOTICE 'Este é o último edital da licitação %. Excluindo requisitos associados.', v_licitacao_id;
            
            DELETE FROM requisitos_documentacao
            WHERE licitacao_id = v_licitacao_id;
        END IF;
    END IF;
    
    -- Excluir o arquivo do storage (isso deve ser feito no código JavaScript)
    
    -- Excluir o registro do documento
    DELETE FROM documentos_licitacao
    WHERE id = p_documento_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Conceder permissões para a função
DO $$
BEGIN
    GRANT EXECUTE ON FUNCTION excluir_documento_licitacao(uuid) TO authenticated;
    GRANT EXECUTE ON FUNCTION excluir_documento_licitacao(uuid) TO anon;
    GRANT EXECUTE ON FUNCTION excluir_documento_licitacao(uuid) TO service_role;
    
    RAISE NOTICE 'Permissões da função excluir_documento_licitacao configuradas com sucesso';
END$$;

-- 3. Instruções para uso da função no código JavaScript
/*
Para usar esta função no código JavaScript, você deve modificar o método excluirDocumentoLicitacao 
no arquivo frontend/src/services/supabase.js para chamar esta função RPC em vez de fazer as operações 
diretamente. Exemplo:

excluirDocumentoLicitacao: async (id, arquivoUrl) => {
  try {
    // 1. Chamar a função RPC para excluir o documento e seus requisitos se necessário
    const { data, error } = await supabase
      .rpc('excluir_documento_licitacao', {
        p_documento_id: id
      });

    if (error) throw error;

    // 2. Excluir o arquivo do storage (isso não pode ser feito na função SQL)
    if (arquivoUrl) {
      const { error: storageError } = await supabase
        .storage
        .from('documentos')
        .remove([arquivoUrl]);

      if (storageError) throw storageError;
    }

    return true;
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    throw error;
  }
}
*/

-- 4. Testar a função com um documento específico (opcional)
-- ATENÇÃO: Descomente apenas se quiser testar com um documento real
/*
DO $$
DECLARE
    v_documento_id UUID := '00000000-0000-0000-0000-000000000000'; -- Substitua pelo ID real
BEGIN
    PERFORM excluir_documento_licitacao(v_documento_id);
    RAISE NOTICE 'Documento % excluído com sucesso', v_documento_id;
END$$;
*/ 