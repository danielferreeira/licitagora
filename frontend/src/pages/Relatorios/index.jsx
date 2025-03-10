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
import { clienteService, relatorioService } from '../../services/supabase';

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
      toast.error('Erro ao gerar relatórios');
    }
  };

  const gerarRelatorioLicitacoes = async () => {
    setLoading(prev => ({ ...prev, licitacoes: true }));
    try {
      console.log('Gerando relatório de licitações com filtros:', filtros);
      const data = await relatorioService.gerarRelatorioLicitacoes(filtros);
      console.log('Dados recebidos do relatório de licitações:', data);
      
      if (data) {
        const relatorio = {
          ...data,
          detalhes: Array.isArray(data.detalhes) ? data.detalhes.map(item => ({
            ...item,
            data_abertura: item.data_abertura ? new Date(item.data_abertura) : null,
            data_fechamento: item.data_fechamento ? new Date(item.data_fechamento) : null
          })) : []
        };
        console.log('Relatório de licitações formatado:', relatorio);
        setRelatorioLicitacoes(relatorio);
      } else {
        console.log('Nenhum dado retornado para o relatório de licitações');
        setRelatorioLicitacoes(null);
      }
    } catch (error) {
      console.error('Erro detalhado ao gerar relatório de licitações:', error);
      toast.error('Erro ao gerar relatório de licitações');
      setRelatorioLicitacoes(null);
    } finally {
      setLoading(prev => ({ ...prev, licitacoes: false }));
    }
  };

  const gerarRelatorioClientes = async () => {
    setLoading(prev => ({ ...prev, clientes: true }));
    try {
      console.log('Gerando relatório de clientes com filtros:', filtros);
      const data = await relatorioService.gerarRelatorioClientes(filtros);
      console.log('Dados recebidos do relatório de clientes:', data);
      
      if (data) {
        const relatorio = {
          ...data,
          detalhes: Array.isArray(data.detalhes) ? data.detalhes : []
        };
        console.log('Relatório de clientes formatado:', relatorio);
        setRelatorioClientes(relatorio);
      } else {
        console.log('Nenhum dado retornado para o relatório de clientes');
        setRelatorioClientes(null);
      }
    } catch (error) {
      console.error('Erro detalhado ao gerar relatório de clientes:', error);
      toast.error('Erro ao gerar relatório de clientes');
      setRelatorioClientes(null);
    } finally {
      setLoading(prev => ({ ...prev, clientes: false }));
    }
  };

  const gerarRelatorioDesempenho = async () => {
    setLoading(prev => ({ ...prev, desempenho: true }));
    try {
      console.log('Gerando relatório de desempenho com filtros:', filtros);
      const data = await relatorioService.gerarRelatorioDesempenho(filtros);
      console.log('Dados recebidos do relatório de desempenho:', data);
      
      if (data) {
        const relatorio = {
          ...data,
          evolucao_mensal: Array.isArray(data.evolucao_mensal) ? data.evolucao_mensal : [],
          motivos_perda: data.motivos_perda || {}
        };
        console.log('Relatório de desempenho formatado:', relatorio);
        setRelatorioDesempenho(relatorio);
      } else {
        console.log('Nenhum dado retornado para o relatório de desempenho');
        setRelatorioDesempenho(null);
      }
    } catch (error) {
      console.error('Erro detalhado ao gerar relatório de desempenho:', error);
      toast.error('Erro ao gerar relatório de desempenho');
      setRelatorioDesempenho(null);
    } finally {
      setLoading(prev => ({ ...prev, desempenho: false }));
    }
  };

  const handleFiltroChange = (campo, valor) => {
    console.log('Alterando filtro:', campo, valor);
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const aplicarFiltros = () => {
    console.log('Aplicando filtros:', filtros);
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
          onClick={aplicarFiltros}
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
                <MenuItem value="EM_ANDAMENTO">Em Andamento</MenuItem>
                <MenuItem value="CONCLUIDA">Concluída</MenuItem>
                <MenuItem value="CANCELADA">Cancelada</MenuItem>
                <MenuItem value="SUSPENSA">Suspensa</MenuItem>
                <MenuItem value="FRACASSADA">Fracassada</MenuItem>
                <MenuItem value="DESERTA">Deserta</MenuItem>
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
                  <MenuItem key={cliente.id} value={cliente.id}>
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
                            {relatorioLicitacoes?.total_licitacoes || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {relatorioLicitacoes?.licitacoes_em_andamento || 0} em andamento
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
                            {(relatorioLicitacoes?.licitacoes_ganhas || 0) + (relatorioLicitacoes?.licitacoes_perdidas || 0)}
                            <Chip
                              label={`${relatorioLicitacoes?.licitacoes_ganhas || 0} ganhas`}
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Taxa de sucesso: {(relatorioLicitacoes?.taxa_sucesso || 0).toFixed(1)}%
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
                            {formatarMoeda(relatorioLicitacoes?.valor_total_ganho || 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Média por licitação: {formatarMoeda((relatorioLicitacoes?.valor_total_ganho || 0) / (relatorioLicitacoes?.licitacoes_ganhas || 1))}
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
                            relatorioLicitacoes?.lucro_total > 0 ? 'success.main' : 'error.main'
                          }>
                            {formatarMoeda(relatorioLicitacoes?.lucro_total || 0)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Margem: {((relatorioLicitacoes?.lucro_total || 0) / (relatorioLicitacoes?.valor_total_ganho || 1) * 100).toFixed(1)}%
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
                        {relatorioLicitacoes?.detalhes?.map((licitacao) => (
                          <TableRow key={licitacao.id}>
                            <TableCell>{licitacao?.numero}</TableCell>
                            <TableCell>{licitacao?.cliente_razao_social}</TableCell>
                            <TableCell>{licitacao?.orgao}</TableCell>
                            <TableCell>
                              <Chip 
                                label={licitacao?.status}
                                color={
                                  licitacao?.status === 'CONCLUIDA' 
                                    ? (licitacao?.foi_ganha ? 'success' : 'error')
                                    : 'primary'
                                }
                                variant={licitacao?.status === 'CONCLUIDA' ? 'filled' : 'outlined'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{format(new Date(licitacao?.data_abertura), 'dd/MM/yyyy HH:mm')}</TableCell>
                            <TableCell align="right">{formatarMoeda(licitacao?.valor_estimado)}</TableCell>
                            <TableCell align="right">
                              {licitacao?.status === 'CONCLUIDA' 
                                ? formatarMoeda(licitacao?.valor_final)
                                : '-'}
                            </TableCell>
                            <TableCell align="right">
                              {licitacao?.status === 'CONCLUIDA' ? (
                                <Typography 
                                  color={licitacao?.lucro_final > 0 ? 'success.main' : 'error.main'}
                                >
                                  {formatarMoeda(licitacao?.lucro_final)}
                                </Typography>
                              ) : '-'}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={
                                  licitacao?.status === 'CONCLUIDA'
                                    ? (licitacao?.foi_ganha ? 'Ganha' : 'Perdida')
                                    : 'Aguardando'
                                }
                                color={
                                  licitacao?.status === 'CONCLUIDA'
                                    ? (licitacao?.foi_ganha ? 'success' : 'error')
                                    : 'warning'
                                }
                                variant={licitacao?.status === 'CONCLUIDA' ? 'filled' : 'outlined'}
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
                            {relatorioClientes?.total_clientes || 0}
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
                            {relatorioClientes?.clientes_ativos || 0}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Valor Total em Licitações
                          </Typography>
                          <Typography variant="h5" color="primary.main">
                            {formatarMoeda(relatorioClientes?.valor_total_licitacoes || 0)}
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
                        {relatorioClientes?.detalhes?.map((cliente) => (
                          <TableRow key={cliente.id}>
                            <TableCell>{cliente?.razao_social}</TableCell>
                            <TableCell>{cliente?.cnpj}</TableCell>
                            <TableCell align="right">{cliente?.total_licitacoes}</TableCell>
                            <TableCell align="right">{cliente?.licitacoes_ganhas}</TableCell>
                            <TableCell align="right">{cliente?.licitacoes_em_andamento}</TableCell>
                            <TableCell align="right">{formatarMoeda(cliente?.valor_total_ganho)}</TableCell>
                            <TableCell align="right">
                              <Typography 
                                color={cliente?.lucro_total > 0 ? 'success.main' : 'error.main'}
                              >
                                {formatarMoeda(cliente?.lucro_total)}
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
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary">
                            Total de Licitações
                          </Typography>
                          <Typography variant="h5">
                            {relatorioDesempenho?.total_licitacoes || 0}
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
                            Number(relatorioDesempenho?.taxa_sucesso || 0) >= 50 ? 'success.main' : 'error.main'
                          }>
                            {(relatorioDesempenho?.taxa_sucesso || 0).toFixed(1)}%
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
                            {formatarMoeda(relatorioDesempenho?.valor_total_ganho || 0)}
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
                            relatorioDesempenho?.lucro_total > 0 ? 'success.main' : 'error.main'
                          }>
                            {formatarMoeda(relatorioDesempenho?.lucro_total || 0)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Principais Motivos de Perda
                    </Typography>
                    <Grid container spacing={1}>
                      {Object.entries(relatorioDesempenho?.motivos_perda || {}).map(([motivo, quantidade], index) => (
                        <Grid item key={`motivo-${index}`}>
                          <Chip
                            label={`${motivo}: ${quantidade}`}
                            color="default"
                            variant="outlined"
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Evolução Mensal
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Mês</TableCell>
                            <TableCell align="right">Total Licitações</TableCell>
                            <TableCell align="right">Licitações Ganhas</TableCell>
                            <TableCell align="right">Valor Total</TableCell>
                            <TableCell align="right">Lucro Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {relatorioDesempenho?.evolucao_mensal?.map((mes) => (
                            <TableRow key={mes.mes}>
                              <TableCell>{mes?.mes}</TableCell>
                              <TableCell align="right">{mes?.total_licitacoes}</TableCell>
                              <TableCell align="right">{mes?.licitacoes_ganhas}</TableCell>
                              <TableCell align="right">{formatarMoeda(mes?.valor_total)}</TableCell>
                              <TableCell align="right">
                                <Typography 
                                  color={mes?.lucro_total > 0 ? 'success.main' : 'error.main'}
                                >
                                  {formatarMoeda(mes?.lucro_total)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
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