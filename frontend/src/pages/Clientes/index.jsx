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
import NovoClienteDialog from '../../components/NovoClienteDialog';
import EditarClienteDialog from '../../components/EditarClienteDialog';
import VisualizarClienteDialog from '../../components/VisualizarClienteDialog';
import { toast } from 'react-toastify';
import { clienteService } from '../../services/supabase';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ramosAtividade = [
  'Construção Civil',
  'Tecnologia da Informação',
  'Serviços de Limpeza',
  'Manutenção',
  'Consultoria',
  'Fornecimento de Materiais',
  'Outros'
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
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const carregarClientes = async () => {
    setLoading(true);
    try {
        const data = await clienteService.listarClientes();
        let clientesFiltrados = data || [];

        if (filtros.razao_social) {
            clientesFiltrados = clientesFiltrados.filter(cliente =>
                cliente.razao_social.toLowerCase().includes(filtros.razao_social.toLowerCase())
            );
        }
        if (filtros.cnpj) {
            clientesFiltrados = clientesFiltrados.filter(cliente =>
                cliente.cnpj.includes(filtros.cnpj)
            );
        }
        if (filtros.cidade) {
            clientesFiltrados = clientesFiltrados.filter(cliente =>
                cliente.cidade.toLowerCase().includes(filtros.cidade.toLowerCase())
            );
        }
        if (filtros.estado) {
            clientesFiltrados = clientesFiltrados.filter(cliente =>
                cliente.estado === filtros.estado
            );
        }
        if (filtros.ramo_atividade) {
            clientesFiltrados = clientesFiltrados.filter(cliente =>
                cliente.ramos_atividade.includes(filtros.ramo_atividade)
            );
        }

        setClientes(clientesFiltrados);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        toast.error('Erro ao carregar clientes: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await clienteService.excluirCliente(id);
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
    <Box>
      {clientes.map((cliente) => (
        <Card key={cliente.id} sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {cliente.razao_social}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              CNPJ: {cliente.cnpj}
            </Typography>
            <Typography variant="body2" gutterBottom>
              {cliente.cidade} - {cliente.estado}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {cliente.ramos_atividade.map((ramo, index) => (
                <Chip key={index} label={ramo} size="small" />
              ))}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <IconButton size="small" onClick={() => handleView(cliente)}>
                <VisibilityIcon />
              </IconButton>
              <IconButton size="small" onClick={() => handleEdit(cliente)}>
                <EditIcon />
              </IconButton>
              <IconButton size="small" onClick={() => handleDelete(cliente.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const DesktopView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Razão Social</TableCell>
            <TableCell>CNPJ</TableCell>
            <TableCell>Cidade</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Ramos de Atividade</TableCell>
            <TableCell align="right">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clientes.map((cliente) => (
            <TableRow key={cliente.id}>
              <TableCell>{cliente.razao_social}</TableCell>
              <TableCell>{cliente.cnpj}</TableCell>
              <TableCell>{cliente.cidade}</TableCell>
              <TableCell>{cliente.estado}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {cliente.ramos_atividade.map((ramo, index) => (
                    <Chip key={index} label={ramo} size="small" />
                  ))}
                </Box>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Visualizar">
                  <IconButton size="small" onClick={() => handleView(cliente)}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton size="small" onClick={() => handleEdit(cliente)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Excluir">
                  <IconButton size="small" onClick={() => handleDelete(cliente.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Clientes
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtros
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <Typography>Carregando...</Typography>
          </Box>
        ) : (
          isMobile ? <MobileView /> : <DesktopView />
        )}
      </Box>

      {openNovo && (
        <NovoClienteDialog
          open={openNovo}
          onClose={() => setOpenNovo(false)}
          onSuccess={() => {
            setOpenNovo(false);
            carregarClientes();
          }}
        />
      )}

      {openEditar && clienteSelecionado && (
        <EditarClienteDialog
          open={openEditar}
          cliente={clienteSelecionado}
          onClose={() => {
            setOpenEditar(false);
            setClienteSelecionado(null);
          }}
          onSuccess={() => {
            setOpenEditar(false);
            setClienteSelecionado(null);
            carregarClientes();
          }}
        />
      )}

      {openVisualizar && clienteSelecionado && (
        <VisualizarClienteDialog
          open={openVisualizar}
          cliente={clienteSelecionado}
          onClose={() => {
            setOpenVisualizar(false);
            setClienteSelecionado(null);
          }}
        />
      )}
    </Container>
  );
} 