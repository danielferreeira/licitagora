import { supabase } from './supabaseConfig';

// Serviço para gerenciamento de mensagens
const messageService = {
  // Função para enviar uma mensagem
  async enviarMensagem(mensagem) {
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .insert(mensagem)
        .select();
        
      if (error) throw error;
      return data[0];
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      throw err;
    }
  },
  
  // Função para listar mensagens
  async listarMensagens(filtros = {}) {
    try {
      let query = supabase
        .from('mensagens')
        .select('*');
        
      // Aplicar filtros se existirem
      if (filtros.usuario_id) {
        query = query.eq('usuario_id', filtros.usuario_id);
      }
      
      if (filtros.leitura === true || filtros.leitura === false) {
        query = query.eq('lida', filtros.leitura);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar mensagens:', err);
      return [];
    }
  }
};

export default messageService; 