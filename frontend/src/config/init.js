import { supabase } from './supabase';

async function createUpdateTimestampFunction() {
    const { error } = await supabase.rpc('create_update_timestamp_function', {
        function_definition: `
        CREATE OR REPLACE FUNCTION public.update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `
    });
    if (error) throw error;
}

export async function initializeDatabase() {
    try {
        // 1. Criar função de atualização de timestamp
        await createUpdateTimestampFunction();
        console.log('Função de timestamp criada com sucesso');

        // 2. Criar tabela de clientes
        await supabase.rpc('criar_tabela_clientes');
        console.log('Tabela de clientes criada com sucesso');

        // 3. Criar tabela de licitações
        await supabase.rpc('criar_tabela_licitacoes');
        console.log('Tabela de licitações criada com sucesso');

        // 4. Criar tabelas de documentos
        await supabase.rpc('criar_tabelas_documentos');
        console.log('Tabelas de documentos criadas com sucesso');

        console.log('Banco de dados inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
        throw error;
    }
} 