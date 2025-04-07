import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  InputAdornment,
  Tooltip,
  Divider,
  Alert,
  Skeleton,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { NumericFormat } from 'react-number-format';
import { licitacaoService } from '../../services/supabase';
import { formatCurrency, formatDate } from '../../utils/format';

// Funções de manipulação de valores monetários
const formatarValorMonetario = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '';
  
  // Remove tudo exceto números
  let valorLimpo = valor.toString().replace(/[^\d]/g, '');
  
  // Se não houver valor, retorna vazio
  if (!valorLimpo) return '';
  
  // Retorna apenas os números
  return valorLimpo;
};

const converterParaNumero = (valor) => {
  if (!valor) return null;
  
  // Remove tudo exceto números
  const valorLimpo = valor.toString().replace(/[^\d]/g, '');
  
  // Se não há valor após a limpeza, retorna null
  if (!valorLimpo) return null;
  
  // Converte para número inteiro
  const valorNumerico = parseInt(valorLimpo, 10);
  
  return isNaN(valorNumerico) ? null : valorNumerico;
};

const validarValorMonetario = (valor) => {
  if (!valor) return false;
  
  const numero = converterParaNumero(valor);
  return numero !== null && numero >= 0;
};

// Função para formatar número para exibição
const formatarNumeroParaExibicao = (numero) => {
  if (numero === null || numero === undefined) return '';
  
  // Converte para número inteiro e depois para string
  return Math.floor(Number(numero)).toString();
};

// Função para calcular variação percentual
const calcularVariacao = (valorFinal, valorEstimado) => {
  if (!valorFinal || !valorEstimado) return 0;
  return ((valorFinal - valorEstimado) / valorEstimado) * 100;
};

export default function Fechamento() {
  const [licitacoes, setLicitacoes] = useState([]);
  const [licitacoesFiltradas, setLicitacoesFiltradas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dadosFechamento, setDadosFechamento] = useState({
    valor_final: '',
    lucro_final: '',
    foi_ganha: null,
    motivo_perda: '',
    observacoes: '',
    data_fechamento: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [calcularAutomaticamente, setCalcularAutomaticamente] = useState(true);

  useEffect(() => {
    carregarLicitacoes();
  }, []);

  useEffect(() => {
    filtrarLicitacoes();
  }, [filtro, licitacoes]);

  const carregarLicitacoes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await licitacaoService.listarLicitacoes();
      setLicitacoes(data);
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
      setError('Erro ao carregar licitações: ' + (error.message || ''));
      toast.error('Erro ao carregar licitações');
    } finally {
      setLoading(false);
    }
  };

  const filtrarLicitacoes = () => {
    if (!filtro) {
      setLicitacoesFiltradas(licitacoes.filter(l => l.status === 'EM_ANDAMENTO'));
      return;
    }
    const filtroLower = filtro.toLowerCase();
    const filtradas = licitacoes.filter(licitacao => 
      (licitacao.status === 'EM_ANDAMENTO') && (
        licitacao.numero.toLowerCase().includes(filtroLower) ||
        licitacao.orgao.toLowerCase().includes(filtroLower) ||
        licitacao.objeto.toLowerCase().includes(filtroLower)
      )
    );
    setLicitacoesFiltradas(filtradas);
  };

  const handleFecharLicitacao = async () => {
    setLoading(true);
    setError(null);
    try {
      // Converte os valores para números
      const valorFinal = converterParaNumero(dadosFechamento.valor_final);
      const lucroFinal = converterParaNumero(dadosFechamento.lucro_final);

      if (valorFinal === null || lucroFinal === null) {
        throw new Error('Por favor, insira valores válidos');
      }

      if (dadosFechamento.foi_ganha === null) {
        throw new Error('Por favor, selecione se a licitação foi ganha ou perdida');
      }

      if (!dadosFechamento.foi_ganha && !dadosFechamento.motivo_perda?.trim()) {
        throw new Error('Por favor, informe o motivo da perda');
      }

      // Validar se o lucro não é maior que o valor final
      if (lucroFinal > valorFinal) {
        throw new Error('O lucro não pode ser maior que o valor final');
      }

      const dadosParaEnviar = {
        valor_final: valorFinal,
        lucro_final: lucroFinal,
        foi_ganha: dadosFechamento.foi_ganha,
        motivo_perda: dadosFechamento.foi_ganha ? null : dadosFechamento.motivo_perda.trim(),
        observacoes: dadosFechamento.observacoes?.trim() || null,
        status: 'CONCLUIDA',
        data_fechamento: dadosFechamento.data_fechamento
      };

      const licitacaoAtualizada = await licitacaoService.atualizarLicitacao(
        licitacaoSelecionada.id,
        dadosParaEnviar
      );

      const novaLista = licitacoes.map(licitacao => 
        licitacao.id === licitacaoSelecionada.id ? licitacaoAtualizada : licitacao
      );

      setLicitacoes(novaLista);
      setLicitacoesFiltradas(novaLista.filter(l => l.status === 'EM_ANDAMENTO'));
      setOpenDialog(false);
      setDadosFechamento({
        valor_final: '',
        lucro_final: '',
        foi_ganha: null,
        motivo_perda: '',
        observacoes: '',
        data_fechamento: new Date().toISOString().split('T')[0]
      });
      toast.success('Licitação fechada com sucesso!');
    } catch (error) {
      console.error('Erro ao fechar licitação:', error);
      setError('Erro ao fechar licitação: ' + (error.message || ''));
      toast.error('Erro ao fechar licitação');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirDialog = (licitacao) => {
    setLicitacaoSelecionada(licitacao);
    
    // Inicializa com valores vazios
    setDadosFechamento({
      valor_final: '',
      lucro_final: '',
      foi_ganha: null,
      motivo_perda: '',
      observacoes: '',
      data_fechamento: new Date().toISOString().split('T')[0]
    });
    
    // Se tiver valores estimados, formata para exibição
    if (licitacao.valor_estimado !== null && licitacao.valor_estimado !== undefined) {
      setDadosFechamento(prev => ({
        ...prev,
        valor_final: licitacao.valor_estimado
      }));
    }
    
    if (licitacao.lucro_estimado !== null && licitacao.lucro_estimado !== undefined) {
      setDadosFechamento(prev => ({
        ...prev,
        lucro_final: licitacao.lucro_estimado
      }));
    }
    
    setOpenDialog(true);
  };

  // Função para calcular lucro automaticamente
  const calcularLucro = (valorFinal) => {
    if (!licitacaoSelecionada || !calcularAutomaticamente) return;

    // Se não temos valor estimado ou lucro estimado, não podemos calcular
    if (licitacaoSelecionada.valor_estimado === null || 
        licitacaoSelecionada.valor_estimado === undefined || 
        licitacaoSelecionada.lucro_estimado === null || 
        licitacaoSelecionada.lucro_estimado === undefined) {
      return;
    }

    // Calcula a porcentagem de lucro estimado
    const percentualLucro = licitacaoSelecionada.lucro_estimado / licitacaoSelecionada.valor_estimado;
    
    // Aplica a mesma porcentagem ao valor final
    const novoLucro = Math.round(valorFinal * percentualLucro);
    
    setDadosFechamento(prev => ({
      ...prev,
      lucro_final: novoLucro
    }));
  };

  // Renderização de skeletons durante carregamento
  const renderSkeletons = () => (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} key={item}>
            <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 1 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Fechamento de Licitações
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Licitações em Andamento
                </Typography>
                <Tooltip title="Atualizar lista">
                  <IconButton 
                    size="small" 
                    onClick={carregarLicitacoes}
                    disabled={loading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <TextField
                fullWidth
                label="Buscar Licitação"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Digite o número, órgão ou objeto"
                size="small"
                sx={{ mb: 2 }}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filtro && (
                    <IconButton size="small" onClick={() => setFiltro('')} disabled={loading}>
                      <ClearIcon />
                    </IconButton>
                  )
                }}
              />

              {loading ? (
                renderSkeletons()
              ) : licitacoesFiltradas.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 3,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}>
                  <Typography variant="body1" color="text.secondary" align="center" gutterBottom>
                    Nenhuma licitação em andamento encontrada
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<RefreshIcon />} 
                    onClick={carregarLicitacoes}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    Atualizar
                  </Button>
                </Box>
              ) : (
                <List sx={{ 
                  maxHeight: 'calc(100vh - 250px)',
                  overflow: 'auto',
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  p: 1
                }}>
                  {licitacoesFiltradas.map((licitacao) => (
                    <ListItem
                      key={licitacao.id}
                      button
                      onClick={() => handleAbrirDialog(licitacao)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {licitacao.numero}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="Data de Abertura">
                                <Chip
                                  icon={<CalendarIcon />}
                                  label={formatDate(licitacao.data_abertura)}
                                  size="small"
                                  color="default"
                                />
                              </Tooltip>
                              <Tooltip title="Valor Estimado">
                                <Chip
                                  icon={<MoneyIcon />}
                                  label={formatCurrency(licitacao.valor_estimado)}
                                  size="small"
                                  color="primary"
                                />
                              </Tooltip>
                            </Box>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {licitacao.orgao}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {licitacao.objeto}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            height: '100%'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Licitações Finalizadas
                </Typography>
                <Tooltip title="Atualizar lista">
                  <IconButton 
                    size="small" 
                    onClick={carregarLicitacoes}
                    disabled={loading}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {loading ? (
                renderSkeletons()
              ) : licitacoes.filter(l => l.status === 'CONCLUIDA').length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  p: 3,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}>
                  <Typography variant="body1" color="text.secondary" align="center">
                    Nenhuma licitação finalizada encontrada
                  </Typography>
                </Box>
              ) : (
                <List sx={{ 
                  maxHeight: 'calc(100vh - 250px)',
                  overflow: 'auto'
                }}>
                  {licitacoes
                    .filter(l => l.status === 'CONCLUIDA')
                    .sort((a, b) => new Date(b.data_fechamento) - new Date(a.data_fechamento))
                    .map((licitacao) => (
                      <ListItem
                        key={licitacao.id}
                        sx={{
                          borderRadius: 1,
                          mb: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: licitacao.foi_ganha ? 'success.lighter' : 'error.lighter'
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {licitacao.numero}
                                </Typography>
                                <Tooltip title="Data de Fechamento">
                                  <Chip
                                    icon={<CalendarIcon />}
                                    label={formatDate(licitacao.data_fechamento)}
                                    size="small"
                                    variant="outlined"
                                  />
                                </Tooltip>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {licitacao.foi_ganha ? (
                                  <Tooltip title="Licitação Ganha">
                                    <Chip
                                      icon={<CheckCircleIcon />}
                                      label="Ganha"
                                      color="success"
                                      size="small"
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Licitação Perdida">
                                    <Chip
                                      icon={<CancelIcon />}
                                      label="Perdida"
                                      color="error"
                                      size="small"
                                    />
                                  </Tooltip>
                                )}
                                <Tooltip title={`Valor Final: ${formatCurrency(licitacao.valor_final)}\nLucro Final: ${formatCurrency(licitacao.lucro_final)}`}>
                                  <Chip
                                    icon={<MoneyIcon />}
                                    label={formatCurrency(licitacao.valor_final)}
                                    size="small"
                                    color={licitacao.foi_ganha ? "success" : "error"}
                                  />
                                </Tooltip>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography variant="body2">
                                {licitacao.orgao}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {licitacao.objeto}
                              </Typography>
                              {!licitacao.foi_ganha && licitacao.motivo_perda && (
                                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                  Motivo: {licitacao.motivo_perda}
                                </Typography>
                              )}
                              {licitacao.observacoes && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  <InfoIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                  {licitacao.observacoes}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog 
        open={openDialog} 
        onClose={() => !loading && setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Fechar Licitação
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              type="date"
              label="Data de Fechamento"
              value={dadosFechamento.data_fechamento}
              onChange={(e) => setDadosFechamento(prev => ({ ...prev, data_fechamento: e.target.value }))}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={loading}
            />

            <NumericFormat
              customInput={TextField}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={dadosFechamento.valor_final}
              onValueChange={(values) => {
                const novoValor = values.floatValue || 0;
                setDadosFechamento(prev => ({
                  ...prev,
                  valor_final: novoValor
                }));
                calcularLucro(novoValor);
              }}
              label="Valor Final"
              fullWidth
              required
              disabled={loading}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={calcularAutomaticamente}
                    onChange={(e) => setCalcularAutomaticamente(e.target.checked)}
                    disabled={loading}
                  />
                }
                label="Calcular lucro automaticamente"
              />
            </Box>

            <NumericFormat
              customInput={TextField}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              value={dadosFechamento.lucro_final}
              onValueChange={(values) => {
                setDadosFechamento(prev => ({
                  ...prev,
                  lucro_final: values.floatValue || 0
                }));
              }}
              label="Lucro Final"
              fullWidth
              required
              disabled={loading || calcularAutomaticamente}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />

            <FormControl fullWidth disabled={loading}>
              <InputLabel>Resultado</InputLabel>
              <Select
                value={dadosFechamento.foi_ganha}
                onChange={(e) => setDadosFechamento(prev => ({ 
                  ...prev, 
                  foi_ganha: e.target.value === 'true',
                  motivo_perda: e.target.value === 'true' ? '' : prev.motivo_perda 
                }))}
                label="Resultado"
              >
                <MenuItem value="true">Ganha</MenuItem>
                <MenuItem value="false">Perdida</MenuItem>
              </Select>
            </FormControl>

            {dadosFechamento.foi_ganha === false && (
              <TextField
                label="Motivo da Perda"
                multiline
                rows={3}
                value={dadosFechamento.motivo_perda}
                onChange={(e) => setDadosFechamento(prev => ({ ...prev, motivo_perda: e.target.value }))}
                fullWidth
                disabled={loading}
              />
            )}

            <TextField
              label="Observações"
              multiline
              rows={2}
              value={dadosFechamento.observacoes}
              onChange={(e) => setDadosFechamento(prev => ({ ...prev, observacoes: e.target.value }))}
              fullWidth
              helperText="Informações adicionais sobre o fechamento"
              disabled={loading}
            />

            {licitacaoSelecionada && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Valores Estimados
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Valor: {formatCurrency(licitacaoSelecionada.valor_estimado)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Lucro: {formatCurrency(licitacaoSelecionada.lucro_estimado)}
                      </Typography>
                    </Grid>
                  </Grid>
                  {dadosFechamento.valor_final && licitacaoSelecionada.valor_estimado && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Variação: {calcularVariacao(
                        dadosFechamento.valor_final,
                        licitacaoSelecionada.valor_estimado
                      ).toFixed(2)}%
                    </Typography>
                  )}
                </Alert>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleFecharLicitacao}
            variant="contained"
            disabled={
              loading ||
              !dadosFechamento.valor_final || 
              !dadosFechamento.lucro_final || 
              dadosFechamento.foi_ganha === null || 
              (dadosFechamento.foi_ganha === false && !dadosFechamento.motivo_perda) ||
              !dadosFechamento.data_fechamento
            }
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            Fechar Licitação
          </Button>
        </DialogActions>
      </Dialog>

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