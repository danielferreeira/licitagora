const express = require('express');
const router = express.Router();
const relatorioController = require('../controllers/relatorioController');

// Middleware para logging
router.use((req, res, next) => {
  console.log(`[Relatórios] ${req.method} ${req.url}`);
  next();
});

// Relatório de Licitações
router.get('/licitacoes', relatorioController.gerarRelatorioLicitacoes);

// Relatório de Clientes
router.get('/clientes', relatorioController.gerarRelatorioClientes);

// Relatório de Desempenho
router.get('/desempenho', relatorioController.gerarRelatorioDesempenho);

module.exports = router; 