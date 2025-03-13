import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { documentoService } from '../services/supabase';

const DocumentosRequisitos = ({ licitacaoId, licitacaoStatus }) => {
  console.log('DocumentosRequisitos renderizado com:', { licitacaoId, licitacaoStatus });
  
  const theme = useTheme();
  const [requisitosDocumentacao, setRequisitosDocumentacao] = useState([]);
  const [openRequisitoDialog, setOpenRequisitoDialog] = useState(false);
  const [requisitoEmEdicao, setRequisitoEmEdicao] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [renderizado, setRenderizado] = useState(false);
  const [novoRequisito, setNovoRequisito] = useState({
    descricao: '',
    observacoes: '',
    atendido: false
  });

  // Adicionar um useEffect para forçar uma nova renderização quando o componente é montado
  useEffect(() => {
    console.log('DocumentosRequisitos: componente montado');
    setRenderizado(true);
    
    // Forçar uma nova renderização após um pequeno delay
    const timer = setTimeout(() => {
      if (licitacaoId) {
        console.log('DocumentosRequisitos: forçando nova renderização');
        carregarRequisitosDocumentacao(licitacaoId);
      }
    }, 500);
    
    return () => {
      console.log('DocumentosRequisitos: componente desmontado');
      setRenderizado(false);
      clearTimeout(timer);
    };
  }, []);

  // Adicionar um useEffect para forçar uma nova renderização quando os requisitos são carregados
  useEffect(() => {
    if (requisitosDocumentacao && requisitosDocumentacao.length > 0) {
      console.log('DocumentosRequisitos: requisitos carregados, forçando renderização');
      // Forçar uma nova renderização após um pequeno delay
      const timer = setTimeout(() => {
        setRenderizado(prev => !prev); // Alternar o estado para forçar renderização
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [requisitosDocumentacao]);

  // Adicionar um useEffect para depuração
  useEffect(() => {
    console.log('DocumentosRequisitos: estado atual:', { 
      requisitosDocumentacao, 
      carregando, 
      licitacaoId, 
      licitacaoStatus 
    });
  }, [requisitosDocumentacao, carregando, licitacaoId, licitacaoStatus]);

  useEffect(() => {
    if (licitacaoId) {
      console.log('DocumentosRequisitos: licitacaoId mudou para', licitacaoId);
      console.log('DocumentosRequisitos: licitacaoStatus recebido:', licitacaoStatus);
      carregarRequisitosDocumentacao(licitacaoId);
    } else {
      console.log('DocumentosRequisitos: licitacaoId não definido');
      setRequisitosDocumentacao([]);
    }

    // Função de limpeza que será executada quando o componente for desmontado
    // ou quando licitacaoId mudar
    return () => {
      console.log('DocumentosRequisitos: limpando estado ao desmontar ou mudar licitacaoId');
    };
  }, [licitacaoId]);

  useEffect(() => {
    console.log('DocumentosRequisitos: licitacaoStatus mudou para', licitacaoStatus);
    // Não limpar o estado aqui, apenas recarregar se tivermos um licitacaoId
    if (licitacaoId) {
      carregarRequisitosDocumentacao(licitacaoId);
    }
  }, [licitacaoStatus]);

  const carregarRequisitosDocumentacao = async (licitacaoId) => {
    if (!licitacaoId) {
      console.error('Tentativa de carregar requisitos sem licitacaoId');
      return;
    }
    
    // Limpar os requisitos antes de carregar novos
    setRequisitosDocumentacao([]);
    setCarregando(true);
    
    try {
      console.log('Carregando requisitos para licitação:', licitacaoId);
      const data = await documentoService.listarRequisitosDocumentacao(licitacaoId);
      console.log('Requisitos carregados:', data);
      
      if (data && data.length > 0) {
        console.log('Atualizando estado com requisitos encontrados:', data.length);
        // Garantir que cada requisito tenha um ID único para evitar problemas de renderização
        const requisitosComId = data.map((req, index) => ({
          ...req,
          // Garantir que o ID existe, caso contrário, criar um ID temporário
          id: req.id || `temp-${index}-${Date.now()}`
        }));
        console.log('Requisitos com IDs garantidos:', requisitosComId);
        setRequisitosDocumentacao(requisitosComId);
        
        // Forçar uma nova renderização após um pequeno delay
        setTimeout(() => {
          setRenderizado(prev => !prev);
        }, 200);
      } else {
        console.log('Nenhum requisito encontrado, limpando estado');
        setRequisitosDocumentacao([]);
      }
    } catch (error) {
      console.error('Erro ao carregar requisitos de documentação:', error);
      toast.error('Erro ao carregar requisitos de documentação');
      setRequisitosDocumentacao([]);
    } finally {
      setCarregando(false);
    }
  };

  const handleAtualizarRequisito = async (id, atendido) => {
    try {
      await documentoService.atualizarRequisito(id, { atendido });
      setRequisitosDocumentacao(prev => 
        prev.map(req => req.id === id ? { ...req, atendido } : req)
      );
      toast.success('Requisito atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar requisito:', error);
      toast.error('Erro ao atualizar requisito');
    }
  };

  const handleExcluirRequisito = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este requisito?')) return;
    
    try {
      await documentoService.excluirRequisito(id);
      setRequisitosDocumentacao(prev => prev.filter(req => req.id !== id));
      toast.success('Requisito excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir requisito:', error);
      toast.error('Erro ao excluir requisito');
    }
  };

  const abrirDialogoEditarRequisito = (requisito) => {
    setRequisitoEmEdicao(requisito);
    setNovoRequisito({
      descricao: requisito.descricao,
      observacoes: requisito.observacoes || '',
      atendido: requisito.atendido
    });
    setOpenRequisitoDialog(true);
  };

  const abrirDialogoNovoRequisito = () => {
    setRequisitoEmEdicao(null);
    setNovoRequisito({
      descricao: '',
      observacoes: '',
      atendido: false
    });
    setOpenRequisitoDialog(true);
  };

  const handleSalvarRequisito = async () => {
    if (!novoRequisito.descricao) {
      toast.error('A descrição do requisito é obrigatória');
      return;
    }

    try {
      if (requisitoEmEdicao) {
        // Atualizar requisito existente
        const requisito = await documentoService.atualizarRequisito(requisitoEmEdicao.id, {
          ...novoRequisito,
          licitacao_id: licitacaoId
        });
        
        setRequisitosDocumentacao(prev => 
          prev.map(req => req.id === requisito.id ? requisito : req)
        );
        toast.success('Requisito atualizado com sucesso!');
      } else {
        // Criar novo requisito
        const requisito = await documentoService.criarRequisito({
          ...novoRequisito,
          licitacao_id: licitacaoId
        });
        
        setRequisitosDocumentacao(prev => [...prev, requisito]);
        toast.success('Requisito adicionado com sucesso!');
      }
      
      setOpenRequisitoDialog(false);
    } catch (error) {
      console.error('Erro ao salvar requisito:', error);
      toast.error('Erro ao salvar requisito');
    }
  };

  const isLicitacaoEmAndamento = licitacaoStatus === 'EM_ANDAMENTO';
  const isLicitacaoConcluida = licitacaoStatus === 'CONCLUIDA';

  console.log('Status da licitação:', licitacaoStatus);
  console.log('isLicitacaoEmAndamento:', isLicitacaoEmAndamento);
  console.log('isLicitacaoConcluida:', isLicitacaoConcluida);

  // Adicionar logs no return para depuração
  console.log('DocumentosRequisitos: renderizando com estado:', { 
    requisitosDocumentacao, 
    carregando, 
    renderizado,
    isLicitacaoEmAndamento, 
    isLicitacaoConcluida,
    requisitosLength: requisitosDocumentacao?.length || 0
  });

  // Verificar se há requisitos para depuração
  if (requisitosDocumentacao && requisitosDocumentacao.length > 0) {
    console.log('Primeiro requisito para renderizar:', requisitosDocumentacao[0]);
    console.log('Todos os requisitos para renderizar:', requisitosDocumentacao);
  }

  // Renderização direta para depuração
  const renderizacaoDireta = () => {
    if (!requisitosDocumentacao || requisitosDocumentacao.length === 0) {
      return <p>Nenhum requisito encontrado.</p>;
    }

    return (
      <div style={{ width: '100%', padding: '16px' }}>
        <h3>Requisitos de Documentação (Renderização Direta)</h3>
        <p>Total de requisitos: {requisitosDocumentacao.length}</p>
        {requisitosDocumentacao.map((req, index) => (
          <div key={req.id || `direct-${index}`} style={{ 
            border: '1px solid #ccc', 
            padding: '8px', 
            margin: '8px 0',
            borderRadius: '4px'
          }}>
            <p style={{ 
              fontWeight: 'bold',
              textDecoration: req.atendido ? 'line-through' : 'none'
            }}>
              {req.descricao}
            </p>
            {req.observacoes && (
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Observações: {req.observacoes}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <label>
                <input 
                  type="checkbox" 
                  checked={req.atendido} 
                  disabled={!isLicitacaoEmAndamento || isLicitacaoConcluida}
                  onChange={(e) => handleAtualizarRequisito(req.id, e.target.checked)}
                />
                Atendido
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!licitacaoId) {
    console.log('DocumentosRequisitos: licitacaoId não definido, não renderizando');
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Nenhuma licitação selecionada.
        </Typography>
      </Box>
    );
  }

  // Renderização alternativa para depuração
  if (requisitosDocumentacao && requisitosDocumentacao.length > 0 && !carregando) {
    return renderizacaoDireta();
  }

  return (
    <>
      <Card elevation={0} sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        height: '100%'
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 3 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Requisitos de Documentação
              </Typography>
              {(!isLicitacaoEmAndamento || isLicitacaoConcluida) && (
                <Typography 
                  variant="caption" 
                  sx={{ 
                    bgcolor: 'info.lighter', 
                    color: 'info.main', 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1,
                    fontWeight: 500
                  }}
                >
                  Somente Visualização
                </Typography>
              )}
            </Box>
            {isLicitacaoEmAndamento && !isLicitacaoConcluida && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={abrirDialogoNovoRequisito}
              >
                Adicionar Requisito
              </Button>
            )}
          </Box>

          {!isLicitacaoEmAndamento || isLicitacaoConcluida ? (
            <Box sx={{ mb: 2, p: 1, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="body2" color="info.main">
                Esta licitação está {isLicitacaoConcluida ? 'concluída' : 'não está em andamento'}. 
                Os requisitos estão disponíveis apenas para visualização.
              </Typography>
            </Box>
          ) : null}

          {carregando ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : requisitosDocumentacao && requisitosDocumentacao.length > 0 ? (
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Exibindo {requisitosDocumentacao.length} requisitos
                <Button 
                  size="small" 
                  onClick={() => setRenderizado(prev => !prev)}
                  sx={{ ml: 2 }}
                >
                  Atualizar
                </Button>
              </Typography>
              
              {/* Renderização alternativa para garantir que os requisitos sejam exibidos */}
              <Box sx={{ width: '100%' }}>
                {requisitosDocumentacao.map((requisito, index) => (
                  <Box 
                    key={requisito.id || `fallback-${index}`}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 2,
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      width: '100%'
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          textDecoration: requisito.atendido ? 'line-through' : 'none',
                          color: requisito.atendido ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {requisito.descricao}
                      </Typography>
                      {requisito.observacoes && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Observações: {requisito.observacoes}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, ml: 2, alignItems: 'center' }}>
                      {isLicitacaoEmAndamento && !isLicitacaoConcluida ? (
                        <>
                          <Checkbox
                            checked={requisito.atendido}
                            onChange={(e) => handleAtualizarRequisito(requisito.id, e.target.checked)}
                            color="success"
                          />
                          <IconButton
                            size="small"
                            onClick={() => abrirDialogoEditarRequisito(requisito)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleExcluirRequisito(requisito.id)}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <Checkbox
                          checked={requisito.atendido}
                          disabled
                          color="success"
                        />
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                Nenhum requisito encontrado. {isLicitacaoEmAndamento ? 'Faça o upload do edital para extrair os requisitos ou adicione manualmente.' : ''}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => carregarRequisitosDocumentacao(licitacaoId)}
                sx={{ mt: 2 }}
                startIcon={<CircularProgress size={16} />}
              >
                Recarregar Requisitos
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar/editar requisito */}
      <Dialog 
        open={openRequisitoDialog} 
        onClose={() => setOpenRequisitoDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {requisitoEmEdicao ? 'Editar Requisito' : 'Adicionar Requisito'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Descrição"
              value={novoRequisito.descricao}
              onChange={(e) => setNovoRequisito({ ...novoRequisito, descricao: e.target.value })}
              fullWidth
              required
              multiline
              rows={3}
            />
            <TextField
              label="Observações"
              value={novoRequisito.observacoes}
              onChange={(e) => setNovoRequisito({ ...novoRequisito, observacoes: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                checked={novoRequisito.atendido}
                onChange={(e) => setNovoRequisito({ ...novoRequisito, atendido: e.target.checked })}
                color="success"
              />
              <Typography>Requisito atendido</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequisitoDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleSalvarRequisito} 
            variant="contained"
            disabled={!novoRequisito.descricao}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DocumentosRequisitos; 