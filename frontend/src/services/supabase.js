// IMPORTANTE: Este arquivo está sendo gradualmente migrado para uma estrutura modular em:
// /services/api/
//
// PLANO DE MIGRAÇÃO:
// 1. Primeira fase - Criar serviços modulares e manter compatibilidade (CONCLUÍDO)
// 2. Segunda fase - Atualizar todas as importações em componentes existentes 
//    para apontar diretamente para os novos serviços modulares (EM ANDAMENTO)
// 3. Terceira fase - Remover completamente este arquivo quando todas as 
//    importações forem migradas (PLANEJADO)
//
// Por favor, use as importações da pasta /services/api/ para novos componentes.
// Veja mais detalhes em /services/README.md

import { 
  supabase,
  executarSQL,
  verificarFuncaoExiste,
  verificarTabelaExiste
} from './api';

import authService from './api/authService';
import franquiaService from './api/franquiaService';
import clienteService from './api/clienteService';
import licitacaoService from './api/licitacaoService';
import documentoService from './api/documentoService';
import { relatorioService } from './api';
import { prazoService } from './api';

// Re-exportar a instância do Supabase para compatibilidade
export { supabase };

// Re-exportar funções utilitárias para compatibilidade
export {
  executarSQL,
  verificarFuncaoExiste,
  verificarTabelaExiste
};

// Exportar serviços para compatibilidade
export { 
  authService, 
  franquiaService,
  clienteService,
  licitacaoService,
  documentoService,
  relatorioService,
  prazoService
};

// Funções que você deseja manter para compatibilidade
export const login = async (email, password) => {
  // Esta função será removida posteriormente
  // Por enquanto, redireciona para o novo serviço de autenticação
  return authService.signInWithEmail(email, password);
};