const express = require('express');
const router = express.Router();

const clientesRoutes = require('./clientes');
const licitacoesRoutes = require('./licitacoes');
const documentosRoutes = require('./documentos');
const prazosRoutes = require('./prazos');
const relatoriosRoutes = require('./relatorios');

router.use('/clientes', clientesRoutes);
router.use('/licitacoes', licitacoesRoutes);
router.use('/documentos', documentosRoutes);
router.use('/prazos', prazosRoutes);
router.use('/relatorios', relatoriosRoutes);

module.exports = router; 