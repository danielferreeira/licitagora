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
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery
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
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { franquiaService, authService } from '../../services/supabase';
import { formatarCNPJ, formatarTelefone } from '../../utils/formatters';
import FranquiaDialog from '../../components/FranquiaDialog/FranquiaDialog';
import ConfirmDialog from '../../components/ConfirmDialog/ConfirmDialog';
import UsuarioFranquiaDialog from '../../components/UsuarioFranquiaDialog/UsuarioFranquiaDialog';

const Franquias = () => {
  const [franquias, setFranquias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentFranquia, setCurrentFranquia] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [openUsuarioDialog, setOpenUsuarioDialog] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      const result = await franquiaService.excluirFranquia(currentFranquia.id);
      
      if (result && result.success) {
        // Atualizar lista
        const updatedFranquias = franquias.filter(f => f.id !== currentFranquia.id);
        setFranquias(updatedFranquias);
        
        toast.success('Franquia excluída com sucesso!');
      } else {
        const errorMsg = result?.error || 'Erro ao excluir franquia';
        toast.error(errorMsg);
      }
      
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
      const result = await franquiaService.alterarStatusFranquia(franquia.id, !franquia.ativa);
      
      if (result && result.success) {
        // Atualizar lista
        const data = await franquiaService.listarFranquias();
        setFranquias(data);
        
        toast.success(`Status da franquia alterado com sucesso!`);
      } else {
        const errorMsg = result?.error || 'Erro ao alterar status da franquia';
        toast.error(errorMsg);
      }
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
      setIsLoading(true);
      const data = await franquiaService.listarFranquias();
      setFranquias(data);
    } catch (error) {
      console.error('Erro ao atualizar lista de franquias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUsuarioDialog = (franquia) => {
    setCurrentFranquia(franquia);
    setOpenUsuarioDialog(true);
  };

  const handleCloseUsuarioDialog = () => {
    setOpenUsuarioDialog(false);
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const data = await franquiaService.listarFranquias();
      setFranquias(data);
      setError(null);
      toast.success('Lista de franquias atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar lista de franquias:', error);
      toast.error('Falha ao atualizar a lista');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFranquias = franquias.filter(franquia => 
    franquia.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    franquia.cnpj?.includes(searchTerm) ||
    franquia.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return null; // Não renderiza nada se não for admin
  }

  // Renderização para dispositivos móveis
  const renderMobileView = () => {
    return (
      <Box>
        {filteredFranquias.length === 0 ? (
          <Card sx={{ mb: 2, textAlign: 'center', py: 4 }}>
            <Typography>Nenhuma franquia cadastrada.</Typography>
          </Card>
        ) : (
          filteredFranquias.map((franquia) => (
            <Card key={franquia.id} sx={{ 
              mb: 2, 
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                transform: 'translateY(-2px)'
              }
            }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>{franquia.nome}</Typography>
                  <Chip 
                    label={franquia.ativa ? 'Ativa' : 'Inativa'} 
                    color={franquia.ativa ? 'success' : 'error'} 
                    size="small"
                    sx={{ fontWeight: 'medium' }}
                  />
                </Box>
                <Divider sx={{ my: 1.5 }} />
                <Grid container spacing={2} sx={{ mb: 1.5 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>CNPJ:</Typography>
                    <Typography variant="body1" fontWeight="medium">{formatarCNPJ(franquia.cnpj)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Responsável:</Typography>
                    <Typography variant="body1" fontWeight="medium">{franquia.responsavel || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Email:</Typography>
                    <Typography variant="body1">{franquia.email || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Telefone:</Typography>
                    <Typography variant="body1">{formatarTelefone(franquia.telefone) || '-'}</Typography>
                  </Grid>
                </Grid>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  mt: 1.5, 
                  gap: 1,
                  '& .MuiIconButton-root': {
                    borderRadius: '8px',
                    padding: '8px'
                  }
                }}>
                  <Tooltip title="Editar">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleOpenForm(franquia)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Ver Clientes">
                    <IconButton 
                      size="small" 
                      color="info" 
                      onClick={() => handleViewClients(franquia)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={franquia.ativa ? "Desativar" : "Ativar"}>
                    <IconButton 
                      size="small" 
                      color={franquia.ativa ? "error" : "success"} 
                      onClick={() => handleToggleStatus(franquia)}
                    >
                      {franquia.ativa ? <BlockIcon /> : <ActiveIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => handleOpenDeleteConfirm(franquia)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={franquia.user_id ? "Gerenciar Usuário" : "Criar Usuário"}>
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleOpenUsuarioDialog(franquia)}
                    >
                      <PersonIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    );
  };

  // Renderização para desktop
  const renderDesktopView = () => {
    return (
      <Box>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Carregando franquias...
            </Typography>
          </Box>
        ) : filteredFranquias.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Nenhuma franquia cadastrada.
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpenForm()}
              sx={{ mt: 2 }}
            >
              Cadastrar Primeira Franquia
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {filteredFranquias.map((franquia) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={franquia.id}>
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      bgcolor: theme.palette.primary.main, 
                      color: 'white',
                      p: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold" noWrap>
                      {franquia.nome}
                    </Typography>
                    <Chip 
                      label={franquia.ativa ? 'Ativa' : 'Inativa'} 
                      color={franquia.ativa ? 'success' : 'default'} 
                      size="small"
                      sx={{ 
                        bgcolor: franquia.ativa ? 'rgba(46, 125, 50, 0.9)' : 'rgba(211, 47, 47, 0.9)',
                        color: 'white',
                        fontWeight: 'bold',
                        '& .MuiChip-label': {
                          px: 1
                        }
                      }}
                    />
                  </Box>
                  
                  <CardContent sx={{ p: 2, flexGrow: 1 }}>
                    <Grid container spacing={1.5}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>CNPJ:</Typography>
                        <Typography variant="body2" fontWeight="medium">{formatarCNPJ(franquia.cnpj)}</Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Responsável:</Typography>
                        <Typography variant="body2" fontWeight="medium">{franquia.responsavel || '-'}</Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Email:</Typography>
                        <Typography variant="body2" noWrap title={franquia.email}>
                          {franquia.email || '-'}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>Telefone:</Typography>
                        <Typography variant="body2">{formatarTelefone(franquia.telefone) || '-'}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                  
                  <Divider />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    p: 1.5,
                    bgcolor: 'rgba(0,0,0,0.02)'
                  }}>
                    <Tooltip title="Editar">
                      <IconButton size="small" color="primary" onClick={() => handleOpenForm(franquia)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Ver Clientes">
                      <IconButton size="small" color="info" onClick={() => handleViewClients(franquia)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={franquia.ativa ? "Desativar" : "Ativar"}>
                      <IconButton 
                        size="small" 
                        color={franquia.ativa ? "error" : "success"} 
                        onClick={() => handleToggleStatus(franquia)}
                      >
                        {franquia.ativa ? <BlockIcon fontSize="small" /> : <ActiveIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => handleOpenDeleteConfirm(franquia)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={franquia.user_id ? "Gerenciar Usuário" : "Criar Usuário"}>
                      <IconButton size="small" color="primary" onClick={() => handleOpenUsuarioDialog(franquia)}>
                        <PersonIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ padding: { xs: 2, md: 3 } }}>
      {/* Cabeçalho */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold" 
          sx={{ 
            fontSize: { xs: '1.5rem', md: '2rem' },
            color: theme.palette.primary.main,
            borderBottom: `2px solid ${theme.palette.primary.main}`,
            paddingBottom: 1,
            display: 'inline-block'
          }}
        >
          Gerenciamento de Franquias
        </Typography>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          gap: 1.5,
          width: { xs: '100%', sm: 'auto' }
        }}>
          <TextField
            placeholder="Buscar franquia..."
            size="small"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />,
            }}
            sx={{ 
              flexGrow: { xs: 1, sm: 0 }, 
              minWidth: { sm: '220px' },
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
          />
          
          <Button
            variant="outlined"
            color="primary"
            onClick={handleRefresh}
            disabled={isLoading}
            startIcon={<RefreshIcon />}
            sx={{ 
              flex: { xs: '1 0 auto', sm: '0 0 auto' },
              borderRadius: '8px'
            }}
          >
            Atualizar
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            disabled={isLoading}
            sx={{ 
              flex: { xs: '1 0 auto', sm: '0 0 auto' },
              borderRadius: '8px',
              boxShadow: 2
            }}
          >
            Nova Franquia
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: '8px',
            '& .MuiAlert-icon': {
              alignItems: 'center'
            }
          }}
        >
          {error}
        </Alert>
      )}

      <Paper elevation={3} sx={{ 
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        mb: 4,
        p: 2
      }}>
        {isMobile ? renderMobileView() : renderDesktopView()}
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
              Atenção: Esta ação excluirá também o usuário vinculado à franquia.
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