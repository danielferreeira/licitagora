import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Grid,
  List,
  ListItem,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'dayjs/locale/pt-br';
import { toast } from 'react-toastify';
import axios from 'axios';

dayjs.extend(customParseFormat);
dayjs.locale('pt-br');

const API_URL = 'http://localhost:3001/api';
const localizer = dayjsLocalizer(dayjs);

const messages = {
  allDay: 'Dia inteiro',
  previous: 'Anterior',
  next: 'Próximo',
  today: 'Hoje',
  month: 'Mês',
  week: 'Semana',
  day: 'Dia',
  agenda: 'Agenda',
  date: 'Data',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'Não há prazos neste período.',
  showMore: total => `+ ${total} prazos`
};

export default function Prazos() {
  const [eventos, setEventos] = useState([]);
  const [licitacoes, setLicitacoes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    data_prazo: dayjs().format('YYYY-MM-DDTHH:mm'),
    observacoes: '',
    licitacao_id: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar licitações
      const resLicitacoes = await axios.get(`${API_URL}/licitacoes`);
      const licitacoesAtivas = resLicitacoes.data.filter(
        licitacao => licitacao.status === 'Em Andamento' && licitacao.data_fim
      );
      setLicitacoes(licitacoesAtivas);

      // Carregar prazos
      const resPrazos = await axios.get(`${API_URL}/prazos`);
      const eventosPrazos = resPrazos.data.map(prazo => ({
        id: prazo.id,
        title: prazo.titulo,
        start: dayjs(prazo.data_prazo).toDate(),
        end: dayjs(prazo.data_prazo).toDate(),
        observacoes: prazo.observacoes,
        licitacao_id: prazo.licitacao_id,
        licitacao_numero: prazo.licitacao_numero,
        licitacao_orgao: prazo.licitacao_orgao,
        tipo: 'prazo'
      }));

      // Adicionar datas de licitações
      const eventosLicitacoes = licitacoesAtivas.map(licitacao => ({
        id: `lic-${licitacao.id}`,
        title: `Encerramento da Licitação: ${licitacao.numero} - ${licitacao.orgao}`,
        start: dayjs(licitacao.data_fim).toDate(),
        end: dayjs(licitacao.data_fim).toDate(),
        tipo: 'licitacao',
        licitacao_id: licitacao.id
      }));

      setEventos([...eventosPrazos, ...eventosLicitacoes]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleNovoEvento = () => {
    setNovoEvento({
      titulo: '',
      data_prazo: dayjs().format('YYYY-MM-DDTHH:mm'),
      observacoes: '',
      licitacao_id: '',
    });
    setOpenDialog(true);
  };

  const handleFecharDialog = () => {
    setOpenDialog(false);
  };

  const handleSelectSlot = ({ start }) => {
    setNovoEvento({
      titulo: '',
      data_prazo: dayjs(start).format('YYYY-MM-DDTHH:mm'),
      observacoes: '',
      licitacao_id: '',
    });
    setOpenDialog(true);
  };

  const handleSelectEvent = (event) => {
    if (event.tipo === 'prazo') {
      setNovoEvento({
        id: event.id,
        titulo: event.title,
        data_prazo: dayjs(event.start).format('YYYY-MM-DDTHH:mm'),
        observacoes: event.observacoes,
        licitacao_id: event.licitacao_id || '',
      });
      setOpenDialog(true);
    }
  };

  const handleSalvarEvento = async () => {
    try {
      // Converter a data para o formato aceito pelo PostgreSQL
      const dataPrazo = dayjs(novoEvento.data_prazo).format('YYYY-MM-DD HH:mm:ss');
      
      if (novoEvento.id) {
        // Atualizar prazo existente
        await axios.put(`${API_URL}/prazos/${novoEvento.id}`, {
          titulo: novoEvento.titulo,
          data_prazo: dataPrazo,
          observacoes: novoEvento.observacoes,
          licitacao_id: novoEvento.licitacao_id || null
        });
        toast.success('Prazo atualizado com sucesso');
      } else {
        // Criar novo prazo
        await axios.post(`${API_URL}/prazos`, {
          titulo: novoEvento.titulo,
          data_prazo: dataPrazo,
          observacoes: novoEvento.observacoes,
          licitacao_id: novoEvento.licitacao_id || null
        });
        toast.success('Prazo adicionado com sucesso');
      }
      
      setOpenDialog(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar prazo:', error);
      if (error.response) {
        toast.error(`Erro ao salvar prazo: ${error.response.data.error || 'Erro desconhecido'}`);
      } else {
        toast.error('Erro ao salvar prazo');
      }
    }
  };

  const handleExcluirEvento = async () => {
    if (!novoEvento.id) return;

    try {
      await axios.delete(`${API_URL}/prazos/${novoEvento.id}`);
      toast.success('Prazo excluído com sucesso');
      setOpenDialog(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir prazo:', error);
      toast.error('Erro ao excluir prazo');
    }
  };

  const eventStyleGetter = (event) => {
    const style = {
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0',
      display: 'block',
      textAlign: 'center',
      padding: '4px'
    };

    // Vermelho para prazos vencidos, azul para futuros
    if (event.tipo === 'prazo') {
      const isVencido = new Date(event.start) < new Date();
      style.backgroundColor = isVencido ? '#f44336' : '#2196f3';
    } 
    // Verde para datas de licitação
    else if (event.tipo === 'licitacao') {
      style.backgroundColor = '#4caf50';
    }

    return { style };
  };

  const handleImportarPrazos = async () => {
    try {
      const response = await axios.post(`${API_URL}/prazos/importar`);
      toast.success(response.data.message);
      carregarDados();
    } catch (error) {
      console.error('Erro ao importar prazos:', error);
      toast.error('Erro ao importar prazos');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ color: 'primary.main' }}>
          Prazos
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleImportarPrazos}
          >
            Importar Prazos das Licitações
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoEvento}
          >
            Novo Prazo
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Prazos Próximos
            </Typography>
            {eventos.length === 0 ? (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
                Nenhum prazo cadastrado
              </Typography>
            ) : (
              <List>
                {eventos
                  .filter(evento => evento.tipo === 'prazo' && dayjs(evento.start).isAfter(dayjs()))
                  .sort((a, b) => dayjs(a.start).diff(dayjs(b.start)))
                  .map(evento => (
                    <ListItem
                      key={evento.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        flexDirection: 'column',
                        alignItems: 'flex-start'
                      }}
                    >
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {evento.title}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Data: {dayjs(evento.start).format('DD/MM/YYYY HH:mm')}
                        </Typography>
                        {evento.licitacao_numero && (
                          <Typography variant="body2" color="text.secondary">
                            Licitação: {evento.licitacao_numero} - {evento.licitacao_orgao}
                          </Typography>
                        )}
                        {evento.observacoes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {evento.observacoes}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)' }}>
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(100% - 40px)' }}
              messages={messages}
              eventPropGetter={eventStyleGetter}
              views={['month', 'week', 'day']}
              defaultView="month"
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              tooltipAccessor={event => event.title}
            />
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Linha do Tempo
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Em desenvolvimento...
          </Typography>
        </Paper>
      </Box>

      <Dialog open={openDialog} onClose={handleFecharDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{novoEvento.id ? 'Editar Prazo' : 'Novo Prazo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Título"
              value={novoEvento.titulo}
              onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Data e Hora"
              type="datetime-local"
              value={novoEvento.data_prazo}
              onChange={(e) => setNovoEvento({ ...novoEvento, data_prazo: e.target.value })}
              fullWidth
              required
              InputLabelProps={{
                shrink: true,
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Licitação</InputLabel>
              <Select
                value={novoEvento.licitacao_id}
                onChange={(e) => setNovoEvento({ ...novoEvento, licitacao_id: e.target.value })}
                label="Licitação"
              >
                <MenuItem value="">
                  <em>Nenhuma</em>
                </MenuItem>
                {licitacoes.map((licitacao) => (
                  <MenuItem key={licitacao.id} value={licitacao.id}>
                    {licitacao.numero} - {licitacao.orgao}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Observações"
              value={novoEvento.observacoes}
              onChange={(e) => setNovoEvento({ ...novoEvento, observacoes: e.target.value })}
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {novoEvento.id && (
            <Button onClick={handleExcluirEvento} color="error">
              Excluir
            </Button>
          )}
          <Button onClick={handleFecharDialog}>Cancelar</Button>
          <Button
            onClick={handleSalvarEvento}
            variant="contained"
            disabled={!novoEvento.titulo || !novoEvento.data_prazo}
          >
            {novoEvento.id ? 'Atualizar' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 