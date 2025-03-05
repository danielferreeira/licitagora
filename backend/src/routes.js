const express = require('express');
const router = express.Router();

// Importar rotas específicas
const clientesRoutes = require('./routes/clientes');
const licitacoesRoutes = require('./routes/licitacoes');
const documentosRoutes = require('./routes/documentos');
const prazosRoutes = require('./routes/prazos');

// Usar as rotas
router.use('/clientes', clientesRoutes);
router.use('/licitacoes', licitacoesRoutes);
router.use('/documentos', documentosRoutes);
router.use('/prazos', prazosRoutes);

module.exports = router; 