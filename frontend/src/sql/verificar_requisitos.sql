-- Verificar estrutura da tabela requisitos_documentacao
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'requisitos_documentacao'
ORDER BY 
    ordinal_position;

-- Verificar permissões da tabela requisitos_documentacao
SELECT
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM
    information_schema.table_privileges
WHERE
    table_name = 'requisitos_documentacao';

-- Verificar se existem políticas RLS na tabela
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'requisitos_documentacao';

-- Verificar se a tabela tem RLS ativado
SELECT
    relname,
    relrowsecurity
FROM
    pg_class
WHERE
    relname = 'requisitos_documentacao';

-- Verificar contagem de requisitos por licitação
SELECT
    licitacao_id,
    COUNT(*) as total_requisitos
FROM
    requisitos_documentacao
GROUP BY
    licitacao_id
ORDER BY
    total_requisitos DESC
LIMIT 10;

-- Verificar se a função processar_requisitos_edital existe
SELECT
    proname,
    prosrc
FROM
    pg_proc
WHERE
    proname = 'processar_requisitos_edital';

-- Verificar permissões da função processar_requisitos_edital
SELECT
    routine_name,
    grantee,
    privilege_type
FROM
    information_schema.routine_privileges
WHERE
    routine_name = 'processar_requisitos_edital';

-- Verificar se o tipo requisito_result existe
SELECT
    typname,
    typtype
FROM
    pg_type
WHERE
    typname = 'requisito_result'; 