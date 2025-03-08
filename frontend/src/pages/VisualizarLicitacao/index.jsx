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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
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

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      const [licitacaoData, documentosData, requisitosData] = await Promise.all([
        licitacaoService.buscarLicitacaoPorId(id),
        documentoService.listarDocumentosLicitacao(id),
        documentoService.listarRequisitosDocumentacao(id)
      ]);

      if (!licitacaoData) {
        toast.error('Licitação não encontrada');
        navigate('/licitacoes');
        return;
      }

      setLicitacao(licitacaoData);
      setDocumentos(documentosData);
      setRequisitos(requisitosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
      navigate('/licitacoes');
    }
  };

  const handleExcluir = async () => {
    if (window.confirm('Tem certeza que deseja excluir esta licitação?')) {
      try {
        await licitacaoService.excluirLicitacao(id);
        toast.success('Licitação excluída com sucesso!');
        navigate('/licitacoes');
      } catch (error) {
        console.error('Erro ao excluir licitação:', error);
        toast.error('Erro ao excluir licitação');
      }
    }
  };

  const handleDownloadDocumento = async (documento) => {
    try {
      const url = await documentoService.getUrlDownload(documento.arquivo_url);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!licitacao) {
    return null;
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
                      onClick={handleExcluir}
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
              {documentos.map((documento) => (
                <Grid item xs={12} sm={6} md={4} key={documento.id}>
                  <Card variant="outlined">
                    <CardContent>
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
                      <Button
                        variant="outlined"
                        startIcon={<DescriptionIcon />}
                        onClick={() => handleDownloadDocumento(documento)}
                        fullWidth
                      >
                        Visualizar
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {documentos.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    Nenhum documento encontrado
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}

          {tabValue === 2 && (
            <Grid container spacing={2}>
              {requisitos.map((requisito) => (
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
              ))}
              {requisitos.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    Nenhum requisito encontrado
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      </Paper>
    </Box>
  );
} 