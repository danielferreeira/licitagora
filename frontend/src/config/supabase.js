import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lyyfjeijnwnyxgkqlnlo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5eWZqZWlqbndueXhna3FsbmxvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTg3NzYsImV4cCI6MjA1Njg3NDc3Nn0.s92Kiy2Y7GjzTL-vDYeHI_oub8CR8Gw9i6htkqw5hJ8';

// Opções para melhorar o tratamento de erros e conectividade
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false  // Desabilitar para evitar problemas de roteamento
  },
  realtime: {
    timeout: 30000  // 30 segundos
  }
};

// Criando cliente Supabase com configuração simplificada
export const supabase = createClient(supabaseUrl, supabaseKey, options);

// Configurar listeners de conexão para detectar problemas
window.addEventListener('online', () => {
  console.log('Conexão com a internet restaurada');
});

window.addEventListener('offline', () => {
  console.warn('Conexão com a internet perdida');
}); 