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
  Box
} from '@mui/material';
import { toast } from 'react-toastify';
import { franquiaService, authService } from '../../services/supabase';

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

  // Preencher o email se a franquia já tiver um
  useEffect(() => {
    if (franquia) {
      setFormData(prev => ({
        ...prev,
        email: franquia.email || '',
        nome: franquia.nome || ''
      }));
    }
  }, [franquia, open]);

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
      
      // Verificar primeiro se o usuário já existe
      try {
        console.log(`[UsuarioFranquia] Verificando se já existe usuário com email: ${formData.email}`);
        const usuarioExistente = await authService.checkUserExistsLegacy(formData.email);
        
        if (usuarioExistente) {
          console.log('[UsuarioFranquia] Usuário com este email já existe');
          setFormErrors({
            ...formErrors,
            email: 'Este email já está sendo usado por outro usuário'
          });
          toast.error('Este email já está sendo usado. Por favor, use um email diferente.');
          setIsLoading(false);
          return;
        }
      } catch (checkError) {
        console.warn('[UsuarioFranquia] Erro ao verificar existência de usuário:', checkError);
        // Continuar mesmo com erro na verificação
      }
      
      // Criar usuário para a franquia
      const { data, error } = await franquiaService.criarUsuarioParaFranquia(
        franquia.id,
        formData.email,
        formData.senha,
        formData.nome
      );
      
      if (error) {
        console.error('Erro ao criar usuário para franquia:', error);
        
        // Verificar se é erro de email existente
        if (error.message && error.message.includes('already exists')) {
          setFormErrors({
            ...formErrors,
            email: 'Este email já está sendo usado por outro usuário'
          });
          toast.error('Este email já está sendo usado. Por favor, use um email diferente.');
        } else {
          toast.error(`Erro ao criar usuário: ${error.message}`);
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>
        Criar Usuário para Franquia {franquia?.nome}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Você está criando um usuário para esta franquia. O usuário poderá acessar o sistema com os dados abaixo.
          </Alert>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
              />
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
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Senha"
                name="senha"
                type="password"
                value={formData.senha}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.senha}
                helperText={formErrors.senha}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirmar Senha"
                name="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={handleChange}
                margin="normal"
                error={!!formErrors.confirmarSenha}
                helperText={formErrors.confirmarSenha}
                required
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Criar Usuário'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 