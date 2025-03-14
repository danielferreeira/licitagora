-- Script para desativar completamente o Row Level Security (RLS) para todas as tabelas
-- Este script deve ser executado no SQL Editor do Supabase
-- ATENÇÃO: Esta é uma abordagem menos segura, mas mais simples para garantir acesso total

-- Desativar RLS para todas as tabelas
ALTER TABLE clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE licitacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_cliente DISABLE ROW LEVEL SECURITY;
ALTER TABLE documentos_licitacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE requisitos_documentacao DISABLE ROW LEVEL SECURITY;
ALTER TABLE prazos DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_documentos DISABLE ROW LEVEL SECURITY;

-- Configurar permissões para o bucket de armazenamento
-- Nota: Isso deve ser feito na interface do Supabase, mas aqui está o SQL equivalente
-- para referência (pode não funcionar diretamente no SQL Editor)

-- Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes para o bucket
DROP POLICY IF EXISTS "Arquivos são visíveis para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos podem ser inseridos por usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos podem ser atualizados por usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos podem ser excluídos por usuários autenticados" ON storage.objects;

-- Configurar políticas para o bucket de armazenamento
CREATE POLICY "Arquivos são visíveis para usuários autenticados"
ON storage.objects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Arquivos podem ser inseridos por usuários autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Arquivos podem ser atualizados por usuários autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Arquivos podem ser excluídos por usuários autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (true); 