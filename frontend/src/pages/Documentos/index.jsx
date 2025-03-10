import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Chip,
  useTheme,
  useMediaQuery,
  Tooltip,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { toast } from 'react-toastify';
import { clienteService, licitacaoService, documentoService } from '../../services/supabase';

const downloadDocumento = async (id, tipo, arquivoUrl) => {
  try {
    const url = await documentoService.getUrlDownload(arquivoUrl);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Erro ao abrir documento:', error);
    toast.error('Erro ao abrir o documento. Por favor, tente novamente.');
  }
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`documentos-tabpanel-${index}`}
      aria-labelledby={`documentos-tab-${index}`}
      sx={{ 
        height: 'calc(100vh - 180px)',
        overflow: 'auto',
        flex: 1 
      }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </Box>
  );
}

export default function Documentos() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [documentosTabValue, setDocumentosTabValue] = useState(0);
  const [clientes, setClientes] = useState([]);
  const [licitacoes, setLicitacoes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [licitacoesFiltradas, setLicitacoesFiltradas] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroLicitacao, setFiltroLicitacao] = useState('');
  const [tiposDocumentos, setTiposDocumentos] = useState([]);
  const [documentosCliente, setDocumentosCliente] = useState([]);
  const [documentosLicitacao, setDocumentosLicitacao] = useState([]);
  const [requisitosDocumentacao, setRequisitosDocumentacao] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState('');
  const [openUploadCliente, setOpenUploadCliente] = useState(false);
  const [openUploadLicitacao, setOpenUploadLicitacao] = useState(false);
  const [openRequisitoDialog, setOpenRequisitoDialog] = useState(false);
  const [requisitoEmEdicao, setRequisitoEmEdicao] = useState(null);
  const [novoRequisito, setNovoRequisito] = useState({
    descricao: '',
    observacoes: '',
    atendido: false
  });
  const [uploadData, setUploadData] = useState({
    arquivo: null,
    tipo_documento_id: '',
    data_validade: null,
    observacoes: '',
    nome: '',
    uploading: false
  });

  useEffect(() => {
    carregarClientes();
    carregarLicitacoes();
    carregarTiposDocumentos();
  }, []);

  useEffect(() => {
    filtrarClientes();
  }, [filtroCliente, clientes]);

  useEffect(() => {
    filtrarLicitacoes();
  }, [filtroLicitacao, licitacoes]);

  useEffect(() => {
    if (clienteSelecionado) {
      carregarDocumentosCliente(clienteSelecionado);
    }
  }, [clienteSelecionado]);

  useEffect(() => {
    if (licitacaoSelecionada) {
      carregarDocumentosLicitacao(licitacaoSelecionada);
      carregarRequisitosDocumentacao(licitacaoSelecionada);
    }
  }, [licitacaoSelecionada]);

  const carregarClientes = async () => {
    try {
      const data = await clienteService.listarClientes();
      if (data) {
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const carregarLicitacoes = async () => {
    try {
      const data = await licitacaoService.listarLicitacoes();
      if (data) {
        setLicitacoes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
      toast.error('Erro ao carregar licitações');
    }
  };

  const carregarTiposDocumentos = async () => {
    try {
      const data = await documentoService.listarTiposDocumentos();
      if (data) {
        setTiposDocumentos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de documentos:', error);
      toast.error('Erro ao carregar tipos de documentos');
    }
  };

  const carregarDocumentosCliente = async (clienteId) => {
    try {
      const data = await documentoService.listarDocumentosCliente(clienteId);
      if (data) {
        setDocumentosCliente(data);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos do cliente:', error);
      toast.error('Erro ao carregar documentos do cliente');
    }
  };

  const carregarDocumentosLicitacao = async (licitacaoId) => {
    try {
      const data = await documentoService.listarDocumentosLicitacao(licitacaoId);
      if (data) {
        setDocumentosLicitacao(data);
      }
    } catch (error) {
      console.error('Erro ao carregar documentos da licitação:', error);
      toast.error('Erro ao carregar documentos da licitação');
    }
  };

  const carregarRequisitosDocumentacao = async (licitacaoId) => {
    try {
      console.log('Carregando requisitos para licitação:', licitacaoId);
      const data = await documentoService.listarRequisitosDocumentacao(licitacaoId);
      console.log('Requisitos carregados:', data);
      if (data) {
        setRequisitosDocumentacao(data);
        console.log('Estado atualizado com os requisitos');
      }
    } catch (error) {
      console.error('Erro ao carregar requisitos de documentação:', error);
      toast.error('Erro ao carregar requisitos de documentação');
    }
  };

  const filtrarClientes = () => {
    if (!filtroCliente) {
      setClientesFiltrados(clientes);
      return;
    }
    const filtro = filtroCliente.toLowerCase();
    const filtrados = clientes.filter(cliente => 
      cliente.razao_social.toLowerCase().includes(filtro) ||
      cliente.cnpj.includes(filtro)
    );
    setClientesFiltrados(filtrados);
  };

  const filtrarLicitacoes = () => {
    // Primeiro filtra por status "Em Andamento"
    const licitacoesEmAndamento = licitacoes.filter(licitacao => 
      licitacao.status === 'EM_ANDAMENTO'
    );

    if (!filtroLicitacao) {
      setLicitacoesFiltradas(licitacoesEmAndamento);
      return;
    }
    const filtro = filtroLicitacao.toLowerCase();
    const filtradas = licitacoesEmAndamento.filter(licitacao => 
      licitacao.numero.toLowerCase().includes(filtro) ||
      licitacao.orgao.toLowerCase().includes(filtro) ||
      licitacao.objeto.toLowerCase().includes(filtro)
    );
    setLicitacoesFiltradas(filtradas);
  };

  const handleUploadDocumentoCliente = async () => {
    if (!uploadData.arquivo || !uploadData.tipo_documento_id) {
      toast.error('Selecione um arquivo e um tipo de documento');
      return;
    }

    // Validar extensão do arquivo
    const extensoesPermitidas = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
    const extensao = uploadData.arquivo.name.split('.').pop().toLowerCase();
    if (!extensoesPermitidas.includes(extensao)) {
      toast.error('Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG ou PNG');
      return;
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const tamanhoMaximo = 10 * 1024 * 1024; // 10MB em bytes
    if (uploadData.arquivo.size > tamanhoMaximo) {
      toast.error('O arquivo é muito grande. Tamanho máximo: 10MB');
      return;
    }

    setUploadData(prev => ({ ...prev, uploading: true }));
    try {
      await documentoService.uploadDocumentoCliente({
        arquivo: uploadData.arquivo,
        clienteId: clienteSelecionado,
        tipoDocumentoId: uploadData.tipo_documento_id,
        dataValidade: uploadData.data_validade,
        observacoes: uploadData.observacoes,
        nome: uploadData.arquivo.name
      });

      toast.success('Documento enviado com sucesso!');
      setOpenUploadCliente(false);
      limparUploadData();
      carregarDocumentosCliente(clienteSelecionado);
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      toast.error('Erro ao enviar documento: ' + error.message);
    } finally {
      setUploadData(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleUploadDocumentoLicitacao = async () => {
    if (!uploadData.arquivo || !uploadData.tipo_documento_id || !uploadData.nome) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validar extensão do arquivo
    const extensoesPermitidas = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'];
    const extensao = uploadData.arquivo.name.split('.').pop().toLowerCase();
    if (!extensoesPermitidas.includes(extensao)) {
      toast.error('Tipo de arquivo não permitido. Use: PDF, DOC, DOCX, XLS, XLSX, JPG, JPEG ou PNG');
      return;
    }

    // Validar tamanho do arquivo (máximo 10MB)
    const tamanhoMaximo = 10 * 1024 * 1024; // 10MB em bytes
    if (uploadData.arquivo.size > tamanhoMaximo) {
      toast.error('O arquivo é muito grande. Tamanho máximo: 10MB');
      return;
    }

    setUploadData(prev => ({ ...prev, uploading: true }));
    try {
      await documentoService.uploadDocumentoLicitacao({
        arquivo: uploadData.arquivo,
        licitacaoId: licitacaoSelecionada,
        tipoDocumentoId: uploadData.tipo_documento_id,
        dataValidade: uploadData.data_validade,
        observacoes: uploadData.observacoes,
        nome: uploadData.nome
      });

      toast.success('Documento enviado com sucesso!');
      setOpenUploadLicitacao(false);
      limparUploadData();
      
      // Recarregar documentos e requisitos
      await Promise.all([
        carregarDocumentosLicitacao(licitacaoSelecionada),
        carregarRequisitosDocumentacao(licitacaoSelecionada)
      ]);
      
      // Mudar para a aba de requisitos após o upload do edital
      if (uploadData.tipo_documento_id === 'EDITAL') {
        setDocumentosTabValue(1);
      }
    } catch (error) {
      console.error('Erro ao enviar documento:', error);
      toast.error('Erro ao enviar documento: ' + error.message);
    } finally {
      setUploadData(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleExcluirDocumentoCliente = async (id, arquivoUrl) => {
    if (window.confirm('Tem certeza que deseja excluir este documento?')) {
      try {
        await documentoService.excluirDocumentoCliente(id, arquivoUrl);
        toast.success('Documento excluído com sucesso!');
        carregarDocumentosCliente(clienteSelecionado);
      } catch (error) {
        console.error('Erro ao excluir documento:', error);
        toast.error('Erro ao excluir documento');
      }
    }
  };

  const handleExcluirDocumentoLicitacao = async (id, arquivoUrl, tipoDocumento) => {
    const isEdital = tipoDocumento?.nome?.toLowerCase().includes('edital');
    if (window.confirm(isEdital
      ? 'Tem certeza que deseja excluir este edital? Se este for o único edital da licitação, todos os requisitos extraídos dele também serão excluídos.'
      : 'Tem certeza que deseja excluir este documento?')) {
      try {
        // Excluir o documento (e possivelmente os requisitos se for o último edital)
        await documentoService.excluirDocumentoLicitacao(id, arquivoUrl, tipoDocumento);
        
        toast.success('Documento excluído com sucesso!');
        
        // Recarregar documentos e requisitos
        await Promise.all([
          carregarDocumentosLicitacao(licitacaoSelecionada),
          carregarRequisitosDocumentacao(licitacaoSelecionada)
        ]);
      } catch (error) {
        console.error('Erro ao excluir documento:', error);
        toast.error('Erro ao excluir documento');
      }
    }
  };

  const handleAtualizarRequisito = async (id, atendido) => {
    try {
      await documentoService.atualizarRequisito(id, { atendido });
      toast.success('Requisito atualizado com sucesso!');
      carregarRequisitosDocumentacao(licitacaoSelecionada);
    } catch (error) {
      console.error('Erro ao atualizar requisito:', error);
      toast.error('Erro ao atualizar requisito');
    }
  };

  const handleAdicionarRequisito = async () => {
    try {
      await documentoService.criarRequisito({
        ...novoRequisito,
        licitacao_id: licitacaoSelecionada
      });

      toast.success('Requisito adicionado com sucesso!');
      setOpenRequisitoDialog(false);
      setNovoRequisito({
        descricao: '',
        observacoes: '',
        atendido: false
      });
      carregarRequisitosDocumentacao(licitacaoSelecionada);
    } catch (error) {
      console.error('Erro ao adicionar requisito:', error);
      toast.error('Erro ao adicionar requisito');
    }
  };

  const handleEditarRequisito = async () => {
    try {
      await documentoService.atualizarRequisito(requisitoEmEdicao.id, {
        descricao: novoRequisito.descricao,
        observacoes: novoRequisito.observacoes,
        atendido: novoRequisito.atendido
      });

      toast.success('Requisito atualizado com sucesso!');
      setOpenRequisitoDialog(false);
      setRequisitoEmEdicao(null);
      setNovoRequisito({
        descricao: '',
        observacoes: '',
        atendido: false
      });
      carregarRequisitosDocumentacao(licitacaoSelecionada);
    } catch (error) {
      console.error('Erro ao atualizar requisito:', error);
      toast.error('Erro ao atualizar requisito');
    }
  };

  const handleExcluirRequisito = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este requisito?')) {
      try {
        await documentoService.excluirRequisito(id);
        toast.success('Requisito excluído com sucesso!');
        carregarRequisitosDocumentacao(licitacaoSelecionada);
      } catch (error) {
        console.error('Erro ao excluir requisito:', error);
        toast.error('Erro ao excluir requisito');
      }
    }
  };

  const limparUploadData = () => {
    setUploadData({
      arquivo: null,
      tipo_documento_id: '',
      data_validade: null,
      observacoes: '',
      nome: '',
      uploading: false
    });
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChangeDocumentosTab = (event, newValue) => {
    setDocumentosTabValue(newValue);
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Documentos
      </Typography>

      <Paper sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2,
            pt: 1,
            bgcolor: 'background.paper'
          }}
        >
          <Tab label="Documentos do Cliente" />
          <Tab label="Documentos da Licitação" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Selecionar Cliente
                    </Typography>

                    <TextField
                      fullWidth
                      label="Buscar Cliente"
                      value={filtroCliente}
                      onChange={(e) => setFiltroCliente(e.target.value)}
                      placeholder="Digite o nome ou CNPJ"
                      size="small"
                      sx={{ mb: 2 }}
                      InputProps={{
                        endAdornment: filtroCliente && (
                          <IconButton size="small" onClick={() => setFiltroCliente('')}>
                            <ClearIcon />
                          </IconButton>
                        )
                      }}
                    />

                    <List 
                      sx={{ 
                        maxHeight: 'calc(100vh - 400px)', 
                        overflow: 'auto',
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        p: 1
                      }}
                    >
                      {clientesFiltrados.map((cliente) => (
                        <ListItem
                          key={cliente.id}
                          button
                          selected={clienteSelecionado === cliente.id}
                          onClick={() => setClienteSelecionado(cliente.id)}
                          sx={{
                            borderRadius: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                              bgcolor: 'primary.light',
                              color: 'primary.contrastText',
                              '&:hover': {
                                bgcolor: 'primary.light',
                              },
                            },
                          }}
                        >
                          <ListItemText
                            primary={cliente.razao_social}
                            secondary={`CNPJ: ${cliente.cnpj}`}
                            primaryTypographyProps={{
                              variant: 'subtitle2',
                              fontWeight: clienteSelecionado === cliente.id ? 600 : 400
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                {clienteSelecionado ? (
                  <Card elevation={0} sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                  }}>
                    <CardContent>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 3 
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          Documentos
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => setOpenUploadCliente(true)}
                        >
                          Adicionar Documento
                        </Button>
                      </Box>

                      <Grid container spacing={2}>
                        {documentosCliente.map((documento) => (
                          <Grid item xs={12} sm={6} key={documento.id}>
                            <Card 
                              elevation={0}
                              sx={{ 
                                height: '100%',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                }
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    {documento.tipo_documento_nome}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleExcluirDocumentoCliente(documento.id, documento.arquivo_url)}
                                    sx={{ color: 'error.main' }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>

                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {documento.nome_arquivo}
                                </Typography>

                                {documento.data_validade && (
                                  <Box sx={{ mb: 2 }}>
                                    <Chip
                                      icon={
                                        new Date(documento.data_validade) > new Date() 
                                          ? <CheckCircleIcon /> 
                                          : <WarningIcon />
                                      }
                                      label={`Válido até ${new Date(documento.data_validade).toLocaleDateString()}`}
                                      color={
                                        new Date(documento.data_validade) > new Date() 
                                          ? "success" 
                                          : "error"
                                      }
                                      size="small"
                                    />
                                  </Box>
                                )}

                                {documento.observacoes && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    {documento.observacoes}
                                  </Typography>
                                )}

                                <Button
                                  variant="outlined"
                                  startIcon={<DescriptionIcon />}
                                  size="small"
                                  onClick={() => downloadDocumento(documento.id, 'cliente', documento.arquivo_url)}
                                  fullWidth
                                >
                                  Visualizar
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                ) : (
                  <Box 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      border: '1px dashed',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="subtitle1" color="text.secondary">
                      Selecione um cliente para visualizar seus documentos
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  height: '100%'
                }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Selecionar Licitação
                    </Typography>

                    <TextField
                      fullWidth
                      label="Buscar Licitação"
                      value={filtroLicitacao}
                      onChange={(e) => setFiltroLicitacao(e.target.value)}
                      placeholder="Digite o número, órgão ou objeto"
                      size="small"
                      sx={{ mb: 2 }}
                      InputProps={{
                        endAdornment: filtroLicitacao && (
                          <IconButton size="small" onClick={() => setFiltroLicitacao('')}>
                            <ClearIcon />
                          </IconButton>
                        )
                      }}
                    />

                    <List 
                      sx={{ 
                        maxHeight: 'calc(100vh - 400px)', 
                        overflow: 'auto',
                        bgcolor: 'background.default',
                        borderRadius: 1,
                        p: 1
                      }}
                    >
                      {licitacoesFiltradas.length > 0 ? (
                        licitacoesFiltradas.map((licitacao) => (
                          <ListItem
                            key={licitacao.id}
                            button
                            selected={licitacaoSelecionada === licitacao.id}
                            onClick={() => setLicitacaoSelecionada(licitacao.id)}
                            sx={{
                              borderRadius: 1,
                              mb: 0.5,
                              '&.Mui-selected': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                '&:hover': {
                                  bgcolor: 'primary.light',
                                },
                              },
                            }}
                          >
                            <ListItemText
                              primary={licitacao.numero}
                              secondary={`${licitacao.orgao} - ${licitacao.objeto}`}
                              primaryTypographyProps={{
                                variant: 'subtitle2',
                                fontWeight: licitacaoSelecionada === licitacao.id ? 600 : 400
                              }}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Box sx={{ 
                          p: 2, 
                          textAlign: 'center',
                          color: 'text.secondary'
                        }}>
                          <Typography variant="body2">
                            Não há licitações em andamento no momento.
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Somente licitações com status "Em Andamento" são exibidas aqui.
                          </Typography>
                        </Box>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                {licitacaoSelecionada ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs 
                          value={documentosTabValue} 
                          onChange={handleChangeDocumentosTab}
                          aria-label="documentos licitacao tabs"
                        >
                          <Tab label="Documentos" />
                          <Tab label="Requisitos" />
                        </Tabs>
                      </Box>

                      {documentosTabValue === 0 && (
                        <Card 
                          elevation={0}
                          sx={{ 
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2
                          }}
                        >
                        <CardContent>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 3 
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Documentos da Licitação
                            </Typography>
                                <Button
                                  variant="contained"
                                startIcon={<UploadIcon />}
                                  onClick={() => setOpenUploadLicitacao(true)}
                                  disabled={licitacoes.find(l => l.id === licitacaoSelecionada)?.status !== 'EM_ANDAMENTO'}
                                >
                                Upload de Documento
                                </Button>
                          </Box>

                          {licitacoes.find(l => l.id === licitacaoSelecionada)?.status !== 'EM_ANDAMENTO' && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Documentos só podem ser adicionados quando a licitação estiver Em Andamento
                            </Typography>
                          )}

                            {documentosLicitacao.length > 0 ? (
                              <List>
                            {documentosLicitacao.map((documento) => (
                                  <ListItem
                                    key={documento.id}
                                  sx={{ 
                                    border: '1px solid',
                                      borderColor: 'divider',
                                      borderRadius: 1,
                                      mb: 1,
                                      '&:last-child': { mb: 0 }
                                    }}
                                    secondaryAction={
                                      <IconButton
                                        edge="end"
                                        aria-label="excluir"
                                        onClick={() => handleExcluirDocumentoLicitacao(documento.id, documento.arquivo_url, documento.tipo_documento)}
                                        disabled={licitacoes.find(l => l.id === licitacaoSelecionada)?.status !== 'EM_ANDAMENTO'}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    }
                                  >
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <DescriptionIcon color="primary" />
                                          <Typography variant="subtitle1" component="span">
                                          {documento.nome}
                                        </Typography>
                                          {documento.tipo_documento?.nome && (
                                        <Chip
                                              label={documento.tipo_documento.nome}
                                              color="primary"
                                          size="small"
                                              sx={{ ml: 1 }}
                                        />
                                          )}
                                      </Box>
                                      }
                                      secondary={
                                        <Box sx={{ mt: 1 }}>
                                          <Typography variant="body2" color="text.secondary">
                                            Arquivo: {documento.nome_arquivo}
                                          </Typography>
                                    {documento.observacoes && (
                                            <Typography variant="body2" color="text.secondary">
                                              Observações: {documento.observacoes}
                                      </Typography>
                                    )}
                                    <Button
                                      variant="outlined"
                                      size="small"
                                            startIcon={<DescriptionIcon />}
                                            onClick={() => downloadDocumento(documento.id, 'licitacao', documento.arquivo_url)}
                                            sx={{ mt: 1 }}
                                    >
                                            Visualizar Documento
                                    </Button>
                                        </Box>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            ) : (
                              <Typography variant="body2" color="text.secondary" align="center">
                                Nenhum documento encontrado
                              </Typography>
                            )}
                        </CardContent>
                      </Card>
                      )}

                      {documentosTabValue === 1 && (
                      <Card 
                        elevation={0}
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2
                        }}
                      >
                        <CardContent>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            mb: 3 
                          }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Requisitos do Edital
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<AddIcon />}
                              onClick={abrirDialogoNovoRequisito}
                              disabled={licitacoes.find(l => l.id === licitacaoSelecionada)?.status !== 'EM_ANDAMENTO'}
                            >
                              Adicionar Requisito
                            </Button>
                          </Box>

                          {licitacoes.find(l => l.id === licitacaoSelecionada)?.status !== 'EM_ANDAMENTO' && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Requisitos só podem ser adicionados quando a licitação estiver Em Andamento
                            </Typography>
                          )}

                          {requisitosDocumentacao.length > 0 ? (
                              <List>
                              {requisitosDocumentacao.map((requisito) => (
                                <ListItem
                                  key={requisito.id}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                      borderRadius: 1,
                                      mb: 1,
                                      '&:last-child': { mb: 0 },
                                      bgcolor: requisito.atendido ? 'success.lighter' : 'background.paper',
                                      transition: 'background-color 0.3s ease',
                                      '&:hover': {
                                        bgcolor: requisito.atendido ? 'success.light' : 'action.hover'
                                      }
                                    }}
                                  >
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <Typography 
                                            variant="subtitle1" 
                                            component="span"
                                            sx={{
                                              color: requisito.atendido ? 'success.dark' : 'text.primary'
                                            }}
                                          >
                                            {requisito.descricao}
                                          </Typography>
                                          {requisito.atendido && (
                                            <Chip
                                              icon={<CheckCircleIcon />}
                                              label="Atendido"
                                              color="success"
                                              size="small"
                                            />
                                          )}
                                        </Box>
                                      }
                                      secondary={
                                        <Box sx={{ mt: 1 }}>
                                          {requisito.observacoes && (
                                            <Typography variant="body2" color="text.secondary">
                                              Observações: {requisito.observacoes}
                                            </Typography>
                                          )}
                                          {requisito.documento_nome && (
                                            <Typography variant="body2" color="text.secondary">
                                              Documento vinculado: {requisito.documento_nome}
                                            </Typography>
                                          )}
                                        </Box>
                                      }
                                    />
                                    <Box sx={{ display: 'flex', gap: 1, ml: 2, alignItems: 'center' }}>
                                      <Checkbox
                                        checked={requisito.atendido}
                                        onChange={(e) => handleAtualizarRequisito(requisito.id, e.target.checked)}
                                        disabled={licitacoes.find(l => l.id === licitacaoSelecionada)?.status !== 'EM_ANDAMENTO'}
                                        color="success"
                                      />
                                      <IconButton
                                        size="small"
                                        onClick={() => abrirDialogoEditarRequisito(requisito)}
                                        disabled={licitacoes.find(l => l.id === licitacaoSelecionada)?.status !== 'EM_ANDAMENTO'}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleExcluirRequisito(requisito.id)}
                                        disabled={licitacoes.find(l => l.id === licitacaoSelecionada)?.status !== 'EM_ANDAMENTO'}
                                        sx={{ color: 'error.main' }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                  </Box>
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography variant="body2" color="text.secondary" align="center">
                              Nenhum requisito encontrado. Faça o upload do edital para extrair os requisitos ou adicione manualmente.
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                      )}
                    </Grid>
                  </Grid>
                ) : (
                  <Box 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 3,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      border: '1px dashed',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="subtitle1" color="text.secondary">
                      Selecione uma licitação para visualizar seus documentos
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>
        </Box>
      </Paper>

      {/* Upload Dialogs */}
      <Dialog open={openUploadCliente} onClose={() => !uploadData.uploading && setOpenUploadCliente(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Documento do Cliente</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={uploadData.tipo_documento_id}
                onChange={(e) => setUploadData({ ...uploadData, tipo_documento_id: e.target.value })}
                label="Tipo de Documento"
              >
                {tiposDocumentos.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Data de Validade"
              value={uploadData.data_validade}
              onChange={(newValue) => setUploadData({ ...uploadData, data_validade: newValue })}
              slotProps={{ textField: { fullWidth: true } }}
            />

            <TextField
              label="Observações"
              multiline
              rows={3}
              value={uploadData.observacoes}
              onChange={(e) => setUploadData({ ...uploadData, observacoes: e.target.value })}
              fullWidth
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              disabled={uploadData.uploading}
            >
              Selecionar Arquivo
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const arquivo = e.target.files[0];
                  if (arquivo) {
                    setUploadData(prev => ({ 
                      ...prev, 
                      arquivo,
                      nome: arquivo.name 
                    }));
                  }
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
            </Button>
            {uploadData.arquivo && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Arquivo selecionado: {uploadData.arquivo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tamanho: {(uploadData.arquivo.size / (1024 * 1024)).toFixed(2)}MB
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadCliente(false)} disabled={uploadData.uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUploadDocumentoCliente}
            variant="contained"
            disabled={!uploadData.arquivo || !uploadData.tipo_documento_id || uploadData.uploading}
          >
            {uploadData.uploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openUploadLicitacao} onClose={() => !uploadData.uploading && setOpenUploadLicitacao(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Documento da Licitação</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nome do Documento"
              value={uploadData.nome}
              onChange={(e) => setUploadData({ ...uploadData, nome: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Tipo de Documento</InputLabel>
              <Select
                value={uploadData.tipo_documento_id}
                onChange={(e) => setUploadData({ ...uploadData, tipo_documento_id: e.target.value })}
                label="Tipo de Documento"
              >
                {tiposDocumentos.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Data de Validade"
              value={uploadData.data_validade}
              onChange={(newValue) => setUploadData({ ...uploadData, data_validade: newValue })}
              slotProps={{ textField: { fullWidth: true } }}
            />

            <TextField
              label="Observações"
              multiline
              rows={3}
              value={uploadData.observacoes}
              onChange={(e) => setUploadData({ ...uploadData, observacoes: e.target.value })}
              fullWidth
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              disabled={uploadData.uploading}
            >
              Selecionar Arquivo
              <input
                type="file"
                hidden
                onChange={(e) => {
                  const arquivo = e.target.files[0];
                  if (arquivo) {
                    setUploadData(prev => ({ 
                      ...prev, 
                      arquivo 
                    }));
                  }
                }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
            </Button>
            {uploadData.arquivo && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Arquivo selecionado: {uploadData.arquivo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tamanho: {(uploadData.arquivo.size / (1024 * 1024)).toFixed(2)}MB
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadLicitacao(false)} disabled={uploadData.uploading}>
            Cancelar
          </Button>
          <Button
            onClick={handleUploadDocumentoLicitacao}
            variant="contained"
            disabled={!uploadData.arquivo || !uploadData.tipo_documento_id || !uploadData.nome || uploadData.uploading}
          >
            {uploadData.uploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRequisitoDialog} onClose={() => setOpenRequisitoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          {requisitoEmEdicao ? 'Editar Requisito' : 'Adicionar Novo Requisito'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3 
          }}>
            <TextField
              label="Descrição"
              value={novoRequisito.descricao}
              onChange={(e) => setNovoRequisito({ ...novoRequisito, descricao: e.target.value })}
              fullWidth
              multiline
              rows={10}
              required
              error={!novoRequisito.descricao}
              helperText={!novoRequisito.descricao ? "A descrição é obrigatória" : ""}
            />
            <TextField
              label="Observações"
              multiline
              rows={3}
              value={novoRequisito.observacoes}
              onChange={(e) => setNovoRequisito({ ...novoRequisito, observacoes: e.target.value })}
              fullWidth
              placeholder="Adicione informações complementares sobre o requisito"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={novoRequisito.atendido}
                  onChange={(e) => setNovoRequisito({ ...novoRequisito, atendido: e.target.checked })}
                  color="success"
                />
              }
              label="Requisito Atendido"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenRequisitoDialog(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          {requisitoEmEdicao ? (
            <Button
              onClick={handleEditarRequisito}
              variant="contained"
              color="primary"
              disabled={!novoRequisito.descricao}
            >
              Atualizar
            </Button>
          ) : (
            <Button
              onClick={handleAdicionarRequisito}
              variant="contained"
              color="primary"
              disabled={!novoRequisito.descricao}
            >
              Adicionar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 