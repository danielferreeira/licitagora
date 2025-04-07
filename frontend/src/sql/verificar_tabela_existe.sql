-- Função para verificar se uma tabela existe no banco de dados
CREATE OR REPLACE FUNCTION public.verificar_tabela_existe(
    p_schema TEXT,
    p_table_name TEXT
) RETURNS JSONB AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM pg_tables
        WHERE schemaname = p_schema
        AND tablename = p_table_name
    ) INTO v_exists;
    
    RETURN jsonb_build_object('exists', v_exists);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('exists', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 