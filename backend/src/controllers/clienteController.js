const Cliente = require('../models/Cliente');

const validarCamposCliente = (dados) => {
  const erros = [];
  
  // Validação dos campos obrigatórios
  const camposObrigatorios = ['razao_social', 'cnpj', 'email', 'telefone', 'cidade', 'estado', 'ramos_atividade'];
  const camposFaltando = camposObrigatorios.filter(campo => !dados[campo]);
  
  if (camposFaltando.length > 0) {
    erros.push(`Campos obrigatórios faltando: ${camposFaltando.join(', ')}`);
  }

  // Validação do CNPJ (apenas formato)
  const cnpjLimpo = dados.cnpj?.replace(/\D/g, '');
  if (!cnpjLimpo || cnpjLimpo.length !== 14) {
    erros.push('CNPJ deve conter 14 dígitos');
  }

  // Validação do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(dados.email)) {
    erros.push('Email inválido');
  }

  // Validação do estado
  const estados = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  if (!estados.includes(dados.estado)) {
    erros.push('Estado inválido');
  }

  // Validação dos ramos de atividade
  if (!Array.isArray(dados.ramos_atividade) || dados.ramos_atividade.length === 0) {
    erros.push('Selecione pelo menos um ramo de atividade');
  }

  return erros;
};

const clienteController = {
  async criar(req, res) {
    try {
      const erros = validarCamposCliente(req.body);
      if (erros.length > 0) {
        return res.status(400).json({ error: erros[0] });
      }

      console.log('Tentando criar cliente com dados:', req.body);
      const cliente = await Cliente.criar(req.body);
      console.log('Cliente criado com sucesso:', cliente);
      res.status(201).json(cliente);
    } catch (error) {
      console.error('Erro detalhado ao criar cliente:', error);
      
      // Tratamento específico para erro de CNPJ duplicado
      if (error.code === '23505' && error.constraint === 'clientes_cnpj_key') {
        return res.status(400).json({ 
          error: 'CNPJ já cadastrado' 
        });
      }

      // Outros erros do banco de dados
      if (error.code) {
        return res.status(500).json({ 
          error: 'Erro no banco de dados',
          details: error.message 
        });
      }

      res.status(500).json({ 
        error: 'Erro ao criar cliente',
        details: error.message 
      });
    }
  },

  async listar(req, res) {
    try {
      const clientes = await Cliente.listar();
      res.json(clientes);
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      res.status(500).json({ error: 'Erro ao listar clientes' });
    }
  },

  async buscarPorId(req, res) {
    try {
      const cliente = await Cliente.buscarPorId(req.params.id);
      if (cliente) {
        res.json(cliente);
      } else {
        res.status(404).json({ error: 'Cliente não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ error: 'Erro ao buscar cliente' });
    }
  },

  async atualizar(req, res) {
    try {
      const erros = validarCamposCliente(req.body);
      if (erros.length > 0) {
        return res.status(400).json({ error: erros[0] });
      }

      const cliente = await Cliente.atualizar(req.params.id, req.body);
      if (cliente) {
        res.json(cliente);
      } else {
        res.status(404).json({ error: 'Cliente não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      
      // Tratamento específico para erro de CNPJ duplicado
      if (error.code === '23505' && error.constraint === 'clientes_cnpj_key') {
        return res.status(400).json({ 
          error: 'CNPJ já cadastrado' 
        });
      }

      res.status(500).json({ error: 'Erro ao atualizar cliente' });
    }
  },

  async deletar(req, res) {
    try {
      const cliente = await Cliente.deletar(req.params.id);
      if (cliente) {
        res.json({ message: 'Cliente removido com sucesso' });
      } else {
        res.status(404).json({ error: 'Cliente não encontrado' });
      }
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      res.status(500).json({ error: 'Erro ao deletar cliente' });
    }
  }
};

module.exports = clienteController; 