-- Função para criar franquia com usuário responsável e permissões específicas
CREATE OR REPLACE FUNCTION public.criar_franquia_com_usuario_responsavel(
    p_nome VARCHAR,
    p_cnpj VARCHAR,
    p_email VARCHAR,
    p_telefone VARCHAR,
    p_senha VARCHAR,
    p_permissoes TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id UUID;
    v_franquia_id UUID;
    v_matriz_id UUID;
    v_resultado JSONB;
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
                'mensagem', 'Apenas usuários do tipo MATRIZ podem criar franquias'
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'Não foi possível identificar o usuário atual'
        );
    END;

    -- Validar CNPJ
    IF NOT public.validar_cnpj(p_cnpj) THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'CNPJ inválido'
        );
    END IF;

    -- Validar email
    IF NOT p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'Email inválido'
        );
    END IF;

    -- Validar senha
    IF length(p_senha) < 8 THEN
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'Senha deve ter pelo menos 8 caracteres'
        );
    END IF;

    -- Iniciar transação
    BEGIN
        -- Verificar se já existe uma franquia com o mesmo CNPJ
        IF EXISTS (SELECT 1 FROM public.franquias WHERE cnpj = p_cnpj) THEN
            RETURN jsonb_build_object(
                'sucesso', FALSE,
                'mensagem', 'Já existe uma franquia com este CNPJ'
            );
        END IF;

        -- Verificar se já existe um usuário com o mesmo email
        IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
            RETURN jsonb_build_object(
                'sucesso', FALSE,
                'mensagem', 'Já existe um usuário com este email'
            );
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
            jsonb_build_object(
                'provider', 'email',
                'providers', ARRAY['email'],
                'role', 'franquia_responsavel'
            ),
            jsonb_build_object(
                'nome', p_nome,
                'is_responsavel', TRUE,
                'criado_por', v_matriz_id,
                'permissoes', p_permissoes
            )
        )
        RETURNING id INTO v_user_id;

        -- Criar a franquia
        INSERT INTO public.franquias (
            nome,
            cnpj,
            email,
            telefone,
            user_id,
            matriz_id,
            is_ativa,
            created_at,
            updated_at
        ) VALUES (
            p_nome,
            p_cnpj,
            p_email,
            p_telefone,
            v_user_id,
            v_matriz_id,
            TRUE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        RETURNING id INTO v_franquia_id;

        -- Criar perfil de usuário do tipo FRANQUIA_RESPONSAVEL
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
            p_nome,
            v_franquia_id,
            TRUE,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        -- Conceder permissões baseadas na lista fornecida
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
                        v_franquia_id,
                        v_permissao_id,
                        TRUE,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
                END IF;
            END LOOP;
        ELSE
            -- Se não foram especificadas permissões, conceder todas disponíveis para franquias
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
        END IF;

        -- Registrar ação de auditoria
        PERFORM public.log_audit(
            'public.franquias',
            v_franquia_id::TEXT,
            'CRIACAO_FRANQUIA',
            NULL,
            jsonb_build_object(
                'nome', p_nome,
                'cnpj', p_cnpj,
                'email', p_email,
                'responsavel_id', v_user_id,
                'matriz_id', v_matriz_id,
                'permissoes', p_permissoes
            ),
            v_matriz_id
        );

        -- Retornar resultado de sucesso
        RETURN jsonb_build_object(
            'sucesso', TRUE,
            'mensagem', 'Franquia criada com sucesso com usuário responsável',
            'user_id', v_user_id,
            'franquia_id', v_franquia_id,
            'matriz_id', v_matriz_id,
            'permissoes', p_permissoes
        );
    EXCEPTION WHEN OTHERS THEN
        -- Em caso de erro, tentar limpar o usuário se já foi criado
        IF v_user_id IS NOT NULL THEN
            BEGIN
                DELETE FROM auth.users WHERE id = v_user_id;
            EXCEPTION WHEN OTHERS THEN
                NULL; -- Ignora erros na limpeza
            END;
        END IF;
        
        RETURN jsonb_build_object(
            'sucesso', FALSE,
            'mensagem', 'Erro ao criar franquia: ' || SQLERRM,
            'erro_detalhado', SQLERRM
        );
    END;
END;
$function$;

COMMENT ON FUNCTION public.criar_franquia_com_usuario_responsavel(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, TEXT[]) IS 
'Função para criar uma franquia com um usuário responsável e permissões específicas.
Este usuário terá as permissões indicadas para gerenciar a franquia e criar colaboradores.
É uma versão aprimorada que permite definir exatamente quais permissões o responsável terá.'; 