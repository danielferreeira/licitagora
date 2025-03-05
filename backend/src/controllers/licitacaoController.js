const Licitacao = require('../models/Licitacao');
const db = require('../config/database');

const validarCamposLicitacao = (dados) => {
  const erros = [];

  if (!dados.numero) erros.push('Número é obrigatório');
  if (!dados.cliente_id) erros.push('Cliente é obrigatório');
  if (!dados.orgao) erros.push('Órgão é obrigatório');
  if (!dados.objeto) erros.push('Objeto é obrigatório');
  if (!dados.data_abertura) erros.push('Data de abertura é obrigatória');
  if (!dados.valor_estimado) erros.push('Valor estimado é obrigatório');
  if (!dados.lucro_estimado) erros.push('Lucro estimado é obrigatório');
  if (!dados.modalidade) erros.push('Modalidade é obrigatória');
  if (!dados.ramo_atividade) erros.push('Ramo de atividade é obrigatório');

  // Validações específicas
  if (dados.valor_estimado && isNaN(parseFloat(dados.valor_estimado))) {
    erros.push('Valor estimado deve ser um número válido');
  }

  if (dados.lucro_estimado && isNaN(parseFloat(dados.lucro_estimado))) {
    erros.push('Lucro estimado deve ser um número válido');
  }

  if (dados.data_abertura) {
    const dataAbertura = new Date(dados.data_abertura);
    if (isNaN(dataAbertura.getTime())) {
      erros.push('Data de abertura inválida');
    }
  }

  if (dados.data_fim) {
    const dataFim = new Date(dados.data_fim);
    if (isNaN(dataFim.getTime())) {
      erros.push('Data fim inválida');
    }

    // Validar se data fim é posterior à data de abertura
    if (dados.data_abertura) {
      const dataAbertura = new Date(dados.data_abertura);
      const dataFimDate = new Date(dados.data_fim);
      if (dataFimDate < dataAbertura) {
        erros.push('Data fim deve ser posterior à data de abertura');
      }
    }
  }

  return erros;
};

const validarFiltros = (filtros) => {
  const erros = [];

  if (filtros.valor_min && isNaN(parseFloat(filtros.valor_min))) {
    erros.push('Valor mínimo deve ser um número válido');
  }

  if (filtros.valor_max && isNaN(parseFloat(filtros.valor_max))) {
    erros.push('Valor máximo deve ser um número válido');
  }

  if (filtros.data_inicio) {
    const dataInicio = new Date(filtros.data_inicio);
    if (isNaN(dataInicio.getTime())) {
      erros.push('Data inicial inválida');
    }
  }

  if (filtros.data_fim) {
    const dataFim = new Date(filtros.data_fim);
    if (isNaN(dataFim.getTime())) {
      erros.push('Data final inválida');
    }
  }

  if (filtros.data_inicio && filtros.data_fim) {
    const dataInicio = new Date(filtros.data_inicio);
    const dataFim = new Date(filtros.data_fim);
    if (dataInicio > dataFim) {
      erros.push('Data inicial não pode ser maior que a data final');
    }
  }

  if (filtros.valor_min && filtros.valor_max) {
    const valorMin = parseFloat(filtros.valor_min);
    const valorMax = parseFloat(filtros.valor_max);
    if (valorMin > valorMax) {
      erros.push('Valor mínimo não pode ser maior que o valor máximo');
    }
  }

  return erros;
};

class LicitacaoController {
  async criar(req, res) {
    try {
      const erros = validarCamposLicitacao(req.body);
      if (erros.length > 0) {
        return res.status(400).json({ error: erros.join(', ') });
      }

      // Garante que as datas estão em formato ISO
      const dadosFormatados = {
        ...req.body,
        data_abertura: req.body.data_abertura ? new Date(req.body.data_abertura).toISOString() : null,
        data_fim: req.body.data_fim ? new Date(req.body.data_fim).toISOString() : null,
        valor_estimado: parseFloat(req.body.valor_estimado),
        lucro_estimado: parseFloat(req.body.lucro_estimado)
      };

      console.log('Dados formatados para criar:', dadosFormatados); // Log para debug

      const result = await Licitacao.criar(dadosFormatados);
      res.status(201).json(result);
    } catch (error) {
      console.error('Erro ao criar licitação:', error);
      res.status(500).json({ error: 'Erro ao criar licitação: ' + error.message });
    }
  }

  async listar(req, res) {
    try {
      const query = `
        SELECT l.*, c.razao_social as cliente_nome
        FROM licitacoes l
        LEFT JOIN clientes c ON l.cliente_id = c.id
        ORDER BY l.data_abertura DESC
      `;
      const result = await db.query(query);
      res.json(result.rows);
    } catch (error) {
      console.error('Erro ao listar licitações:', error);
      res.status(500).json({ error: 'Erro ao listar licitações' });
    }
  }

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const query = `
        SELECT l.*, c.razao_social as cliente_nome
        FROM licitacoes l
        LEFT JOIN clientes c ON l.cliente_id = c.id
        WHERE l.id = $1
      `;
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao buscar licitação:', error);
      res.status(500).json({ error: 'Erro ao buscar licitação' });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;

      // Verifica se a licitação está finalizada
      const licitacaoAtual = await Licitacao.buscarPorId(id);
      
      if (!licitacaoAtual) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      if (licitacaoAtual.status === 'Finalizada') {
        return res.status(400).json({ error: 'Não é possível editar uma licitação que já foi finalizada' });
      }

      const erros = validarCamposLicitacao(req.body);
      if (erros.length > 0) {
        return res.status(400).json({ error: erros.join(', ') });
      }

      // Garante que as datas estão em formato ISO
      const dadosFormatados = {
        ...req.body,
        data_abertura: req.body.data_abertura ? new Date(req.body.data_abertura).toISOString() : null,
        data_fim: req.body.data_fim ? new Date(req.body.data_fim).toISOString() : null,
        valor_estimado: parseFloat(req.body.valor_estimado),
        lucro_estimado: parseFloat(req.body.lucro_estimado)
      };

      console.log('Dados formatados para atualizar:', dadosFormatados); // Log para debug

      const result = await Licitacao.atualizar(id, dadosFormatados);
      
      if (!result) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      res.json(result);
    } catch (error) {
      console.error('Erro ao atualizar licitação:', error);
      res.status(500).json({ error: 'Erro ao atualizar licitação: ' + error.message });
    }
  }

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const query = 'DELETE FROM licitacoes WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      res.json({ message: 'Licitação excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir licitação:', error);
      res.status(500).json({ error: 'Erro ao excluir licitação' });
    }
  }

  async fecharLicitacao(req, res) {
    try {
      const { id } = req.params;
      const { valor_final, lucro_final, foi_ganha, motivo_perda, status } = req.body;

      console.log('Dados recebidos:', { id, valor_final, lucro_final, foi_ganha, motivo_perda, status });

      // Validações mais rigorosas
      if (!valor_final || isNaN(parseFloat(valor_final))) {
        return res.status(400).json({ error: 'Valor final inválido' });
      }

      if (!lucro_final || isNaN(parseFloat(lucro_final))) {
        return res.status(400).json({ error: 'Lucro final inválido' });
      }

      if (typeof foi_ganha !== 'boolean') {
        return res.status(400).json({ error: 'O campo "foi_ganha" deve ser um booleano' });
      }

      if (foi_ganha === false && !motivo_perda?.trim()) {
        return res.status(400).json({ error: 'Motivo da perda é obrigatório quando a licitação não foi ganha' });
      }

      if (status !== 'Finalizada') {
        return res.status(400).json({ error: 'Status inválido para fechamento' });
      }

      const dadosAtualizacao = {
        valor_final: parseFloat(valor_final),
        lucro_final: parseFloat(lucro_final),
        foi_ganha: Boolean(foi_ganha),
        motivo_perda: foi_ganha ? null : motivo_perda.trim(),
        data_fechamento: new Date(),
        status: 'Finalizada'
      };

      console.log('Dados formatados para atualização:', dadosAtualizacao);

      const result = await Licitacao.fecharLicitacao(id, dadosAtualizacao);

      if (!result) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      console.log('Licitação fechada com sucesso:', result);
      res.json(result);
    } catch (error) {
      console.error('Erro ao fechar licitação:', error);
      if (error.message === 'Esta licitação já está finalizada') {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: 'Erro interno ao fechar licitação. Por favor, tente novamente.' });
    }
  }

  async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validar status
      const statusValidos = ['Em Análise', 'Em Andamento', 'Finalizada', 'Cancelada'];
      if (!statusValidos.includes(status)) {
        return res.status(400).json({ 
          error: 'Status inválido. Os status permitidos são: ' + statusValidos.join(', ') 
        });
      }

      // Verifica se a licitação existe e não está finalizada
      const licitacaoAtual = await Licitacao.findByPk(id);
      
      if (!licitacaoAtual) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      if (licitacaoAtual.status === 'Finalizada') {
        return res.status(400).json({ error: 'Não é possível alterar o status de uma licitação finalizada' });
      }

      // Atualiza o status
      await licitacaoAtual.update({ status });
      
      // Busca a licitação atualizada com as informações do cliente
      const licitacaoAtualizada = await Licitacao.buscarPorId(id);

      res.json(licitacaoAtualizada);
    } catch (error) {
      console.error('Erro ao atualizar status da licitação:', error);
      res.status(500).json({ error: 'Erro ao atualizar status da licitação' });
    }
  }
}

module.exports = new LicitacaoController(); 