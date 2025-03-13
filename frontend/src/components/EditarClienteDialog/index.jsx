import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  OutlinedInput,
  IconButton,
  CircularProgress,
  Typography,
  Alert,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, LocationOn as LocationOnIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { clienteService } from '../../services/supabase';
import axios from 'axios';

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const ramosAtividade = [
  'Construção Civil',
  'Tecnologia da Informação',
  'Serviços de Limpeza',
  'Manutenção',
  'Consultoria',
  'Fornecimento de Materiais',
  'Outros'
];

export default function EditarClienteDialog({ open, cliente, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
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
    ramos_atividade: []
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cliente) {
      setFormData(cliente);
    }
  }, [cliente]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.razao_social.trim()) {
      newErrors.razao_social = 'Razão Social é obrigatória';
    } else if (formData.razao_social.length > 100) {
      newErrors.razao_social = 'Razão Social deve ter no máximo 100 caracteres';
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    let formattedValue = value;

    // Formatação específica para cada campo
    switch (name) {
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }
    
    setLoading(true);

    try {
      await clienteService.atualizarCliente(cliente.id, formData);
      toast.success('Cliente atualizado com sucesso!');
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      toast.error(error.message || 'Erro ao atualizar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
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
          Editar Cliente
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Razão Social"
                name="razao_social"
                value={formData.razao_social}
                onChange={handleChange}
                error={!!errors.razao_social}
                helperText={errors.razao_social}
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
                disabled
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
                error={!!errors.telefone}
                helperText={errors.telefone}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="CEP"
                name="cep"
                value={formData.cep}
                onChange={handleChange}
                error={!!errors.cep}
                helperText={errors.cep}
                InputProps={{
                  endAdornment: (
                    <IconButton 
                      size="small" 
                      onClick={() => buscarCep(formData.cep)}
                      disabled={!formData.cep || formData.cep.replace(/\D/g, '').length !== 8}
                    >
                      <LocationOnIcon color={formData.cep && formData.cep.replace(/\D/g, '').length === 8 ? 'primary' : 'disabled'} />
                    </IconButton>
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
                label="Bairro"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
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
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Ramos de Atividade</InputLabel>
                <Select
                  multiple
                  name="ramos_atividade"
                  value={formData.ramos_atividade || []}
                  onChange={handleChange}
                  input={<OutlinedInput label="Ramos de Atividade" />}
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
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid rgba(0, 0, 0, 0.12)' }}>
          <Button 
            onClick={onClose}
            variant="outlined"
            color="primary"
            sx={{ minWidth: 100 }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained"
            color="primary"
            sx={{ minWidth: 100 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
} 