CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    razao_social VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    cep VARCHAR(9),
    endereco VARCHAR(255),
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado CHAR(2) NOT NULL,
    ramos_atividade TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela de licitações
CREATE TABLE IF NOT EXISTS licitacoes (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(20) NOT NULL,
  orgao VARCHAR(255) NOT NULL,
  objeto TEXT NOT NULL,
  data_abertura TIMESTAMP NOT NULL,
  data_fim TIMESTAMP,
  valor_estimado DECIMAL(15,2) NOT NULL,
  modalidade VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'aberta',
  ramos_atividade TEXT[] NOT NULL,
  edital_url TEXT,
  cliente_id INTEGER REFERENCES clientes(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar o updated_at das licitações
CREATE OR REPLACE FUNCTION update_licitacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_licitacoes_updated_at
  BEFORE UPDATE ON licitacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_licitacoes_updated_at();

-- Criar tabela de prazos se não existir
CREATE TABLE IF NOT EXISTS prazos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  data_prazo TIMESTAMP NOT NULL,
  observacoes TEXT,
  licitacao_id INTEGER REFERENCES licitacoes(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para atualizar o updated_at dos prazos
CREATE TRIGGER update_prazos_updated_at
  BEFORE UPDATE ON prazos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 