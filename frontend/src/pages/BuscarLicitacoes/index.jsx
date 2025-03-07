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
import { toast } from 'react-toastify';
import { clienteService, licitacaoService } from '../../services/supabase';

// Funções de formatação
const getStatusDisplay = (status) => {
  switch (status) {
    case 'EM_ANALISE':
      return 'Em Análise';
    case 'EM_ANDAMENTO':
      return 'Em Andamento';
    case 'FINALIZADA':
      return 'Finalizada';
    case 'CANCELADA':
      return 'Cancelada';
    default:
      return status;
  }
};

const getModalidadeDisplay = (modalidade) => {
  switch (modalidade) {
    case 'PREGAO_ELETRONICO':
      return 'Pregão Eletrônico';
    case 'PREGAO_PRESENCIAL':
      return 'Pregão Presencial';
    case 'CONCORRENCIA':
      return 'Concorrência';
    case 'TOMADA_DE_PRECOS':
      return 'Tomada de Preços';
    case 'CONVITE':
      return 'Convite';
    case 'LEILAO':
      return 'Leilão';
    case 'CONCURSO':
      return 'Concurso';
    default:
      return modalidade;
  }
};

const getRamoAtividadeDisplay = (ramo) => {
  switch (ramo) {
    case 'CONSTRUCAO_CIVIL':
      return 'Construção Civil';
    case 'TECNOLOGIA_DA_INFORMACAO':
      return 'Tecnologia da Informação';
    case 'SERVICOS_DE_LIMPEZA':
      return 'Serviços de Limpeza';
    case 'MANUTENCAO':
      return 'Manutenção';
    case 'CONSULTORIA':
      return 'Consultoria';
    case 'FORNECIMENTO_DE_MATERIAIS':
      return 'Fornecimento de Materiais';
    case 'OUTROS':
      return 'Outros';
    default:
      return ramo;
  }
};

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
      const data = await clienteService.listarClientes();
      if (data) {
        setClientes(data);
      }
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

      // Buscar licitações públicas baseadas nos ramos de atividade do cliente
      const licitacoesEncontradas = await licitacaoService.buscarLicitacoesPorRamo(cliente.ramos_atividade);

      // Filtrar licitações que já estão cadastradas para o cliente
      const licitacoesCliente = await licitacaoService.buscarLicitacoesPorCliente(clienteSelecionado);
      const licitacoesClienteIds = licitacoesCliente.map(l => l.id);

      // Remover licitações que já estão cadastradas para o cliente
      const licitacoesFiltradas = licitacoesEncontradas.filter(
        licitacao => !licitacoesClienteIds.includes(licitacao.id)
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

  const handleCadastrarParticipacao = async () => {
    try {
      // Criar nova licitação no Supabase vinculada ao cliente
      const novaLicitacao = {
        ...licitacaoSelecionada,
        cliente_id: clienteSelecionado,
        status: 'EM_ANALISE',
        data_cadastro: new Date().toISOString()
      };

      await licitacaoService.criarLicitacao(novaLicitacao);
      toast.success('Licitação cadastrada com sucesso!');
      setDialogOpen(false);
      navigate('/licitacoes');
    } catch (error) {
      console.error('Erro ao cadastrar licitação:', error);
      toast.error('Erro ao cadastrar licitação');
    }
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
                label={getRamoAtividadeDisplay(ramo)}
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
                  {new Date(licitacao.data_abertura).toLocaleDateString('pt-BR')}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Valor Estimado:</strong>{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(licitacao.valor_estimado)}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Modalidade:</strong> {getModalidadeDisplay(licitacao.modalidade)}
                </Typography>
                <Box mt={1}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Ramos de Atividade:</strong>
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {licitacao.ramo_atividade.map((ramo, index) => (
                      <Chip
                        key={index}
                        label={getRamoAtividadeDisplay(ramo)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                <Button
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleVisualizarLicitacao(licitacao)}
                  variant="outlined"
                  size="small"
                >
                  Visualizar
                </Button>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => handleCadastrarParticipacao(licitacao)}
                  variant="contained"
                  size="small"
                >
                  Participar
                </Button>
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
        <DialogTitle>
          Detalhes da Licitação
        </DialogTitle>
        <DialogContent dividers>
          {licitacaoSelecionada && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  {licitacaoSelecionada.numero}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
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
                  {new Date(licitacaoSelecionada.data_abertura).toLocaleDateString('pt-BR')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Valor Estimado:</strong>{' '}
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(licitacaoSelecionada.valor_estimado)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" gutterBottom>
                  <strong>Modalidade:</strong>{' '}
                  {getModalidadeDisplay(licitacaoSelecionada.modalidade)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>
                  <strong>Ramos de Atividade:</strong>
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {licitacaoSelecionada.ramo_atividade.map((ramo, index) => (
                    <Chip
                      key={index}
                      label={getRamoAtividadeDisplay(ramo)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Fechar
          </Button>
          <Button
            variant="contained"
            onClick={handleCadastrarParticipacao}
            startIcon={<AddIcon />}
          >
            Participar da Licitação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 