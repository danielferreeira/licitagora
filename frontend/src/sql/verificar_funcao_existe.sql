-- Função para verificar se uma função existe no banco de dados
CREATE OR REPLACE FUNCTION public.verificar_funcao_existe(
    p_schema TEXT,
    p_function_name TEXT
) RETURNS JSONB AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = p_schema
        AND p.proname = p_function_name
    ) INTO v_exists;
    
    RETURN jsonb_build_object('exists', v_exists);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('exists', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 