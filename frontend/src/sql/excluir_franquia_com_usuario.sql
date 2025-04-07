-- Função para excluir uma franquia e seu usuário em uma transação atômica
CREATE OR REPLACE FUNCTION public.excluir_franquia_com_usuario(
    p_franquia_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_franquia_record RECORD;
    v_user_id UUID;
    v_cliente_count INTEGER;
    v_result JSONB;
BEGIN
    -- Inicia uma transação
    BEGIN
        -- Verificar se a franquia existe
        SELECT id, user_id, nome INTO v_franquia_record FROM public.franquias WHERE id = p_franquia_id;
        
        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'Franquia não encontrada');
        END IF;
        
        -- Verificar se há clientes vinculados
        SELECT COUNT(*) INTO v_cliente_count FROM public.franquia_clientes WHERE franquia_id = p_franquia_id;
        
        IF v_cliente_count > 0 THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'Existem clientes vinculados a esta franquia. Remova-os antes de excluir a franquia.',
                'cliente_count', v_cliente_count
            );
        END IF;
        
        -- Verificar se há outras dependências (como documentos, licitações, etc.)
        -- Adicione verificações adicionais aqui se necessário
        
        -- Se há um usuário vinculado, vamos excluí-lo
        IF v_franquia_record.user_id IS NOT NULL THEN
            v_user_id := v_franquia_record.user_id;
            
            -- Verificar se o usuário existe
            IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
                -- Opção 1: Excluir o usuário fisicamente (se tiver permissões suficientes)
                -- DELETE FROM auth.users WHERE id = v_user_id;
                
                -- Opção 2: Desativar o usuário (soft delete)
                UPDATE auth.users 
                SET 
                    email = 'deleted_' || email,
                    encrypted_password = NULL,
                    email_confirmed_at = NULL,
                    last_sign_in_at = NULL,
                    raw_app_meta_data = jsonb_set(
                        COALESCE(raw_app_meta_data, '{}'::jsonb),
                        '{deletedAt}',
                        to_jsonb(NOW())
                    ),
                    raw_user_meta_data = jsonb_set(
                        COALESCE(raw_user_meta_data, '{}'::jsonb),
                        '{deletedAt}',
                        to_jsonb(NOW())
                    ),
                    banned_until = '2100-01-01'::timestamptz,
                    updated_at = NOW()
                WHERE id = v_user_id;
            END IF;
        END IF;
        
        -- Agora podemos excluir a franquia com segurança
        DELETE FROM public.franquias WHERE id = p_franquia_id;
        
        -- Se chegamos até aqui, tudo foi bem-sucedido
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Franquia e usuário excluídos com sucesso',
            'franquia_nome', v_franquia_record.nome,
            'user_id', v_user_id
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro, a transação é revertida automaticamente
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 