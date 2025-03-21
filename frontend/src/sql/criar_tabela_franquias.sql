-- Função para criar ou atualizar a tabela de franquias
CREATE OR REPLACE FUNCTION public.criar_tabela_franquias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Criar a tabela se não existir
    CREATE TABLE IF NOT EXISTS public.franquias (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        cnpj VARCHAR(14) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL,
        telefone VARCHAR(11),
        cep VARCHAR(8),
        endereco VARCHAR(200),
        numero VARCHAR(20),
        bairro VARCHAR(100),
        cidade VARCHAR(100),
        estado VARCHAR(2),
        data_inicio TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ativa BOOLEAN DEFAULT true,
        user_id UUID REFERENCES auth.users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Garantir que a coluna user_id seja nullable
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias ALTER COLUMN user_id DROP NOT NULL;';
    EXCEPTION 
        WHEN undefined_column OR undefined_table OR invalid_column_reference THEN
            -- Ignora se a coluna não existir ou já for nullable
            NULL;
    END;

    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_franquias_user_id ON public.franquias(user_id);
    CREATE INDEX IF NOT EXISTS idx_franquias_ativa ON public.franquias(ativa);

    -- Criar trigger para atualizar o timestamp
    DROP TRIGGER IF EXISTS update_franquias_updated_at ON public.franquias;
    CREATE TRIGGER update_franquias_updated_at
    BEFORE UPDATE ON public.franquias
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    -- Adicionar coluna de franquia_id na tabela de clientes se não existir
    ALTER TABLE public.clientes 
    ADD COLUMN IF NOT EXISTS franquia_id UUID REFERENCES public.franquias(id);

    -- Criar índice para a coluna franquia_id
    CREATE INDEX IF NOT EXISTS idx_clientes_franquia_id ON public.clientes(franquia_id);
END;
$$;

-- Função para criar um novo usuário e franquia associada
CREATE OR REPLACE FUNCTION public.criar_franquia_com_usuario(
    p_nome VARCHAR,
    p_cnpj VARCHAR,
    p_email VARCHAR,
    p_telefone VARCHAR,
    p_senha VARCHAR
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_franquia_id UUID;
    v_resultado jsonb;
BEGIN
    -- Verificar se já existe uma franquia com o mesmo CNPJ
    IF EXISTS (SELECT 1 FROM public.franquias WHERE cnpj = p_cnpj) THEN
        RETURN jsonb_build_object(
            'sucesso', false,
            'mensagem', 'Já existe uma franquia com este CNPJ'
        );
    END IF;

    -- Verificar se já existe um usuário com o mesmo email
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN jsonb_build_object(
            'sucesso', false,
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
        '{"provider":"email","providers":["email"],"role":"franquia"}'::jsonb,
        jsonb_build_object('nome', p_nome)
    )
    RETURNING id INTO v_user_id;

    -- Criar a franquia
    INSERT INTO public.franquias (
        nome,
        cnpj,
        email,
        telefone,
        user_id
    ) VALUES (
        p_nome,
        p_cnpj,
        p_email,
        p_telefone,
        v_user_id
    )
    RETURNING id INTO v_franquia_id;

    RETURN jsonb_build_object(
        'sucesso', true,
        'mensagem', 'Franquia criada com sucesso',
        'user_id', v_user_id,
        'franquia_id', v_franquia_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'sucesso', false,
        'mensagem', 'Erro ao criar franquia: ' || SQLERRM
    );
END;
$$;

-- Função para verificar e garantir colunas na tabela franquias
CREATE OR REPLACE FUNCTION public.verificar_colunas_franquias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Remover a coluna responsavel se existir
    BEGIN
        EXECUTE 'ALTER TABLE public.franquias DROP COLUMN IF EXISTS responsavel;';
    EXCEPTION 
        WHEN undefined_column OR undefined_table OR invalid_column_reference OR duplicate_column THEN
            -- Ignora se a coluna não existir
            NULL;
    END;
END;
$$; 