const express = require('express');
const router = express.Router();
const prazoController = require('../controllers/PrazoController');

router.get('/', prazoController.index);
router.post('/', prazoController.store);
router.put('/:id', prazoController.update);
router.delete('/:id', prazoController.destroy);
router.post('/importar', prazoController.importarPrazosLicitacoes);

module.exports = router; 