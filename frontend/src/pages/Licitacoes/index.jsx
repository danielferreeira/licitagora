import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ptBR from 'date-fns/locale/pt-BR';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3001/api';

const statusOptions = [
  { value: 'aberta', label: 'Aberta', color: 'success' },
  { value: 'em_andamento', label: 'Em Andamento', color: 'warning' },
  { value: 'concluida', label: 'Concluída', color: 'info' },
  { value: 'cancelada', label: 'Cancelada', color: 'error' }
];

export default function Licitacoes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [filtros, setFiltros] = useState({
    cliente: '',
    ramoAtividade: '',
    status: '',
    dataInicio: null,
    dataFim: null,
    modalidade: ''
  });

  const [licitacoes, setLicitacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [ramosAtividade, setRamosAtividade] = useState([
    'Construção Civil',
    'Tecnologia',
    'Saúde',
    'Educação',
    'Alimentação',
    'Transporte',
    'Varejo',
    'Serviços',
    'Indústria',
    'Outros'
  ]);

  useEffect(() => {
    carregarClientes();
    carregarLicitacoes();
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

  const carregarLicitacoes = async () => {
    try {
      // Constrói os parâmetros da query
      const params = new URLSearchParams();
      if (filtros.cliente) params.append('cliente_id', filtros.cliente);
      if (filtros.ramoAtividade) params.append('ramo_atividade', filtros.ramoAtividade);
      if (filtros.status) params.append('status', filtros.status);
      if (filtros.dataInicio) params.append('data_inicio', filtros.dataInicio.toISOString());
      if (filtros.dataFim) params.append('data_fim', filtros.dataFim.toISOString());
      if (filtros.modalidade) params.append('modalidade', filtros.modalidade);

      const response = await axios.get(`${API_URL}/licitacoes?${params.toString()}`);
      setLicitacoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
      toast.error('Erro ao carregar licitações');
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      cliente: '',
      ramoAtividade: '',
      status: '',
      dataInicio: null,
      dataFim: null,
      modalidade: ''
    });
  };

  const aplicarFiltros = () => {
    carregarLicitacoes();
  };

  const handleNovaLicitacao = () => {
    navigate('/licitacoes/buscar');
  };

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
        mb={3}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Licitações
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleNovaLicitacao}
          fullWidth={isMobile}
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
          Nova Licitação
        </Button>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Filtros
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={filtros.cliente}
                label="Cliente"
                onChange={(e) => handleFiltroChange('cliente', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem key={cliente.id} value={cliente.id}>
                    {cliente.razao_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Ramo de Atividade</InputLabel>
              <Select
                value={filtros.ramoAtividade}
                label="Ramo de Atividade"
                onChange={(e) => handleFiltroChange('ramoAtividade', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {ramosAtividade.map((ramo) => (
                  <MenuItem key={ramo} value={ramo}>
                    {ramo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filtros.status}
                label="Status"
                onChange={(e) => handleFiltroChange('status', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {statusOptions.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Início"
                value={filtros.dataInicio}
                onChange={(newValue) => handleFiltroChange('dataInicio', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
              <DatePicker
                label="Data Fim"
                value={filtros.dataFim}
                onChange={(newValue) => handleFiltroChange('dataFim', newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Modalidade"
              value={filtros.modalidade}
              onChange={(e) => handleFiltroChange('modalidade', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={limparFiltros}
              sx={{ flex: 1 }}
            >
              Limpar
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={aplicarFiltros}
              startIcon={<SearchIcon />}
              sx={{ flex: 1 }}
            >
              Buscar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Ramo de Atividade</TableCell>
              <TableCell>Data Abertura</TableCell>
              <TableCell>Valor Estimado</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {licitacoes.map((licitacao) => (
              <TableRow key={licitacao.id}>
                <TableCell>{licitacao.numero}</TableCell>
                <TableCell>{licitacao.cliente}</TableCell>
                <TableCell>{licitacao.ramoAtividade}</TableCell>
                <TableCell>
                  {new Date(licitacao.dataAbertura).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(licitacao.valorEstimado)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusOptions.find(s => s.value === licitacao.status)?.label}
                    color={statusOptions.find(s => s.value === licitacao.status)?.color}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" justifyContent="center" gap={1}>
                    <Tooltip title="Visualizar">
                      <IconButton color="info" size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton color="primary" size="small">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton color="error" size="small">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 