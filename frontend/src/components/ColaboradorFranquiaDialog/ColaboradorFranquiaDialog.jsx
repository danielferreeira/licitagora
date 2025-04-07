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
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox
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
import SecurityIcon from '@mui/icons-material/Security';

export default function ColaboradorFranquiaDialog({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    nome: '',
    senha: '',
    confirmarSenha: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isResponsavel, setIsResponsavel] = useState(false);
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    exists: false,
    checked: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [permissoes, setPermissoes] = useState({
    VISUALIZAR_LICITACOES: true,
    CADASTRAR_PROPOSTA: false,
    VISUALIZAR_CLIENTES: false,
    EDITAR_CLIENTES: false
  });

  // Verificar se o usuário é responsável por uma franquia
  useEffect(() => {
    const checkUserResponsavel = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          onClose();
          toast.error('Você precisa estar logado para criar colaboradores.');
          return;
        }

        // Verificar se usuário é responsável por uma franquia
        const { data, error } = await supabase
          .from('perfis_usuario')
          .select('is_responsavel, tipo, franquia_id')
          .eq('user_id', user.id)
          .eq('tipo', 'FRANQUIA')
          .single();
          
        if (error || !data) {
          console.error('Erro ao verificar perfil do usuário:', error);
          onClose();
          toast.error('Você não tem permissão para criar colaboradores.');
          return;
        }
        
        if (!data.is_responsavel) {
          onClose();
          toast.error('Apenas o responsável pela franquia pode criar colaboradores.');
          return;
        }
        
        setIsResponsavel(true);
      } catch (error) {
        console.error('Erro ao verificar permissões de usuário:', error);
        onClose();
        toast.error('Ocorreu um erro ao verificar suas permissões.');
      }
    };

    if (open) {
      checkUserResponsavel();
    }
  }, [open, onClose]);

  // Limpar o formulário quando abrir o diálogo
  useEffect(() => {
    if (open) {
      setFormData({
        email: '',
        nome: '',
        senha: '',
        confirmarSenha: ''
      });
      setFormErrors({});
      setEmailStatus({
        checking: false,
        exists: false,
        checked: false
      });
      setPermissoes({
        VISUALIZAR_LICITACOES: true,
        CADASTRAR_PROPOSTA: false,
        VISUALIZAR_CLIENTES: false,
        EDITAR_CLIENTES: false
      });
    }
  }, [open]);

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
          console.warn('[ColaboradorFranquia] Erro ao verificar email:', error);
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
        console.error('[ColaboradorFranquia] Exceção ao verificar email:', err);
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

  const handlePermissaoChange = (event) => {
    const { name, checked } = event.target;
    setPermissoes({ ...permissoes, [name]: checked });
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
      
      // Preparar lista de permissões selecionadas
      const permissoesSelecionadas = Object.entries(permissoes)
        .filter(([_, isSelected]) => isSelected)
        .map(([permissao, _]) => permissao);
      
      // Log para depuração (ocultando a senha)
      console.log('Criando colaborador para franquia:', {
        email: formData.email,
        nome: formData.nome,
        senha: '******', // Ocultada por segurança
        permissoes: permissoesSelecionadas
      });
      
      // Criar colaborador da franquia 
      const result = await franquiaService.criarColaboradorFranquia({
        email: formData.email,
        nome: formData.nome,
        senha: formData.senha,
        permissoes: permissoesSelecionadas
      });
      
      if (!result || !result.success) {
        console.error('Erro ao criar colaborador:', result?.error || 'Erro desconhecido');
        
        // Verificar tipos específicos de erro
        if (result?.error?.message && result.error.message.includes('Email')) {
          setFormErrors({
            ...formErrors,
            email: 'Este email já está sendo usado por outro usuário'
          });
          toast.error('Este email já está sendo usado. Por favor, use um email diferente.');
        } else {
          toast.error(`Erro ao criar colaborador: ${result?.error?.message || 'Erro desconhecido'}`);
        }
      } else {
        toast.success('Colaborador criado com sucesso para sua franquia!');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erro detalhado ao criar colaborador:', {
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
        toast.error(`Erro ao criar colaborador: ${error.message || 'Erro desconhecido'}`);
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
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2
        }}
      >
        <Box display="flex" alignItems="center">
          <PersonIcon sx={{ mr: 1 }} />
          Adicionar Colaborador à Franquia
        </Box>
        <IconButton 
          onClick={onClose}
          size="small"
          sx={{ color: 'inherit' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {!isResponsavel && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Você precisa ser o responsável pela franquia para adicionar colaboradores.
          </Alert>
        )}
        
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Colaboradores terão acesso limitado baseado nas permissões que você conceder.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email do Colaborador"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                placeholder="colaborador@email.com"
                size="small"
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
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Colaborador"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                error={!!formErrors.nome}
                helperText={formErrors.nome}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon fontSize="small" color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Senha"
                name="senha"
                type={showPassword ? "text" : "password"}
                value={formData.senha}
                onChange={handleChange}
                error={!!formErrors.senha}
                helperText={formErrors.senha || "Mínimo de 6 caracteres"}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
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
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirmar Senha"
                name="confirmarSenha"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmarSenha}
                onChange={handleChange}
                error={!!formErrors.confirmarSenha}
                helperText={formErrors.confirmarSenha}
                required
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
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
            
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 1,
                  color: 'primary.main' 
                }}
              >
                <SecurityIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                Permissões do Colaborador
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={permissoes.VISUALIZAR_LICITACOES} 
                      onChange={handlePermissaoChange}
                      name="VISUALIZAR_LICITACOES"
                      disabled
                    />
                  }
                  label="Visualizar Licitações (obrigatório)"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={permissoes.CADASTRAR_PROPOSTA} 
                      onChange={handlePermissaoChange}
                      name="CADASTRAR_PROPOSTA"
                    />
                  }
                  label="Cadastrar Propostas"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={permissoes.VISUALIZAR_CLIENTES} 
                      onChange={handlePermissaoChange}
                      name="VISUALIZAR_CLIENTES"
                    />
                  }
                  label="Visualizar Clientes"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={permissoes.EDITAR_CLIENTES} 
                      onChange={handlePermissaoChange}
                      name="EDITAR_CLIENTES"
                    />
                  }
                  label="Editar Clientes"
                />
              </FormGroup>
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
          disabled={isLoading || emailStatus.exists || emailStatus.checking || !isResponsavel}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <PersonIcon />}
        >
          {isLoading ? "Criando colaborador..." : "Adicionar Colaborador"}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 