CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  razao_social VARCHAR(255) NOT NULL,
  cnpj VARCHAR(14) NOT NULL UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  cep VARCHAR(8),
  endereco VARCHAR(255),
  numero VARCHAR(10),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  ramos_atividade TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS licitacoes (
  id SERIAL PRIMARY KEY,
  numero VARCHAR(50) NOT NULL,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  orgao VARCHAR(255) NOT NULL,
  objeto TEXT NOT NULL,
  modalidade VARCHAR(50) NOT NULL,
  data_abertura TIMESTAMP NOT NULL,
  data_fim TIMESTAMP,
  valor_estimado DECIMAL(15,2) NOT NULL,
  lucro_estimado DECIMAL(15,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'Em Análise',
  ramo_atividade VARCHAR(100) NOT NULL,
  descricao TEXT,
  requisitos TEXT,
  observacoes TEXT,
  valor_final DECIMAL(15,2),
  lucro_final DECIMAL(15,2),
  foi_ganha BOOLEAN,
  data_fechamento TIMESTAMP,
  motivo_perda TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nova tabela para tipos de documentos de cliente
CREATE TABLE IF NOT EXISTS tipos_documentos_cliente (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  obrigatorio BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nova tabela para documentos dos clientes
CREATE TABLE IF NOT EXISTS documentos_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  tipo_documento_id INTEGER NOT NULL REFERENCES tipos_documentos_cliente(id),
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(255) NOT NULL,
  data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_validade TIMESTAMP,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nova tabela para documentos das licitações
CREATE TABLE IF NOT EXISTS documentos_licitacao (
  id SERIAL PRIMARY KEY,
  licitacao_id INTEGER NOT NULL REFERENCES licitacoes(id),
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'EDITAL' ou 'DOCUMENTO'
  nome_arquivo VARCHAR(255) NOT NULL,
  caminho_arquivo VARCHAR(255) NOT NULL,
  data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nova tabela para requisitos de documentação extraídos do edital
CREATE TABLE IF NOT EXISTS requisitos_documentacao (
  id SERIAL PRIMARY KEY,
  licitacao_id INTEGER NOT NULL REFERENCES licitacoes(id),
  descricao TEXT NOT NULL,
  atendido BOOLEAN DEFAULT false,
  documento_id INTEGER REFERENCES documentos_licitacao(id),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir tipos de documentos padrão para clientes
INSERT INTO tipos_documentos_cliente (nome, descricao, obrigatorio) VALUES
('Contrato Social', 'Última alteração do contrato social', true),
('CNPJ', 'Comprovante de inscrição e situação cadastral', true),
('RG Sócios', 'Documento de identificação dos sócios', true),
('CPF Sócios', 'CPF dos sócios', true),
('Certidão Negativa Federal', 'Certidão negativa de débitos federais', true),
('Certidão Negativa Estadual', 'Certidão negativa de débitos estaduais', true),
('Certidão Negativa Municipal', 'Certidão negativa de débitos municipais', true),
('Certidão FGTS', 'Certificado de regularidade do FGTS', true),
('Certidão Trabalhista', 'Certidão negativa de débitos trabalhistas', true),
('Balanço Patrimonial', 'Último balanço patrimonial', true),
('Atestado de Capacidade Técnica', 'Atestados de capacidade técnica', false),
('Alvará de Funcionamento', 'Alvará de funcionamento', true),
('Procuração', 'Procuração para representante legal', false); 