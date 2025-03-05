import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { formatCurrency } from '../../utils/format';

const API_URL = 'http://localhost:3001/api';

export default function VisualizarLicitacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [licitacao, setLicitacao] = useState(null);

  useEffect(() => {
    carregarLicitacao();
  }, [id]);

  const carregarLicitacao = async () => {
    try {
      const response = await axios.get(`${API_URL}/licitacoes/${id}`);
      setLicitacao(response.data);
    } catch (error) {
      console.error('Erro ao carregar licitação:', error);
      toast.error('Erro ao carregar licitação');
    }
  };

  if (!licitacao) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/licitacoes')}
        sx={{ mb: 3 }}
      >
        Voltar
      </Button>

      <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Licitação {licitacao.numero}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Informações Gerais
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Cliente
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {licitacao.cliente_nome}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Órgão
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {licitacao.orgao}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Objeto
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {licitacao.objeto}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Modalidade
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {licitacao.modalidade}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Ramo de Atividade
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {licitacao.ramo_atividade}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data de Abertura
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(licitacao.data_abertura).toLocaleDateString()}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data de Fechamento
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {licitacao.data_fim ? new Date(licitacao.data_fim).toLocaleDateString() : 'Não definida'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            bgcolor: licitacao.status === 'Finalizada' ? 
              (licitacao.foi_ganha ? 'success.lighter' : 'error.lighter') : 
              'background.paper'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Status e Valores
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {licitacao.status === 'Finalizada' ? (
                    <Chip
                      icon={licitacao.foi_ganha ? <CheckCircleIcon /> : <CancelIcon />}
                      label={licitacao.foi_ganha ? "Ganha" : "Perdida"}
                      color={licitacao.foi_ganha ? "success" : "error"}
                    />
                  ) : (
                    <Chip label={licitacao.status} color="primary" />
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Valores Estimados
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Valor Estimado
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(licitacao.valor_estimado)}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Lucro Estimado
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(licitacao.lucro_estimado)}
                </Typography>
              </Box>

              {licitacao.status === 'Finalizada' && (
                <>
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>
                    Valores Finais
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Valor Final
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(licitacao.valor_final)}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Lucro Final
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(licitacao.lucro_final)}
                    </Typography>
                  </Box>

                  {!licitacao.foi_ganha && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
                        Motivo da Perda:
                      </Typography>
                      <Typography variant="body1" color="error.dark">
                        {licitacao.motivo_perda}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 