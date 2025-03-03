import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Chip,
  FormHelperText,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import SearchIcon from '@mui/icons-material/Search';

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

export default function EditarClienteDialog({ open, cliente, onClose, onSave }) {
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

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cliente) {
      // Formata o CNPJ, telefone e CEP ao carregar os dados do cliente
      const formattedData = {
        ...cliente,
        cnpj: formatCNPJ(cliente.cnpj),
        telefone: formatTelefone(cliente.telefone),
        cep: formatCEP(cliente.cep || '')
      };
      setFormData(formattedData);
      setErrors({});
    }
  }, [cliente]);

  const formatCNPJ = (value) => {
    const cnpjLimpo = value.replace(/\D/g, '');
    return cnpjLimpo.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  };

  const formatTelefone = (value) => {
    const telefoneLimpo = value.replace(/\D/g, '');
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

  const formatCEP = (value) => {
    const cepLimpo = value.replace(/\D/g, '');
    return cepLimpo.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  const handleCEPChange = (e) => {
    const { value } = e.target;
    const cepLimpo = value.replace(/\D/g, '').slice(0, 8);
    const cepFormatado = cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
    
    setFormData(prev => ({
      ...prev,
      cep: cepFormatado
    }));
  };

  const buscarCEP = async () => {
    const cepLimpo = formData.cep.replace(/\D/g, '');
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

  const validarCNPJ = (cnpj) => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length !== 14) {
      return 'CNPJ deve conter 14 dígitos';
    }

    if (/^(\d)\1+$/.test(cnpjLimpo)) {
      return 'CNPJ inválido';
    }

    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;

    if (name === 'cnpj') {
      novoValor = formatCNPJ(value);
      const erro = validarCNPJ(value);
      setErrors(prev => ({
        ...prev,
        cnpj: erro
      }));
    }

    if (name === 'telefone') {
      novoValor = formatTelefone(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: novoValor
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação do CNPJ
    const erroCNPJ = validarCNPJ(formData.cnpj);
    if (erroCNPJ) {
      setErrors(prev => ({
        ...prev,
        cnpj: erroCNPJ
      }));
      return;
    }

    // Validação dos ramos de atividade
    if (formData.ramos_atividade.length === 0) {
      setErrors(prev => ({
        ...prev,
        ramos_atividade: 'Selecione pelo menos um ramo de atividade'
      }));
      return;
    }

    try {
      // Remove formatação do CNPJ e telefone antes de enviar
      const dadosParaEnvio = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        telefone: formData.telefone.replace(/\D/g, ''),
        cep: formData.cep ? formData.cep.replace(/\D/g, '') : null,
        endereco: formData.endereco ? formData.endereco.trim() : null,
        numero: formData.numero ? formData.numero.trim() : null,
        complemento: formData.complemento ? formData.complemento.trim() : null,
        bairro: formData.bairro ? formData.bairro.trim() : null,
        cidade: formData.cidade.trim(),
        estado: formData.estado.trim()
      };

      console.log('Dados para envio:', dadosParaEnvio);
      await axios.put(`${API_URL}/clientes/${cliente.id}`, dadosParaEnvio);
      toast.success('Cliente atualizado com sucesso!');
      onClose();
      onSave();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(error.response?.data?.error || 'Erro ao atualizar cliente');
    }
  };

  if (!cliente) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          py: 2
        }}
      >
        Editar Cliente
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Dados da Empresa
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Razão Social"
                name="razao_social"
                value={formData.razao_social}
                onChange={handleChange}
                required
                error={!!errors.razao_social}
                helperText={errors.razao_social}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                required
                error={!!errors.cnpj}
                helperText={errors.cnpj}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                error={!!errors.email}
                helperText={errors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                required
                error={!!errors.telefone}
                helperText={errors.telefone}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Endereço
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="CEP"
                name="cep"
                value={formData.cep}
                onChange={handleCEPChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={buscarCEP}
                        disabled={loading}
                        size="small"
                      >
                        {loading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <SearchIcon />
                        )}
                      </IconButton>
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
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Número"
                name="numero"
                value={formData.numero}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Complemento"
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                required
                error={!!errors.cidade}
                helperText={errors.cidade}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required error={!!errors.estado}>
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
                {errors.estado && (
                  <FormHelperText>{errors.estado}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
            Ramos de Atividade
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.ramos_atividade}>
                <InputLabel>Ramos de Atividade</InputLabel>
                <Select
                  multiple
                  name="ramos_atividade"
                  value={formData.ramos_atividade}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      ramos_atividade: e.target.value
                    }));
                    setErrors(prev => ({
                      ...prev,
                      ramos_atividade: ''
                    }));
                  }}
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
                {errors.ramos_atividade && (
                  <FormHelperText>{errors.ramos_atividade}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
} 