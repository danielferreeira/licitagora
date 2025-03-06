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
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

// Configurar timezone para Brasil
dayjs.tz.setDefault('America/Sao_Paulo');

const API_URL = 'http://localhost:3001/api';

const modalidades = [
  'Pregão Eletrônico',
  'Pregão Presencial',
  'Concorrência',
  'Tomada de Preços',
  'Convite',
  'Leilão',
  'Concurso',
];

const ramosAtividade = [
  'Construção Civil',
  'Tecnologia da Informação',
  'Serviços de Limpeza',
  'Manutenção',
  'Consultoria',
  'Fornecimento de Materiais',
  'Outros',
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
    status: 'Em Análise',
    ramo_atividade: '',
    descricao: '',
    requisitos: '',
    observacoes: '',
  });

  useEffect(() => {
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
    try {
      const response = await axios.get(`${API_URL}/clientes`);
      setClientes(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const carregarLicitacao = async () => {
    try {
      const response = await axios.get(`${API_URL}/licitacoes/${id}`);
      const data = response.data;
      
      // Trata as datas com mais segurança
      let dataAbertura = null;
      let dataFim = null;

      try {
        if (data.data_abertura) {
          dataAbertura = dayjs(data.data_abertura).tz('America/Sao_Paulo');
          if (!dataAbertura.isValid()) {
            console.error('Data de abertura inválida:', data.data_abertura);
            dataAbertura = dayjs().tz('America/Sao_Paulo');
          }
        }

        if (data.data_fim) {
          dataFim = dayjs(data.data_fim).tz('America/Sao_Paulo');
          if (!dataFim.isValid()) {
            console.error('Data fim inválida:', data.data_fim);
            dataFim = dataAbertura ? dataAbertura.add(1, 'day') : dayjs().tz('America/Sao_Paulo').add(1, 'day');
          }
        }
      } catch (error) {
        console.error('Erro ao processar datas:', error);
        dataAbertura = dayjs().tz('America/Sao_Paulo');
        dataFim = dataAbertura.add(1, 'day');
      }
      
      setLicitacao({
        ...data,
        data_abertura: dataAbertura,
        data_fim: dataFim,
        valor_estimado: data.valor_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00',
        lucro_estimado: data.lucro_estimado?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'
      });

      if (data.cliente_id) {
        await carregarRamosAtividade(data.cliente_id);
      }
    } catch (error) {
      console.error('Erro ao carregar licitação:', error);
      toast.error('Erro ao carregar licitação');
      navigate('/licitacoes');
    }
  };

  const carregarRamosAtividade = async (clienteId) => {
    try {
      const response = await axios.get(`${API_URL}/clientes/${clienteId}`);
      const cliente = response.data;
      // Se o cliente tem ramos de atividade específicos, use-os
      if (cliente.ramos_atividade && Array.isArray(cliente.ramos_atividade)) {
        setRamosAtividadeDisponiveis(cliente.ramos_atividade);
      } else if (cliente.ramo_atividade) {
        // Se tem apenas um ramo de atividade
        setRamosAtividadeDisponiveis([cliente.ramo_atividade]);
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
        ramo_atividade: '' // Limpa o ramo de atividade quando muda o cliente
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
    if (campo === 'valor_estimado' || campo === 'lucro_estimado') {
      // Remove caracteres não numéricos exceto ponto e vírgula
      const numeroLimpo = valor.replace(/[^0-9.,]/g, '');
      // Converte vírgula para ponto
      const numeroFormatado = numeroLimpo.replace(',', '.');
      setLicitacao(prev => ({
        ...prev,
        [campo]: numeroFormatado
      }));
    } else if (campo === 'data_abertura' || campo === 'data_fim') {
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
        toast.error(`Data ${campo === 'data_abertura' ? 'de abertura' : 'fim'} inválida`);
        return;
      }

      // Garante que a data está no timezone correto
      dataValida = dataValida.tz('America/Sao_Paulo', true);

      // Para data_fim, verifica se é posterior à data de abertura
      if (campo === 'data_fim' && licitacao.data_abertura) {
        if (dataValida.isBefore(licitacao.data_abertura)) {
          toast.error('A data fim deve ser posterior à data de abertura');
          return;
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
    try {
      // Validações das datas
      if (!licitacao.data_abertura || !licitacao.data_abertura.isValid()) {
        toast.error('Data de abertura inválida');
        return;
      }

      if (licitacao.data_fim && !licitacao.data_fim.isValid()) {
        toast.error('Data fim inválida');
        return;
      }

      // Converte os valores para o formato correto antes de enviar
      const valorEstimado = parseFloat(licitacao.valor_estimado.replace(/\./g, '').replace(',', '.'));
      const lucroEstimado = parseFloat(licitacao.lucro_estimado.replace(/\./g, '').replace(',', '.'));

      const dadosFormatados = {
        ...licitacao,
        data_abertura: licitacao.data_abertura.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
        data_fim: licitacao.data_fim ? licitacao.data_fim.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]') : null,
        valor_estimado: isNaN(valorEstimado) ? 0 : valorEstimado,
        lucro_estimado: isNaN(lucroEstimado) ? 0 : lucroEstimado
      };

      if (id) {
        await axios.put(`${API_URL}/licitacoes/${id}`, dadosFormatados);
        toast.success('Licitação atualizada com sucesso!');
      } else {
        await axios.post(`${API_URL}/licitacoes`, dadosFormatados);
        toast.success('Licitação criada com sucesso!');
      }
      navigate('/licitacoes');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error.response?.data?.error || 'Erro ao salvar licitação');
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
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
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
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
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
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !licitacao.data_abertura?.isValid()
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Data Fim"
                value={licitacao.data_fim}
                onChange={(newValue) => {
                  if (newValue && licitacao.data_abertura && dayjs(newValue).isBefore(licitacao.data_abertura)) {
                    toast.error('A data fim deve ser posterior à data de abertura');
                    return;
                  }
                  handleChange('data_fim', newValue);
                }}
                views={['year', 'month', 'day', 'hours', 'minutes']}
                format="DD/MM/YYYY HH:mm"
                ampm={false}
                timezone="America/Sao_Paulo"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: 'Data deve ser posterior à data de abertura',
                    error: licitacao.data_fim && !licitacao.data_fim.isValid()
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor Estimado"
                value={licitacao.valor_estimado}
                onChange={(e) => handleChange('valor_estimado', e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                inputProps={{
                  step: "0.01",
                  min: "0",
                  placeholder: "0,00"
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Lucro Estimado"
                value={licitacao.lucro_estimado}
                onChange={(e) => handleChange('lucro_estimado', e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                }}
                inputProps={{
                  step: "0.01",
                  min: "0",
                  placeholder: "0,00"
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Ramo de Atividade</InputLabel>
                <Select
                  value={licitacao.ramo_atividade || ''}
                  label="Ramo de Atividade"
                  onChange={(e) => handleChange('ramo_atividade', e.target.value)}
                >
                  <MenuItem value="">Selecione um ramo de atividade</MenuItem>
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
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/licitacoes')}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
              >
                {id ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
} 