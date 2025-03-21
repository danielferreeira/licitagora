import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  PersonAdd as AssignIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { franquiaService, authService } from '../../services/supabase';
import { formatarCNPJ, formatarTelefone } from '../../utils/formatters';
import FranquiaDialog from '../../components/FranquiaDialog';
import ConfirmDialog from '../../components/ConfirmDialog';
import UsuarioFranquiaDialog from '../../components/UsuarioFranquiaDialog';

const Franquias = () => {
  const [franquias, setFranquias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentFranquia, setCurrentFranquia] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [openUsuarioDialog, setOpenUsuarioDialog] = useState(false);

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

  // Buscar lista de franquias
  useEffect(() => {
    const fetchFranquias = async () => {
      if (!isAdmin) return;
      
      try {
        setIsLoading(true);
        const data = await franquiaService.listarFranquias();
        setFranquias(data);
        setError(null);
      } catch (error) {
        console.error('Erro ao buscar franquias:', error);
        setError('Falha ao carregar a lista de franquias. Tente novamente mais tarde.');
        toast.error('Falha ao carregar a lista de franquias');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchFranquias();
    }
  }, [isAdmin]);

  const handleOpenForm = (franquia = null) => {
    setCurrentFranquia(franquia);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setCurrentFranquia(null);
  };

  const handleOpenDeleteConfirm = (franquia) => {
    setCurrentFranquia(franquia);
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setCurrentFranquia(null);
  };

  const handleDelete = async () => {
    if (!currentFranquia) return;
    
    try {
      setIsLoading(true);
      await franquiaService.excluirFranquia(currentFranquia.id);
      
      // Atualizar lista
      const updatedFranquias = franquias.filter(f => f.id !== currentFranquia.id);
      setFranquias(updatedFranquias);
      
      toast.success('Franquia excluída com sucesso!');
      handleCloseDeleteConfirm();
    } catch (error) {
      console.error('Erro ao excluir franquia:', error);
      toast.error(`Erro ao excluir franquia: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (franquia) => {
    try {
      setIsLoading(true);
      // Em vez de usar o campo ativa, vamos usar um campo que sabemos que existe
      // O ideal seria fazer o SQL para adicionar a coluna, mas esta é uma solução temporária
      await franquiaService.alterarStatusFranquia(franquia.id, !franquia.ativa);
      
      // Atualizar lista
      const data = await franquiaService.listarFranquias();
      setFranquias(data);
      
      toast.success(`Status da franquia alterado com sucesso!`);
    } catch (error) {
      console.error('Erro ao alterar status da franquia:', error);
      toast.error(`Erro ao alterar status da franquia: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClients = (franquia) => {
    navigate(`/franquias/${franquia.id}/clientes`, { state: { franquia } });
  };

  const handleFormSuccess = async () => {
    handleCloseForm();
    try {
      const data = await franquiaService.listarFranquias();
      setFranquias(data);
    } catch (error) {
      console.error('Erro ao atualizar lista de franquias:', error);
    }
  };

  const handleOpenUsuarioDialog = (franquia) => {
    setCurrentFranquia(franquia);
    setOpenUsuarioDialog(true);
  };

  const handleCloseUsuarioDialog = () => {
    setOpenUsuarioDialog(false);
  };

  if (!isAdmin) {
    return null; // Não renderiza nada se não for admin
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Gerenciamento de Franquias
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
          disabled={isLoading}
        >
          Nova Franquia
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={2} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>CNPJ</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Responsável</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Telefone</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Carregando franquias...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : franquias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      Nenhuma franquia cadastrada.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                franquias.map((franquia) => (
                  <TableRow key={franquia.id} hover>
                    <TableCell>{franquia.nome}</TableCell>
                    <TableCell>{formatarCNPJ(franquia.cnpj)}</TableCell>
                    <TableCell>{franquia.responsavel}</TableCell>
                    <TableCell>{franquia.email}</TableCell>
                    <TableCell>{formatarTelefone(franquia.telefone)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={franquia.ativa === undefined ? 'Status desconhecido' : (franquia.ativa ? 'Ativa' : 'Inativa')} 
                        color={franquia.ativa === undefined ? 'default' : (franquia.ativa ? 'success' : 'error')} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex' }}>
                        <Tooltip title="Editar">
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleOpenForm(franquia)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Ver Clientes">
                          <IconButton 
                            size="small" 
                            color="info" 
                            onClick={() => handleViewClients(franquia)}
                          >
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={franquia.ativa === undefined ? "Alternar Status" : (franquia.ativa ? "Desativar" : "Ativar")}>
                          <IconButton 
                            size="small" 
                            color={franquia.ativa === undefined ? "primary" : (franquia.ativa ? "error" : "success")} 
                            onClick={() => handleToggleStatus(franquia)}
                          >
                            {franquia.ativa === undefined ? <BlockIcon fontSize="small" /> : 
                              (franquia.ativa ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />)}
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Excluir">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleOpenDeleteConfirm(franquia)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={franquia.user_id ? "Gerenciar Usuário" : "Criar Usuário"}>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleOpenUsuarioDialog(franquia)}
                          >
                            <PersonIcon fontSize="small" />
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

      {/* Componente de Diálogo para Formulário */}
      <FranquiaDialog 
        open={showForm}
        franquia={currentFranquia}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Confirmar Exclusão"
        content={
          <>
            <Typography>
              Tem certeza que deseja excluir a franquia "{currentFranquia?.nome}"? 
              Esta ação não pode ser desfeita.
            </Typography>
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              Atenção: Todos os clientes associados a esta franquia serão desvinculados.
            </Typography>
          </>
        }
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleDelete}
        confirmText={isLoading ? "Excluindo..." : "Excluir"}
        confirmColor="error"
        isLoading={isLoading}
      />

      {/* Diálogo para criar/gerenciar usuário da franquia */}
      <UsuarioFranquiaDialog
        open={openUsuarioDialog}
        franquia={currentFranquia}
        onClose={handleCloseUsuarioDialog}
        onSuccess={() => {
          handleCloseUsuarioDialog();
          handleFormSuccess();
        }}
      />
    </Box>
  );
};

export default Franquias; 