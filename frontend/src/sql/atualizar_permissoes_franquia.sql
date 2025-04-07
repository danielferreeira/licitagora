-- Função para atualizar permissões de uma franquia existente
CREATE OR REPLACE FUNCTION public.atualizar_permissoes_franquia(
    p_franquia_id UUID,
    p_permissoes TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_matriz_id UUID;
    v_user_id UUID;
    v_permissao TEXT;
    v_permissao_id UUID;
BEGIN
    -- Obter ID do usuário matriz atual
    BEGIN
        v_matriz_id := auth.uid();
        
        -- Verificar se o usuário atual é realmente uma MATRIZ
        IF NOT EXISTS (
            SELECT 1 FROM public.perfis_usuario 
            WHERE user_id = v_matriz_id AND tipo = 'MATRIZ'
        ) THEN
            RETURN jsonb_build_object(
                'sucesso', FALSE,
                'mensagem', 'Apenas usuários do tipo MATRIZ podem atualizar permissões'
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'Não foi possível identificar o usuário atual'
        );
    END;
    
    -- Verificar se a franquia existe
    IF NOT EXISTS (SELECT 1 FROM public.franquias WHERE id = p_franquia_id) THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'Franquia não encontrada'
        );
    END IF;
    
    -- Obter o ID do usuário da franquia
    SELECT user_id INTO v_user_id FROM public.franquias WHERE id = p_franquia_id;
    
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'Franquia não possui usuário associado'
        );
    END IF;

    -- Iniciar transação
    BEGIN
        -- Limpar permissões existentes
        DELETE FROM public.permissoes_franquia 
        WHERE franquia_id = p_franquia_id;
        
        -- Inserir novas permissões baseadas na lista fornecida
        IF p_permissoes IS NOT NULL AND array_length(p_permissoes, 1) > 0 THEN
            -- Conceder permissões específicas
            FOREACH v_permissao IN ARRAY p_permissoes
            LOOP
                -- Verificar se permissão existe e obter ID
                SELECT id INTO v_permissao_id
                FROM public.permissoes
                WHERE codigo = v_permissao AND (escopo = 'FRANQUIA' OR escopo = 'GERAL');

                IF v_permissao_id IS NOT NULL THEN
                    -- Inserir permissão para a franquia
                    INSERT INTO public.permissoes_franquia (
                        franquia_id,
                        permissao_id,
                        ativo,
                        created_at,
                        updated_at
                    ) VALUES (
                        p_franquia_id,
                        v_permissao_id,
                        TRUE,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
                END IF;
            END LOOP;
        ELSE
            -- Se não foram especificadas permissões, conceder somente permissões básicas
            INSERT INTO public.permissoes_franquia (
                franquia_id,
                permissao_id,
                ativo,
                created_at,
                updated_at
            )
            SELECT 
                p_franquia_id,
                id,
                TRUE,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            FROM public.permissoes
            WHERE escopo = 'GERAL';
        END IF;
        
        -- Atualizar metadados do usuário com as novas permissões
        UPDATE auth.users
        SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('permissoes', p_permissoes)
        WHERE id = v_user_id;

        -- Registrar ação de auditoria
        PERFORM public.log_audit(
            'public.permissoes_franquia',
            p_franquia_id::TEXT,
            'ATUALIZACAO_PERMISSOES',
            NULL,
            jsonb_build_object(
                'franquia_id', p_franquia_id,
                'usuario_id', v_user_id,
                'permissoes', p_permissoes,
                'atualizado_por', v_matriz_id
            ),
            v_matriz_id
        );

        -- Retornar resultado de sucesso
        RETURN jsonb_build_object(
            'sucesso', TRUE,
            'mensagem', 'Permissões da franquia atualizadas com sucesso',
            'franquia_id', p_franquia_id,
            'user_id', v_user_id,
            'permissoes', p_permissoes
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'Erro ao atualizar permissões: ' || SQLERRM,
            'erro_detalhado', SQLERRM
        );
    END;
END;
$function$;

COMMENT ON FUNCTION public.atualizar_permissoes_franquia(UUID, TEXT[]) IS 
'Função para atualizar as permissões de uma franquia existente.
Apenas usuários MATRIZ podem modificar permissões.
A função remove todas as permissões atuais e aplica a nova lista fornecida.'; 