import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Box,
  Typography,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { toast } from 'react-toastify';
import { franquiaService, authService, supabase } from '../../services/supabase';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';

export default function UsuarioFranquiaDialog({ open, franquia, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    senha: '',
    confirmarSenha: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    exists: false,
    checked: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && (user.email === 'admin@licitagora.com' || user.app_metadata?.role === 'admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          onClose();
          toast.error('Acesso não autorizado. Esta operação é apenas para administradores.');
        }
      } catch (error) {
        console.error('Erro ao verificar permissões de admin:', error);
        setIsAdmin(false);
        onClose();
      }
    };

    if (open) {
      checkAdmin();
    }
  }, [open, onClose]);

  // Preencher o formulário quando abrir o diálogo
  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        nome: franquia?.nome || '',
        senha: '',
        confirmarSenha: ''
      });
      setFormErrors({});
      setEmailStatus({
        checking: false,
        exists: false,
        checked: false
      });
    }
  }, [franquia, open]);

  // Verificar em tempo real se o email já existe
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
        setEmailStatus({ checking: false, exists: false, checked: false });
        return;
      }
      
      setEmailStatus({ checking: true, exists: false, checked: false });
      
      try {
        // Usar RPC diretamente para verificação rápida
        const { data, error } = await supabase.rpc('check_user_exists', { p_email: formData.email });
        
        if (error) {
          console.warn('[UsuarioFranquia] Erro ao verificar email:', error);
          setEmailStatus({ checking: false, exists: false, checked: false });
        } else {
          setEmailStatus({ checking: false, exists: data === true, checked: true });
          
          if (data === true) {
            setFormErrors(prev => ({
              ...prev,
              email: 'Este email já está sendo usado por outro usuário'
            }));
          } else {
            setFormErrors(prev => ({
              ...prev,
              email: null
            }));
          }
        }
      } catch (err) {
        console.error('[UsuarioFranquia] Exceção ao verificar email:', err);
        setEmailStatus({ checking: false, exists: false, checked: false });
      }
    };
    
    // Usar um debounce para não fazer muitas verificações
    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    
    // Limpar erro específico quando o campo é alterado
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    } else if (emailStatus.exists) {
      errors.email = 'Este email já está sendo usado por outro usuário';
    }
    
    if (!formData.nome) {
      errors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.senha) {
      errors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      errors.senha = 'A senha deve ter pelo menos 6 caracteres';
    }
    
    if (formData.senha !== formData.confirmarSenha) {
      errors.confirmarSenha = 'As senhas não coincidem';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      // Log para depuração (ocultando a senha)
      console.log('Criando usuário para franquia:', {
        franquia_id: franquia.id,
        email: formData.email,
        nome: formData.nome,
        senha: '******' // Ocultada por segurança
      });
      
      // Criar usuário para a franquia usando o serviço
      const result = await franquiaService.criarUsuarioParaFranquia(
        franquia.id,
        formData.email,
        formData.senha,
        formData.nome
      );
      
      if (!result || !result.success) {
        console.error('Erro ao criar usuário para franquia:', result?.error || 'Erro desconhecido');
        
        // Verificar tipos específicos de erro
        if (result?.error?.code === 'EMAIL_JA_EXISTE' || 
            (result?.message && result.message.includes('já existe'))) {
          setFormErrors({
            ...formErrors,
            email: 'Este email já está sendo usado por outro usuário'
          });
          toast.error('Este email já está sendo usado. Por favor, use um email diferente.');
        } else {
          toast.error(`Erro ao criar usuário: ${result?.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.success('Usuário criado com sucesso para a franquia!');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro detalhado ao criar usuário:', {
        message: error.message,
        stack: error.stack,
        details: error.details
      });
      
      // Tratar erros específicos
      if (error.message && error.message.toLowerCase().includes('already exists')) {
        setFormErrors({
          ...formErrors,
          email: 'Este email já está sendo usado por outro usuário'
        });
        toast.error('Este email já está sendo usado. Por favor, use um email diferente.');
      } else {
        toast.error(`Erro ao criar usuário: ${error.message || 'Erro desconhecido'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="span">
            Criar Usuário para Franquia
          </Typography>
        </Box>
        <Tooltip title="Fechar">
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="fechar">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ mt: 1 }}>
          <Alert severity="info" sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
            <Typography variant="body1" fontWeight="medium">
              Acesso para franquia: {franquia?.nome}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Você está criando um usuário que terá acesso ao sistema em nome da franquia.
              O email que você informar aqui será usado para login e pode ser diferente 
              do email de contato cadastrado na franquia.
            </Typography>
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email para Login"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                placeholder="usuario@franquia.com"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {emailStatus.checking ? (
                        <CircularProgress size={20} />
                      ) : emailStatus.checked ? (
                        emailStatus.exists ? (
                          <Tooltip title="Este email já está em uso">
                            <ErrorOutlineIcon color="error" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Email disponível">
                            <CheckCircleOutlineIcon color="success" />
                          </Tooltip>
                        )
                      ) : null}
                      <Tooltip title="Este email será usado para login no sistema">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
              {franquia?.email && (
                <Typography variant="caption" color="text.secondary">
                  <InfoIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  Email cadastrado na franquia: {franquia.email} (apenas para referência)
                </Typography>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Responsável"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.nome}
                helperText={formErrors.nome}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Nome que aparecerá no sistema">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                Credenciais de acesso
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Senha"
                name="senha"
                type={showPassword ? "text" : "password"}
                value={formData.senha}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.senha}
                helperText={formErrors.senha || "Mínimo de 6 caracteres"}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleShowPassword}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirmar Senha"
                name="confirmarSenha"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmarSenha}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.confirmarSenha}
                helperText={formErrors.confirmarSenha}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={toggleShowConfirmPassword}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          variant="outlined" 
          startIcon={<CloseIcon />}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isLoading || emailStatus.exists || emailStatus.checking}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PersonIcon />}
        >
          {isLoading ? "Criando usuário..." : "Criar Usuário"}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 