import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:3001/api';

export default function BuscarLicitacoes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [clientes, setClientes] = useState([]);
  const [licitacoesEncontradas, setLicitacoesEncontradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/clientes`);
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const buscarLicitacoes = async () => {
    if (!clienteSelecionado) {
      toast.warning('Selecione um cliente para buscar licitações');
      return;
    }

    setLoading(true);
    try {
      const cliente = clientes.find(c => c.id === clienteSelecionado);
      if (!cliente) {
        throw new Error('Cliente não encontrado');
      }

      // TODO: Implementar chamada à API de licitações públicas
      // Por enquanto, usando dados mock
      const mockLicitacoes = [
        {
          id: 1,
          numero: 'PE-001/2024',
          orgao: 'Prefeitura Municipal',
          objeto: 'Aquisição de equipamentos de informática',
          dataAbertura: '2024-05-15',
          valorEstimado: 500000.00,
          modalidade: 'Pregão Eletrônico',
          ramosAtividade: ['Tecnologia'],
          status: 'Aberta'
        },
        // Adicione mais dados mock conforme necessário
      ];

      // Filtra licitações que correspondem aos ramos de atividade do cliente
      const licitacoesFiltradas = mockLicitacoes.filter(licitacao =>
        licitacao.ramosAtividade.some(ramo => 
          cliente.ramos_atividade.includes(ramo)
        )
      );

      setLicitacoesEncontradas(licitacoesFiltradas);
      
      if (licitacoesFiltradas.length === 0) {
        toast.info('Nenhuma licitação encontrada para os ramos de atividade do cliente');
      }
    } catch (error) {
      console.error('Erro ao buscar licitações:', error);
      toast.error('Erro ao buscar licitações');
    } finally {
      setLoading(false);
    }
  };

  const handleVisualizarLicitacao = (licitacao) => {
    setLicitacaoSelecionada(licitacao);
    setDialogOpen(true);
  };

  const handleCadastrarParticipacao = () => {
    // TODO: Implementar cadastro de participação
    console.log('Cadastrando participação na licitação:', licitacaoSelecionada);
    setDialogOpen(false);
    toast.success('Participação cadastrada com sucesso!');
  };

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Box 
        display="flex" 
        alignItems="center" 
        gap={2}
        mb={3}
      >
        <IconButton
          onClick={() => navigate('/licitacoes')}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Buscar Licitações
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Selecione o Cliente</InputLabel>
              <Select
                value={clienteSelecionado}
                label="Selecione o Cliente"
                onChange={(e) => setClienteSelecionado(e.target.value)}
              >
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.razao_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="contained"
              onClick={buscarLicitacoes}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              disabled={loading || !clienteSelecionado}
            >
              {loading ? 'Buscando...' : 'Buscar Licitações'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {clienteSelecionado && (
        <Box mb={2}>
          <Typography variant="subtitle1" color="primary" gutterBottom>
            Ramos de Atividade do Cliente:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {clientes.find(c => c.id === clienteSelecionado)?.ramos_atividade.map((ramo, index) => (
              <Chip
                key={index}
                label={ramo}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      <Grid container spacing={2}>
        {licitacoesEncontradas.map((licitacao) => (
          <Grid item xs={12} md={6} lg={4} key={licitacao.id}>
            <Card 
              elevation={2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                  transition: 'all 0.2s ease-in-out'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {licitacao.numero}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Órgão:</strong> {licitacao.orgao}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Objeto:</strong> {licitacao.objeto}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Data de Abertura:</strong>{' '}
                  {new Date(licitacao.dataAbertura).toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Valor Estimado:</strong>{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(licitacao.valorEstimado)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Modalidade:</strong> {licitacao.modalidade}
                </Typography>
                <Box mt={1}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Ramos de Atividade:</strong>
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {licitacao.ramosAtividade.map((ramo, index) => (
                      <Chip
                        key={index}
                        label={ramo}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Tooltip title="Visualizar Detalhes">
                  <IconButton 
                    color="primary"
                    onClick={() => handleVisualizarLicitacao(licitacao)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Detalhes da Licitação
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {licitacaoSelecionada && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {licitacaoSelecionada.numero}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Órgão:</strong> {licitacaoSelecionada.orgao}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Objeto:</strong> {licitacaoSelecionada.objeto}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Data de Abertura:</strong>{' '}
                  {new Date(licitacaoSelecionada.dataAbertura).toLocaleDateString('pt-BR')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Valor Estimado:</strong>{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(licitacaoSelecionada.valorEstimado)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Modalidade:</strong> {licitacaoSelecionada.modalidade}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Status:</strong> {licitacaoSelecionada.status}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Ramos de Atividade:</strong>
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {licitacaoSelecionada.ramosAtividade.map((ramo, index) => (
                    <Chip
                      key={index}
                      label={ramo}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined">
            Fechar
          </Button>
          <Button
            onClick={handleCadastrarParticipacao}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Cadastrar Participação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 