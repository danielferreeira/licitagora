import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Box,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Help as HelpIcon
} from '@mui/icons-material';

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
 * @param {string} type - Tipo de confirmação ('delete', 'warning', 'info', 'help')
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
  confirmColor = 'primary',
  type = 'warning'
}) {
  // Configuração de ícones e cores com base no tipo
  const getTypeIcon = () => {
    switch (type) {
      case 'delete':
        return <DeleteIcon sx={{ color: 'error.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'info':
        return <InfoIcon sx={{ color: 'info.main' }} />;
      case 'help':
        return <HelpIcon sx={{ color: 'info.main' }} />;
      default:
        return <WarningIcon sx={{ color: 'warning.main' }} />;
    }
  };

  // Ícone do botão de confirmação
  const getConfirmIcon = () => {
    if (isLoading) {
      return <CircularProgress size={20} color="inherit" />;
    }
    
    switch (type) {
      case 'delete':
        return <DeleteIcon />;
      default:
        return <CheckIcon />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm"
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
          {getTypeIcon()}
          <Typography variant="h6" component="span" sx={{ ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Tooltip title="Fechar">
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="fechar">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start',
          pt: 1,
          pb: 1
        }}>
          {typeof content === 'string' ? (
            <Typography>{content}</Typography>
          ) : (
            content
          )}
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          variant="outlined"
          startIcon={<CloseIcon />}
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={isLoading}
          startIcon={getConfirmIcon()}
        >
          {isLoading ? 'Aguarde...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 