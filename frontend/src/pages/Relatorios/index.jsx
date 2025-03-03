import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { Assessment as AssessmentIcon } from '@mui/icons-material';

export default function Relatorios() {
  return (
    <Box sx={{ p: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Relatórios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AssessmentIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Gerar Relatório
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 2,
              height: '100%',
              minHeight: 250,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Relatórios de Licitações
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <Typography color="text.secondary">
                Em desenvolvimento...
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 2,
              height: '100%',
              minHeight: 250,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Relatórios de Clientes
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <Typography color="text.secondary">
                Em desenvolvimento...
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 2,
              height: '100%',
              minHeight: 250,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Relatórios de Desempenho
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <Typography color="text.secondary">
                Em desenvolvimento...
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper 
            sx={{ 
              p: 3,
              borderRadius: 2,
              height: '100%',
              minHeight: 300,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Typography variant="h6" color="primary" gutterBottom>
              Gráficos e Análises
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
              <Typography color="text.secondary">
                Em desenvolvimento...
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 