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
  Alert,
  Box,
  IconButton,
  Tooltip,
  Divider,
  InputAdornment,
  Switch,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Collapse
} from '@mui/material';
import { 
  Close as CloseIcon,
  Search as SearchIcon, 
  Business as BusinessIcon,
  Save as SaveIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
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
    cep: '',
    senha: '',
    confirmarSenha: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [criarUsuario, setCriarUsuario] = useState(true);
  const [permissoes, setPermissoes] = useState({
    GESTAO_FINANCEIRA: true,
    GESTAO_CLIENTES: true,
    GESTAO_LICITACOES: true,
    GESTAO_COLABORADORES: true,
    EXPORTAR_RELATORIOS: true,
    DASHBOARD_AVANCADO: true
  });
  const [permissoesExpandidas, setPermissoesExpandidas] = useState(false);

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
        cep: franquia.cep || '',
        senha: '',
        confirmarSenha: ''
      });
      setCriarUsuario(false); // Em edição, não criamos usuario novo
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
        cep: '',
        senha: '',
        confirmarSenha: ''
      });
      setCriarUsuario(true);
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

  const handlePermissaoChange = (event) => {
    const { name, checked } = event.target;
    setPermissoes({ ...permissoes, [name]: checked });
  };

  const togglePermissoesExpandidas = () => {
    setPermissoesExpandidas(!permissoesExpandidas);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.nome) errors.nome = 'Nome é obrigatório';
    if (!formData.cnpj) errors.cnpj = 'CNPJ é obrigatório';
    else if (formData.cnpj.replace(/\D/g, '').length !== 14) errors.cnpj = 'CNPJ inválido';
    
    if (!formData.email) errors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email inválido';

    // Validações de senha apenas quando estamos criando um novo usuário
    if (criarUsuario && !franquia) {
      if (!formData.senha) {
        errors.senha = 'Senha é obrigatória';
      } else if (formData.senha.length < 8) {
        errors.senha = 'A senha deve ter pelo menos 8 caracteres';
      }
      
      if (formData.senha !== formData.confirmarSenha) {
        errors.confirmarSenha = 'As senhas não coincidem';
      }
    }

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
      } else if (criarUsuario) {
        // Criar nova franquia COM usuário responsável
        console.log('Iniciando criação de franquia com usuário responsável:', {
          ...formData,
          senha: '************', // Ocultar senha nos logs
          permissoes: Object.entries(permissoes)
            .filter(([_, isSelected]) => isSelected)
            .map(([permissao, _]) => permissao)
        });
        
        // Preparar lista de permissões selecionadas
        const permissoesSelecionadas = Object.entries(permissoes)
          .filter(([_, isSelected]) => isSelected)
          .map(([permissao, _]) => permissao);
        
        const resultado = await franquiaService.criarFranquiaComUsuarioResponsavel({
          nome: formData.nome,
          email: formData.email,
          cnpj: formData.cnpj?.replace(/\D/g, ''),
          telefone: formData.telefone?.replace(/\D/g, ''),
          senha: formData.senha,
          permissoes: permissoesSelecionadas
        });
        
        if (!resultado.success) {
          // Verificar erros específicos
          if (resultado.campo) {
            setFormErrors({
              ...formErrors,
              [resultado.campo]: resultado.error.message
            });
          }
          throw new Error(resultado.error.message);
        }
        
        toast.success('Franquia criada com sucesso com usuário responsável!');
      } else {
        // Criar nova franquia apenas (sem criar usuário)
        console.log('Iniciando criação de franquia sem usuário:', {
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

  // Funções para mostrar/ocultar senhas
  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="span">
            {franquia ? "Editar Franquia" : "Cadastrar Nova Franquia"}
          </Typography>
        </Box>
        <Tooltip title="Fechar">
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="fechar">
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      
      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ pt: 1 }}>
          {!franquia && (
            <Alert severity="info" sx={{ mb: 3, '& .MuiAlert-message': { width: '100%' } }}>
              <Typography variant="body1" fontWeight="medium">
                Cadastro de nova franquia
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                O email informado abaixo é apenas para contato e não cria automaticamente um usuário de acesso.
                Após criar a franquia, você poderá criar um usuário de acesso utilizando o botão "Criar Usuário"
                que aparecerá na listagem.
              </Typography>
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="500" color="primary">
                Dados da Franquia
              </Typography>
              <Divider sx={{ my: 1 }} />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome da Franquia"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                error={!!formErrors.nome}
                helperText={formErrors.nome}
                disabled={isLoading}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                error={!!formErrors.cnpj}
                helperText={formErrors.cnpj}
                disabled={isLoading || !!franquia}
                inputProps={{ maxLength: 18 }}
                size="small"
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
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={isLoading || !!franquia}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                error={!!formErrors.telefone}
                helperText={formErrors.telefone}
                disabled={isLoading}
                inputProps={{ maxLength: 15 }}
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                <SearchIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
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
                placeholder="00000-000"
                helperText="Digite o CEP para auto-preencher o endereço"
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
            
            {/* Seção de usuário responsável - visível apenas ao criar nova franquia */}
            {!franquia && (
              <>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1" fontWeight="500" color="primary">
                      Usuário Responsável
                    </Typography>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={criarUsuario}
                          onChange={(e) => setCriarUsuario(e.target.checked)}
                          color="primary"
                        />
                      }
                      label="Criar usuário responsável"
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                {criarUsuario && (
                  <>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Esse usuário será o administrador da franquia e poderá gerenciar seus próprios colaboradores.
                      </Alert>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Senha"
                        name="senha"
                        type={showPassword ? "text" : "password"}
                        value={formData.senha}
                        onChange={handleChange}
                        error={!!formErrors.senha}
                        helperText={formErrors.senha}
                        disabled={isLoading}
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={toggleShowPassword}
                                edge="end"
                                size="small"
                              >
                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirmar Senha"
                        name="confirmarSenha"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmarSenha}
                        onChange={handleChange}
                        error={!!formErrors.confirmarSenha}
                        helperText={formErrors.confirmarSenha}
                        disabled={isLoading}
                        size="small"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={toggleShowConfirmPassword}
                                edge="end"
                                size="small"
                              >
                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    {/* Seção de Permissões */}
                    <Grid item xs={12} sx={{ mt: 2 }}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          py: 1
                        }}
                        onClick={togglePermissoesExpandidas}
                      >
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: 'primary.main',
                            fontWeight: 500
                          }}
                        >
                          <SecurityIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                          Permissões do Responsável
                        </Typography>
                        <IconButton size="small">
                          {permissoesExpandidas ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Collapse in={permissoesExpandidas}>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Defina as permissões que o responsável pela franquia terá no sistema.
                        </Alert>
                        
                        <FormGroup sx={{ pl: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={permissoes.GESTAO_FINANCEIRA} 
                                    onChange={handlePermissaoChange}
                                    name="GESTAO_FINANCEIRA"
                                    color="primary"
                                  />
                                }
                                label="Gestão Financeira"
                              />
                              <FormHelperText sx={{ mt: -1, ml: 4 }}>
                                Acesso a relatórios financeiros e faturamento
                              </FormHelperText>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={permissoes.GESTAO_CLIENTES} 
                                    onChange={handlePermissaoChange}
                                    name="GESTAO_CLIENTES"
                                    color="primary"
                                  />
                                }
                                label="Gestão de Clientes"
                              />
                              <FormHelperText sx={{ mt: -1, ml: 4 }}>
                                Cadastrar e editar informações de clientes
                              </FormHelperText>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={permissoes.GESTAO_LICITACOES} 
                                    onChange={handlePermissaoChange}
                                    name="GESTAO_LICITACOES"
                                    color="primary"
                                  />
                                }
                                label="Gestão de Licitações"
                              />
                              <FormHelperText sx={{ mt: -1, ml: 4 }}>
                                Gerenciar licitações e propostas
                              </FormHelperText>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={permissoes.GESTAO_COLABORADORES} 
                                    onChange={handlePermissaoChange}
                                    name="GESTAO_COLABORADORES"
                                    color="primary"
                                  />
                                }
                                label="Gestão de Colaboradores"
                              />
                              <FormHelperText sx={{ mt: -1, ml: 4 }}>
                                Criar e gerenciar colaboradores da franquia
                              </FormHelperText>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={permissoes.EXPORTAR_RELATORIOS} 
                                    onChange={handlePermissaoChange}
                                    name="EXPORTAR_RELATORIOS"
                                    color="primary"
                                  />
                                }
                                label="Exportar Relatórios"
                              />
                              <FormHelperText sx={{ mt: -1, ml: 4 }}>
                                Exportar relatórios em diversos formatos
                              </FormHelperText>
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                              <FormControlLabel
                                control={
                                  <Checkbox 
                                    checked={permissoes.DASHBOARD_AVANCADO} 
                                    onChange={handlePermissaoChange}
                                    name="DASHBOARD_AVANCADO"
                                    color="primary"
                                  />
                                }
                                label="Dashboard Avançado"
                              />
                              <FormHelperText sx={{ mt: -1, ml: 4 }}>
                                Acesso a visualizações e métricas avançadas
                              </FormHelperText>
                            </Grid>
                          </Grid>
                        </FormGroup>
                      </Collapse>
                    </Grid>
                  </>
                )}
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          variant="outlined"
          startIcon={<CloseIcon />}
        >
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={isLoading || !isAdmin}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          color="primary"
        >
          {isLoading ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 