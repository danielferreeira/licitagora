const Licitacao = require('../models/Licitacao');

const validarCamposLicitacao = (dados) => {
  const erros = [];

  if (!dados.numero) erros.push('Número é obrigatório');
  if (!dados.orgao) erros.push('Órgão é obrigatório');
  if (!dados.objeto) erros.push('Objeto é obrigatório');
  if (!dados.data_abertura) erros.push('Data de abertura é obrigatória');
  if (!dados.valor_estimado) erros.push('Valor estimado é obrigatório');
  if (!dados.modalidade) erros.push('Modalidade é obrigatória');
  if (!dados.ramos_atividade || !Array.isArray(dados.ramos_atividade) || dados.ramos_atividade.length === 0) {
    erros.push('Pelo menos um ramo de atividade deve ser selecionado');
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

      const licitacao = await Licitacao.criar(req.body);
      res.status(201).json(licitacao);
    } catch (error) {
      console.error('Erro ao criar licitação:', error);
      res.status(500).json({ error: 'Erro ao criar licitação' });
    }
  }

  async listar(req, res) {
    try {
      const filtros = {
        cliente_id: req.query.cliente_id,
        status: req.query.status,
        ramo_atividade: req.query.ramo_atividade,
        data_inicio: req.query.data_inicio,
        data_fim: req.query.data_fim,
        modalidade: req.query.modalidade
      };

      const licitacoes = await Licitacao.listar(filtros);
      res.json(licitacoes);
    } catch (error) {
      console.error('Erro ao listar licitações:', error);
      res.status(500).json({ error: 'Erro ao listar licitações' });
    }
  }

  async buscarPorId(req, res) {
    try {
      const { id } = req.params;
      const licitacao = await Licitacao.buscarPorId(id);

      if (!licitacao) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      res.json(licitacao);
    } catch (error) {
      console.error('Erro ao buscar licitação:', error);
      res.status(500).json({ error: 'Erro ao buscar licitação' });
    }
  }

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const erros = validarCamposLicitacao(req.body);
      if (erros.length > 0) {
        return res.status(400).json({ error: erros.join(', ') });
      }

      const licitacao = await Licitacao.atualizar(id, req.body);
      if (!licitacao) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      res.json(licitacao);
    } catch (error) {
      console.error('Erro ao atualizar licitação:', error);
      res.status(500).json({ error: 'Erro ao atualizar licitação' });
    }
  }

  async excluir(req, res) {
    try {
      const { id } = req.params;
      const licitacao = await Licitacao.excluir(id);

      if (!licitacao) {
        return res.status(404).json({ error: 'Licitação não encontrada' });
      }

      res.json({ message: 'Licitação excluída com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir licitação:', error);
      res.status(500).json({ error: 'Erro ao excluir licitação' });
    }
  }
}

module.exports = new LicitacaoController(); 