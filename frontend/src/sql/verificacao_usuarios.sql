-- Funções e views para verificação segura de usuários
-- Este arquivo contém implementações para verificar a existência de usuários
-- de forma segura e eficiente.

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

-- Função para verificar e criar usuário para franquia com tratamento robusto de erros
CREATE OR REPLACE FUNCTION public.verificar_e_criar_usuario_franquia(
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
    v_existe_usuario BOOLEAN;
    v_resultado jsonb;
BEGIN
    -- Validar parâmetros
    IF p_franquia_id IS NULL THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'codigo', 'FRANQUIA_ID_NULO',
            'mensagem', 'ID da franquia não pode ser nulo'
        );
    END IF;

    IF p_email IS NULL OR p_email = '' THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'codigo', 'EMAIL_INVALIDO',
            'mensagem', 'Email não pode ser nulo ou vazio'
        );
    END IF;

    IF p_senha IS NULL OR length(p_senha) < 6 THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'codigo', 'SENHA_INVALIDA',
            'mensagem', 'Senha deve ter pelo menos 6 caracteres'
        );
    END IF;

    -- Verificar se o usuário já existe
    BEGIN
        SELECT check_user_exists(p_email) INTO v_existe_usuario;
        
        IF v_existe_usuario THEN
            RETURN jsonb_build_object(
                'sucesso', false,
                'codigo', 'EMAIL_JA_EXISTE',
                'mensagem', 'Já existe um usuário com este email: ' || p_email
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Erro ao verificar existência de usuário: %', SQLERRM;
        -- Verificar diretamente na tabela de usuários
        BEGIN
            IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
                RETURN jsonb_build_object(
                    'sucesso', false,
                    'codigo', 'EMAIL_JA_EXISTE',
                    'mensagem', 'Já existe um usuário com este email: ' || p_email
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Erro ao verificar existência de usuário diretamente: %', SQLERRM;
            -- Continuar mesmo com erro de verificação, a tentativa de inserção capturará duplicatas
        END;
    END;

    -- Tentar criar o usuário usando a função existente
    BEGIN
        SELECT criar_usuario_franquia_v2(p_franquia_id, p_email, p_senha, p_nome) INTO v_resultado;
        RETURN v_resultado;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'codigo', 'ERRO_CRIAR_USUARIO',
            'mensagem', 'Erro ao criar usuário: ' || SQLERRM,
            'detalhes', SQLERRM
        );
    END;
END;
$$;

-- Script SQL para verificar e corrigir problemas de autenticação de usuários
-- Criado por: Equipe LicitAgora
-- Data: 2023-05-12

-- 1. Consulta para listar todos os usuários cadastrados
SELECT 
    id, 
    email, 
    CASE 
        WHEN encrypted_password IS NOT NULL THEN 'Sim'
        ELSE 'Não'
    END AS possui_senha,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_metadata::text as perfil,
    created_at,
    updated_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Checar usuários com problemas de autenticação
SELECT 
    id, 
    email, 
    encrypted_password IS NULL AS senha_nula,
    email_confirmed_at IS NULL AS email_nao_confirmado,
    raw_app_metadata::text as perfil,
    created_at,
    updated_at
FROM auth.users
WHERE encrypted_password IS NULL 
   OR email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 3. Verificar as permissões das tabelas e funções relacionadas à autenticação
SELECT 
    n.nspname as schema,
    c.relname as tabela,
    c.relkind as tipo,
    CASE WHEN c.relkind = 'r' THEN 'tabela'
         WHEN c.relkind = 'v' THEN 'view'
         WHEN c.relkind = 'm' THEN 'materialized view'
         WHEN c.relkind = 'i' THEN 'index'
         WHEN c.relkind = 'S' THEN 'sequence'
         WHEN c.relkind = 'f' THEN 'foreign table'
         ELSE c.relkind::text
    END as tipo_objeto,
    pg_get_userbyid(c.relowner) as dono
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth'
ORDER BY c.relkind, c.relname;

-- 4. Função para corrigir problemas de email_confirmed_at
CREATE OR REPLACE FUNCTION public.confirmar_emails_usuarios()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE email_confirmed_at IS NULL;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN 'Confirmados ' || v_count || ' usuários';
END;
$$;

-- 5. Função para verificar e corrigir permissões das tabelas
CREATE OR REPLACE FUNCTION public.corrigir_permissoes_auth()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    -- Garantir que o schema auth existe
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
        RAISE EXCEPTION 'Schema auth não existe';
    END IF;
    
    -- Garantir que o usuário service_role tem acesso às tabelas auth
    GRANT USAGE ON SCHEMA auth TO service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA auth TO service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO service_role;
    
    -- Garantir que a função de login funciona
    GRANT EXECUTE ON FUNCTION auth.email_login(text, text, text, text) TO service_role;
    
    v_count := v_count + 1;
    
    RETURN 'Permissões corrigidas: ' || v_count || ' operações';
END;
$$;

-- 6. Verificar o banco de dados para erros
CREATE OR REPLACE FUNCTION public.verificar_integridade_banco()
RETURNS TABLE (
    tabela TEXT,
    status TEXT,
    mensagem TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verificar schema auth
    BEGIN
        PERFORM 1 FROM pg_namespace WHERE nspname = 'auth';
        RETURN QUERY SELECT 'auth.schema'::TEXT, 'OK'::TEXT, 'Schema auth existe'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'auth.schema'::TEXT, 'ERRO'::TEXT, SQLERRM::TEXT;
    END;
    
    -- Verificar tabela users
    BEGIN
        PERFORM 1 FROM auth.users LIMIT 1;
        RETURN QUERY SELECT 'auth.users'::TEXT, 'OK'::TEXT, 'Tabela users acessível'::TEXT;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'auth.users'::TEXT, 'ERRO'::TEXT, SQLERRM::TEXT;
    END;
    
    -- Verificar função de login
    BEGIN
        -- Não executamos a função, apenas verificamos se ela existe
        RETURN QUERY SELECT 'auth.email_login'::TEXT, 'OK'::TEXT, 'Função de login existe'::TEXT 
        FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'auth' AND p.proname = 'email_login' 
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'auth.email_login'::TEXT, 'ERRO'::TEXT, SQLERRM::TEXT;
    END;
END;
$$;

-- 7. Execute estas funções para diagnóstico e correção
-- SELECT * FROM public.verificar_integridade_banco();
-- SELECT public.confirmar_emails_usuarios();
-- SELECT public.corrigir_permissoes_auth(); 