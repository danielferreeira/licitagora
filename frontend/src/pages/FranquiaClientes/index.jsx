import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Tooltip,
  CircularProgress,
  Alert,
  Divider,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  LinkOff as RemoveIcon,
  Edit as EditIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { franquiaService, clienteService, authService } from '../../services/supabase';
import { formatarCNPJ, formatarTelefone } from '../../utils/formatters';

const FranquiaClientes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const franquiaFromState = location.state?.franquia;

  const [franquia, setFranquia] = useState(franquiaFromState || null);
  const [clientes, setClientes] = useState([]);
  const [clientesSemFranquia, setClientesSemFranquia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClientes, setIsLoadingClientes] = useState(false);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [selectedClienteToRemove, setSelectedClienteToRemove] = useState(null);
  const [clienteToAdd, setClienteToAdd] = useState(null);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await authService.getCurrentUser();
        // Verificar se é admin pelo email ou pelos metadados
        if (user && (user.email === 'admin@licitagora.com' || user.app_metadata?.role === 'admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          // Redirecionar para home se não for admin
          navigate('/home');
          toast.error('Acesso não autorizado. Esta página é apenas para administradores.');
        }
      } catch (error) {
        console.error('Erro ao verificar permissões de admin:', error);
        setIsAdmin(false);
        navigate('/home');
      }
    };

    checkAdmin();
  }, [navigate]);

  // Buscar dados da franquia se não estiver no estado
  useEffect(() => {
    const fetchFranquia = async () => {
      if (!id || !isAdmin) return;
      
      try {
        if (franquia) return;
        
        setIsLoading(true);
        const data = await franquiaService.buscarFranquiaPorId(id);
        setFranquia(data);
      } catch (error) {
        console.error('Erro ao buscar franquia:', error);
        setError('Falha ao carregar informações da franquia. Tente novamente mais tarde.');
        toast.error('Falha ao carregar informações da franquia');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFranquia();
  }, [id, isAdmin, franquia]);

  // Buscar clientes da franquia
  useEffect(() => {
    const fetchClientes = async () => {
      if (!id || !isAdmin) return;
      
      try {
        setIsLoadingClientes(true);
        const data = await franquiaService.listarClientesDaFranquia(id);
        setClientes(data);
      } catch (error) {
        console.error('Erro ao buscar clientes da franquia:', error);
        toast.error('Falha ao carregar clientes da franquia');
      } finally {
        setIsLoadingClientes(false);
      }
    };

    fetchClientes();
  }, [id, isAdmin]);

  const handleBackClick = () => {
    navigate('/franquias');
  };

  const handleOpenAddDialog = async () => {
    try {
      setIsLoading(true);
      
      // Buscar clientes sem franquia
      const todosClientes = await clienteService.listarClientes();
      const semFranquia = todosClientes.filter(c => !c.franquia_id);
      
      setClientesSemFranquia(semFranquia);
      setShowAddDialog(true);
    } catch (error) {
      console.error('Erro ao buscar clientes disponíveis:', error);
      toast.error('Erro ao buscar clientes disponíveis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
    setClienteToAdd(null);
  };

  const handleOpenRemoveDialog = (cliente) => {
    setSelectedClienteToRemove(cliente);
    setShowConfirmRemove(true);
  };

  const handleCloseRemoveDialog = () => {
    setShowConfirmRemove(false);
    setSelectedClienteToRemove(null);
  };

  const handleAddCliente = async () => {
    if (!clienteToAdd) {
      toast.error('Selecione um cliente para adicionar');
      return;
    }

    try {
      setIsLoading(true);
      await franquiaService.atribuirClienteAFranquia(clienteToAdd.id, id);
      
      // Atualizar lista de clientes
      const updatedClientes = await franquiaService.listarClientesDaFranquia(id);
      setClientes(updatedClientes);
      
      toast.success(`Cliente ${clienteToAdd.razao_social} adicionado à franquia com sucesso!`);
      handleCloseAddDialog();
    } catch (error) {
      console.error('Erro ao adicionar cliente à franquia:', error);
      toast.error(`Erro ao adicionar cliente: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCliente = async () => {
    if (!selectedClienteToRemove) return;
    
    try {
      setIsLoading(true);
      await franquiaService.removerClienteDaFranquia(selectedClienteToRemove.id);
      
      // Atualizar lista de clientes
      const updatedClientes = clientes.filter(c => c.id !== selectedClienteToRemove.id);
      setClientes(updatedClientes);
      
      toast.success(`Cliente ${selectedClienteToRemove.razao_social} removido da franquia com sucesso!`);
      handleCloseRemoveDialog();
    } catch (error) {
      console.error('Erro ao remover cliente da franquia:', error);
      toast.error(`Erro ao remover cliente: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewCliente = (cliente) => {
    // Redirecionar para a página de detalhes do cliente
    navigate(`/clientes/${cliente.id}`);
  };

  const handleEditCliente = (cliente) => {
    // Redirecionar para a página de edição do cliente
    navigate(`/clientes/editar/${cliente.id}`);
  };

  if (!isAdmin) {
    return null; // Não renderiza nada se não for admin
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <MuiLink 
          component="button"
          variant="body1"
          onClick={handleBackClick}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <ArrowBackIcon fontSize="small" sx={{ mr: 0.5 }} />
          Voltar para Franquias
        </MuiLink>
        <Typography color="text.primary">
          Clientes da Franquia
        </Typography>
      </Breadcrumbs>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              {franquia?.nome}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              CNPJ: {formatarCNPJ(franquia?.cnpj)}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Responsável: {franquia?.responsavel}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Email: {franquia?.email}
            </Typography>
            <Typography variant="subtitle1">
              Telefone: {formatarTelefone(franquia?.telefone)}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              Clientes Vinculados
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
              disabled={isLoadingClientes}
            >
              Adicionar Cliente
            </Button>
          </Box>

          <Paper elevation={2} sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'primary.light' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Razão Social</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>CNPJ</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Telefone</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Cidade/UF</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoadingClientes ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Carregando clientes...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : clientes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1">
                          Nenhum cliente vinculado a esta franquia.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientes.map((cliente) => (
                      <TableRow key={cliente.id} hover>
                        <TableCell>{cliente.razao_social}</TableCell>
                        <TableCell>{formatarCNPJ(cliente.cnpj)}</TableCell>
                        <TableCell>{cliente.email}</TableCell>
                        <TableCell>{formatarTelefone(cliente.telefone)}</TableCell>
                        <TableCell>{cliente.cidade}/{cliente.estado}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex' }}>
                            <Tooltip title="Visualizar">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleViewCliente(cliente)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditCliente(cliente)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Remover da Franquia">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenRemoveDialog(cliente)}
                              >
                                <RemoveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      {/* Diálogo para adicionar cliente */}
      <Dialog open={showAddDialog} onClose={handleCloseAddDialog} maxWidth="md" fullWidth>
        <DialogTitle>Adicionar Cliente à Franquia</DialogTitle>
        <DialogContent>
          {clientesSemFranquia.length === 0 ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Não há clientes disponíveis para adicionar. Todos os clientes já estão vinculados a franquias.
            </Alert>
          ) : (
            <Autocomplete
              sx={{ mt: 2 }}
              options={clientesSemFranquia}
              getOptionLabel={(option) => `${option.razao_social} (${formatarCNPJ(option.cnpj)})`}
              value={clienteToAdd}
              onChange={(event, newValue) => setClienteToAdd(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Selecione um cliente"
                  placeholder="Buscar por nome ou CNPJ"
                  fullWidth
                />
              )}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleAddCliente}
            disabled={isLoading || !clienteToAdd}
          >
            {isLoading ? <CircularProgress size={24} /> : "Adicionar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para confirmar remoção de cliente */}
      <Dialog open={showConfirmRemove} onClose={handleCloseRemoveDialog}>
        <DialogTitle>Confirmar Remoção</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja remover o cliente "{selectedClienteToRemove?.razao_social}" desta franquia?
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            O cliente continuará no sistema, mas não estará mais vinculado a esta franquia.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRemoveDialog} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRemoveCliente}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : "Remover"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FranquiaClientes; 