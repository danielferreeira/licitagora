import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  InputAdornment, 
  IconButton,
  CircularProgress,
  Divider,
  Link,
  Alert,
  Fade,
  Container
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LockOutlined as LockIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { authService, supabase } from '../../services/api';
import logoSvg from '../../assets/logo.svg';
import RecuperarSenhaDialog from '../../components/RecuperarSenhaDialog/RecuperarSenhaDialog';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recuperarSenhaOpen, setRecuperarSenhaOpen] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Limpar erro geral de login
    if (loginError) {
      setLoginError('');
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    // Validar email
    if (!formData.email) {
      newErrors.email = 'O email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Validar senha
    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      console.log('Tentando fazer login com:', formData.email);

      // Verificar a conexão com o servidor antes de tentar login
      try {
        const { error: pingError } = await supabase.from('health_check').select('status').limit(1);
        if (pingError) {
          console.error('Erro ao verificar conexão:', pingError);
          setErrorMessage('Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.');
          setLoading(false);
          return;
        }
      } catch (pingErr) {
        console.error('Falha ao verificar conexão:', pingErr);
      }
      
      const { data, error } = await authService.signInWithEmail(formData.email, formData.password);
      
      if (error) {
        console.error('Erro ao fazer login:', error);
        
        if (error.status === 500 || error.message?.includes('Server Error')) {
          setErrorMessage('Serviço temporariamente indisponível. Por favor, tente novamente mais tarde.');
        } else {
          // Exibir mensagem de erro amigável para o usuário
          setErrorMessage(error.message || 'Erro ao fazer login. Tente novamente mais tarde.');
        }
        
        setLoading(false);
        return;
      }
      
      console.log('Login bem-sucedido:', data?.user?.id);
      
      // Atualizar o último login do usuário
      if (data?.user?.id) {
        try {
          // Verificar se a tabela profiles existe antes de tentar atualizar
          const { error: profileCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();
            
          // Se houve erro 404, a tabela provavelmente não existe
          if (profileCheckError && (profileCheckError.code === '42P01' || profileCheckError.status === 404)) {
            console.warn('Tabela profiles não encontrada, ignorando atualização de último login');
          } else {
            // Tenta atualizar o último login
            const { error: updateError } = await supabase
              .from('profiles')
              .upsert({
                id: data.user.id,
                last_login: new Date().toISOString(),
              });
            
            if (updateError) {
              console.warn('Erro ao atualizar último login:', updateError);
            }
          }
        } catch (updateErr) {
          console.warn('Exceção ao atualizar último login:', updateErr);
          // Continuar mesmo se houver erro na atualização
        }
      }

      // Redirecionar para a página inicial
      navigate('/');
    } catch (err) {
      console.error('Exceção ao fazer login:', err);
      setErrorMessage('Ocorreu um erro inesperado. Por favor, tente novamente mais tarde.');
      setLoading(false);
    }
  };
  
  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
  
  const handleOpenRecuperarSenha = () => {
    setRecuperarSenhaOpen(true);
  };

  const handleCloseRecuperarSenha = () => {
    setRecuperarSenhaOpen(false);
  };
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#f5f5f5',
        padding: 0,
        margin: 0
      }}
    >
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <Fade in={true} timeout={800}>
          <Paper
            elevation={3}
            sx={{
              width: '100%',
              maxWidth: 400,
              p: { xs: 3, sm: 4 },
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              mx: 'auto'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3
              }}
            >
              <Box sx={{ height: 60, mb: 2, display: 'flex', justifyContent: 'center' }}>
                <img src={logoSvg} alt="Logo" style={{ height: '100%', width: 'auto' }} />
              </Box>
              <Typography
                variant="h5"
                component="h1"
                sx={{
                  fontWeight: 600,
                  color: 'primary.main',
                  textAlign: 'center'
                }}
              >
                Licitagora
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  color: 'text.secondary',
                  mt: 1,
                  textAlign: 'center'
                }}
              >
                Acesse sua conta para gerenciar licitações
              </Typography>
            </Box>
            
            {errorMessage && (
              <Alert 
                severity="error" 
                sx={{ mb: 3, borderRadius: 1 }}
                variant="filled"
              >
                {errorMessage}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                autoFocus
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Senha"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <Box sx={{ mt: 1, mb: 2, textAlign: 'right' }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={handleOpenRecuperarSenha}
                  sx={{ 
                    cursor: 'pointer',
                    color: 'primary.main'
                  }}
                >
                  Esqueceu a senha?
                </Link>
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                size="large"
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                  borderRadius: 1
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
              </Button>
            </Box>
            
            <Typography 
              variant="caption" 
              color="text.secondary" 
              align="center" 
              sx={{ 
                display: 'block', 
                mt: 4 
              }}
            >
              © {new Date().getFullYear()} Licitagora. Todos os direitos reservados.
            </Typography>
          </Paper>
        </Fade>
      </Container>
      
      <RecuperarSenhaDialog 
        open={recuperarSenhaOpen} 
        onClose={handleCloseRecuperarSenha} 
      />
    </Box>
  );
};

export default Login; 