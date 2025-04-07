-- Função para criar um usuário para uma franquia existente
CREATE OR REPLACE FUNCTION public.criar_usuario_franquia_v2(
    p_franquia_id UUID,
    p_email VARCHAR,
    p_senha VARCHAR,
    p_nome VARCHAR DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_franquia_nome VARCHAR;
    v_email VARCHAR;
    v_user_data JSONB;
    v_role VARCHAR := 'authenticated';
    v_timestamp BIGINT;
    v_seed TEXT;
    v_encrypted_password TEXT;
BEGIN
    -- Validar parâmetros de entrada
    IF p_franquia_id IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'ID da franquia não pode ser nulo',
            'codigo', 'FRANQUIA_ID_NULO'
        );
    END IF;

    IF p_email IS NULL OR p_email = '' THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Email não pode ser nulo ou vazio',
            'codigo', 'EMAIL_INVALIDO'
        );
    END IF;

    IF p_senha IS NULL OR length(p_senha) < 6 THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Senha deve ter pelo menos 6 caracteres',
            'codigo', 'SENHA_INVALIDA'
        );
    END IF;

    -- Verificar se a franquia existe
    IF NOT EXISTS (SELECT 1 FROM public.franquias WHERE id = p_franquia_id) THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Franquia não encontrada. ID: ' || p_franquia_id::text,
            'codigo', 'FRANQUIA_NAO_ENCONTRADA'
        );
    END IF;

    -- Verificar se já existe um usuário com o mesmo email
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Já existe um usuário com este email: ' || p_email,
            'codigo', 'EMAIL_JA_EXISTE'
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

    -- Gerar um UUID para o usuário usando timestamp e texto único
    SELECT EXTRACT(EPOCH FROM NOW()) * 1000 INTO v_timestamp;
    v_seed := p_email || '_' || v_timestamp::TEXT;
    v_user_id := (SELECT md5(v_seed)::uuid);  -- Converter o MD5 do seed para UUID
    
    -- Gerar uma senha encriptada simples
    v_encrypted_password := 'TEMP_' || MD5(p_senha || '_' || p_email);

    -- Usar a função de sign-up do Supabase
    BEGIN
        v_user_data := jsonb_build_object(
            'email', p_email,
            'password', p_senha,
            'email_confirm', TRUE,
            'data', jsonb_build_object('nome', p_nome)
        );
        
        -- Utilizar API do GoTrue/Supabase Auth para criar o usuário
        PERFORM
            pg_notify(
                'supabase_functions',
                jsonb_build_object(
                    'type', 'signup',
                    'event', 'user_create',
                    'payload', v_user_data
                )::text
            );
            
        -- Como não temos acesso direto ao retorno da notificação, inserimos o usuário manualmente
        -- com uma senha simples temporária, que deve ser alterada pelo usuário
        INSERT INTO auth.users
            (id, instance_id, email, encrypted_password, email_confirmed_at, 
             aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES
            (v_user_id, '00000000-0000-0000-0000-000000000000', p_email, 
             v_encrypted_password, 
             now(), 
             'authenticated', v_role, 
             jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', 'franquia'),
             jsonb_build_object('nome', p_nome),
             now(), now())
        RETURNING id INTO v_user_id;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Erro ao criar usuário: ' || SQLERRM,
            'codigo', 'ERRO_CRIAR_USUARIO',
            'detalhe', SQLERRM,
            'sqlstate', SQLSTATE
        );
    END;

    -- Atualizar user_id na franquia
    BEGIN
        UPDATE public.franquias
        SET user_id = v_user_id
        WHERE id = p_franquia_id;
    EXCEPTION WHEN OTHERS THEN
        -- Se falhar ao atualizar franquia, ainda retornar sucesso na criação do usuário
        RETURN jsonb_build_object(
            'sucesso', true,
            'mensagem', 'Usuário criado, mas não foi possível associá-lo à franquia. Erro: ' || SQLERRM,
            'user_id', v_user_id,
            'franquia_id', p_franquia_id,
            'codigo', 'ERRO_ASSOCIAR_USUARIO'
        );
    END;

    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', 'Usuário da franquia criado com sucesso',
        'user_id', v_user_id,
        'franquia_id', p_franquia_id,
        'email', p_email
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'sucesso', false,
        'mensagem', 'Erro ao criar usuário para franquia: ' || SQLERRM,
        'codigo', 'ERRO_INTERNO',
        'sqlstate', SQLSTATE
    );
END;
$$;

-- Criar uma vista segura para verificar usuários
-- Esta vista expõe apenas os emails dos usuários, sem dados sensíveis
CREATE OR REPLACE VIEW public.usuarios_view AS
SELECT email
FROM auth.users;

-- Criar ou substituir a função para verificar se um usuário existe
CREATE OR REPLACE FUNCTION public.check_user_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auth.users WHERE email = p_email);
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao verificar usuário: %', SQLERRM;
  RETURN FALSE;
END;
$$; 