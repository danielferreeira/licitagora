import { verificarPermissaoAdmin, obterFranquiaDoUsuario } from '../services/api/utils';
import { supabase } from '../services/api/supabaseConfig';

// Função simplificada para verificar se o usuário é admin
export const verificarAdmin = async () => {
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
};

// Função para obter a franquia do usuário
export const getFranquiaUsuario = async () => {
  try {
    // Obter usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Usar a função obterFranquiaDoUsuario
    return await obterFranquiaDoUsuario(user.id);
  } catch (error) {
    console.error('Erro ao obter franquia do usuário:', error);
    return null;
  }
};

// Funções adicionais de autenticação podem ser adicionadas aqui
export const isUserAuthenticated = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  return !!(sessionData && sessionData.session);
}; 