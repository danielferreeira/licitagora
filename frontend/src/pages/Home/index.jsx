import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, useTheme, useMediaQuery, Chip, Tooltip } from '@mui/material';
import {
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:3001/api';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dashboardData, setDashboardData] = useState({
    clientesAtivos: 0,
    licitacoesAndamento: 0,
    licitacoesFinalizadas: 0,
    licitacoesAnalise: 0,
    proximosPrazos: 0,
    documentosPendentes: 0,
    proximasLicitacoes: [],
    prazosImportantes: []
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
      
      const hoje = new Date();
      
      // Calcular licitações em andamento (status "Em Andamento")
      const licitacoesAndamento = licitacoes.filter(licitacao => 
        licitacao.status === 'Em Andamento'
      );

      // Calcular licitações finalizadas (status "Finalizada")
      const licitacoesFinalizadas = licitacoes.filter(licitacao => 
        licitacao.status === 'Finalizada'
      );

      // Calcular licitações em análise (status "Em Análise")
      const licitacoesAnalise = licitacoes.filter(licitacao => 
        licitacao.status === 'Em Análise'
      );

      // Calcular próximos prazos (licitações em andamento que vencem nos próximos 7 dias)
      const proximaSemana = addDays(hoje, 7);
      const proximosPrazos = licitacoes.filter(licitacao => {
        if (licitacao.status !== 'Em Andamento') return false;
        const dataFim = licitacao.data_fim ? new Date(licitacao.data_fim) : addDays(new Date(licitacao.data_abertura), 30);
        return isBefore(dataFim, proximaSemana) && isAfter(dataFim, hoje);
      });

      // Ordenar licitações por data de fim e pegar as 5 mais próximas (apenas em andamento e análise)
      const proximasLicitacoes = licitacoes
        .filter(licitacao => 
          (licitacao.status === 'Em Andamento' || licitacao.status === 'Em Análise') &&
          isAfter(licitacao.data_fim ? new Date(licitacao.data_fim) : addDays(new Date(licitacao.data_abertura), 30), hoje)
        )
        .sort((a, b) => {
          const dataFimA = a.data_fim ? new Date(a.data_fim) : addDays(new Date(a.data_abertura), 30);
          const dataFimB = b.data_fim ? new Date(b.data_fim) : addDays(new Date(b.data_abertura), 30);
          return dataFimA - dataFimB;
        })
        .slice(0, 5);

      // Preparar prazos importantes
      const prazosImportantes = proximosPrazos.map(licitacao => {
        const dataFim = licitacao.data_fim ? new Date(licitacao.data_fim) : addDays(new Date(licitacao.data_abertura), 30);
        const diasRestantes = differenceInDays(dataFim, hoje);
        return {
          ...licitacao,
          diasRestantes,
          dataFim
        };
      }).sort((a, b) => a.diasRestantes - b.diasRestantes);

      setDashboardData({
        clientesAtivos: totalClientes,
        licitacoesAndamento: licitacoesAndamento.length,
        licitacoesFinalizadas: licitacoesFinalizadas.length,
        licitacoesAnalise: licitacoesAnalise.length,
        proximosPrazos: proximosPrazos.length,
        documentosPendentes: 0,
        proximasLicitacoes,
        prazosImportantes
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
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
      title: 'Licitações em Análise',
      value: dashboardData.licitacoesAnalise,
      icon: <DescriptionIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#F59E0B',
    },
    {
      title: 'Licitações em Andamento',
      value: dashboardData.licitacoesAndamento,
      icon: <GavelIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#22C55E',
    },
    {
      title: 'Licitações Finalizadas',
      value: dashboardData.licitacoesFinalizadas,
      icon: <CheckCircleIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#3B82F6',
    },
  ];

  const formatarData = (data) => {
    if (!data) return '';
    return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusColor = (licitacao) => {
    switch (licitacao.status) {
      case 'Em Análise':
        return '#F59E0B';
      case 'Em Andamento':
        return '#22C55E';
      case 'Finalizada':
        return '#3B82F6';
      default:
        return '#64748B';
    }
  };

  const getStatusChipColor = (licitacao) => {
    const hoje = new Date();
    const dataFim = licitacao.data_fim ? new Date(licitacao.data_fim) : addDays(new Date(licitacao.data_abertura), 30);
    const diasRestantes = differenceInDays(dataFim, hoje);

    if (licitacao.status === 'Finalizada') return '#3B82F6';
    if (diasRestantes < 0) return '#EF4444';
    if (diasRestantes <= 7) return '#F59E0B';
    return '#22C55E';
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
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
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: { xs: 3, sm: 4 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ height: '100%' }}>
          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {licitacao.numero} - {licitacao.orgao}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {licitacao.objeto}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            size="small"
                            label={licitacao.status}
                            sx={{
                              bgcolor: `${getStatusColor(licitacao)}15`,
                              color: getStatusColor(licitacao),
                              fontWeight: 'medium',
                            }}
                          />
                          <Chip
                            size="small"
                            label={licitacao.modalidade}
                            sx={{
                              bgcolor: `${getStatusChipColor(licitacao)}15`,
                              color: getStatusChipColor(licitacao),
                              fontWeight: 'medium',
                            }}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ScheduleIcon fontSize="small" />
                          Abertura: {formatarData(licitacao.data_abertura)}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <WarningIcon fontSize="small" />
                          Prazo: {formatarData(licitacao.data_fim)}
                        </Typography>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      Nenhuma licitação encontrada
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
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
                Prazos Importantes
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
                }}
              >
                {dashboardData.prazosImportantes.length > 0 ? (
                  dashboardData.prazosImportantes.map((prazo) => (
                    <Tooltip
                      key={prazo.id}
                      title={prazo.objeto || 'Sem descrição'}
                      arrow
                    >
                      <Box
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
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {prazo.numero} - {prazo.orgao}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon fontSize="small" />
                            {formatarData(prazo.dataFim)}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${prazo.diasRestantes} dias`}
                            sx={{
                              bgcolor: prazo.diasRestantes <= 3 ? '#EF444415' : '#F59E0B15',
                              color: prazo.diasRestantes <= 3 ? '#EF4444' : '#F59E0B',
                              fontWeight: 'medium',
                            }}
                          />
                        </Box>
                      </Box>
                    </Tooltip>
                  ))
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      Nenhum prazo importante próximo
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