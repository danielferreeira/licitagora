-- Função para criar um usuário para uma franquia existente
-- Versão melhorada com verificação de usuários excluídos com soft delete
CREATE OR REPLACE FUNCTION public.criar_usuario_para_franquia(
    p_franquia_id UUID,
    p_email VARCHAR,
    p_senha VARCHAR
) RETURNS JSONB AS $$
DECLARE
    v_franquia_record RECORD;
    v_user_id UUID;
    v_result JSONB;
    v_error TEXT;
    v_deleted_email VARCHAR := 'deleted_' || p_email;
BEGIN
    -- Verifica se a franquia existe
    SELECT * INTO v_franquia_record FROM public.franquias WHERE id = p_franquia_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Franquia não encontrada');
    END IF;
    
    -- Verifica se já existe um usuário com este email
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Email já está em uso');
    END IF;
    
    -- Verifica se existe um usuário excluído com soft delete (email = 'deleted_[email]')
    -- Se existir, podemos reutilizá-lo revertendo o soft delete
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_deleted_email) THEN
        -- Encontrou um usuário que foi excluído com soft delete
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_deleted_email;
        
        -- Restaura o usuário
        UPDATE auth.users
        SET 
            email = p_email,
            encrypted_password = crypt(p_senha, gen_salt('bf')),
            email_confirmed_at = NOW(),
            banned_until = NULL,
            raw_app_meta_data = jsonb_set(
                COALESCE(raw_app_meta_data, '{}'::jsonb) - 'deletedAt',
                '{provider}',
                '"email"'
            ),
            raw_user_meta_data = jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb) - 'deletedAt',
                '{full_name}',
                to_jsonb(v_franquia_record.nome)
            ),
            updated_at = NOW()
        WHERE id = v_user_id;
        
        -- Associa o ID do usuário restaurado à franquia
        UPDATE public.franquias SET user_id = v_user_id WHERE id = p_franquia_id;
        
        RETURN jsonb_build_object(
            'success', true, 
            'user_id', v_user_id, 
            'reactivated', true
        );
    END IF;
    
    -- Não existe usuário com este email, criar um novo
    INSERT INTO auth.users (
        email,
        raw_user_meta_data,
        role
    ) VALUES (
        p_email,
        jsonb_build_object('full_name', v_franquia_record.nome),
        'franquia'
    )
    RETURNING id INTO v_user_id;
    
    -- Associa o ID do usuário à franquia
    UPDATE public.franquias SET user_id = v_user_id WHERE id = p_franquia_id;
    
    -- Define a senha do usuário
    BEGIN
        UPDATE auth.users
        SET encrypted_password = crypt(p_senha, gen_salt('bf'))
        WHERE id = v_user_id;
    EXCEPTION WHEN OTHERS THEN
        v_error := SQLERRM;
        RETURN jsonb_build_object('success', false, 'error', v_error);
    END;
    
    -- Confirma o email do usuário
    UPDATE auth.users SET email_confirmed_at = NOW() WHERE id = v_user_id;
    
    RETURN jsonb_build_object('success', true, 'user_id', v_user_id, 'new_user', true);
EXCEPTION
    WHEN OTHERS THEN
        v_error := SQLERRM;
        RETURN jsonb_build_object('success', false, 'error', v_error);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 