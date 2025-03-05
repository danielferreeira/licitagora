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
    valor_estimado: '',
    lucro_estimado: '',
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
      
      setLicitacao({
        ...data,
        data_abertura: data.data_abertura ? dayjs(data.data_abertura) : null,
        data_fim: data.data_fim ? dayjs(data.data_fim) : null,
        valor_estimado: data.valor_estimado?.toString() || '',
        lucro_estimado: data.lucro_estimado?.toString() || ''
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
    setLicitacao(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validação das datas
      if (licitacao.data_fim && licitacao.data_abertura) {
        if (dayjs(licitacao.data_fim).isBefore(dayjs(licitacao.data_abertura))) {
          toast.error('A data fim deve ser posterior à data de abertura');
          return;
        }
      }

      const dadosParaEnviar = {
        ...licitacao,
        valor_estimado: parseFloat(licitacao.valor_estimado),
        lucro_estimado: parseFloat(licitacao.lucro_estimado),
        data_abertura: licitacao.data_abertura ? dayjs(licitacao.data_abertura).toISOString() : null,
        data_fim: licitacao.data_fim ? dayjs(licitacao.data_fim).toISOString() : null
      };

      if (id) {
        await axios.put(`${API_URL}/licitacoes/${id}`, dadosParaEnviar);
        toast.success('Licitação atualizada com sucesso!');
      } else {
        await axios.post(`${API_URL}/licitacoes`, dadosParaEnviar);
        toast.success('Licitação cadastrada com sucesso!');
      }
      navigate('/licitacoes');
    } catch (error) {
      console.error('Erro ao salvar licitação:', error.response?.data || error);
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
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
                format="DD/MM/YYYY HH:mm"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <DateTimePicker
                label="Data Fim"
                value={licitacao.data_fim}
                onChange={(newValue) => {
                  if (licitacao.data_abertura && newValue) {
                    if (dayjs(newValue).isBefore(dayjs(licitacao.data_abertura))) {
                      toast.error('A data fim deve ser posterior à data de abertura');
                      return;
                    }
                  }
                  handleChange('data_fim', newValue);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    helperText: licitacao.data_abertura ? 'Data deve ser posterior à data de abertura' : ''
                  }
                }}
                format="DD/MM/YYYY HH:mm"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor Estimado"
                value={licitacao.valor_estimado}
                onChange={(e) => handleChange('valor_estimado', e.target.value)}
                required
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
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
                type="number"
                InputProps={{
                  startAdornment: <InputAdornment position="start">R$</InputAdornment>,
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