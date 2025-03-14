import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
  Backdrop,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/pt-br';
import { NumericFormat } from 'react-number-format';
import { clienteService, licitacaoService } from '../../services/supabase';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.locale('pt-br');

// Configurar timezone para Brasil
dayjs.tz.setDefault('America/Sao_Paulo');

const modalidades = [
  'PREGAO_ELETRONICO',
  'PREGAO_PRESENCIAL',
  'CONCORRENCIA',
  'TOMADA_DE_PRECOS',
  'CONVITE',
  'LEILAO',
  'CONCURSO',
];

const ramosAtividade = [
  'CONSTRUCAO_CIVIL',
  'TECNOLOGIA_DA_INFORMACAO',
  'SERVICOS_DE_LIMPEZA',
  'MANUTENCAO',
  'CONSULTORIA',
  'FORNECIMENTO_DE_MATERIAIS',
  'OUTROS',
];

export default function NovaLicitacao() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [clientes, setClientes] = useState([]);
  const [ramosAtividadeDisponiveis, setRamosAtividadeDisponiveis] = useState(ramosAtividade);
  const [licitacao, setLicitacao] = useState({
    numero: '',
    cliente_id: '',
    orgao: '',
    objeto: '',
    modalidade: '',
    data_abertura: null,
    data_fim: null,
    valor_estimado: '0,00',
    lucro_estimado: '0,00',
    status: 'EM_ANALISE',
    ramos_atividade: [],
    descricao: '',
    requisitos: '',
    observacoes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataErrors, setDataErrors] = useState({
    data_abertura: false,
    data_fim: false,
  });

  useEffect(() => {
    // Log para depuração
    console.log('NovaLicitacao - ID recebido:', id);
    
    carregarClientes();
    if (id) {
      carregarLicitacao();
    } else {
      // Inicializa as datas apenas para nova licitação
      const dataAtual = dayjs().tz('America/Sao_Paulo');
      setLicitacao(prev => ({
        ...prev,
        data_abertura: dataAtual,
        data_fim: dataAtual.add(1, 'day')
      }));
    }
  }, [id]);

  const carregarClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteService.listarClientes();
      if (data) {
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setError('Erro ao carregar clientes: ' + (error.message || ''));
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const carregarLicitacao = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Carregando licitação com ID:', id);
      
      const data = await licitacaoService.buscarLicitacaoPorId(id);
      
      console.log('Dados da licitação recebidos:', data);
      
      if (!data) {
        console.error('Licitação não encontrada para o ID:', id);
        setError('Licitação não encontrada');
        toast.error('Licitação não encontrada');
        navigate('/licitacoes');
        return;
      }

      // Trata as datas com mais segurança
      let dataAbertura = null;
      let dataFim = null;

      try {
        if (data.data_abertura) {
          dataAbertura = dayjs(data.data_abertura).tz('America/Sao_Paulo');
          if (!dataAbertura.isValid()) {
            console.error('Data de abertura inválida:', data.data_abertura);
            dataAbertura = dayjs().tz('America/Sao_Paulo');
            setDataErrors(prev => ({ ...prev, data_abertura: true }));
          }
        }

        if (data.data_fim) {
          dataFim = dayjs(data.data_fim).tz('America/Sao_Paulo');
          if (!dataFim.isValid()) {
            console.error('Data fim inválida:', data.data_fim);
            dataFim = dataAbertura ? dataAbertura.add(1, 'day') : dayjs().tz('America/Sao_Paulo').add(1, 'day');
            setDataErrors(prev => ({ ...prev, data_fim: true }));
          }
        }
      } catch (error) {
        console.error('Erro ao processar datas:', error);
        dataAbertura = dayjs().tz('America/Sao_Paulo');
        dataFim = dataAbertura.add(1, 'day');
        setDataErrors({ data_abertura: true, data_fim: true });
      }
      
      console.log('Definindo estado da licitação com dados carregados');
      
      setLicitacao({
        ...data,
        data_abertura: dataAbertura,
        data_fim: dataFim,
        valor_estimado: data.valor_estimado || 0,
        lucro_estimado: data.lucro_estimado || 0
      });

      if (data.cliente_id) {
        await carregarRamosAtividade(data.cliente_id);
      }
    } catch (error) {
      console.error('Erro ao carregar licitação:', error);
      setError('Erro ao carregar licitação: ' + (error.message || ''));
      toast.error('Erro ao carregar licitação');
      navigate('/licitacoes');
    } finally {
      setLoading(false);
    }
  };

  const carregarRamosAtividade = async (clienteId) => {
    try {
      const cliente = await clienteService.buscarClientePorId(clienteId);
      if (!cliente) {
        throw new Error('Cliente não encontrado');
      }

      // Se o cliente tem ramos de atividade específicos, use-os
      if (cliente.ramos_atividade && Array.isArray(cliente.ramos_atividade)) {
        setRamosAtividadeDisponiveis(cliente.ramos_atividade);
      } else {
        // Se não tem ramos específicos, use a lista padrão
        setRamosAtividadeDisponiveis(ramosAtividade);
      }
    } catch (error) {
      console.error('Erro ao carregar ramos de atividade:', error);
      toast.error('Erro ao carregar ramos de atividade do cliente');
      // Em caso de erro, use a lista padrão
      setRamosAtividadeDisponiveis(ramosAtividade);
    }
  };

  const handleClienteChange = async (clienteId) => {
    try {
      // Primeiro atualiza o ID do cliente e limpa o ramo de atividade
      setLicitacao(prev => ({
        ...prev,
        cliente_id: clienteId,
        ramos_atividade: [] // Limpa o ramo de atividade quando muda o cliente
      }));
      
      if (!clienteId) {
        setRamosAtividadeDisponiveis([]);
        return;
      }

      // Carrega os ramos de atividade do cliente
      await carregarRamosAtividade(clienteId);
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      toast.error('Erro ao carregar dados do cliente');
    }
  };

  const handleChange = (campo, valor) => {
    if (campo === 'data_abertura' || campo === 'data_fim') {
      // Se o valor for null ou undefined, não atualiza
      if (!valor) {
        setLicitacao(prev => ({
          ...prev,
          [campo]: null
        }));
        return;
      }

      // Verifica se já é um objeto dayjs
      let dataValida = dayjs.isDayjs(valor) ? valor : dayjs(valor);

      // Verifica se a data é válida
      if (!dataValida.isValid()) {
        setDataErrors(prev => ({ ...prev, [campo]: true }));
        toast.error(`Data ${campo === 'data_abertura' ? 'de abertura' : 'fim'} inválida`);
        return;
      } else {
        setDataErrors(prev => ({ ...prev, [campo]: false }));
      }

      // Garante que a data está no timezone correto
      dataValida = dataValida.tz('America/Sao_Paulo', true);

      // Para data_fim, verifica se é posterior à data de abertura
      if (campo === 'data_fim' && licitacao.data_abertura) {
        if (dataValida.isBefore(licitacao.data_abertura)) {
          setDataErrors(prev => ({ ...prev, data_fim: true }));
          toast.error('A data fim deve ser posterior à data de abertura');
          return;
        } else {
          setDataErrors(prev => ({ ...prev, data_fim: false }));
        }
      }

      setLicitacao(prev => ({
        ...prev,
        [campo]: dataValida
      }));
    } else {
      setLicitacao(prev => ({
        ...prev,
        [campo]: valor
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('Submetendo formulário de licitação. ID:', id);
      
      // Validações das datas
      if (!licitacao.data_abertura || !dayjs.isDayjs(licitacao.data_abertura)) {
        setDataErrors(prev => ({ ...prev, data_abertura: true }));
        throw new Error('Data de abertura inválida');
      }

      if (!licitacao.data_fim || !dayjs.isDayjs(licitacao.data_fim)) {
        setDataErrors(prev => ({ ...prev, data_fim: true }));
        throw new Error('Data fim inválida');
      }

      if (licitacao.data_fim.isBefore(licitacao.data_abertura)) {
        setDataErrors(prev => ({ ...prev, data_fim: true }));
        throw new Error('A data fim deve ser posterior à data de abertura');
      }

      // Validar ramos de atividade
      if (!licitacao.ramos_atividade || !Array.isArray(licitacao.ramos_atividade) || licitacao.ramos_atividade.length === 0) {
        throw new Error('Selecione pelo menos um ramo de atividade');
      }

      // Prepara os dados para envio
      const dadosLicitacao = {
        numero: licitacao.numero,
        cliente_id: licitacao.cliente_id,
        orgao: licitacao.orgao,
        objeto: licitacao.objeto,
        modalidade: licitacao.modalidade,
        data_abertura: licitacao.data_abertura,
        data_fim: licitacao.data_fim,
        valor_estimado: licitacao.valor_estimado,
        lucro_estimado: licitacao.lucro_estimado,
        status: licitacao.status || 'EM_ANDAMENTO',
        ramos_atividade: licitacao.ramos_atividade,
        descricao: licitacao.descricao || null,
        requisitos: licitacao.requisitos || null,
        observacoes: licitacao.observacoes || null
      };

      console.log('Dados da licitação preparados para envio:', dadosLicitacao);
      console.log('ID para atualização:', id);

      if (id) {
        // Atualiza licitação existente
        console.log('Atualizando licitação existente com ID:', id);
        await licitacaoService.atualizarLicitacao(id, dadosLicitacao);
        toast.success('Licitação atualizada com sucesso!');
      } else {
        // Cria nova licitação
        console.log('Criando nova licitação');
        await licitacaoService.criarLicitacao(dadosLicitacao);
        toast.success('Licitação criada com sucesso!');
      }

      navigate('/licitacoes');
    } catch (error) {
      console.error('Erro ao salvar licitação:', error);
      setError('Erro ao salvar licitação: ' + (error.message || ''));
      toast.error(error.message || 'Erro ao salvar licitação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {id ? 'Editar Licitação' : 'Nova Licitação'}
      </Typography>

      <Paper sx={{ p: 3, mt: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número da Licitação"
                value={licitacao.numero}
                onChange={(e) => handleChange('numero', e.target.value)}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel>Cliente</InputLabel>
                <Select
                  value={licitacao.cliente_id}
                  label="Cliente"
                  onChange={(e) => handleClienteChange(e.target.value)}
                >
                  <MenuItem value="">Selecione um cliente</MenuItem>
                  {clientes.map((cliente) => (
                    <MenuItem key={cliente.id} value={cliente.id}>
                      {cliente.razao_social}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Órgão"
                value={licitacao.orgao}
                onChange={(e) => handleChange('orgao', e.target.value)}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Objeto"
                value={licitacao.objeto}
                onChange={(e) => handleChange('objeto', e.target.value)}
                required
                multiline
                rows={3}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel>Modalidade</InputLabel>
                <Select
                  value={licitacao.modalidade}
                  label="Modalidade"
                  onChange={(e) => handleChange('modalidade', e.target.value)}
                >
                  {modalidades.map((modalidade) => (
                    <MenuItem key={modalidade} value={modalidade}>
                      {modalidade}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Data de Abertura"
                value={licitacao.data_abertura}
                onChange={(newValue) => handleChange('data_abertura', newValue)}
                views={['year', 'month', 'day', 'hours', 'minutes']}
                format="DD/MM/YYYY HH:mm"
                ampm={false}
                timezone="America/Sao_Paulo"
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: dataErrors.data_abertura,
                    helperText: dataErrors.data_abertura ? 'Data de abertura inválida' : ''
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Data Fim"
                value={licitacao.data_fim}
                onChange={(newValue) => handleChange('data_fim', newValue)}
                views={['year', 'month', 'day', 'hours', 'minutes']}
                format="DD/MM/YYYY HH:mm"
                ampm={false}
                timezone="America/Sao_Paulo"
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: dataErrors.data_fim ? 'Data deve ser posterior à data de abertura' : 'Data deve ser posterior à data de abertura',
                    error: dataErrors.data_fim
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <NumericFormat
                customInput={TextField}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                value={licitacao.valor_estimado}
                onValueChange={(values) => {
                  handleChange('valor_estimado', values.floatValue || 0);
                }}
                label="Valor Estimado"
                fullWidth
                required
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <NumericFormat
                customInput={TextField}
                thousandSeparator="."
                decimalSeparator=","
                prefix="R$ "
                decimalScale={2}
                fixedDecimalScale
                value={licitacao.lucro_estimado}
                onValueChange={(values) => {
                  handleChange('lucro_estimado', values.floatValue || 0);
                }}
                label="Lucro Estimado"
                fullWidth
                required
                disabled={loading}
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={loading}>
                <InputLabel>Ramos de Atividade</InputLabel>
                <Select
                  multiple
                  value={licitacao.ramos_atividade || []}
                  label="Ramos de Atividade"
                  onChange={(e) => handleChange('ramos_atividade', e.target.value)}
                >
                  {ramosAtividadeDisponiveis.map((ramo) => (
                    <MenuItem key={ramo} value={ramo}>
                      {ramo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                value={licitacao.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                multiline
                rows={4}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Requisitos"
                value={licitacao.requisitos}
                onChange={(e) => handleChange('requisitos', e.target.value)}
                multiline
                rows={4}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                value={licitacao.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
                multiline
                rows={4}
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/licitacoes')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {id ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

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