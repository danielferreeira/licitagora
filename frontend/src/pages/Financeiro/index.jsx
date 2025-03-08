import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-toastify';
import { licitacaoService } from '../../services/supabase';

export default function Financeiro() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [dadosFinanceiros, setDadosFinanceiros] = useState({
    totalLicitacoes: 0,
    licitacoesGanhas: 0,
    valorTotalGanho: 0,
    lucroTotal: 0,
    licitacoesFinalizadas: [],
  });
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      const licitacoes = await licitacaoService.listarLicitacoes();
      const licitacoesFinalizadas = licitacoes.filter(
        (licitacao) => licitacao.status === 'CONCLUIDA'
      );

      const licitacoesGanhas = licitacoesFinalizadas.filter(
        (licitacao) => licitacao.foi_ganha
      );

      const valorTotalGanho = licitacoesGanhas.reduce(
        (total, licitacao) => total + (Number(licitacao.valor_final) || 0),
        0
      );

      const lucroTotal = licitacoesGanhas.reduce(
        (total, licitacao) => total + (Number(licitacao.lucro_final) || 0),
        0
      );

      setDadosFinanceiros({
        totalLicitacoes: licitacoesFinalizadas.length,
        licitacoesGanhas: licitacoesGanhas.length,
        valorTotalGanho,
        lucroTotal,
        licitacoesFinalizadas: licitacoesFinalizadas.sort((a, b) => 
          new Date(b.data_fechamento) - new Date(a.data_fechamento)
        ),
      });
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros');
    }
  };

  const formatarMoeda = (valor) => {
    if (!valor || isNaN(valor)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  };

  const formatarData = (data) => {
    if (!data) return '';
    try {
      return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
    }
  };

  const calcularTaxaSucesso = () => {
    if (dadosFinanceiros.totalLicitacoes === 0) return 0;
    return (dadosFinanceiros.licitacoesGanhas / dadosFinanceiros.totalLicitacoes) * 100;
  };

  const stats = [
    {
      title: 'Total de Licitações Finalizadas',
      value: dadosFinanceiros.totalLicitacoes,
      icon: <AssessmentIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Licitações Ganhas',
      value: dadosFinanceiros.licitacoesGanhas,
      icon: <TrendingUpIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#22C55E',
      subtitle: `Taxa de Sucesso: ${calcularTaxaSucesso().toFixed(1)}%`,
    },
    {
      title: 'Valor Total Ganho',
      value: formatarMoeda(dadosFinanceiros.valorTotalGanho),
      icon: <AccountBalanceIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#3B82F6',
    },
    {
      title: 'Lucro Total',
      value: formatarMoeda(dadosFinanceiros.lucroTotal),
      icon: <TrendingUpIcon sx={{ fontSize: isMobile ? 32 : 40 }} />,
      color: '#F59E0B',
    },
  ];

  const handleVisualizarLicitacao = async (licitacao) => {
    try {
      setLoading(true);
      const detalhes = await licitacaoService.buscarLicitacaoPorId(licitacao.id);
      setLicitacaoSelecionada(detalhes);
      setDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes da licitação:', error);
      toast.error('Erro ao carregar detalhes da licitação');
    } finally {
      setLoading(false);
    }
  };

  const handleFecharDialog = () => {
    setLicitacaoSelecionada(null);
    setDialogOpen(false);
  };

  const DetalhesCampo = ({ label, valor, cor }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography 
        variant="body1" 
        sx={{ 
          fontWeight: 500,
          color: cor || 'text.primary'
        }}
      >
        {valor || '-'}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 'bold',
          color: 'primary.main',
          mb: 4,
          fontSize: { xs: '1.5rem', sm: '2rem' },
        }}
      >
        Financeiro
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} lg={3} key={index}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
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
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    textAlign: isMobile ? 'center' : 'left',
                    gap: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${stat.color}15`,
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color: stat.color,
                        fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                    >
                      {stat.title}
                    </Typography>
                    {stat.subtitle && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {stat.subtitle}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          border: '1px solid',
          borderColor: 'divider',
          overflowX: 'auto',
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 3,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
          }}
        >
          Histórico de Licitações Finalizadas
        </Typography>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Órgão</TableCell>
                <TableCell>Data de Fechamento</TableCell>
                <TableCell>Valor Final</TableCell>
                <TableCell>Lucro Final</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dadosFinanceiros.licitacoesFinalizadas.map((licitacao) => (
                <TableRow key={licitacao.id}>
                  <TableCell>{licitacao.numero}</TableCell>
                  <TableCell>{licitacao.orgao}</TableCell>
                  <TableCell>{formatarData(licitacao.data_fechamento)}</TableCell>
                  <TableCell>{formatarMoeda(Number(licitacao.valor_final))}</TableCell>
                  <TableCell>{formatarMoeda(Number(licitacao.lucro_final))}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={licitacao.foi_ganha ? 'Ganha' : 'Perdida'}
                      color={licitacao.foi_ganha ? 'success' : 'error'}
                      sx={{ 
                        minWidth: 80,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Visualizar Detalhes">
                      <IconButton
                        size="small"
                        onClick={() => handleVisualizarLicitacao(licitacao)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={handleFecharDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            Detalhes da Licitação
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleFecharDialog}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ py: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : licitacaoSelecionada ? (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  {licitacaoSelecionada.numero || '-'}
                </Typography>
                <Chip
                  label={licitacaoSelecionada.foi_ganha ? 'Licitação Ganha' : 'Licitação Perdida'}
                  color={licitacaoSelecionada.foi_ganha ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DetalhesCampo 
                  label="Órgão" 
                  valor={licitacaoSelecionada.orgao}
                />
                <DetalhesCampo 
                  label="Data de Fechamento" 
                  valor={formatarData(licitacaoSelecionada.data_fechamento)}
                />
                <DetalhesCampo 
                  label="Modalidade" 
                  valor={licitacaoSelecionada.modalidade}
                />
                <DetalhesCampo 
                  label="Status" 
                  valor={licitacaoSelecionada.status}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DetalhesCampo 
                  label="Valor Final" 
                  valor={formatarMoeda(Number(licitacaoSelecionada.valor_final))}
                  cor={theme.palette.primary.main}
                />
                <DetalhesCampo 
                  label="Lucro Final" 
                  valor={formatarMoeda(Number(licitacaoSelecionada.lucro_final))}
                  cor={Number(licitacaoSelecionada.lucro_final) > 0 ? '#22C55E' : '#EF4444'}
                />
                <DetalhesCampo 
                  label="Valor Estimado" 
                  valor={formatarMoeda(Number(licitacaoSelecionada.valor_estimado))}
                />
                <DetalhesCampo 
                  label="Lucro Estimado" 
                  valor={formatarMoeda(Number(licitacaoSelecionada.lucro_estimado))}
                />
                {!licitacaoSelecionada.foi_ganha && (
                  <DetalhesCampo 
                    label="Motivo da Perda" 
                    valor={licitacaoSelecionada.motivo_perda}
                    cor="#EF4444"
                  />
                )}
              </Grid>

              <Grid item xs={12}>
                <DetalhesCampo 
                  label="Objeto" 
                  valor={licitacaoSelecionada.objeto}
                />
                {licitacaoSelecionada.observacoes && (
                  <DetalhesCampo 
                    label="Observações" 
                    valor={licitacaoSelecionada.observacoes}
                  />
                )}
              </Grid>
            </Grid>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleFecharDialog}
            variant="contained"
            color="primary"
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 