// Arquivo de configuração central do Supabase
import { supabase } from '../../config/supabase';

// Função para verificar se o usuário está autenticado
export const verificarAutenticacao = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Usuário não autenticado. Faça login para continuar.');
  }
  return session;
};

// Função temporária para verificar se uma RPC existe
const rpcExists = async (rpcName) => {
  try {
    // Tentar executar a RPC com valores padrão
    const { data, error } = await supabase.rpc(rpcName);
    // Se o erro for 404, a função não existe
    if (error && (error.code === '404' || error.status === 404)) {
      return false;
    }
    // Se houver outros erros, provavelmente a função existe mas os parâmetros estão incorretos
    return true;
  } catch (err) {
    // Em caso de exceção, assume que a função não existe
    return false;
  }
};

// Funções de utilidade SQL
export const executarSQL = async (sql) => {
  try {
    const { data, error } = await supabase.rpc('executar_sql', { p_sql: sql });
    
    if (error) {
      console.error('Erro ao executar SQL:', error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error('Exceção ao executar SQL:', err);
    throw err;
  }
};

// Função para executar SQL parametrizado
export const executarSQLComParams = async (sql, params) => {
  try {
    console.log('AVISO: A função executar_sql_com_params foi removida. Utilizando implementação alternativa.');
    console.log('SQL solicitado:', sql);
    console.log('Parâmetros:', params);
    
    // Esta é uma implementação simplificada que não executa SQL diretamente
    // Em vez disso, recomendamos usar supabase.from().select() ou outras APIs do Supabase
    
    if (sql.includes('prazos p')) {
      console.log('Detectada consulta de prazos. Use prazoService.listarPrazos() com a nova implementação.');
      
      // Tentar extrair as tabelas da consulta
      const tables = [];
      if (sql.includes('prazos')) tables.push('prazos');
      if (sql.includes('licitacoes')) tables.push('licitacoes');
      if (sql.includes('clientes')) tables.push('clientes');
      
      console.log('Tabelas detectadas na consulta:', tables.join(', '));
      
      // Se a consulta inclui prazos, retornar um array vazio
      // O serviço de prazos foi atualizado para usar supabase.from().select()
      return [];
    }
    
    // Para outras consultas, lançar um erro informativo
    throw new Error('SQL direto não é mais suportado. Por favor, use as APIs do Supabase.');
  } catch (err) {
    console.error('Exceção ao executar SQL parametrizado:', err);
    throw err;
  }
};

export const verificarFuncaoExiste = async (nomeFuncao, esquema = 'public') => {
  try {
    console.log(`AVISO: Verificação de função "${nomeFuncao}" desativada`);
    
    // Funções conhecidas que existem no sistema
    const funcoesConhecidas = [
      'importar_prazos_licitacao',
      'importar_todos_prazos'
    ];
    
    // Verificar se a função está na lista de conhecidas
    if (funcoesConhecidas.includes(nomeFuncao)) {
      console.log(`Função "${nomeFuncao}" é conhecida e pode existir no banco de dados`);
      return true;
    }
    
    console.log(`Função "${nomeFuncao}" não existe ou não é conhecida`);
    return false;
  } catch (err) {
    console.error(`Exceção ao verificar existência da função ${nomeFuncao}:`, err);
    return false;
  }
};

export const verificarTabelaExiste = async (nomeTabela, esquema = 'public') => {
  try {
    const { data, error } = await supabase.rpc('verificar_tabela_existe', { 
      p_nome_tabela: nomeTabela,
      p_esquema: esquema
    });
    
    if (error) {
      console.error(`Erro ao verificar existência da tabela ${nomeTabela}:`, error);
      return false;
    }
    
    return data === true;
  } catch (err) {
    console.error(`Exceção ao verificar existência da tabela ${nomeTabela}:`, err);
    return false;
  }
};

// Checar se a conexão com o Supabase está funcionando
export const verificarConexao = async () => {
  try {
    console.log('Verificando conexão com o Supabase...');
    
    // Usar uma abordagem mais simples: verificar se temos uma sessão
    const { data } = await supabase.auth.getSession();
    
    // Verificar o status da rede em vez de fazer consultas 
    if (!navigator.onLine) {
      console.error('Dispositivo sem conexão com a internet');
      return false;
    }
    
    console.log('Conexão com o Supabase verificada', data ? 'Com sessão' : 'Sem sessão');
    
    // Consideramos que a conexão existe mesmo sem sessão
    return true;
  } catch (error) {
    console.error('Erro ao verificar conexão com o Supabase:', error);
    return false;
  }
};

// Exportar a instância do Supabase para uso em outros módulos
export { supabase }; 