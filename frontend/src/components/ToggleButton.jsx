import React from 'react';
import { IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Componente para o botão de toggle que pode ser adicionado em qualquer título de aba
const ToggleButton = ({ isOpen, onToggle }) => {
  return (
    <Box 
      sx={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        position: 'relative',
        zIndex: 9999,
        marginRight: 1,
      }}
    >
      <IconButton
        color="inherit"
        aria-label="toggle drawer"
        onClick={onToggle}
        sx={{
          color: 'primary.main',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          borderRadius: '4px',
          position: 'relative',
          zIndex: 9999,
          display: 'inline-flex',
          visibility: 'visible',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
          }
        }}
      >
        {isOpen ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>
    </Box>
  );
};

export default ToggleButton; 