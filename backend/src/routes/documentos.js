const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documentoController');

// Rotas para documentos do cliente
router.get('/tipos', documentoController.listarTiposDocumentosCliente);
router.get('/cliente/:clienteId', documentoController.listarDocumentosCliente);
router.post('/cliente', documentoController.uploadDocumentoCliente);
router.delete('/cliente/:id', documentoController.excluirDocumentoCliente);

// Rotas para documentos da licitação
router.get('/licitacao/:licitacaoId', documentoController.listarDocumentosLicitacao);
router.post('/licitacao', documentoController.uploadDocumentoLicitacao);
router.delete('/licitacao/:id', documentoController.excluirDocumentoLicitacao);

// Rotas para requisitos de documentação
router.get('/requisitos/:licitacaoId', documentoController.listarRequisitosDocumentacao);
router.post('/requisitos/:licitacaoId', documentoController.criarRequisitoDocumentacao);
router.put('/requisitos/:id', documentoController.atualizarRequisitoDocumentacao);
router.delete('/requisitos/:id', documentoController.excluirRequisitoDocumentacao);

module.exports = router; 