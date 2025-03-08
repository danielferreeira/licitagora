-- Função para criar a função de atualização de timestamp
CREATE OR REPLACE FUNCTION public.create_update_timestamp_function(function_definition TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE function_definition;
END;
$$; 