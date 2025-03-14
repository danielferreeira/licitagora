import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress, 
  Button,
  List,
  ListItem,
  ListItemText,
  Divider, 
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { documentoService } from '../services/supabase';
import { toast } from 'react-toastify';

const DocumentosRequisitos = ({ licitacaoId, licitacaoStatus }) => {
  const [requisitos, setRequisitos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tentativas, setTentativas] = useState(0);
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Estados para diálogos
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentRequisito, setCurrentRequisito] = useState(null);
  const [formData, setFormData] = useState({
    descricao: '',
    observacoes: '',
    atendido: false
  });

  // Verificar se a licitação está concluída
  const isLicitacaoConcluida = licitacaoStatus === 'CONCLUIDA' || licitacaoStatus === 'Concluida';

  const carregarRequisitos = async () => {
    if (!licitacaoId) {
      console.error('DocumentosRequisitos: licitacaoId não fornecido');
      setError('ID da licitação não fornecido');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setTentativas(prev => prev + 1);
    
    try {
      console.log(`Carregando requisitos para licitacaoId: ${licitacaoId} (tentativa ${tentativas + 1})`);
      
      // Primeira tentativa: consulta direta
      let { data, error } = await documentoService.listarRequisitosDocumentacaoDireto(licitacaoId);
      
      // Se não encontrou requisitos, tenta usar o método padrão
      if ((!data || data.length === 0) && !error) {
        console.log('Nenhum requisito encontrado diretamente. Tentando método padrão...');
        const response = await documentoService.listarRequisitosDocumentacao(licitacaoId);
        data = response.data;
        error = response.error;
      }
      
      // Se ainda não encontrou, tenta criar requisitos de teste
      if ((!data || data.length === 0) && !error && tentativas < 2) {
        console.log('Nenhum requisito encontrado. Tentando criar requisitos de teste...');
        const response = await documentoService.criarRequisitosTestePara(licitacaoId);
        data = response.data;
        error = response.error;
      }
      
      if (error) {
        console.error('Erro ao carregar requisitos:', error);
        setError('Erro ao carregar requisitos. Por favor, tente novamente.');
        setRequisitos([]);
      } else {
        console.log('Requisitos carregados:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setRequisitos(data);
          setError(null);
    } else {
          console.log('Nenhum requisito encontrado para esta licitação');
          setError('Nenhum requisito encontrado para esta licitação');
          setRequisitos([]);
        }
      }
    } catch (err) {
      console.error('Exceção ao carregar requisitos:', err);
      setError('Ocorreu um erro ao carregar os requisitos. Por favor, tente novamente.');
      setRequisitos([]);
    } finally {
      setLoading(false);
    }
  };

  // Efeito para carregar requisitos quando o componente montar ou licitacaoId mudar
  useEffect(() => {
    console.log('DocumentosRequisitos montado/atualizado com licitacaoId:', licitacaoId);
    if (licitacaoId) {
      carregarRequisitos();
    }
  }, [licitacaoId, forceUpdate]);

  const handleRefresh = () => {
    setForceUpdate(prev => prev + 1);
  };

  // Funções para manipulação de requisitos
  const handleAddRequisito = async () => {
    // Não permitir adicionar se a licitação estiver concluída
    if (isLicitacaoConcluida) {
      toast.error('Não é possível adicionar requisitos em licitações concluídas');
      return;
    }

    try {
      if (!formData.descricao) {
        toast.error('A descrição é obrigatória');
        return;
      }

      setLoading(true);
      
      const novoRequisito = {
        licitacao_id: licitacaoId,
        descricao: formData.descricao,
        observacoes: formData.observacoes || '',
        atendido: formData.atendido || false,
        ordem: requisitos.length + 1
      };
      
      const resultado = await documentoService.criarRequisito(novoRequisito);
      
      toast.success('Requisito adicionado com sucesso!');
      setOpenAddDialog(false);
      setFormData({
        descricao: '',
        observacoes: '',
        atendido: false
      });
      
      // Recarregar requisitos
      handleRefresh();
    } catch (error) {
      console.error('Erro ao adicionar requisito:', error);
      toast.error(`Erro ao adicionar requisito: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRequisito = async () => {
    // Não permitir editar se a licitação estiver concluída
    if (isLicitacaoConcluida) {
      toast.error('Não é possível editar requisitos em licitações concluídas');
      return;
    }

    try {
      if (!formData.descricao) {
        toast.error('A descrição é obrigatória');
        return;
      }

      setLoading(true);
      
      const requisitoAtualizado = {
        descricao: formData.descricao,
        observacoes: formData.observacoes || '',
        atendido: formData.atendido || false
      };
      
      await documentoService.atualizarRequisito(currentRequisito.id, requisitoAtualizado);
      
      toast.success('Requisito atualizado com sucesso!');
      setOpenEditDialog(false);
      setCurrentRequisito(null);
      
      // Recarregar requisitos
      handleRefresh();
    } catch (error) {
      console.error('Erro ao atualizar requisito:', error);
      toast.error(`Erro ao atualizar requisito: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequisito = async () => {
    // Não permitir excluir se a licitação estiver concluída
    if (isLicitacaoConcluida) {
      toast.error('Não é possível excluir requisitos em licitações concluídas');
      return;
    }

    try {
      setLoading(true);
      
      await documentoService.excluirRequisito(currentRequisito.id);
      
      toast.success('Requisito excluído com sucesso!');
      setOpenDeleteDialog(false);
      setCurrentRequisito(null);
      
      // Recarregar requisitos
      handleRefresh();
    } catch (error) {
      console.error('Erro ao excluir requisito:', error);
      toast.error(`Erro ao excluir requisito: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (requisito) => {
    // Não permitir abrir o diálogo de edição se a licitação estiver concluída
    if (isLicitacaoConcluida) {
      toast.info('Não é possível editar requisitos em licitações concluídas');
      return;
    }

    setCurrentRequisito(requisito);
    setFormData({
      descricao: requisito.descricao || '',
      observacoes: requisito.observacoes || '',
      atendido: requisito.atendido || false
    });
    setOpenEditDialog(true);
  };

  const handleOpenDeleteDialog = (requisito) => {
    // Não permitir abrir o diálogo de exclusão se a licitação estiver concluída
    if (isLicitacaoConcluida) {
      toast.info('Não é possível excluir requisitos em licitações concluídas');
      return;
    }

    setCurrentRequisito(requisito);
    setOpenDeleteDialog(true);
  };

  const handleCloseDialogs = () => {
    setOpenAddDialog(false);
    setOpenEditDialog(false);
    setOpenDeleteDialog(false);
    setCurrentRequisito(null);
    setFormData({
      descricao: '',
      observacoes: '',
      atendido: false
    });
  };

  // Renderizar informações de depuração
  const renderDebugInfo = () => (
    <Box sx={{ mt: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 1, fontSize: '0.75rem' }}>
      <Typography variant="caption" component="div" sx={{ fontWeight: 'bold' }}>
        Informações de Depuração:
        </Typography>
      <div>ID da Licitação: {licitacaoId || 'Não selecionado'}</div>
      <div>Status: {licitacaoStatus || 'Não definido'}</div>
      <div>Tentativas de carregamento: {tentativas}</div>
      <div>Requisitos carregados: {requisitos.length}</div>
      </Box>
    );

  return (
    <Box sx={{ p: 2, width: '100%' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
        mb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        pb: 1.5
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
          Requisitos da Documentação
          {isLicitacaoConcluida && (
                <Typography 
              component="span" 
                  variant="caption" 
                  sx={{ 
                ml: 2, 
                bgcolor: 'info.light', 
                color: 'info.contrastText', 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1,
                fontWeight: 'medium'
                  }}
                >
              Licitação Concluída - Somente Visualização
                </Typography>
              )}
        </Typography>
        <Box>
              <Button
            startIcon={<AddIcon />}
            onClick={() => setOpenAddDialog(true)}
                variant="contained"
            color="primary"
            size="small"
            sx={{ mr: 1, borderRadius: 2 }}
            disabled={isLicitacaoConcluida}
          >
            Adicionar
              </Button>
                <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh} 
            disabled={loading}
            variant="outlined"
                  size="small" 
            sx={{ borderRadius: 2 }}
                >
                  Atualizar
                </Button>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : requisitos.length > 0 ? (
        <List sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
          {requisitos.map((requisito, index) => (
            <React.Fragment key={requisito.id || index}>
              <ListItem 
                alignItems="flex-start"
                sx={{ 
                  py: 1.5,
                  position: 'relative',
                  pr: 9, // Espaço para os botões de ação
                  '&:hover': { 
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                    '& .requisito-actions': {
                      opacity: 1
                    }
                  }
                }}
                secondaryAction={
                  <Box 
                    className="requisito-actions" 
                    sx={{
                      opacity: { xs: 1, sm: 0.2 }, 
                      transition: 'opacity 0.2s',
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  >
                    <Tooltip title={isLicitacaoConcluida ? "Não é possível editar requisitos de licitações concluídas" : "Editar"}>
                      <span>
                        <IconButton 
                          edge="end" 
                          aria-label="editar"
                          onClick={() => handleOpenEditDialog(requisito)}
                          size="small"
                          color="primary"
                          disabled={isLicitacaoConcluida}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={isLicitacaoConcluida ? "Não é possível excluir requisitos de licitações concluídas" : "Excluir"}>
                      <span>
                        <IconButton 
                          edge="end" 
                          aria-label="excluir"
                          onClick={() => handleOpenDeleteDialog(requisito)}
                          size="small"
                          color="error"
                          sx={{ ml: 1 }}
                          disabled={isLicitacaoConcluida}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                  <Checkbox
                    checked={requisito.atendido || false}
                    onChange={async (e) => {
                      if (isLicitacaoConcluida) return;
                      try {
                        setLoading(true);
                        await documentoService.atualizarRequisito(requisito.id, {
                          ...requisito,
                          atendido: e.target.checked
                        });
                        // Atualizar o estado local para feedback imediato
                        setRequisitos(prevRequisitos => 
                          prevRequisitos.map(r => 
                            r.id === requisito.id ? {...r, atendido: e.target.checked} : r
                          )
                        );
                        toast.success(`Requisito ${e.target.checked ? 'atendido' : 'marcado como pendente'}`);
                      } catch (error) {
                        console.error('Erro ao atualizar status do requisito:', error);
                        toast.error(`Erro ao atualizar status: ${error.message}`);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    color="success"
                    disabled={isLicitacaoConcluida}
                    sx={{ 
                      pt: 0,
                      '&.Mui-checked': {
                        color: 'success.main',
                      }
                    }}
                  />
                  <Box sx={{ ml: 1, width: 'calc(100% - 42px)', overflow: 'hidden' }}>
                    <Typography 
                      variant="body1" 
                      component="div" 
                      sx={{ 
                        fontWeight: 500,
                        color: requisito.atendido ? 'text.secondary' : 'text.primary',
                        textDecoration: requisito.atendido ? 'line-through' : 'none',
                        mb: 0.5,
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                      }}
                    >
                      {requisito.descricao || 'Requisito sem descrição'}
                    </Typography>
                    
                    {(requisito.observacoes || requisito.observacao) && (
                      <Typography 
                        component="div" 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mb: 0.5,
                          fontSize: '0.875rem',
                          color: 'text.secondary',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {requisito.observacoes || requisito.observacao}
                        </Typography>
                      )}
                    
                    <Typography 
                      component="div" 
                      variant="caption" 
                      sx={{
                        display: 'inline-block',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                        bgcolor: requisito.atendido ? 'success.light' : 'warning.light',
                        color: requisito.atendido ? 'success.contrastText' : 'warning.contrastText',
                      }}
                    >
                      {requisito.atendido ? "Atendido" : "Pendente"}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
              {index < requisitos.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Alert severity="info">
          Nenhum requisito encontrado para esta licitação.
        </Alert>
      )}
      
      {renderDebugInfo()}

      {/* Diálogo para adicionar requisito */}
      <Dialog 
        open={openAddDialog} 
        onClose={handleCloseDialogs} 
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          pb: 1,
          '& .MuiTypography-root': {
            fontWeight: 600,
            color: 'primary.main'
          }
        }}>
          Adicionar Requisito
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              fullWidth
              required
              variant="outlined"
              placeholder="Digite a descrição do requisito"
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <TextField
              label="Observações"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Digite observações adicionais (opcional)"
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.atendido}
                  onChange={(e) => setFormData({ ...formData, atendido: e.target.checked })}
                  color="success"
                />
              }
              label={
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: formData.atendido ? 600 : 400,
                    color: formData.atendido ? 'success.main' : 'text.primary'
                  }}
                >
                  Requisito Atendido
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={handleCloseDialogs} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleAddRequisito} 
            variant="contained" 
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Adicionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para editar requisito */}
      <Dialog 
        open={openEditDialog} 
        onClose={handleCloseDialogs} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          pb: 1,
          '& .MuiTypography-root': {
            fontWeight: 600,
            color: 'primary.main'
          }
        }}>
          Editar Requisito
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Descrição"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              fullWidth
              required
              variant="outlined"
              placeholder="Digite a descrição do requisito"
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <TextField
              label="Observações"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              placeholder="Digite observações adicionais (opcional)"
              InputProps={{
                sx: { borderRadius: 1 }
              }}
            />
            <FormControlLabel
              control={
              <Checkbox
                  checked={formData.atendido}
                  onChange={(e) => setFormData({ ...formData, atendido: e.target.checked })}
                color="success"
              />
              }
              label={
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: formData.atendido ? 600 : 400,
                    color: formData.atendido ? 'success.main' : 'text.primary'
                  }}
                >
                  Requisito Atendido
                </Typography>
              }
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={handleCloseDialogs} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleEditRequisito} 
            variant="contained"
            color="primary"
            sx={{ borderRadius: 2 }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para confirmar exclusão */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={handleCloseDialogs}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          pb: 1,
          color: 'error.main',
          '& .MuiTypography-root': {
            fontWeight: 600
          }
        }}>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography>
            Tem certeza que deseja excluir o requisito:
          </Typography>
          <Typography sx={{ fontWeight: 600, mt: 1, mb: 1 }}>
            "{currentRequisito?.descricao}"?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={handleCloseDialogs} 
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDeleteRequisito} 
            variant="contained" 
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentosRequisitos; 