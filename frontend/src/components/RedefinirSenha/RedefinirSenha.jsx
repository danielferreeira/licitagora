import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { authService } from '../../services/supabase';

const RedefinirSenha = () => {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [senhaError, setSenhaError] = useState('');
  const [confirmarSenhaError, setConfirmarSenhaError] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState({texto: '', tipo: null});
  const [tokenValido, setTokenValido] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extrair token da URL
  useEffect(() => {
    const params = new URLSearchParams(location.hash.substring(1));
    const access_token = params.get('access_token');
    
    if (access_token) {
      setTokenValido(true);
      // Armazenar o token para uso posterior
      localStorage.setItem('reset_password_token', access_token);
    } else {
      setMensagem({
        texto: 'Link de redefinição de senha inválido ou expirado. Solicite um novo link.',
        tipo: 'error'
      });
    }
  }, [location]);
  
  const handleClickMostrarSenha = () => {
    setMostrarSenha(!mostrarSenha);
  };
  
  const handleClickMostrarConfirmarSenha = () => {
    setMostrarConfirmarSenha(!mostrarConfirmarSenha);
  };
  
  const validarFormulario = () => {
    let isValid = true;
    
    // Validar senha
    if (!senha) {
      setSenhaError('Senha é obrigatória');
      isValid = false;
    } else if (senha.length < 8) {
      setSenhaError('A senha deve ter pelo menos 8 caracteres');
      isValid = false;
    } else {
      setSenhaError('');
    }
    
    // Validar confirmação de senha
    if (!confirmarSenha) {
      setConfirmarSenhaError('Confirmação de senha é obrigatória');
      isValid = false;
    } else if (senha !== confirmarSenha) {
      setConfirmarSenhaError('As senhas não coincidem');
      isValid = false;
    } else {
      setConfirmarSenhaError('');
    }
    
    return isValid;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;
    
    setLoading(true);
    try {
      const access_token = localStorage.getItem('reset_password_token');
      
      if (!access_token) {
        throw new Error('Token de redefinição não encontrado');
      }
      
      const result = await authService.redefinirSenha(senha, access_token);
      
      setMensagem({
        texto: result.message,
        tipo: 'success'
      });
      
      // Limpar o token após uso
      localStorage.removeItem('reset_password_token');
      
      // Redirecionar para a página de login após 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      
      setMensagem({
        texto: error.message || 'Erro ao redefinir senha',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ 
        mt: 8, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center' 
      }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center' 
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Redefinir Senha
          </Typography>
          
          {mensagem.texto && (
            <Alert 
              severity={mensagem.tipo} 
              sx={{ mb: 3, width: '100%' }}
            >
              {mensagem.texto}
            </Alert>
          )}
          
          {tokenValido && (
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="senha"
                label="Nova Senha"
                type={mostrarSenha ? 'text' : 'password'}
                id="senha"
                autoComplete="new-password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                error={!!senhaError}
                helperText={senhaError}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickMostrarSenha}
                        edge="end"
                      >
                        {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmarSenha"
                label="Confirmar Nova Senha"
                type={mostrarConfirmarSenha ? 'text' : 'password'}
                id="confirmarSenha"
                autoComplete="new-password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                error={!!confirmarSenhaError}
                helperText={confirmarSenhaError}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickMostrarConfirmarSenha}
                        edge="end"
                      >
                        {mostrarConfirmarSenha ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Processando...' : 'Redefinir Senha'}
              </Button>
              
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/login')}
                sx={{ mt: 1 }}
              >
                Voltar para Login
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default RedefinirSenha; 