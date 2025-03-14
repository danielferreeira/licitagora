-- Script para configurar permissões completas para usuários autenticados
-- Este script deve ser executado no SQL Editor do Supabase

-- Ativar Row Level Security (RLS) em todas as tabelas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE licitacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_licitacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE requisitos_documentacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE prazos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_documentos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar conflitos
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

-- Criar políticas para a tabela clientes (acesso total para usuários autenticados)
CREATE POLICY "Clientes são visíveis para usuários autenticados"
ON clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Clientes podem ser inseridos por usuários autenticados"
ON clientes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Clientes podem ser atualizados por usuários autenticados"
ON clientes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Clientes podem ser excluídos por usuários autenticados"
ON clientes FOR DELETE
TO authenticated
USING (true);

-- Criar políticas para a tabela licitacoes (acesso total para usuários autenticados)
CREATE POLICY "Licitações são visíveis para usuários autenticados"
ON licitacoes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Licitações podem ser inseridas por usuários autenticados"
ON licitacoes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Licitações podem ser atualizadas por usuários autenticados"
ON licitacoes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Licitações podem ser excluídas por usuários autenticados"
ON licitacoes FOR DELETE
TO authenticated
USING (true);

-- Criar políticas para a tabela documentos_cliente (acesso total para usuários autenticados)
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

-- Criar políticas para a tabela documentos_licitacao (acesso total para usuários autenticados)
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

-- Criar políticas para a tabela requisitos_documentacao (acesso total para usuários autenticados)
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

-- Criar políticas para a tabela prazos (acesso total para usuários autenticados)
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

-- Criar políticas para a tabela tipos_documentos (acesso total para usuários autenticados)
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

-- Configurar permissões para o bucket de armazenamento
-- Nota: Isso deve ser feito na interface do Supabase, mas aqui está o SQL equivalente
-- para referência (pode não funcionar diretamente no SQL Editor)

-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas para o bucket de armazenamento
CREATE POLICY "Arquivos são visíveis para usuários autenticados"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documentos');

CREATE POLICY "Arquivos podem ser inseridos por usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Arquivos podem ser atualizados por usuários autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documentos')
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Arquivos podem ser excluídos por usuários autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documentos');

-- Método alternativo: Desativar RLS completamente (menos seguro, mas mais simples)
-- Descomente as linhas abaixo se preferir desativar o RLS completamente
-- ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE licitacoes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE documentos_cliente DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE documentos_licitacao DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE requisitos_documentacao DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE prazos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE tipos_documentos DISABLE ROW LEVEL SECURITY; 