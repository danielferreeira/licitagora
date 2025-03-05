import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, useTheme, useMediaQuery } from '@mui/material';
import {
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = 'http://localhost:3001/api';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dashboardData, setDashboardData] = useState({
    clientesAtivos: 0,
    licitacoesAndamento: 0,
    proximosPrazos: 0,
    documentosPendentes: 0,
    proximasLicitacoes: []
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Buscar clientes
      const clientesResponse = await axios.get(`${API_URL}/clientes`);
      const totalClientes = clientesResponse.data.length;

      // Buscar licitações
      const licitacoesResponse = await axios.get(`${API_URL}/licitacoes`);
      const licitacoes = licitacoesResponse.data;
      
      // Calcular licitações em andamento (entre data_abertura e data_fim)
      const hoje = new Date();
      const licitacoesAndamento = licitacoes.filter(licitacao => {
        const dataAbertura = new Date(licitacao.data_abertura);
        const dataFim = licitacao.data_fim ? new Date(licitacao.data_fim) : addDays(dataAbertura, 30);
        return isAfter(hoje, dataAbertura) && isBefore(hoje, dataFim);
      }).length;

      // Calcular próximos prazos (licitações que vencem nos próximos 7 dias)
      const proximaSemana = addDays(hoje, 7);
      const proximosPrazos = licitacoes.filter(licitacao => {
        const dataFim = licitacao.data_fim ? new Date(licitacao.data_fim) : addDays(new Date(licitacao.data_abertura), 30);
        return isBefore(dataFim, proximaSemana) && isAfter(dataFim, hoje);
      }).length;

      // Ordenar licitações por data de fim e pegar as 5 mais próximas
      const proximasLicitacoes = licitacoes
        .filter(licitacao => {
          const dataFim = licitacao.data_fim ? new Date(licitacao.data_fim) : addDays(new Date(licitacao.data_abertura), 30);
          return isAfter(dataFim, hoje);
        })
        .sort((a, b) => {
          const dataFimA = a.data_fim ? new Date(a.data_fim) : addDays(new Date(a.data_abertura), 30);
          const dataFimB = b.data_fim ? new Date(b.data_fim) : addDays(new Date(b.data_abertura), 30);
          return dataFimA - dataFimB;
        })
        .slice(0, 5);

      setDashboardData({
        clientesAtivos: totalClientes,
        licitacoesAndamento,
        proximosPrazos,
        documentosPendentes: 0, // Será implementado quando tivermos a funcionalidade de documentos
        proximasLicitacoes
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  const stats = [
    {
      title: 'Clientes Ativos',
      value: dashboardData.clientesAtivos,
      icon: <BusinessIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Licitações em Andamento',
      value: dashboardData.licitacoesAndamento,
      icon: <GavelIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#22C55E',
    },
    {
      title: 'Prazos Próximos',
      value: dashboardData.proximosPrazos,
      icon: <ScheduleIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#F59E0B',
    },
    {
      title: 'Documentos Pendentes',
      value: dashboardData.documentosPendentes,
      icon: <DescriptionIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#EF4444',
    },
  ];

  const formatarData = (data) => {
    if (!data) return '';
    return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <Box 
      sx={{ 
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #3B82F6 30%, #60A5FA 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: { xs: 3, sm: 4 },
          fontSize: { xs: '1.75rem', sm: '2rem' }
        }}
      >
        Dashboard
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                borderRadius: { xs: 2, sm: 3 },
                border: '1px solid',
                borderColor: 'divider',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: isMobile ? 'none' : 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                  bgcolor: `${stat.color}08`,
                },
              }}
            >
              <Box
                sx={{
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: `${stat.color}12`,
                  color: stat.color,
                  mb: { xs: 1.5, sm: 2 },
                  transition: 'all 0.3s ease-in-out',
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
                  fontSize: { xs: '1.75rem', sm: '2rem' }
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                align="center"
                sx={{
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ 
        mt: { xs: 3, sm: 4 },
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ height: '100%' }}>
          <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: { xs: 2, sm: 3 },
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Licitações Recentes
              </Typography>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, sm: 3 },
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: { xs: 300, sm: 400 },
                }}
              >
                {dashboardData.proximasLicitacoes.length > 0 ? (
                  dashboardData.proximasLicitacoes.map((licitacao) => (
                    <Box
                      key={licitacao.id}
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {licitacao.numero} - {licitacao.orgao}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {licitacao.objeto}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        Data Fim: {formatarData(licitacao.data_fim)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    flexGrow: 1,
                  }}>
                    <Typography color="text.secondary">
                      Nenhuma licitação em andamento
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>
          <Grid item xs={12} lg={4} sx={{ height: '100%' }}>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}>
              <Typography 
                variant="h5" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: { xs: 2, sm: 3 },
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Próximos Prazos
              </Typography>
              <Paper 
                elevation={0}
                sx={{ 
                  p: { xs: 2, sm: 3 },
                  borderRadius: { xs: 2, sm: 3 },
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: { xs: 300, sm: 400 },
                }}
              >
                {dashboardData.proximosPrazos > 0 ? (
                  <Typography variant="h4" color="warning.main" align="center">
                    {dashboardData.proximosPrazos} prazos nos próximos 7 dias
                  </Typography>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    flexGrow: 1,
                  }}>
                    <Typography color="text.secondary">
                      Nenhum prazo próximo
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
} 