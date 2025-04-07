import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { LocationProvider } from './contexts/LocationContext';
import { LicenseProvider } from './contexts/LicenseContext';
import { AdminProvider } from './contexts/AdminContext';
import { executarSQL, verificarConexao } from './services/supabase';
import './index.css';

// Verificar a conexão com o banco de dados antes de renderizar
const verificarBancoDeDados = async () => {
  try {
    console.log('Verificando conexão com o banco de dados...');
    
    // Criar função SQL para verificação básica
    try {
      await executarSQL(`
        CREATE OR REPLACE FUNCTION public.select_current_timestamp()
        RETURNS TIMESTAMP WITH TIME ZONE
        LANGUAGE sql
        SECURITY DEFINER
        AS $$
          SELECT NOW();
        $$;
        
        GRANT EXECUTE ON FUNCTION public.select_current_timestamp() TO authenticated;
        GRANT EXECUTE ON FUNCTION public.select_current_timestamp() TO anon;
        GRANT EXECUTE ON FUNCTION public.select_current_timestamp() TO service_role;
      `);
    } catch (err) {
      console.warn('Não foi possível criar função de verificação:', err);
    }
    
    // Verificar conexão
    const conexaoOk = await verificarConexao();
    console.log('Conexão com banco de dados:', conexaoOk ? 'OK' : 'Com problemas');
    
    return conexaoOk;
  } catch (err) {
    console.error('Erro ao verificar banco de dados:', err);
    return false;
  }
};

// Iniciar a renderização do aplicativo
const iniciarApp = () => {
  const container = document.getElementById('root');
  const root = createRoot(container);
  
  root.render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>
          <AuthProvider>
            <AdminProvider>
              <LocationProvider>
                <LicenseProvider>
                  <App />
                </LicenseProvider>
              </LocationProvider>
            </AdminProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Verificar banco de dados e iniciar o aplicativo
verificarBancoDeDados().then(() => {
  iniciarApp();
}); 