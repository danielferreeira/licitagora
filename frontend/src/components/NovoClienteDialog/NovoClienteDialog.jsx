import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Divider,
  Alert,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  Domain as DomainIcon,
  Search as SearchIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { clienteService, franquiaService, authService } from '../../services/supabase';
import axios from 'axios';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function NovoClienteDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [franquias, setFranquias] = useState([]);
  const [carregandoFranquias, setCarregandoFranquias] = useState(false);
  const [formData, setFormData] = useState({
    razao_social: '',
    cnpj: '',
    email: '',
    telefone: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cnaes: [],
    franquia_id: null
  });
  const [errors, setErrors] = useState({});

  // Verificar se o usuário é admin ao carregar o componente
  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const { data } = await authService.isAdmin();
        setIsAdmin(data);
        
        if (data) {
          // Se for admin, carregar lista de franquias
          carregarFranquias();
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        setIsAdmin(false);
      }
    };
    
    verificarAdmin();
  }, []);

  // Carregar lista de franquias (somente para admin)
  const carregarFranquias = async () => {
    setCarregandoFranquias(true);
    try {
      const data = await franquiaService.listarFranquias();
      setFranquias(data);
    } catch (error) {
      console.error('Erro ao carregar franquias:', error);
      toast.error('Não foi possível carregar a lista de franquias');
    } finally {
      setCarregandoFranquias(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.razao_social.trim()) {
      newErrors.razao_social = 'Razão Social é obrigatória';
    } else if (formData.razao_social.length > 100) {
      newErrors.razao_social = 'Razão Social deve ter no máximo 100 caracteres';
    }

    if (!formData.cnpj.trim()) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!/^\d{14}$/.test(formData.cnpj.replace(/\D/g, ''))) {
      newErrors.cnpj = 'CNPJ inválido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (formData.telefone && formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone inválido';
    }

    if (!formData.cep.trim()) {
      newErrors.cep = 'CEP é obrigatório';
    } else if (formData.cep.replace(/\D/g, '').length !== 8) {
      newErrors.cep = 'CEP inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);
    try {
      await clienteService.criarCliente(formData);
      toast.success('Cliente cadastrado com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error);
      toast.error(error.message || 'Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  };

  const buscarCep = async (cep) => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) return;

    setLoading(true);
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
      if (response.data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: response.data.logradouro || '',
        bairro: response.data.bairro || '',
        cidade: response.data.localidade || '',
        estado: response.data.uf || ''
      }));
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  };

  const buscarCnpj = async () => {
    const cnpj = formData.cnpj.replace(/\D/g, '');
    if (!cnpj || cnpj.length !== 14) {
      toast.error('CNPJ inválido');
      return;
    }

    setBuscandoCnpj(true);
    try {
      // Usando a API CNPJ.ws que não tem problemas de CORS
      const response = await axios.get(`https://publica.cnpj.ws/cnpj/${cnpj}`);
      
      // Formatando o CEP para o formato 00000-000
      const cepFormatado = response.data.estabelecimento.cep ? 
        response.data.estabelecimento.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '';

      // Formatando o telefone para o formato (00) 00000-0000
      const ddd = response.data.estabelecimento.ddd || '';
      const telefone = response.data.estabelecimento.telefone || '';
      const telefoneFormatado = ddd && telefone ? 
        `(${ddd}) ${telefone.replace(/^(\d{4,5})(\d{4})$/, '$1-$2')}` : '';

      // Extraindo CNAEs
      const cnaes = [];
      
      // CNAE Principal
      if (response.data.estabelecimento.atividade_principal) {
        cnaes.push({
          codigo: response.data.estabelecimento.atividade_principal.subclasse,
          descricao: response.data.estabelecimento.atividade_principal.descricao,
          tipo: 'principal'
        });
      }
      
      // CNAEs Secundários
      if (response.data.estabelecimento.atividades_secundarias && 
          response.data.estabelecimento.atividades_secundarias.length > 0) {
        response.data.estabelecimento.atividades_secundarias.forEach(atividade => {
          cnaes.push({
            codigo: atividade.subclasse,
            descricao: atividade.descricao,
            tipo: 'secundaria'
          });
        });
      }

      setFormData(prev => ({
        ...prev,
        razao_social: response.data.razao_social || '',
        email: response.data.estabelecimento.email || '',
        telefone: telefoneFormatado,
        cep: cepFormatado,
        endereco: response.data.estabelecimento.logradouro || '',
        numero: response.data.estabelecimento.numero || '',
        bairro: response.data.estabelecimento.bairro || '',
        cidade: response.data.estabelecimento.cidade?.nome || '',
        estado: response.data.estabelecimento.estado?.sigla || '',
        cnaes: cnaes
      }));

      toast.success('Dados do CNPJ carregados com sucesso!');
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      
      // Tentativa alternativa com a API BrasilAPI
      try {
        const brasilApiResponse = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
        
        // Formatando o CEP
        const cepFormatado = brasilApiResponse.data.cep ? 
          brasilApiResponse.data.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : '';
        
        // Extraindo CNAEs
        const cnaes = [];
        
        // CNAE Principal
        if (brasilApiResponse.data.cnae_fiscal_descricao) {
          cnaes.push({
            codigo: brasilApiResponse.data.cnae_fiscal,
            descricao: brasilApiResponse.data.cnae_fiscal_descricao,
            tipo: 'principal'
          });
        }
        
        // CNAEs Secundários
        if (brasilApiResponse.data.cnaes_secundarios && 
            brasilApiResponse.data.cnaes_secundarios.length > 0) {
          brasilApiResponse.data.cnaes_secundarios.forEach(atividade => {
            cnaes.push({
              codigo: atividade.codigo,
              descricao: atividade.descricao,
              tipo: 'secundaria'
            });
          });
        }

        setFormData(prev => ({
          ...prev,
          razao_social: brasilApiResponse.data.razao_social || '',
          email: '',  // BrasilAPI não retorna email
          telefone: brasilApiResponse.data.ddd_telefone_1 || '',
          cep: cepFormatado,
          endereco: brasilApiResponse.data.logradouro || '',
          numero: brasilApiResponse.data.numero || '',
          bairro: brasilApiResponse.data.bairro || '',
          cidade: brasilApiResponse.data.municipio || '',
          estado: brasilApiResponse.data.uf || '',
          cnaes: cnaes
        }));

        toast.success('Dados do CNPJ carregados com sucesso!');
      } catch (brasilApiError) {
        console.error('Erro ao buscar CNPJ na BrasilAPI:', brasilApiError);
        toast.error('Não foi possível buscar informações do CNPJ. Tente novamente mais tarde ou preencha manualmente.');
      }
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Formatação específica para cada campo
    switch (name) {
      case 'cnpj':
        formattedValue = value.replace(/\D/g, '')
          .replace(/^(\d{2})(\d)/, '$1.$2')
          .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
          .replace(/\.(\d{3})(\d)/, '.$1/$2')
          .replace(/(\d{4})(\d)/, '$1-$2')
          .substring(0, 18);
        break;
      case 'telefone':
        formattedValue = value.replace(/\D/g, '')
          .replace(/^(\d{2})(\d)/, '($1) $2')
          .replace(/(\d)(\d{4})$/, '$1-$2')
          .substring(0, 15);
        break;
      case 'cep':
        formattedValue = value.replace(/\D/g, '')
          .replace(/^(\d{5})(\d)/, '$1-$2')
          .substring(0, 9);
        break;
      default:
        break;
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Limpa o erro do campo quando ele é alterado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Busca CEP quando completo
    if (name === 'cep' && formattedValue.replace(/\D/g, '').length === 8) {
      buscarCep(formattedValue);
    }
  };

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
      <form onSubmit={handleSubmit}>
        <DialogTitle
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 2
          }}
        >
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cadastrar Novo Cliente
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
                    <TextField
                      required
                      fullWidth
                      label="CNPJ"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleChange}
                      error={!!errors.cnpj}
                      helperText={errors.cnpj}
                      placeholder="00.000.000/0000-00"
                      inputProps={{ maxLength: 18 }}
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <IconButton 
                            onClick={buscarCnpj} 
                            disabled={buscandoCnpj || formData.cnpj.replace(/\D/g, '').length !== 14}
                            color="primary"
                            size="small"
                          >
                            {buscandoCnpj ? <CircularProgress size={20} /> : <SearchIcon />}
                          </IconButton>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      label="Razão Social"
                      name="razao_social"
                      value={formData.razao_social}
                      onChange={handleChange}
                      variant="outlined"
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
                      variant="outlined"
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
                      variant="outlined"
                    />
                  </Grid>
                  
                  {/* Campo de Franquia (somente admin) */}
                  {isAdmin && (
                    <Grid item xs={12}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel id="franquia-label">Franquia</InputLabel>
                        <Select
                          labelId="franquia-label"
                          name="franquia_id"
                          value={formData.franquia_id || ''}
                          onChange={handleChange}
                          label="Franquia"
                          startAdornment={<StoreIcon color="action" sx={{ mr: 1 }} />}
                        >
                          <MenuItem value="">
                            <em>Nenhuma franquia</em>
                          </MenuItem>
                          {franquias.map((franquia) => (
                            <MenuItem key={franquia.id} value={franquia.id}>
                              {franquia.nome} - {franquia.cnpj ? franquia.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : ''}
                            </MenuItem>
                          ))}
                        </Select>
                        {carregandoFranquias && (
                          <CircularProgress size={20} sx={{ position: 'absolute', right: 24, top: 12 }} />
                        )}
                      </FormControl>
                    </Grid>
                  )}
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
                    <TextField
                      fullWidth
                      label="CEP"
                      name="cep"
                      value={formData.cep}
                      onChange={handleChange}
                      onBlur={() => buscarCep(formData.cep)}
                      placeholder="00000-000"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Endereço"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Número"
                      name="numero"
                      value={formData.numero}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Bairro"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Estado</InputLabel>
                      <Select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        label="Estado"
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
                {formData.cnaes.length > 0 ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      CNAE Principal:
                    </Typography>
                    {formData.cnaes
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
                    
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      CNAEs Secundários:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {formData.cnaes
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
                  <Alert severity="info">
                    Os CNAEs serão carregados automaticamente ao buscar os dados pelo CNPJ.
                  </Alert>
                )}
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              minWidth: 100
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !!errors.cnpj || !!errors.cep}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              minWidth: 100
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 