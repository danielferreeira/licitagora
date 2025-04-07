import React from 'react';
import { IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// Componente de botão que pode ser colocado em qualquer lugar para controlar o drawer
const MenuToggleButton = ({ open = false, onClick, sx = {} }) => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        position: 'relative',
        zIndex: 9999,
        ...sx
      }}
    >
      <IconButton
        color="primary"
        aria-label="toggle drawer"
        onClick={onClick}
        sx={{
          backgroundColor: 'rgba(25, 118, 210, 0.2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          margin: '4px',
          zIndex: 9999,
          position: 'relative',
          opacity: 1,
          visibility: 'visible',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.3)',
          }
        }}
      >
        {open ? <ChevronLeftIcon /> : <MenuIcon />}
      </IconButton>
    </Box>
  );
};

export default MenuToggleButton; 