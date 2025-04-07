import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, useTheme, useMediaQuery, Chip, Tooltip, Button, CircularProgress } from '@mui/material';
import {
  Business as BusinessIcon,
  Gavel as GavelIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { clienteService, licitacaoService } from '../../services/supabase';
import { verificarPermissaoAdmin } from '../../services/api/utils';

export default function Home() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    clientesAtivos: 0,
    licitacoesAndamento: 0,
    licitacoesFinalizadas: 0,
    licitacoesAnalise: 0,
    proximosPrazos: 0,
    documentosPendentes: 0,
    proximasLicitacoes: [],
    prazosImportantes: [],
    licitacoesVencidas: []
  });

  useEffect(() => {
    carregarDados();
    
    // Verificação admin
    const verificarAdmin = async () => {
      try {
        // Verificar se o usuário é admin
        await verificarPermissaoAdmin();
      } catch (error) {
        console.warn('Erro ao verificar permissão admin:', error);
      }
    };

    verificarAdmin();
    
    // Intervalo para atualizar os dados a cada 5 minutos
    const interval = setInterval(() => {
      if (navigator.onLine) {
        carregarDados();
      }
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Primeiro verificar se o navegador está online
      if (!navigator.onLine) {
        throw new Error('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
      }
      
      console.log('Iniciando busca de dados...');
      
      // Dados de clientes
      let clientes = [];
      try {
        clientes = await clienteService.listarClientes();
        console.log(`${clientes.length} clientes carregados`);
      } catch (clienteErr) {
        console.error('Erro ao carregar clientes:', clienteErr);
      }
      
      // Dados de licitações
      let licitacoesRaw = [];
      try {
        licitacoesRaw = await licitacaoService.listarLicitacoes();
        console.log(`${licitacoesRaw.length} licitações carregadas`);
      } catch (licitacaoErr) {
        console.error('Erro ao carregar licitações:', licitacaoErr);
      }
      
      // Garantir que temos arrays para trabalhar
      const licitacoes = Array.isArray(licitacoesRaw) ? licitacoesRaw : [];
      
      const hoje = new Date();
      
      // Calcular licitações em andamento
      const licitacoesAndamento = licitacoes.filter(licitacao => 
        licitacao && licitacao.status === 'EM_ANDAMENTO'
      );

      // Calcular licitações finalizadas
      const licitacoesFinalizadas = licitacoes.filter(licitacao => 
        licitacao && licitacao.status === 'CONCLUIDA'
      );

      // Calcular licitações em análise (considerando outros status que não sejam EM_ANDAMENTO ou CONCLUIDA)
      const licitacoesAnalise = licitacoes.filter(licitacao => 
        licitacao && licitacao.status !== 'EM_ANDAMENTO' && licitacao.status !== 'CONCLUIDA'
      );

      // Calcular próximos prazos (licitações em andamento que vencem nos próximos 7 dias)
      const proximaSemana = addDays(hoje, 7);
      const proximosPrazos = licitacoes.filter(licitacao => {
        if (!licitacao || licitacao.status !== 'EM_ANDAMENTO') return false;
        const dataFim = licitacao.data_fechamento ? new Date(licitacao.data_fechamento) : addDays(new Date(licitacao.data_abertura || hoje), 30);
        return isBefore(dataFim, proximaSemana) && isAfter(dataFim, hoje);
      });

      // Ordenar licitações por data de fim e pegar as 5 mais próximas (apenas em andamento e análise)
      const proximasLicitacoes = licitacoes
        .filter(licitacao => {
          if (!licitacao) return false;
          if (!(licitacao.status === 'EM_ANDAMENTO' || licitacao.status !== 'CONCLUIDA')) return false;
          
          const dataFim = licitacao.data_fechamento ? new Date(licitacao.data_fechamento) : addDays(new Date(licitacao.data_abertura || hoje), 30);
          return isAfter(dataFim, hoje);
        })
        .sort((a, b) => {
          const dataFimA = a.data_fechamento ? new Date(a.data_fechamento) : addDays(new Date(a.data_abertura || hoje), 30);
          const dataFimB = b.data_fechamento ? new Date(b.data_fechamento) : addDays(new Date(b.data_abertura || hoje), 30);
          return dataFimA - dataFimB;
        })
        .slice(0, 5);

      // Preparar prazos importantes
      const prazosImportantes = proximosPrazos.map(licitacao => {
        const dataFim = licitacao.data_fechamento ? new Date(licitacao.data_fechamento) : addDays(new Date(licitacao.data_abertura || hoje), 30);
        const diasRestantes = differenceInDays(dataFim, hoje);
        return {
          ...licitacao,
          diasRestantes,
          dataFim
        };
      }).sort((a, b) => a.diasRestantes - b.diasRestantes);

      // Calcular licitações com prazos vencidos
      const licitacoesVencidas = licitacoes.filter(licitacao => {
        if (!licitacao || licitacao.status !== 'EM_ANDAMENTO') return false;
        const dataFim = licitacao.data_fechamento ? new Date(licitacao.data_fechamento) : addDays(new Date(licitacao.data_abertura || hoje), 30);
        return isBefore(dataFim, hoje);
      });

      setDashboardData({
        clientesAtivos: Array.isArray(clientes) ? clientes.length : 0,
        licitacoesAndamento: licitacoesAndamento.length,
        licitacoesFinalizadas: licitacoesFinalizadas.length,
        licitacoesAnalise: licitacoesAnalise.length,
        proximosPrazos: proximosPrazos.length,
        documentosPendentes: 0,
        proximasLicitacoes,
        prazosImportantes,
        licitacoesVencidas
      });
      
      console.log('Dados do dashboard carregados com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error(`Erro ao carregar dados do dashboard: ${error.message}`);
    } finally {
      setLoading(false);
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
    if (!data) return 'Não definida';
    try {
      return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error, data);
      return 'Data inválida';
    }
  };

  const getStatusColor = (licitacao) => {
    if (!licitacao || !licitacao.status) return '#64748B';
    
    switch (licitacao.status) {
      case 'EM_ANDAMENTO':
        return '#22C55E';
      case 'CONCLUIDA':
        return '#3B82F6';
      case 'CANCELADA':
        return '#EF4444';
      case 'SUSPENSA':
        return '#F59E0B';
      case 'FRACASSADA':
        return '#9333EA';
      case 'DESERTA':
        return '#64748B';
      default:
        return '#64748B';
    }
  };

  const getStatusChipColor = (licitacao) => {
    if (!licitacao) return '#64748B';
    
    const hoje = new Date();
    const dataAbertura = licitacao.data_abertura ? new Date(licitacao.data_abertura) : hoje;
    const dataFim = licitacao.data_fechamento ? new Date(licitacao.data_fechamento) : addDays(dataAbertura, 30);
    const diasRestantes = differenceInDays(dataFim, hoje);

    if (licitacao.status === 'FINALIZADA' || licitacao.status === 'CONCLUIDA') return '#3B82F6';
    if (diasRestantes < 0) return '#EF4444';
    if (diasRestantes <= 7) return '#F59E0B';
    return '#22C55E';
  };

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: { xs: 2, sm: 3 }
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
            mb: 0,
            fontSize: { xs: '1.75rem', sm: '2rem' }
          }}
        >
          Dashboard
        </Typography>
        
        <Button
          variant="outlined"
          color="primary"
          startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={carregarDados}
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 2
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          {loading ? 'Atualizando...' : 'Atualizar Dados'}
        </Button>
      </Box>

      {dashboardData.licitacoesVencidas.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'error.main',
            bgcolor: 'error.light',
            color: 'error.dark',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <WarningIcon color="error" />
          <Typography variant="body1" fontWeight="medium">
            Atenção! Existem {dashboardData.licitacoesVencidas.length} licitações com prazos vencidos que precisam de atenção.
          </Typography>
        </Paper>
      )}

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
                {dashboardData.proximasLicitacoes && dashboardData.proximasLicitacoes.length > 0 ? (
                  dashboardData.proximasLicitacoes.map((licitacao) => (
                    <Box
                      key={licitacao.id || Math.random()}
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
                            {licitacao.numero || 'S/N'} - {licitacao.orgao || 'Cliente ' + (licitacao.cliente_id || 'não identificado')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {licitacao.objeto || 'Sem descrição'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            size="small"
                            label={licitacao.status || 'Status indefinido'}
                            sx={{
                              bgcolor: `${getStatusColor(licitacao)}15`,
                              color: getStatusColor(licitacao),
                              fontWeight: 'medium',
                            }}
                          />
                          <Chip
                            size="small"
                            label={licitacao.modalidade || 'Não especificada'}
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
                          Prazo: {formatarData(licitacao.data_fechamento)}
                        </Typography>
                        {licitacao.valor_estimado && (
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'medium' }}>
                            Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(licitacao.valor_estimado)}
                          </Typography>
                        )}
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
                {dashboardData.prazosImportantes && dashboardData.prazosImportantes.length > 0 ? (
                  dashboardData.prazosImportantes.map((prazo) => (
                    <Tooltip
                      key={prazo.id || Math.random()}
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
                          {prazo.numero || 'S/N'} - {prazo.orgao || 'Cliente ' + (prazo.cliente_id || 'não identificado')}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <ScheduleIcon fontSize="small" />
                            {formatarData(prazo.dataFim)}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${prazo.diasRestantes || 0} dias`}
                            sx={{
                              bgcolor: prazo.diasRestantes <= 3 ? '#EF444415' : '#F59E0B15',
                              color: prazo.diasRestantes <= 3 ? '#EF4444' : '#F59E0B',
                              fontWeight: 'medium',
                            }}
                          />
                          {prazo.valor_estimado && (
                            <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                              Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(prazo.valor_estimado)}
                            </Typography>
                          )}
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