import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Paper
        elevation={0}
        sx={{
          p: 5,
          mt: 5,
          borderRadius: 2,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
        
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          Página não encontrada
        </Typography>
        
        <Typography variant="h6" color="text.secondary" paragraph>
          A página que você está procurando não existe ou foi movida.
        </Typography>
        
        <Box mt={4}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/home')}
            sx={{ borderRadius: 2, px: 4, py: 1.5 }}
          >
            Voltar para a Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound; 