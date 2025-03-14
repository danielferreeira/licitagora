import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Skeleton,
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clienteService, licitacaoService, documentoService } from '../../services/supabase';

// Funções de formatação
const getStatusDisplay = (status) => {
  switch (status) {
    case 'EM_ANDAMENTO':
      return 'Em Andamento';
    case 'CONCLUIDA':
      return 'Concluída';
    case 'CANCELADA':
      return 'Cancelada';
    case 'SUSPENSA':
      return 'Suspensa';
    case 'FRACASSADA':
      return 'Fracassada';
    case 'DESERTA':
      return 'Deserta';
    default:
      return status;
  }
};

const getModalidadeDisplay = (modalidade) => {
  switch (modalidade) {
    case 'PREGAO_ELETRONICO':
      return 'Pregão Eletrônico';
    case 'PREGAO_PRESENCIAL':
      return 'Pregão Presencial';
    case 'CONCORRENCIA':
      return 'Concorrência';
    case 'TOMADA_DE_PRECOS':
      return 'Tomada de Preços';
    case 'CONVITE':
      return 'Convite';
    case 'LEILAO':
      return 'Leilão';
    case 'CONCURSO':
      return 'Concurso';
    default:
      return modalidade;
  }
};

const getRamoAtividadeDisplay = (ramo) => {
  switch (ramo) {
    case 'CONSTRUCAO_CIVIL':
      return 'Construção Civil';
    case 'TECNOLOGIA_DA_INFORMACAO':
      return 'Tecnologia da Informação';
    case 'SERVICOS_DE_LIMPEZA':
      return 'Serviços de Limpeza';
    case 'MANUTENCAO':
      return 'Manutenção';
    case 'CONSULTORIA':
      return 'Consultoria';
    case 'FORNECIMENTO_DE_MATERIAIS':
      return 'Fornecimento de Materiais';
    case 'OUTROS':
      return 'Outros';
    default:
      return ramo;
  }
};

export default function VisualizarLicitacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [licitacao, setLicitacao] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [requisitos, setRequisitos] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      const [licitacaoData, documentosData, requisitosData] = await Promise.all([
        licitacaoService.buscarLicitacaoPorId(id),
        documentoService.listarDocumentosLicitacao(id),
        documentoService.listarRequisitosDocumentacao(id)
      ]);

      if (!licitacaoData) {
        setError('Licitação não encontrada');
        toast.error('Licitação não encontrada');
        navigate('/licitacoes');
        return;
      }

      setLicitacao(licitacaoData);
      setDocumentos(documentosData || []);
      setRequisitos(requisitosData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados: ' + (error.message || ''));
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleExcluir = async () => {
    setConfirmDelete(false);
    setLoading(true);
    try {
      await licitacaoService.excluirLicitacao(id);
      toast.success('Licitação excluída com sucesso!');
      navigate('/licitacoes');
    } catch (error) {
      console.error('Erro ao excluir licitação:', error);
      setError('Erro ao excluir licitação: ' + (error.message || ''));
      toast.error('Erro ao excluir licitação');
      setLoading(false);
    }
  };

  const handleDownloadDocumento = async (documento) => {
    setDownloadLoading(true);
    try {
      const url = await documentoService.getUrlDownload(documento.arquivo_url);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      setError('Erro ao baixar documento: ' + (error.message || ''));
      toast.error('Erro ao baixar documento');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  // Renderização de skeletons durante carregamento
  const renderSkeletons = () => (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton variant="rectangular" width={300} height={40} />
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Skeleton variant="rectangular" width="100%" height={48} />
        </Box>
        
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 1, mb: 2 }} />
            </Grid>
            
            {[1, 2, 3, 4].map((item) => (
              <Grid item xs={12} md={6} key={item}>
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
    </Box>
  );

  if (loading && !licitacao) {
    return renderSkeletons();
  }

  if (!licitacao && !loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Licitação não encontrada
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/licitacoes')}
          sx={{ mt: 2 }}
        >
          Voltar para Licitações
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'info';
      case 'CONCLUIDA':
        return 'success';
      case 'CANCELADA':
      case 'FRACASSADA':
      case 'DESERTA':
        return 'error';
      case 'SUSPENSA':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatarValor = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data) => {
    if (!data) return '';
    return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton
          onClick={() => navigate('/licitacoes')}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: 'primary.dark'
            }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Visualizar Licitação
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={carregarDados}
          disabled={loading}
        >
          Atualizar
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleChangeTab}>
            <Tab label="Informações Gerais" />
            <Tab label="Documentos" />
            <Tab label="Requisitos" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4].map((item) => (
                <Grid item xs={12} md={6} key={item}>
                  <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <>
              {tabValue === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {licitacao.numero}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/licitacoes/${id}/editar`)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => setConfirmDelete(true)}
                        >
                          Excluir
                        </Button>
                      </Box>
                    </Box>
                    <Chip
                      label={getStatusDisplay(licitacao.status)}
                      color={getStatusColor(licitacao.status)}
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Dados do Cliente
                        </Typography>
                        <Typography variant="body1" paragraph>
                          <strong>Razão Social:</strong> {licitacao.cliente?.razao_social}
                        </Typography>
                        <Typography variant="body1" paragraph>
                          <strong>CNPJ:</strong> {licitacao.cliente?.cnpj}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Email:</strong> {licitacao.cliente?.email}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Dados da Licitação
                        </Typography>
                        <Typography variant="body1" paragraph>
                          <strong>Órgão:</strong> {licitacao.orgao}
                        </Typography>
                        <Typography variant="body1" paragraph>
                          <strong>Modalidade:</strong> {getModalidadeDisplay(licitacao.modalidade)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Ramo de Atividade:</strong> {getRamoAtividadeDisplay(licitacao.ramo_atividade)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Objeto
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {licitacao.objeto}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Datas
                        </Typography>
                        <Typography variant="body1" paragraph>
                          <strong>Data de Abertura:</strong> {formatarData(licitacao.data_abertura)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Data Fim:</strong> {formatarData(licitacao.data_fim)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Valores
                        </Typography>
                        <Typography variant="body1" paragraph>
                          <strong>Valor Estimado:</strong> {formatarValor(licitacao.valor_estimado)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Lucro Estimado:</strong> {formatarValor(licitacao.lucro_estimado)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {(licitacao.descricao || licitacao.requisitos || licitacao.observacoes) && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          {licitacao.descricao && (
                            <>
                              <Typography variant="h6" gutterBottom>
                                Descrição
                              </Typography>
                              <Typography variant="body1" paragraph>
                                {licitacao.descricao}
                              </Typography>
                            </>
                          )}

                          {licitacao.requisitos && (
                            <>
                              <Typography variant="h6" gutterBottom>
                                Requisitos
                              </Typography>
                              <Typography variant="body1" paragraph>
                                {licitacao.requisitos}
                              </Typography>
                            </>
                          )}

                          {licitacao.observacoes && (
                            <>
                              <Typography variant="h6" gutterBottom>
                                Observações
                              </Typography>
                              <Typography variant="body1">
                                {licitacao.observacoes}
                              </Typography>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              )}

              {tabValue === 1 && (
                <Grid container spacing={2}>
                  {documentos.length === 0 ? (
                    <Grid item xs={12}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        p: 4,
                        bgcolor: 'background.default',
                        borderRadius: 1
                      }}>
                        <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
                          Nenhum documento encontrado para esta licitação
                        </Typography>
                        <Button 
                          variant="outlined" 
                          startIcon={<RefreshIcon />} 
                          onClick={carregarDados}
                          size="small"
                          sx={{ mt: 2 }}
                        >
                          Atualizar
                        </Button>
                      </Box>
                    </Grid>
                  ) : (
                    documentos.map((documento) => (
                      <Grid item xs={12} sm={6} md={4} key={documento.id}>
                        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {documento.nome}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {documento.tipo === 'EDITAL' ? 'Edital' : 'Documento'}
                            </Typography>
                            {documento.observacoes && (
                              <Typography variant="body2" paragraph>
                                {documento.observacoes}
                              </Typography>
                            )}
                          </CardContent>
                          <Box sx={{ p: 2, pt: 0 }}>
                            <Button
                              variant="outlined"
                              startIcon={downloadLoading ? <CircularProgress size={20} /> : <DescriptionIcon />}
                              onClick={() => handleDownloadDocumento(documento)}
                              fullWidth
                              disabled={downloadLoading}
                            >
                              Visualizar
                            </Button>
                          </Box>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              )}

              {tabValue === 2 && (
                <Grid container spacing={2}>
                  {requisitos.length === 0 ? (
                    <Grid item xs={12}>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        p: 4,
                        bgcolor: 'background.default',
                        borderRadius: 1
                      }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                          Nenhum requisito encontrado para esta licitação
                        </Typography>
                        <Button 
                          variant="outlined" 
                          startIcon={<RefreshIcon />} 
                          onClick={carregarDados}
                          size="small"
                          sx={{ mt: 2 }}
                        >
                          Atualizar
                        </Button>
                      </Box>
                    </Grid>
                  ) : (
                    requisitos.map((requisito) => (
                      <Grid item xs={12} key={requisito.id}>
                        <Card 
                          variant="outlined"
                          sx={{
                            bgcolor: requisito.atendido ? 'success.lighter' : 'background.paper'
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {requisito.atendido ? (
                                <CheckCircleIcon color="success" />
                              ) : (
                                <CancelIcon color="error" />
                              )}
                              <Typography variant="h6">
                                {requisito.descricao}
                              </Typography>
                            </Box>
                            {requisito.observacoes && (
                              <Typography variant="body2" color="text.secondary">
                                {requisito.observacoes}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir esta licitação? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button onClick={handleExcluir} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backdrop durante carregamento */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && licitacao !== null}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Snackbar para erros */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
} 