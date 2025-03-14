const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Obter as credenciais do Supabase do arquivo .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Erro: Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias.');
  process.exit(1);
}

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function executarSQL() {
  try {
    // Verificar se o arquivo SQL foi especificado
    const sqlFilePath = process.argv[2];
    if (!sqlFilePath) {
      console.error('Erro: Especifique o caminho para o arquivo SQL como argumento.');
      process.exit(1);
    }

    // Ler o arquivo SQL
    const sqlPath = path.resolve(process.cwd(), sqlFilePath);
    console.log(`Lendo arquivo SQL: ${sqlPath}`);
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`Erro: Arquivo SQL não encontrado: ${sqlPath}`);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    console.log('Conteúdo SQL carregado com sucesso.');

    // Executar o SQL
    console.log('Executando SQL no Supabase...');
    const { data, error } = await supabase.rpc('executar_sql_personalizado', {
      p_sql: sqlContent
    });

    if (error) {
      console.error('Erro ao executar SQL:', error);
      process.exit(1);
    }

    console.log('SQL executado com sucesso!');
    console.log('Resultado:', data);
    process.exit(0);
  } catch (error) {
    console.error('Erro ao executar o script:', error);
    process.exit(1);
  }
}

executarSQL(); 