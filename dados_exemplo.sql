-- Inserindo clientes
INSERT INTO clientes (razao_social, cnpj, email, telefone, cep, endereco, numero, bairro, cidade, estado, ramos_atividade) VALUES
('Construtora Alpha Ltda', '12345678000101', 'contato@alpha.com', '1133445566', '01234567', 'Av Principal', '100', 'Centro', 'São Paulo', 'SP', ARRAY['Construção Civil']),
('Tech Solutions SA', '23456789000102', 'contato@techsolutions.com', '1144556677', '12345678', 'Rua da Inovação', '200', 'Vila Nova', 'São Paulo', 'SP', ARRAY['Tecnologia da Informação']),
('Clean Service Ltda', '34567890000103', 'contato@cleanservice.com', '1155667788', '23456789', 'Rua dos Serviços', '300', 'Jardins', 'Rio de Janeiro', 'RJ', ARRAY['Serviços de Limpeza']),
('Manutenção Total SA', '45678901000104', 'contato@manutencao.com', '1166778899', '34567890', 'Av das Indústrias', '400', 'Distrito Industrial', 'Belo Horizonte', 'MG', ARRAY['Manutenção']),
('Consultoria Expert Ltda', '56789012000105', 'contato@expert.com', '1177889900', '45678901', 'Rua dos Consultores', '500', 'Brooklin', 'São Paulo', 'SP', ARRAY['Consultoria']),
('Materiais Construção SA', '67890123000106', 'contato@materiais.com', '1188990011', '56789012', 'Av do Comércio', '600', 'Centro', 'Curitiba', 'PR', ARRAY['Fornecimento de Materiais', 'Construção Civil']),
('InfoTech Services Ltda', '78901234000107', 'contato@infotech.com', '1199001122', '67890123', 'Rua da Tecnologia', '700', 'Alphaville', 'Barueri', 'SP', ARRAY['Tecnologia da Informação', 'Consultoria']),
('Limpeza & Conservação SA', '89012345000108', 'contato@limpeza.com', '1122113344', '78901234', 'Av dos Serviços', '800', 'Centro', 'Salvador', 'BA', ARRAY['Serviços de Limpeza', 'Manutenção']),
('Engenharia Beta Ltda', '90123456000109', 'contato@beta.com', '1133224455', '89012345', 'Rua dos Engenheiros', '900', 'Jardim América', 'São Paulo', 'SP', ARRAY['Construção Civil', 'Consultoria']),
('Multi Serviços SA', '01234567000110', 'contato@multiservicos.com', '1144335566', '90123456', 'Av Central', '1000', 'Centro', 'Recife', 'PE', ARRAY['Manutenção', 'Serviços de Limpeza', 'Fornecimento de Materiais']);

-- Inserindo licitações
INSERT INTO licitacoes (numero, cliente_id, orgao, objeto, modalidade, data_abertura, data_fim, valor_estimado, lucro_estimado, status, ramo_atividade, descricao) VALUES
('PE-001/2024', 1, 'Prefeitura de São Paulo', 'Construção de Escola Municipal', 'Pregão Eletrônico', '2024-03-15 10:00:00', '2024-04-15 10:00:00', 2500000.00, 250000.00, 'Em Análise', 'Construção Civil', 'Construção de escola com 12 salas'),
('PP-002/2024', 2, 'Tribunal de Justiça SP', 'Sistema de Gestão Processual', 'Pregão Presencial', '2024-03-20 14:00:00', '2024-04-20 14:00:00', 1500000.00, 300000.00, 'Em Análise', 'Tecnologia da Informação', 'Desenvolvimento de sistema'),
('CC-003/2024', 3, 'Secretaria de Saúde RJ', 'Limpeza de Hospitais', 'Concorrência', '2024-03-25 09:00:00', '2024-04-25 09:00:00', 800000.00, 160000.00, 'Em Análise', 'Serviços de Limpeza', 'Serviços de limpeza para 5 hospitais'),
('PE-004/2024', 4, 'UFMG', 'Manutenção Predial', 'Pregão Eletrônico', '2024-04-01 10:00:00', '2024-05-01 10:00:00', 600000.00, 120000.00, 'Em Análise', 'Manutenção', 'Manutenção de prédios universitários'),
('TP-005/2024', 5, 'Banco Central', 'Consultoria Financeira', 'Tomada de Preços', '2024-04-05 14:00:00', '2024-05-05 14:00:00', 400000.00, 80000.00, 'Em Análise', 'Consultoria', 'Consultoria em processos financeiros'),
('PE-006/2024', 6, 'Secretaria de Obras PR', 'Fornecimento de Material de Construção', 'Pregão Eletrônico', '2024-04-10 09:00:00', '2024-05-10 09:00:00', 1200000.00, 240000.00, 'Em Análise', 'Fornecimento de Materiais', 'Fornecimento de materiais para obras'),
('PE-007/2024', 7, 'Ministério da Educação', 'Sistema de Gestão Escolar', 'Pregão Eletrônico', '2024-04-15 10:00:00', '2024-05-15 10:00:00', 2000000.00, 400000.00, 'Em Análise', 'Tecnologia da Informação', 'Sistema de gestão para escolas'),
('CC-008/2024', 8, 'Petrobrás', 'Limpeza Industrial', 'Concorrência', '2024-04-20 14:00:00', '2024-05-20 14:00:00', 3000000.00, 600000.00, 'Em Análise', 'Serviços de Limpeza', 'Limpeza de instalações industriais'),
('TP-009/2024', 9, 'DNIT', 'Construção de Ponte', 'Tomada de Preços', '2024-04-25 09:00:00', '2024-05-25 09:00:00', 5000000.00, 1000000.00, 'Em Análise', 'Construção Civil', 'Construção de ponte rodoviária'),
('PE-010/2024', 10, 'Ministério da Defesa', 'Manutenção de Equipamentos', 'Pregão Eletrônico', '2024-05-01 10:00:00', '2024-06-01 10:00:00', 1500000.00, 300000.00, 'Em Análise', 'Manutenção', 'Manutenção de equipamentos militares'),
('PE-011/2024', 1, 'Prefeitura de Campinas', 'Construção de UPA', 'Pregão Eletrônico', '2024-05-05 14:00:00', '2024-06-05 14:00:00', 3000000.00, 600000.00, 'Em Análise', 'Construção Civil', 'Construção de Unidade de Pronto Atendimento'),
('PP-012/2024', 2, 'Tribunal Regional Federal', 'Sistema de Backup', 'Pregão Presencial', '2024-05-10 09:00:00', '2024-06-10 09:00:00', 800000.00, 160000.00, 'Em Análise', 'Tecnologia da Informação', 'Sistema de backup e recuperação'),
('PE-013/2024', 3, 'Secretaria de Educação RJ', 'Limpeza de Escolas', 'Pregão Eletrônico', '2024-05-15 10:00:00', '2024-06-15 10:00:00', 1000000.00, 200000.00, 'Em Análise', 'Serviços de Limpeza', 'Limpeza de 20 escolas estaduais'),
('CC-014/2024', 4, 'Infraero', 'Manutenção de Aeroportos', 'Concorrência', '2024-05-20 14:00:00', '2024-06-20 14:00:00', 4000000.00, 800000.00, 'Em Análise', 'Manutenção', 'Manutenção de 3 aeroportos'),
('TP-015/2024', 5, 'Receita Federal', 'Consultoria Tributária', 'Tomada de Preços', '2024-05-25 09:00:00', '2024-06-25 09:00:00', 600000.00, 120000.00, 'Em Análise', 'Consultoria', 'Consultoria em processos tributários'); 