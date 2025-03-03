import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Domain as DomainIcon,
  Home as HomeIcon
} from '@mui/icons-material';

export default function VisualizarClienteDialog({ open, cliente, onClose }) {
  if (!cliente) return null;

  const formatCEP = (cep) => {
    if (!cep) return '';
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    return cnpjLimpo.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  };

  const formatTelefone = (telefone) => {
    if (!telefone) return '';
    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length === 11) {
      return telefoneLimpo.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        '($1) $2-$3'
      );
    }
    return telefoneLimpo.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
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

      <DialogContent sx={{ mt: 2 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <BusinessIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" color="primary" gutterBottom>
                  Dados da Empresa
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body1" paragraph>
                    <strong>Razão Social:</strong> {cliente.razao_social}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    <strong>CNPJ:</strong> {formatCNPJ(cliente.cnpj)}
                  </Typography>
                </Box>
              }
            />
          </ListItem>

          <Divider variant="inset" component="li" />

          <ListItem>
            <ListItemIcon>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <EmailIcon color="primary" />
                <PhoneIcon color="primary" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" color="primary" gutterBottom>
                  Contato
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body1" paragraph>
                    <strong>Email:</strong> {cliente.email}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Telefone:</strong> {formatTelefone(cliente.telefone)}
                  </Typography>
                </Box>
              }
            />
          </ListItem>

          <Divider variant="inset" component="li" />

          <ListItem>
            <ListItemIcon>
              <HomeIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" color="primary" gutterBottom>
                  Endereço
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 1 }}>
                  {cliente.cep && (
                    <Typography variant="body1" paragraph>
                      <strong>CEP:</strong> {formatCEP(cliente.cep)}
                    </Typography>
                  )}
                  {cliente.endereco && (
                    <Typography variant="body1" paragraph>
                      <strong>Endereço:</strong> {cliente.endereco}
                      {cliente.numero && `, ${cliente.numero}`}
                      {cliente.complemento && ` - ${cliente.complemento}`}
                    </Typography>
                  )}
                  {cliente.bairro && (
                    <Typography variant="body1" paragraph>
                      <strong>Bairro:</strong> {cliente.bairro}
                    </Typography>
                  )}
                  <Typography variant="body1">
                    <strong>Cidade/Estado:</strong> {cliente.cidade} - {cliente.estado}
                  </Typography>
                </Box>
              }
            />
          </ListItem>

          <Divider variant="inset" component="li" />

          <ListItem>
            <ListItemIcon>
              <DomainIcon color="primary" fontSize="large" />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" color="primary" gutterBottom>
                  Ramos de Atividade
                </Typography>
              }
              secondary={
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {cliente.ramos_atividade.map((ramo, index) => (
                    <Chip
                      key={index}
                      label={ramo}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              }
            />
          </ListItem>
        </List>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="contained"
          onClick={onClose}
          color="primary"
          sx={{ minWidth: 100 }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
} 