import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { authService } from '../services/supabase';
import { toast } from 'react-toastify';

/**
 * Componente que protege rotas, redirecionando para a página de login
 * caso o usuário não esteja autenticado.
 */
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authService.isAuthenticated();
        setIsAuthenticated(isAuth);
        
        if (!isAuth) {
          toast.error('Sessão expirada ou usuário não autenticado. Por favor, faça login novamente.');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
        toast.error('Erro ao verificar autenticação. Por favor, faça login novamente.');
      }
    };

    checkAuth();
  }, []);

  // Enquanto verifica a autenticação, mostra um indicador de carregamento
  if (isAuthenticated === null) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Se não estiver autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderiza o conteúdo da rota
  return children;
};

export default ProtectedRoute; 