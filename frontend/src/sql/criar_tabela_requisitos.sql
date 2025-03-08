-- Habilitar extensão uuid se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tipo enum para status do requisito se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_requisito') THEN
        CREATE TYPE status_requisito AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'NAO_APLICAVEL');
    END IF;
END $$;

-- Criar função para trigger de timestamp se não existir
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Dropar tabela se existir para recriar
DROP TABLE IF EXISTS requisitos_documentacao CASCADE;

-- Criar tabela de requisitos
CREATE TABLE requisitos_documentacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    licitacao_id UUID NOT NULL,
    descricao TEXT NOT NULL,
    status status_requisito NOT NULL DEFAULT 'PENDENTE',
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_licitacao
        FOREIGN KEY (licitacao_id)
        REFERENCES licitacoes(id)
        ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX idx_requisitos_licitacao ON requisitos_documentacao(licitacao_id);
CREATE INDEX idx_requisitos_status ON requisitos_documentacao(status);

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS set_timestamp_requisitos_documentacao ON requisitos_documentacao;
CREATE TRIGGER set_timestamp_requisitos_documentacao
    BEFORE UPDATE ON requisitos_documentacao
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 