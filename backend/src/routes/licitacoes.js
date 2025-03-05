const express = require('express');
const router = express.Router();
const LicitacaoController = require('../controllers/licitacaoController');

// GET - Listar todas as licitações com filtros opcionais
router.get('/', LicitacaoController.listar);

// GET - Buscar uma licitação específica
router.get('/:id', LicitacaoController.buscarPorId);

// POST - Criar nova licitação
router.post('/', LicitacaoController.criar);

// PUT - Atualizar licitação
router.put('/:id', LicitacaoController.atualizar);

// PUT - Fechar licitação
router.put('/:id/fechamento', LicitacaoController.fecharLicitacao);

// PUT - Atualizar status da licitação
router.put('/:id/status', LicitacaoController.atualizarStatus);

// DELETE - Remover licitação
router.delete('/:id', LicitacaoController.excluir);

module.exports = router; 