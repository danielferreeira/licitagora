import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Autocomplete,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  FormHelperText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  Domain as DomainIcon,
  Place as PlaceIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:3001/api';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ramosAtividade = [
  'Construção Civil',
  'Tecnologia',
  'Saúde',
  'Educação',
  'Alimentação',
  'Transporte',
  'Varejo',
  'Serviços',
  'Indústria',
  'Outros'
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function NovoClienteDialog({ open, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cnpjError, setCnpjError] = useState('');
  const [formData, setFormData] = useState({
    razao_social: '',
    cnpj: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    ramos_atividade: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cnpj') {
      const formattedCnpj = formatCNPJ(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedCnpj
      }));
      validateCNPJ(formattedCnpj);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const formatCNPJ = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 14 dígitos
    const truncated = numbers.slice(0, 14);
    
    // Aplica a máscara: 99.999.999/9999-99
    return truncated.replace(
      /^(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/,
      function(match, g1, g2, g3, g4, g5) {
        if (g5) return `${g1}.${g2}.${g3}/${g4}-${g5}`;
        if (g4) return `${g1}.${g2}.${g3}/${g4}`;
        if (g3) return `${g1}.${g2}.${g3}`;
        if (g2) return `${g1}.${g2}`;
        return g1;
      }
    );
  };

  const validateCNPJ = (cnpj) => {
    const numbers = cnpj.replace(/\D/g, '');
    if (numbers.length !== 14) {
      setCnpjError('CNPJ deve conter 14 dígitos');
      return false;
    }
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) {
      setCnpjError('CNPJ inválido');
      return false;
    }

    setCnpjError('');
    return true;
  };

  const formatCEP = (cep) => cep.replace(/\D/g, '');

  const buscarCEP = async () => {
    const cepLimpo = formatCEP(formData.cep);
    if (cepLimpo.length !== 8) {
      toast.error('CEP inválido. Digite 8 números.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = response.data;

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCEPChange = (e) => {
    const { value } = e.target;
    // Permite apenas números e limita a 8 dígitos
    const cepLimpo = value.replace(/\D/g, '').slice(0, 8);
    // Formata o CEP (00000-000)
    const cepFormatado = cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
    
    setFormData(prev => ({
      ...prev,
      cep: cepFormatado
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Iniciando submit do formulário');
    console.log('Dados do formulário:', formData);
    
    // Validação dos campos obrigatórios
    const camposObrigatorios = ['razao_social', 'cnpj', 'email', 'telefone', 'cidade', 'estado'];
    const camposFaltando = camposObrigatorios.filter(campo => !formData[campo]);
    
    if (camposFaltando.length > 0) {
      console.log('Campos obrigatórios faltando:', camposFaltando);
      toast.error(`Preencha todos os campos obrigatórios: ${camposFaltando.join(', ')}`);
      return;
    }

    if (!validateCNPJ(formData.cnpj)) {
      console.log('CNPJ inválido:', formData.cnpj);
      toast.error('CNPJ inválido');
      return;
    }

    if (!formData.ramos_atividade || formData.ramos_atividade.length === 0) {
      console.log('Nenhum ramo de atividade selecionado');
      toast.error('Selecione pelo menos um ramo de atividade');
      return;
    }

    try {
      // Remove formatação do CNPJ e telefone antes de enviar
      const dadosParaEnviar = {
        razao_social: formData.razao_social.trim(),
        cnpj: formData.cnpj.replace(/\D/g, ''),
        email: formData.email.trim(),
        telefone: formData.telefone.replace(/\D/g, ''),
        cep: formData.cep ? formData.cep.replace(/\D/g, '') : null,
        endereco: formData.endereco ? formData.endereco.trim() : null,
        numero: formData.numero ? formData.numero.trim() : null,
        complemento: formData.complemento ? formData.complemento.trim() : null,
        bairro: formData.bairro ? formData.bairro.trim() : null,
        cidade: formData.cidade.trim(),
        estado: formData.estado.trim(),
        ramos_atividade: formData.ramos_atividade
      };

      console.log('Dados que serão enviados para a API:', dadosParaEnviar);
      console.log('URL da API:', `${API_URL}/clientes`);

      const response = await axios.post(`${API_URL}/clientes`, dadosParaEnviar);
      console.log('Resposta da API:', response.data);
      
      toast.success('Cliente cadastrado com sucesso!');
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro detalhado ao cadastrar cliente:', error);
      console.error('Mensagem de erro:', error.message);
      if (error.response) {
        console.error('Dados da resposta de erro:', error.response.data);
        console.error('Status do erro:', error.response.status);
        toast.error(`Erro ao cadastrar cliente: ${error.response.data.error || 'Erro desconhecido'}`);
      } else if (error.request) {
        console.error('Erro na requisição:', error.request);
        toast.error('Erro de conexão com o servidor');
      } else {
        toast.error('Erro ao cadastrar cliente');
      }
    }
  };

  const handleRamoChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData(prev => ({
      ...prev,
      ramos_atividade: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const PreviewPanel = () => (
    <Box sx={{ p: 2, height: '100%', bgcolor: 'background.paper' }}>
      <List>
        <ListItem>
          <ListItemIcon>
            <BusinessIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Dados da Empresa"
            secondary={
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" paragraph>
                  <strong>Razão Social:</strong> {formData.razao_social || 'Não informado'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>CNPJ:</strong> {formData.cnpj || 'Não informado'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Email:</strong> {formData.email || 'Não informado'}
                </Typography>
                <Typography variant="body2">
                  <strong>Telefone:</strong> {formData.telefone || 'Não informado'}
                </Typography>
              </Box>
            }
          />
        </ListItem>

        <Divider sx={{ my: 2 }} />

        <ListItem>
          <ListItemIcon>
            <PlaceIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Endereço"
            secondary={
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" paragraph>
                  <strong>CEP:</strong> {formData.cep || 'Não informado'}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Endereço:</strong> {`${formData.endereco || ''} ${formData.numero || ''} ${formData.complemento ? `, ${formData.complemento}` : ''}`}
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Bairro:</strong> {formData.bairro || 'Não informado'}
                </Typography>
                <Typography variant="body2">
                  <strong>Cidade/Estado:</strong> {`${formData.cidade || ''} ${formData.estado ? `- ${formData.estado}` : ''}`}
                </Typography>
              </Box>
            }
          />
        </ListItem>

        <Divider sx={{ my: 2 }} />

        <ListItem>
          <ListItemIcon>
            <DomainIcon color="primary" />
          </ListItemIcon>
          <ListItemText
            primary="Ramos de Atividade"
            secondary={
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.ramos_atividade.length > 0 ? (
                  formData.ramos_atividade.map((ramo, index) => (
                    <Chip
                      key={index}
                      label={ramo}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))
                ) : (
                  <Typography variant="body2">Nenhum ramo selecionado</Typography>
                )}
              </Box>
            }
          />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: '80vh' }
      }}
    >
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
        Cadastrar Novo Cliente
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        <TabPanel value={activeTab} index={0}>
          <form onSubmit={handleSubmit} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Dados do Cliente
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      required
                      fullWidth
                      label="Razão Social"
                      name="razao_social"
                      value={formData.razao_social}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="CNPJ"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      error={!!cnpjError}
                      helperText={cnpjError}
                      placeholder="00.000.000/0000-00"
                      inputProps={{
                        maxLength: 18
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Telefone"
                      name="telefone"
                      value={formData.telefone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Endereço
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="CEP"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCEPChange}
                      onBlur={buscarCEP}
                      placeholder="00000-000"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={buscarCEP}
                              disabled={loading}
                              edge="end"
                            >
                              {loading ? <CircularProgress size={24} /> : <SearchIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOnIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Endereço"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      label="Número"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Complemento"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Bairro"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={formData.estado}
                        label="Estado"
                        name="estado"
                        onChange={handleChange}
                      >
                        {estados.map((estado) => (
                          <MenuItem key={estado} value={estado}>
                            {estado}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom color="primary">
                  Ramos de Atividade
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Ramos de Atividade</InputLabel>
                      <Select
                        multiple
                        value={formData.ramos_atividade}
                        onChange={handleRamoChange}
                        label="Ramos de Atividade"
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} />
                            ))}
                          </Box>
                        )}
                      >
                        {ramosAtividade.map((ramo) => (
                          <MenuItem key={ramo} value={ramo}>
                            {ramo}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Box>
            
            <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
              <Button 
                onClick={onClose}
                variant="outlined"
                color="primary"
                sx={{ minWidth: 100 }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="contained"
                color="primary"
                sx={{ minWidth: 100 }}
                disabled={!!cnpjError}
              >
                Cadastrar
              </Button>
            </DialogActions>
          </form>
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <PreviewPanel />
        </TabPanel>
      </DialogContent>
    </Dialog>
  );
} 