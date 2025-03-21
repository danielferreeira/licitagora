-- Configuração de políticas de segurança para o Supabase
-- Este script configura as políticas de Row Level Security (RLS) para todas as tabelas

-- Ativar RLS em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE licitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_licitacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitos_documentacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE prazos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE franquias ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (caso existam)
DROP POLICY IF EXISTS "Clientes são visíveis para usuários autenticados" ON clientes;
DROP POLICY IF EXISTS "Clientes podem ser inseridos por usuários autenticados" ON clientes;
DROP POLICY IF EXISTS "Clientes podem ser atualizados por usuários autenticados" ON clientes;
DROP POLICY IF EXISTS "Clientes podem ser excluídos por usuários autenticados" ON clientes;

DROP POLICY IF EXISTS "Licitações são visíveis para usuários autenticados" ON licitacoes;
DROP POLICY IF EXISTS "Licitações podem ser inseridas por usuários autenticados" ON licitacoes;
DROP POLICY IF EXISTS "Licitações podem ser atualizadas por usuários autenticados" ON licitacoes;
DROP POLICY IF EXISTS "Licitações podem ser excluídas por usuários autenticados" ON licitacoes;

DROP POLICY IF EXISTS "Documentos de cliente são visíveis para usuários autenticados" ON documentos_cliente;
DROP POLICY IF EXISTS "Documentos de cliente podem ser inseridos por usuários autenticados" ON documentos_cliente;
DROP POLICY IF EXISTS "Documentos de cliente podem ser atualizados por usuários autenticados" ON documentos_cliente;
DROP POLICY IF EXISTS "Documentos de cliente podem ser excluídos por usuários autenticados" ON documentos_cliente;

DROP POLICY IF EXISTS "Documentos de licitação são visíveis para usuários autenticados" ON documentos_licitacao;
DROP POLICY IF EXISTS "Documentos de licitação podem ser inseridos por usuários autenticados" ON documentos_licitacao;
DROP POLICY IF EXISTS "Documentos de licitação podem ser atualizados por usuários autenticados" ON documentos_licitacao;
DROP POLICY IF EXISTS "Documentos de licitação podem ser excluídos por usuários autenticados" ON documentos_licitacao;

DROP POLICY IF EXISTS "Requisitos são visíveis para usuários autenticados" ON requisitos_documentacao;
DROP POLICY IF EXISTS "Requisitos podem ser inseridos por usuários autenticados" ON requisitos_documentacao;
DROP POLICY IF EXISTS "Requisitos podem ser atualizados por usuários autenticados" ON requisitos_documentacao;
DROP POLICY IF EXISTS "Requisitos podem ser excluídos por usuários autenticados" ON requisitos_documentacao;

DROP POLICY IF EXISTS "Prazos são visíveis para usuários autenticados" ON prazos;
DROP POLICY IF EXISTS "Prazos podem ser inseridos por usuários autenticados" ON prazos;
DROP POLICY IF EXISTS "Prazos podem ser atualizados por usuários autenticados" ON prazos;
DROP POLICY IF EXISTS "Prazos podem ser excluídos por usuários autenticados" ON prazos;

DROP POLICY IF EXISTS "Tipos de documentos são visíveis para usuários autenticados" ON tipos_documentos;
DROP POLICY IF EXISTS "Tipos de documentos podem ser inseridos por usuários autenticados" ON tipos_documentos;
DROP POLICY IF EXISTS "Tipos de documentos podem ser atualizados por usuários autenticados" ON tipos_documentos;
DROP POLICY IF EXISTS "Tipos de documentos podem ser excluídos por usuários autenticados" ON tipos_documentos;

DROP POLICY IF EXISTS "Franquias são visíveis para administradores" ON franquias;
DROP POLICY IF EXISTS "Franquias podem ser inseridas por administradores" ON franquias;
DROP POLICY IF EXISTS "Franquias podem ser atualizadas por administradores" ON franquias;
DROP POLICY IF EXISTS "Franquias podem ser excluídas por administradores" ON franquias;
DROP POLICY IF EXISTS "Franquias são visíveis para o próprio usuário" ON franquias;
DROP POLICY IF EXISTS "Franquias podem ser atualizadas pelo próprio usuário" ON franquias;

-- Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND (
            raw_app_meta_data->>'role' = 'admin' OR
            email = 'admin@licitagora.com'
        )
    );
END;
$$;

-- Função para verificar se o usuário é uma franquia
CREATE OR REPLACE FUNCTION public.is_franquia()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid() 
        AND raw_app_meta_data->>'role' = 'franquia'
    );
END;
$$;

-- Função para obter o ID da franquia do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_franquia_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_franquia_id UUID;
BEGIN
    SELECT id INTO v_franquia_id
    FROM public.franquias
    WHERE user_id = auth.uid();
    
    RETURN v_franquia_id;
END;
$$;

-- Criar políticas para a tabela franquias
CREATE POLICY "Franquias são visíveis para administradores"
ON franquias FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Franquias podem ser inseridas por administradores"
ON franquias FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Franquias podem ser atualizadas por administradores"
ON franquias FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Franquias podem ser excluídas por administradores"
ON franquias FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Franquias são visíveis para o próprio usuário"
ON franquias FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Franquias podem ser atualizadas pelo próprio usuário"
ON franquias FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND id = id); -- não permite alterar o id

-- Criar políticas para a tabela clientes - Hierarquia ADMIN -> FRANQUIAS -> CLIENTES
CREATE POLICY "Clientes são visíveis para usuários autenticados"
ON clientes FOR SELECT
TO authenticated
USING (
    public.is_admin() OR 
    (public.is_franquia() AND franquia_id = public.get_user_franquia_id()) OR
    (franquia_id IS NULL) -- Clientes sem franquia são visíveis para todos (legado)
);

CREATE POLICY "Clientes podem ser inseridos por usuários autenticados"
ON clientes FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR 
    (public.is_franquia() AND franquia_id = public.get_user_franquia_id()) OR
    (public.is_franquia() AND franquia_id IS NULL) -- Franquias podem criar clientes sem associação
);

CREATE POLICY "Clientes podem ser atualizados por usuários autenticados"
ON clientes FOR UPDATE
TO authenticated
USING (
    public.is_admin() OR 
    (public.is_franquia() AND franquia_id = public.get_user_franquia_id()) OR
    (franquia_id IS NULL) -- Clientes sem franquia podem ser atualizados por todos (legado)
)
WITH CHECK (
    public.is_admin() OR 
    (public.is_franquia() AND franquia_id = public.get_user_franquia_id()) OR
    (public.is_franquia() AND franquia_id IS NULL) -- Franquias podem associar clientes existentes
);

CREATE POLICY "Clientes podem ser excluídos por usuários autenticados"
ON clientes FOR DELETE
TO authenticated
USING (
    public.is_admin() OR 
    (public.is_franquia() AND franquia_id = public.get_user_franquia_id()) OR
    (franquia_id IS NULL) -- Clientes sem franquia podem ser excluídos por todos (legado)
);

-- Criar políticas para a tabela licitacoes
CREATE POLICY "Licitações são visíveis para usuários autenticados"
ON licitacoes FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM clientes c
        WHERE c.id = licitacoes.cliente_id
        AND (
            public.is_admin() OR 
            (public.is_franquia() AND c.franquia_id = public.get_user_franquia_id()) OR
            (c.franquia_id IS NULL) -- Licitações de clientes sem franquia são visíveis para todos (legado)
        )
    )
);

CREATE POLICY "Licitações podem ser inseridas por usuários autenticados"
ON licitacoes FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM clientes c
        WHERE c.id = licitacoes.cliente_id
        AND (
            public.is_admin() OR 
            (public.is_franquia() AND c.franquia_id = public.get_user_franquia_id()) OR
            (c.franquia_id IS NULL) -- Licitações de clientes sem franquia podem ser inseridas por todos (legado)
        )
    )
);

CREATE POLICY "Licitações podem ser atualizadas por usuários autenticados"
ON licitacoes FOR UPDATE
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM clientes c
        WHERE c.id = licitacoes.cliente_id
        AND (
            public.is_admin() OR 
            (public.is_franquia() AND c.franquia_id = public.get_user_franquia_id()) OR
            (c.franquia_id IS NULL) -- Licitações de clientes sem franquia podem ser atualizadas por todos (legado)
        )
    )
)
WITH CHECK (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM clientes c
        WHERE c.id = licitacoes.cliente_id
        AND (
            public.is_admin() OR 
            (public.is_franquia() AND c.franquia_id = public.get_user_franquia_id()) OR
            (c.franquia_id IS NULL) -- Licitações de clientes sem franquia podem ser atualizadas por todos (legado)
        )
    )
);

CREATE POLICY "Licitações podem ser excluídas por usuários autenticados"
ON licitacoes FOR DELETE
TO authenticated
USING (
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM clientes c
        WHERE c.id = licitacoes.cliente_id
        AND (
            public.is_admin() OR 
            (public.is_franquia() AND c.franquia_id = public.get_user_franquia_id()) OR
            (c.franquia_id IS NULL) -- Licitações de clientes sem franquia podem ser excluídas por todos (legado)
        )
    )
);

-- Criar políticas para a tabela documentos_cliente
CREATE POLICY "Documentos de cliente são visíveis para usuários autenticados"
ON documentos_cliente FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Documentos de cliente podem ser inseridos por usuários autenticados"
ON documentos_cliente FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Documentos de cliente podem ser atualizados por usuários autenticados"
ON documentos_cliente FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Documentos de cliente podem ser excluídos por usuários autenticados"
ON documentos_cliente FOR DELETE
TO authenticated
USING (true);

-- Criar políticas para a tabela documentos_licitacao
CREATE POLICY "Documentos de licitação são visíveis para usuários autenticados"
ON documentos_licitacao FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Documentos de licitação podem ser inseridos por usuários autenticados"
ON documentos_licitacao FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Documentos de licitação podem ser atualizados por usuários autenticados"
ON documentos_licitacao FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Documentos de licitação podem ser excluídos por usuários autenticados"
ON documentos_licitacao FOR DELETE
TO authenticated
USING (true);

-- Criar políticas para a tabela requisitos_documentacao
CREATE POLICY "Requisitos são visíveis para usuários autenticados"
ON requisitos_documentacao FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Requisitos podem ser inseridos por usuários autenticados"
ON requisitos_documentacao FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Requisitos podem ser atualizados por usuários autenticados"
ON requisitos_documentacao FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Requisitos podem ser excluídos por usuários autenticados"
ON requisitos_documentacao FOR DELETE
TO authenticated
USING (true);

-- Criar políticas para a tabela prazos
CREATE POLICY "Prazos são visíveis para usuários autenticados"
ON prazos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Prazos podem ser inseridos por usuários autenticados"
ON prazos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Prazos podem ser atualizados por usuários autenticados"
ON prazos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Prazos podem ser excluídos por usuários autenticados"
ON prazos FOR DELETE
TO authenticated
USING (true);

-- Criar políticas para a tabela tipos_documentos
CREATE POLICY "Tipos de documentos são visíveis para usuários autenticados"
ON tipos_documentos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Tipos de documentos podem ser inseridos por usuários autenticados"
ON tipos_documentos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Tipos de documentos podem ser atualizados por usuários autenticados"
ON tipos_documentos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Tipos de documentos podem ser excluídos por usuários autenticados"
ON tipos_documentos FOR DELETE
TO authenticated
USING (true);

-- Configurar permissões para o storage
-- Isso deve ser feito na interface do Supabase, mas aqui está um lembrete:
-- 1. Vá para Storage no Supabase
-- 2. Crie um bucket chamado 'documentos' se ainda não existir
-- 3. Configure as políticas de acesso para permitir apenas usuários autenticados
--    - SELECT: auth.role() = 'authenticated'
--    - INSERT: auth.role() = 'authenticated'
--    - UPDATE: auth.role() = 'authenticated'
--    - DELETE: auth.role() = 'authenticated' 