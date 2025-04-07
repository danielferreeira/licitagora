import { supabase } from './supabaseConfig';

// Verificar se o usuário é admin
export async function verificarAdmin() {
  try {
    // Obter usuário atual
    const { data } = await supabase.auth.getUser();
    if (!data || !data.user) return false;
    
    const user = data.user;
    
    // Verificação por email (mais simples)
    if (user.email === 'admin@licitagora.com') {
      return true;
    }
    
    // Verificação por metadados
    if (user.app_metadata && user.app_metadata.role === 'admin') {
      return true;
    }
    
    // Default: não é admin
    return false;
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin:', error);
    return false;
  }
}

// Verificar se há usuário autenticado
export async function verificarAutenticado() {
  try {
    const { data } = await supabase.auth.getSession();
    return !!(data && data.session);
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return false;
  }
}

// Obter o ID da franquia do usuário
export async function obterFranquiaId() {
  try {
    // Obter usuário atual
    const { data } = await supabase.auth.getUser();
    if (!data || !data.user) return null;
    
    const user = data.user;
    
    // Verificar se o usuário tem franquia associada
    const { data: profile } = await supabase
      .from('profiles')
      .select('franquia_id')
      .eq('id', user.id)
      .single();
    
    if (profile && profile.franquia_id) {
      return profile.franquia_id;
    }
    
    // Verificar se há alguma franquia para associar
    const { data: franquias } = await supabase
      .from('franquias')
      .select('id')
      .limit(1);
    
    if (franquias && franquias.length > 0) {
      // Atualizar o perfil para associar à primeira franquia
      const franquiaId = franquias[0].id;
      
      await supabase
        .from('profiles')
        .update({ franquia_id: franquiaId })
        .eq('id', user.id);
      
      return franquiaId;
    }
    
    // Criar uma franquia padrão se não existir nenhuma
    const { data: novaFranquia } = await supabase
      .from('franquias')
      .insert({ nome: 'Franquia Padrão' })
      .select()
      .single();
    
    if (novaFranquia) {
      // Associar usuário à nova franquia
      await supabase
        .from('profiles')
        .update({ franquia_id: novaFranquia.id })
        .eq('id', user.id);
      
      return novaFranquia.id;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao obter franquia do usuário:', error);
    return null;
  }
} 