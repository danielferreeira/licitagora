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
  Snackbar,
  Alert,
  CircularProgress,
  Backdrop,
  Tooltip,
  Skeleton,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addDays, isAfter, isBefore, isToday } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';
import { prazoService, licitacaoService } from '../../services/supabase';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    setError(null);
    try {
      // Carregar licitações e prazos simultaneamente
      const [prazosData, licitacoesData] = await Promise.all([
        prazoService.listarPrazos(),
        licitacaoService.listarLicitacoes()
      ]);

      // Atualizar lista de licitações
      setLicitacoes(licitacoesData || []);
      
      // Criar eventos a partir dos prazos
      const eventos = (prazosData || [])
        .filter(prazo => prazo.data_prazo) // Filtrar apenas prazos com data
        .map(prazo => {
          try {
            const data = new Date(prazo.data_prazo);
            
            // Verificar se a data é válida
            if (isNaN(data.getTime())) {
              console.error('Data inválida:', {
                prazo: prazo.titulo,
                data: prazo.data_prazo
              });
              return null;
            }

            // Criar evento para o calendário
            return {
              id: prazo.id,
              title: prazo.licitacao 
                ? `${prazo.licitacao.numero} - ${prazo.titulo || 'Prazo'}`
                : prazo.titulo,
              start: data,
              end: data,
              allDay: true,
              resource: {
                titulo: prazo.titulo,
                licitacao_id: prazo.licitacao?.id,
                licitacao_numero: prazo.licitacao?.numero,
                licitacao_orgao: prazo.licitacao?.orgao,
                licitacao_objeto: prazo.licitacao?.objeto,
                licitacao_status: prazo.licitacao?.status,
                observacoes: prazo.observacoes,
                data_prazo: prazo.data_prazo
              }
            };
          } catch (err) {
            console.error('Erro ao processar evento:', {
              prazo,
              erro: err.message
            });
            return null;
          }
        })
        .filter(Boolean); // Remover eventos nulos

      setEventos(eventos);
      setDate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados: ' + (error.message || ''));
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
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
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    
    setEventDetailsOpen(false);
    
    const dataFormatada = format(new Date(selectedEvent.start), "yyyy-MM-dd'T'HH:mm");
    
    setNovoEvento({
      id: selectedEvent.id,
      titulo: selectedEvent.resource.titulo || '',
      data_prazo: dataFormatada,
      observacoes: selectedEvent.resource.observacoes || '',
      licitacao_id: selectedEvent.resource.licitacao_id || '',
    });
    
    setOpenDialog(true);
  };

  const handleSalvarEvento = async () => {
    try {
      const dadosPrazo = {
        titulo: novoEvento.titulo,
        data_prazo: new Date(novoEvento.data_prazo).toISOString(),
        observacoes: novoEvento.observacoes,
        licitacao_id: novoEvento.licitacao_id || null
      };
      
      if (novoEvento.id) {
        // Atualizar prazo existente
        await prazoService.atualizarPrazo(novoEvento.id, dadosPrazo);
        toast.success('Prazo atualizado com sucesso');
      } else {
        // Criar novo prazo
        await prazoService.criarPrazo(dadosPrazo);
        toast.success('Prazo adicionado com sucesso');
      }
      
      setOpenDialog(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao salvar prazo:', error);
      setError('Erro ao salvar prazo: ' + (error.message || ''));
      toast.error('Erro ao salvar prazo');
    }
  };

  const handleExcluirEvento = async () => {
    if (!novoEvento.id) return;
    
    try {
      await prazoService.excluirPrazo(novoEvento.id);
      toast.success('Prazo excluído com sucesso');
      setOpenDialog(false);
      setConfirmDelete(false);
      carregarDados();
    } catch (error) {
      console.error('Erro ao excluir prazo:', error);
      setError('Erro ao excluir prazo: ' + (error.message || ''));
      toast.error('Erro ao excluir prazo');
    }
  };

  const eventStyleGetter = (event) => {
    let backgroundColor = '#3174ad'; // Cor padrão
    let fontWeight = 'normal';
    
    // Verificar se o prazo é para hoje
    if (isToday(new Date(event.start))) {
      fontWeight = 'bold';
    }
    
    // Verificar se o prazo já passou
    if (isBefore(new Date(event.start), new Date()) && !isToday(new Date(event.start))) {
      backgroundColor = '#9e9e9e'; // Cinza para prazos passados
    }

    if (event.resource.licitacao_status) {
      switch (event.resource.licitacao_status) {
        case 'EM_ANALISE':
          backgroundColor = '#ff9800'; // Laranja
          break;
        case 'EM_ANDAMENTO':
          backgroundColor = '#2196f3'; // Azul
          break;
        case 'FINALIZADA':
        case 'CONCLUIDA':
          backgroundColor = '#4caf50'; // Verde
          break;
        case 'CANCELADA':
        case 'FRACASSADA':
        case 'DESERTA':
          backgroundColor = '#f44336'; // Vermelho
          break;
        default:
          break;
      }
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0',
        display: 'block',
        fontWeight
      }
    };
  };

  const handleImportarPrazos = async () => {
    try {
      setLoading(true);
      await prazoService.importarPrazos();
      toast.success('Prazos importados com sucesso');
      carregarDados();
    } catch (error) {
      console.error('Erro ao importar prazos:', error);
      setError('Erro ao importar prazos: ' + (error.message || ''));
      toast.error('Erro ao importar prazos');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'EM_ANDAMENTO':
        return 'Em Andamento';
      case 'CONCLUIDA':
        return 'Concluída';
      case 'CANCELADA':
        return 'Cancelada';
      case 'SUSPENSA':
        return 'Suspensa';
      case 'FRACASSADA':
        return 'Fracassada';
      case 'DESERTA':
        return 'Deserta';
      default:
        return status;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          Prazos
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Tooltip title="Atualiza a lista de prazos existentes no sistema">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={carregarDados}
              disabled={loading}
            >
              Atualizar
            </Button>
          </Tooltip>
          <Tooltip title="Cria automaticamente novos prazos a partir das datas de licitações cadastradas">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleImportarPrazos}
              disabled={loading}
            >
              Importar Prazos
            </Button>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNovoEvento}
            disabled={loading}
          >
            Novo Prazo
          </Button>
        </Box>
      </Box>

      <Paper sx={{ height: 'calc(100vh - 180px)', p: 2 }}>
        {loading ? (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Calendar
            localizer={localizer}
            events={eventos}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            messages={messages}
            culture="pt-BR"
            view={view}
            onView={handleViewChange}
            date={date}
            onNavigate={handleNavigate}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
          />
        )}
      </Paper>

      {/* Dialog de detalhes do evento */}
      <Dialog 
        open={eventDetailsOpen} 
        onClose={() => setEventDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              Detalhes do Prazo
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6">
                  {selectedEvent.title}
                </Typography>
                
                <Typography variant="body1">
                  <strong>Data:</strong> {format(new Date(selectedEvent.start), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </Typography>
                
                {selectedEvent.resource.licitacao_orgao && (
                  <Typography variant="body1">
                    <strong>Órgão:</strong> {selectedEvent.resource.licitacao_orgao}
                  </Typography>
                )}
                
                {selectedEvent.resource.licitacao_objeto && (
                  <Typography variant="body1">
                    <strong>Objeto:</strong> {selectedEvent.resource.licitacao_objeto}
                  </Typography>
                )}
                
                {selectedEvent.resource.licitacao_status && (
                  <Typography variant="body1">
                    <strong>Status:</strong> {getStatusDisplay(selectedEvent.resource.licitacao_status)}
                  </Typography>
                )}
                
                {selectedEvent.resource.observacoes && (
                  <Typography variant="body1">
                    <strong>Observações:</strong> {selectedEvent.resource.observacoes}
                  </Typography>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setEventDetailsOpen(false)}
              >
                Fechar
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEditEvent}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Dialog de novo/editar evento */}
      <Dialog open={openDialog} onClose={handleFecharDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {novoEvento.id ? 'Editar Prazo' : 'Novo Prazo'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Licitação</InputLabel>
              <Select
                value={novoEvento.licitacao_id || ''}
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
              label="Título"
              value={novoEvento.titulo}
              onChange={(e) => setNovoEvento({ ...novoEvento, titulo: e.target.value })}
              fullWidth
              required={!novoEvento.licitacao_id}
              error={!novoEvento.titulo && !novoEvento.licitacao_id}
              helperText={!novoEvento.titulo && !novoEvento.licitacao_id ? 'Informe um título ou selecione uma licitação' : ''}
            />

            <TextField
              label="Data e Hora"
              type="datetime-local"
              value={novoEvento.data_prazo}
              onChange={(e) => setNovoEvento({ ...novoEvento, data_prazo: e.target.value })}
              fullWidth
              required
              error={!novoEvento.data_prazo}
              helperText={!novoEvento.data_prazo ? 'Informe a data e hora do prazo' : ''}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              label="Observações"
              value={novoEvento.observacoes}
              onChange={(e) => setNovoEvento({ ...novoEvento, observacoes: e.target.value })}
              fullWidth
              multiline
              rows={4}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {novoEvento.id && (
            <Button
              onClick={() => setConfirmDelete(true)}
              color="error"
              startIcon={<DeleteIcon />}
            >
              Excluir
            </Button>
          )}
          <Button onClick={handleFecharDialog}>Cancelar</Button>
          <Button
            onClick={handleSalvarEvento}
            variant="contained"
            disabled={!novoEvento.data_prazo || (!novoEvento.titulo && !novoEvento.licitacao_id)}
          >
            {novoEvento.id ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este prazo? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancelar</Button>
          <Button onClick={handleExcluirEvento} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backdrop durante carregamento */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading && eventos.length > 0}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Snackbar para erros */}
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