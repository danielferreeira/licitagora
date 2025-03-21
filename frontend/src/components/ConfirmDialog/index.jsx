import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';

/**
 * Componente de diálogo de confirmação genérico
 * @param {boolean} open - Estado de abertura do diálogo
 * @param {string} title - Título do diálogo
 * @param {string|React.ReactNode} content - Conteúdo/mensagem do diálogo
 * @param {function} onClose - Função chamada ao fechar o diálogo
 * @param {function} onConfirm - Função chamada ao confirmar a ação
 * @param {string} confirmText - Texto do botão de confirmação
 * @param {string} cancelText - Texto do botão de cancelamento
 * @param {boolean} isLoading - Estado de carregamento
 * @param {string} confirmColor - Cor do botão de confirmação
 */
export default function ConfirmDialog({
  open,
  title = 'Confirmar',
  content = 'Tem certeza?',
  onClose,
  onConfirm,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  confirmColor = 'primary'
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {typeof content === 'string' ? (
          <Typography>{content}</Typography>
        ) : (
          content
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Aguarde...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 