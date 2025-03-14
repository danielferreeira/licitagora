-- Verificar se existem dados nas tabelas principais
-- Verificar tabela de clientes
SELECT 'clientes' as tabela, COUNT(*) as total FROM clientes;

-- Verificar tabela de licitações
SELECT 'licitacoes' as tabela, COUNT(*) as total FROM licitacoes;

-- Verificar status das licitações
SELECT status, COUNT(*) FROM licitacoes GROUP BY status;

-- Verificar licitações ganhas/perdidas
SELECT foi_ganha, COUNT(*) FROM licitacoes WHERE status = 'CONCLUIDA' GROUP BY foi_ganha;

-- Verificar valores das licitações
SELECT 
    'valores' as info,
    MIN(valor_estimado) as min_valor_estimado,
    MAX(valor_estimado) as max_valor_estimado,
    AVG(valor_estimado) as avg_valor_estimado,
    MIN(valor_final) as min_valor_final,
    MAX(valor_final) as max_valor_final,
    AVG(valor_final) as avg_valor_final
FROM licitacoes;

-- Verificar datas das licitações
SELECT 
    'datas' as info,
    MIN(data_abertura) as primeira_data,
    MAX(data_abertura) as ultima_data,
    COUNT(*) FILTER (WHERE data_abertura IS NULL) as sem_data_abertura,
    COUNT(*) FILTER (WHERE data_fechamento IS NULL) as sem_data_fechamento
FROM licitacoes;

-- Verificar relacionamento entre clientes e licitações
SELECT 
    c.id as cliente_id, 
    c.razao_social, 
    COUNT(l.id) as total_licitacoes
FROM clientes c
LEFT JOIN licitacoes l ON l.cliente_id = c.id
GROUP BY c.id, c.razao_social
ORDER BY total_licitacoes DESC
LIMIT 10; 