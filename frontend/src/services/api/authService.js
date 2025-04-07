import { supabase, executarSQL } from './supabaseConfig';
import { verificarPermissaoAdmin } from './utils';

// Serviço de autenticação
const authService = {
  // Verificar se usuário está autenticado
  isAuthenticated: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (err) {
      console.error('Erro ao verificar autenticação:', err);
      return false;
    }
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Obter sessão atual
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  // Login com email e senha
  signInWithEmail: async (email, password) => {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        // Tratar erros específicos
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Email ou senha incorretos');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu email antes de fazer login');
        } else {
          throw error;
        }
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      throw err;
    }
  },

  // Logout
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      throw err;
    }
  },

  // Registrar novo usuário
  signUp: async (email, password, metadata = {}) => {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios');
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Erro ao registrar usuário:', err);
      throw err;
    }
  },

  // Verificar usuário por email
  getUserByEmail: async (email) => {
    try {
      // Verificar permissões do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      // Verificar se é admin
      const { data: isAdmin } = await supabase.rpc('verificar_permissao_admin', {
        p_user_id: user.id
      });
      
      if (!isAdmin) {
        throw new Error('Permissão negada: operação restrita a administradores');
      }
      
      // Buscar usuário pelo email
      const { data, error } = await supabase.rpc('buscar_usuario_por_email', {
        p_email: email
      });
      
      if (error) throw error;
      
      return data;
    } catch (err) {
      console.error('Erro ao buscar usuário por email:', err);
      throw err;
    }
  },
  
  // Método para recuperar senha
  recuperarSenha: async (email) => {
    if (!email) {
      throw new Error('Email é obrigatório');
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      
      if (error) throw error;
      
      // Sempre retornamos sucesso mesmo que o email não exista por segurança
      return { 
        success: true, 
        message: 'Se seu email estiver cadastrado, você receberá um link para redefinir sua senha.'
      };
    } catch (err) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      // Por segurança, não revelamos se o email existe ou não
      return { 
        success: true, 
        message: 'Se seu email estiver cadastrado, você receberá um link para redefinir sua senha.'
      };
    }
  },
  
  // Método para redefinir senha com token
  redefinirSenha: async (novaSenha) => {
    if (!novaSenha) {
      throw new Error('Nova senha é obrigatória');
    }
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });
      
      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Senha atualizada com sucesso! Você já pode fazer login com sua nova senha.'
      };
    } catch (err) {
      console.error('Erro ao redefinir senha:', err);
      throw new Error('Não foi possível redefinir sua senha. O link pode ter expirado. Tente solicitar um novo link de recuperação.');
    }
  },

  // Função para verificar se o usuário é admin
  async isAdmin() {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      // Usar a função verificarPermissaoAdmin
      return await verificarPermissaoAdmin(user.id);
    } catch (error) {
      console.error('Erro ao verificar admin:', error);
      return false;
    }
  }
};

export default authService; 