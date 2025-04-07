import { supabase, executarSQL, verificarAutenticacao } from './supabaseConfig';
import authService from './authService';
import { verificarPermissaoAdmin, obterFranquiaDoUsuario } from './utils';

// Serviço para gerenciamento de franquias
const franquiaService = {
  // Listar todas as franquias (apenas admin)
  async listarFranquias() {
    try {
      await verificarAutenticacao();
      
      // Verificar se é admin
      const user = await authService.getCurrentUser();
      const isAdmin = await verificarPermissaoAdmin(user.id);
      if (!isAdmin) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('franquias')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Erro ao listar franquias:', error);
      throw error;
    }
  },
  
  // Buscar franquia por ID
  async buscarFranquiaPorId(id) {
    try {
      await verificarAutenticacao();
      
      const { data, error } = await supabase
        .from('franquias')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error(`Erro ao buscar franquia ${id}:`, error);
      throw error;
    }
  },
  
  // Buscar franquia atual do usuário logado
  async buscarFranquiaAtual() {
    try {
      const user = await authService.getCurrentUser();
      if (!user) return null;
      
      // Obter o ID da franquia do usuário usando nossa função temporária
      const franquiaId = await obterFranquiaDoUsuario(user.id);
      if (!franquiaId) return null;
      
      // Buscar os dados completos da franquia
      const { data, error } = await supabase
        .from('franquias')
        .select('*')
        .eq('id', franquiaId)
        .single();
      
      if (error) {
        console.warn('Erro ao buscar dados da franquia:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar franquia do usuário:', error);
      return null;
    }
  },
  
  // Criar nova franquia
  async criarFranquia(franquia) {
    try {
      await verificarAutenticacao();
      
      // Verificar se é admin
      const user = await authService.getCurrentUser();
      if (!user || (user.email !== 'admin@licitagora.com' && user.app_metadata?.role !== 'admin')) {
        throw new Error('Apenas administradores podem criar franquias');
      }
      
      // Garantir que as extensões necessárias estão criadas
      try {
        await executarSQL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      } catch (err) {
        console.warn('Erro ao criar extensão UUID:', err);
        // Ignorar erro, pois pode ser que já exista
      }
      
      // Tentar configurar a tabela franquias
      try {
        await supabase.rpc('configurar_tabela_franquias');
      } catch (configErr) {
        console.warn('Erro ao configurar tabela de franquias:', configErr);
      }
      
      // Formatar dados da franquia
      const franquiaData = {
        nome: franquia.nome,
        cnpj: franquia.cnpj?.replace(/\D/g, ''),
        email: franquia.email,
        telefone: franquia.telefone?.replace(/\D/g, ''),
        endereco: franquia.endereco,
        numero: franquia.numero,
        bairro: franquia.bairro,
        cidade: franquia.cidade,
        estado: franquia.estado,
        cep: franquia.cep?.replace(/\D/g, ''),
        ativa: true,
        user_id: null // Será preenchido ao criar usuário
      };
      
      // Inserir a franquia
      const { data, error } = await supabase
        .from('franquias')
        .insert(franquiaData)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Erro ao criar franquia:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Atualizar franquia existente
  async atualizarFranquia(id, franquia) {
    try {
      await verificarAutenticacao();
      
      // Verificar se tem permissão (admin ou proprietário da franquia)
      const user = await authService.getCurrentUser();
      const isAdmin = user && (user.email === 'admin@licitagora.com' || user.app_metadata?.role === 'admin');
      
      if (!isAdmin) {
        // Verificar se é o proprietário
        const { data: franquiaAtual } = await supabase
          .from('franquias')
          .select('user_id')
          .eq('id', id)
          .single();
        
        if (franquiaAtual?.user_id !== user.id) {
          throw new Error('Você não tem permissão para atualizar esta franquia');
        }
      }
      
      // Formatar dados da franquia
      const franquiaData = {
        nome: franquia.nome,
        cnpj: franquia.cnpj?.replace(/\D/g, ''),
        // Email não pode ser atualizado
        telefone: franquia.telefone?.replace(/\D/g, ''),
        endereco: franquia.endereco,
        numero: franquia.numero,
        bairro: franquia.bairro,
        cidade: franquia.cidade,
        estado: franquia.estado,
        cep: franquia.cep?.replace(/\D/g, '')
      };
      
      const { data, error } = await supabase
        .from('franquias')
        .update(franquiaData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error(`Erro ao atualizar franquia ${id}:`, error);
      return { success: false, error: error.message };
    }
  },
  
  // Alterar status da franquia (ativar/desativar)
  async alterarStatusFranquia(id, ativa) {
    try {
      await verificarAutenticacao();
      
      // Verificar se é admin
      const user = await authService.getCurrentUser();
      if (!user || (user.email !== 'admin@licitagora.com' && user.app_metadata?.role !== 'admin')) {
        throw new Error('Apenas administradores podem alterar o status de franquias');
      }
      
      const { data, error } = await supabase
        .from('franquias')
        .update({ ativa })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error(`Erro ao alterar status da franquia ${id}:`, error);
      return { success: false, error: error.message };
    }
  },
  
  // Excluir uma franquia
  async excluirFranquia(franquiaId) {
    try {
      await verificarAutenticacao();
      
      // Verificar se é admin
      const user = await authService.getCurrentUser();
      if (!user || (user.email !== 'admin@licitagora.com' && user.app_metadata?.role !== 'admin')) {
        return { success: false, error: 'Apenas administradores podem excluir franquias' };
      }
      
      // Usar função SQL para exclusão com segurança
      const result = await supabase.rpc('excluir_franquia_com_usuario', {
        p_franquia_id: franquiaId
      });
      
      if (result.error) {
        throw result.error;
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Erro ao excluir franquia ${franquiaId}:`, error);
      return { 
        success: false, 
        error: error.message || 'Ocorreu um erro ao excluir a franquia'
      };
    }
  },
  
  // Listar clientes associados a uma franquia
  async listarClientesDaFranquia(franquiaId) {
    try {
      await verificarAutenticacao();
      
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('franquia_id', franquiaId)
        .order('razao_social');
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error(`Erro ao listar clientes da franquia ${franquiaId}:`, error);
      throw error;
    }
  },
  
  // Atribuir cliente a uma franquia
  async atribuirClienteAFranquia(clienteId, franquiaId) {
    try {
      await verificarAutenticacao();
      
      // Verificar se é admin
      const user = await authService.getCurrentUser();
      if (!user || (user.email !== 'admin@licitagora.com' && user.app_metadata?.role !== 'admin')) {
        throw new Error('Apenas administradores podem atribuir clientes a franquias');
      }
      
      const { data, error } = await supabase
        .from('clientes')
        .update({ franquia_id: franquiaId })
        .eq('id', clienteId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error(`Erro ao atribuir cliente ${clienteId} à franquia ${franquiaId}:`, error);
      return { success: false, error: error.message };
    }
  },
  
  // Remover cliente de uma franquia
  async removerClienteDaFranquia(clienteId) {
    try {
      await verificarAutenticacao();
      
      // Verificar se é admin
      const user = await authService.getCurrentUser();
      if (!user || (user.email !== 'admin@licitagora.com' && user.app_metadata?.role !== 'admin')) {
        throw new Error('Apenas administradores podem remover clientes de franquias');
      }
      
      const { data, error } = await supabase
        .from('clientes')
        .update({ franquia_id: null })
        .eq('id', clienteId)
        .select();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error(`Erro ao remover cliente ${clienteId} da franquia:`, error);
      return { success: false, error: error.message };
    }
  },
  
  // Criar usuário para uma franquia existente
  async criarUsuarioParaFranquia(franquiaId, email, senha, nome) {
    try {
      await verificarAutenticacao();
      
      // Verificar se é admin
      const user = await authService.getCurrentUser();
      if (!user || (user.email !== 'admin@licitagora.com' && user.app_metadata?.role !== 'admin')) {
        return { 
          success: false, 
          error: { message: 'Apenas administradores podem criar usuários para franquias' } 
        };
      }
      
      // Verificar se franquia existe
      const { data: franquia, error: franquiaError } = await supabase
        .from('franquias')
        .select('id, nome, email')
        .eq('id', franquiaId)
        .single();
      
      if (franquiaError || !franquia) {
        return { 
          success: false, 
          error: { message: 'Franquia não encontrada' } 
        };
      }
      
      // Usar função SQL para criar usuário
      const { data, error } = await supabase.rpc('criar_usuario_para_franquia', {
        p_franquia_id: franquiaId,
        p_email: email,
        p_senha: senha,
        p_nome: nome || franquia.nome
      });
      
      if (error) {
        return { 
          success: false, 
          error: { message: error.message, code: error.code }, 
          details: error.details 
        };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error(`Erro ao criar usuário para franquia ${franquiaId}:`, error);
      return { 
        success: false, 
        error: { message: error.message || 'Erro ao criar usuário' } 
      };
    }
  }
};

export default franquiaService; 