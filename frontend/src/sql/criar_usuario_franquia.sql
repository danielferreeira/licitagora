-- Função para criar um usuário para uma franquia existente
CREATE OR REPLACE FUNCTION public.criar_usuario_para_franquia(
    p_franquia_id UUID,
    p_email VARCHAR,
    p_senha VARCHAR,
    p_nome VARCHAR DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_franquia_nome VARCHAR;
    v_email VARCHAR;
BEGIN
    -- Verificar se a franquia existe
    IF NOT EXISTS (SELECT 1 FROM public.franquias WHERE id = p_franquia_id) THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Franquia não encontrada'
        );
    END IF;

    -- Verificar se já existe um usuário com o mesmo email
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Já existe um usuário com este email'
        );
    END IF;

    -- Obter informações da franquia
    SELECT nome, email 
    INTO v_franquia_nome, v_email
    FROM public.franquias 
    WHERE id = p_franquia_id;

    -- Se o nome do responsável não foi fornecido, usar o nome da franquia
    IF p_nome IS NULL OR p_nome = '' THEN
        p_nome := v_franquia_nome;
    END IF;

    -- Utilizar o email da franquia se não for fornecido
    IF p_email IS NULL OR p_email = '' THEN
        p_email := v_email;
    END IF;

    -- Criar o usuário
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        p_email,
        crypt(p_senha, gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"],"role":"franquia"}'::jsonb,
        jsonb_build_object('nome', p_nome)
    )
    RETURNING id INTO v_user_id;

    -- Atualizar user_id na franquia (de forma segura)
    BEGIN
        UPDATE public.franquias
        SET user_id = v_user_id
        WHERE id = p_franquia_id;
    EXCEPTION WHEN OTHERS THEN
        -- Se falhar ao atualizar franquia, ainda retornar sucesso na criação do usuário
        RETURN jsonb_build_object(
            'sucesso', true,
            'mensagem', 'Usuário criado, mas não foi possível associá-lo à franquia',
            'user_id', v_user_id,
            'franquia_id', p_franquia_id
        );
    END;

    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', 'Usuário da franquia criado com sucesso',
        'user_id', v_user_id,
        'franquia_id', p_franquia_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'sucesso', false,
        'mensagem', 'Erro ao criar usuário para franquia: ' || SQLERRM
    );
END;
$$; 