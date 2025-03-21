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
  CircularProgress,
  Skeleton,
  Snackbar,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
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
    cnae: '',
  });
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const carregarClientes = async () => {
    setLoading(true);
    setError(null);
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
        if (filtros.cnae) {
            clientesFiltrados = clientesFiltrados.filter(cliente => {
                // Verificar se o cliente tem CNAEs
                if (cliente.cnaes && cliente.cnaes.length > 0) {
                    return cliente.cnaes.some(cnae => 
                        cnae.codigo.includes(filtros.cnae) || 
                        cnae.descricao.toLowerCase().includes(filtros.cnae.toLowerCase())
                    );
                }
                return false;
            });
        }

        setClientes(clientesFiltrados);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        setError('Erro ao carregar clientes: ' + (error.message || 'Tente novamente mais tarde'));
        toast.error('Erro ao carregar clientes: ' + (error.message || 'Tente novamente mais tarde'));
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
      cnae: '',
    });
    carregarClientes();
  };

  const aplicarFiltros = () => {
    carregarClientes();
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const renderFiltros = () => (
    <Collapse in={showFilters}>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Razão Social"
              name="razao_social"
              value={filtros.razao_social}
              onChange={(e) => handleFiltroChange('razao_social', e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="CNPJ"
              name="cnpj"
              value={filtros.cnpj}
              onChange={(e) => handleFiltroChange('cnpj', e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Cidade"
              name="cidade"
              value={filtros.cidade}
              onChange={(e) => handleFiltroChange('cidade', e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={filtros.estado}
                onChange={(e) => handleFiltroChange('estado', e.target.value)}
                label="Estado"
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
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="CNAE (código ou descrição)"
              name="cnae"
              value={filtros.cnae}
              onChange={(e) => handleFiltroChange('cnae', e.target.value)}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={limparFiltros}
              startIcon={<ClearIcon />}
            >
              Limpar Filtros
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={aplicarFiltros}
              startIcon={<SearchIcon />}
            >
              Aplicar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Collapse>
  );

  const MobileView = () => (
    <Box>
      {loading ? (
        Array.from(new Array(3)).map((_, index) => (
          <Card key={index} sx={{ mb: 2 }}>
            <CardContent>
              <Skeleton variant="text" width="70%" height={40} />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="text" width="60%" />
              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
              </Box>
            </CardContent>
          </Card>
        ))
      ) : clientes.length > 0 ? (
        clientes.map((cliente) => (
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
                {cliente.cnaes && cliente.cnaes.length > 0 ? (
                  cliente.cnaes.map((cnae, index) => (
                    <Chip 
                      key={index} 
                      label={`${cnae.codigo} - ${cnae.descricao}`} 
                      size="small"
                      color={cnae.tipo === 'principal' ? 'primary' : 'default'}
                      variant={cnae.tipo === 'principal' ? 'filled' : 'outlined'}
                    />
                  ))
                ) : (
                  <Chip label="Sem CNAEs cadastrados" size="small" />
                )}
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
        ))
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            Nenhum cliente encontrado
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={carregarClientes}
            sx={{ mt: 2 }}
          >
            Atualizar
          </Button>
        </Box>
      )}
    </Box>
  );

  const DesktopView = () => (
    <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, boxShadow: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.light' }}>
            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Razão Social</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>CNPJ</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Cidade</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Estado</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>CNAEs</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }}>Franquia</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontWeight: 'bold' }} align="center">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from(new Array(5)).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
                <TableCell><Skeleton /></TableCell>
              </TableRow>
            ))
          ) : clientes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                Nenhum cliente encontrado
              </TableCell>
            </TableRow>
          ) : (
            clientes.map((cliente) => (
              <TableRow key={cliente.id} hover>
                <TableCell>{cliente.razao_social}</TableCell>
                <TableCell>{cliente.cnpj}</TableCell>
                <TableCell>{cliente.cidade}</TableCell>
                <TableCell>{cliente.estado}</TableCell>
                <TableCell>
                  {cliente.cnaes && cliente.cnaes.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {cliente.cnaes.slice(0, 2).map((cnae, index) => (
                        <Chip 
                          key={index} 
                          label={cnae.codigo}
                          size="small"
                          color={cnae.tipo === 'principal' ? 'primary' : 'default'}
                          variant={cnae.tipo === 'principal' ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      ))}
                      {cliente.cnaes.length > 2 && (
                        <Chip 
                          label={`+${cliente.cnaes.length - 2}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  ) : (
                    'Não cadastrado'
                  )}
                </TableCell>
                <TableCell>
                  {cliente.franquia ? (
                    <Tooltip title={`CNPJ: ${cliente.franquia.cnpj}`}>
                      <Chip 
                        label={cliente.franquia.nome}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Tooltip>
                  ) : (
                    <Chip 
                      label="Sem franquia"
                      size="small"
                      variant="outlined"
                      color="default"
                    />
                  )}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Visualizar">
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleView(cliente)}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(cliente)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(cliente.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
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

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
        </Menu>

        <Collapse in={showFilters}>
          {renderFiltros()}
        </Collapse>

        {isMobile ? <MobileView /> : <DesktopView />}
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

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        message={error}
      />
    </Container>
  );
} 