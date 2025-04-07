import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';

import { authService } from '../../services/supabase';

const RecuperarSenhaDialog = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError('');
  };

  const validarFormulario = () => {
    let isValid = true;

    if (!email) {
      setEmailError('E-mail é obrigatório');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('E-mail inválido');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const result = await authService.recuperarSenha(email);
      
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success'
      });
      
      // Fechar o diálogo após enviar o e-mail
      setTimeout(() => {
        onClose();
        setEmail('');
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      
      setSnackbar({
        open: true,
        message: error.message || 'Erro ao processar recuperação de senha',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Recuperar Senha</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Para recuperar sua senha, informe o e-mail associado à sua conta. Se encontrarmos o e-mail em nosso sistema, enviaremos um link para redefinir sua senha.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="email"
            label="E-mail"
            type="email"
            fullWidth
            variant="outlined"
            value={email}
            onChange={handleEmailChange}
            error={!!emailError}
            helperText={emailError}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary" disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            color="primary" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RecuperarSenhaDialog; 