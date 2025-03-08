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
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/pt-br';
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
      const data = await clienteService.listarClientes();
      if (data) {
        setClientes(data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const carregarLicitacao = async () => {
    try {
      const data = await licitacaoService.buscarLicitacaoPorId(id);
      if (!data) {
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
      if (!licitacao.data_abertura || !dayjs.isDayjs(licitacao.data_abertura)) {
        toast.error('Data de abertura inválida');
        return;
      }

      if (!licitacao.data_fim || !dayjs.isDayjs(licitacao.data_fim)) {
        toast.error('Data fim inválida');
        return;
      }

      if (licitacao.data_fim.isBefore(licitacao.data_abertura)) {
        toast.error('A data fim deve ser posterior à data de abertura');
        return;
      }

      // Validar ramos de atividade
      if (!licitacao.ramos_atividade || !Array.isArray(licitacao.ramos_atividade) || licitacao.ramos_atividade.length === 0) {
        toast.error('Selecione pelo menos um ramo de atividade');
        return;
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
        status: 'EM_ANDAMENTO',
        ramos_atividade: licitacao.ramos_atividade,
        descricao: licitacao.descricao || null,
        requisitos: licitacao.requisitos || null,
        observacoes: licitacao.observacoes || null
      };

      if (id) {
        // Atualiza licitação existente
        await licitacaoService.atualizarLicitacao(id, dadosLicitacao);
        toast.success('Licitação atualizada com sucesso!');
      } else {
        // Cria nova licitação
        await licitacaoService.criarLicitacao(dadosLicitacao);
        toast.success('Licitação criada com sucesso!');
      }

      navigate('/licitacoes');
    } catch (error) {
      console.error('Erro ao salvar licitação:', error);
      toast.error(error.message || 'Erro ao salvar licitação');
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