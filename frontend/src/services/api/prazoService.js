import { supabase, verificarAutenticacao } from './supabaseConfig';
import authService from './authService';

// Serviço para gerenciamento de prazos
const prazoService = {
  // Listar todos os prazos
  async listarPrazos(filtros = {}) {
    await verificarAutenticacao();
    const user = await authService.getCurrentUser();
    
    try {
      // Usar supabase.from diretamente em vez de SQL personalizado
      console.log('Consultando prazos diretamente via Supabase...');
      
      let query = supabase
        .from('prazos')
        .select(`
          id,
          titulo,
          data_prazo,
          observacoes,
          tipo,
          licitacao_id,
          licitacoes:licitacao_id (
            id,
            numero,
            objeto,
            cliente_id,
            clientes:cliente_id (
              id,
              razao_social
            )
          )
        `);
      
      // Adicionar filtros
      if (filtros.licitacao_id) {
        query = query.eq('licitacao_id', filtros.licitacao_id);
      }
      
      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }
      
      if (filtros.dataInicio) {
        query = query.gte('data_prazo', filtros.dataInicio);
      }
      
      if (filtros.dataFim) {
        query = query.lte('data_prazo', filtros.dataFim);
      }
      
      // Ordenação
      query = query.order('data_prazo');
      
      // Executar a consulta
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao listar prazos:', error);
        throw error;
      }
      
      // Transformar os dados para manter compatibilidade com o formato anterior
      const prazosFormatados = data.map(prazo => ({
        id: prazo.id,
        titulo: prazo.titulo,
        data_prazo: prazo.data_prazo,
        observacoes: prazo.observacoes,
        licitacao_id: prazo.licitacao_id,
        tipo: prazo.tipo,
        licitacao_numero: prazo.licitacoes?.numero,
        licitacao_objeto: prazo.licitacoes?.objeto,
        cliente_id: prazo.licitacoes?.cliente_id,
        nome_cliente: prazo.licitacoes?.clientes?.razao_social
      }));
      
      console.log('Prazos consultados:', prazosFormatados.length);
      return prazosFormatados;
    } catch (err) {
      console.error('Exceção ao listar prazos:', err);
      throw err;
    }
  },
  
  // Obter prazo por ID
  async obterPrazoPorId(id) {
    await verificarAutenticacao();
    
    try {
      const { data, error } = await supabase
        .from('prazos')
        .select(`
          *,
          licitacao:licitacoes(
            id,
            numero,
            objeto,
            cliente:clientes(
              id,
              razao_social
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        console.error(`Erro ao obter prazo ${id}:`, error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error(`Exceção ao obter prazo ${id}:`, err);
      throw err;
    }
  },
  
  // Criar novo prazo
  async criarPrazo(prazo) {
    await verificarAutenticacao();
    const user = await authService.getCurrentUser();
    
    try {
      // Adicionar metadados
      const novoPrazo = {
        ...prazo,
        criado_por: user.id,
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      };
      
      console.log('Criando prazo com dados:', novoPrazo);
      
      const { data, error } = await supabase
        .from('prazos')
        .insert([novoPrazo])
        .select();
      
      if (error) {
        console.error('Erro ao criar prazo:', error);
        throw error;
      }
      
      console.log('Prazo criado com sucesso:', data?.[0]?.id);
      return data[0];
    } catch (err) {
      console.error('Exceção ao criar prazo:', err);
      throw err;
    }
  },
  
  // Atualizar prazo existente
  async atualizarPrazo(id, prazo) {
    await verificarAutenticacao();
    const user = await authService.getCurrentUser();
    
    try {
      // Adicionar metadados de atualização
      const prazoAtualizado = {
        ...prazo,
        atualizado_em: new Date().toISOString(),
        atualizado_por: user.id
      };
      
      console.log('Atualizando prazo:', id, prazoAtualizado);
      
      // Verificar se o prazo existe
      const { data: prazoExistente } = await supabase
        .from('prazos')
        .select('id')
        .eq('id', id)
        .single();
        
      if (!prazoExistente) {
        throw new Error(`Prazo ${id} não encontrado`);
      }
      
      const { data, error } = await supabase
        .from('prazos')
        .update(prazoAtualizado)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error(`Erro ao atualizar prazo ${id}:`, error);
        throw error;
      }
      
      console.log('Prazo atualizado com sucesso:', id);
      return data[0];
    } catch (err) {
      console.error(`Exceção ao atualizar prazo ${id}:`, err);
      throw err;
    }
  },
  
  // Excluir prazo
  async excluirPrazo(id) {
    await verificarAutenticacao();
    
    try {
      const { error } = await supabase
        .from('prazos')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`Erro ao excluir prazo ${id}:`, error);
        throw error;
      }
      
      return true;
    } catch (err) {
      console.error(`Exceção ao excluir prazo ${id}:`, err);
      throw err;
    }
  },
  
  // Importar prazos automaticamente de uma licitação
  async importarPrazosLicitacao(licitacaoId) {
    await verificarAutenticacao();
    const user = await authService.getCurrentUser();
    
    try {
      // Verificar se a função RPC existe
      try {
        const { data, error } = await supabase.rpc('importar_prazos_licitacao', {
          p_licitacao_id: licitacaoId,
          p_user_id: user.id
        });
        
        if (error) {
          console.error(`Erro ao importar prazos da licitação ${licitacaoId}:`, error);
          throw error;
        }
        
        return data || [];
      } catch (rpcError) {
        console.error('Erro ao chamar RPC, tentando implementação alternativa:', rpcError);
        
        // Se a RPC falhar, implementamos aqui uma versão básica
        // Buscar a licitação
        const { data: licitacao } = await supabase
          .from('licitacoes')
          .select('*')
          .eq('id', licitacaoId)
          .single();
        
        if (!licitacao) {
          throw new Error('Licitação não encontrada');
        }
        
        // Verificar se já existe prazo de abertura
        const { data: prazosExistentes } = await supabase
          .from('prazos')
          .select('*')
          .eq('licitacao_id', licitacaoId)
          .eq('tipo', 'ABERTURA');
        
        if (!prazosExistentes || prazosExistentes.length === 0) {
          // Criar prazo de abertura
          const novoPrazo = {
            licitacao_id: licitacaoId,
            titulo: `Abertura da Licitação: ${licitacao.numero}`,
            tipo: 'ABERTURA',
            data_prazo: licitacao.data_abertura,
            observacoes: 'Prazo importado automaticamente',
            criado_por: user.id,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          };
          
          const { data, error } = await supabase
            .from('prazos')
            .insert([novoPrazo])
            .select();
          
          if (error) {
            console.error('Erro ao criar prazo de abertura:', error);
            throw error;
          }
          
          return data;
        }
        
        return prazosExistentes;
      }
    } catch (err) {
      console.error(`Exceção ao importar prazos da licitação ${licitacaoId}:`, err);
      throw err;
    }
  },
  
  // Importar todos os prazos para todas licitações
  async importarPrazos() {
    await verificarAutenticacao();
    const user = await authService.getCurrentUser();
    
    try {
      // Verificar se a RPC existe
      try {
        const { data, error } = await supabase.rpc('importar_todos_prazos', {
          p_user_id: user.id
        });
        
        if (error) {
          console.error('Erro ao importar prazos:', error);
          throw error;
        }
        
        return data || [];
      } catch (rpcError) {
        console.error('Erro ao chamar RPC, tentando implementação alternativa:', rpcError);
        
        // Se a RPC falhar, implementamos uma versão básica
        // Buscar licitações que não têm prazo de abertura
        const { data: licitacoes } = await supabase
          .from('licitacoes')
          .select('*');
        
        if (!licitacoes || licitacoes.length === 0) {
          return [];
        }
        
        const prazosImportados = [];
        
        // Para cada licitação, verificar se já tem prazo de abertura
        for (const licitacao of licitacoes) {
          // Verificar se já existe prazo de abertura
          const { data: prazosExistentes } = await supabase
            .from('prazos')
            .select('*')
            .eq('licitacao_id', licitacao.id)
            .eq('tipo', 'ABERTURA');
          
          if (!prazosExistentes || prazosExistentes.length === 0) {
            // Criar prazo de abertura
            const novoPrazo = {
              licitacao_id: licitacao.id,
              titulo: `Abertura da Licitação: ${licitacao.numero}`,
              tipo: 'ABERTURA',
              data_prazo: licitacao.data_abertura,
              observacoes: 'Prazo importado automaticamente',
              criado_por: user.id,
              criado_em: new Date().toISOString(),
              atualizado_em: new Date().toISOString()
            };
            
            const { data, error } = await supabase
              .from('prazos')
              .insert([novoPrazo])
              .select();
            
            if (error) {
              console.error(`Erro ao criar prazo de abertura para licitação ${licitacao.id}:`, error);
              continue;
            }
            
            if (data && data.length > 0) {
              prazosImportados.push(data[0]);
            }
          }
        }
        
        return prazosImportados;
      }
    } catch (err) {
      console.error('Exceção ao importar prazos:', err);
      throw err;
    }
  },
  
  // Buscar prazo por ID específico
  async buscarPrazoPorId(id) {
    return this.obterPrazoPorId(id);
  }
};

export default prazoService; 