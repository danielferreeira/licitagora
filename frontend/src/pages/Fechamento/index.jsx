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

// Funções de manipulação de valores monetários
const formatarValorMonetario = (valor) => {
  if (valor === null || valor === undefined || valor === '') return '';
  
  // Remove tudo exceto números
  let valorLimpo = valor.toString().replace(/[^\d]/g, '');
  
  // Se não houver valor, retorna vazio
  if (!valorLimpo) return '';
  
  // Retorna apenas os números
  return valorLimpo;
};

const converterParaNumero = (valor) => {
  if (!valor) return null;
  
  // Remove tudo exceto números
  const valorLimpo = valor.toString().replace(/[^\d]/g, '');
  
  // Se não há valor após a limpeza, retorna null
  if (!valorLimpo) return null;
  
  // Converte para número inteiro
  const valorNumerico = parseInt(valorLimpo, 10);
  
  return isNaN(valorNumerico) ? null : valorNumerico;
};

const validarValorMonetario = (valor) => {
  if (!valor) return false;
  
  const numero = converterParaNumero(valor);
  return numero !== null && numero >= 0;
};

// Função para formatar número para exibição
const formatarNumeroParaExibicao = (numero) => {
  if (numero === null || numero === undefined) return '';
  
  // Converte para número inteiro e depois para string
  return Math.floor(Number(numero)).toString();
};

// Função para converter valor para número
const parseCurrencyValue = (value) => {
  return converterParaNumero(value);
};

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
      console.log('=== INÍCIO DO PROCESSO DE FECHAMENTO ===');
      console.log('1. Valores do formulário:', {
        valor_final_original: dadosFechamento.valor_final,
        lucro_final_original: dadosFechamento.lucro_final
      });
      
      // Converte os valores para números
      const valorFinal = converterParaNumero(dadosFechamento.valor_final);
      const lucroFinal = converterParaNumero(dadosFechamento.lucro_final);

      console.log('2. Valores após conversão:', {
        valorFinal,
        lucroFinal,
        valorFinal_tipo: typeof valorFinal,
        lucroFinal_tipo: typeof lucroFinal
      });

      if (valorFinal === null || lucroFinal === null) {
        toast.error('Por favor, insira valores válidos');
        return;
      }

      if (typeof dadosFechamento.foi_ganha !== 'boolean') {
        toast.error('Por favor, selecione se a licitação foi ganha ou perdida');
        return;
      }

      if (!dadosFechamento.foi_ganha && !dadosFechamento.motivo_perda?.trim()) {
        toast.error('Por favor, informe o motivo da perda');
        return;
      }

      const dadosParaEnviar = {
        valor_final: valorFinal,
        lucro_final: lucroFinal,
        foi_ganha: dadosFechamento.foi_ganha,
        motivo_perda: dadosFechamento.foi_ganha ? null : dadosFechamento.motivo_perda.trim(),
        status: 'Finalizada',
        data_fechamento: new Date().toISOString()
      };

      console.log('3. Dados para enviar:', dadosParaEnviar);

      const response = await axios.put(`${API_URL}/licitacoes/${licitacaoSelecionada.id}/fechamento`, dadosParaEnviar);

      console.log('4. Resposta do servidor:', response.data);

      if (response.status === 200) {
        const licitacaoAtualizada = response.data;
        const novaLista = licitacoes.map(licitacao => 
          licitacao.id === licitacaoSelecionada.id ? licitacaoAtualizada : licitacao
        );

        setLicitacoes(novaLista);
        setLicitacoesFiltradas(novaLista.filter(l => l.status === 'Em Andamento'));
        setOpenDialog(false);
        setDadosFechamento({
          valor_final: '',
          lucro_final: '',
          foi_ganha: '',
          motivo_perda: ''
        });
        toast.success('Licitação fechada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao fechar licitação:', error);
      toast.error('Erro ao fechar licitação');
    }
  };

  const handleAbrirDialog = (licitacao) => {
    setLicitacaoSelecionada(licitacao);
    
    // Inicializa com valores vazios
    setDadosFechamento({
      valor_final: '',
      lucro_final: '',
      foi_ganha: '',
      motivo_perda: ''
    });
    
    // Se tiver valores estimados, formata para exibição
    if (licitacao.valor_estimado !== null && licitacao.valor_estimado !== undefined) {
      setDadosFechamento(prev => ({
        ...prev,
        valor_final: formatarNumeroParaExibicao(licitacao.valor_estimado)
      }));
    }
    
    if (licitacao.lucro_estimado !== null && licitacao.lucro_estimado !== undefined) {
      setDadosFechamento(prev => ({
        ...prev,
        lucro_final: formatarNumeroParaExibicao(licitacao.lucro_estimado)
      }));
    }
    
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
                    onClick={() => handleAbrirDialog(licitacao)}
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
              value={dadosFechamento.valor_final}
              onChange={(e) => {
                const novoValor = formatarValorMonetario(e.target.value);
                setDadosFechamento(prev => ({
                  ...prev,
                  valor_final: novoValor
                }));
              }}
              error={dadosFechamento.valor_final !== '' && !validarValorMonetario(dadosFechamento.valor_final)}
              helperText={
                dadosFechamento.valor_final !== '' && !validarValorMonetario(dadosFechamento.valor_final)
                  ? 'Valor inválido'
                  : 'Use apenas números'
              }
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              inputProps={{
                inputMode: 'numeric',
              }}
            />

            <TextField
              label="Lucro Final"
              value={dadosFechamento.lucro_final}
              onChange={(e) => {
                const novoValor = formatarValorMonetario(e.target.value);
                setDadosFechamento(prev => ({
                  ...prev,
                  lucro_final: novoValor
                }));
              }}
              error={dadosFechamento.lucro_final !== '' && !validarValorMonetario(dadosFechamento.lucro_final)}
              helperText={
                dadosFechamento.lucro_final !== '' && !validarValorMonetario(dadosFechamento.lucro_final)
                  ? 'Valor inválido'
                  : 'Use apenas números'
              }
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              inputProps={{
                inputMode: 'numeric',
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Resultado</InputLabel>
              <Select
                value={dadosFechamento.foi_ganha}
                onChange={(e) => setDadosFechamento(prev => ({ ...prev, foi_ganha: e.target.value }))}
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
                onChange={(e) => setDadosFechamento(prev => ({ ...prev, motivo_perda: e.target.value }))}
                fullWidth
              />
            )}

            {licitacaoSelecionada && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Valores Estimados
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Valor: {formatCurrency(licitacaoSelecionada.valor_estimado)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      Lucro: {formatCurrency(licitacaoSelecionada.lucro_estimado)}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleFecharLicitacao}
            variant="contained"
            disabled={!dadosFechamento.valor_final || !dadosFechamento.lucro_final || dadosFechamento.foi_ganha === '' || (dadosFechamento.foi_ganha === false && !dadosFechamento.motivo_perda)}
          >
            Fechar Licitação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 