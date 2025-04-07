-- Função para executar comandos SQL diretamente
CREATE OR REPLACE FUNCTION public.executar_sql(
    p_sql TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    EXECUTE p_sql;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 