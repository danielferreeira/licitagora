import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';

export default function VisualizarClienteDialog({ open, cliente, onClose }) {
  if (!cliente) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onClose}
          aria-label="close"
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        Detalhes do Cliente
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Dados da Empresa
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Razão Social
                  </Typography>
                  <Typography variant="body1">
                    {cliente.razao_social}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    CNPJ
                  </Typography>
                  <Typography variant="body1">
                    {cliente.cnpj}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">
                    {cliente.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Telefone
                  </Typography>
                  <Typography variant="body1">
                    {cliente.telefone}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Endereço
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    CEP
                  </Typography>
                  <Typography variant="body1">
                    {cliente.cep}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Endereço
                  </Typography>
                  <Typography variant="body1">
                    {cliente.endereco}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Número
                  </Typography>
                  <Typography variant="body1">
                    {cliente.numero}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bairro
                  </Typography>
                  <Typography variant="body1">
                    {cliente.bairro}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cidade
                  </Typography>
                  <Typography variant="body1">
                    {cliente.cidade}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Typography variant="body1">
                    {cliente.estado}
                  </Typography>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" color="primary" gutterBottom>
                Ramos de Atividade
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {cliente.ramos_atividade.map((ramo, index) => (
                  <Chip key={index} label={ramo} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
        <Button onClick={onClose} variant="contained">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
} 