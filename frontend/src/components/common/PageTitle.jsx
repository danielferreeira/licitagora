import React from 'react';
import { Typography, Box } from '@mui/material';
import MenuToggleButton from '../MenuToggleButton';

// Componente de título de página que incorpora o botão de menu
const PageTitle = ({ 
  title, 
  isDrawerOpen = false, 
  onDrawerToggle = () => {}, 
  variant = 'h5', 
  component = 'h1',
  sx = {}
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 3,
        mt: 2,
        position: 'relative',
        zIndex: 1200,
        ...sx
      }}
    >
      <MenuToggleButton open={isDrawerOpen} onClick={onDrawerToggle} />
      
      <Typography
        variant={variant}
        component={component}
        sx={{ 
          fontWeight: 'bold',
          flexGrow: 1,
          ml: 2
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default PageTitle; 