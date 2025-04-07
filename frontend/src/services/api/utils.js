import { supabase } from './supabaseConfig';

// Funções temporárias para contornar a falta de RPCs no Supabase

// Verificar se o usuário é admin
export const verificarPermissaoAdmin = async (userId) => {
  try {
    // Se não houver ID do usuário, obter o usuário atual
    if (!userId) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData || !sessionData.session) {
        console.warn('Sem sessão ao verificar permissão admin');
        return false;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    }

    // Verificação simplificada: primeiro pelo email (método mais rápido)
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Usuário não encontrado ao verificar permissão admin');
      return false;
    }
    
    // Verificação por email
    if (user.email === 'admin@licitagora.com') {
      console.log('Usuário é admin por email');
      return true;
    }
    
    // Verificação por metadata (segunda prioridade)
    if (user.app_metadata && user.app_metadata.role === 'admin') {
      console.log('Usuário é admin por metadata');
      return true;
    }
    
    // Verificação por perfil na tabela de perfis
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
        
      if (profileError) {
        console.warn('Erro ao buscar perfil para verificar admin:', profileError);
      } else if (profile && profile.is_admin) {
        console.log('Usuário é admin pelo perfil');
        return true;
      }
    } catch (profileError) {
      console.error('Exceção ao verificar perfil admin:', profileError);
    }
    
    // Default: não é admin
    console.log('Usuário não é admin');
    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão admin:', error);
    return false;
  }
};

// Alias para verificarAdmin (para compatibilidade com código existente)
export const verificarAdmin = verificarPermissaoAdmin;
export const isAdmin = verificarPermissaoAdmin;

// Alias para authService.isAdmin para compatibilidade com código legado
export const authService = {
  isAdmin: verificarPermissaoAdmin
};

// Obter a franquia associada ao usuário
export const obterFranquiaDoUsuario = async (userId) => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      userId = user.id;
    }
    
    // Verificar se é admin
    const isAdmin = await verificarPermissaoAdmin(userId);
    if (isAdmin) return null; // Admins não têm franquia específica
    
    // Buscar associação direta na tabela de franquias
    let { data: franquiaDireta, error: errorDireto } = await supabase
      .from('franquias')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (franquiaDireta) return franquiaDireta.id;
    
    // Tentar buscar na tabela de usuários da franquia
    let { data: usuarioFranquia, error: errorUsuario } = await supabase
      .from('usuarios_franquias')
      .select('franquia_id')
      .eq('user_id', userId)
      .single();
    
    if (usuarioFranquia) return usuarioFranquia.franquia_id;
    
    // Tentar lookup na tabela profiles
    let { data: profile, error: errorProfile } = await supabase
      .from('profiles')
      .select('franquia_id')
      .eq('id', userId)
      .single();
    
    if (profile && profile.franquia_id) return profile.franquia_id;
    
    // Verificar se já existe alguma franquia no sistema
    const { data: franquias, error: errorFranquias } = await supabase
      .from('franquias')
      .select('id');
      
    if (!errorFranquias) {
      // Se já existe alguma franquia, associar o usuário à primeira
      if (franquias && franquias.length > 0) {
        console.log('Associando usuário à franquia existente:', franquias[0].id);
        try {
          await supabase.from('profiles').upsert({
            id: userId,
            franquia_id: franquias[0].id,
            updated_at: new Date().toISOString()
          });
          
          return franquias[0].id;
        } catch (err) {
          console.warn('Erro ao associar usuário à franquia existente:', err);
        }
      } else {
        // Se não existe nenhuma franquia, criar uma franquia padrão
        console.log('Criando franquia padrão para o usuário');
        try {
          const { data: userDetails } = await supabase.auth.getUser();
          const { data: novaFranquia, error: errorNovaFranquia } = await supabase
            .from('franquias')
            .insert([
              { 
                nome: 'Franquia Padrão', 
                email: userDetails?.user?.email || 'sem-email@licitagora.com',
                user_id: userId,
                ativa: true,
                criado_por: userId,
                criado_em: new Date().toISOString(),
                atualizado_em: new Date().toISOString()
              }
            ])
            .select();
          
          if (!errorNovaFranquia && novaFranquia && novaFranquia.length > 0) {
            console.log('Franquia padrão criada com sucesso:', novaFranquia[0].id);
            
            // Associar o usuário à nova franquia
            await supabase.from('profiles').upsert({
              id: userId,
              franquia_id: novaFranquia[0].id,
              updated_at: new Date().toISOString()
            });
            
            return novaFranquia[0].id;
          } else {
            console.error('Erro ao criar franquia padrão:', errorNovaFranquia);
          }
        } catch (createErr) {
          console.error('Exceção ao criar franquia padrão:', createErr);
        }
      }
    }
    
    console.warn('Não foi possível obter ou criar franquia para o usuário:', userId);
    return null;
  } catch (error) {
    console.error('Erro ao obter franquia do usuário:', error);
    return null;
  }
}; 