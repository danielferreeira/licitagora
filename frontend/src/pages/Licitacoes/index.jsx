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
  ListSubheader,
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
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clienteService, licitacaoService } from '../../services/supabase';

const modalidades = [
  'PREGAO_ELETRONICO',
  'PREGAO_PRESENCIAL',
  'CONCORRENCIA',
  'TOMADA_DE_PRECOS',
  'CONVITE',
  'LEILAO',
  'CONCURSO'
];

const ramosAtividade = [
  'CONSTRUCAO_CIVIL',
  'TECNOLOGIA_DA_INFORMACAO',
  'SERVICOS_DE_LIMPEZA',
  'MANUTENCAO',
  'CONSULTORIA',
  'FORNECIMENTO_DE_MATERIAIS',
  'OUTROS'
];

const statusLicitacao = [
  'EM_ANDAMENTO',
  'CONCLUIDA',
  'CANCELADA',
  'SUSPENSA',
  'FRACASSADA',
  'DESERTA'
];

// Funções de formatação
const getStatusDisplay = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO':
      return 'Em Andamento';
    case 'CONCLUIDA':
      return 'Concluída';
    case 'CANCELADA':
      return 'Cancelada';
    case 'SUSPENSA':
      return 'Suspensa';
    case 'FRACASSADA':
      return 'Fracassada';
    case 'DESERTA':
      return 'Deserta';
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

export default function Licitacoes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [filtros, setFiltros] = useState({
    cliente_id: '',
    modalidade: '',
    status: '',
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
  const [clienteSearch, setClienteSearch] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      // Primeiro carrega os clientes
      const clientesData = await clienteService.listarClientes();
      setClientes(clientesData || []);

      // Depois carrega as licitações
      const licitacoesData = await licitacaoService.listarLicitacoes();
      setLicitacoes(licitacoesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta licitação?')) {
      try {
        await licitacaoService.excluirLicitacao(id);
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
      modalidade: '',
      status: '',
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
      const data = await licitacaoService.listarLicitacoes(filtros);
      setLicitacoes(data);
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
      await licitacaoService.atualizarLicitacao(selectedLicitacao.id, {
        ...selectedLicitacao,
        status: novoStatus
      });
      
      toast.success('Status atualizado com sucesso');
      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      handleMenuClose();
    }
  };

  const clientesFiltrados = clientes
    .filter(cliente => 
        cliente?.razao_social?.toLowerCase().includes(clienteSearch.toLowerCase()) ||
        cliente?.cnpj?.includes(clienteSearch)
    )
    .sort((a, b) => a?.razao_social?.localeCompare(b?.razao_social) || 0);

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
              <ListSubheader>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Buscar cliente..."
                  value={clienteSearch}
                  onChange={(e) => setClienteSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </ListSubheader>
              {clientesFiltrados.map((cliente) => (
                <MenuItem key={cliente.id} value={cliente.id}>
                  <Box>
                    <Typography variant="body1">
                      {cliente.razao_social}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      CNPJ: {cliente.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}
                    </Typography>
                  </Box>
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
                  {getModalidadeDisplay(modalidade)}
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
              {statusLicitacao.map((status) => (
                <MenuItem key={status} value={status}>
                  {getStatusDisplay(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <DatePicker
            label="Data Início"
            value={filtros.data_inicio}
            onChange={(newValue) => handleFiltroChange('data_inicio', newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <DatePicker
            label="Data Fim"
            value={filtros.data_fim}
            onChange={(newValue) => handleFiltroChange('data_fim', newValue)}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
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

        <Grid item xs={12} sm={6} md={4}>
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
    <Card key={licitacao.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {licitacao.numero}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              {licitacao.orgao}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={getStatusDisplay(licitacao.status || 'EM_ANDAMENTO')}
              color={
                licitacao.status === 'CONCLUIDA' ? (licitacao.foi_ganha ? 'success' : 'error') :
                licitacao.status === 'EM_ANDAMENTO' ? 'primary' :
                licitacao.status === 'CANCELADA' ? 'error' :
                licitacao.status === 'SUSPENSA' ? 'warning' :
                licitacao.status === 'FRACASSADA' ? 'error' :
                licitacao.status === 'DESERTA' ? 'error' :
                'default'
              }
              size="small"
            />
            <IconButton size="small" onClick={(e) => handleMenuClick(e, licitacao)}>
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body2" paragraph>
          <strong>Cliente:</strong> {licitacao.cliente?.razao_social}
            </Typography>
        <Typography variant="body2" paragraph>
          <strong>Modalidade:</strong> {getModalidadeDisplay(licitacao.modalidade)}
            </Typography>
        <Typography variant="body2" paragraph>
          <strong>Ramo de Atividade:</strong> {getRamoAtividadeDisplay(licitacao.ramo_atividade)}
            </Typography>
        <Typography variant="body2" paragraph>
          <strong>Valor Estimado:</strong> {formatarValor(licitacao.valor_estimado)}
            </Typography>
        <Typography variant="body2" paragraph>
          <strong>Data de Abertura:</strong> {formatarData(licitacao.data_abertura)}
              </Typography>

        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          <IconButton
            size="small"
            onClick={() => navigate(`/licitacoes/${licitacao.id}`)}
          >
            <VisibilityIcon />
          </IconButton>
          <IconButton
                size="small"
                onClick={() => navigate(`/licitacoes/${licitacao.id}/editar`)}
              >
            <EditIcon />
          </IconButton>
          <IconButton
                size="small"
                onClick={() => handleExcluir(licitacao.id)}
              >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  const renderAcoes = (licitacao) => (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Visualizar">
        <IconButton
          size="small"
          onClick={() => navigate(`/licitacoes/${licitacao.id}`)}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
          <Tooltip title="Editar">
            <IconButton 
          size="small"
              onClick={() => navigate(`/licitacoes/${licitacao.id}/editar`)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
          size="small"
              onClick={() => handleExcluir(licitacao.id)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
      <Tooltip title="Mais opções">
        <IconButton
          size="small"
          onClick={(e) => handleMenuClick(e, licitacao)}
        >
          <MoreVertIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );

    return (
    <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
            Licitações
          </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
            startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNovaLicitacao}
            >
            Nova Licitação
            </Button>
          </Box>
        </Box>

        <Collapse in={showFilters}>
          {renderFiltros()}
        </Collapse>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <Typography>Carregando...</Typography>
      </Box>
      ) : (
        <>
          {isMobile ? (
            <Box>
              {licitacoes.map(renderItem)}
      </Box>
          ) : (
            <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
                    <TableCell>Órgão</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Modalidade</TableCell>
              <TableCell>Valor Estimado</TableCell>
              <TableCell>Data de Abertura</TableCell>
              <TableCell>Status</TableCell>
                    <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {licitacoes.map((licitacao) => (
                    <TableRow key={licitacao.id}>
                <TableCell>{licitacao.numero}</TableCell>
                <TableCell>{licitacao.orgao}</TableCell>
                      <TableCell>{licitacao.cliente?.razao_social}</TableCell>
                      <TableCell>{getModalidadeDisplay(licitacao.modalidade)}</TableCell>
                <TableCell>{formatarValor(licitacao.valor_estimado)}</TableCell>
                <TableCell>{formatarData(licitacao.data_abertura)}</TableCell>
                <TableCell>
                  <Chip
                          label={getStatusDisplay(licitacao.status || 'EM_ANDAMENTO')}
                          color={
                            licitacao.status === 'CONCLUIDA' ? (licitacao.foi_ganha ? 'success' : 'error') :
                            licitacao.status === 'EM_ANDAMENTO' ? 'primary' :
                            licitacao.status === 'CANCELADA' ? 'error' :
                            licitacao.status === 'SUSPENSA' ? 'warning' :
                            licitacao.status === 'FRACASSADA' ? 'error' :
                            licitacao.status === 'DESERTA' ? 'error' :
                            'default'
                          }
                    size="small"
                  />
                </TableCell>
                      <TableCell align="right">
                  {renderAcoes(licitacao)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
          )}
        </>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {statusLicitacao.map((status) => (
          <MenuItem
            key={status}
            onClick={() => handleStatusChange(status)}
            selected={selectedLicitacao?.status === status}
          >
            {getStatusDisplay(status)}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
} 