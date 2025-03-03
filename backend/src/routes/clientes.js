const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Listar todos os clientes
router.get('/', clienteController.listar);

// Buscar um cliente específico
router.get('/:id', clienteController.buscarPorId);

// Criar um novo cliente
router.post('/', clienteController.criar);

// Atualizar um cliente
router.put('/:id', clienteController.atualizar);

// Deletar um cliente
router.delete('/:id', clienteController.deletar);

module.exports = router; 