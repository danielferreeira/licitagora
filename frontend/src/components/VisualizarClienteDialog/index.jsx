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
  Paper,
  Stack,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Domain as DomainIcon,
} from '@mui/icons-material';

export default function VisualizarClienteDialog({ open, cliente, onClose }) {
  if (!cliente) return null;

  // Verificar se o cliente tem CNAEs
  const temCnaes = cliente.cnaes && cliente.cnaes.length > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2
      }}>
        <IconButton
          edge="start"
          color="inherit"
          onClick={onClose}
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Detalhes do Cliente
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BusinessIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Dados da Empresa
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Razão Social
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cliente.razao_social}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    CNPJ
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cliente.cnpj}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cliente.email}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Telefone
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cliente.telefone}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocationOnIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  Endereço
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    CEP
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cliente.cep}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Endereço
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cliente.endereco}{cliente.numero ? `, ${cliente.numero}` : ''}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Bairro
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cliente.bairro}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Cidade/Estado
                  </Typography>
                  <Typography variant="body1" fontWeight={500}>
                    {cliente.cidade}{cliente.estado ? `/${cliente.estado}` : ''}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DomainIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold">
                  CNAEs
                </Typography>
              </Box>
              {temCnaes ? (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    CNAE Principal:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {cliente.cnaes
                      .filter(cnae => cnae.tipo === 'principal')
                      .map((cnae, index) => (
                        <Chip 
                          key={index}
                          label={`${cnae.codigo} - ${cnae.descricao}`}
                          color="primary"
                          sx={{ m: 0.5 }}
                        />
                      ))
                    }
                  </Box>
                  
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    CNAEs Secundários:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {cliente.cnaes
                      .filter(cnae => cnae.tipo === 'secundaria')
                      .map((cnae, index) => (
                        <Chip 
                          key={index}
                          label={`${cnae.codigo} - ${cnae.descricao}`}
                          variant="outlined"
                          sx={{ m: 0.5 }}
                        />
                      ))
                    }
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Nenhum CNAE cadastrado.
                </Typography>
              )}
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            minWidth: 100
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
} 