const express = require('express');
const clienteController = require('./controllers/clienteController');
const licitacaoController = require('./controllers/licitacaoController');
const prazoController = require('./controllers/PrazoController');

const router = express.Router();

// Rotas de clientes
router.post('/clientes', clienteController.criar);
router.get('/clientes', clienteController.listar);
router.get('/clientes/:id', clienteController.buscarPorId);
router.put('/clientes/:id', clienteController.atualizar);
router.delete('/clientes/:id', clienteController.excluir);

// Rotas de licitações
router.post('/licitacoes', licitacaoController.criar);
router.get('/licitacoes', licitacaoController.listar);
router.get('/licitacoes/:id', licitacaoController.buscarPorId);
router.put('/licitacoes/:id', licitacaoController.atualizar);
router.put('/licitacoes/:id/fechamento', licitacaoController.fecharLicitacao);
router.delete('/licitacoes/:id', licitacaoController.excluir);

// Rotas de prazos
router.get('/prazos', prazoController.index);
router.post('/prazos', prazoController.store);
router.put('/prazos/:id', prazoController.update);
router.delete('/prazos/:id', prazoController.destroy);

module.exports = router; 