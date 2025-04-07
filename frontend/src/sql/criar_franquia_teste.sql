-- Script para criar uma franquia de teste
DO $$
DECLARE
    v_user_id UUID;
    v_franquia_id UUID;
    v_matriz_id UUID;
    v_result JSONB;
    v_existe_matriz BOOLEAN;
BEGIN
    -- Verificar se existe usuário matriz (admin)
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'admin@licitagora.com'
    ) INTO v_existe_matriz;
    
    -- Se não existe matriz, criar um usuário admin primeiro
    IF NOT v_existe_matriz THEN
        -- Criar usuário admin
        INSERT INTO auth.users (
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            'admin@licitagora.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email'],
                'role', 'admin'
            ),
            jsonb_build_object(
                'nome', 'Administrador',
                'is_admin', TRUE
            )
        )
        RETURNING id INTO v_matriz_id;
        
        -- Criar perfil MATRIZ para o admin
        INSERT INTO public.perfis_usuario (
            user_id,
            tipo,
            nome,
            is_responsavel,
            created_at,
            updated_at
        ) VALUES (
            v_matriz_id,
            'MATRIZ',
            'Administrador',
            TRUE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        RAISE NOTICE 'Usuário matriz criado com ID: %', v_matriz_id;
    ELSE
        -- Obter ID da matriz existente
        SELECT id INTO v_matriz_id FROM auth.users WHERE email = 'admin@licitagora.com';
    END IF;
    
    -- Criar usuário para a franquia de teste
    INSERT INTO auth.users (
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        'franquia.teste@licitagora.com',
        crypt('senha123', gen_salt('bf')),
        now(),
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email'],
            'role', 'franquia'
        ),
        jsonb_build_object(
            'nome', 'Franquia de Teste',
            'is_responsavel', TRUE,
            'criado_por', v_matriz_id
        )
    )
    RETURNING id INTO v_user_id;
    
    -- Criar a franquia de teste
    INSERT INTO public.franquias (
        nome,
        cnpj,
        email,
        telefone,
        user_id,
        matriz_id,
        ativa,
        created_at,
        updated_at
    ) VALUES (
        'Franquia de Teste',
        '12345678901234',
        'franquia.teste@licitagora.com',
        '11987654321',
        v_user_id,
        v_matriz_id,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_franquia_id;
    
    -- Criar perfil de usuário para a franquia
    INSERT INTO public.perfis_usuario (
        user_id,
        tipo,
        nome,
        franquia_id,
        is_responsavel,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'FRANQUIA',
        'Franquia de Teste',
        v_franquia_id,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    -- Inserir permissões básicas para a franquia
    INSERT INTO public.permissoes_franquia (
        franquia_id,
        permissao_id,
        ativo,
        created_at,
        updated_at
    )
    SELECT 
        v_franquia_id,
        id,
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM public.permissoes
    WHERE escopo = 'FRANQUIA' OR escopo = 'GERAL';
    
    RAISE NOTICE 'Franquia de teste criada com sucesso! ID: %, User ID: %', v_franquia_id, v_user_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar franquia de teste: %', SQLERRM;
END;
$$; 