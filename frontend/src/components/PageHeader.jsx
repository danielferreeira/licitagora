import React, { useContext } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  useTheme, 
  useMediaQuery 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

/**
 * Componente de cabeçalho para as páginas
 * @param {Object} props Propriedades do componente
 * @param {string} props.title Título da página
 * @param {boolean} props.hasBackButton Se deve mostrar o botão de voltar
 * @param {boolean} props.isDrawerOpen Estado atual da gaveta lateral
 * @param {Function} props.onDrawerToggle Função para alternar a gaveta lateral
 */
const PageHeader = ({ 
  title, 
  hasBackButton = false, 
  isDrawerOpen = false, 
  onDrawerToggle = () => {} 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 3,
        mt: 1,
        position: 'relative',
        zIndex: 1100,
      }}
    >
      {/* Botão de voltar, se necessário */}
      {hasBackButton && (
        <IconButton
          onClick={handleBack}
          sx={{
            mr: 1.5,
            color: 'primary.main',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            borderRadius: '4px',
            zIndex: 9999,
            display: 'inline-flex',
            visibility: 'visible',
            position: 'relative',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}

      {/* Botão de toggle para o drawer */}
      <IconButton
        color="inherit"
        aria-label="toggle drawer"
        onClick={onDrawerToggle}
        sx={{
          mr: 1.5,
          color: 'primary.main',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderRadius: '4px',
          zIndex: 9999,
          display: 'inline-flex',
          visibility: 'visible',
          position: 'relative',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
          }
        }}
      >
        {isDrawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>

      {/* Título da página */}
      <Typography 
        variant="h5" 
        component="h1" 
        sx={{ 
          fontWeight: 'bold',
          color: 'text.primary',
          flexGrow: 1,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default PageHeader; 