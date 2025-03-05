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
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Collapse,
  InputAdornment,
  Chip,
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const API_URL = 'http://localhost:3001/api';

const modalidades = [
  'Pregão Eletrônico',
  'Pregão Presencial',
  'Concorrência',
  'Tomada de Preços',
  'Convite',
  'Leilão',
  'RDC',
];

const ramosAtividade = [
  'Construção Civil',
  'Tecnologia',
  'Saúde',
  'Educação',
  'Alimentação',
  'Transporte',
  'Varejo',
  'Serviços',
  'Indústria',
  'Outros',
];

export default function Licitacoes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [filtros, setFiltros] = useState({
    cliente_id: '',
    ramo_atividade: '',
    modalidade: '',
    data_inicio: null,
    data_fim: null,
    valor_min: '',
    valor_max: '',
  });

  const [licitacoes, setLicitacoes] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLicitacao, setSelectedLicitacao] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [licitacoesRes, clientesRes] = await Promise.all([
        axios.get(`${API_URL}/licitacoes`),
        axios.get(`${API_URL}/clientes`)
      ]);

      setClientes(clientesRes.data);
      setLicitacoes(licitacoesRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta licitação?')) {
      try {
        await axios.delete(`${API_URL}/licitacoes/${id}`);
        toast.success('Licitação excluída com sucesso!');
        carregarDados();
      } catch (error) {
        console.error('Erro ao excluir licitação:', error);
        toast.error('Erro ao excluir licitação');
      }
    }
  };

  const formatarValor = (valor) => {
    if (!valor) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data) => {
    if (!data) return '';
    try {
      const dataObj = typeof data === 'string' ? parseISO(data) : data;
      return format(dataObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '';
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
      cliente_id: '',
      ramo_atividade: '',
      modalidade: '',
      data_inicio: null,
      data_fim: null,
      valor_min: '',
      valor_max: '',
    });
    carregarDados();
  };

  const aplicarFiltros = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filtros.cliente_id) params.append('cliente_id', filtros.cliente_id);
      if (filtros.ramo_atividade) params.append('ramo_atividade', filtros.ramo_atividade);
      if (filtros.modalidade) params.append('modalidade', filtros.modalidade);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio.toISOString());
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim.toISOString());
      if (filtros.valor_min) params.append('valor_min', filtros.valor_min);
      if (filtros.valor_max) params.append('valor_max', filtros.valor_max);

      const response = await axios.get(`${API_URL}/licitacoes?${params.toString()}`);
      setLicitacoes(response.data);
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
      toast.error('Erro ao filtrar licitações');
    } finally {
      setLoading(false);
    }
  };

  const handleNovaLicitacao = () => {
    navigate('/licitacoes/nova');
  };

  const handleMenuClick = (event, licitacao) => {
    setAnchorEl(event.currentTarget);
    setSelectedLicitacao(licitacao);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLicitacao(null);
  };

  const handleStatusChange = async (novoStatus) => {
    try {
      await axios.put(`${API_URL}/licitacoes/${selectedLicitacao.id}/status`, {
        status: novoStatus
      });
      
      toast.success('Status atualizado com sucesso');
      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar status');
    } finally {
      handleMenuClose();
    }
  };

  const renderFiltros = () => (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h6" component="h2" sx={{ color: 'primary.main' }}>
          Filtros
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Cliente</InputLabel>
            <Select
              value={filtros.cliente_id}
              label="Cliente"
              onChange={(e) => handleFiltroChange('cliente_id', e.target.value)}
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
              value={filtros.ramo_atividade}
              label="Ramo de Atividade"
              onChange={(e) => handleFiltroChange('ramo_atividade', e.target.value)}
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
            <InputLabel>Modalidade</InputLabel>
            <Select
              value={filtros.modalidade}
              label="Modalidade"
              onChange={(e) => handleFiltroChange('modalidade', e.target.value)}
            >
              <MenuItem value="">Todas</MenuItem>
              {modalidades.map((modalidade) => (
                <MenuItem key={modalidade} value={modalidade}>
                  {modalidade}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="Data Início"
            value={filtros.data_inicio}
            onChange={(newValue) => handleFiltroChange('data_inicio', newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined'
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <DatePicker
            label="Data Fim"
            value={filtros.data_fim}
            onChange={(newValue) => handleFiltroChange('data_fim', newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                variant: 'outlined'
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Valor Mínimo"
            value={filtros.valor_min}
            onChange={(e) => handleFiltroChange('valor_min', e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <TextField
            fullWidth
            label="Valor Máximo"
            value={filtros.valor_max}
            onChange={(e) => handleFiltroChange('valor_max', e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={limparFiltros}
          >
            Limpar
          </Button>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={aplicarFiltros}
          >
            Filtrar
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderItem = (licitacao) => (
    <Card elevation={0} sx={{ 
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      bgcolor: licitacao.status === 'Finalizada' ? 
        (licitacao.foi_ganha ? 'success.lighter' : 'error.lighter') : 
        'background.paper'
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {licitacao.numero}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {licitacao.cliente_nome}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {licitacao.status === 'Finalizada' && (
              <Chip
                icon={licitacao.foi_ganha ? <CheckCircleIcon /> : <CancelIcon />}
                label={licitacao.foi_ganha ? "Ganha" : "Perdida"}
                color={licitacao.foi_ganha ? "success" : "error"}
                size="small"
              />
            )}
            <Chip
              label={formatarValor(licitacao.status === 'Finalizada' ? licitacao.valor_final : licitacao.valor_estimado)}
              color={licitacao.status === 'Finalizada' ? 
                (licitacao.foi_ganha ? "success" : "error") : 
                (licitacao.status === 'Em Andamento' ? 'warning' : 'primary')}
              size="small"
            />
            <Chip
              label={licitacao.status}
              color={licitacao.status === 'Finalizada' ? 
                (licitacao.foi_ganha ? 'success' : 'error') : 
                (licitacao.status === 'Em Andamento' ? 'warning' : 'default')}
              size="small"
              icon={licitacao.status === 'Finalizada' ? 
                (licitacao.foi_ganha ? <CheckCircleIcon /> : <CancelIcon />) : 
                undefined}
            />
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Órgão
            </Typography>
            <Typography variant="body1">
              {licitacao.orgao}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">
              Modalidade
            </Typography>
            <Typography variant="body1">
              {licitacao.modalidade}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Objeto
            </Typography>
            <Typography variant="body1" noWrap>
              {licitacao.objeto}
            </Typography>
          </Grid>
          {licitacao.status === 'Finalizada' && !licitacao.foi_ganha && (
            <Grid item xs={12}>
              <Typography variant="body2" color="error">
                Motivo da Perda: {licitacao.motivo_perda}
              </Typography>
            </Grid>
          )}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
          <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => navigate(`/licitacoes/${licitacao.id}`)}
          >
            Visualizar
          </Button>
          {licitacao.status !== 'Finalizada' && (
            <>
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/licitacoes/${licitacao.id}/editar`)}
              >
                Editar
              </Button>
              <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleExcluir(licitacao.id)}
              >
                Excluir
              </Button>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderAcoes = (licitacao) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Visualizar">
        <IconButton
          onClick={() => navigate(`/licitacoes/${licitacao.id}`)}
          color="primary"
          size="small"
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>

      {licitacao.status !== 'Finalizada' && (
        <>
          <Tooltip title="Editar">
            <IconButton 
              onClick={() => navigate(`/licitacoes/${licitacao.id}/editar`)}
              color="primary"
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Opções">
            <IconButton
              onClick={(e) => handleMenuClick(e, licitacao)}
              size="small"
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Excluir">
            <IconButton
              onClick={() => handleExcluir(licitacao.id)}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem 
          onClick={() => handleStatusChange('Em Análise')}
          disabled={selectedLicitacao?.status === 'Em Análise'}
        >
          Marcar como Em Análise
        </MenuItem>
        <MenuItem 
          onClick={() => handleStatusChange('Em Andamento')}
          disabled={selectedLicitacao?.status === 'Em Andamento'}
        >
          Marcar como Em Andamento
        </MenuItem>
      </Menu>
    </Box>
  );

  if (isMobile) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            Licitações
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setShowFilters(!showFilters)}
              startIcon={<FilterListIcon />}
            >
              Filtros
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNovaLicitacao}
            >
              Nova
            </Button>
          </Box>
        </Box>

        <Collapse in={showFilters}>
          {renderFiltros()}
        </Collapse>

        <Grid container spacing={2}>
          {licitacoes.map((licitacao) => (
            <Grid item xs={12} key={licitacao.id}>
              {renderItem(licitacao)}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Licitações
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNovaLicitacao}
        >
          Nova Licitação
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<FilterListIcon />}
          onClick={() => setShowFilters(!showFilters)}
          sx={{ mb: 2 }}
        >
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
        </Button>

        <Collapse in={showFilters}>
          {renderFiltros()}
        </Collapse>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Órgão</TableCell>
              <TableCell>Modalidade</TableCell>
              <TableCell>Valor Estimado</TableCell>
              <TableCell>Lucro Estimado</TableCell>
              <TableCell>Data de Abertura</TableCell>
              <TableCell>Data Fim</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {licitacoes.map((licitacao) => (
              <TableRow 
                key={licitacao.id}
                sx={{
                  backgroundColor: licitacao.status === 'Finalizada' ? 
                    (licitacao.foi_ganha ? 'success.lighter' : 'error.lighter') : 
                    'inherit'
                }}
              >
                <TableCell>{licitacao.numero}</TableCell>
                <TableCell>{clientes.find(c => c.id === licitacao.cliente_id)?.razao_social}</TableCell>
                <TableCell>{licitacao.orgao}</TableCell>
                <TableCell>{licitacao.modalidade}</TableCell>
                <TableCell>{formatarValor(licitacao.valor_estimado)}</TableCell>
                <TableCell>{formatarValor(licitacao.lucro_estimado)}</TableCell>
                <TableCell>{formatarData(licitacao.data_abertura)}</TableCell>
                <TableCell>{formatarData(licitacao.data_fim)}</TableCell>
                <TableCell>
                  <Chip
                    label={licitacao.status}
                    color={licitacao.status === 'Finalizada' ? 
                      (licitacao.foi_ganha ? 'success' : 'error') : 
                      (licitacao.status === 'Em Andamento' ? 'warning' : 'default')}
                    size="small"
                    icon={licitacao.status === 'Finalizada' ? 
                      (licitacao.foi_ganha ? <CheckCircleIcon /> : <CancelIcon />) : 
                      undefined}
                  />
                </TableCell>
                <TableCell align="center">
                  {renderAcoes(licitacao)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 