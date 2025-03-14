import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/supabase';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { user } = await authService.signInWithEmail(email, password);
      setUser(user);
      toast.success('Login realizado com sucesso!');
      navigate('/home');
      return true;
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      toast.error(error.message || 'Falha ao fazer login. Verifique suas credenciais.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      setUser(null);
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Falha ao fazer logout.');
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = async () => {
    if (user) return true;
    try {
      return await authService.isAuthenticated();
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 