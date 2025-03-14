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
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { toast } from 'react-toastify';
import { clienteService, licitacaoService, documentoService } from '../../services/supabase';
import DocumentosRequisitos from '../../components/DocumentosRequisitos';

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
  const [licitacoesConcluidasFiltradas, setLicitacoesConcluidasFiltradas] = useState([]);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroLicitacao, setFiltroLicitacao] = useState('');
  const [filtroLicitacaoConcluida, setFiltroLicitacaoConcluida] = useState('');
  const [tiposDocumentos, setTiposDocumentos] = useState([]);
  const [documentosCliente, setDocumentosCliente] = useState([]);
  const [documentosLicitacao, setDocumentosLicitacao] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState('');
  const [openUploadCliente, setOpenUploadCliente] = useState(false);
  const [openUploadLicitacao, setOpenUploadLicitacao] = useState(false);
  const [uploadData, setUploadData] = useState({
    arquivo: null,
    tipo_documento_id: '',
    data_validade: null,
    observacoes: '',
    nome: '',
    uploading: false
  });
  const [licitacaoEmAndamentoSelecionada, setLicitacaoEmAndamentoSelecionada] = useState('');
  const [licitacaoConcluidaSelecionada, setLicitacaoConcluidaSelecionada] = useState('');

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
  }, [filtroLicitacao, filtroLicitacaoConcluida, licitacoes]);

  useEffect(() => {
    if (clienteSelecionado) {
      carregarDocumentosCliente(clienteSelecionado);
    }
  }, [clienteSelecionado]);

  useEffect(() => {
    // Usar o estado correto com base na aba atual
    const licitacaoId = tabValue === 1 ? licitacaoEmAndamentoSelecionada : 
                       tabValue === 2 ? licitacaoConcluidaSelecionada : null;
    
    console.log('Licitação selecionada mudou:', { 
      tabValue, 
      licitacaoId, 
      licitacaoEmAndamentoSelecionada, 
      licitacaoConcluidaSelecionada 
    });
    
    if (licitacaoId) {
      setLicitacaoSelecionada(licitacaoId);
      carregarDocumentosLicitacao(licitacaoId);
    } else {
      setLicitacaoSelecionada(null);
      setDocumentosLicitacao([]);
    }
  }, [licitacaoEmAndamentoSelecionada, licitacaoConcluidaSelecionada, tabValue]);

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
    // Limpar os documentos antes de carregar novos
    setDocumentosLicitacao([]);
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
    // Filtrar licitações em andamento
    const licitacoesEmAndamento = licitacoes.filter(licitacao => 
      licitacao.status === 'EM_ANDAMENTO'
    );

    if (!filtroLicitacao) {
      setLicitacoesFiltradas(licitacoesEmAndamento);
    } else {
      const filtro = filtroLicitacao.toLowerCase();
      const filtradas = licitacoesEmAndamento.filter(licitacao => 
        licitacao.numero.toLowerCase().includes(filtro) ||
        licitacao.orgao.toLowerCase().includes(filtro) ||
        licitacao.objeto.toLowerCase().includes(filtro)
      );
      setLicitacoesFiltradas(filtradas);
    }

    // Filtrar licitações concluídas
    const licitacoesConcluidas = licitacoes.filter(licitacao => 
      licitacao.status === 'CONCLUIDA'
    );

    if (!filtroLicitacaoConcluida) {
      setLicitacoesConcluidasFiltradas(licitacoesConcluidas);
    } else {
      const filtro = filtroLicitacaoConcluida.toLowerCase();
      const filtradas = licitacoesConcluidas.filter(licitacao => 
        licitacao.numero.toLowerCase().includes(filtro) ||
        licitacao.orgao.toLowerCase().includes(filtro) ||
        licitacao.objeto.toLowerCase().includes(filtro)
      );
      setLicitacoesConcluidasFiltradas(filtradas);
    }
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
      // Usar o estado correto com base na aba atual
      const licitacaoId = tabValue === 1 ? licitacaoEmAndamentoSelecionada : 
                         tabValue === 2 ? licitacaoConcluidaSelecionada : null;
      
      // Verificar se é um edital
      const tipoDocumento = tiposDocumentos.find(tipo => tipo.id === uploadData.tipo_documento_id);
      const isEdital = tipoDocumento?.nome.toLowerCase().includes('edital');
      
      // Fazer upload do documento
      const documento = await documentoService.uploadDocumentoLicitacao({
        arquivo: uploadData.arquivo,
        licitacaoId: licitacaoId,
        tipoDocumentoId: uploadData.tipo_documento_id,
        dataValidade: uploadData.data_validade,
        observacoes: uploadData.observacoes,
        nome: uploadData.nome
      });

      // Fechar o diálogo e limpar os dados
      setOpenUploadLicitacao(false);
      limparUploadData();
      
      // Mensagem de sucesso
      toast.success('Documento enviado com sucesso!');
      
      // Recarregar documentos
      if (licitacaoId) {
        await carregarDocumentosLicitacao(licitacaoId);
      }
      
      // Se for um edital, verificar se requisitos foram extraídos
      if (isEdital) {
        if (documento.requisitos_extraidos?.sucesso) {
          const quantidade = documento.requisitos_extraidos.quantidade;
          if (quantidade > 0) {
            toast.success(`${quantidade} requisitos extraídos com sucesso!`);
          } else {
            toast.info('Nenhum requisito específico foi encontrado no edital. Requisitos padrão foram criados.');
          }
          
          // Mudar para a aba de requisitos após um breve delay
          setTimeout(() => {
            // Mudar para a aba de requisitos
            setDocumentosTabValue(1);
            
            // Forçar uma atualização do componente DocumentosRequisitos
            if (tabValue === 1) {
              // Para licitações em andamento
              const currentId = licitacaoEmAndamentoSelecionada;
              setLicitacaoEmAndamentoSelecionada(null);
              
              // Pequeno delay para garantir que o estado seja atualizado
              setTimeout(() => {
                setLicitacaoEmAndamentoSelecionada(currentId);
                
                // Adicionar um timestamp ao key do componente para forçar remontagem
                const timestamp = Date.now();
                document.getElementById('requisitos-container-andamento')?.setAttribute('key', `andamento-${currentId}-${timestamp}`);
              }, 50);
            } else if (tabValue === 2) {
              // Para licitações concluídas
              const currentId = licitacaoConcluidaSelecionada;
              setLicitacaoConcluidaSelecionada(null);
              
              // Pequeno delay para garantir que o estado seja atualizado
              setTimeout(() => {
                setLicitacaoConcluidaSelecionada(currentId);
                
                // Adicionar um timestamp ao key do componente para forçar remontagem
                const timestamp = Date.now();
                document.getElementById('requisitos-container-concluida')?.setAttribute('key', `concluida-${currentId}-${timestamp}`);
              }, 50);
            }
          }, 500);
        } else if (documento.requisitos_extraidos?.erro) {
          toast.error(`Erro ao extrair requisitos: ${documento.requisitos_extraidos.erro}`);
        }
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
    // Usar o estado correto com base na aba atual
    const licitacaoId = tabValue === 1 ? licitacaoEmAndamentoSelecionada : 
                       tabValue === 2 ? licitacaoConcluidaSelecionada : null;
    
    // Verificar se a licitação está concluída
    const licitacao = licitacoes.find(l => l.id === licitacaoId);
    if (licitacao && licitacao.status === 'CONCLUIDA') {
      toast.error('Não é possível excluir documentos de licitações concluídas');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir este documento?`)) {
      try {
        await documentoService.excluirDocumentoLicitacao(id, arquivoUrl, tipoDocumento);
        setDocumentosLicitacao(prev => prev.filter(doc => doc.id !== id));
        toast.success('Documento excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir documento:', error);
        toast.error('Erro ao excluir documento');
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
    console.log('Mudando para a aba:', newValue);
    
    // Limpar completamente o estado ao trocar de aba
    setTabValue(newValue);
    setClienteSelecionado(null);
    
    // Limpar os estados específicos de cada aba
    if (newValue !== 1) {
      setLicitacaoEmAndamentoSelecionada(null);
    }
    if (newValue !== 2) {
      setLicitacaoConcluidaSelecionada(null);
    }
    
    // Limpar os documentos
    setDocumentosCliente([]);
    setDocumentosLicitacao([]);
    
    // Resetar também a aba de documentos/requisitos
    setDocumentosTabValue(0);
  };

  const handleDocumentosTabChange = (event, newValue) => {
    console.log('Mudando para a aba de documentos:', newValue);
    
    // Identificar a licitação selecionada atual
    const licitacaoId = tabValue === 1 ? licitacaoEmAndamentoSelecionada : 
                       tabValue === 2 ? licitacaoConcluidaSelecionada : null;
    
    console.log('Licitação atual ao mudar aba:', licitacaoId);
    
    if (newValue === 0 && licitacaoId) {
      // Se estiver indo para a aba de documentos, recarregar os documentos
      console.log('Recarregando documentos para licitação:', licitacaoId);
      carregarDocumentosLicitacao(licitacaoId);
    } else if (newValue === 1 && licitacaoId) {
      // Se estiver indo para a aba de requisitos, forçar uma atualização do componente
      console.log('Mudando para a aba de requisitos para licitação:', licitacaoId);
      
      // Forçar uma atualização do componente DocumentosRequisitos
      if (tabValue === 1) {
        // Para licitações em andamento
        const currentId = licitacaoEmAndamentoSelecionada;
        setLicitacaoEmAndamentoSelecionada(null);
        
        // Pequeno delay para garantir que o estado seja atualizado
        setTimeout(() => {
          setLicitacaoEmAndamentoSelecionada(currentId);
          
          // Adicionar um timestamp ao key do componente para forçar remontagem
          const timestamp = Date.now();
          document.getElementById('requisitos-container-andamento')?.setAttribute('key', `andamento-${currentId}-${timestamp}`);
        }, 50);
      } else if (tabValue === 2) {
        // Para licitações concluídas
        const currentId = licitacaoConcluidaSelecionada;
        setLicitacaoConcluidaSelecionada(null);
        
        // Pequeno delay para garantir que o estado seja atualizado
        setTimeout(() => {
          setLicitacaoConcluidaSelecionada(currentId);
          
          // Adicionar um timestamp ao key do componente para forçar remontagem
          const timestamp = Date.now();
          document.getElementById('requisitos-container-concluida')?.setAttribute('key', `concluida-${currentId}-${timestamp}`);
        }, 50);
      }
    }
    
    // Atualizar o valor da aba
    setDocumentosTabValue(newValue);
  };

  const handleLicitacaoClick = (licitacaoId) => {
    console.log('Licitação em andamento clicada:', licitacaoId);
    
    // Se clicar na mesma licitação, desseleciona
    if (licitacaoId === licitacaoEmAndamentoSelecionada) {
      setLicitacaoEmAndamentoSelecionada(null);
    } else {
      setLicitacaoEmAndamentoSelecionada(licitacaoId);
    }
    
    // Resetar a aba para documentos
    setDocumentosTabValue(0);
  };

  const handleLicitacaoConcluidaClick = (licitacaoId) => {
    console.log('Licitação concluída clicada:', licitacaoId);
    
    // Se clicar na mesma licitação, desseleciona
    if (licitacaoId === licitacaoConcluidaSelecionada) {
      setLicitacaoConcluidaSelecionada(null);
    } else {
      setLicitacaoConcluidaSelecionada(licitacaoId);
    }
    
    // Resetar a aba para documentos
    setDocumentosTabValue(0);
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
          <Tab label="Licitações Concluídas" />
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
                            selected={licitacaoEmAndamentoSelecionada === licitacao.id}
                            onClick={() => handleLicitacaoClick(licitacao.id)}
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
                                fontWeight: licitacaoEmAndamentoSelecionada === licitacao.id ? 600 : 400
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
                {licitacaoEmAndamentoSelecionada ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs 
                          value={documentosTabValue} 
                          onChange={handleDocumentosTabChange}
                          variant="fullWidth"
                        >
                          <Tab label="Documentos" />
                          <Tab label="Requisitos" />
                        </Tabs>
                      </Box>

                      {documentosTabValue === 0 && (
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
                              {tabValue === 1 && (
                                <Button
                                  variant="contained"
                                  startIcon={<AddIcon />}
                                  onClick={() => setOpenUploadLicitacao(true)}
                                >
                                  Adicionar Documento
                                </Button>
                              )}
                            </Box>

                            {documentosLicitacao.length > 0 ? (
                              <List>
                                {documentosLicitacao.map((documento) => (
                                  <ListItem
                                    key={documento.id}
                                    divider
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      py: 2
                                    }}
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
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<DescriptionIcon />}
                                        onClick={() => downloadDocumento(documento.id, 'licitacao', documento.arquivo_url)}
                                      >
                                        Visualizar Documento
                                      </Button>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleExcluirDocumentoLicitacao(documento.id, documento.arquivo_url, documento.tipo_documento)}
                                      >
                                        Excluir
                                      </Button>
                                    </Box>
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
                        <Box sx={{ position: 'relative', width: '100%', minHeight: '400px' }}>
                          {licitacaoEmAndamentoSelecionada && (
                            <Box id="requisitos-container-andamento">
                              <DocumentosRequisitos 
                                licitacaoId={licitacaoEmAndamentoSelecionada} 
                                licitacaoStatus={licitacoes.find(l => l.id === licitacaoEmAndamentoSelecionada)?.status || 'EM_ANDAMENTO'}
                                key={`andamento-${licitacaoEmAndamentoSelecionada}-${Date.now()}`}
                              />
                            </Box>
                          )}
                          {!licitacaoEmAndamentoSelecionada && (
                            <Alert severity="info" sx={{ m: 2 }}>
                              Selecione uma licitação para visualizar os requisitos.
                            </Alert>
                          )}
                        </Box>
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

          <TabPanel value={tabValue} index={2}>
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
                      Selecionar Licitação Concluída
                    </Typography>

                    <TextField
                      fullWidth
                      label="Buscar Licitação"
                      value={filtroLicitacaoConcluida}
                      onChange={(e) => setFiltroLicitacaoConcluida(e.target.value)}
                      placeholder="Digite o número, órgão ou objeto"
                      size="small"
                      sx={{ mb: 2 }}
                      InputProps={{
                        endAdornment: filtroLicitacaoConcluida && (
                          <IconButton size="small" onClick={() => setFiltroLicitacaoConcluida('')}>
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
                      {licitacoesConcluidasFiltradas.length > 0 ? (
                        licitacoesConcluidasFiltradas.map((licitacao) => (
                          <ListItem
                            key={licitacao.id}
                            button
                            selected={licitacaoConcluidaSelecionada === licitacao.id}
                            onClick={() => handleLicitacaoConcluidaClick(licitacao.id)}
                            sx={{
                              borderRadius: 1,
                              mb: 0.5,
                              '&.Mui-selected': {
                                bgcolor: 'primary.light',
                                color: 'primary.contrastText',
                                '&:hover': {
                                  bgcolor: 'primary.main',
                                },
                              },
                            }}
                          >
                            <ListItemText
                              primary={licitacao.numero}
                              secondary={`${licitacao.orgao} - ${licitacao.objeto}`}
                              primaryTypographyProps={{
                                variant: 'subtitle2',
                                fontWeight: licitacaoConcluidaSelecionada === licitacao.id ? 600 : 400
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
                            Não há licitações concluídas no momento.
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Somente licitações com status "Concluída" são exibidas aqui.
                          </Typography>
                        </Box>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                {licitacaoConcluidaSelecionada ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs 
                          value={documentosTabValue} 
                          onChange={handleDocumentosTabChange}
                          variant="fullWidth"
                        >
                          <Tab label="Documentos" />
                          <Tab label="Requisitos" />
                        </Tabs>
                      </Box>

                      {documentosTabValue === 0 && (
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
                            </Box>

                            {documentosLicitacao.length > 0 ? (
                              <List>
                                {documentosLicitacao.map((documento) => (
                                  <ListItem
                                    key={documento.id}
                                    divider
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      py: 2
                                    }}
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
                                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<DescriptionIcon />}
                                        onClick={() => downloadDocumento(documento.id, 'licitacao', documento.arquivo_url)}
                                      >
                                        Visualizar Documento
                                      </Button>
                                    </Box>
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
                        <Box sx={{ position: 'relative', width: '100%', minHeight: '400px' }}>
                          {licitacaoConcluidaSelecionada && (
                            <Box id="requisitos-container-concluida">
                              <DocumentosRequisitos 
                                licitacaoId={licitacaoConcluidaSelecionada} 
                                licitacaoStatus="CONCLUIDA"
                                key={`concluida-${licitacaoConcluidaSelecionada}-${Date.now()}`}
                              />
                            </Box>
                          )}
                          {!licitacaoConcluidaSelecionada && (
                            <Alert severity="info" sx={{ m: 2 }}>
                              Selecione uma licitação para visualizar os requisitos.
                            </Alert>
                          )}
                        </Box>
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
                      Selecione uma licitação concluída para visualizar seus documentos
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
    </Box>
  );
} 