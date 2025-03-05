import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Chip,
  Tooltip,
  TextField,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import axios from 'axios';
import NovoClienteDialog from '../../components/NovoClienteDialog';
import EditarClienteDialog from '../../components/EditarClienteDialog';
import VisualizarClienteDialog from '../../components/VisualizarClienteDialog';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:3001/api';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
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

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [openNovo, setOpenNovo] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openVisualizar, setOpenVisualizar] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState({
    razao_social: '',
    cnpj: '',
    cidade: '',
    estado: '',
    ramo_atividade: '',
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const carregarClientes = async () => {
    try {
      const params = new URLSearchParams();
      
      if (filtros.razao_social) params.append('razao_social', filtros.razao_social);
      if (filtros.cnpj) params.append('cnpj', filtros.cnpj);
      if (filtros.cidade) params.append('cidade', filtros.cidade);
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.ramo_atividade) params.append('ramo_atividade', filtros.ramo_atividade);

      const response = await axios.get(`${API_URL}/clientes?${params.toString()}`);
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await axios.delete(`${API_URL}/clientes/${id}`);
        toast.success('Cliente removido com sucesso');
        carregarClientes();
      } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        toast.error('Erro ao deletar cliente');
      }
    }
  };

  const handleEdit = (cliente) => {
    setClienteSelecionado(cliente);
    setOpenEditar(true);
  };

  const handleView = (cliente) => {
    setClienteSelecionado(cliente);
    setOpenVisualizar(true);
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const limparFiltros = () => {
    setFiltros({
      razao_social: '',
      cnpj: '',
      cidade: '',
      estado: '',
      ramo_atividade: '',
    });
    carregarClientes();
  };

  const aplicarFiltros = () => {
    carregarClientes();
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
          <TextField
            fullWidth
            label="Razão Social"
            value={filtros.razao_social}
            onChange={(e) => handleFiltroChange('razao_social', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="CNPJ"
            value={filtros.cnpj}
            onChange={(e) => handleFiltroChange('cnpj', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <TextField
            fullWidth
            label="Cidade"
            value={filtros.cidade}
            onChange={(e) => handleFiltroChange('cidade', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Estado</InputLabel>
            <Select
              value={filtros.estado}
              label="Estado"
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {estados.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
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

  const MobileView = () => (
    <Grid container spacing={2}>
      {clientes.map((cliente) => (
        <Grid item xs={12} key={cliente.id}>
          <Card 
            elevation={2}
            sx={{
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-2px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {cliente.razao_social}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                CNPJ: {cliente.cnpj}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Email: {cliente.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Telefone: {cliente.telefone}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Localização: {cliente.cidade} - {cliente.estado}
              </Typography>
              <Box mt={1}>
                {cliente.ramos_atividade.map((ramo, index) => (
                  <Chip
                    key={index}
                    label={ramo}
                    size="small"
                    sx={{ mr: 0.5, mb: 0.5 }}
                  />
                ))}
              </Box>
              <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
                <Tooltip title="Visualizar">
                  <IconButton 
                    color="info" 
                    onClick={() => handleView(cliente)}
                    sx={{ '&:hover': { transform: 'scale(1.1)' } }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton 
                    color="primary" 
                    onClick={() => handleEdit(cliente)}
                    sx={{ '&:hover': { transform: 'scale(1.1)' } }}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Excluir">
                  <IconButton 
                    color="error" 
                    onClick={() => handleDelete(cliente.id)}
                    sx={{ '&:hover': { transform: 'scale(1.1)' } }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const DesktopView = () => (
    <TableContainer 
      component={Paper} 
      elevation={2}
      sx={{
        height: 'calc(100vh - 300px)',
        overflow: 'auto'
      }}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Razão Social</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>CNPJ</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Telefone</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Cidade</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Estado</TableCell>
            <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Ramos de Atividade</TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow 
              key={cliente.id}
              sx={{ 
                '&:hover': { 
                  bgcolor: 'action.hover',
                  transition: 'background-color 0.2s ease-in-out'
                }
              }}
            >
              <TableCell>{cliente.razao_social}</TableCell>
              <TableCell>{cliente.cnpj}</TableCell>
              <TableCell>{cliente.email}</TableCell>
              <TableCell>{cliente.telefone}</TableCell>
              <TableCell>{cliente.cidade}</TableCell>
              <TableCell>{cliente.estado}</TableCell>
              <TableCell>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                  {cliente.ramos_atividade.map((ramo, index) => (
                    <Chip 
                      key={index} 
                      label={ramo} 
                      size="small"
                      sx={{ 
                        '&:hover': { 
                          boxShadow: 1,
                          transform: 'translateY(-1px)'
                        }
                      }}
                    />
                  ))}
                </Box>
              </TableCell>
              <TableCell align="center">
                <Box display="flex" justifyContent="center" gap={1}>
                  <Tooltip title="Visualizar">
                    <IconButton 
                      color="info" 
                      onClick={() => handleView(cliente)}
                      sx={{ '&:hover': { transform: 'scale(1.1)' } }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEdit(cliente)}
                      sx={{ '&:hover': { transform: 'scale(1.1)' } }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton 
                      color="error" 
                      onClick={() => handleDelete(cliente.id)}
                      sx={{ '&:hover': { transform: 'scale(1.1)' } }}
                    >
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
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Clientes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowFilters(!showFilters)}
            startIcon={<FilterListIcon />}
          >
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNovo(true)}
          >
            Novo Cliente
          </Button>
        </Box>
      </Box>

      <Collapse in={showFilters}>
        {renderFiltros()}
      </Collapse>

      {isMobile ? <MobileView /> : <DesktopView />}

      <NovoClienteDialog
        open={openNovo}
        onClose={() => setOpenNovo(false)}
        onSave={() => {
          setOpenNovo(false);
          carregarClientes();
        }}
      />

      {clienteSelecionado && (
        <>
          <EditarClienteDialog
            open={openEditar}
            cliente={clienteSelecionado}
            onClose={() => {
              setOpenEditar(false);
              setClienteSelecionado(null);
            }}
            onSave={() => {
              setOpenEditar(false);
              setClienteSelecionado(null);
              carregarClientes();
            }}
          />

          <VisualizarClienteDialog
            open={openVisualizar}
            cliente={clienteSelecionado}
            onClose={() => {
              setOpenVisualizar(false);
              setClienteSelecionado(null);
            }}
          />
        </>
      )}
    </Container>
  );
} 