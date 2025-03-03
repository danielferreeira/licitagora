const express = require('express');
const clienteController = require('./controllers/clienteController');
const licitacaoController = require('./controllers/licitacaoController');

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
router.delete('/licitacoes/:id', licitacaoController.excluir);

module.exports = router; 