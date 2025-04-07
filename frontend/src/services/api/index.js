// Arquivo índice para exportar todas as configurações e serviços

// Exportar configuração do Supabase
export * from './supabaseConfig';

// Exportar funções utilitárias
export * from './utils';

// Exportar serviços
export { default as authService } from './authService';
export { default as franquiaService } from './franquiaService';
export { default as clienteService } from './clienteService';
export { default as licitacaoService } from './licitacaoService';
export { default as documentoService } from './documentoService';
export { default as relatorioService } from './relatorioService';
export { default as prazoService } from './prazoService';

// Helpers autenticação
export * from './authHelper';

// Serviços
export { default as messageService } from './messageService'; 