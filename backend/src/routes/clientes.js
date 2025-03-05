const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// GET - Listar todos os clientes com filtros opcionais
router.get('/', clienteController.listar);

// GET - Buscar um cliente específico
router.get('/:id', clienteController.buscarPorId);

// POST - Criar novo cliente
router.post('/', clienteController.criar);

// PUT - Atualizar cliente
router.put('/:id', clienteController.atualizar);

// DELETE - Remover cliente
router.delete('/:id', clienteController.excluir);

module.exports = router; 