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
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';
import NovoClienteDialog from '../../components/NovoClienteDialog';
import EditarClienteDialog from '../../components/EditarClienteDialog';
import VisualizarClienteDialog from '../../components/VisualizarClienteDialog';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:3001/api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [openNovo, setOpenNovo] = useState(false);
  const [openEditar, setOpenEditar] = useState(false);
  const [openVisualizar, setOpenVisualizar] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const carregarClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/clientes`);
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
        height: 'calc(100vh - 200px)',
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
    <Box 
      sx={{ 
        height: '100%',
        width: '100%',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}
    >
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center"
        flexDirection={isMobile ? 'column' : 'row'}
        gap={2}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Clientes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpenNovo(true)}
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
          Novo Cliente
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
        {isMobile ? <MobileView /> : <DesktopView />}
      </Box>

      <NovoClienteDialog
        open={openNovo}
        onClose={() => setOpenNovo(false)}
        onSave={() => {
          carregarClientes();
          setOpenNovo(false);
        }}
      />

      <EditarClienteDialog
        open={openEditar}
        cliente={clienteSelecionado}
        onClose={() => {
          setOpenEditar(false);
          setClienteSelecionado(null);
        }}
        onSave={() => {
          carregarClientes();
          setOpenEditar(false);
          setClienteSelecionado(null);
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
    </Box>
  );
} 