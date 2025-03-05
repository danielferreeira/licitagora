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
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const locales = {
  'pt-BR': ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

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
    data_prazo: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    observacoes: '',
    licitacao_id: '',
  });
  const [view, setView] = useState('month');
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar prazos
      const resPrazos = await axios.get(`${API_URL}/prazos`);
      console.log('Dados recebidos do servidor:', resPrazos.data);
      
      // Criar eventos a partir dos prazos
      const eventos = resPrazos.data
        .filter(prazo => prazo.licitacao_data_fim) // Filtrar apenas prazos com data_fim
        .map(prazo => {
          try {
            const dataString = prazo.licitacao_data_fim;
            console.log('Processando data:', {
              licitacao: prazo.licitacao_numero,
              dataOriginal: dataString
            });

            // Criar objeto Date diretamente da string ISO
            const data = new Date(dataString);
            
            // Verificar se a data é válida
            if (isNaN(data.getTime())) {
              console.error('Data inválida:', {
                licitacao: prazo.licitacao_numero,
                data: dataString
              });
              return null;
            }

            // Criar evento para o calendário
            const evento = {
              id: prazo.id,
              title: `${prazo.licitacao_numero} - ${prazo.licitacao_orgao}`,
              start: data,
              end: data,
              allDay: true,
              resource: {
                licitacao_id: prazo.licitacao_id,
                licitacao_numero: prazo.licitacao_numero,
                licitacao_orgao: prazo.licitacao_orgao,
                licitacao_objeto: prazo.licitacao_objeto,
                licitacao_status: prazo.licitacao_status,
                observacoes: prazo.observacoes
              }
            };

            console.log('Evento criado:', {
              titulo: evento.title,
              data: format(evento.start, 'dd/MM/yyyy'),
              status: evento.resource.licitacao_status,
              start: evento.start.toISOString()
            });

            return evento;
          } catch (err) {
            console.error('Erro ao processar evento:', {
              prazo,
              erro: err.message
            });
            return null;
          }
        })
        .filter(Boolean); // Remover eventos nulos

      console.log('Total de eventos:', eventos.length);
      console.log('Lista de eventos:', eventos.map(e => ({
        titulo: e.title,
        data: format(e.start, 'dd/MM/yyyy'),
        status: e.resource.licitacao_status
      })));

      // Definir os eventos no estado
      setEventos(eventos);
      
      // Atualizar a data do calendário para o mês atual
      setDate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    }
  };

  const handleNavigate = (newDate) => {
    setDate(newDate);
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleNovoEvento = () => {
    setNovoEvento({
      titulo: '',
      data_prazo: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
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
      data_prazo: format(start, "yyyy-MM-dd'T'HH:mm"),
      observacoes: '',
      licitacao_id: '',
    });
    setOpenDialog(true);
  };

  const handleSelectEvent = (event) => {
    // Mostrar informações da licitação
    toast.info(
      <div>
        <strong>{event.title}</strong>
        <div>Órgão: {event.resource.licitacao_orgao}</div>
        {event.resource.licitacao_objeto && <div>Objeto: {event.resource.licitacao_objeto}</div>}
        <div>Status: {event.resource.licitacao_status}</div>
        {event.resource.observacoes && <div>{event.resource.observacoes}</div>}
      </div>,
      { autoClose: 8000 }
    );
  };

  const handleSalvarEvento = async () => {
    try {
      // Converter a data para o formato aceito pelo PostgreSQL
      const dataPrazo = format(new Date(novoEvento.data_prazo), "yyyy-MM-dd HH:mm:ss");
      
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
    let backgroundColor = '#1976d2'; // Azul principal
    let fontWeight = 'normal';
    let borderLeft = '4px solid #1565c0';
    let opacity = 1;

    // Ajustar estilo baseado no status
    if (event.resource.licitacao_status === 'Em Análise') {
      backgroundColor = '#2196f3'; // Azul mais claro
      borderLeft = '4px solid #1565c0';
    } else if (event.resource.licitacao_status === 'Em Andamento') {
      backgroundColor = '#ff9800'; // Laranja
      borderLeft = '4px solid #f57c00';
      fontWeight = 'bold';
    } else if (event.resource.licitacao_status === 'Finalizada') {
      backgroundColor = '#4caf50'; // Verde
      borderLeft = '4px solid #2e7d32';
    } else if (event.resource.licitacao_status === 'Cancelada') {
      backgroundColor = '#9e9e9e'; // Cinza
      borderLeft = '4px solid #616161';
      opacity = 0.7;
    }

    return {
      style: {
        backgroundColor,
        color: 'white',
        fontWeight,
        borderRadius: '3px',
        borderLeft,
        opacity,
        border: 'none',
        display: 'block',
        padding: '2px 5px',
        margin: '1px 0',
        minHeight: '24px',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
      }
    };
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
          Calendário de Licitações
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleImportarPrazos}
          >
            Importar Prazos das Licitações
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 200px)' }}>
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 'calc(100vh - 100px)' }}
              date={date}
              onNavigate={handleNavigate}
              defaultView="month"
              view={view}
              onView={handleViewChange}
              views={['month', 'week', 'day']}
              popup
              selectable
              tooltipAccessor={event => `${event.resource.licitacao_numero} - ${event.resource.licitacao_orgao}\n${event.resource.licitacao_objeto || ''}`}
              eventPropGetter={eventStyleGetter}
              messages={messages}
              formats={{
                eventTimeRangeFormat: () => '',
                timeGutterFormat: (date, culture, localizer) =>
                  localizer.format(date, 'HH:mm', culture),
                dayFormat: 'dd/MM',
                monthHeaderFormat: (date, culture, localizer) =>
                  localizer.format(date, 'MMMM yyyy', culture),
                dayRangeHeaderFormat: ({ start, end }, culture, localizer) =>
                  `${localizer.format(start, 'dd/MM', culture)} - ${localizer.format(end, 'dd/MM', culture)}`,
                eventTimeFormat: () => ''
              }}
              components={{
                toolbar: CustomToolbar,
                event: props => {
                  const style = eventStyleGetter(props.event).style;
                  return (
                    <div 
                      title={`${props.event.resource.licitacao_numero} - ${props.event.resource.licitacao_orgao}`} 
                      style={{ 
                        ...style,
                        height: '100%', 
                        padding: '2px 5px',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ fontWeight: 'bold' }}>
                        {props.event.resource.licitacao_numero}
                      </div>
                      <div style={{ 
                        fontSize: '0.85em', 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {props.event.resource.licitacao_orgao}
                      </div>
                    </div>
                  );
                }
              }}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              dayLayoutAlgorithm="no-overlap"
            />
          </Paper>
        </Grid>
      </Grid>

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

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      mb: 2,
      '& button': {
        textTransform: 'none',
        mx: 0.5
      }
    }}>
      <Box>
        <Button variant="outlined" onClick={goToCurrent}>
          Hoje
        </Button>
        <Button variant="outlined" onClick={goToBack}>
          Anterior
        </Button>
        <Button variant="outlined" onClick={goToNext}>
          Próximo
        </Button>
      </Box>
      <Typography variant="h6">
        {format(toolbar.date, 'MMMM yyyy', { locale: ptBR })}
      </Typography>
      <Box>
        <Button 
          variant={toolbar.view === 'month' ? 'contained' : 'outlined'}
          onClick={() => toolbar.onView('month')}
        >
          Mês
        </Button>
        <Button 
          variant={toolbar.view === 'week' ? 'contained' : 'outlined'}
          onClick={() => toolbar.onView('week')}
        >
          Semana
        </Button>
        <Button 
          variant={toolbar.view === 'day' ? 'contained' : 'outlined'}
          onClick={() => toolbar.onView('day')}
        >
          Dia
        </Button>
        <Button 
          variant={toolbar.view === 'agenda' ? 'contained' : 'outlined'}
          onClick={() => toolbar.onView('agenda')}
        >
          Agenda
        </Button>
      </Box>
    </Box>
  );
}; 