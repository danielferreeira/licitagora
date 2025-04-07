#!/usr/bin/env node

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';

// Inicializar dotenv
config();

// Obter o diretório atual no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar cliente Supabase usando as mesmas credenciais de config/supabase.js
const supabaseUrl = 'https://lyyfjeijnwnyxgkqlnlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eWZqZWlqbndueXhna3FsbmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTg3NzYsImV4cCI6MjA1Njg3NDc3Nn0.s92Kiy2Y7GjzTL-vDYeHI_oub8CR8Gw9i6htkqw5hJ8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function executarSQL(sql) {
  try {
    // Usar a função executar_sql_personalizado que já existe
    const { data, error } = await supabase.rpc('executar_sql_personalizado', { 
      p_sql: sql 
    });

    if (error) {
      console.error('Erro ao executar SQL:', error);
      return { sucesso: false, erro: error };
    }
    
    return { sucesso: true, dados: data };
  } catch (err) {
    console.error('Exceção ao executar SQL:', err);
    return { sucesso: false, erro: err };
  }
}

async function main() {
  // Verificar se o arquivo foi passado como argumento
  if (process.argv.length < 3) {
    console.error('Uso: node execute_sql.js <caminho/para/arquivo.sql>');
    process.exit(1);
  }

  const sqlFilePath = process.argv[2];

  try {
    // Ler conteúdo do arquivo SQL
    const sql = fs.readFileSync(path.resolve(sqlFilePath), 'utf8');
    console.log(`Executando SQL do arquivo: ${sqlFilePath}`);

    // Executar o SQL
    const resultado = await executarSQL(sql);

    if (resultado.sucesso) {
      console.log('SQL executado com sucesso!');
      console.log('Resultado:', resultado.dados);
      process.exit(0);
    } else {
      console.error('Erro ao executar SQL:', resultado.erro);
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro ao processar arquivo SQL:', error);
    process.exit(1);
  }
}

// Executar o script
main(); 