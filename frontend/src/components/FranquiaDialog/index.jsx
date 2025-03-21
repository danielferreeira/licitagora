import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Typography,
  FormHelperText,
  Alert
} from '@mui/material';
import { toast } from 'react-toastify';
import { franquiaService, authService } from '../../services/supabase';
import { formatarCNPJ, formatarTelefone } from '../../utils/formatters';
import { supabase } from '../../services/supabase';

export default function FranquiaDialog({ open, franquia, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user && (user.email === 'admin@licitagora.com' || user.app_metadata?.role === 'admin')) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          onClose();
          toast.error('Acesso não autorizado. Esta operação é apenas para administradores.');
        }
      } catch (error) {
        console.error('Erro ao verificar permissões de admin:', error);
        setIsAdmin(false);
        onClose();
      }
    };

    checkAdmin();
  }, [onClose]);

  // Preencher o formulário se for edição
  useEffect(() => {
    if (franquia) {
      setFormData({
        nome: franquia.nome || '',
        cnpj: franquia.cnpj || '',
        email: franquia.email || '',
        telefone: franquia.telefone || '',
        endereco: franquia.endereco || '',
        numero: franquia.numero || '',
        bairro: franquia.bairro || '',
        cidade: franquia.cidade || '',
        estado: franquia.estado || '',
        cep: franquia.cep || ''
      });
    } else {
      // Limpar formulário para nova franquia
      setFormData({
        nome: '',
        cnpj: '',
        email: '',
        telefone: '',
        endereco: '',
        numero: '',
        bairro: '',
        cidade: '',
        estado: '',
        cep: ''
      });
    }
    setFormErrors({});
  }, [franquia, open]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    
    // Formatação para CNPJ e telefone
    if (name === 'cnpj') {
      const cnpjLimpo = value.replace(/\D/g, '');
      const cnpjFormatado = formatarCNPJ(cnpjLimpo);
      setFormData({ ...formData, [name]: cnpjFormatado });
    } else if (name === 'telefone') {
      const telefoneLimpo = value.replace(/\D/g, '');
      const telefoneFormatado = formatarTelefone(telefoneLimpo);
      setFormData({ ...formData, [name]: telefoneFormatado });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Limpar erro específico quando o campo é alterado
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: null });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nome) errors.nome = 'Nome é obrigatório';
    if (!formData.cnpj) errors.cnpj = 'CNPJ é obrigatório';
    else if (formData.cnpj.replace(/\D/g, '').length !== 14) errors.cnpj = 'CNPJ inválido';
    
    if (!formData.email) errors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email inválido';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      if (franquia) {
        // Atualizar franquia existente
        await franquiaService.atualizarFranquia(franquia.id, formData);
        toast.success('Franquia atualizada com sucesso!');
      } else {
        // Criar nova franquia apenas (sem criar usuário)
        console.log('Iniciando criação de franquia com dados:', {
          ...formData
        });
        
        const { data: resultado, error } = await supabase
          .from('franquias')
          .insert({
            nome: formData.nome,
            email: formData.email,
            cnpj: formData.cnpj?.replace(/\D/g, ''),
            telefone: formData.telefone?.replace(/\D/g, ''),
            bairro: formData.bairro,
            cidade: formData.cidade,
            estado: formData.estado,
            cep: formData.cep?.replace(/\D/g, ''),
            endereco: formData.endereco,
            numero: formData.numero,
            user_id: null // Definir como null explicitamente
          })
          .select()
          .single();
        
        console.log('Resposta da criação de franquia:', resultado);
        
        if (error) {
          throw error;
        } else {
          toast.success('Franquia criada com sucesso! Você pode criar um usuário para esta franquia depois.');
        }
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro detalhado ao salvar franquia:', {
        message: error.message,
        stack: error.stack,
        details: error.details
      });
      
      let mensagem = error.message || 'Erro desconhecido';
      
      // Verificar erros específicos
      if (mensagem.includes('violates unique constraint')) {
        if (mensagem.includes('email')) {
          mensagem = 'Já existe uma franquia cadastrada com este email';
          setFormErrors({ ...formErrors, email: 'Email já cadastrado' });
        } else if (mensagem.includes('cnpj')) {
          mensagem = 'Já existe uma franquia cadastrada com este CNPJ';
          setFormErrors({ ...formErrors, cnpj: 'CNPJ já cadastrado' });
        }
      } else if (mensagem.includes('not-null constraint')) {
        mensagem = 'Todos os campos obrigatórios devem ser preenchidos';
      }
      
      toast.error(`Erro ao ${franquia ? 'atualizar' : 'criar'} franquia: ${mensagem}`);
    } finally {
      setIsLoading(false);
    }
  };

  const buscarCep = async (cep) => {
    if (cep.length < 8) return;
    
    try {
      setIsLoading(true);
      const cepLimpo = cep.replace(/\D/g, '');
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        setFormData({
          ...formData,
          endereco: data.logradouro || formData.endereco,
          bairro: data.bairro || formData.bairro,
          cidade: data.localidade || formData.cidade,
          estado: data.uf || formData.estado
        });
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle sx={{ pb: 0 }}>
        {franquia ? "Editar Franquia" : "Cadastrar Nova Franquia"}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {!franquia && (
          <Alert severity="info" sx={{ mb: 2 }}>
            O administrador atual será automaticamente definido como o responsável pela franquia.
            Após criar a franquia, você poderá criar um usuário para acesso ao sistema.
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nome da Franquia"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.nome}
              helperText={formErrors.nome}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="CNPJ"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.cnpj}
              helperText={formErrors.cnpj}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
              disabled={!!franquia} // Não permite editar email de franquia existente
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Endereço
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="CEP"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              onBlur={(e) => buscarCep(e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Endereço"
              name="endereco"
              value={formData.endereco}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Número"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Bairro"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Cidade"
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              label="Estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              margin="normal"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 