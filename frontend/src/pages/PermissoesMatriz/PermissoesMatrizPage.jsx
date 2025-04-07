import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  TextField,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Chip,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  PersonAddAlt as PersonAddIcon,
  EditNote as EditIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService, franquiaService, supabase } from '../../services/supabase';

const permissoesDisponiveis = [
  { id: 'GESTAO_FINANCEIRA', label: 'Gestão Financeira', descricao: 'Acesso a relatórios financeiros e faturamento' },
  { id: 'GESTAO_CLIENTES', label: 'Gestão de Clientes', descricao: 'Cadastrar e editar informações de clientes' },
  { id: 'GESTAO_LICITACOES', label: 'Gestão de Licitações', descricao: 'Gerenciar licitações e propostas' },
  { id: 'GESTAO_COLABORADORES', label: 'Gestão de Colaboradores', descricao: 'Criar e gerenciar colaboradores da franquia' },
  { id: 'EXPORTAR_RELATORIOS', label: 'Exportar Relatórios', descricao: 'Exportar relatórios em diversos formatos' },
  { id: 'DASHBOARD_AVANCADO', label: 'Dashboard Avançado', descricao: 'Acesso a visualizações e métricas avançadas' }
];

export default function PermissoesMatrizPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [franquias, setFranquias] = useState([]);
  const [franquiasFiltradas, setFranquiasFiltradas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedFranquia, setSelectedFranquia] = useState(null);
  const [permissoesFranquia, setPermissoesFranquia] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && (user.email === 'admin@licitagora.com' || user.app_metadata?.role === 'admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
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
        
        // Preparar dados das franquias com informações adicionais
        const franquiasCompletas = await Promise.all(data.map(async (franquia) => {
          // Buscar informações do usuário associado à franquia
          if (franquia.user_id) {
            try {
              const { data: userData, error } = await supabase
                .from('perfis_usuario')
                .select('user_id, is_responsavel')
                .eq('user_id', franquia.user_id)
                .eq('tipo', 'FRANQUIA')
                .single();
              
              if (!error && userData) {
                // Buscar permissões atuais
                const { data: userPermissoes } = await supabase
                  .from('permissoes_franquia')
                  .select('permissao_id, ativo')
                  .eq('franquia_id', franquia.id);
                
                return {
                  ...franquia,
                  isResponsavel: userData.is_responsavel || false,
                  permissoes: userPermissoes || []
                };
              }
            } catch (err) {
              console.warn('Erro ao buscar dados do usuário:', err);
            }
          }
          
          return {
            ...franquia,
            isResponsavel: false,
            permissoes: []
          };
        }));
        
        setFranquias(franquiasCompletas);
        setFranquiasFiltradas(franquiasCompletas);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar franquias:', error);
        toast.error('Falha ao carregar a lista de franquias');
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchFranquias();
    }
  }, [isAdmin]);

  // Filtrar franquias quando o filtro mudar
  useEffect(() => {
    if (filtro.trim() === '') {
      setFranquiasFiltradas(franquias);
    } else {
      const filtered = franquias.filter(f => 
        f.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
        f.email?.toLowerCase().includes(filtro.toLowerCase()) ||
        f.cnpj?.includes(filtro)
      );
      setFranquiasFiltradas(filtered);
    }
  }, [filtro, franquias]);

  const handleFiltroChange = (event) => {
    setFiltro(event.target.value);
  };

  const handleRefresh = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      toast.info('Atualizando lista de franquias...');
      
      const data = await franquiaService.listarFranquias();
      setFranquias(data);
      setFranquiasFiltradas(data);
      
      toast.success('Lista de franquias atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar franquias:', error);
      toast.error('Falha ao atualizar a lista de franquias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPermissoes = (franquia) => {
    setSelectedFranquia(franquia);
    
    // Inicializar as permissões baseadas nas permissões atuais da franquia
    const permissoesIniciais = {};
    permissoesDisponiveis.forEach(perm => {
      permissoesIniciais[perm.id] = false;
    });
    
    // Marcar as permissões que o usuário já possui
    if (franquia.permissoes && Array.isArray(franquia.permissoes)) {
      franquia.permissoes.forEach(perm => {
        if (perm.ativo) {
          const permCode = permissoesDisponiveis.find(p => p.id === perm.permissao_id);
          if (permCode) {
            permissoesIniciais[permCode.id] = true;
          }
        }
      });
    }
    
    setPermissoesFranquia(permissoesIniciais);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedFranquia(null);
  };

  const handlePermissaoChange = (event) => {
    const { name, checked } = event.target;
    setPermissoesFranquia(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSavePermissoes = async () => {
    if (!selectedFranquia || !selectedFranquia.id) return;
    
    try {
      setIsSaving(true);
      
      // Preparar lista de permissões selecionadas
      const permissoesSelecionadas = Object.entries(permissoesFranquia)
        .filter(([_, isSelected]) => isSelected)
        .map(([permissao, _]) => permissao);
      
      // Chamar função para atualizar permissões
      const { data, error } = await supabase.rpc('atualizar_permissoes_franquia', {
        p_franquia_id: selectedFranquia.id,
        p_permissoes: permissoesSelecionadas
      });
      
      if (error) {
        console.error('Erro ao atualizar permissões:', error);
        toast.error(`Erro ao atualizar permissões: ${error.message}`);
      } else {
        toast.success('Permissões atualizadas com sucesso!');
        handleCloseDialog();
        // Atualizar a lista de franquias
        await handleRefresh();
      }
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error(`Erro ao salvar permissões: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 3
      }}>
        <Typography variant="h4" component="h1" sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: 'primary.main'
        }}>
          <SecurityIcon fontSize="large" />
          Gerenciar Permissões de Franquias
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Atualizar
        </Button>
      </Box>
      
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: '8px',
          backgroundColor: 'background.paper'
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2
        }}>
          <FilterIcon color="action" />
          <TextField
            label="Filtrar franquias"
            variant="outlined"
            size="small"
            fullWidth
            value={filtro}
            onChange={handleFiltroChange}
            placeholder="Digite para filtrar por nome, email ou CNPJ"
          />
        </Box>
      </Paper>
      
      {isLoading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '300px'
        }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Carregando franquias...
          </Typography>
        </Box>
      ) : franquiasFiltradas.length === 0 ? (
        <Alert severity="info">
          Nenhuma franquia encontrada. Ajuste os critérios de filtro ou cadastre novas franquias.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {franquiasFiltradas.map(franquia => (
            <Grid item xs={12} md={6} lg={4} key={franquia.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardHeader
                  title={franquia.nome || 'Sem nome'}
                  subheader={franquia.email || 'Sem email'}
                  action={
                    <Chip 
                      label={franquia.ativa ? "Ativa" : "Inativa"} 
                      color={franquia.ativa ? "success" : "error"} 
                      size="small"
                      sx={{ mr: 1 }}
                    />
                  }
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiCardHeader-subheader': {
                      color: 'rgba(255, 255, 255, 0.8)'
                    }
                  }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>CNPJ:</strong> {franquia.cnpj || 'Não informado'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Responsável:</strong> {franquia.user_id ? 'Sim' : 'Não atribuído'}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1,
                      color: 'primary.main'
                    }}
                  >
                    <SecurityIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                    Permissões
                  </Typography>
                  
                  {franquia.user_id ? (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenPermissoes(franquia)}
                      fullWidth
                      sx={{ mt: 1 }}
                    >
                      Configurar Permissões
                    </Button>
                  ) : (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      Nenhum usuário atribuído a esta franquia
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Diálogo para configurar permissões */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center'
        }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Configurar Permissões - {selectedFranquia?.nome}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Defina quais permissões o responsável pela franquia terá no sistema.
            As alterações afetarão as operações que o usuário poderá realizar.
          </Alert>
          
          <Grid container spacing={2}>
            {permissoesDisponiveis.map(permissao => (
              <Grid item xs={12} sm={6} key={permissao.id}>
                <Paper 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    borderRadius: '8px',
                    height: '100%',
                    border: '1px solid',
                    borderColor: permissoesFranquia[permissao.id] ? 'primary.main' : 'transparent',
                    bgcolor: permissoesFranquia[permissao.id] ? 'rgba(25, 118, 210, 0.04)' : 'background.paper'
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={permissoesFranquia[permissao.id] || false}
                        onChange={handlePermissaoChange}
                        name={permissao.id}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle2">{permissao.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {permissao.descricao}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%', m: 0 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            color="inherit" 
            onClick={handleCloseDialog}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSavePermissoes}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 