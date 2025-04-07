-- Função para executar SQL com parâmetros
CREATE OR REPLACE FUNCTION public.executar_sql_com_params(
    p_sql TEXT,
    p_params TEXT[] DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_query TEXT;
    v_sql_final TEXT;
    v_i INTEGER;
BEGIN
    -- Verificar se temos parâmetros
    IF p_params IS NULL OR array_length(p_params, 1) IS NULL THEN
        -- Executar sem parâmetros
        EXECUTE p_sql INTO v_result;
    ELSE
        -- Preparar o SQL com parâmetros
        v_sql_final := p_sql;
        
        -- Executar com parâmetros
        EXECUTE v_sql_final USING p_params INTO v_result;
    END IF;
    
    -- Se o resultado for nulo, retornar um array vazio
    IF v_result IS NULL THEN
        RETURN '[]'::JSONB;
    END IF;
    
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    -- Registrar o erro para auditoria
    INSERT INTO public.log_execucao_sql (sql_executado, executado_por, erro, parametros)
    VALUES (p_sql, current_user, SQLERRM, p_params::TEXT);
    
    -- Retornar erro
    RAISE EXCEPTION 'Erro ao executar SQL: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar a tabela de log se não existir
CREATE TABLE IF NOT EXISTS public.log_execucao_sql (
    id SERIAL PRIMARY KEY,
    sql_executado TEXT NOT NULL,
    executado_por TEXT NOT NULL,
    erro TEXT,
    parametros TEXT,
    data_execucao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conceder permissões de execução
GRANT EXECUTE ON FUNCTION public.executar_sql_com_params(TEXT, TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION public.executar_sql_com_params(TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.executar_sql_com_params(TEXT, TEXT[]) TO service_role;
