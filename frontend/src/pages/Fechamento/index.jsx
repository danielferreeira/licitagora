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
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatCurrency } from '../../utils/format';

const API_URL = 'http://localhost:3001/api';

export default function Fechamento() {
  const [licitacoes, setLicitacoes] = useState([]);
  const [licitacoesFiltradas, setLicitacoesFiltradas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [licitacaoSelecionada, setLicitacaoSelecionada] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dadosFechamento, setDadosFechamento] = useState({
    valor_final: '',
    lucro_final: '',
    foi_ganha: '',
    motivo_perda: ''
  });

  useEffect(() => {
    carregarLicitacoes();
  }, []);

  useEffect(() => {
    filtrarLicitacoes();
  }, [filtro, licitacoes]);

  const carregarLicitacoes = async () => {
    try {
      const response = await axios.get(`${API_URL}/licitacoes`);
      setLicitacoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar licitações:', error);
      toast.error('Erro ao carregar licitações');
    }
  };

  const filtrarLicitacoes = () => {
    if (!filtro) {
      setLicitacoesFiltradas(licitacoes.filter(l => l.status === 'Em Andamento'));
      return;
    }
    const filtroLower = filtro.toLowerCase();
    const filtradas = licitacoes.filter(licitacao => 
      (licitacao.status === 'Em Andamento') && (
        licitacao.numero.toLowerCase().includes(filtroLower) ||
        licitacao.orgao.toLowerCase().includes(filtroLower) ||
        licitacao.objeto.toLowerCase().includes(filtroLower)
      )
    );
    setLicitacoesFiltradas(filtradas);
  };

  const handleFecharLicitacao = async () => {
    try {
      // Validações
      if (!dadosFechamento.valor_final || isNaN(parseFloat(dadosFechamento.valor_final))) {
        toast.error('Informe um valor final válido');
        return;
      }

      if (!dadosFechamento.lucro_final || isNaN(parseFloat(dadosFechamento.lucro_final))) {
        toast.error('Informe um lucro final válido');
        return;
      }

      if (dadosFechamento.foi_ganha === '') {
        toast.error('Selecione se a licitação foi ganha ou perdida');
        return;
      }

      if (!dadosFechamento.foi_ganha && !dadosFechamento.motivo_perda) {
        toast.error('Informe o motivo da perda');
        return;
      }

      const dadosParaEnviar = {
        ...dadosFechamento,
        valor_final: parseFloat(dadosFechamento.valor_final),
        lucro_final: parseFloat(dadosFechamento.lucro_final),
        foi_ganha: Boolean(dadosFechamento.foi_ganha),
        status: 'Finalizada'
      };

      await axios.put(`${API_URL}/licitacoes/${licitacaoSelecionada.id}/fechamento`, dadosParaEnviar);
      
      toast.success('Licitação fechada com sucesso');
      setOpenDialog(false);
      carregarLicitacoes();
      setLicitacaoSelecionada(null);
      setDadosFechamento({
        valor_final: '',
        lucro_final: '',
        foi_ganha: '',
        motivo_perda: ''
      });
    } catch (error) {
      console.error('Erro ao fechar licitação:', error);
      const mensagemErro = error.response?.data?.error || 
                          error.message || 
                          'Erro ao fechar licitação. Tente novamente.';
      toast.error(mensagemErro);
    }
  };

  const handleSelecionarLicitacao = (licitacao) => {
    setLicitacaoSelecionada(licitacao);
    setDadosFechamento({
      valor_final: licitacao.valor_estimado || '',
      lucro_final: licitacao.lucro_estimado || '',
      foi_ganha: '',
      motivo_perda: ''
    });
    setOpenDialog(true);
  };

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
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Licitações em Andamento
              </Typography>

              <TextField
                fullWidth
                label="Buscar Licitação"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Digite o número, órgão ou objeto"
                size="small"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filtro && (
                    <IconButton size="small" onClick={() => setFiltro('')}>
                      <ClearIcon />
                    </IconButton>
                  )
                }}
              />

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
                    onClick={() => handleSelecionarLicitacao(licitacao)}
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
                          <Chip
                            label={formatCurrency(licitacao.valor_estimado)}
                            size="small"
                            color="primary"
                          />
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
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Licitações Finalizadas
              </Typography>

              <List sx={{ 
                maxHeight: 'calc(100vh - 250px)',
                overflow: 'auto'
              }}>
                {licitacoes
                  .filter(l => l.status === 'Finalizada')
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
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {licitacao.numero}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {licitacao.foi_ganha ? (
                                <Chip
                                  icon={<CheckCircleIcon />}
                                  label="Ganha"
                                  color="success"
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  icon={<CancelIcon />}
                                  label="Perdida"
                                  color="error"
                                  size="small"
                                />
                              )}
                              <Chip
                                label={formatCurrency(licitacao.valor_final)}
                                size="small"
                                color={licitacao.foi_ganha ? "success" : "error"}
                              />
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
                          </>
                        }
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Fechar Licitação
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Valor Final"
              type="number"
              value={dadosFechamento.valor_final}
              onChange={(e) => setDadosFechamento({ ...dadosFechamento, valor_final: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />

            <TextField
              label="Lucro Final"
              type="number"
              value={dadosFechamento.lucro_final}
              onChange={(e) => setDadosFechamento({ ...dadosFechamento, lucro_final: e.target.value })}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Resultado</InputLabel>
              <Select
                value={dadosFechamento.foi_ganha}
                onChange={(e) => setDadosFechamento({ ...dadosFechamento, foi_ganha: e.target.value })}
                label="Resultado"
              >
                <MenuItem value={true}>Ganha</MenuItem>
                <MenuItem value={false}>Perdida</MenuItem>
              </Select>
            </FormControl>

            {dadosFechamento.foi_ganha === false && (
              <TextField
                label="Motivo da Perda"
                multiline
                rows={3}
                value={dadosFechamento.motivo_perda}
                onChange={(e) => setDadosFechamento({ ...dadosFechamento, motivo_perda: e.target.value })}
                fullWidth
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleFecharLicitacao}
            variant="contained"
            disabled={!dadosFechamento.valor_final || !dadosFechamento.lucro_final || dadosFechamento.foi_ganha === ''}
          >
            Fechar Licitação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 