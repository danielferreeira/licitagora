-- Função para executar SQL personalizado
CREATE OR REPLACE FUNCTION public.executar_sql_personalizado(p_sql text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_resultado jsonb;
BEGIN
    -- Registrar a execução para fins de auditoria
    INSERT INTO public.log_execucao_sql (sql_executado, executado_por)
    VALUES (p_sql, current_user);

    -- Executar o SQL
    EXECUTE p_sql;

    -- Retornar sucesso
    v_resultado := jsonb_build_object(
        'sucesso', true,
        'mensagem', 'SQL executado com sucesso',
        'timestamp', now()
    );

    RETURN v_resultado;
EXCEPTION WHEN OTHERS THEN
    -- Registrar o erro
    INSERT INTO public.log_execucao_sql (sql_executado, executado_por, erro)
    VALUES (p_sql, current_user, SQLERRM);

    -- Retornar erro
    v_resultado := jsonb_build_object(
        'sucesso', false,
        'mensagem', 'Erro ao executar SQL',
        'erro', SQLERRM,
        'timestamp', now()
    );

    RETURN v_resultado;
END;
$$;

-- Criar tabela de log se não existir
CREATE TABLE IF NOT EXISTS public.log_execucao_sql (
    id SERIAL PRIMARY KEY,
    sql_executado TEXT NOT NULL,
    executado_por TEXT NOT NULL,
    erro TEXT,
    data_execucao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conceder permissões para o usuário anônimo
GRANT EXECUTE ON FUNCTION public.executar_sql_personalizado(text) TO anon;
GRANT EXECUTE ON FUNCTION public.executar_sql_personalizado(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.executar_sql_personalizado(text) TO service_role; 