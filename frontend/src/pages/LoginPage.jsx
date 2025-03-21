import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('Tentando login com:', { email, password });
      const { data, error } = await authService.signInWithEmail(email, password);
      
      if (error) {
        console.error('Erro de login detalhado:', error);
        throw error;
      }
      
      console.log('Login bem-sucedido:', data);
      // Redirecionar para a página inicial após o login
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro completo:', error);
      setError('Email ou senha incorretos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Renderização do formulário de login */}
    </div>
  );
};

export default LoginPage; 