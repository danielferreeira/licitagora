import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { clienteService, licitacaoService } from '../../services/supabase';

export default function Relatorios() {
  const [clientes, setClientes] = useState([]);
  const [filtros, setFiltros] = useState({
    dataInicio: null,
    dataFim: null,
    status: '',
    cliente_id: '',
    periodo: 'mensal'
  });
  const [relatorioLicitacoes, setRelatorioLicitacoes] = useState(null);
  const [relatorioClientes, setRelatorioClientes] = useState(null);
  const [relatorioDesempenho, setRelatorioDesempenho] = useState(null);
  const [loading, setLoading] = useState({
    licitacoes: false,
    clientes: false,
    desempenho: false
  });

  useEffect(() => {
    carregarClientes();
    gerarRelatorios();
  }, []);

  const carregarClientes = async () => {
    try {
      const data = await clienteService.listarClientes();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const formatarMoeda = (valor) => {
    if (!valor || isNaN(valor)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const gerarRelatorios = async () => {
    try {
      await Promise.all([
        gerarRelatorioLicitacoes(),
        gerarRelatorioClientes(),
        gerarRelatorioDesempenho()
      ]);
    } catch (error) {
      console.error('Erro ao gerar relatórios:', error);
    }
  };

  const validarDados = (dados) => {
    if (!dados) return false;
    if (Array.isArray(dados)) return dados.length > 0;
    if (typeof dados === 'object') return Object.keys(dados).length > 0;
    return true;
  };

  const renderizarConteudo = (dados, componente, mensagemVazia = 'Nenhum dado disponível') => {
    if (!validarDados(dados)) {
      return (
        <Typography color="text.secondary">
          {mensagemVazia}
        </Typography>
      );
    }
    return componente;
  };

  const gerarChaveUnica = (prefixo, id, sufixo = '') => {
    const timestamp = new Date().getTime();
    return `${prefixo}-${id}-${timestamp}${sufixo ? `-${sufixo}` : ''}`;
  };

  const gerarRelatorioLicitacoes = async () => {
    setLoading(prev => ({ ...prev, licitacoes: true }));
    try {
      let query = licitacaoService.listarLicitacoes();

      // Aplicar filtros
      if (filtros.dataInicio) {
        query = query.gte('data_abertura', filtros.dataInicio.toISOString());
      }
      if (filtros.dataFim) {
        query = query.lte('data_fim', filtros.dataFim.toISOString());
      }
      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }
      if (filtros.cliente_id) {
        query = query.eq('cliente_id', filtros.cliente_id);
      }

      const licitacoes = await query;

      // Calcular estatísticas
      const totalLicitacoes = licitacoes.length;
      const licitacoesGanhas = licitacoes.filter(l => l.status === 'FINALIZADA' && l.foi_ganha).length;
      const valorTotalGanho = licitacoes
        .filter(l => l.status === 'FINALIZADA' && l.foi_ganha)
        .reduce((total, l) => total + (Number(l.valor_final) || 0), 0);
      const lucroTotal = licitacoes
        .filter(l => l.status === 'FINALIZADA' && l.foi_ganha)
        .reduce((total, l) => total + (Number(l.lucro_final) || 0), 0);

      setRelatorioLicitacoes({
        totalLicitacoes,
        licitacoesGanhas,
        valorTotalGanho,
        lucroTotal,
        detalhes: licitacoes.map(licitacao => ({
          ...licitacao,
          valor_estimado: Number(licitacao.valor_estimado) || 0,
          valor_final: Number(licitacao.valor_final) || 0,
          lucro_estimado: Number(licitacao.lucro_estimado) || 0,
          lucro_final: Number(licitacao.lucro_final) || 0,
          foi_ganha: Boolean(licitacao.foi_ganha),
          cliente: licitacao.cliente || null
        }))
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de licitações:', error);
      toast.error('Erro ao gerar relatório de licitações');
      setRelatorioLicitacoes(null);
    } finally {
      setLoading(prev => ({ ...prev, licitacoes: false }));
    }
  };

  const gerarRelatorioClientes = async () => {
    setLoading(prev => ({ ...prev, clientes: true }));
    try {
      // Buscar clientes e licitações
      const [clientesData, licitacoesData] = await Promise.all([
        clienteService.listarClientes(),
        licitacaoService.listarLicitacoes()
      ]);

      // Processar dados por cliente
      const detalhesClientes = clientesData.map(cliente => {
        const licitacoesCliente = licitacoesData.filter(l => l.cliente_id === cliente.id);
        const licitacoesGanhas = licitacoesCliente.filter(l => l.status === 'FINALIZADA' && l.foi_ganha);
        const licitacoesEmAndamento = licitacoesCliente.filter(l => l.status === 'EM_ANDAMENTO');
        const valorTotalGanho = licitacoesGanhas.reduce((total, l) => total + (Number(l.valor_final) || 0), 0);
        const lucroTotal = licitacoesGanhas.reduce((total, l) => total + (Number(l.lucro_final) || 0), 0);

        return {
          ...cliente,
          totalLicitacoes: licitacoesCliente.length,
          licitacoesGanhas: licitacoesGanhas.length,
          licitacoesEmAndamento: licitacoesEmAndamento.length,
          valorTotalGanho,
          lucroTotal
        };
      });

      setRelatorioClientes({
        totalClientes: clientesData.length,
        detalhes: detalhesClientes
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de clientes:', error);
      toast.error('Erro ao gerar relatório de clientes');
      setRelatorioClientes(null);
    } finally {
      setLoading(prev => ({ ...prev, clientes: false }));
    }
  };

  const gerarRelatorioDesempenho = async () => {
    setLoading(prev => ({ ...prev, desempenho: true }));
    try {
      const licitacoes = await licitacaoService.listarLicitacoes();
      const licitacoesFinalizadas = licitacoes.filter(l => l.status === 'FINALIZADA');
      const licitacoesGanhas = licitacoesFinalizadas.filter(l => l.foi_ganha);

      // Calcular estatísticas
      const taxaSucesso = licitacoesFinalizadas.length > 0
        ? (licitacoesGanhas.length / licitacoesFinalizadas.length) * 100
        : 0;

      const valorTotalGanho = licitacoesGanhas.reduce((total, l) => total + (Number(l.valor_final) || 0), 0);
      const lucroTotal = licitacoesGanhas.reduce((total, l) => total + (Number(l.lucro_final) || 0), 0);

      // Calcular média de prazo de fechamento
      const prazos = licitacoesFinalizadas
        .filter(l => l.data_fechamento && l.data_abertura)
        .map(l => {
          const inicio = new Date(l.data_abertura);
          const fim = new Date(l.data_fechamento);
          return Math.ceil((fim - inicio) / (1000 * 60 * 60 * 24)); // Dias
        });

      const mediaPrazoFechamento = prazos.length > 0
        ? prazos.reduce((a, b) => a + b, 0) / prazos.length
        : 0;

      // Calcular principais motivos de perda
      const motivosPerda = licitacoesFinalizadas
        .filter(l => !l.foi_ganha && l.motivo_perda)
        .reduce((acc, l) => {
          acc[l.motivo_perda] = (acc[l.motivo_perda] || 0) + 1;
          return acc;
        }, {});

      setRelatorioDesempenho({
        periodo: filtros.periodo,
        taxaSucesso,
        valorTotalGanho,
        lucroTotal,
        mediaPrazoFechamento,
        principaisMotivosPerda: motivosPerda
      });
    } catch (error) {
      console.error('Erro ao gerar relatório de desempenho:', error);
      toast.error('Erro ao gerar relatório de desempenho');
      setRelatorioDesempenho(null);
    } finally {
      setLoading(prev => ({ ...prev, desempenho: false }));
    }
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const aplicarFiltros = () => {
    gerarRelatorios();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2
        }}
      >
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontWeight: 'bold',
            color: 'primary.main'
          }}
        >
          Relatórios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AssessmentIcon />}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            py: 1,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: 4
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Gerar Relatório
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Filtros
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Data Início"
              value={filtros.dataInicio}
              onChange={(newValue) => handleFiltroChange('dataInicio', newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <DatePicker
              label="Data Fim"
              value={filtros.dataFim}
              onChange={(newValue) => handleFiltroChange('dataFim', newValue)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filtros.status}
                label="Status"
                onChange={(e) => handleFiltroChange('status', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Em Análise">Em Análise</MenuItem>
                <MenuItem value="Em Andamento">Em Andamento</MenuItem>
                <MenuItem value="Finalizada">Finalizada</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={filtros.cliente_id}
                label="Cliente"
                onChange={(e) => handleFiltroChange('cliente_id', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {clientes.map((cliente) => (
                  <MenuItem 
                    key={gerarChaveUnica('select', cliente.id, 'cliente')} 
                    value={cliente.id}
                  >
                    {cliente.razao_social}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Período</InputLabel>
              <Select
                value={filtros.periodo}
                label="Período"
                onChange={(e) => handleFiltroChange('periodo', e.target.value)}
              >
                <MenuItem value="mensal">Mensal</MenuItem>
                <MenuItem value="trimestral">Trimestral</MenuItem>
                <MenuItem value="anual">Anual</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={aplicarFiltros}
              startIcon={<AssessmentIcon />}
              sx={{
                height: '56px',
                borderRadius: 2,
                textTransform: 'none'
              }}
            >
              Aplicar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Relatório de Licitações */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon color="primary" />
                Relatório de Licitações
              </Typography>
              {loading.licitacoes ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : relatorioLicitacoes ? (
                <>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total de Licitações
                          </Typography>
                          <Typography variant="h5">
                            {relatorioLicitacoes.totalLicitacoes}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {relatorioLicitacoes.licitacoesEmAnalise} em análise • {relatorioLicitacoes.licitacoesEmAndamento} em andamento
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Licitações Finalizadas
                          </Typography>
                          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {relatorioLicitacoes.licitacoesFinalizadas}
                            <Chip
                              label={`${relatorioLicitacoes.licitacoesGanhas} ganhas`}
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Taxa de sucesso: {((relatorioLicitacoes.licitacoesGanhas / relatorioLicitacoes.licitacoesFinalizadas) * 100 || 0).toFixed(1)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Valor Total Ganho
                          </Typography>
                          <Typography variant="h5" color="primary.main">
                            {formatarMoeda(relatorioLicitacoes.valorTotalGanho)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Média por licitação: {formatarMoeda(relatorioLicitacoes.valorTotalGanho / relatorioLicitacoes.licitacoesGanhas || 0)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Lucro Total
                          </Typography>
                          <Typography variant="h5" color={
                            relatorioLicitacoes.lucroTotal > 0 ? 'success.main' : 'error.main'
                          }>
                            {formatarMoeda(relatorioLicitacoes.lucroTotal)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Margem: {((relatorioLicitacoes.lucroTotal / relatorioLicitacoes.valorTotalGanho) * 100 || 0).toFixed(1)}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Número</TableCell>
                          <TableCell>Cliente</TableCell>
                          <TableCell>Órgão</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Data Abertura</TableCell>
                          <TableCell align="right">Valor Estimado</TableCell>
                          <TableCell align="right">Valor Final</TableCell>
                          <TableCell align="right">Lucro Final</TableCell>
                          <TableCell>Resultado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relatorioLicitacoes.detalhes.map((licitacao) => (
                          <TableRow key={gerarChaveUnica('licitacao', licitacao.id, licitacao.numero)}>
                            <TableCell>{licitacao.numero}</TableCell>
                            <TableCell>{licitacao.cliente ? licitacao.cliente.razao_social : 'N/A'}</TableCell>
                            <TableCell>{licitacao.orgao}</TableCell>
                            <TableCell>
                              <Chip 
                                label={licitacao.status}
                                color={
                                  licitacao.status === 'Finalizada' 
                                    ? (licitacao.foi_ganha ? 'success' : 'error')
                                    : 'primary'
                                }
                                variant={licitacao.status === 'Finalizada' ? 'filled' : 'outlined'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{format(new Date(licitacao.data_abertura), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell align="right">{formatarMoeda(licitacao.valor_estimado)}</TableCell>
                            <TableCell align="right">
                              {licitacao.status === 'Finalizada' 
                                ? formatarMoeda(licitacao.valor_final)
                                : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {licitacao.status === 'Finalizada' ? (
                                <Typography 
                                  color={licitacao.lucro_final > 0 ? 'success.main' : 'error.main'}
                                >
                                  {formatarMoeda(licitacao.lucro_final)}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={
                                  licitacao.status === 'Finalizada'
                                    ? (licitacao.foi_ganha ? 'Ganha' : 'Perdida')
                                    : 'Aguardando'
                                }
                                color={
                                  licitacao.status === 'Finalizada'
                                    ? (licitacao.foi_ganha ? 'success' : 'error')
                                    : 'warning'
                                }
                                variant={licitacao.status === 'Finalizada' ? 'filled' : 'outlined'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Typography color="text.secondary">
                  Nenhum dado disponível para os filtros selecionados
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Relatório de Clientes */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BusinessIcon color="primary" />
                Relatório de Clientes
              </Typography>
              {loading.clientes ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : relatorioClientes ? (
                <>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total de Clientes
                          </Typography>
                          <Typography variant="h5">
                            {relatorioClientes.totalClientes}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Clientes Ativos
                          </Typography>
                          <Typography variant="h5" color="success.main">
                            {relatorioClientes.clientesAtivos}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Cliente</TableCell>
                          <TableCell>CNPJ</TableCell>
                          <TableCell align="right">Total Licitações</TableCell>
                          <TableCell align="right">Licitações Ganhas</TableCell>
                          <TableCell align="right">Em Andamento</TableCell>
                          <TableCell align="right">Valor Total Ganho</TableCell>
                          <TableCell align="right">Lucro Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {relatorioClientes.detalhes.map((cliente) => (
                          <TableRow key={gerarChaveUnica('cliente', cliente.id, cliente.cnpj?.replace(/\D/g, ''))}>
                            <TableCell>{cliente.razao_social}</TableCell>
                            <TableCell>{cliente.cnpj}</TableCell>
                            <TableCell align="right">{cliente.totalLicitacoes}</TableCell>
                            <TableCell align="right">{cliente.licitacoesGanhas}</TableCell>
                            <TableCell align="right">{cliente.licitacoesEmAndamento}</TableCell>
                            <TableCell align="right">{formatarMoeda(cliente.valorTotalGanho)}</TableCell>
                            <TableCell align="right">
                              <Typography 
                                color={cliente.lucroTotal > 0 ? 'success.main' : 'error.main'}
                              >
                                {formatarMoeda(cliente.lucroTotal)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              ) : (
                <Typography color="text.secondary">
                  Nenhum dado disponível
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Relatório de Desempenho */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                Desempenho do Período
              </Typography>
              {loading.desempenho ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : relatorioDesempenho ? (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Período: {relatorioDesempenho.periodo.inicio} a {relatorioDesempenho.periodo.fim}
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total de Licitações
                          </Typography>
                          <Typography variant="h5">
                            {relatorioDesempenho.totalLicitacoes}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Taxa de Sucesso
                          </Typography>
                          <Typography variant="h5" color={
                            Number(relatorioDesempenho.taxaSucesso) >= 50 ? 'success.main' : 'error.main'
                          }>
                            {relatorioDesempenho.taxaSucesso}%
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Valor Total Ganho
                          </Typography>
                          <Typography variant="h5" color="primary.main">
                            {formatarMoeda(relatorioDesempenho.valorTotalGanho)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Lucro Total
                          </Typography>
                          <Typography variant="h5" color={
                            relatorioDesempenho.lucroTotal > 0 ? 'success.main' : 'error.main'
                          }>
                            {formatarMoeda(relatorioDesempenho.lucroTotal)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  {Object.entries(relatorioDesempenho.principaisMotivosPerda).length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Principais Motivos de Perda
                      </Typography>
                      <Grid container spacing={1}>
                        {Object.entries(relatorioDesempenho.principaisMotivosPerda).map(([motivo, quantidade], index) => (
                          <Grid item key={gerarChaveUnica('motivo', index, motivo.replace(/\W/g, ''))}>
                            <Chip
                              label={`${motivo}: ${quantidade}`}
                              color="default"
                              variant="outlined"
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </>
              ) : (
                <Typography color="text.secondary">
                  Nenhum dado disponível para o período selecionado
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 