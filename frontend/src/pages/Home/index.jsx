import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import {
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';

export default function Home() {
  const theme = useTheme();

  const stats = [
    {
      title: 'Clientes Ativos',
      value: '25',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Licitações em Andamento',
      value: '12',
      icon: <GavelIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.success.main,
    },
    {
      title: 'Prazos Próximos',
      value: '5',
      icon: <ScheduleIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.warning.main,
    },
    {
      title: 'Documentos Pendentes',
      value: '8',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      color: theme.palette.error.main,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          color: 'primary.main',
          mb: 4
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              sx={{
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                borderRadius: 2,
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  bgcolor: `${stat.color}05`,
                },
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${stat.color}15`,
                  color: stat.color,
                  mb: 2,
                }}
              >
                {stat.icon}
              </Box>
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontWeight: 'bold',
                  color: stat.color,
                  mb: 1,
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                align="center"
              >
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 3
              }}
            >
              Atividades Recentes
            </Typography>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 2,
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">
                  Em desenvolvimento...
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography 
              variant="h5" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 3
              }}
            >
              Próximos Prazos
            </Typography>
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 2,
                minHeight: 400,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography color="text.secondary">
                  Em desenvolvimento...
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 